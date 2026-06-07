# warroyo-blog

Personal blog built with [Hugo](https://gohugo.io/) and the
[Blowfish](https://blowfish.page/) theme, deployed on
[Cloudflare Pages](https://pages.cloudflare.com/).

## Prerequisites

- **Hugo extended** ≥ 0.158.0 (built with 0.161.1; Blowfish v2.103.0 supports up to 0.161.1)
- **Go** ≥ 1.24 (Blowfish is installed as a Hugo Module)

## Local development

Common tasks are wrapped in a `Makefile` (run `make` or `make help` to list them):

```bash
make preview   # live-reload server with drafts + future posts → localhost:1313
make serve     # live-reload server, published content only (production-like)
make build     # production build into ./public
make check     # clean production build as a smoke test (fails on warnings)
make new SLUG=my-post-title   # scaffold content/posts/my-post-title/index.md
make clean     # remove build artifacts
```

Prefer raw Hugo? The equivalents are `hugo server -D`, `hugo --gc --minify`, etc.

## Writing posts

```bash
make new SLUG=my-post-title
```

Posts live under `content/posts/<slug>/index.md`. Place images alongside the
`index.md` (page bundle) and reference them relatively. Set `draft: false`
when ready to publish.

## Content workflow

Three layers, from fastest/most-private to closest-to-production:

1. **Local preview** — `make preview` renders drafts and future-dated posts with
   live reload. This is where most writing and proofing happens; nothing leaves
   your machine.
2. **Cloudflare preview deployment** — every branch and pull request gets its own
   unique preview URL, built exactly like production but isolated from the live
   site. Use it to review on real devices and share for feedback before release.
3. **Production** — only what's on the production branch (`main`).

Recommended flow for a new post:

```bash
git checkout -b post/my-article
make new SLUG=my-article          # starts as draft: true
make preview                      # write + proof locally
git push -u origin post/my-article  # → Cloudflare preview URL to review/share
# when happy: set draft: false, open a PR, merge to main → live
```

This keeps `main` always-publishable; nothing reaches the public site until merge.

**Draft & scheduling behavior**

- Production builds (`make build` / Cloudflare) **skip** `draft: true` posts, so
  unfinished work never publishes even if it lands on `main`.
- Future-dated posts are also skipped until their `date` passes — write ahead and
  merge whenever.
- To make drafts visible on **Cloudflare preview deployments only** (but never in
  production), set `HUGO_BUILDDRAFTS=true` in the Pages **Preview** environment
  variables. Add `HUGO_BUILDFUTURE=true` there too if you want scheduled posts to
  show on previews.

## Updating the theme

Blowfish is a Hugo Module. Update it with:

```bash
hugo mod get -u github.com/nunocoracao/blowfish/v2
hugo mod tidy
```

## Configuration

Site config lives in `config/_default/`:

- `hugo.toml` — core site settings, taxonomies, outputs
- `params.toml` — Blowfish theme options (homepage layout, article display, etc.)
- `languages.en.toml` — author profile, site title/description
- `menus.en.toml` — header and footer navigation
- `markup.toml` — Goldmark / highlighting (required by the theme)
- `module.toml` — Blowfish module import

## Deploying to Cloudflare Pages (Git integration)

1. Push this repo to GitHub.
2. In the Cloudflare dashboard: **Workers & Pages → Create → Pages →
   Connect to Git**, and select this repository.
3. Build settings:
   - **Framework preset:** Hugo
   - **Build command:** `hugo --gc --minify`
   - **Build output directory:** `public`
4. Environment variables (Settings → Environment variables — set for both
   **Production** and **Preview**):
   - `HUGO_VERSION` = `0.161.1`
   - `GO_VERSION` = `1.24` _(required — Blowfish builds via Hugo Modules)_
   - `HUGO_ENVIRONMENT` = `production`
   - `HUGO_ENV` = `production`
5. Save and deploy. Cloudflare rebuilds on every push; pull requests get
   preview deployments.

After adding a custom domain in Cloudflare, update `baseURL` in
`config/_default/hugo.toml` to match.

The `static/_headers` and `static/_redirects` files are picked up
automatically by Cloudflare Pages.

## Migrating from Hashnode

See [`MIGRATION.md`](./MIGRATION.md).
