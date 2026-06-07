# Migrating from Hashnode to Hugo

This is the follow-up plan for bringing existing Hashnode content into this
Hugo site. Nothing here is required for the site to build — the scaffold works
on its own.

## 1. Export your content from Hashnode

Pick one:

- **GitHub backup (recommended):** In Hashnode dashboard → **Settings →
  Integrations → GitHub**, enable the backup integration. Hashnode writes each
  post as Markdown to a repo. This stays in sync going forward.
- **Manual export:** Hashnode dashboard → **Settings → Export** to download a
  Markdown/JSON archive.

## 2. Convert front matter

Hashnode and Hugo both use Markdown, but the front matter differs. Map fields:

| Hashnode            | Hugo                         |
| ------------------- | ---------------------------- |
| `title`             | `title`                      |
| `datePublished`     | `date`                       |
| `slug`              | folder name / `slug`         |
| `tags`              | `tags` (array)               |
| `cover` / `coverImage` | `featureImage` (or page-bundle image named `featured.*`) |
| `subtitle`/`brief`  | `summary`                    |

Target layout — one folder per post (page bundle):

```
content/posts/<slug>/
  index.md          # converted front matter + body
  featured.jpg      # cover image (optional, auto-detected by Blowfish)
  <other images>
```

Example converted front matter:

```yaml
---
title: "My Post Title"
date: 2025-01-15
draft: false
summary: "One-line summary."
tags: ["kubernetes", "go"]
---
```

## 3. Images

Download Hashnode-hosted images (CDN URLs) into each post's folder and rewrite
the Markdown links to relative paths so the site is self-contained. A small
Node/Python script can crawl each post for `https://cdn.hashnode.com/...` URLs,
download them, and rewrite references.

## 4. Preserve old URLs (SEO)

Add `301` redirects from old Hashnode paths to the new ones in
`static/_redirects`:

```
/old-hashnode-slug   /posts/new-slug/   301
```

## 5. Optional conversion script

When the export is available, drop a `scripts/convert-hashnode.mjs` Node script
that:

1. Reads each exported Markdown file.
2. Parses + rewrites front matter per the table above.
3. Downloads images and rewrites links.
4. Writes `content/posts/<slug>/index.md`.

Run it once, review the output with `hugo server -D`, then commit.
