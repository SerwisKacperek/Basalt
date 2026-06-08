---
layout: home

hero:
  name: Basalt
  text: Local-First Notes App
  tagline: An Obsidian-style notes app for web and desktop. Works offline. Syncs across devices.
  actions:
    - theme: brand
      text: Get Started
      link: /guide/
    - theme: alt
      text: View on GitHub
      link: https://github.com/SerwisKacperek/Basalt
  image:
    src: /icon.svg
    alt: Basalt

features:
  - icon: 📝
    title: Markdown Notes
    details: Edit local Markdown files with a clean, focused editor. SQLite-backed for fast local queries.

  - icon: 🔌
    title: Works Offline
    details: Fully functional without a network connection. Web app uses SQLite-WASM in OPFS; desktop uses better-sqlite3.

  - icon: 🔄
    title: Cross-Device Sync
    details: Optional sync via a remote API. Local-first — the remote is only for cross-device sync, never a dependency for use.

  - icon: 🖥️
    title: Web + Desktop
    details: A single renderer codebase ships as a PWA and an Electron desktop app via two build targets.

  - icon: 🤖
    title: AI-Ready
    details: Embedded MCP server exposes a curated tool surface to AI agents, available in both desktop and hosted modes.

  - icon: ⚡
    title: Type-Safe API
    details: Elysia + Eden Treaty gives end-to-end type safety from route definition to React component — zero manual wiring.
---
