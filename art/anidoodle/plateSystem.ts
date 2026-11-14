import { type Ctx, type Env, Gfx, type P } from "./core";
import type { Film } from "./film";
import { CYAN, DIM, DRAFT, type Kit, blit, border, cut, kit, sheet, slot, stagger, tooth } from "./blueprintKit";
// PLATE II · THE ANATOMY OF A6N · cyanotype drafting sheet (a6n.ai home page).
//
// IDEA: the tools a small business already runs on stand on one bench, each cabled into one hub,
// under an arch set out with the compass around the whole bench: one system, shaped around you.
// FOCAL SUBJECT: the hub with its flywheel, where every cable lands.
// MEDIUM: ruling pen and spring-bow compass in white ink on Prussian cyanotype (blueprintKit),
// front elevation, orthographic, no light. Only the hub is shown in section and section-lined.
// REALISM: a phone on a stand, a laptop open, a till (drawer, pole, customer screen), a card
// terminal with a 3x4 keypad and a card in the slot, a letter, a bar chart hung on two cords.
// ORDER OF MARKS: border, title box, construction (centre line, datum, compass guide), the bench,
// the arch swung, the hub, each tool left to right, the cables, section lining, dimensions,
// balloons 1-6 (the page's legend order), the parts table, notes, the title last.
const N = 540, HOLD = 30;
const CUES: [string, number, number][] = [
  ["border", 0, 40],
  ["titleBox", 40, 60],
  ["construct", 60, 85],
  ["bench", 85, 160],
  ["arch", 160, 185],
  ["hub", 185, 215],
  ["phone", 215, 235],
  ["laptop", 235, 255],
  ["till", 255, 280],
  ["terminal", 280, 305],
  ["letter", 305, 315],
  ["report", 315, 335],
  ["cables", 335, 360],
  ["lining", 360, 380],
  ["dims", 380, 415],
  ["balloons", 415, 445],
  ["table", 445, 475],
  ["notes", 475, 495],
  ["title", 495, 510],
];
{ let t = 0; for (const [id, a, b] of CUES) { if (a % 5 || b % 5) throw new Error(`plateSystem: cue ${id} off the 5-frame grid`); if (a < t) throw new Error(`plateSystem: cue ${id} overlaps`); t = b; } if (t > N - HOLD) throw new Error("plateSystem: hold under 30 frames"); }

// ---------------------------------------------------------------- the plan (aether/src/drawings/system.ts), lifted 300 up
const Y = 300;
const at = (x: number, y: number): P => [x, y - Y];
/** A rounded rectangle as a closed polygon, corners sampled so the pen turns them. */
const rbox = (x: number, y: number, w: number, h: number, r: number): P[] => {
  const out: P[] = [], c: [number, number, number][] = [[x + w - r, y + r, -Math.PI / 2], [x + w - r, y + h - r, 0], [x + r, y + h - r, Math.PI / 2], [x + r, y + r, Math.PI]];
  c.forEach(([cx, cy, a0]) => { for (let i = 0; i <= 4; i++) { const a = a0 + (i / 4) * (Math.PI / 2); out.push(at(cx + Math.cos(a) * r, cy + Math.sin(a) * r)); } });
  return out;
};
const bez = (p0: P, p1: P, p2: P, p3: P, n = 24): P[] => Array.from({ length: n + 1 }, (_, i) => { const t = i / n, u = 1 - t; return [u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1] - Y]; });
const arcPts = (cx: number, cy: number, r: number, x1: number, x2: number, n = 48): P[] => Array.from({ length: n + 1 }, (_, i) => { const x = x1 + ((x2 - x1) * i) / n; return at(x, cy - Math.sqrt(r * r - (x - cx) ** 2)); });
const BENCH = 780;

const rule = (k: Kit, pts: P[], w: number, seed: number, q: number, o: { color?: string; opacity?: number } = {}) => { const n = pts.length, st = stagger(q, n, Math.min(1, 1.6 / n)); pts.forEach((a, i) => k.ln(a, pts[(i + 1) % n], w, { seed: seed + i, taper: 0.15, progress: st(i), ...o })); };
const outline = (k: Kit, pts: P[], w: number, seed: number, q: number) => k.pen(pts, w, { seed, closed: true, wobble: 0.3, taper: 0.2, progress: q });

// ---------------------------------------------------------------- parts
const TB = { x0: 1010, x1: 1366, y0: 772, y1: 876 };
const titleBox = (k: Kit, q: number) => { if (q <= 0) return; k.ink(() => {
  const { x0, x1, y0, y1 } = TB, bq = cut(q, 0, 0.6), lq = cut(q, 0.5, 1);
  [[0, 2.4], [5, 1.1]].forEach(([m, w], j) => rule(k, [[x0 + m, y0 + m], [x1 - m, y0 + m], [x1 - m, y1 - m], [x0 + m, y1 - m]], w, 800 + j * 4, stagger(bq, 2, 0.8)(j)));
  k.ln([x0 + 5, y0 + 58], [x1 - 5, y0 + 58], 1.1, { seed: 812, color: CYAN, progress: lq });
  [x0 + 120, x0 + 240].forEach((x, i) => k.ln([x, y0 + 58], [x, y1 - 5], 1, { seed: 814 + i, color: CYAN, progress: lq }));
}); };

const construct = (k: Kit, q: number) => { if (q <= 0) return; k.ink(() => {
  const s = stagger(q, 4, 0.45), o = { color: DIM, opacity: 0.8 };
  k.chain(at(700, 360), at(700, 1060), 0.75, { ...o, seed: 1000, progress: s(0) });
  k.ln(at(70, BENCH), at(1330, BENCH), 0.6, { ...o, opacity: 0.5, seed: 1001, progress: s(1) });
  k.chainRing(700, 680 - Y, 150, 0.75, { color: CYAN, opacity: 0.55, seed: 1002, progress: s(2), a0: -1.2 });
  // the compass guide the arch is struck from: a faint full sweep just inside it
  k.pen(arcPts(700, 1300, 845, 168, 1232), 0.6, { color: DIM, opacity: 0.45, seed: 1003, progress: s(3) });
}); };

const bench = (k: Kit, q: number) => { if (q <= 0) return; k.ink(() => {
  const s = stagger(q, 5, 0.4);
  outline(k, rbox(120, BENCH, 1160, 30, 6), 1.9, 1100, s(0));
  outline(k, rbox(165, BENCH + 30, 34, 230, 4), 1.6, 1110, s(1));
  outline(k, rbox(1201, BENCH + 30, 34, 230, 4), 1.6, 1120, s(2));
  k.ln(at(199, 1000), at(1201, 1000), 1.5, { seed: 1130, progress: s(3) });
  k.ln(at(199, 1012), at(1201, 1012), 1.5, { seed: 1131, progress: s(3) });
  const ts = stagger(s(4), 23, 0.2);
  for (let i = 0; i < 23; i++) k.ln(at(150 + i * 50, BENCH + 30), at(150 + i * 50, BENCH + (i % 2 ? 38 : 46)), 0.9, { color: CYAN, seed: 1140 + i, progress: ts(i) });
}); };

const arch = (k: Kit, q: number) => { if (q <= 0) return; k.ink(() => {
  k.pen(arcPts(700, 1300, 860, 150, 1250), 1.9, { seed: 1200, wobble: 0, progress: cut(q, 0, 0.6) });
  k.pen(arcPts(700, 1300, 880, 136, 1264), 1.1, { seed: 1201, wobble: 0, color: CYAN, progress: cut(q, 0.45, 1) });
}); };

const hub = (k: Kit, q: number) => { if (q <= 0) return; k.ink(() => {
  outline(k, rbox(610, 610, 180, 170, 14), 1.9, 1300, cut(q, 0, 0.35));
  k.circle(700, 680 - Y, 48, 1.7, { seed: 1301, progress: cut(q, 0.3, 0.55), a0: -1.6 });
  k.circle(700, 680 - Y, 11, 1.4, { seed: 1302, progress: cut(q, 0.5, 0.62), a0: 0.4 });
  const sp = stagger(cut(q, 0.6, 0.85), 6, 0.4);
  for (let i = 0; i < 6; i++) { const a = (i * Math.PI) / 3; k.ln(at(700 + Math.cos(a) * 11, 680 + Math.sin(a) * 11), at(700 + Math.cos(a) * 46, 680 + Math.sin(a) * 46), 1.3, { seed: 1310 + i, progress: sp(i) }); }
  const ps = stagger(cut(q, 0.82, 1), 4, 0.5);
  [628, 648, 752, 772].forEach((x, i) => k.circle(x, 756 - Y, 6, 1.2, { seed: 1320 + i, progress: ps(i) }));
}); };

const phone = (k: Kit, q: number) => { if (q <= 0) return; k.ink(() => {
  const st = stagger(cut(q, 0, 0.25), 3, 0.5); ([[at(168, 780), at(206, 700)], [at(206, 700), at(222, 700)], [at(222, 700), at(198, 780)]] as [P, P][]).forEach(([a, b], i) => k.ln(a, b, 1.5, { seed: 1400 + i * 7, taper: 0.15, progress: st(i) }));
  outline(k, rbox(186, 588, 90, 182, 16), 1.9, 1401, cut(q, 0.2, 0.6));
  outline(k, rbox(196, 606, 70, 144, 6), 1.1, 1402, cut(q, 0.55, 0.85));
  k.ln(at(220, 597), at(242, 597), 1.2, { seed: 1403, progress: cut(q, 0.8, 0.92) });
  k.circle(231, 759 - Y, 5, 1.1, { seed: 1404, progress: cut(q, 0.9, 1) });
}); };

const laptop = (k: Kit, q: number) => { if (q <= 0) return; k.ink(() => {
  outline(k, rbox(345, 598, 200, 160, 9), 1.9, 1500, cut(q, 0, 0.4));
  outline(k, rbox(357, 610, 176, 136, 4), 1.1, 1501, cut(q, 0.35, 0.65));
  rule(k, [at(326, 780), at(338, 760), at(552, 760), at(564, 780)], 1.8, 1502, cut(q, 0.6, 0.9));
  k.ln(at(420, 770), at(470, 770), 1, { seed: 1503, color: CYAN, progress: cut(q, 0.88, 1) });
}); };

const till = (k: Kit, q: number) => { if (q <= 0) return; k.ink(() => {
  outline(k, rbox(880, 700, 210, 80, 8), 1.9, 1600, cut(q, 0, 0.3));
  k.ln(at(892, 738), at(1078, 738), 1.2, { seed: 1601, progress: cut(q, 0.28, 0.4) });
  outline(k, rbox(962, 752, 46, 10, 4), 1.1, 1602, cut(q, 0.38, 0.48));
  outline(k, rbox(975, 628, 20, 72, 4), 1.5, 1603, cut(q, 0.46, 0.6));
  outline(k, rbox(905, 540, 160, 92, 9), 1.9, 1604, cut(q, 0.58, 0.85));
  outline(k, rbox(916, 551, 138, 70, 4), 1.1, 1605, cut(q, 0.82, 1));
}); };

const terminal = (k: Kit, q: number) => { if (q <= 0) return; k.ink(() => {
  outline(k, rbox(1140, 600, 82, 180, 18), 1.9, 1700, cut(q, 0, 0.3));
  outline(k, rbox(1152, 614, 58, 50, 4), 1.1, 1701, cut(q, 0.28, 0.42));
  const ks = stagger(cut(q, 0.4, 0.85), 12, 0.2);
  for (let i = 0; i < 12; i++) outline(k, rbox(1154 + (i % 3) * 19, 680 + Math.floor(i / 3) * 21, 14, 14, 3), 0.9, 1710 + i, ks(i));
  outline(k, rbox(1158, 566, 46, 40, 4), 1.3, 1730, cut(q, 0.82, 1));
}); };

const letter = (k: Kit, q: number) => { if (q <= 0) return; k.ink(() => {
  rule(k, [at(792, 780), at(806, 716), at(866, 728), at(852, 780)], 1.6, 1800, cut(q, 0, 0.65));
  k.ln(at(806, 716), at(832, 754), 1.1, { seed: 1806, progress: cut(q, 0.6, 0.8) });
  k.ln(at(832, 754), at(866, 728), 1.1, { seed: 1807, progress: cut(q, 0.78, 1) });
}); };

const report = (k: Kit, q: number) => { if (q <= 0) return; k.ink(() => {
  k.ln(at(652, 446), at(652, 476), 1, { seed: 1900, color: CYAN, progress: cut(q, 0, 0.12) });
  k.ln(at(748, 446), at(748, 476), 1, { seed: 1901, color: CYAN, progress: cut(q, 0.06, 0.18) });
  outline(k, rbox(630, 476, 140, 96, 6), 1.8, 1902, cut(q, 0.15, 0.45));
  const bs = stagger(cut(q, 0.45, 0.85), 4, 0.4);
  ([[648, 34], [676, 52], [704, 44], [732, 70]] as [number, number][]).forEach(([x, h], i) => outline(k, rbox(x, 560 - h, 18, h, 2), 1.2, 1910 + i, bs(i)));
  const ls = stagger(cut(q, 0.82, 1), 3, 0.5); ([[at(646, 520), at(684, 506)], [at(684, 506), at(712, 512)], [at(712, 512), at(752, 488)]] as [P, P][]).forEach(([a, b], i) => k.ln(a, b, 1.1, { seed: 1920 + i * 3, color: CYAN, progress: ls(i) }));
}); };

const CABLES: [P, P, P, P][] = [[[231, 770], [300, 812], [540, 812], [628, 762]], [[470, 776], [540, 806], [600, 806], [648, 762]], [[900, 780], [830, 806], [790, 806], [752, 762]], [[1180, 780], [1080, 818], [860, 818], [772, 762]]];
const cables = (k: Kit, q: number) => { if (q <= 0) return; k.ink(() => {
  const cs = stagger(q, 4, 0.4);
  CABLES.forEach((c, i) => k.pen(bez(...c), 1.5, { seed: 2000 + i, wobble: 0.6, progress: cs(i) }));
}); };

// the hub is drawn in section: lined at 45 degrees, stopping just inside the case
const lining = (k: Kit, q: number) => { if (q <= 0) return; k.ink(() => {
  k.hatch(rbox(616, 616, 168, 158, 10), 45, 9, 0.85, 2100, { color: CYAN, opacity: 0.8, progress: q });
}); };

const dims = (k: Kit, q: number) => { if (q <= 0) return; k.ink(() => {
  const s = stagger(q, 3, 0.45);
  k.dim(at(120, 1060), at(1280, 1060), 34, "1160", 2200, s(0), { cap: 10, gap: 4, ext: 4 });
  k.dim(at(610, 610), at(790, 610), 26, "180", 2210, s(1), { cap: 9, gap: 3, ext: 3 });
  k.dim(at(1300, 440), at(1300, BENCH), 0, "340", 2220, s(2), { cap: 9, gap: 3, ext: 3 });
}); };

// balloons 1-6 in the order of the page's legend: website, app, payments, messages, staff screen, reports
export const BALLOONS: [P, P][] = [
  [at(445, 560), at(445, 600)],
  [at(150, 560), at(196, 600)],
  [at(1262, 560), at(1220, 610)],
  [at(890, 690), at(850, 735)],
  [at(985, 505), at(985, 541)],
  [at(590, 450), at(632, 490)],
];
const balloons = (k: Kit, q: number) => { if (q <= 0) return; k.ink(() => {
  const bs = stagger(q, 6, 0.35);
  BALLOONS.forEach(([b, to], i) => k.balloon(String(i + 1), b, to, 2300 + i * 3, bs(i)));
}); };

const PARTS = ["WEBSITE", "CUSTOMER APP", "PAYMENTS", "MESSAGES", "STAFF SCREEN", "REPORTS"];
const table = (k: Kit, q: number) => { if (q <= 0) return; k.ink(() => {
  const x0 = 1100, x1 = 1366, y0 = 52, rh = 17, yb = y0 + rh * (PARTS.length + 1), fq = cut(q, 0, 0.2), hq = cut(q, 0.15, 0.35), rq = cut(q, 0.3, 1), cx = x0 + 34;
  rule(k, [[x0, y0], [x1, y0], [x1, yb], [x0, yb]], 1.5, 2400, fq);
  k.ln([x0, y0 + rh], [x1, y0 + rh], 1.3, { seed: 2405, progress: hq });
  k.ln([cx, y0], [cx, yb], 0.95, { seed: 2406, color: CYAN, progress: hq });
  k.text("NO.", (x0 + cx) / 2, y0 + 4, { cap: 8, align: "center", seed: 2410, color: CYAN, w: 1, progress: hq });
  k.text("PART", cx + 8, y0 + 4, { cap: 8, seed: 2411, color: CYAN, w: 1, progress: hq });
  const rs = stagger(rq, PARTS.length, 0.35);
  PARTS.forEach((t, i) => { const y = y0 + rh * (i + 1), qq = rs(i); if (qq <= 0) return; if (i) k.ln([x0, y], [x1, y], 0.7, { seed: 2420 + i, color: DIM, opacity: 0.7, progress: cut(qq, 0, 0.25) }); k.text(String(i + 1), (x0 + cx) / 2, y + 4, { cap: 8, align: "center", seed: 2430 + i, w: 1.05, progress: cut(qq, 0.2, 0.4) }); k.text(t, cx + 8, y + 4, { cap: 8, seed: 2440 + i, w: 1.05, progress: cut(qq, 0.35, 1) }); });
}); };

const NOTES = ["NOTES", "1. EVERY TOOL CABLED TO ONE HUB", "2. ARCH STRUCK ROUND THE WHOLE BENCH", "3. HUB RUNS DAY AND NIGHT"];
const notes = (k: Kit, q: number) => { if (q <= 0) return; k.ink(() => {
  const ns = stagger(q, NOTES.length, 0.35);
  NOTES.forEach((t, i) => k.text(t, 56, 56 + i * 19 + (i ? 6 : 0), { cap: i ? 8.5 : 11, seed: 2500 + i * 3, w: i ? 1.05 : 1.5, progress: ns(i) }));
}); };

const title = (k: Kit, q: number) => { if (q <= 0) return; k.ink(() => {
  const { x0, x1, y0 } = TB, f = cut(q, 0, 0.45), tq = cut(q, 0.45, 1);
  ([["PLATE", "II", x0 + 60], ["SCALE", "1 : 10", x0 + 180], ["SHEET", "1 OF 1", x0 + 298]] as [string, string, number][]).forEach(([a, v, x], i) => { const qq = stagger(f, 3, 0.55)(i); k.text(a, x, y0 + 64, { cap: 7, align: "center", seed: 2600 + i, color: CYAN, w: 0.95, progress: cut(qq, 0, 0.5) }); k.text(v, x, y0 + 77, { cap: 11, align: "center", seed: 2603 + i, w: 1.5, progress: cut(qq, 0.4, 1) }); });
  k.text("THE ANATOMY OF A6N", (x0 + x1) / 2, y0 + 18, { cap: 17, align: "center", seed: 2610, w: 2.1, progress: tq });
}); };

// ---------------------------------------------------------------- composition (blueprint.ts's stack pattern)
type Part = (k: Kit, q: number) => void;
const PART: Record<string, Part> = { border: (k, q) => border(k, q), titleBox, construct, bench, arch, hub, phone, laptop, till, terminal, letter, report, cables, lining, dims, balloons, table, notes, title };
const progressAt = (f: number, a: number, b: number) => (f >= b ? 1 : f <= a ? 0 : (f - a) / (b - a));
const stack = (env: Env, n: number) => {
  const s = slot(env, "stack"), have = s.key === null ? -1 : Number(s.key);
  if (have === n) return s.L;
  const g = new Gfx(s.L.ctx, env, 0, DRAFT), k = kit(g);
  let from = have;
  if (have < 0 || have > n) { s.L.ctx.setTransform(1, 0, 0, 1, 0, 0); s.L.ctx.clearRect(0, 0, s.L.canvas.width, s.L.canvas.height); g.cur = s.L.ctx; sheet(k); from = 0; }
  for (let i = from; i < n; i++) PART[CUES[i][0]](k, 1);
  s.key = String(n); return s.L;
};
const draw = (ctx: Ctx, frame: number, env: Env) => {
  const f = Math.max(0, Math.min(N - 1, frame)), n = CUES.filter(([, , b]) => f >= b).length;
  blit(ctx, stack(env, n));
  const g = new Gfx(ctx, env, 0, DRAFT), k = kit(g);
  CUES.forEach(([id, a, b], i) => { if (i < n) return; const q = progressAt(f, a, b); if (q > 0) PART[id](k, q); });
  tooth(g);
};

export const plateSystem: Film = {
  meta: { title: "Plate II · The anatomy of a6n · cyanotype", W: 1400, H: 900, fps: 30, bpm: 120, durationFrames: N, kind: "drawing", holds: [[N - HOLD, N]] } as Film["meta"],
  assets: { images: {} },
  shots: [{ id: "plate", start: 0, end: N, draw }],
};
