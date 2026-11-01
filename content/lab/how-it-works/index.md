---
title: "How the lab works"
description: "An interactive map of the home lab: the agent host, the local model server, and how requests, metrics and reading picks move between them."
weight: 10
---

The lab has one agent host and one model server, plus the cloud services they
report to. Click a box to see what it runs. Pick a layer to see one kind of
traffic, or step through a request to the local model.

{{< bundle-asset "lab-map.css" >}}

<div class="lab-map" id="lab-map">
  <div class="lab-map__controls" role="toolbar" aria-label="Layers">
    <button type="button" data-layer="all" aria-pressed="true">Everything</button>
    <button type="button" data-layer="access" aria-pressed="false">Access</button>
    <button type="button" data-layer="inference" aria-pressed="false">Inference</button>
    <button type="button" data-layer="metrics" aria-pressed="false">Metrics</button>
    <button type="button" data-layer="curator" aria-pressed="false">Reading picks</button>
  </div>
  <div class="lab-map__canvas"></div>
  <div class="lab-map__tour">
    <button type="button" data-tour="prev" aria-label="Previous step">←</button>
    <button type="button" data-tour="start">Follow a request</button>
    <button type="button" data-tour="next" aria-label="Next step">→</button>
  </div>
  <div class="lab-map__detail" aria-live="polite"></div>
  <noscript>This map needs JavaScript. The sections below cover the same ground.</noscript>
</div>

{{< bundle-asset "lab-map.js" >}}

## The pieces

**Agent host.** An Ubuntu desktop that runs every agent: Claude Code and Codex
for coding, and Hermes on the local model for jobs that read a lot and write
little. I reach it over Tailscale from a laptop or phone and keep sessions in
herdr, so a session started at the desk carries on from the phone.

**Model server.** A Strix Halo box with 128 GB of unified memory, serving
Qwen models and nothing else. It has no internet access. llama-swap sits in
front and starts whichever engine a request names: Gufo for the big model,
llama.cpp for the smaller ones and embeddings.

**LiteLLM.** One OpenAI-compatible endpoint on the agent host. Each client
gets its own key, so token use is tracked per client. It holds local models
only, so a local request never falls back to a cloud model.

**Metrics.** Grafana Alloy on the agent host scrapes both machines and ships
the metrics to Grafana Cloud. The model server is scraped over the tailnet,
which keeps it off the internet.

**Reading picks.** A content curator collects feeds and podcasts each night,
scores them with the local model while the server is idle, and publishes a
short list to Raindrop.
