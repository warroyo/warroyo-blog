---
description: Scaffold a post branch from an approved brief — structure only, no prose
argument-hint: <slug> [path to brief]
---

Turn an approved brief into a post branch with a live preview URL. Run from the
root of this repo.

**Read `.claude/blog-style.md` first.** It carries the front matter rules, the
image and code-block conventions, and the dictation rule that governs everything
after this command finishes.

**You do not write prose.** Headings, code, tables, image placeholders, and TODO
stubs — nothing else. Not an intro paragraph, not a one-line lead-in under a
heading, not a "coming soon". The author dictates the prose afterwards, and
every sentence you invent is one they have to find and delete.

## Finding the brief

1. If `$ARGUMENTS` has a second word, treat it as the path to the brief.
2. Otherwise look for `$DEV_LOG_PITCHES/<slug>.md`.
3. If `DEV_LOG_PITCHES` is unset or the file is missing — normal in a Claude
   Code web session, where the private log is not on disk — ask the author to
   paste the brief. Do not go looking for it elsewhere, and do not proceed
   without one.

Check the brief's front matter says `status: pitched`. If it says `draft`, its
redaction list was never fully approved: **stop and say so.** That approval is
the only thing standing between the private log and a public repo.

## Steps

1. Confirm the working tree is clean, then branch from an up-to-date `main`:
   ```bash
   git checkout main && git pull --ff-only
   git checkout -b post/<slug>
   ```
2. Create the page bundle at `content/posts/<slug>/index.md`.

   Use `make new SLUG=<slug>` **only if `hugo` is on PATH.** It usually is not —
   neither Hugo nor Go is installed on the server, and `make new` is just
   `hugo new`. When it is absent, create the directory and file directly. Do not
   install Hugo to get past this and do not treat it as an error.

   Nothing is lost either way: `make new` emits Hugo's *default* archetype
   (there is no `archetypes/` in this repo), which has no `summary` and no
   `tags`, and step 3 replaces all of it regardless.
3. Write the front matter from the brief — `title`, `summary`, `tags`, `date`
   set to now, and `draft: false` (see `blog-style.md` for why that is correct
   on a branch). All four are required; `summary` and `tags` are exactly what
   the default archetype would have omitted.
4. Lay out the body from the brief's outline:
   - every heading, in order, at the levels `blog-style.md` describes
   - every code block, **verbatim** from the brief — do not reformat or re-indent
   - every table, verbatim
   - `![](img-N.png)` placeholders where the brief lists a figure, numbered in
     the order they appear
   - under each heading, a single `<!-- TODO: … -->` naming what that section has
     to say, phrased as a prompt the author can answer out loud. Good:
     `<!-- TODO: why 403 vs 401 is the giveaway, and why chasing it in RBAC is a
     dead end -->`. Bad: `<!-- TODO: write intro -->`.
   - a `<!-- TODO: … -->` at the top for the opening context, and one note
     listing any figures the brief says do not exist yet
5. Commit and push:
   ```bash
   git add content/posts/<slug>
   git commit -m "Scaffold post: <title>"
   git push -u origin post/<slug>
   ```
6. Wait for Cloudflare's `Cloudflare Pages` check run to finish, then report the
   **branch alias** preview URL — the stable one that survives every push. The
   command is in `blog-style.md`. Poll a few times; the build takes a minute or
   two. If it has not finished, give the author the predictable alias
   (`https://post-<slug>.warroyo-blog.pages.dev`) and say the build is still
   running rather than waiting indefinitely.
7. If the brief file is writable, set its `status: scaffolded`. If it is not
   reachable, skip this silently — it is bookkeeping, not a failure.
8. Tell the author: the branch, the preview URL, and how many TODO stubs are
   waiting. Then stop. Filling them is the next, spoken, step.
