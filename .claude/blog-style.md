# Writing for this blog

Reference for `/post-scaffold` and `/post-ship`. Everything here is derived from
the posts already in `content/posts/` — when in doubt, go read two of them
rather than guessing.

## The dictation rule

This is the most important rule in this file, and the one most easily broken by
being helpful.

Posts here are drafted as an outline with `<!-- TODO: … -->` stubs where the
prose belongs. The author fills those stubs **by speaking** — usually from a
phone, through Remote Control. When that happens:

> Place the author's words in that stub **as they arrive**. Do **not** rewrite
> phrasing. Do **not** add sentences they did not say. Do **not** smooth,
> tighten, or elevate the voice. If a sentence is unclear, ask what they meant
> rather than repairing it.

**Assume the text has already been cleaned.** The author dictates through Wispr
Flow, which strips filler, punctuates, and fixes homophones before a single word
reaches this session. What lands in the stub is finished prose, not a raw
transcript.

That makes editing it worse, not better. Two cleanup passes over the same
sentence is how a voice gets sanded off — Wispr takes out the "um", and a second
pass here takes out everything that made it sound like a person. If a sentence
reads a little loose or starts with "So", that is the author's cadence surviving,
not an artifact to repair.

The only things still worth fixing without asking are ones Wispr cannot catch
because they need context it does not have: a technical term transcribed as a
plausible English word (`VKS` as `VCS`, `Pinniped` as `pinny ped`,
`extraAuthentication` split into two words), or an identifier that should have
been in a code span. Fix the term, leave the sentence around it alone. Anything
beyond that is a question, not an edit.

The point of the whole workflow is that the writing is theirs. An agent-written
paragraph that reads well is a worse outcome than a rough one that sounds like
them.

Never write prose into a stub speculatively "to get started". An empty stub is a
clear instruction; a filled one is something they now have to notice and delete.

## Voice

First person, conversational, contractions. The author is writing as someone who
hit this problem at work and is telling you what they found.

Posts open with **two or three paragraphs of context and no heading** — what the
thing is, why they cared, what was annoying about it — and close that opening
with a sentence stating what the post covers. Real examples:

> "In this article, we will walk through a solution to the problem mentioned
> above so that we can associate different external IPs with specific workloads
> running in TKG clusters."

> "The rest of this post walks through setting up this integration."

Other recurring habits worth preserving:

- Products get expanded on first use with the short form in parens — "VCF
  Automation(VCFA)", "Tanzu Mission Control(TMC)". Note there is usually no space
  before the paren.
- Heavy inline linking to **official docs** — Broadcom techdocs, project sites,
  GitHub — on first mention of anything a reader might not know.
- Motivation is often framed as coming from real work: "I was working with a
  customer the other day", "A question comes up often of", "I recently came
  across a feature".
- Honest about scope: "I am not going to go into detail on how to set up X in
  this post, but here are the official docs."

## Structure

```
(opening context, no heading)
## How it works          — optional; the concept before the steps
## Architecture          — usually one diagram image
## Implementation
### <step group>
1. numbered steps, screenshots between them
## Wrapping up           — optional
```

Use `##` for top-level sections. Some older posts use `#`; the newer ones use
`##` and that is the pattern to follow.

## Front matter

`hugo new` (via `make new`) does not produce the right front matter — there is
no `archetypes/` directory, so it emits Hugo's default and omits `summary` and
`tags` entirely. Write it explicitly:

```yaml
---
title: "Integrating ArgoCD authentication with VCF Automation"
date: 2026-03-16T23:33:30.985Z
draft: false
summary: "integrating ArgoCD OIDC auth with VCF Automation"
tags: ["kubernetes", "vmware", "oidc", "vcf", "argocd", "vcf9"]
---
```

- `summary` — one lowercase-ish phrase, not a full marketing sentence. Required;
  it is what shows on the post list.
- `tags` — lowercase, hyphenated. **Reuse the existing vocabulary** rather than
  inventing near-duplicates. In use today: `kubernetes`, `k8s`, `vmware`,
  `tanzu`, `vcf`, `vcf9`, `vsphere`, `tkg`, `tmc`, `cns`, `cloud-native`,
  `oidc`, `argocd`, `nsx`, `antrea`, `vault`, `openbao`, `external-secrets`,
  `azure`, `azure-devops`. Check a few posts before adding a new one.
- `draft: false` on a post branch is deliberate — see below.

## Images and media

Posts are page bundles: `content/posts/<slug>/index.md` with the images beside
it, referenced relatively.

- `![](img-1.png)` — plain relative reference, usually no alt text in existing
  posts
- `featured.png` / `featured.jpeg` / `featured.jpg` — the card image, picked up
  by Blowfish automatically
- Video uses the Blowfish shortcode, not raw HTML:
  ```
  {{< video src="img-1.mp4" autoplay=true loop=true muted=true controls=true ratio="860/360" >}}
  ```

Screenshots go **after** the numbered step they illustrate.

## Code blocks

Always fenced with a language. Two conventions worth keeping:

- Mark every value the reader must change with a trailing `##UPDATE THIS`:
  ```yaml
  clientID: 4060b628-c297-49d3-ae0f-31cdcfb9ce86 ##UPDATE THIS
  ```
- Commands and manifests lifted from the dev log are copied **verbatim** into the
  brief and verbatim again into the post. They are the reusable part and the
  reason the log exists. Do not reformat, re-indent, or "improve" them.

## Preview and publishing

`hugo` and `go` are not installed on the server, so there is no local
`make preview` there. The proofing surface is Cloudflare's branch deployment.

Cloudflare reports to GitHub as a **check run** named `Cloudflare Pages` — not a
commit status, not a GitHub Action, so `/commits/<sha>/status` and the
`deployments` API are both empty and misleading. The URL is in
`output.summary`:

```bash
gh api "repos/warroyo/warroyo-blog/commits/$(git rev-parse HEAD)/check-runs" \
  --jq '.check_runs[]|select(.name=="Cloudflare Pages")|.output.summary' \
  | grep -oE 'https://[a-z0-9.-]+\.pages\.dev'
```

- **branch alias** — `https://post-<slug>.warroyo-blog.pages.dev`, stable for the
  life of the branch. This is the one to hand the author; it survives every push,
  so they can keep it open while dictating.
- **per-deployment** — `https://<hash>.warroyo-blog.pages.dev`, new every push.
  Useful for pointing at one specific commit.

Branch names map to the alias by replacing `/` with `-`, so `post/my-slug`
becomes `post-my-slug`.

`draft: false` on the branch is what makes the post render on that preview
without `HUGO_BUILDDRAFTS` being set in the Pages Preview environment. It is
safe: production builds only from `main`, so nothing publishes until the PR
merges.
