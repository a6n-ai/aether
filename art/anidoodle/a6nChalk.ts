import { Gfx, rng, type Ctx, type Env, type Medium, type P } from "./core";
import type { Film } from "./film";
import { letter } from "./drafting";
import { blob, fillShape, hatchRuns, inside } from "./gallery";
// a6n chalkboard kit: the moonPhases board and chalk hand (side-of-chalk scumble, dust either side
// of every stroke, ghosts of old lessons), sized for the a6n.ai plates, with a cue clock so every
// plate is also a film of itself being written. Plates: chalkTeam (III), and the rest to follow.

export type Clock = (id: string) => number;
export const done: Clock = () => 1;
export const CHALK_M: Medium = { nib: 2.1, taper: 0.55, pressure: 0.95, retrace: true, wobble: 1.4, rough: 1.2 };
export const CHALK = "#f4f0e6", YEL = "#f6e6a4", BLUE = "#a9d3e8", PINK = "#f3c1cf";
export const W = 1200, H = 800;

export const chalk = (g: Gfx, draw: (dust: boolean) => void, dustAlpha = 0.2) => {
  g.group("plain", () => draw(true), { blur: 3.2, alpha: dustAlpha });
  g.group("plain", () => draw(false), { textures: ["pencilTooth", "risoSpeck"] });
};
export const line = (g: Gfx, dust: boolean, pts: P[], w: number, color: string, seed: number, op = 0.92, wob = 1, progress = 1) => {
  if (progress <= 0) return;
  g.pen(pts, { w: dust ? w * 2.6 : w, color, seed, wobble: wob, boil: 0, opacity: op, retrace: !dust, taper: 1, progress });
};
export const scumble = (g: Gfx, dust: boolean, region: P[], color: string, o: { angle: number; gap: number; w: number; alpha: number; seed: number; progress?: number }) => {
  const { angle, gap, w, alpha, seed, progress = 1 } = o, r = rng(seed);
  if (progress <= 0) return;
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; region.forEach(([x, y]) => { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); });
  const c = g.cur; g.touch(x0 - 12, y0 - 12, x1 + 12, y1 + 12);
  c.save(); c.lineCap = "round"; c.lineJoin = "round"; c.strokeStyle = color; c.lineWidth = dust ? w * 2.2 : w;
  const runs = hatchRuns({ x0, y0, x1, y1 }, angle, gap, (x, y) => inside(region, x, y), 4, seed), upto = progress * runs.length;
  runs.forEach((run, i) => {
    if (i > upto) return;
    const pts = run.filter((_, k, a) => k % 2 === 0 || k === a.length - 1), m = i + 1 > upto ? Math.max(2, Math.ceil(pts.length * (upto - i))) : pts.length;
    c.globalAlpha = alpha * (0.86 + r() * 0.2); c.beginPath();
    pts.slice(0, m).forEach(([x, y], k) => (k ? c.lineTo(x + (r() - 0.5) * 1.5, y + (r() - 0.5) * 1.5) : c.moveTo(x, y)));
    c.stroke();
  });
  c.restore();
};
export const write = (g: Gfx, s: string, x: number, y: number, cap: number, color: string, seed: number, progress: number, align: "left" | "center" | "right" = "center") => {
  if (progress > 0) letter(g, s, x, y, { cap, color, seed, align, w: cap > 24 ? 2.4 : 1.5, opacity: 0.92, progress });
};

// ---------------------------------------------------------------- shapes, as point lists a hand follows
/** A rectangle drawn as four strokes, one after another, so the corners stay corners. */
export const box = (g: Gfx, dust: boolean, x: number, y: number, w: number, h: number, width: number, color: string, seed: number, q: number, op = 0.92) => {
  const sides: [P, P][] = [[[x, y], [x + w, y]], [[x + w, y], [x + w, y + h]], [[x + w, y + h], [x, y + h]], [[x, y + h], [x, y]]];
  sides.forEach(([a, b], i) => line(g, dust, [a, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], b], width, color, seed + i, op, 0.7, Math.max(0, Math.min(1, q * 4 - i))));
};
export const ring = (cx: number, cy: number, rx: number, ry: number, a0 = -0.4, turns = 1.08, n = 22): P[] => Array.from({ length: n + 1 }, (_, k) => { const a = a0 + (k / n) * Math.PI * 2 * turns; return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]; });
export const curve = (a: P, c: P, b: P, n = 14): P[] => Array.from({ length: n + 1 }, (_, i) => { const t = i / n, u = 1 - t; return [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]]; });
/** A chalk arrow along a curve: the shaft, then the head once the shaft is down. */
export const arrow = (g: Gfx, dust: boolean, pts: P[], color: string, seed: number, q: number) => {
  line(g, dust, pts, 1.8, color, seed, 0.85, 1, Math.min(1, q / 0.8));
  const tip = pts[pts.length - 1], pre = pts[pts.length - 3], a = Math.atan2(tip[1] - pre[1], tip[0] - pre[0]);
  line(g, dust, [[tip[0] - Math.cos(a - 0.5) * 18, tip[1] - Math.sin(a - 0.5) * 18], tip, [tip[0] - Math.cos(a + 0.5) * 18, tip[1] - Math.sin(a + 0.5) * 18]], 1.9, color, seed + 1, 0.9, 0.3, Math.max(0, (q - 0.8) / 0.2));
};
/** A teacher's figure: head, body, arms and legs, in that order. */
export const person = (g: Gfx, dust: boolean, x: number, y: number, s: number, seed: number, q: number, arms: "down" | "work" | "out" = "down", color = CHALK) => {
  const st = (i: number) => Math.max(0, Math.min(1, q * 5 - i));
  line(g, dust, ring(x, y, 13 * s, 14 * s, -1.6, 1.05, 16), 2, color, seed, 0.92, 0.6, st(0));
  line(g, dust, [[x, y + 15 * s], [x, y + 62 * s]], 2.2, color, seed + 1, 0.92, 0.8, st(1));
  const arm: [P, P][] = arms === "work" ? [[[x, y + 28 * s], [x + 30 * s, y + 46 * s]], [[x, y + 28 * s], [x + 22 * s, y + 52 * s]]] : arms === "out" ? [[[x, y + 28 * s], [x - 30 * s, y + 40 * s]], [[x, y + 28 * s], [x + 30 * s, y + 40 * s]]] : [[[x, y + 28 * s], [x - 20 * s, y + 54 * s]], [[x, y + 28 * s], [x + 20 * s, y + 54 * s]]];
  arm.forEach(([a, b], i) => line(g, dust, [a, b], 2, color, seed + 2 + i, 0.9, 0.8, st(2 + i * 0.5)));
  line(g, dust, [[x, y + 62 * s], [x - 18 * s, y + 100 * s]], 2.1, color, seed + 4, 0.9, 0.8, st(3.5));
  line(g, dust, [[x, y + 62 * s], [x + 18 * s, y + 100 * s]], 2.1, color, seed + 5, 0.9, 0.8, st(4));
};

// ---------------------------------------------------------------- the board
export const board = (g: Gfx, ctx: Ctx, ck: Clock) => {
  const gr = ctx.createRadialGradient(W * 0.5, H * 0.45, 60, W * 0.5, H * 0.45, W * 0.75);
  gr.addColorStop(0, "#35493f"); gr.addColorStop(0.62, "#27352f"); gr.addColorStop(1, "#1b2622");
  ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
  g.paper("coldpress", 0.3);
  // the eraser's arcs: yesterday's lesson rubbed down to haze, following the felt across
  g.group("plain", () => {
    const r = rng(5);
    for (let i = 0; i < 8; i++) { const cx = 120 + r() * (W - 240), cy = 100 + r() * (H - 200), rr = 110 + r() * 150, a0 = r() * 6; const pts: P[] = []; for (let k = 0; k <= 12; k++) { const a = a0 + (k / 12) * 2.2; pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.55]); } g.pen(pts, { w: 40 + r() * 30, color: CHALK, seed: 6 + i, wobble: 3, boil: 0, opacity: 0.05, retrace: false, taper: 0.4, progress: ck(`swipe${i}`) }); }
  }, { blur: 9 });
  // dust settled along the bottom edge of the board
  g.group("plain", () => { const r = rng(9); for (let i = 0; i < 90; i++) { const x = r() * W, y = H - 6 - r() * 16; fillShape(g, blob(x, y, 0.8 + r() * 1.6, 0.6 + r(), 30 + i, 0.3, 6), CHALK, 0.12 + r() * 0.25); } });
};

// ---------------------------------------------------------------- cue clock (moonPhasesDraw's pattern)
export type Cue = { id: string; a: number; b: number; parts?: string[] };
export const clockOf = (name: string, cues: Cue[], N: number, HOLD: number) => {
  for (const c of cues) if (c.a % 5 || c.b % 5 || c.b <= c.a || c.b > N - HOLD) throw new Error(`${name}: cue ${c.id} (${c.a}-${c.b}) off the grid or past the hold`);
  const m = new Map<string, [number, number]>();
  for (const c of cues) {
    if (!c.parts) { m.set(c.id, [c.a, c.b]); continue; }
    const d = (c.b - c.a) / c.parts.length;
    c.parts.forEach((p, k) => m.set(p, [c.a + k * d, c.a + (k + 1) * d]));
  }
  return (f: number): Clock => (id) => { const s = m.get(id); if (!s || f >= s[1]) return 1; if (f <= s[0]) return 0; return (f - s[0]) / (s[1] - s[0]); };
};
export const chalkFilm = (title: string, N: number, HOLD: number, cues: Cue[], lesson: (g: Gfx, ck: Clock) => void): Film => {
  const at = clockOf(title, cues, N, HOLD);
  const draw = (ctx: Ctx, f: number, env: Env) => {
    const g = new Gfx(ctx, env, 0, CHALK_M), ck = f >= N - HOLD ? done : at(f);
    ctx.setTransform(env.scale, 0, 0, env.scale, 0, 0);
    board(g, ctx, ck);
    lesson(g, ck);
  };
  return { meta: { title, W, H, fps: 30, bpm: 120, durationFrames: N, kind: "drawing", holds: [[N - HOLD, N]] } as Film["meta"], assets: { images: {} }, shots: [{ id: "board", start: 0, end: N, draw }] };
};
