# warroyo-blog

Personal blog built with [Hugo](https://gohugo.io/) and the
[Blowfish](https://blowfish.page/) theme, deployed on
[Cloudflare Pages](https://pages.cloudflare.com/).

## Prerequisites

- **Hugo extended** ≥ 0.158.0 (built with 0.161.1; Blowfish v2.103.0 supports up to 0.161.1)
- **Go** ≥ 1.24 (Blowfish is installed as a Hugo Module)

## Local development

```bash
hugo server -D        # live-reload server with drafts at http://localhost:1313
```

Build the production site into `public/`:

```bash
hugo --gc --minify
```

## Writing posts

Create a new post:

```bash
hugo new posts/my-post/index.md
```

Posts live under `content/posts/<slug>/index.md`. Place images alongside the
`index.md` (page bundle) and reference them relatively. Set `draft: false`
when ready to publish.

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
