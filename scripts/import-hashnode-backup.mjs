// scripts/import-hashnode-backup.mjs
//
// Convert a Hashnode GitHub-backup directory (one Markdown file per post, named
// by cuid, with Hashnode YAML front matter) into Hugo page bundles under
// content/posts/<slug>/, downloading cover + in-body images locally, rewriting
// image links to relative paths, and adding 301 redirects from the old slugs.
//
// Why this exists: Hashnode's public GraphQL API moved to a paid (Pro) plan in
// May 2026, so scripts/migrate-hashnode.mjs (which hits that API) no longer works
// for free. The GitHub backup integration is free and produces these files.
//
// Usage:
//   node scripts/import-hashnode-backup.mjs <backup-dir>
//   node scripts/import-hashnode-backup.mjs ../hashnode-backups
//
// Requires Node >= 20. No external dependencies (built-in fetch/fs).
// Re-runnable: existing post folders are overwritten, redirects are de-duped.
// Idempotent enough to re-run after the backup picks up new posts.

import { mkdir, writeFile, readFile, appendFile, readdir } from "node:fs/promises";
import path from "node:path";

const BACKUP_DIR = path.resolve(process.argv[2] || "../hashnode-backups");
const ROOT = path.resolve(import.meta.dirname, "..");
const POSTS_DIR = path.join(ROOT, "content", "posts");
const REDIRECTS = path.join(ROOT, "static", "_redirects");

// Slugs that are pages rather than blog posts; skipped so they don't land in
// content/posts/. Handle these by hand (e.g. fold into content/about/).
const SKIP_SLUGS = new Set(["about-me"]);

// Hashnode embeds image alignment as an attribute inside the link target, e.g.
//   ![alt](https://cdn.hashnode.com/.../x.png align="center")
// Capture the URL and ignore any trailing space-separated attributes.
const IMG_MD = /!\[([^\]]*)\]\(\s*(https?:\/\/[^\s)]+)(?:\s+[^)]*)?\)/g;

const yamlEscape = (s) => String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"');

// Minimal front-matter parser for the flat key: value shape Hashnode emits.
function parseFrontMatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return null;
  const fm = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!kv) continue;
    let v = kv[2].trim();
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
    fm[kv[1]] = v;
  }
  return { fm, body: raw.slice(m[0].length) };
}

async function download(url, destDir, baseName) {
  const res = await fetch(url);
  if (!res.ok) {
    console.warn(`    ! image ${res.status}: ${url}`);
    return null;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  let ext = path.extname(new URL(url).pathname).split("?")[0];
  if (!ext) {
    const ct = res.headers.get("content-type") || "";
    ext = ct.includes("png") ? ".png"
      : ct.includes("gif") ? ".gif"
      : ct.includes("webp") ? ".webp"
      : ct.includes("svg") ? ".svg"
      : ".jpg";
  }
  const file = `${baseName}${ext}`;
  await writeFile(path.join(destDir, file), buf);
  return file;
}

function frontMatter({ title, date, summary, tags }) {
  const lines = ["---", `title: "${yamlEscape(title)}"`, `date: ${date}`, "draft: false"];
  if (summary) lines.push(`summary: "${yamlEscape(summary)}"`);
  if (tags?.length)
    lines.push(`tags: [${tags.map((t) => `"${yamlEscape(t)}"`).join(", ")}]`);
  lines.push("---");
  return lines.join("\n");
}

async function main() {
  console.log(`Reading backup from ${BACKUP_DIR} ...`);
  const files = (await readdir(BACKUP_DIR))
    .filter((f) => f.endsWith(".md") && f.toLowerCase() !== "readme.md");

  const redirects = [];
  let imported = 0;

  for (const f of files) {
    const raw = await readFile(path.join(BACKUP_DIR, f), "utf8");
    const parsed = parseFrontMatter(raw);
    if (!parsed?.fm.slug) {
      console.warn(`  - skip ${f} (no front matter / slug)`);
      continue;
    }
    const { fm } = parsed;
    if (SKIP_SLUGS.has(fm.slug)) {
      console.log(`  - skip ${fm.slug} (page, not a post)`);
      continue;
    }

    const dir = path.join(POSTS_DIR, fm.slug);
    await mkdir(dir, { recursive: true });
    let md = parsed.body;

    let cover = null;
    if (fm.cover) cover = await download(fm.cover, dir, "featured");

    // Download each unique in-body image once and rewrite to a relative path,
    // dropping Hashnode's trailing align="..." attribute.
    const matches = [...md.matchAll(IMG_MD)].map((m) => ({ full: m[0], alt: m[1], url: m[2] }));
    const seen = new Map();
    let n = 0;
    for (const r of matches) {
      let file = seen.get(r.url);
      if (!file) {
        file = await download(r.url, dir, `img-${++n}`);
        if (file) seen.set(r.url, file);
      }
      if (file) md = md.split(r.full).join(`![${r.alt}](${file})`);
    }

    const tags = (fm.tags || "").split(",").map((t) => t.trim()).filter(Boolean);
    const out = frontMatter({
      title: fm.title || fm.slug,
      date: fm.datePublished || "",
      summary: fm.seoDescription || "",
      tags,
    });
    await writeFile(path.join(dir, "index.md"), `${out}\n\n${md.trim()}\n`);

    imported++;
    console.log(`  ✓ ${fm.slug}  (${seen.size} images${cover ? " + cover" : ""})`);
    redirects.push(`/${fm.slug} /posts/${fm.slug}/ 301`);
  }

  // Append redirects, skipping any already present.
  let existing = "";
  try { existing = await readFile(REDIRECTS, "utf8"); } catch {}
  const toAdd = redirects.filter((r) => !existing.includes(r.split(" ")[0] + " "));
  if (toAdd.length) {
    await appendFile(REDIRECTS, `\n# Hashnode migration redirects\n${toAdd.join("\n")}\n`);
    console.log(`\nAdded ${toAdd.length} redirect(s) to static/_redirects`);
  }

  console.log(`\nImported ${imported} post(s). Review locally with:  make preview`);
}

main().catch((e) => {
  console.error("\nImport failed:", e.message);
  process.exit(1);
});
