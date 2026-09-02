---
description: Pre-flight a finished post and open the PR
argument-hint: <slug> [path to brief]
---

Check a finished post branch and open the pull request. Run from the root of
this repo, on the `post/<slug>` branch.

Find the brief the same way `/post-scaffold` does: second word of `$ARGUMENTS`,
else `$DEV_LOG_PITCHES/<slug>.md`, else ask for it to be pasted.

## Checks

Run all of them and report everything before opening anything. If any check
fails, say what failed and stop — do not open the PR and do not fix things
silently.

1. **Leak re-scan.** Take the brief's Redactions section and grep the branch
   diff for every original value that was supposed to be replaced:
   ```bash
   git diff main...HEAD
   ```
   This is not redundant with `/post-brief`. The prose was **dictated** after the
   brief was approved, and a spoken paragraph can easily reintroduce a real
   cluster name, hostname, or customer. Also scan independently for anything
   that looks like a credential, token, private key, or internal URL, whether or
   not the brief mentioned it — the earlier list is a floor, not a ceiling.
2. **No stubs left.** No `<!-- TODO` remains anywhere in the post. If any do,
   list them and stop; a half-written post must not reach a PR.
3. **Front matter.** `title`, `date`, `summary` and `tags` all present and
   non-empty, and `draft: false`. Tags reuse the existing vocabulary — see
   `.claude/blog-style.md`.
4. **Images resolve.** Every relative image and video reference in `index.md`
   exists in the page bundle, and every file in the bundle is referenced by
   something. Report orphans in both directions — a `![](img-4.png)` with no
   file breaks the post, and an unreferenced screenshot usually means a figure
   was forgotten. Check `featured.*` exists.
5. **Build.** If `hugo` is on PATH, run `make check` — a clean production build
   that fails on warnings. If it is not installed (the usual case on the
   server), say so plainly rather than implying the post was built.
6. **Preview.** Confirm the latest `Cloudflare Pages` check run for `HEAD`
   concluded successfully, and report its per-deployment URL so the exact commit
   in the PR can be looked at.

## Opening the PR

Only once every check has passed:

```bash
gh pr create --base main --title "<post title>" --body "..."
```

Body: one line on what the post covers, the preview URL, and a short checklist
of what was verified. Do **not** merge — merging is publishing, and that is the
author's call.

Report the PR URL, then set the brief's `status: shipped` if it is reachable.
Mention that merging to `main` is what puts it live.
