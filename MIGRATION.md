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

## 5. Automated migration scripts

There are two importers depending on where your content comes from.

### 5a. From a GitHub backup (recommended) — `import-hashnode-backup.mjs`

> **As of May 2026, Hashnode's GraphQL API requires a paid Pro plan** for every
> request, including reading published posts. The free path is the **GitHub
> backup** integration (Settings → Integrations → GitHub), which commits each
> post as a Markdown file (named by `cuid`, with Hashnode front matter) to a repo.

[`scripts/import-hashnode-backup.mjs`](./scripts/import-hashnode-backup.mjs)
reads a local clone of that backup directory and writes
`content/posts/<slug>/index.md` with converted front matter, downloads the cover
(as `featured.*`) and in-body images into each post folder, rewrites image links
to relative paths (stripping Hashnode's `align="..."` attribute), and appends
`301` redirects to `static/_redirects`. The `about-me` page is skipped (it's a
page, not a post — fold it into `content/about/` by hand).

```bash
git clone https://github.com/<you>/hashnode-backups.git ../hashnode-backups
node scripts/import-hashnode-backup.mjs ../hashnode-backups
make preview   # review the imported posts locally
```

Requires Node >= 20 (no external dependencies) and outbound access to
`cdn.hashnode.com` for image downloads. Re-runnable: post folders are
overwritten and redirects are de-duplicated, so re-run it whenever the backup
picks up new posts.

### 5b. From the GraphQL API (Pro only) — `migrate-hashnode.mjs`

[`scripts/migrate-hashnode.mjs`](./scripts/migrate-hashnode.mjs) does the same
thing directly against Hashnode's public GraphQL API. **It now only works if the
publication is on a Pro plan** (see the note above).

```bash
node scripts/migrate-hashnode.mjs blog.warroyo.com
```

> **Note:** must be run from an environment with outbound access to
> `gql.hashnode.com` and `cdn.hashnode.com`. The Claude Code web sandbox may
> block these depending on the environment's network policy
> ([docs](https://code.claude.com/docs/en/claude-code-on-the-web)).
