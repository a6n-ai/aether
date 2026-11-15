import { type Ctx, type Env, Gfx, type P } from "./core";
import type { Film } from "./film";
import { CYAN, DIM, DRAFT, type Kit, blit, border, cut, kit, packCues, sheet, slot, stagger, tooth } from "./leoKit";
// a6n STATION SHEETS · sepia drafting in Leonardo's manner (leoKit), for the plates that show how a
// system is built: four stations on one bench line, one per step, each a front elevation of a real
// thing (a phone, a till, a terminal, a tin), joined left to right by red-chalk flow arrows, numbered by
// balloons, listed in a steps table, washed in ochre, verdigris and red chalk, the title written last.
// Station centres (the light's spots on the page): x = 230, 545, 860, 1175 at y = 520, on a 1400 x 900 sheet.

export const SX = [230, 545, 860, 1175], BASE = 660, CY = 520;
export const N = 540, HOLD = 30;
export type Wash = [P[], string, number];
export type Station = { draw: (k: Kit, q: number, cx: number) => void; wash?: (cx: number) => Wash[] };

/** A rounded rectangle as a closed polygon, corners sampled so the pen turns them. */
export const rbox = (x: number, y: number, w: number, h: number, r: number): P[] => {
  const out: P[] = [], c: [number, number, number][] = [[x + w - r, y + r, -Math.PI / 2], [x + w - r, y + h - r, 0], [x + r, y + h - r, Math.PI / 2], [x + r, y + r, Math.PI]];
  c.forEach(([cx, cy, a0]) => { for (let i = 0; i <= 4; i++) { const a = a0 + (i / 4) * (Math.PI / 2); out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } });
  return out;
};
export const rule = (k: Kit, pts: P[], w: number, seed: number, q: number, o: { color?: string; opacity?: number; closed?: boolean } = {}) => {
  const closed = o.closed ?? true, n = closed ? pts.length : pts.length - 1, st = stagger(q, n, Math.min(1, 1.6 / n));
  for (let i = 0; i < n; i++) k.ln(pts[i], pts[(i + 1) % pts.length], w, { seed: seed + i, taper: 0.15, progress: st(i), color: o.color, opacity: o.opacity });
};
export const outline = (k: Kit, pts: P[], w: number, seed: number, q: number) => k.pen(pts, w, { seed, closed: true, wobble: 0.3, taper: 0.2, progress: q });
/** Parts of one station drawn in turn: each gets its slice of the station's progress. */
export const steps = (q: number, n: number) => (i: number) => cut(q, i / n, (i + 1) / n);

// ---------------------------------------------------------------- shared objects (front elevation)
export const phone = (k: Kit, q: number, cx: number, base: number, seed: number, h = 170) => {
  const s = steps(q, 3), w = h * 0.5, x = cx - w / 2, y = base - h;
  outline(k, rbox(x, y, w, h, 12), 1.9, seed, s(0));
  outline(k, rbox(x + 7, y + 16, w - 14, h - 38, 4), 1.1, seed + 1, s(1));
  k.circle(cx, base - 11, 4, 1, { seed: seed + 2, progress: s(2) });
};
export const screenRows = (k: Kit, q: number, cx: number, top: number, w: number, rows: number, seed: number, color = CYAN) => {
  const st = stagger(q, rows, 0.4);
  for (let i = 0; i < rows; i++) k.ln([cx - w / 2, top + i * 18], [cx + w / 2 - (i % 2) * 14, top + i * 18], 1.1, { seed: seed + i, color, progress: st(i) });
};
export const laptop = (k: Kit, q: number, cx: number, base: number, seed: number) => {
  const s = steps(q, 3);
  outline(k, rbox(cx - 95, base - 160, 190, 140, 8), 1.9, seed, s(0));
  outline(k, rbox(cx - 84, base - 149, 168, 118, 4), 1.1, seed + 1, s(1));
  rule(k, [[cx - 112, base], [cx - 100, base - 20], [cx + 100, base - 20], [cx + 112, base]], 1.8, seed + 2, s(2));
};
export const till = (k: Kit, q: number, cx: number, base: number, seed: number) => {
  const s = steps(q, 4);
  outline(k, rbox(cx - 100, base - 76, 200, 76, 8), 1.9, seed, s(0));
  k.ln([cx - 88, base - 40], [cx + 88, base - 40], 1.2, { seed: seed + 1, progress: s(1) });
  outline(k, rbox(cx - 10, base - 148, 20, 72, 4), 1.5, seed + 2, s(2));
  outline(k, rbox(cx - 76, base - 240, 152, 92, 9), 1.9, seed + 3, s(3));
};
export const terminal = (k: Kit, q: number, cx: number, base: number, seed: number) => {
  const s = steps(q, 3);
  outline(k, rbox(cx - 40, base - 176, 80, 176, 16), 1.9, seed, s(0));
  outline(k, rbox(cx - 28, base - 162, 56, 46, 4), 1.1, seed + 1, s(1));
  const ks = stagger(s(2), 12, 0.2);
  for (let i = 0; i < 12; i++) outline(k, rbox(cx - 28 + (i % 3) * 19, base - 104 + Math.floor(i / 3) * 21, 14, 14, 3), 0.9, seed + 10 + i, ks(i));
};
export const envelope = (k: Kit, q: number, x: number, y: number, w: number, seed: number) => {
  const h = w * 0.62;
  rule(k, [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], 1.5, seed, cut(q, 0, 0.6));
  rule(k, [[x, y], [x + w / 2, y + h * 0.55], [x + w, y]], 1.1, seed + 5, cut(q, 0.55, 1), { closed: false });
};
export const tick = (k: Kit, q: number, x: number, y: number, s: number, seed: number) => rule(k, [[x, y], [x + 12 * s, y + 12 * s], [x + 34 * s, y - 14 * s]], 2.4, seed, q, { closed: false, color: CYAN });

// ---------------------------------------------------------------- the sheet
const TB = { x0: 1010, x1: 1366, y0: 772, y1: 876 };
export const stationSheet = (o: { title: string; plate: string; labels: string[]; notes: string[]; stations: Station[]; bare?: boolean }): Film => {
  const { title, plate, labels, notes, stations, bare = false } = o;
  const ALL: [string, number, number][] = [["border", 0, 40], ["titleBox", 40, 60], ["construct", 60, 85]];
  // stations overlap by 10 frames: the next one starts while the last one's wash is still going in
  stations.forEach((_, i) => ALL.push([`s${i}`, 85 + i * 50, 145 + i * 50]));
  ALL.push(["flow", 295, 310], ["balloons", 310, 330], ["table", 330, 370], ["notes", 370, 420], ["title", 420, 510]);
  const { cues: CUES, N: NF, holdFrom } = bare ? packCues(ALL, ["border", "titleBox", "table", "notes", "title"], HOLD) : { cues: ALL, N, holdFrom: N - HOLD };

  const titleBox = (k: Kit, q: number) => { if (q <= 0) return; k.ink(() => {
    const { x0, x1, y0, y1 } = TB, bq = cut(q, 0, 0.6), lq = cut(q, 0.5, 1);
    [[0, 2.4], [5, 1.1]].forEach(([m, w], j) => rule(k, [[x0 + m, y0 + m], [x1 - m, y0 + m], [x1 - m, y1 - m], [x0 + m, y1 - m]], w, 800 + j * 4, stagger(bq, 2, 0.8)(j)));
    k.ln([x0 + 5, y0 + 58], [x1 - 5, y0 + 58], 1.1, { seed: 812, color: CYAN, progress: lq });
    [x0 + 120, x0 + 240].forEach((x, i) => k.ln([x, y0 + 58], [x, y1 - 5], 1, { seed: 814 + i, color: CYAN, progress: lq }));
  }); };
  const construct = (k: Kit, q: number) => { if (q <= 0) return; k.ink(() => {
    const s = stagger(q, 2, 0.6), o = { color: DIM, opacity: 0.8 };
    k.ln([70, BASE], [1330, BASE], 0.7, { ...o, seed: 900, progress: s(0) });
    const cs = stagger(s(1), SX.length, 0.5);
    SX.forEach((x, i) => k.chain([x, 330], [x, 690], 0.75, { ...o, seed: 910 + i, progress: cs(i) }));
  }); };
  const flow = (k: Kit, q: number) => { if (q <= 0) return; k.ink(() => {
    const fs = stagger(q, SX.length - 1, 0.45);
    for (let i = 0; i + 1 < SX.length; i++) {
      const a: P = [SX[i] + 118, CY - 140], b: P = [SX[i + 1] - 118, CY - 140], qq = fs(i);
      k.ln(a, b, 2.2, { seed: 950 + i, color: CYAN, progress: cut(qq, 0, 0.85) });
      if (qq >= 0.85) k.arrow(b, 0, 12, CYAN);
    }
  }); };
  const balloons = (k: Kit, q: number) => { if (q <= 0) return; k.ink(() => { const bs = stagger(q, SX.length, 0.35); SX.forEach((x, i) => k.balloon(String(i + 1), [x - 70, 330], [x - 24, 372], 1000 + i * 3, bs(i))); }); };
  const table = (k: Kit, q: number) => { if (q <= 0) return; k.ink(() => {
    const x0 = 1050, x1 = 1366, y0 = 52, rh = 17, yb = y0 + rh * (labels.length + 1), fq = cut(q, 0, 0.2), hq = cut(q, 0.15, 0.35), rq = cut(q, 0.3, 1), cx = x0 + 34;
    rule(k, [[x0, y0], [x1, y0], [x1, yb], [x0, yb]], 1.5, 1100, fq);
    k.ln([x0, y0 + rh], [x1, y0 + rh], 1.3, { seed: 1105, progress: hq });
    k.ln([cx, y0], [cx, yb], 0.95, { seed: 1106, color: CYAN, progress: hq });
    k.text("NO.", (x0 + cx) / 2, y0 + 4, { cap: 8, align: "center", seed: 1110, color: CYAN, w: 1, progress: hq });
    k.text("STEP", cx + 8, y0 + 4, { cap: 8, seed: 1111, color: CYAN, w: 1, progress: hq });
    const rs = stagger(rq, labels.length, 0.35);
    labels.forEach((t, i) => { const y = y0 + rh * (i + 1), qq = rs(i); if (qq <= 0) return; if (i) k.ln([x0, y], [x1, y], 0.7, { seed: 1120 + i, color: DIM, opacity: 0.7, progress: cut(qq, 0, 0.25) }); k.text(String(i + 1), (x0 + cx) / 2, y + 4, { cap: 8, align: "center", seed: 1130 + i, w: 1.05, progress: cut(qq, 0.2, 0.4) }); k.text(t.toUpperCase(), cx + 8, y + 4, { cap: 8, seed: 1140 + i, w: 1.05, progress: cut(qq, 0.35, 1) }); });
  }); };
  const notesPart = (k: Kit, q: number) => { if (q <= 0) return; k.ink(() => { const lines = ["NOTES", ...notes.map((t, i) => `${i + 1}. ${t}`)], ns = stagger(q, lines.length, 0.35); lines.forEach((t, i) => k.text(t, 56, 56 + i * 19 + (i ? 6 : 0), { cap: i ? 8.5 : 11, seed: 1200 + i * 3, w: i ? 1.05 : 1.5, progress: ns(i) })); }); };
  const titlePart = (k: Kit, q: number) => { if (q <= 0) return; k.ink(() => {
    const { x0, x1, y0 } = TB, f = cut(q, 0, 0.45), tq = cut(q, 0.45, 1);
    ([["PLATE", plate, x0 + 60], ["SCALE", "1 : 10", x0 + 180], ["SHEET", "1 OF 1", x0 + 298]] as [string, string, number][]).forEach(([a, v, x], i) => { const qq = stagger(f, 3, 0.55)(i); k.text(a, x, y0 + 64, { cap: 7, align: "center", seed: 1300 + i, color: CYAN, w: 0.95, progress: cut(qq, 0, 0.5) }); k.text(v, x, y0 + 77, { cap: 11, align: "center", seed: 1303 + i, w: 1.5, progress: cut(qq, 0.4, 1) }); });
    k.text(title, (x0 + x1) / 2, y0 + 18, { cap: title.length > 18 ? 14 : 17, align: "center", seed: 1310, w: 2.1, progress: tq });
  }); };

  type Part = (k: Kit, q: number) => void;
  const PART: Record<string, Part> = { border: (k, q) => border(k, q), titleBox, construct, flow, balloons, table, notes: notesPart, title: titlePart };
  // each station: its marks over the first three quarters of its slot, then its wash flooded in (the wash is
  // what keeps a thin-lined station from reading as dead air)
  stations.forEach((st, i) => { PART[`s${i}`] = (k, q) => { if (q <= 0) return; k.ink(() => st.draw(k, cut(q, 0, 0.75), SX[i])); const w = cut(q, 0.75, 1); if (w > 0) (st.wash?.(SX[i]) ?? []).forEach(([pts, c, a]) => k.fill(pts, c, a * w)); }; });
  const progressAt = (f: number, a: number, b: number) => (f >= b ? 1 : f <= a ? 0 : (f - a) / (b - a));
  const stack = (env: Env, n: number) => {
    const s = slot(env, "stack"), have = s.key === null ? -1 : Number(s.key);
    if (have === n) return s.L;
    const g = new Gfx(s.L.ctx, env, 0, DRAFT), k = kit(g);
    let from = have;
    if (have < 0 || have > n) { s.L.ctx.setTransform(1, 0, 0, 1, 0, 0); s.L.ctx.clearRect(0, 0, s.L.canvas.width, s.L.canvas.height); g.cur = s.L.ctx; sheet(k, { bare }); from = 0; }
    for (let i = from; i < n; i++) PART[CUES[i][0]](k, 1);
    s.key = String(n); return s.L;
  };
  const draw = (ctx: Ctx, frame: number, env: Env) => {
    const f = Math.max(0, Math.min(NF - 1, frame)), n = CUES.filter(([, , b]) => f >= b).length;
    blit(ctx, stack(env, n));
    const g = new Gfx(ctx, env, 0, DRAFT), k = kit(g);
    CUES.forEach(([id, a, b], i) => { if (i < n) return; const q = progressAt(f, a, b); if (q > 0) PART[id](k, q); });
    if (!bare) tooth(g);
  };
  return { meta: { title: `Plate ${plate} · ${title} · sepia drafting${bare ? " · bare" : ""}`, W: 1400, H: 900, fps: 30, bpm: 120, durationFrames: NF, kind: "drawing", holds: [[holdFrom, NF]] } as Film["meta"], assets: { images: {} }, shots: [{ id: "plate", start: 0, end: NF, draw }] };
};
