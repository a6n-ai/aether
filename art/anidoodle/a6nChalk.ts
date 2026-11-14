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
// Leonardo's trois crayons on toned paper: red chalk carries the drawing, black chalk the accents,
// white chalk the lights, with ochre and verdigris washes. (Names kept from the slate version.)
export const CHALK = "#8e3a22", YEL = "#9a5f14", BLUE = "#3f7560", PINK = "#2e2520", WHITE = "#f8f1e2";
export const W = 1200, H = 800;

export const chalk = (g: Gfx, draw: (dust: boolean) => void, dustAlpha = 0.2) => {
  g.group("plain", () => draw(true), { blur: 3.2, alpha: dustAlpha });
  g.group("plain", () => draw(false), { textures: ["pencilTooth", "risoSpeck"] });
};
export const line = (g: Gfx, dust: boolean, pts: P[], w: number, color: string, seed: number, op = 0.92, wob = 1, progress = 1) => {
  if (progress <= 0) return;
  g.pen(pts, { w: dust ? w * 2.6 : w, color, seed, wobble: wob, boil: 0, opacity: op, retrace: !dust, taper: 1, progress });
};
// Leonardo hatched left-handed: strokes run down from upper left to lower right (angle about +0.85).
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
  // a sheet prepared with a warm ground, paler where the light falls, darker and foxed at the edges
  const gr = ctx.createRadialGradient(W * 0.48, H * 0.42, 60, W * 0.5, H * 0.5, W * 0.78);
  gr.addColorStop(0, "#e3d2ad"); gr.addColorStop(0.6, "#d4bd92"); gr.addColorStop(1, "#b89c70");
  ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
  g.paper("coldpress", 0.35);
  g.group("plain", () => { const r = rng(17); for (let i = 0; i < 26; i++) { const x = r() * W, y = r() * H, edge = Math.min(x, y, W - x, H - y) < 120; if (!edge && r() < 0.7) continue; fillShape(g, blob(x, y, 3 + r() * 9, 2 + r() * 7, 60 + i, 0.4, 10), "#9c7440", 0.08 + r() * 0.12); } }, { blur: 2 });
  // the eraser's arcs: yesterday's lesson rubbed down to haze, following the felt across
  g.group("plain", () => {
    const r = rng(5);
    for (let i = 0; i < 8; i++) { const cx = 120 + r() * (W - 240), cy = 100 + r() * (H - 200), rr = 110 + r() * 150, a0 = r() * 6; const pts: P[] = []; for (let k = 0; k <= 12; k++) { const a = a0 + (k / 12) * 2.2; pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.55]); } g.pen(pts, { w: 40 + r() * 30, color: "#7a5a36", seed: 6 + i, wobble: 3, boil: 0, opacity: 0.06, retrace: false, taper: 0.4, progress: ck(`swipe${i}`) }); }
  }, { blur: 9 });
  // dust settled along the bottom edge of the board
  g.group("plain", () => { const r = rng(9); for (let i = 0; i < 90; i++) { const x = r() * W, y = H - 6 - r() * 16; fillShape(g, blob(x, y, 0.8 + r() * 1.6, 0.6 + r(), 30 + i, 0.3, 6), CHALK, 0.08 + r() * 0.15); } });
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

// ---------------------------------------------------------------- shared subjects
/** The kiosk (Plates V and VII): counter, posts, roof, awning scumbled in stripes, the OPEN sign. Origin is the counter's bottom centre. */
export const kiosk = (g: Gfx, dust: boolean, x: number, y: number, s: number, seed: number, q: number, color = CHALK) => {
  const st = (i: number, n = 5) => Math.max(0, Math.min(1, q * n - i)), w = 200 * s, h = 70 * s, top = y - 210 * s;
  box(g, dust, x - w / 2, y - h, w, h, 2.4, CHALK, seed, st(0), 0.95);
  line(g, dust, [[x - w / 2 + 12 * s, y - h], [x - w / 2 + 12 * s, top + 40 * s]], 2.2, CHALK, seed + 5, 0.92, 0.6, st(1));
  line(g, dust, [[x + w / 2 - 12 * s, y - h], [x + w / 2 - 12 * s, top + 40 * s]], 2.2, CHALK, seed + 6, 0.92, 0.6, st(1));
  line(g, dust, [[x - w / 2 - 14 * s, top + 40 * s], [x, top], [x + w / 2 + 14 * s, top + 40 * s]], 2.4, CHALK, seed + 7, 0.95, 0.6, st(2));
  const n = 5, sw = (w + 20 * s) / n, ax = x - w / 2 - 10 * s;
  for (let i = 0; i < n; i++) {
    const x0 = ax + i * sw, sc: P[] = [[x0, top + 40 * s], [x0 + sw, top + 40 * s], [x0 + sw, top + 70 * s], ...Array.from({ length: 6 }, (_, k): P => [x0 + sw - (k / 5) * sw, top + 70 * s + Math.sin((k / 5) * Math.PI) * 12 * s])];
    scumble(g, dust, sc, i % 2 ? WHITE : color, { angle: 1.2, gap: 3.2, w: 3.6, alpha: 0.42, seed: seed + 10 + i, progress: Math.max(0, Math.min(1, st(3) * n - i)) });
  }
  if (st(4) > 0) { box(g, dust, x - 34 * s, y - h + 14 * s, 68 * s, 28 * s, 1.6, YEL, seed + 20, st(4)); write(g, "OPEN", x, y - h + 20 * s, 15 * s, YEL, seed + 25, Math.max(0, st(4) * 2 - 1)); }
};
/** A sheet of paper with ruled lines, slightly turned. */
export const paper = (g: Gfx, dust: boolean, x: number, y: number, w: number, h: number, tilt: number, seed: number, q: number, color = CHALK) => {
  const c = Math.cos(tilt), sn = Math.sin(tilt), p = (u: number, v: number): P => [x + u * c - v * sn, y + u * sn + v * c];
  const st = (i: number) => Math.max(0, Math.min(1, q * 2 - i));
  const sides: [P, P][] = [[p(0, 0), p(w, 0)], [p(w, 0), p(w, h)], [p(w, h), p(0, h)], [p(0, h), p(0, 0)]];
  sides.forEach(([a, b], i) => line(g, dust, [a, b], 1.9, color, seed + 10 + i, 0.9, 0.4, Math.max(0, Math.min(1, st(0) * 4 - i))));
  for (let i = 1; i < 5; i++) line(g, dust, [p(10, (h * i) / 5), p(w - 10 - (i % 2) * 18, (h * i) / 5)], 1.1, color, seed + i, 0.6, 0.4, Math.max(0, Math.min(1, st(1) * 4 - (i - 1))));
};

/** A polyline drawn segment by segment, so every corner stays a corner. */
export const ruled = (g: Gfx, dust: boolean, pts: P[], w: number, color: string, seed: number, q: number, op = 0.92) => {
  const n = pts.length - 1;
  for (let i = 0; i < n; i++) line(g, dust, [pts[i], pts[i + 1]], w, color, seed + i, op, 0.5, Math.max(0, Math.min(1, q * n - i)));
};
