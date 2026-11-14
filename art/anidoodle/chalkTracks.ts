import type { Gfx, P } from "./core";
import { BLUE, CHALK, type Clock, type Cue, PINK, YEL, arrow, box, chalk, chalkFilm, curve, kiosk, line, paper, ring, ruled, scumble, write } from "./a6nChalk";
// PLATES V, VI, VII · "Start where you are" · three chalkboards that read as one story across the row:
// V builds the kiosk, VI weighs your old records over into it, VII is the same kiosk a year on.
// Each board is a 2x2 lesson, read left to right then down, one scene per step with its label
// written under it (the step text, verbatim), chalk arrows between. Big lettering: these show small.
// Scene centres (the light's spots on the page): TL 300,270 · TR 900,270 · BL 300,600 · BR 900,600.

const N = 540, HOLD = 30;
const LY = [372, 712]; // label baselines, top row and bottom row
const swipes = Array.from({ length: 8 }, (_, i): Cue => ({ id: `swipe${i}`, a: i * 5, b: 15 + i * 5 }));
const label = (g: Gfx, s: string, x: number, row: 0 | 1, color: string, seed: number, q: number) => write(g, s, x, LY[row], s.length > 16 ? 26 : 32, color, seed, q);
const ARROWS: [P, P, P][] = [[[470, 210], [600, 150], [730, 210]], [[760, 410], [620, 470], [470, 500]], [[470, 600], [600, 560], [720, 600]]];

// ---------------------------------------------------------------- V · the kiosk
const KIOSK_CUES: Cue[] = [
  ...swipes,
  { id: "bulb", a: 50, b: 85 }, { id: "rays", a: 85, b: 100 }, { id: "l1", a: 100, b: 120 },
  { id: "a1", a: 120, b: 135 }, { id: "sheet", a: 135, b: 160 }, { id: "sketch", a: 160, b: 195 }, { id: "pencil", a: 195, b: 205 }, { id: "l2", a: 205, b: 225 },
  { id: "a2", a: 225, b: 240 }, { id: "parts", a: 240, b: 290 }, { id: "l3", a: 290, b: 315 },
  { id: "a3", a: 315, b: 330 }, { id: "kiosk", a: 330, b: 420 }, { id: "customer", a: 420, b: 445 }, { id: "ring", a: 445, b: 460 }, { id: "l4", a: 460, b: 510 },
];
const kioskLesson = (g: Gfx, ck: Clock) => {
  chalk(g, (dust) => {
    // your idea: a bulb, lit
    line(g, dust, ring(300, 230, 62, 70, 2.2, 0.86, 22), 2.6, CHALK, 100, 0.95, 0.8, ck("bulb"));
    box(g, dust, 270, 296, 60, 34, 2.2, CHALK, 101, Math.max(0, ck("bulb") * 2 - 1));
    ([[[300, 132], [300, 104]], [[372, 160], [394, 140]], [[228, 160], [206, 140]], [[392, 232], [420, 232]], [[208, 232], [180, 232]]] as [P, P][]).forEach(([a, b], i) => line(g, dust, [a, b], 2.2, YEL, 110 + i, 0.92, 0.3, Math.max(0, Math.min(1, ck("rays") * 5 - i))));
    // drawn up: the kiosk sketched on a sheet, a pencil beside it
    paper(g, dust, 790, 120, 230, 200, -0.06, 200, Math.min(1, ck("sheet") * 2));
    const sk = ck("sketch");
    ruled(g, dust, [[840, 290], [960, 282], [960, 246], [840, 252], [840, 290]], 1.4, BLUE, 210, Math.min(1, sk * 3), 0.85);
    ruled(g, dust, [[846, 250], [846, 178], [954, 172], [954, 244]], 1.4, BLUE, 216, Math.max(0, Math.min(1, sk * 3 - 1)), 0.85);
    ruled(g, dust, [[832, 180], [900, 146], [968, 176]], 1.4, BLUE, 222, Math.max(0, sk * 3 - 2), 0.85);
    line(g, dust, [[1040, 300], [1080, 170]], 4, YEL, 220, 0.9, 0.3, ck("pencil"));
    // built from parts: boxes and a gear, ready to go together
    const pq = ck("parts"), ps = (i: number) => Math.max(0, Math.min(1, pq * 4 - i));
    box(g, dust, 200, 560, 90, 70, 2.2, CHALK, 300, ps(0));
    box(g, dust, 310, 590, 110, 40, 2.2, CHALK, 305, ps(1));
    box(g, dust, 240, 500, 60, 50, 2.2, BLUE, 310, ps(2));
    line(g, dust, ring(380, 535, 34, 34, 0, 1.02, 20), 2.2, CHALK, 320, 0.92, 0.6, ps(3));
    line(g, dust, ring(380, 535, 10, 10, 0, 1, 10), 1.6, CHALK, 321, 0.9, 0.4, ps(3));
    // open for customers: the kiosk, finished, someone at the counter
    kiosk(g, dust, 900, 650, 1, 400, ck("kiosk"));
    const cq = ck("customer");
    line(g, dust, ring(1062, 532, 13, 14, -1.6, 1.05, 14), 2, CHALK, 450, 0.9, 0.5, Math.min(1, cq * 3));
    line(g, dust, [[1062, 546], [1062, 600], [1048, 650]], 2, CHALK, 451, 0.9, 0.5, Math.max(0, Math.min(1, cq * 3 - 1)));
    line(g, dust, [[1062, 600], [1076, 650]], 2, CHALK, 452, 0.9, 0.5, Math.max(0, Math.min(1, cq * 3 - 1)));
    line(g, dust, [[1062, 562], [1018, 586]], 2, CHALK, 453, 0.9, 0.5, Math.max(0, cq * 3 - 2));
  }, 0.2);
  chalk(g, (dust) => {
    ARROWS.forEach((a, i) => arrow(g, dust, curve(...a), YEL, 500 + i * 3, ck(`a${i + 1}`)));
    line(g, dust, ring(910, 560, 200, 150, -2.4), 1.6, PINK, 520, 0.8, 1.4, ck("ring"));
    label(g, "YOUR IDEA", 300, 0, CHALK, 30, ck("l1"));
    label(g, "DRAWN UP", 900, 0, BLUE, 31, ck("l2"));
    label(g, "BUILT FROM PARTS", 300, 1, CHALK, 32, ck("l3"));
    label(g, "OPEN FOR CUSTOMERS", 900, 1, PINK, 33, ck("l4"));
  }, 0.22);
};
export const chalkKiosk = chalkFilm("Plate V · The kiosk · chalkboard", N, HOLD, KIOSK_CUES, kioskLesson);

// ---------------------------------------------------------------- VI · the weigh-over
const WEIGH_CUES: Cue[] = [
  ...swipes,
  { id: "papers", a: 50, b: 95 }, { id: "grid", a: 95, b: 125 }, { id: "l1", a: 125, b: 150 },
  { id: "a1", a: 150, b: 165 }, { id: "funnel", a: 165, b: 195 }, { id: "drops", a: 195, b: 210 }, { id: "l2", a: 210, b: 225 },
  { id: "a2", a: 225, b: 240 }, { id: "phone", a: 240, b: 265 }, { id: "rows", a: 265, b: 295 }, { id: "l3", a: 295, b: 320 },
  { id: "a3", a: 320, b: 335 }, { id: "scale", a: 335, b: 385 }, { id: "pans", a: 385, b: 420 }, { id: "tick", a: 420, b: 435 }, { id: "l4", a: 435, b: 510 },
];
const weighLesson = (g: Gfx, ck: Clock) => {
  chalk(g, (dust) => {
    // paper and spreadsheets: a sliding pile, and a ruled grid
    const pp = ck("papers");
    paper(g, dust, 170, 130, 130, 170, -0.16, 100, Math.min(1, pp * 3));
    paper(g, dust, 210, 150, 130, 170, 0.08, 110, Math.max(0, Math.min(1, pp * 3 - 1)));
    paper(g, dust, 250, 120, 130, 170, 0.2, 120, Math.max(0, pp * 3 - 2));
    const gq = ck("grid");
    box(g, dust, 330, 210, 120, 110, 1.8, BLUE, 130, Math.min(1, gq * 2));
    for (let i = 1; i < 4; i++) line(g, dust, [[330, 210 + i * 27.5], [450, 210 + i * 27.5]], 1.1, BLUE, 135 + i, 0.75, 0.3, Math.max(0, Math.min(1, gq * 2 - 1)));
    for (let i = 1; i < 3; i++) line(g, dust, [[330 + i * 40, 210], [330 + i * 40, 320]], 1.1, BLUE, 140 + i, 0.75, 0.3, Math.max(0, Math.min(1, gq * 2 - 1)));
    // fed in: a hopper, papers dropping into it
    const fq = ck("funnel");
    ruled(g, dust, [[800, 150], [1000, 150], [930, 260], [930, 320], [870, 320], [870, 260], [800, 150]], 2.4, CHALK, 200, fq);
    const dq = ck("drops");
    ([[860, 96, -0.3], [930, 80, 0.25]] as [number, number, number][]).forEach(([x, y, t], i) => paper(g, dust, x, y, 40, 52, t, 210 + i * 7, Math.max(0, Math.min(1, dq * 2 - i)), CHALK));
    // sorted into your app: a phone, rows in order
    const phq = ck("phone");
    box(g, dust, 245, 470, 110, 200, 2.4, CHALK, 300, phq);
    line(g, dust, ring(300, 652, 6, 6, 0, 1, 8), 1.4, CHALK, 305, 0.9, 0.3, phq);
    const rq = ck("rows");
    for (let i = 0; i < 5; i++) { const y = 498 + i * 28, q = Math.max(0, Math.min(1, rq * 5 - i)); line(g, dust, ring(264, y, 4, 4, 0, 1, 6), 1.4, YEL, 310 + i, 0.9, 0.2, q); line(g, dust, [[276, y], [336 - (i % 2) * 14, y]], 1.6, CHALK, 320 + i, 0.85, 0.3, q); }
    // nothing lost: the scale stands level, the pile on one pan, the phone on the other
    const sq = ck("scale"), ss = (i: number) => Math.max(0, Math.min(1, sq * 3 - i));
    line(g, dust, [[900, 660], [900, 500]], 2.6, CHALK, 400, 0.95, 0.5, ss(0));
    line(g, dust, [[860, 662], [940, 662]], 2.6, CHALK, 401, 0.95, 0.5, ss(0));
    line(g, dust, [[770, 500], [1030, 500]], 2.6, CHALK, 402, 0.95, 0.5, ss(1));
    ruled(g, dust, [[900, 500], [886, 480], [914, 480], [900, 500]], 1.8, CHALK, 403, ss(2), 0.9);
    const pn = ck("pans"), pa = (i: number) => Math.max(0, Math.min(1, pn * 4 - i));
    ([770, 1030] as number[]).forEach((x, i) => { line(g, dust, [[x, 500], [x - 40, 570]], 1.4, CHALK, 410 + i * 3, 0.85, 0.3, pa(i * 2)); line(g, dust, [[x, 500], [x + 40, 570]], 1.4, CHALK, 411 + i * 3, 0.85, 0.3, pa(i * 2)); line(g, dust, curve([x - 50, 570], [x, 592], [x + 50, 570]), 2, CHALK, 412 + i * 3, 0.9, 0.5, pa(i * 2)); });
    paper(g, dust, 748, 532, 34, 36, -0.12, 420, pa(1));
    box(g, dust, 1016, 526, 28, 42, 1.8, CHALK, 425, pa(3));
    line(g, dust, [[1080, 470], [1100, 492], [1140, 440]], 3, YEL, 430, 0.95, 0.5, ck("tick"));
  }, 0.2);
  chalk(g, (dust) => {
    ARROWS.forEach((a, i) => arrow(g, dust, curve(...a), YEL, 500 + i * 3, ck(`a${i + 1}`)));
    label(g, "PAPER AND SPREADSHEETS", 310, 0, CHALK, 30, ck("l1"));
    label(g, "FED IN", 900, 0, CHALK, 31, ck("l2"));
    label(g, "SORTED INTO YOUR APP", 300, 1, YEL, 32, ck("l3"));
    label(g, "NOTHING LOST", 900, 1, PINK, 33, ck("l4"));
  }, 0.22);
};
export const chalkWeigh = chalkFilm("Plate VI · The weigh-over · chalkboard", N, HOLD, WEIGH_CUES, weighLesson);

// ---------------------------------------------------------------- VII · a year on
const YEAR_CUES: Cue[] = [
  ...swipes,
  { id: "kiosk1", a: 50, b: 115 }, { id: "l1", a: 115, b: 140 },
  { id: "a1", a: 140, b: 155 }, { id: "cal", a: 155, b: 185 }, { id: "ticks", a: 185, b: 230 }, { id: "l2", a: 230, b: 255 },
  { id: "a2", a: 255, b: 270 }, { id: "spanner", a: 270, b: 295 }, { id: "up", a: 295, b: 310 }, { id: "star", a: 310, b: 320 }, { id: "l3", a: 320, b: 345 },
  { id: "a3", a: 345, b: 360 }, { id: "kiosk2", a: 360, b: 425 }, { id: "wing", a: 425, b: 450 }, { id: "plant", a: 450, b: 470 }, { id: "l4", a: 470, b: 510 },
];
const yearLesson = (g: Gfx, ck: Clock) => {
  chalk(g, (dust) => {
    // your app running: the kiosk from Plate V, open
    kiosk(g, dust, 300, 320, 0.82, 100, ck("kiosk1"));
    // checked every day: a month on the wall, every day ticked
    const cq = ck("cal");
    box(g, dust, 790, 110, 220, 210, 2.4, CHALK, 200, Math.min(1, cq * 2));
    line(g, dust, [[790, 150], [1010, 150]], 2, CHALK, 205, 0.9, 0.4, Math.max(0, cq * 2 - 1));
    const tq = ck("ticks");
    for (let i = 0; i < 20; i++) { const x = 812 + (i % 5) * 42, y = 172 + Math.floor(i / 5) * 36, q = Math.max(0, Math.min(1, tq * 20 - i)); line(g, dust, [[x, y + 10], [x + 7, y + 18], [x + 22, y]], 1.6, YEL, 210 + i, 0.9, 0.2, q); }
    // fixed and improved: the spanner, an arrow up, a star
    const sp = ck("spanner");
    line(g, dust, [[220, 640], [330, 530]], 2.4, CHALK, 300, 0.95, 0.5, Math.min(1, sp * 1.6));
    line(g, dust, [[232, 652], [342, 542]], 2.4, CHALK, 301, 0.95, 0.5, Math.min(1, sp * 1.6));
    line(g, dust, ring(346, 526, 22, 22, 2.6, 0.78, 12), 2.6, CHALK, 302, 0.95, 0.5, Math.max(0, sp * 2.5 - 1.5));
    line(g, dust, [[400, 650], [400, 520]], 2.4, YEL, 310, 0.95, 0.4, Math.min(1, ck("up") / 0.75));
    line(g, dust, [[380, 545], [400, 520], [420, 545]], 2.4, YEL, 311, 0.95, 0.3, Math.max(0, ck("up") * 4 - 3));
    const star: P[] = Array.from({ length: 11 }, (_, k) => { const a = -Math.PI / 2 + (k / 10) * Math.PI * 2, r = k % 2 ? 10 : 24; return [440 + Math.cos(a) * r, 500 + Math.sin(a) * r]; });
    line(g, dust, star, 1.8, YEL, 320, 0.92, 0.3, ck("star"));
    // grows with you: the same kiosk, a new wing beside it, something growing
    kiosk(g, dust, 860, 660, 0.82, 400, ck("kiosk2"));
    const wq = ck("wing");
    box(g, dust, 952, 520, 110, 140, 2.2, BLUE, 450, wq);
    ruled(g, dust, [[952, 520], [1007, 488], [1062, 520]], 2.2, BLUE, 455, Math.max(0, wq * 2 - 1));
    const pq = ck("plant");
    line(g, dust, curve([1100, 660], [1094, 600], [1104, 548]), 2, CHALK, 460, 0.9, 0.6, Math.min(1, pq * 2));
    scumble(g, dust, [[1104, 560], [1130, 540], [1140, 566], [1110, 578]], CHALK, { angle: 0.6, gap: 3, w: 3.4, alpha: 0.45, seed: 465, progress: Math.max(0, pq * 2 - 1) });
    scumble(g, dust, [[1100, 590], [1072, 574], [1066, 600], [1094, 606]], CHALK, { angle: -0.6, gap: 3, w: 3.4, alpha: 0.45, seed: 466, progress: Math.max(0, pq * 2 - 1) });
  }, 0.2);
  chalk(g, (dust) => {
    ARROWS.forEach((a, i) => arrow(g, dust, curve(...a), YEL, 500 + i * 3, ck(`a${i + 1}`)));
    label(g, "YOUR APP RUNNING", 300, 0, CHALK, 30, ck("l1"));
    label(g, "CHECKED EVERY DAY", 900, 0, YEL, 31, ck("l2"));
    label(g, "FIXED AND IMPROVED", 300, 1, CHALK, 32, ck("l3"));
    label(g, "GROWS WITH YOU", 900, 1, BLUE, 33, ck("l4"));
  }, 0.22);
};
export const chalkYear = chalkFilm("Plate VII · A year on · chalkboard", N, HOLD, YEAR_CUES, yearLesson);
