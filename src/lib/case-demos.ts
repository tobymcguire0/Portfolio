import { scrollSpy } from './scrollspy';

// Interactive figures embedded in case study markdown. Each initializer looks for its own
// markup by id/class and does nothing on pages that don't include it.

function byId<T extends HTMLElement>(id: string, type: { new (): T; prototype: T }): T | null {
  const el = document.getElementById(id);
  return el instanceof type ? el : null;
}

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage can be unavailable (privacy modes); the demo just won't remember its state.
  }
}

/* ---------- Sumo: collision labs ---------- */

interface View {
  g: CanvasRenderingContext2D;
  w: number;
  h: number;
}

interface Vec {
  x: number;
  y: number;
}

interface Pose extends Vec {
  pending: boolean; // this client hasn't applied the player's input yet
}

interface Frame {
  a: Pose;
  b: Pose;
}

// A late input forced this client to rewind and replay: the remote player jumped from `from` to `to`.
interface Reconcile {
  step: number;
  from: Vec;
  to: Vec;
}

interface Run {
  frames: Frame[];
  impact: { step: number; at: Vec } | null;
  reconcile: Reconcile | null;
}

interface Body extends Vec {
  vx: number;
  vy: number;
  impulse: Vec;
  launchStep: number;
  launched: boolean;
}

type PlayerId = 'a' | 'b';
// raw: a client applies its own input at once and the other player's input when it arrives.
// buffered: every client holds every input until the same scheduled tick.
type LabMode = 'raw' | 'buffered';

const ARENA = { w: 400, h: 300 };
const RADIUS = 16;
const LAUNCH_SPEED = 420; // px/s given by the launch impulse
const DAMPING = 400; // px/s² of constant deceleration
const BOUNCE = 0.85;
const STEP = 1 / 240; // fixed physics step, in seconds
const MAX_STEPS = 240 * 6;
const TRAIL_EVERY = 12;
const INPUT_TICK_MS = 50;
const BUFFER_MS = 100; // constant: every input waits this long, whatever the latency
const TIMELINE_MS = 300;
const SPAWN: Record<PlayerId, Vec> = { a: { x: 70, y: 50 }, b: { x: 330, y: 50 } };
// Both players aim at the same point, so their paths cross and the timing decides how they meet.
const AIM: Vec = { x: 200, y: 130 };

const unit = (from: Vec, to: Vec): Vec => {
  const d = Math.hypot(to.x - from.x, to.y - from.y);
  return { x: (to.x - from.x) / d, y: (to.y - from.y) / d };
};
const DIRECTION: Record<PlayerId, Vec> = { a: unit(SPAWN.a, AIM), b: unit(SPAWN.b, AIM) };
const IDLE: Frame = { a: { ...SPAWN.a, pending: true }, b: { ...SPAWN.b, pending: true } };
const NO_DEVIATION = '—';

const distance = (p: Vec, q: Vec): number => Math.hypot(p.x - q.x, p.y - q.y);
const lastFrame = (run: Run): Frame => run.frames[run.frames.length - 1] ?? IDLE;

const msToStep = (ms: number): number => Math.ceil(ms / 1000 / STEP - 1e-9);

const makeBody = (id: PlayerId, launchMs: number): Body => ({
  ...SPAWN[id],
  vx: 0,
  vy: 0,
  impulse: { x: DIRECTION[id].x * LAUNCH_SPEED, y: DIRECTION[id].y * LAUNCH_SPEED },
  launchStep: msToStep(launchMs),
  launched: false,
});

// Plays the physics forward. The code is identical on every client; only the launch times differ
// (in ms after the button press, Infinity for an input this client doesn't have).
function simulate([launchA, launchB]: [number, number], limit = MAX_STEPS): Run {
  const a = makeBody('a', launchA);
  const b = makeBody('b', launchB);
  const bodies = [a, b];
  const frames: Frame[] = [];
  let impact: Run['impact'] = null;

  for (let step = 0; step < limit; step++) {
    for (const body of bodies) {
      if (!body.launched && step >= body.launchStep) {
        body.launched = true;
        body.vx += body.impulse.x;
        body.vy += body.impulse.y;
      }
      const speed = Math.hypot(body.vx, body.vy);
      if (speed > 0) {
        const slowed = Math.max(0, speed - DAMPING * STEP);
        body.vx *= slowed / speed;
        body.vy *= slowed / speed;
      }
      body.x += body.vx * STEP;
      body.y += body.vy * STEP;
    }

    const dist = distance(a, b);
    if (dist > 0 && dist < RADIUS * 2) {
      const nx = (b.x - a.x) / dist;
      const ny = (b.y - a.y) / dist;
      const closing = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
      if (closing > 0) {
        const j = ((1 + BOUNCE) * closing) / 2;
        a.vx -= j * nx;
        a.vy -= j * ny;
        b.vx += j * nx;
        b.vy += j * ny;
        impact ??= { step, at: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } };
      }
      const push = (RADIUS * 2 - dist) / 2;
      a.x -= nx * push;
      a.y -= ny * push;
      b.x += nx * push;
      b.y += ny * push;
    }

    frames.push({
      a: { x: a.x, y: a.y, pending: !a.launched },
      b: { x: b.x, y: b.y, pending: !b.launched },
    });
    const settled = bodies.every((body) => body.launched && Math.hypot(body.vx, body.vy) === 0);
    if (settled) break;
  }
  return { frames, impact, reconcile: null };
}

// What one client shows over the whole run.
// raw: it applies its own input at once and the other player's when it arrives.
// buffered: inputs are applied on a shared tick `BUFFER_MS` after the press. If the remote input
// arrives in time, the client matches the authoritative run exactly. If it arrives late, the client
// has been predicting that player as idle; the input then makes it rewind to the shared tick and
// replay, so the remote player jumps to where the authoritative run has it.
function clientRun(mode: LabMode, owner: PlayerId, latencyMs: number): Run {
  if (mode === 'raw') return simulate(owner === 'a' ? [0, latencyMs] : [latencyMs, 0]);

  const authoritative = simulate([BUFFER_MS, BUFFER_MS]);
  if (latencyMs <= BUFFER_MS) return authoritative;

  const arrival = msToStep(latencyMs);
  const remote: PlayerId = owner === 'a' ? 'b' : 'a';
  const predicted = simulate(owner === 'a' ? [BUFFER_MS, Infinity] : [Infinity, BUFFER_MS], arrival);
  const before = predicted.frames[arrival - 1];
  const after = authoritative.frames[arrival];
  if (!before || !after) return authoritative;
  return {
    frames: [...predicted.frames, ...authoritative.frames.slice(arrival)],
    impact: authoritative.impact,
    reconcile: { step: arrival, from: before[remote], to: after[remote] },
  };
}

// Markup ids are `${prefix}-a`, `-b`, `-lat`, `-lat-out`, `-play` and `-dev`. The buffered lab also
// has `-correction` (the size of the jump a late input causes) and `-timeline`.
function initCollisionLab(prefix: string, mode: LabMode): void {
  const canvasA = byId(`${prefix}-a`, HTMLCanvasElement);
  const canvasB = byId(`${prefix}-b`, HTMLCanvasElement);
  const latency = byId(`${prefix}-lat`, HTMLInputElement);
  const play = byId(`${prefix}-play`, HTMLButtonElement);
  const latencyOut = document.getElementById(`${prefix}-lat-out`);
  const deviation = document.getElementById(`${prefix}-dev`);
  if (!canvasA || !canvasB || !latency || !play || !latencyOut || !deviation) return;
  const buffered = mode === 'buffered';
  const timeline = buffered ? byId(`${prefix}-timeline`, HTMLCanvasElement) : null;
  const correctionOut = buffered ? document.getElementById(`${prefix}-correction`) : null;
  if (buffered && (!timeline || !correctionOut)) return;

  const css = getComputedStyle(document.documentElement);
  const token = (name: string): string => css.getPropertyValue(name).trim();
  const FG = token('--fg');
  const MUTED = token('--muted');
  const BORDER = token('--border');
  const RULE = token('--rule');
  const ACCENT = token('--accent');
  const OK = token('--ok');
  const WARN = token('--warn');
  const SURFACE = token('--surface');
  const MONO = token('--font-mono');

  const fit = (canvas: HTMLCanvasElement): View | null => {
    const r = canvas.getBoundingClientRect();
    const d = devicePixelRatio || 1;
    canvas.width = r.width * d;
    canvas.height = r.height * d;
    const g = canvas.getContext('2d');
    if (!g) return null;
    g.setTransform(d, 0, 0, d, 0, 0);
    return { g, w: r.width, h: r.height };
  };
  const firstA = fit(canvasA);
  const firstB = fit(canvasB);
  const firstTimeline = timeline ? fit(timeline) : null;
  if (!firstA || !firstB || (timeline && !firstTimeline)) return;
  let viewA: View = firstA;
  let viewB: View = firstB;
  let viewTimeline: View | null = firstTimeline;

  const circle = (g: CanvasRenderingContext2D, p: Vec, r: number): void => {
    g.beginPath();
    g.arc(p.x, p.y, r, 0, Math.PI * 2);
  };

  const arrow = (g: CanvasRenderingContext2D, from: Vec, dir: Vec, color: string, s: number): void => {
    const x0 = from.x + dir.x * (RADIUS + 6);
    const y0 = from.y + dir.y * (RADIUS + 6);
    const x1 = from.x + dir.x * (RADIUS + 30);
    const y1 = from.y + dir.y * (RADIUS + 30);
    const angle = Math.atan2(dir.y, dir.x);
    g.strokeStyle = color;
    g.lineWidth = 1.5 / s;
    g.beginPath();
    g.moveTo(x0, y0);
    g.lineTo(x1, y1);
    g.moveTo(x1 - 7 * Math.cos(angle - 0.5), y1 - 7 * Math.sin(angle - 0.5));
    g.lineTo(x1, y1);
    g.lineTo(x1 - 7 * Math.cos(angle + 0.5), y1 - 7 * Math.sin(angle + 0.5));
    g.stroke();
  };

  const paint = ({ g, w, h }: View, run: Run | null, step: number, owner: PlayerId, other: Run | null): void => {
    const s = w / ARENA.w;
    const at = run ? Math.min(step, run.frames.length - 1) : 0;
    const pose = run?.frames[at] ?? IDLE;

    g.clearRect(0, 0, w, h);
    g.save();
    g.scale(s, s);

    g.strokeStyle = BORDER;
    g.lineWidth = 1 / s;
    g.beginPath();
    for (let x = 20; x < ARENA.w; x += 20) {
      g.moveTo(x, 0);
      g.lineTo(x, ARENA.h);
    }
    for (let y = 20; y < ARENA.h; y += 20) {
      g.moveTo(0, y);
      g.lineTo(ARENA.w, y);
    }
    g.stroke();

    if (run) {
      g.globalAlpha = 0.3;
      for (let i = 0; i <= at; i += TRAIL_EVERY) {
        const f = run.frames[i];
        if (!f) continue;
        circle(g, f.a, 2.5);
        g.fillStyle = FG;
        g.fill();
        circle(g, f.b, 2.5);
        g.fillStyle = ACCENT;
        g.fill();
      }
      g.globalAlpha = 1;
    }

    if (run?.impact && step >= run.impact.step) {
      const { x, y } = run.impact.at;
      g.strokeStyle = MUTED;
      g.lineWidth = 2 / s;
      g.beginPath();
      g.moveTo(x - 6, y - 6);
      g.lineTo(x + 6, y + 6);
      g.moveTo(x + 6, y - 6);
      g.lineTo(x - 6, y + 6);
      g.stroke();
    }

    if (run?.reconcile && step >= run.reconcile.step) {
      const { from, to } = run.reconcile;
      g.strokeStyle = WARN;
      g.lineWidth = 1.5 / s;
      g.setLineDash([3, 3]);
      g.beginPath();
      g.moveTo(from.x, from.y);
      g.lineTo(to.x, to.y);
      g.stroke();
      g.setLineDash([]);
      circle(g, from, RADIUS);
      g.stroke();
    }

    if (other) {
      const end = lastFrame(other);
      g.lineWidth = 1.5 / s;
      g.setLineDash([4, 4]);
      circle(g, end.a, RADIUS);
      g.strokeStyle = FG;
      g.stroke();
      circle(g, end.b, RADIUS);
      g.strokeStyle = ACCENT;
      g.stroke();
      g.setLineDash([]);
    }

    g.font = `600 13px ${MONO}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    const players: [PlayerId, Pose, string][] = [
      ['a', pose.a, FG],
      ['b', pose.b, ACCENT],
    ];
    for (const [id, p, fill] of players) {
      if (p.pending) arrow(g, p, DIRECTION[id], fill, s);
      circle(g, p, RADIUS);
      g.fillStyle = fill;
      g.fill();
      if (id === owner) {
        circle(g, p, RADIUS + 4);
        g.strokeStyle = fill;
        g.lineWidth = 1.5 / s;
        g.stroke();
      }
      g.fillStyle = SURFACE;
      g.fillText(id.toUpperCase(), p.x, p.y + 1);
    }
    g.restore();
  };

  // One input's life: sent at 0, in flight for the latency, applied on the shared tick at the buffer
  // limit. Arriving before that tick it waits in the buffer; arriving after it, it is late.
  const paintTimeline = ({ g, w, h }: View, latencyMs: number, playMs: number | null): void => {
    const padX = 28;
    const lane = 46;
    const x = (ms: number): number => padX + (ms / TIMELINE_MS) * (w - padX * 2);
    const late = latencyMs > BUFFER_MS;

    g.clearRect(0, 0, w, h);
    g.font = `500 10px ${MONO}`;
    g.textBaseline = 'alphabetic';
    g.lineCap = 'butt';

    g.strokeStyle = RULE;
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(x(0), lane);
    g.lineTo(x(TIMELINE_MS), lane);
    for (let ms = 0; ms <= TIMELINE_MS; ms += INPUT_TICK_MS) {
      g.moveTo(x(ms), lane - 7);
      g.lineTo(x(ms), lane + 7);
    }
    g.stroke();
    g.fillStyle = MUTED;
    g.textAlign = 'center';
    for (let ms = 0; ms <= TIMELINE_MS; ms += INPUT_TICK_MS) g.fillText(String(ms), x(ms), h - 10);
    g.textAlign = 'right';
    g.fillText('ms', w - 4, h - 10);

    g.lineWidth = 4;
    g.strokeStyle = FG;
    g.beginPath();
    g.moveTo(x(0), lane);
    g.lineTo(x(latencyMs), lane);
    g.stroke();
    g.strokeStyle = late ? WARN : OK;
    g.beginPath();
    g.moveTo(x(Math.min(latencyMs, BUFFER_MS)), lane);
    g.lineTo(x(Math.max(latencyMs, BUFFER_MS)), lane);
    g.stroke();

    if (playMs !== null) {
      const px = x(Math.min(playMs, Math.max(latencyMs, BUFFER_MS)));
      g.strokeStyle = FG;
      g.lineWidth = 1.5;
      g.beginPath();
      g.moveTo(px, lane - 17);
      g.lineTo(px, lane + 17);
      g.stroke();
    }

    circle(g, { x: x(0), y: lane }, 5);
    g.fillStyle = FG;
    g.fill();
    const ax = x(BUFFER_MS);
    g.fillStyle = OK;
    g.beginPath();
    g.moveTo(ax, lane - 7);
    g.lineTo(ax + 7, lane);
    g.lineTo(ax, lane + 7);
    g.lineTo(ax - 7, lane);
    g.closePath();
    g.fill();
    if (late) {
      circle(g, { x: x(latencyMs), y: lane }, 5);
      g.fillStyle = SURFACE;
      g.fill();
      g.strokeStyle = WARN;
      g.lineWidth = 2;
      g.stroke();
    }

    let lx = padX - 8;
    const ly = 14;
    const bar = (color: string): void => {
      g.fillStyle = color;
      g.fillRect(lx, ly - 7, 14, 4);
    };
    const mark = (): void => {
      g.fillStyle = OK;
      g.beginPath();
      g.moveTo(lx + 7, ly - 10);
      g.lineTo(lx + 12, ly - 5);
      g.lineTo(lx + 7, ly);
      g.lineTo(lx + 2, ly - 5);
      g.closePath();
      g.fill();
    };
    const legend: [string, () => void][] = [
      ['in flight', () => bar(FG)],
      ['buffered', () => bar(OK)],
      ['late', () => bar(WARN)],
      ['applied', mark],
    ];
    g.textAlign = 'left';
    for (const [label, swatch] of legend) {
      swatch();
      g.fillStyle = MUTED;
      g.fillText(label, lx + 20, ly - 1);
      lx += 20 + g.measureText(label).width + 14;
    }
  };

  // How far apart the two clients leave each player, averaged over both players.
  const averageDeviation = (rA: Run, rB: Run): number => {
    const eA = lastFrame(rA);
    const eB = lastFrame(rB);
    return Math.round((distance(eA.a, eB.a) + distance(eA.b, eB.b)) / 2);
  };

  // How far the remote player jumped when a late input made a client rewind and replay.
  const correctionOf = (run: Run): number => (run.reconcile ? distance(run.reconcile.from, run.reconcile.to) : 0);

  let runs: [Run, Run] | null = null;
  let total = 0;
  let shown = 0;
  let startedAt = 0;
  let raf = 0;

  const render = (step: number): void => {
    shown = step;
    if (viewTimeline) paintTimeline(viewTimeline, Number(latency.value), runs ? step * STEP * 1000 : null);
    if (!runs) {
      paint(viewA, null, 0, 'a', null);
      paint(viewB, null, 0, 'b', null);
      return;
    }
    const [runA, runB] = runs;
    const done = step >= total - 1;
    paint(viewA, runA, step, 'a', done ? runB : null);
    paint(viewB, runB, step, 'b', done ? runA : null);
    deviation.textContent = done ? `${averageDeviation(runA, runB)} px` : NO_DEVIATION;
    if (correctionOut) {
      const corrected = (runA.reconcile?.step ?? Infinity) <= step;
      correctionOut.textContent =
        corrected || done ? `${Math.round(Math.max(correctionOf(runA), correctionOf(runB)))} px` : NO_DEVIATION;
    }
  };

  const tick = (now: number): void => {
    const step = Math.max(0, Math.floor((now - startedAt) / 1000 / STEP));
    render(step);
    if (step < total - 1) raf = requestAnimationFrame(tick);
  };

  const reset = (): void => {
    cancelAnimationFrame(raf);
    runs = null;
    deviation.textContent = NO_DEVIATION;
    if (correctionOut) correctionOut.textContent = NO_DEVIATION;
    render(0);
  };

  play.addEventListener('click', () => {
    cancelAnimationFrame(raf);
    const latencyMs = Number(latency.value);
    const runA = clientRun(mode, 'a', latencyMs);
    const runB = clientRun(mode, 'b', latencyMs);
    runs = [runA, runB];
    total = Math.max(runA.frames.length, runB.frames.length);
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      render(total - 1);
      return;
    }
    startedAt = performance.now();
    raf = requestAnimationFrame(tick);
  });
  latency.addEventListener('input', () => {
    latencyOut.textContent = `${latency.value} ms`;
    reset();
  });
  addEventListener('resize', () => {
    viewA = fit(canvasA) ?? viewA;
    viewB = fit(canvasB) ?? viewB;
    if (timeline) viewTimeline = fit(timeline) ?? viewTimeline;
    render(shown);
  });
  reset();
}

/* ---------- Computer vision: synthetic datapoint generator ---------- */

type Rgb = [number, number, number];
type DebrisKind = 'rock' | 'stick' | 'blob';

interface GatePose {
  x: number;
  y: number;
  angle: number;
  scale: number;
  /** 0 is at the camera, 1 is the far background. */
  depth: number;
}

interface Debris {
  kind: DebrisKind;
  x: number;
  y: number;
  depth: number;
  size: number;
  angle: number;
  color: Rgb;
  outline: number[];
}

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface MaskStats {
  area: number;
  box: Box | null;
}

// The viewBox of the overlay <svg> elements in perception.md must match this size.
const IMG_W = 480;
const IMG_H = 360;
const GATE = { w: 150, h: 100, post: 20 };
const MIN_VISIBLE = 0.2;
const REROLL_LIMIT = 30;
const FLOOR_Y = IMG_H * 0.7;

const FOG: Rgb = [112, 152, 158];
const WATER_TOP: Rgb = [16, 54, 82];
const WATER_DEEP: Rgb = [28, 88, 112];
const FLOOR_FAR: Rgb = [92, 96, 84];
const FLOOR_NEAR: Rgb = [128, 118, 90];
const GATE_FRAME: Rgb = [214, 104, 44];
const GATE_POST: Rgb = [236, 226, 200];
const DEBRIS_KINDS: DebrisKind[] = ['rock', 'stick', 'blob'];
const DEBRIS_COLOR: Record<DebrisKind, Rgb> = {
  rock: [96, 92, 86],
  stick: [118, 88, 58],
  blob: [62, 112, 72],
};

const rand = (min: number, max: number): number => min + Math.random() * (max - min);

const mix = ([r0, g0, b0]: Rgb, [r1, g1, b1]: Rgb, t: number): string =>
  `rgb(${Math.round(r0 + (r1 - r0) * t)}, ${Math.round(g0 + (g1 - g0) * t)}, ${Math.round(b0 + (b1 - b0) * t)})`;

// Share of an element's colour replaced by fog. Far things fade faster, like a depth-threshold pass.
const fogAt = (depth: number, haze: number): number => Math.pow(haze, 1.2) * (0.35 + 0.65 * depth);

function drawGate(g: CanvasRenderingContext2D, pose: GatePose, frame: string, post: string): void {
  const { w, h, post: t } = GATE;
  g.save();
  g.translate(pose.x, pose.y);
  g.rotate(pose.angle);
  g.scale(pose.scale, pose.scale);
  g.beginPath();
  g.rect(-w / 2, -h / 2, w, h);
  g.rect(-w / 2 + t, -h / 2 + t, w - 2 * t, h - 2 * t);
  g.fillStyle = frame;
  g.fill('evenodd');
  // A differently coloured post makes the rotation readable.
  g.fillStyle = post;
  g.fillRect(-w / 2, -h / 2, t, h);
  g.restore();
}

function drawDebris(g: CanvasRenderingContext2D, d: Debris, fill: string): void {
  g.save();
  g.translate(d.x, d.y);
  g.rotate(d.angle);
  g.beginPath();
  if (d.kind === 'stick') {
    g.rect(-d.size * 1.5, -d.size * 0.15, d.size * 3, d.size * 0.3);
  } else if (d.kind === 'blob') {
    g.ellipse(0, 0, d.size, d.size * 0.6, 0, 0, Math.PI * 2);
  } else {
    d.outline.forEach((radius, i) => {
      const a = (i / d.outline.length) * Math.PI * 2;
      const px = Math.cos(a) * radius * d.size;
      const py = Math.sin(a) * radius * d.size * 0.8;
      if (i === 0) g.moveTo(px, py);
      else g.lineTo(px, py);
    });
  }
  g.closePath();
  g.fillStyle = fill;
  g.fill();
  g.restore();
}

function makePose(): GatePose {
  const depth = rand(0.25, 0.7);
  const scale = 1.2 - 0.6 * depth;
  const angle = rand(0, Math.PI * 2);
  const sin = Math.abs(Math.sin(angle));
  const cos = Math.abs(Math.cos(angle));
  // Half the size of the rotated gate's bounding rectangle, so it always lands fully in frame.
  const halfW = ((GATE.w / 2) * cos + (GATE.h / 2) * sin) * scale;
  const halfH = ((GATE.w / 2) * sin + (GATE.h / 2) * cos) * scale;
  const margin = 12;
  return {
    depth,
    scale,
    angle,
    x: rand(halfW + margin, IMG_W - halfW - margin),
    y: rand(halfH + margin, IMG_H - halfH - margin),
  };
}

function makeDebris(pose: GatePose, allowInFront: boolean): Debris[] {
  const reach = (Math.hypot(GATE.w, GATE.h) / 2) * pose.scale;
  return Array.from({ length: Math.floor(rand(7, 15)) }, () => {
    const bearing = rand(0, Math.PI * 2);
    const away = rand(0.2, 1.5) * reach;
    const depth = allowInFront ? rand(0.05, 0.95) : rand(pose.depth + 0.05, 0.95);
    const kind = DEBRIS_KINDS[Math.floor(rand(0, DEBRIS_KINDS.length))] ?? 'rock';
    const [r, gr, b] = DEBRIS_COLOR[kind];
    const shade = rand(-14, 14);
    return {
      kind,
      x: pose.x + Math.cos(bearing) * away,
      y: pose.y + Math.sin(bearing) * away,
      depth,
      size: rand(18, 50) * (1.3 - 0.6 * depth),
      angle: rand(0, Math.PI * 2),
      color: [r + shade, gr + shade, b + shade],
      outline: Array.from({ length: 8 }, () => rand(0.7, 1.15)),
    };
  });
}

function paintImage(g: CanvasRenderingContext2D, pose: GatePose, debris: Debris[], haze: number): void {
  const far = fogAt(1, haze);
  const water = g.createLinearGradient(0, 0, 0, FLOOR_Y);
  water.addColorStop(0, mix(WATER_TOP, FOG, far));
  water.addColorStop(1, mix(WATER_DEEP, FOG, far));
  g.fillStyle = water;
  g.fillRect(0, 0, IMG_W, FLOOR_Y);

  const floor = g.createLinearGradient(0, FLOOR_Y, 0, IMG_H);
  floor.addColorStop(0, mix(FLOOR_FAR, FOG, fogAt(0.8, haze)));
  floor.addColorStop(1, mix(FLOOR_NEAR, FOG, fogAt(0.4, haze)));
  g.fillStyle = floor;
  g.fillRect(0, FLOOR_Y, IMG_W, IMG_H - FLOOR_Y);

  const layers = [
    ...debris.map((d) => ({
      depth: d.depth,
      draw: () => drawDebris(g, d, mix(d.color, FOG, fogAt(d.depth, haze))),
    })),
    {
      depth: pose.depth,
      draw: () => {
        const fog = fogAt(pose.depth, haze);
        drawGate(g, pose, mix(GATE_FRAME, FOG, fog), mix(GATE_POST, FOG, fog));
      },
    },
  ];
  layers.sort((a, b) => b.depth - a.depth).forEach((layer) => layer.draw());
}

// Only debris nearer than the gate can hide it, so those are the only ones that cut the mask.
function paintMask(g: CanvasRenderingContext2D, pose: GatePose, debris: Debris[]): MaskStats {
  g.fillStyle = '#000';
  g.fillRect(0, 0, IMG_W, IMG_H);
  drawGate(g, pose, '#fff', '#fff');
  debris.filter((d) => d.depth < pose.depth).forEach((d) => drawDebris(g, d, '#000'));

  // Snap the antialiased edges to pure black/white while measuring the white pixels.
  const pixels = g.getImageData(0, 0, IMG_W, IMG_H);
  const data = pixels.data;
  let area = 0;
  let minX = IMG_W;
  let minY = IMG_H;
  let maxX = -1;
  let maxY = -1;
  for (let i = 0; i < data.length; i += 4) {
    const on = (data[i] ?? 0) > 127;
    const value = on ? 255 : 0;
    data[i] = value;
    data[i + 1] = value;
    data[i + 2] = value;
    data[i + 3] = 255;
    if (!on) continue;
    const pixel = i / 4;
    const x = pixel % IMG_W;
    const y = Math.floor(pixel / IMG_W);
    area++;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  g.putImageData(pixels, 0, 0);
  return { area, box: area > 0 ? { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 } : null };
}

function initDatapointDemo(): void {
  const imageCanvas = byId('dp-image', HTMLCanvasElement);
  const maskCanvas = byId('dp-mask', HTMLCanvasElement);
  const generate = byId('dp-generate', HTMLButtonElement);
  const imageBox = document.getElementById('dp-image-box');
  const maskBox = document.getElementById('dp-mask-box');
  const caption = document.getElementById('dp-n');
  const hazeOut = document.getElementById('dp-haze');
  const visibleOut = document.getElementById('dp-visible');
  if (!imageCanvas || !maskCanvas || !generate || !imageBox || !maskBox) return;
  if (!caption || !hazeOut || !visibleOut) return;

  imageCanvas.width = maskCanvas.width = IMG_W;
  imageCanvas.height = maskCanvas.height = IMG_H;
  const imageCtx = imageCanvas.getContext('2d');
  const maskCtx = maskCanvas.getContext('2d', { willReadFrequently: true });
  if (!imageCtx || !maskCtx) return;

  let made = 0;
  const run = (): void => {
    const haze = Math.random();
    const pose = makePose();
    const full = paintMask(maskCtx, pose, []).area;
    // Debris is re-rolled until enough of the gate survives; the last tries only place it behind the gate.
    for (let attempt = 0; ; attempt++) {
      const debris = makeDebris(pose, attempt < REROLL_LIMIT);
      const { area, box } = paintMask(maskCtx, pose, debris);
      if (!box || area / full < MIN_VISIBLE) continue;

      paintImage(imageCtx, pose, debris, haze);
      made++;
      caption.textContent = `Datapoint #${made} · ${debris.length} debris`;
      hazeOut.textContent = haze.toFixed(2);
      visibleOut.textContent = `${Math.round((area / full) * 100)}%`;
      for (const rect of [imageBox, maskBox]) {
        rect.setAttribute('x', String(box.x));
        rect.setAttribute('y', String(box.y));
        rect.setAttribute('width', String(box.w));
        rect.setAttribute('height', String(box.h));
      }
      return;
    }
  };

  generate.addEventListener('click', run);
  run();
}

/* ---------- Saucer: concurrent offline edit ---------- */

interface RecordState {
  title: string;
  rating: string;
  rev: string;
  queue: string;
}

interface DeviceState extends RecordState {
  on: boolean;
}

interface SyncStep {
  cap: string;
  a: DeviceState;
  b: DeviceState;
  s: RecordState;
  /** Fields that changed on this step, as `<device>.<field>`. */
  ch: string[];
}

const SYNC_STEPS: SyncStep[] = [
  {
    cap: 'Both devices go offline and edit "Pasta". A changes the rating; B renames it. Each write is saved locally and queued.',
    a: { on: false, title: 'Pasta', rating: '4', rev: '4', queue: 'upsert #a1' },
    b: { on: false, title: 'Pasta 2.0', rating: '3', rev: '4', queue: 'upsert #b1' },
    s: { title: 'Pasta', rating: '3', rev: '4', queue: '—' },
    ch: ['a.rating', 'b.title'],
  },
  {
    cap: 'A reconnects first and pushes its queue. The server stores revision 5 and acknowledges #a1, so a replay would be ignored.',
    a: { on: true, title: 'Pasta', rating: '4', rev: '5', queue: '—' },
    b: { on: false, title: 'Pasta 2.0', rating: '3', rev: '4', queue: 'upsert #b1' },
    s: { title: 'Pasta', rating: '4', rev: '5', queue: 'applied #a1' },
    ch: ['s.rating', 's.rev', 'a.rev', 'a.queue'],
  },
  {
    cap: "B reconnects second. Its upsert arrives last, so it wins: revision 6 keeps B's title and overwrites A's rating.",
    a: { on: true, title: 'Pasta', rating: '4', rev: '5', queue: '—' },
    b: { on: true, title: 'Pasta 2.0', rating: '3', rev: '6', queue: '—' },
    s: { title: 'Pasta 2.0', rating: '3', rev: '6', queue: 'applied #b1' },
    ch: ['s.title', 's.rating', 's.rev', 'b.rev', 'b.queue'],
  },
  {
    cap: "On A's next poll (≤10 s) it pulls revision 6. Every device now holds the same record, with no manual merge.",
    a: { on: true, title: 'Pasta 2.0', rating: '3', rev: '6', queue: '—' },
    b: { on: true, title: 'Pasta 2.0', rating: '3', rev: '6', queue: '—' },
    s: { title: 'Pasta 2.0', rating: '3', rev: '6', queue: '—' },
    ch: ['a.title', 'a.rating', 'a.rev'],
  },
];

const DELTA = '<span class="delta" aria-hidden="true">Δ</span><span class="sr-only"> (changed this step)</span>';
const FIELDS: [keyof RecordState, string][] = [
  ['title', 'title'],
  ['rating', 'rating'],
  ['rev', 'revision'],
  ['queue', 'queue'],
];

function initSyncLab(): void {
  const caption = document.querySelector('.js-caption');
  const stepEl = document.querySelector('.js-step');
  const prev = document.querySelector<HTMLButtonElement>('.js-prev');
  const next = document.querySelector<HTMLButtonElement>('.js-next');
  if (!caption || !stepEl || !prev || !next) return;

  const last = SYNC_STEPS.length - 1;
  let i = Math.min(last, Math.max(0, Number(readStorage('tm-sync-step')) || 0));

  const render = (): void => {
    const step = SYNC_STEPS[i];
    if (!step) return;
    (['a', 'b', 's'] as const).forEach((key) => {
      const device = document.querySelector(`[data-dev="${key}"]`);
      if (!device) return;
      const state = step[key];
      const conn = device.querySelector<HTMLElement>('.conn');
      if ('on' in state && conn) {
        conn.dataset.on = String(state.on);
        conn.textContent = state.on ? 'Online' : 'Offline';
      }
      const rec = device.querySelector('.rec');
      if (!rec) return;
      rec.innerHTML = FIELDS.map(([field, label]) => {
        const hit = step.ch.includes(`${key}.${field}`);
        return `<dt>${label}</dt><dd${hit ? ' class="changed"' : ''}>${state[field]}${hit ? DELTA : ''}</dd>`;
      }).join('');
    });
    caption.textContent = step.cap;
    stepEl.textContent = String(i + 1);
    prev.disabled = i === 0;
    next.disabled = i === last;
    writeStorage('tm-sync-step', String(i));
  };

  prev.addEventListener('click', () => {
    if (i > 0) {
      i--;
      render();
    }
  });
  next.addEventListener('click', () => {
    if (i < last) {
      i++;
      render();
    }
  });
  render();
}

/* ---------- Saucer: import paths ---------- */

interface ImportPath {
  nodes: [string, string][];
  fallback: string;
  note: string;
}

const IMPORT_PATHS: Record<string, ImportPath> = {
  url: {
    nodes: [
      ['Paste URL', 'client'],
      ['Fetch page', 'Cloudflare Worker · Rust IPC on desktop'],
      ['Claude Haiku', 'page text → one or more recipes'],
      ['Draft recipes', 'review, edit, save'],
    ],
    fallback: 'If the model call fails, an ld+json parser reads the structured recipe data most sites already publish.',
    note: 'On desktop, the Tauri shell fetches the page itself through the fetch_recipe_page IPC command.',
  },
  image: {
    nodes: [
      ['Upload photo', 'client'],
      ['/api/extract-photo', 'Express · key stays server-side'],
      ['Claude Haiku', 'vision → ingredients, steps'],
      ['Draft recipes', 'review, edit, save'],
    ],
    fallback: 'None. Photo import requires a server connection.',
    note: 'Works for cookbook pages and handwritten recipe cards, including more than one recipe per photo.',
  },
  text: {
    nodes: [
      ['Upload text', 'client'],
      ['/api/extract-recipe-text', 'Express · key stays server-side'],
      ['Claude Haiku', 'text → structured recipes'],
      ['Draft recipes', 'review, edit, save'],
    ],
    fallback: 'None. Text import requires a server connection.',
    note: 'Every path produces the same data model, so the editor, search index, and sync engine only handle one shape.',
  },
  manual: {
    nodes: [
      ['New recipe', 'client'],
      ['Editor form', 'full form, immediately'],
      ['Local store', 'IndexedDB or Markdown'],
      ['Sync queue', 'upsertRecipe mutation'],
    ],
    fallback: 'Fully offline. The write is queued and pushed on the next connection.',
    note: 'Manual entry goes through the same mutation queue as every other change.',
  },
};

function initImportFlow(): void {
  const pipe = document.getElementById('flow-pipe');
  const note = document.getElementById('flow-note');
  const fallback = document.getElementById('flow-fallback');
  const panel = document.getElementById('flow-panel');
  if (!pipe || !note || !fallback || !panel) return;
  const tabs = [...document.querySelectorAll<HTMLElement>('[role=tab]')];

  const show = (key: string): void => {
    const path = IMPORT_PATHS[key];
    if (!path) return;
    pipe.innerHTML = path.nodes.map(([b, s]) => `<div class="node"><b>${b}</b><span>${s}</span></div>`).join('');
    fallback.textContent = path.fallback;
    note.textContent = path.note;
    tabs.forEach((t) => {
      const on = t.dataset.p === key;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
    });
    panel.setAttribute('aria-labelledby', `tab-${key}`);
    writeStorage('tm-saucer-path', key);
  };

  tabs.forEach((tab, idx) => {
    tab.addEventListener('click', () => show(tab.dataset.p ?? 'url'));
    tab.addEventListener('keydown', (e) => {
      const moves: Record<string, number> = {
        ArrowRight: (idx + 1) % tabs.length,
        ArrowLeft: (idx - 1 + tabs.length) % tabs.length,
        Home: 0,
        End: tabs.length - 1,
      };
      if (!Object.hasOwn(moves, e.key)) return;
      const target = tabs[moves[e.key] ?? 0];
      if (!target) return;
      e.preventDefault();
      target.focus();
      show(target.dataset.p ?? 'url');
    });
  });

  const saved = readStorage('tm-saucer-path');
  show(saved && Object.hasOwn(IMPORT_PATHS, saved) ? saved : 'url');
}

export function initCaseStudyPage(): void {
  scrollSpy([...document.querySelectorAll<HTMLAnchorElement>('.toc a')], '-20% 0px -70% 0px');
  initCollisionLab('col', 'raw');
  initCollisionLab('buf', 'buffered');
  initDatapointDemo();
  initSyncLab();
  initImportFlow();
}
