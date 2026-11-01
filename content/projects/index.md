---
title: "Projects"
description: "Things I've built, mostly around VCF, VKS and agents."
showDate: false
showAuthor: false
showReadingTime: false
showTableOfContents: false
showPagination: false
---

Open-source work, newest first. Each links to its repo.

## VCF and VKS

- **[vkstack](https://github.com/warroyo/vkstack)**: whole-stack compatibility
  for vCenter, ESX, vSphere Supervisor, VKS and VKr. A map for people, JSON
  and MCP for agents.
- **[vks-addons-skill](https://github.com/warroyo/vks-addons-skill)**: a Claude
  Code skill for the VKS addon system, verified against VKS 3.7.
- **[platform-observability-addon](https://github.com/warroyo/platform-observability-addon)**:
  VCF Operations Platform Observability for VKS clusters, as a VKS helm addon.
- **[kro-supervisor-service](https://github.com/warroyo/kro-supervisor-service)**:
  kro packaged as a vSphere Supervisor service.
- **[ansible-supervisor-service](https://github.com/warroyo/ansible-supervisor-service)**:
  binds VM Service VMs on a Supervisor to AWX or Ansible Automation Platform
  job templates.
- **[supervisor-github-runner](https://github.com/warroyo/supervisor-github-runner)**:
  a GitHub Actions runner on the Supervisor and vSphere Pods.
- **[argo-rollouts-vks-avi-demo](https://github.com/warroyo/argo-rollouts-vks-avi-demo)**:
  Argo Rollouts canaries with Gateway API traffic shifting on VKS, with Avi as
  the Gateway.
- **[dayzero-addon-service](https://github.com/warroyo/dayzero-addon-service)**:
  a Supervisor service for generic YAML addons at cluster bootstrap.

## Home lab and agents

- **[content-curator](https://github.com/warroyo/content-curator)**: feeds in,
  a local model scores them, a small daily reading queue out.
- **[dev-environment](https://github.com/warroyo/dev-environment)**: dotfiles
  and provisioning for my machines and the [lab](/lab/).
