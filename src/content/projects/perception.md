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
title: Underwater computer vision
description: A Unity simulation for robot navigation, plus ML auto-labeling for distance and rotation detection in low-visibility water.
label: ML / computer vision · OSU Underwater Robotics
role: Autonomy & perception
stack: [Python, Unity, C#]
image: /images/personal/Talos.png
imageAlt: The Talos underwater robot being prepared at the pool
featured: true
order: 2

# ============================================================
# CASE STUDY PAGE: /projects/perception
# Text fields use ">-" so you can type colons and quotes freely.
# Keep indentation consistent (2 spaces per level).
# ============================================================
caseStudy:
  # Browser tab title. (No separate search description: the card
  # description above is used.)
  title: Underwater computer vision - Teaching a robot to see.

  # Names used by the top nav and the "Next / Also" cards at the bottom.
  navLabel: Computer Vision

  # ---------- Hero ----------
  kicker: Case study · ML / AI · Simulation
  headline: >-
    Teaching a robot to see in murky water.
  lede: >-
    I worked on autonomy and perception for OSU Underwater Robotics, where the biggest challenge was that our cameras can barely see underwater.
    So I built a Blender project that would generate synthetic datapoints of our target objects in obscured/blurry situations to train our models on.

  # Info grid under the hero. "mono: true" shows the value in a code font.
  meta:
    - label: Team
      value: OSU Underwater Robotics
    - label: Role
      value: Perception & Data
    - label: Stack
      value: Blender · YOLOv5 · Python
    - label: When
      value: 2020 – 2024
      mono: true

  # Side navigation. Each id must match an <h2 id="..."> in the body below.
  toc:
    - id: problem
      label: Problem
    - id: pipeline
      label: Pipeline
    - id: generator
      label: Generator
    - id: industry
      label: In industry
---

<h2 id="problem">Finding training data on short notice</h2>

Each new competition had new goal objects to detect, meaning we had a limited amount of time to gather data and train out YOLOv5 perception model on them. When we could, we would miss rainy day cases where the objects are obscured or the visibility is bad.

This lead to our vision system working really well in clear pools and above water, but heavily lacking in real world bodies of water with sand and silt.

So I went to work building a system to generate fake datapoints that simulated these conditions using the following systems:

- **Fog/Haze**
  Using depth nodes and tweaking a threshold value, I could adjust the post processing of an image to add more or less haze to an image to obscure an object
- **Debris**
  I randomly scattered objects around the scene to partially obscure the goal object, verifying that at least 20% of the object was visible.
- **Collecting the datapoint**
  With blender, I was able to seperatly output a black/white mask of the key object ontop of the scene, and get bounding box data writted to a log file.

This system was randomized for each datapoint generated, and cound generate about 5 new datapoints a second on a medium-high end PC in 2022.

<h2 id="pipeline">Blender to Perception</h2>

This breaks down the workflow of generating new datapoints for an object

<div class="frame pipe figure">
  <div class="node">
    <b>Select</b>
    <span>Choose a goal object to generate data for</span>
  </div>
  <div class="node">
    <b>Randomize</b>
    <span>Randomly choose goal object pos, hazard objects, and level of fog.</span>
  </div>
  <div class="node">
    <b>Record</b>
    <span>Export raw image, object mask, and bounding box</span>
  </div>
  <div class="node">
    <b>Train</b>
    <span>Use collection of datapoints to train YOLOv5 perception model</span>
  </div>
</div>

<h2 id="generator">Generating a datapoint</h2>

Here's a simplified version of the generator.
Each click places the goal object at a random position and rotation, scatters debris around it, and picks a random haze level.
Next to the image you get the object mask and the bounding box that the training labels come from.

Debris in front of the object can hide parts of it, so the mask only covers what's still visible and the bounding box is fit to that.
If less than 20% of the object would be visible, the debris get randomized again. Best practice in real life is to avoid using too many large debris to make this unlikely.

<!--
  INTERACTIVE DEMO. Titles, labels and the aria-label descriptions are edited
  here. The scene, the mask and every number shown come from
  src/lib/case-demos.ts (initDatapointDemo). The viewBox of the two small
  <svg> overlays must match IMG_W / IMG_H there.
-->

<div class="frame figure">
  <div class="frame-head">
    <b>Synthetic datapoint generator</b>
  </div>
  <noscript>
    <p class="cap" style="padding:12px 14px;margin:0;border-bottom:1px solid var(--fg)">This demo needs JavaScript to run.</p>
  </noscript>
  <div class="lab-views">
    <div class="lab-view">
      <div class="cap"><span>Image</span><span id="dp-n"></span></div>
      <div class="dp-frame">
        <canvas
          id="dp-image"
          role="img"
          aria-label="Rendered underwater scene with an orange gate at a random position and rotation, surrounded by debris and haze, with its bounding box outlined in green"
        >A generated underwater image containing the goal object.</canvas>
        <svg viewBox="0 0 480 360" aria-hidden="true"><rect id="dp-image-box"/></svg>
      </div>
    </div>
    <div class="lab-view">
      <div class="cap"><span>Mask</span><span>Object only</span></div>
      <div class="dp-frame">
        <canvas
          id="dp-mask"
          role="img"
          aria-label="Black and white mask where only the visible pixels of the gate are white, with its bounding box outlined in green"
        >The black and white mask of the goal object.</canvas>
        <svg viewBox="0 0 480 360" aria-hidden="true"><rect id="dp-mask-box"/></svg>
      </div>
    </div>
  </div>
  <div class="lab-ctrls">
    <div class="lab-stat">Haze<output id="dp-haze">—</output></div>
    <div class="lab-stat">Object visible<output id="dp-visible">—</output></div>
    <div class="lab-play">
      <button type="button" class="btn btn-primary" id="dp-generate">Generate datapoint</button>
    </div>
  </div>
</div>

<h2 id="industry">Taking the same idea into industry</h2>

At **Nauticus Robotics** I took this solution further and had more compute at my disposal to generate these datapoints even faster, with more variations on the goal object to increase variability in the data, and higher quality renders to be more true to life.

At this time, YOLOv8 came out with the ability to add orientation to detections, which only required small changes to my generator to get even higher quality datapoints.

<div class="figs">
  <div>
    <strong>3,000+</strong>
    <span>synthetic labeled training images per hour</span>
  </div>
  <div>
    <strong>+30%</strong>
    <span>object confidence in low visibility environments</span>
  </div>
</div>
