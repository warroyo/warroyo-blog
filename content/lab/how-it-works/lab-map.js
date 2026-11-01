// Interactive lab map for content/lab/how-it-works. Draws an SVG from the data
// below and picks a wide or a narrow layout for the width it has. Click a box for
// its details, pick a layer to light one kind of traffic, or step through a
// request with the tour buttons.
(function () {
  "use strict";

  const root = document.getElementById("lab-map");
  if (!root) return;

  const SVG = "http://www.w3.org/2000/svg";

  // Each node has a top-left position per layout. Wide: four columns (three on
  // the hosts, one for services outside the lab). Narrow: two columns.
  const NODES = {
    laptop: {
      title: "Laptop", sub: "MacBook Air", kind: "client",
      wide: [420, 20], narrow: [20, 10],
      text: "Where I usually sit. It reaches the agent host over Tailscale SSH.",
      items: [
        "Sessions live in herdr on the agent host, so work started here carries on from the phone.",
        "If Tailscale is down, SSH with keys over the home LAN still works.",
      ],
    },
    phone: {
      title: "Phone", sub: "Termius · Telegram", kind: "client",
      wide: [230, 20], narrow: [190, 10],
      text: "Remote access to the same sessions, plus chat with the agents.",
      items: [
        "Termius and Mosh into herdr over the tailnet.",
        "Telegram to talk to Hermes, and to Claude Code through a small bot.",
        "Grafana Cloud dashboards, which need no tailnet.",
      ],
    },
    telegram: {
      title: "Telegram", sub: "chat bots", kind: "cloud",
      wide: [40, 20], narrow: [190, 600],
      text: "Hermes has its own bot, and approvals arrive as messages I can tap.",
      items: ["A second bot forwards messages to Claude Code on the agent host."],
    },
    agents: {
      title: "Coding agents", sub: "Claude Code · Codex", kind: "host",
      wide: [420, 130], narrow: [20, 110],
      text: "Claude Code writes code and runs the show; Codex reviews and takes some of the coding.",
      items: [
        "Both run as me on the agent host, in herdr sessions.",
        "They can read the other lab machines but cannot change them by hand.",
        "Every change to the lab is code: Ansible or a provisioning script, merged through a PR.",
      ],
    },
    hermes: {
      title: "Hermes", sub: "local-model agent", kind: "host",
      wide: [230, 130], narrow: [190, 110],
      text: "Hermes Agent on the local model takes jobs that read a lot and write little, to save hosted tokens.",
      items: [
        "Examples: a day of logs to triage, a pile of documents to summarize.",
        "Two profiles: lab, with the same access as Claude, and restricted, an internet-only sandbox.",
        "It writes a short summary file, and Claude reads that.",
      ],
    },
    litellm: {
      title: "LiteLLM", sub: "one key per client", kind: "host",
      wide: [230, 215], narrow: [190, 195],
      text: "One OpenAI-compatible endpoint in front of the model server.",
      items: [
        "local-qwen names the main model and local-embed the embedding model, so a model swap changes no client.",
        "If the main model fails, it retries on a smaller one. It never falls back to a cloud model.",
        "Per-client token counters for the usage dashboard.",
      ],
    },
    curator: {
      title: "Content curator", sub: "nightly picks", kind: "host",
      wide: [420, 215], narrow: [20, 195],
      text: "Collects feeds and podcasts each night and keeps a few worth reading.",
      items: [
        "Scores items with the local model while the server is otherwise idle.",
        "Groups duplicate stories and writes a reason for each pick.",
        "Links I save to a 'To curate' inbox get scored too.",
      ],
    },
    alloy: {
      title: "Grafana Alloy", sub: "metrics shipper", kind: "host",
      wide: [420, 300], narrow: [20, 280],
      text: "Scrapes both machines and ships the metrics to Grafana Cloud.",
      items: [
        "Sources: node_exporter, llama-swap, LiteLLM, the curator, and the state of the key systemd units.",
        "A keep-list holds it under the free tier's 10k series.",
        "The model server is scraped over the tailnet, so it never needs the internet.",
      ],
    },
    llamaswap: {
      title: "llama-swap", sub: "model router", kind: "server",
      wide: [230, 425], narrow: [190, 400],
      text: "Starts the engine a request names, and stops whatever has to make room.",
      items: [
        "Listens on the tailnet only.",
        "Groups: the big model runs alone, the two smaller ones run together, the embedding model stays loaded.",
        "Weights sit on local NVMe at pinned revisions.",
      ],
    },
    gufo: {
      title: "Gufo", sub: "the big model", kind: "server",
      wide: [40, 500], narrow: [20, 475],
      text: "Runs Qwen3.8 Flash-Next, the main model: about 112 GiB at 4-bit, with MTP speculative decoding.",
      items: ["About 59 tokens/s decode.", "Also serves Qwen3.8 27B with a DFlash2 draft model."],
    },
    llamacpp: {
      title: "llama.cpp", sub: "Vulkan · fallback", kind: "server",
      wide: [420, 500], narrow: [190, 475],
      text: "The known-good engine.",
      items: [
        "Qwen3.6 35B-A3B, the fallback model, at about 83 tokens/s.",
        "Qwen3 Embedding 0.6B for local-embed.",
      ],
    },
    anthropic: {
      title: "Hosted models", sub: "Claude · OpenAI", kind: "cloud",
      wide: [650, 130], narrow: [20, 600],
      text: "Claude Code and Codex use hosted models. The local model takes the bulk reading work.",
      items: [],
    },
    raindrop: {
      title: "Raindrop.io", sub: "reading queue", kind: "cloud",
      wide: [650, 215], narrow: [20, 675],
      text: "The curator's picks land in an 'AI picks' collection, tagged and with a reason, to read on any device.",
      items: [],
    },
    grafana: {
      title: "Grafana Cloud", sub: "free tier", kind: "cloud",
      wide: [650, 300], narrow: [190, 675],
      text: "Dashboards for the lab, local model usage, and a live architecture view.",
      items: ["Alerts next: agent host gone quiet, GPU temperature, model server down."],
    },
    nas: {
      title: "NAS", sub: "Synology · NFS", kind: "storage",
      wide: [650, 500], narrow: [190, 750],
      text: "Media storage over NFS on the home LAN.",
      items: ["A spare MacBook will take over Plex from an old PC."],
    },
  };

  // Groups are drawn as dashed boxes behind the nodes.
  const GROUPS = {
    wide: [
      { label: "Agent host · Ubuntu", x: 20, y: 100, w: 590, h: 270 },
      { label: "Model server · Strix Halo, 128 GB", x: 20, y: 395, w: 590, h: 170 },
      { label: "Outside the hosts", x: 635, y: 100, w: 190, h: 465 },
    ],
    narrow: [
      { label: "Agent host", x: 12, y: 80, w: 336, h: 265 },
      { label: "Model server", x: 12, y: 370, w: 336, h: 170 },
      { label: "Outside the hosts", x: 12, y: 570, w: 336, h: 240 },
    ],
  };

  const LAYOUT = {
    wide: { w: 830, h: 580, nodeW: 160, nodeH: 50 },
    narrow: { w: 360, h: 820, nodeW: 150, nodeH: 50 },
  };

  // via: polyline points for a layout where a straight line would cross boxes.
  // Edges with a via get no label in that layout.
  const EDGES = [
    { id: "laptop-agents", from: "laptop", to: "agents", layers: ["access"], label: "Tailscale SSH" },
    { id: "phone-agents", from: "phone", to: "agents", layers: ["access"], label: "Mosh · herdr" },
    {
      id: "telegram-hermes", from: "telegram", to: "hermes", layers: ["access"], label: "bot",
      via: { narrow: [[340, 625], [354, 625], [354, 135], [340, 135]] },
    },
    { id: "agents-hermes", from: "agents", to: "hermes", layers: ["inference"], label: "delegates" },
    {
      id: "agents-anthropic", from: "agents", to: "anthropic", layers: ["inference"], label: "API",
      via: { narrow: [[20, 135], [9, 135], [9, 625], [20, 625]] },
    },
    { id: "hermes-litellm", from: "hermes", to: "litellm", layers: ["inference"], label: "local-qwen" },
    { id: "curator-litellm", from: "curator", to: "litellm", layers: ["curator"], label: "scores" },
    { id: "litellm-llamaswap", from: "litellm", to: "llamaswap", layers: ["inference", "curator"], label: "tailnet" },
    { id: "llamaswap-gufo", from: "llamaswap", to: "gufo", layers: ["inference", "curator"], label: "" },
    { id: "llamaswap-llamacpp", from: "llamaswap", to: "llamacpp", layers: ["inference"], label: "fallback" },
    {
      id: "curator-raindrop", from: "curator", to: "raindrop", layers: ["curator"], label: "publishes",
      via: { narrow: [[20, 220], [4, 220], [4, 700], [20, 700]] },
    },
    { id: "alloy-litellm", from: "alloy", to: "litellm", layers: ["metrics"], label: "" },
    { id: "alloy-curator", from: "alloy", to: "curator", layers: ["metrics"], label: "" },
    { id: "alloy-llamaswap", from: "alloy", to: "llamaswap", layers: ["metrics"], label: "scrape" },
    {
      id: "alloy-grafana", from: "alloy", to: "grafana", layers: ["metrics"], label: "remote_write",
      via: { narrow: [[170, 305], [350, 305], [350, 700], [340, 700]] },
    },
  ];

  const LAYER_TEXT = {
    all: null,
    access: {
      title: "Access",
      text: "How I reach the lab. Everything goes through the agent host; the model server takes no logins from me day to day.",
    },
    inference: {
      title: "Inference",
      text: "Coding agents use hosted models. Bulk reading goes to Hermes and the local model, through LiteLLM and llama-swap.",
    },
    metrics: {
      title: "Metrics",
      text: "Alloy on the agent host pulls from both machines and is the only thing that talks to Grafana Cloud.",
    },
    curator: {
      title: "Reading picks",
      text: "Each night the curator scores new items on the local model and publishes the best few to Raindrop.",
    },
  };

  const TOUR = [
    {
      text: "A job reaches Hermes: I send it from Telegram, or Claude Code hands it something with a lot to read.",
      edges: ["telegram-hermes", "agents-hermes"],
    },
    { text: "Hermes calls LiteLLM with its own key and asks for local-qwen.", edges: ["hermes-litellm"] },
    {
      text: "LiteLLM maps local-qwen to the current main model and forwards the request over the tailnet.",
      edges: ["litellm-llamaswap"],
    },
    {
      text: "llama-swap starts Gufo with Flash-Next, unloading the smaller pair first if they are running.",
      edges: ["llamaswap-gufo"],
    },
    {
      text: "If the main model fails, LiteLLM retries on the 35B-A3B under llama.cpp. It never retries on a cloud model.",
      edges: ["llamaswap-llamacpp"],
    },
    {
      text: "LiteLLM counts the tokens per client. Alloy scrapes the counters and ships them to Grafana Cloud.",
      edges: ["alloy-litellm", "alloy-grafana"],
    },
  ];

  const canvas = root.querySelector(".lab-map__canvas");
  const detail = root.querySelector(".lab-map__detail");
  const layerButtons = root.querySelectorAll("[data-layer]");
  const tourStart = root.querySelector('[data-tour="start"]');
  const tourPrev = root.querySelector('[data-tour="prev"]');
  const tourNext = root.querySelector('[data-tour="next"]');

  const state = { layout: null, layer: "all", selected: null, step: -1 };
  let nodeEls = {};
  let edgeEls = {};

  function el(name, attrs, parent) {
    const node = document.createElementNS(SVG, name);
    for (const [k, v] of Object.entries(attrs || {})) node.setAttribute(k, v);
    if (parent) parent.appendChild(node);
    return node;
  }

  function rectOf(id, layout) {
    const [x, y] = NODES[id][layout];
    const { nodeW, nodeH } = LAYOUT[layout];
    return { x, y, w: nodeW, h: nodeH, cx: x + nodeW / 2, cy: y + nodeH / 2 };
  }

  // Point where the line from the centre of r towards (tx, ty) leaves r.
  function exitPoint(r, tx, ty) {
    const dx = tx - r.cx;
    const dy = ty - r.cy;
    if (dx === 0 && dy === 0) return [r.cx, r.cy];
    const sx = dx === 0 ? Infinity : r.w / 2 / Math.abs(dx);
    const sy = dy === 0 ? Infinity : r.h / 2 / Math.abs(dy);
    const s = Math.min(sx, sy);
    return [r.cx + dx * s, r.cy + dy * s];
  }

  function edgePoints(edge, layout) {
    if (edge.via && edge.via[layout]) return edge.via[layout];
    const a = rectOf(edge.from, layout);
    const b = rectOf(edge.to, layout);
    return [exitPoint(a, b.cx, b.cy), exitPoint(b, a.cx, a.cy)];
  }

  function render() {
    const layout = canvas.clientWidth < 560 ? "narrow" : "wide";
    if (layout === state.layout) return;
    state.layout = layout;
    const { w, h, nodeW, nodeH } = LAYOUT[layout];

    canvas.textContent = "";
    const svg = el("svg", { viewBox: `0 0 ${w} ${h}`, role: "img", "aria-label": "Map of the home lab" }, canvas);
    const defs = el("defs", {}, svg);
    for (const [id, cls] of [["lm-arrow", "lm-arrow"], ["lm-arrow-lit", "lm-arrow-lit"]]) {
      const m = el("marker", {
        id, viewBox: "0 0 10 10", refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: "auto-start-reverse",
      }, defs);
      el("path", { d: "M0,0 L10,5 L0,10 z", class: cls }, m);
    }

    for (const g of GROUPS[layout]) {
      const grp = el("g", { class: "lm-group" }, svg);
      el("rect", { x: g.x, y: g.y, width: g.w, height: g.h, rx: 10 }, grp);
      el("text", { x: g.x + 10, y: g.y + 16 }, grp).textContent = g.label;
    }

    edgeEls = {};
    const edgeLayer = el("g", {}, svg);
    for (const edge of EDGES) {
      const pts = edgePoints(edge, layout);
      const g = el("g", { class: "lm-edge" }, edgeLayer);
      const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
      const path = el("path", { d, "marker-end": "url(#lm-arrow)" }, g);
      const hasVia = edge.via && edge.via[layout];
      // Labels show only while the edge is lit, so the full map stays uncluttered.
      const [p, q] = pts;
      const fits = Math.hypot(q[0] - p[0], q[1] - p[1]) > edge.label.length * 7 + 44;
      if (edge.label && !hasVia && fits) {
        el("text", { x: (p[0] + q[0]) / 2 + 5, y: (p[1] + q[1]) / 2 - 5, class: "lm-label" }, g).textContent = edge.label;
      }
      edgeEls[edge.id] = { g, path };
    }

    nodeEls = {};
    for (const [id, n] of Object.entries(NODES)) {
      const r = rectOf(id, layout);
      const g = el("g", {
        class: "lm-node", "data-kind": n.kind, tabindex: 0, role: "button",
        "aria-label": `${n.title}: ${n.sub}`,
      }, svg);
      el("rect", { x: r.x, y: r.y, width: nodeW, height: nodeH, rx: 7 }, g);
      el("text", { x: r.x + 10, y: r.y + 22, class: "lm-title" }, g).textContent = n.title;
      el("text", { x: r.x + 10, y: r.y + 39, class: "lm-sub" }, g).textContent = n.sub;
      g.addEventListener("click", () => selectNode(id));
      g.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          selectNode(id);
        }
      });
      nodeEls[id] = g;
    }
    paint();
  }

  // Which edges are lit right now: the tour step wins, then the layer.
  function litEdges() {
    if (state.step >= 0) return new Set(TOUR[state.step].edges);
    if (state.layer === "all") return null;
    return new Set(EDGES.filter((e) => e.layers.includes(state.layer)).map((e) => e.id));
  }

  function paint() {
    const lit = litEdges();
    const litNodes = new Set();
    for (const edge of EDGES) {
      const on = lit !== null && lit.has(edge.id);
      if (on) {
        litNodes.add(edge.from);
        litNodes.add(edge.to);
      }
      const { g, path } = edgeEls[edge.id];
      g.classList.toggle("is-lit", on);
      g.classList.toggle("is-dim", lit !== null && !on);
      path.setAttribute("marker-end", on ? "url(#lm-arrow-lit)" : "url(#lm-arrow)");
    }
    for (const [id, g] of Object.entries(nodeEls)) {
      g.classList.toggle("is-lit", lit !== null && litNodes.has(id));
      g.classList.toggle("is-dim", lit !== null && !litNodes.has(id) && id !== state.selected);
      g.classList.toggle("is-selected", id === state.selected);
    }
    for (const b of layerButtons) {
      b.setAttribute("aria-pressed", String(state.step < 0 && b.dataset.layer === state.layer));
    }
    tourPrev.disabled = state.step <= 0;
    tourNext.disabled = state.step < 0 || state.step >= TOUR.length - 1;
    tourStart.textContent = state.step < 0 ? "Follow a request" : "End the tour";
    writeDetail();
  }

  function writeDetail() {
    detail.textContent = "";
    const add = (tag, text, cls) => {
      const e = document.createElement(tag);
      e.textContent = text;
      if (cls) e.className = cls;
      detail.appendChild(e);
      return e;
    };
    if (state.step >= 0) {
      add("p", `Step ${state.step + 1} of ${TOUR.length}`, "lm-step");
      add("p", TOUR[state.step].text);
      return;
    }
    if (state.selected) {
      const n = NODES[state.selected];
      add("h3", n.title);
      add("p", n.text);
      if (n.items.length) {
        const ul = add("ul", "");
        for (const item of n.items) {
          const li = document.createElement("li");
          li.textContent = item;
          ul.appendChild(li);
        }
      }
      return;
    }
    const layer = LAYER_TEXT[state.layer];
    if (layer) {
      add("h3", layer.title);
      add("p", layer.text);
      return;
    }
    add("p", "Click any box for what it runs and why. The dashed boxes are services outside the lab.");
  }

  function selectNode(id) {
    state.step = -1;
    state.selected = state.selected === id ? null : id;
    paint();
  }

  for (const b of layerButtons) {
    b.addEventListener("click", () => {
      state.step = -1;
      state.selected = null;
      state.layer = b.dataset.layer;
      paint();
    });
  }
  tourStart.addEventListener("click", () => {
    state.selected = null;
    state.step = state.step < 0 ? 0 : -1;
    paint();
  });
  tourPrev.addEventListener("click", () => {
    if (state.step > 0) state.step -= 1;
    paint();
  });
  tourNext.addEventListener("click", () => {
    if (state.step >= 0 && state.step < TOUR.length - 1) state.step += 1;
    paint();
  });

  // A layer can be linked directly: /lab/how-it-works/#inference
  const linked = location.hash.slice(1);
  if (linked in LAYER_TEXT) state.layer = linked;

  render();
  if ("ResizeObserver" in window) new ResizeObserver(render).observe(canvas);
  else window.addEventListener("resize", render);
})();
