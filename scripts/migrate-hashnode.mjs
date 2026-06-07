// scripts/migrate-hashnode.mjs
//
// Pull every post from a Hashnode publication and write it as a Hugo page
// bundle under content/posts/<slug>/, downloading images locally and adding
// 301 redirects from the old Hashnode paths.
//
// Usage:
//   node scripts/migrate-hashnode.mjs [host]
//   node scripts/migrate-hashnode.mjs blog.warroyo.com
//
// Requires Node >= 20. No external dependencies (uses built-in fetch/fs).
// Re-runnable: existing post folders are overwritten, redirects are de-duped.

import { mkdir, writeFile, readFile, appendFile } from "node:fs/promises";
import path from "node:path";

const HOST = process.argv[2] || "blog.warroyo.com";
const API = "https://gql.hashnode.com/";
const ROOT = path.resolve(import.meta.dirname, "..");
const POSTS_DIR = path.join(ROOT, "content", "posts");
const REDIRECTS = path.join(ROOT, "static", "_redirects");

const QUERY = `query Posts($host: String!, $after: String) {
  publication(host: $host) {
    title
    posts(first: 20, after: $after) {
      pageInfo { hasNextPage endCursor }
      edges {
        node {
          title
          slug
          brief
          publishedAt
          updatedAt
          tags { name }
          coverImage { url }
          content { markdown }
        }
      }
    }
  }
}`;

async function gql(after) {
  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: QUERY, variables: { host: HOST, after } }),
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors, null, 2));
  const pub = json.data?.publication;
  if (!pub) throw new Error(`No publication found for host "${HOST}"`);
  return pub.posts;
}

async function fetchAllPosts() {
  let after = null;
  const all = [];
  do {
    const posts = await gql(after);
    all.push(...posts.edges.map((e) => e.node));
    after = posts.pageInfo.hasNextPage ? posts.pageInfo.endCursor : null;
  } while (after);
  return all;
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

const yamlEscape = (s) => String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"');

function frontMatter({ title, date, lastmod, summary, tags }) {
  const lines = ["---", `title: "${yamlEscape(title)}"`, `date: ${date}`];
  if (lastmod && lastmod !== date) lines.push(`lastmod: ${lastmod}`);
  lines.push("draft: false");
  if (summary) lines.push(`summary: "${yamlEscape(summary)}"`);
  if (tags?.length)
    lines.push(`tags: [${tags.map((t) => `"${yamlEscape(t)}"`).join(", ")}]`);
  lines.push("---");
  return lines.join("\n");
}

const IMG_MD = /!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g;

async function main() {
  console.log(`Fetching posts from ${HOST} ...`);
  const posts = await fetchAllPosts();
  console.log(`Found ${posts.length} posts.\n`);

  const redirects = [];

  for (const p of posts) {
    const dir = path.join(POSTS_DIR, p.slug);
    await mkdir(dir, { recursive: true });
    let md = p.content?.markdown || "";

    let cover = null;
    if (p.coverImage?.url) cover = await download(p.coverImage.url, dir, "featured");

    // Download in-body images once each and rewrite to relative paths.
    const urls = [...md.matchAll(IMG_MD)].map((m) => ({ full: m[0], alt: m[1], url: m[2] }));
    const seen = new Map();
    let n = 0;
    for (const r of urls) {
      let file = seen.get(r.url);
      if (!file) {
        file = await download(r.url, dir, `img-${++n}`);
        if (file) seen.set(r.url, file);
      }
      if (file) md = md.split(r.full).join(`![${r.alt}](${file})`);
    }

    const date = (p.publishedAt || "").slice(0, 10);
    const lastmod = (p.updatedAt || "").slice(0, 10);
    const tags = (p.tags || []).map((t) => t.name);
    const fm = frontMatter({ title: p.title, date, lastmod, summary: p.brief, tags });
    await writeFile(path.join(dir, "index.md"), `${fm}\n\n${md.trim()}\n`);

    console.log(`  ✓ ${p.slug}  (${seen.size} images${cover ? " + cover" : ""})`);
    redirects.push(`/${p.slug} /posts/${p.slug}/ 301`);
  }

  // Append redirects, skipping any already present.
  let existing = "";
  try { existing = await readFile(REDIRECTS, "utf8"); } catch {}
  const toAdd = redirects.filter((r) => !existing.includes(r.split(" ")[0] + " "));
  if (toAdd.length) {
    await appendFile(REDIRECTS, `\n# Hashnode migration redirects\n${toAdd.join("\n")}\n`);
    console.log(`\nAdded ${toAdd.length} redirect(s) to static/_redirects`);
  }

  console.log(`\nDone. Review locally with:  make preview`);
}

main().catch((e) => {
  console.error("\nMigration failed:", e.message);
  process.exit(1);
});
