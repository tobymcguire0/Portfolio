---
# HOW TO EDIT THIS FILE
# - This top block (between the --- lines) is settings and short text.
# - Everything below the second --- is the page body.
#   Paragraphs and bullets are Markdown: one sentence per line, and a blank
#   line starts a new paragraph.
#   Boxes and diagrams are HTML: edit the text between the tags, and leave
#   the tags, class names and ids alone.
# - Never put a blank line inside an HTML box. It splits the box in two.

# ============================================================
# HOMEPAGE CARD
# ============================================================
title: Saucer
description: Recipe app with cross-device sync on AWS. Paste a URL or upload an image and Claude Haiku drafts the recipe.
stack: [TypeScript, React, AWS]
github: https://github.com/tobymcguire0/Saucer
live: https://saucer.tobymcguire.net
image: /images/personal/Saucer%20Homepage.png
imageAlt: The Saucer recipe library showing a grid of recipe cards
featured: true
order: 3

# ============================================================
# CASE STUDY PAGE: /projects/saucer
# Text fields use ">-" so you can type colons and quotes freely.
# Keep indentation consistent (2 spaces per level).
# ============================================================
caseStudy:
  # Browser tab title and search-result summary.
  title: Saucer - Building a cloud based recipe app.
  description: >-
    Saucer: An online/offline cloud-synced recipe app

  # Names used by the top nav and the "Next / Also" cards at the bottom.
  navLabel: Saucer
  nextLabel: Saucer — cloud app

  # ---------- Hero ----------
  kicker: Case study · Cloud · AI
  headline: >-
    Saucer: An online/offline cloud-synced recipe app
  lede: >-
    I wanted to learn the full stack end to end, so I built a recipe app.
    It runs in the browser or as a native desktop app, and syncs through an Express + PostgreSQL server that I host myself.
    The recipes themselves are simple, the challenge was keeping the app working with no connection and still syncing cleanly across devices.
    I also used Claude Haiku to turn photos and loose text into structured recipes.
  icon: /images/projects/Saucer/saucer-icon.png
  iconAlt: Saucer app icon

  # Info grid under the hero.
  meta:
    - label: Role
      value: Solo developer
    - label: Client
      value: React 19 · TypeScript · Tauri 2
    - label: Server
      value: Express 5 · PostgreSQL 18
    - label: Infra
      value: Docker · nginx · Cognito · Cloudflare

  # Buttons under the info grid. "primary: true" is the filled button.
  actions:
    - label: Open live app →
      href: https://saucer.tobymcguire.net
      primary: true
    - label: View source ↗
      href: https://github.com/tobymcguire0/Saucer

  # Big numbers. Keep each value in quotes.
  figures:
    - value: "4"
      caption: "import sources: URL, photo, text, manual"
    - value: "3"
      caption: desktop OS installers built by CI on every push to main
    - value: "~10 s"
      caption: for devices to converge after reconnecting

  # Side navigation. Each id must match an <h2 id="..."> in the body below.
  toc:
    - id: sync
      label: Sync
    - id: import
      label: Import
    - id: ship
      label: "Testing & shipping"
    - id: tradeoffs
      label: Trade-offs
---

<h2 id="system">The system, layer by layer</h2>

Every layer sits behind an interface, so the UI, sync engine, and search index don't know or care where data physically lives.

<dl class="layers">
  <div class="layer"><dt>Client</dt><dd class="what">React 19 + TypeScript + Vite, state in Zustand</dd><dd class="why">Ships as a web app on Cloudflare and as a Tauri 2 desktop app. Only 3 Rust IPC commands; all business logic stays in TypeScript.</dd></div>
  <div class="layer"><dt>Local store</dt><dd class="what"><code>RecipeStore</code> interface</dd><dd class="why">IndexedDB in the browser and plain Markdown files on desktop, chosen automatically at startup.</dd></div>
  <div class="layer"><dt>Search</dt><dd class="what">sql.js (SQLite in WASM)</dd><dd class="why">Full-text and tag search runs entirely in-process, with no server round trip.</dd></div>
  <div class="layer"><dt>Edge</dt><dd class="what">nginx · Let's Encrypt</dd><dd class="why">TLS termination in front of the API, running alongside it in Docker Compose.</dd></div>
  <div class="layer"><dt>API</dt><dd class="what">Express 5</dd><dd class="why"><code>/sync/push</code>, <code>/sync/changes</code>, <code>/bootstrap</code>, <code>/extract-*</code>, and <code>/taxonomy</code>.</dd></div>
  <div class="layer"><dt>Data</dt><dd class="what">PostgreSQL 18</dd><dd class="why">Recipes, mutations, taxonomy, and revisions. A file-backed store stands in during local development.</dd></div>
  <div class="layer"><dt>Auth</dt><dd class="what">AWS Cognito · OIDC</dd><dd class="why">The server verifies JWTs with <code>aws-jwt-verify</code>. Sync is optional; signed-out use stays local.</dd></div>
  <div class="layer"><dt>AI</dt><dd class="what">Claude Haiku</dd><dd class="why">Called only from the server, so API keys never reach the client.</dd></div>
</dl>

<h2 id="sync">Offline-first sync</h2>

Every local write lands in storage immediately and is queued as a named mutation (`upsertRecipe`, `deleteRecipe`). Clients push the queue when they're online and poll `/sync/changes?cursor=…` every 10 seconds and on window focus. The server deduplicates by `clientMutationId`, so a client that reconnects and replays its whole queue never creates duplicates.

Step through what happens when two devices edit the same recipe while both are offline:

<div class="frame figure">
  <div class="frame-head"><b>Fig. 1: concurrent offline edit</b><span>step <span class="js-step">1</span> / 4 · illustrative values</span></div>
  <div class="devices">
    <div class="device" data-dev="a"><div class="device-head"><span>Device A</span><span class="conn" data-on="false">Offline</span></div><dl class="rec"><dt>title</dt><dd>Pasta</dd><dt>rating</dt><dd class="changed">4<span class="delta" aria-hidden="true">Δ</span><span class="sr-only"> (changed this step)</span></dd><dt>revision</dt><dd>4</dd><dt>queue</dt><dd>upsert #a1</dd></dl></div>
    <div class="device" data-dev="b"><div class="device-head"><span>Device B</span><span class="conn" data-on="false">Offline</span></div><dl class="rec"><dt>title</dt><dd class="changed">Pasta 2.0<span class="delta" aria-hidden="true">Δ</span><span class="sr-only"> (changed this step)</span></dd><dt>rating</dt><dd>3</dd><dt>revision</dt><dd>4</dd><dt>queue</dt><dd>upsert #b1</dd></dl></div>
    <div class="device" data-dev="s"><div class="device-head"><span>Server</span><span class="conn" data-on="true">Online</span></div><dl class="rec"><dt>title</dt><dd>Pasta</dd><dt>rating</dt><dd>3</dd><dt>revision</dt><dd>4</dd><dt>queue</dt><dd>—</dd></dl></div>
  </div>
  <div class="lab-foot">
    <p class="js-caption" aria-live="polite">Both devices go offline and edit "Pasta". A changes the rating; B renames it. Each write is saved locally and queued.</p>
    <div class="stepper"><button type="button" class="js-prev" aria-label="Previous step">←</button><button type="button" class="js-next" aria-label="Next step">→</button></div>
  </div>
</div>

A second guard covers deletes: a synced recipe can't be deleted while its device is offline, so an offline device can't remove a recipe other devices may have changed in the meantime.

<h2 id="import">Four ways to add a recipe</h2>

Every path ends in the same draft editor. The three automated paths send content to Claude Haiku on the server and can pull several recipes out of one source. Website imports fall back to the page's own structured data if the model call fails.

<div class="frame flow figure">
  <div class="tabs" role="tablist" aria-label="Import source">
    <button role="tab" type="button" id="tab-url" aria-controls="flow-panel" tabindex="0" data-p="url" aria-selected="true">Website URL</button>
    <button role="tab" type="button" id="tab-image" aria-controls="flow-panel" tabindex="-1" data-p="image" aria-selected="false">Photo</button>
    <button role="tab" type="button" id="tab-text" aria-controls="flow-panel" tabindex="-1" data-p="text" aria-selected="false">Text file</button>
    <button role="tab" type="button" id="tab-manual" aria-controls="flow-panel" tabindex="-1" data-p="manual" aria-selected="false">Manual</button>
  </div>
  <div role="tabpanel" id="flow-panel" aria-labelledby="tab-url">
    <div class="pipe" id="flow-pipe"><div class="node"><b>Paste URL</b><span>client</span></div><div class="node"><b>Fetch page</b><span>Cloudflare Worker · Rust IPC on desktop</span></div><div class="node"><b>Claude Haiku</b><span>page text → one or more recipes</span></div><div class="node"><b>Draft recipes</b><span>review, edit, save</span></div></div>
    <div class="fallback"><b>Fallback</b><span id="flow-fallback">If the model call fails, an ld+json parser reads the structured recipe data most sites already publish.</span></div>
    <p class="flow-note" id="flow-note">On desktop, the Tauri shell fetches the page itself through the fetch_recipe_page IPC command.</p>
  </div>
</div>

<h2 id="ship">Testing and shipping</h2>

This is the part that maps most directly to my day job. Every push to main runs the full check gate before any installer is built.

<ul class="checks">
  <li><code>biome lint · format</code><span>Lint and formatting enforced across the repo.</span></li>
  <li><code>tsc --noEmit</code><span>Strict type check on both the client and the server.</span></li>
  <li><code>vitest + Testing Library</code><span>Client tests covering the API client, auth boundaries, extraction, persistence, the editor store, and taxonomy sync.</span></li>
  <li><code>vitest + supertest</code><span>Server tests against the Express app and the store layer.</span></li>
  <li><code>GitHub Actions</code><span>Runs <code>npm run check</code>, then builds and publishes Tauri installers for macOS, Windows, and Linux on every push to main.</span></li>
</ul>

<h2 id="tradeoffs">Trade-offs I chose on purpose</h2>

- **Last write wins, not CRDTs.** Two people on one account editing the same recipe at the same moment is rare, so ordered upserts plus a delete guard give convergence without the complexity of lossless merging.
- **Polling, not websockets.** A 10-second cursor poll is simple to reason about, survives flaky connections, and is plenty for a recipe app.
- **Self-hosted server, managed auth.** I run Postgres and the API myself to learn them, but leave identity to Cognito rather than rolling my own.
