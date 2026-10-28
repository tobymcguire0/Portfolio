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
title: Sumo
pitch: An 8-player online brawler with client-side prediction, server reconciliation, and Steam lobbies.
label: Netcode · Steam release
genre: Fighting
platform: PC
tags: [Unity, FishNet, Steamworks]
itchUrl: https://toblet.itch.io/simply-sumo
steam: https://store.steampowered.com/app/2974140/Sumo/?utm_source=portfolio
image: /images/games/Sumo/sumo-main.png
imageAlt: Sumo gameplay screenshot
featured: true
order: 1
private: true

# ============================================================
# CASE STUDY PAGE: /games/sumo
# Text fields use ">-" so you can type colons and quotes freely.
# Keep indentation consistent (2 spaces per level).
# ============================================================
caseStudy:
  # Browser tab title and search-result summary.
  title: Sumo - Exploring fast paced netcode.
  description: >-
    Sumo: an 8-player Steam physics party game built in Unity 6 with FishNet client-side prediction and server reconciliation.

  # Names used by the top nav and the "Next / Also" cards at the bottom.
  navLabel: Sumo
  nextLabel: Sumo — netcode

  # ---------- Hero ----------
  kicker: Case study · Multiplayer netcode · Steam
  headline: >-
    Sumo: Exploring fast paced netcode.
  # Inline HTML is allowed here, e.g. <i>...</i> for emphasis.
  lede: >-
    I made the original <i>Simply Sumo</i> for a game jam and released it on itch.io, and wanted to see if I could turn it into an online game.
    Although the gameplay was simple, the challenge came in the form of trying to balance consistent physics across clients, with fast paced low-latency gameplay,
    two things that don't mesh quite well.

  # Info grid under the hero.
  meta:
    - label: Role
      value: Solo developer
    - label: Engine
      value: Unity · C#
    - label: Netcode
      value: FishNet · Steamworks
    - label: Status
      value: Steam Pre-Release

  # Buttons under the info grid. "primary: true" is the filled button.
  actions:
    - label: Steam page →
      href: https://store.steampowered.com/app/2974140/Sumo/?utm_source=portfolio
      primary: true
    - label: Play Simply Sumo (original) ↗
      href: https://toblet.itch.io/simply-sumo

  # Side navigation. Each id must match an <h2 id="..."> in the body below.
  toc:
    - id: problem
      label: Problem
    - id: fix
      label: Fix
    - id: prediction
      label: Prediction
    - id: lobbies
      label: Lobbies
    - id: tools
      label: Debugging
---

<figure class="figure" style="margin-top:0">
  <div class="shot">
    <img src="/images/games/Sumo/sumo-main.png" alt="Sumo title card" style="aspect-ratio:920 / 430;height:auto">
  </div>
  <figcaption class="cap mono">Sumo Title Card</figcaption>
</figure>

<h2 id="problem">Finding a balance between low latency and accurate collisions</h2>

My first goal was to try and get everything as low latency as possible so everyone could see each other's movements in real time. This was a naive approach, since in the real world there is no such thing as 0 second latency for everyone in an online game.

However, without instant response, collisions started having exponentially worse error. I had to balance these two aspects of my game:

- **Low-latency inputs.**
  The player who launches should see it the moment they press the button, so their input has to act on their own screen right away.
- **High-accuracy collisions.**
  Hits have a big impact on the state of the game, if they are inaccurate on one screen it can be visually jarring at best, and make a player feel cheated at worst.

Here's a fun widget to visualize how even a little bit of latency can have a big effect on a simple collision:
<!--
  INTERACTIVE DEMO. Titles, labels and the aria-label descriptions are edited
  here. The numbers, the "A" / "B" player letters and the timeline legend
  drawn inside the canvases come from src/lib/case-demos.ts.
-->

<div class="frame figure">
  <div class="frame-head">
    <b>The same collision on two clients</b>
  </div>
  <noscript>
    <p class="cap" style="padding:12px 14px;margin:0;border-bottom:1px solid var(--fg)">This demo needs JavaScript to run.</p>
  </noscript>
  <div class="lab-views">
    <div class="lab-view">
      <div class="cap"><span>Client A</span></div>
      <canvas
        id="col-a"
        role="img"
        aria-label="Client A's view: player A launches immediately and player B launches after the latency delay"
      >Client A's view of the collision between players A and B.</canvas>
    </div>
    <div class="lab-view">
      <div class="cap"><span>Client B</span></div>
      <canvas
        id="col-b"
        role="img"
        aria-label="Client B's view: player B launches immediately and player A launches after the latency delay"
      >Client B's view of the collision between players A and B.</canvas>
    </div>
  </div>
  <div class="lab-ctrls">
    <div class="lab-stat">Avg deviation<output id="col-dev" aria-live="polite">—</output></div>
    <label>One-way latency <output id="col-lat-out" for="col-lat">100 ms</output><input id="col-lat" type="range" min="0" max="250" step="10" value="100"></label>
    <div class="lab-play">
      <button type="button" class="btn btn-primary" id="col-play">Play</button>
    </div>
  </div>
</div>

<p class="cap">
  This is a simplified version of the issue to get the basics across. In reality there are other issues such as non-deterministic physics that I had to rewrite, different speeds, etc.
</p>

<h2 id="fix">The Fix: Buffered inputs, client prediction, and visual smoothing</h2>

I had to compromise on my initial goal of low-latency inputs by buffering inputs, but lie to the client about this by pretending their inputs are immediate.

There are three pieces needed to pull this off:

- **Input buffering.**
  Inputs are held for a fixed buffer time and applied on a scheduled tick instead of the instant they arrive.
  This has the downside of delaying user inputs, so we lie to the player with the next two pieces.
- **Client-Side prediction**
  We play all the user's inputs immediately as they use them on their screen, moving the visuals as if they have 0 latency.
- **Visual Smoothing**
  When the client receives correct position information from the server, it smoothly interpolates from where the client thinks they are to where they are on the server. Because of input buffering, this usually isn't too big of a difference.

The demo below reruns the same collision with the first two fixes applied (no smoothing):
<!--
  INTERACTIVE DEMO. Titles, labels and the aria-label descriptions are edited
  here. The numbers, the "A" / "B" player letters and the timeline legend
  ("in flight", "buffered", "late", "applied") drawn inside the canvases come
  from src/lib/case-demos.ts.
-->

<div class="frame figure">
  <div class="frame-head">
    <b>The same collision, buffered</b>
  </div>
  <noscript>
    <p class="cap" style="padding:12px 14px;margin:0;border-bottom:1px solid var(--fg)">This demo needs JavaScript to run.</p>
  </noscript>
  <div class="lab-views">
    <div class="lab-view">
      <div class="cap"><span>Client A</span></div>
      <canvas
        id="buf-a"
        role="img"
        aria-label="Client A's view: both players launch on the same scheduled tick"
      >Client A's view of the buffered collision between players A and B.</canvas>
    </div>
    <div class="lab-view">
      <div class="cap"><span>Client B</span></div>
      <canvas
        id="buf-b"
        role="img"
        aria-label="Client B's view: both players launch on the same scheduled tick"
      >Client B's view of the buffered collision between players A and B.</canvas>
    </div>
  </div>
  <div class="lab-timeline">
    <canvas
      id="buf-timeline"
      role="img"
      aria-label="Timeline of one input: sent at 0 ms, in flight for the latency, and applied on the tick at the 100 ms buffer limit. If it arrives after that tick it is late and the receiving client reconciles"
    >Timeline of one input from press to the tick where it is applied, and when it arrives late.</canvas>
  </div>
  <div class="lab-ctrls" style="--stats:2">
    <div class="lab-stat">Avg deviation<output id="buf-dev" aria-live="polite">—</output></div>
    <div class="lab-stat">Correction<output id="buf-correction">—</output></div>
    <label>One-way latency <output id="buf-lat-out" for="buf-lat">150 ms</output><input id="buf-lat" type="range" min="0" max="250" step="10" value="150"></label>
    <div class="lab-play">
      <button type="button" class="btn btn-primary" id="buf-play">Play</button>
    </div>
  </div>
</div>

<p class="cap">
Once again, this is simplifying a lot of the issue, but is a good start.
</p>

The cost is a fixed input delay, plus a visible correction when a connection is worse than the buffer covers.
For a game decided by collisions, that's the right trade.

<h2 id="prediction">Prediction and reconciliation: Letting the client lie, then correcting it</h2>

Since the client is pretending inputs happen instantly, it needs a way to find out what really happened and fix itself.
Player input runs through a tick based FishNet replicate step, so the player never has to wait a full round trip to see their own charge and launch.

The server is still the one in charge though. Every tick it sends back a reconcile snapshot of what actually happened, and the client rewinds to that snapshot and replays all of its inputs from there.
This is also what catches an input that shows up after the buffer has run out.

Getting this to work came down to a few things:

- **Small, exact state.**
  Sumo runs its own 2D physics world, so a player's whole physics state is just position and velocity. That means a snapshot can restore it exactly.
- **Everything that can change mid-rollback has to travel too.**
  Charge amount, the shrink ability's charge speed multiplier, shield and freeze body modes, collision flags, and the remaining slices of a multi-tick launch.
  If even one of these is missing, the replay slowly drifts away from the server.
- **Cheap on the wire.**
  Delta compression means fields that rarely change only cost about one bit per tick until they flip.
- **Other players are interpolated.**
  Remote players aren't predicted, they are drawn by a visual smoother that buffers the authoritative per tick samples.

<h2 id="lobbies">Using Steam for lobbies</h2>

<figure class="figure">
  <div class="shot">
    <img src="/images/games/Sumo/sumo-lobby.png" alt="Sumo's Lobby screen" loading="lazy">
  </div>
  <figcaption class="cap mono">Creating a lobby</figcaption>
</figure>

Since the game is on Steam, I built the lobbies on top of Steam friends, invites, and privacy modes.
The host can toggle rounds, hazards, and abilities for the whole group, bots fill any empty slots, and controllers get the correct glyphs through Steam Input.

I also added a calmer Fishing mode for in between fights, so a group has a reason to stay in the same lobby.

<h2 id="tools">Debugging</h2>

Netcode bugs only really show up under bad conditions, so I built some tools to create those conditions and measure them:

- **Prediction overlay.**
  A dev only overlay (F3) shows the round trip time and every reconcile correction over a rolling window. This way a desync shows up as a number instead of just a feeling.
- **Tick-rate-independent smoothing.**
  Rotation and velocity damping use exponential smoothing instead of a raw per tick lerp, so the game feels the same no matter what the tick rate is.
- **Editor tests.**
  Unit tests cover content ID assignment, cosmetic sanitizing, entitlement filtering, and nameplates.
