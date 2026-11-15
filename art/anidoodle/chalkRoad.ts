import type { Gfx, P } from "./core";
import { BLUE, CHALK, type Clock, type Cue, PINK, YEL, arrow, box, chalk, chalkFilm, curve, kiosk, line, paper, person, ring, ruled, write } from "./a6nChalk";
// THE ROAD · /how-it-works as a place in the a6n world: five scenes along one road, read left to right,
// top row then bottom row, each with its step written under it verbatim: we talk, we plan, built from
// parts, goes live, kept running. Chalk on the world paper (bare). Scene centres: (200,270) (600,270)
// (1000,270) (400,600) (800,600), for the light's spots on the page.

const N = 540, HOLD = 30;
const LY = [380, 712];
const CUES: Cue[] = [
  { id: "talk", a: 0, b: 60 }, { id: "bubbles", a: 60, b: 80 }, { id: "l1", a: 80, b: 100 },
  { id: "a1", a: 100, b: 115 }, { id: "plan", a: 115, b: 160 }, { id: "pencil", a: 160, b: 170 }, { id: "l2", a: 170, b: 190 },
  { id: "a2", a: 190, b: 205 }, { id: "parts", a: 205, b: 255 }, { id: "l3", a: 255, b: 280 },
  { id: "a3", a: 280, b: 295 }, { id: "kiosk", a: 295, b: 370 }, { id: "l4", a: 370, b: 390 },
  { id: "a4", a: 390, b: 405 }, { id: "cal", a: 405, b: 430 }, { id: "ticks", a: 430, b: 480 }, { id: "l5", a: 480, b: 510 },
];
const lesson = (g: Gfx, ck: Clock) => {
  chalk(g, (dust) => {
    // we talk: two people turned to each other, speech between them
    person(g, dust, 150, 190, 0.95, 100, ck("talk"), "out");
    person(g, dust, 250, 190, 0.95, 120, Math.max(0, ck("talk") * 2 - 1), "out", BLUE);
    const bq = ck("bubbles");
    line(g, dust, ring(176, 150, 24, 16, 0, 1, 14), 1.6, YEL, 140, 0.9, 0.5, Math.min(1, bq * 2));
    line(g, dust, ring(224, 140, 24, 16, 0, 1, 14), 1.6, YEL, 141, 0.9, 0.5, Math.max(0, bq * 2 - 1));
    // we plan: a sheet with the plan ruled on it, a pencil
    paper(g, dust, 520, 160, 170, 160, -0.05, 200, Math.min(1, ck("plan") * 1.5));
    const pq = Math.max(0, ck("plan") * 3 - 1.5);
    ruled(g, dust, [[548, 290], [548, 220], [610, 190], [672, 220], [672, 290]], 1.5, BLUE, 210, pq, 0.85);
    line(g, dust, [[700, 330], [740, 200]], 4, YEL, 220, 0.9, 0.3, ck("pencil"));
    // built from parts
    const bq2 = ck("parts"), ps = (i: number) => Math.max(0, Math.min(1, bq2 * 4 - i));
    box(g, dust, 920, 270, 80, 60, 2.2, CHALK, 300, ps(0));
    box(g, dust, 1010, 290, 90, 40, 2.2, CHALK, 305, ps(1));
    box(g, dust, 950, 210, 56, 50, 2.2, BLUE, 310, ps(2));
    line(g, dust, ring(1065, 245, 30, 30, 0, 1.02, 18), 2.2, CHALK, 320, 0.92, 0.6, ps(3));
    // goes live: the kiosk, open
    kiosk(g, dust, 400, 660, 0.85, 400, ck("kiosk"));
    // kept running: a month, every day ticked
    const cq = ck("cal");
    box(g, dust, 700, 470, 200, 190, 2.4, CHALK, 500, Math.min(1, cq * 2));
    line(g, dust, [[700, 506], [900, 506]], 2, CHALK, 505, 0.9, 0.4, Math.max(0, cq * 2 - 1));
    const tq = ck("ticks");
    for (let i = 0; i < 16; i++) { const x = 720 + (i % 4) * 46, y = 524 + Math.floor(i / 4) * 32, q = Math.max(0, Math.min(1, tq * 16 - i)); line(g, dust, [[x, y + 12], [x + 10, y + 24], [x + 32, y - 4]], 2.6, YEL, 510 + i, 0.92, 0.2, q); }
  }, 0.2);
  chalk(g, (dust) => {
    const A: [P, P, P][] = [[[300, 210], [400, 160], [500, 210]], [[740, 210], [820, 160], [900, 210]], [[950, 440], [740, 480], [520, 520]], [[560, 600], [620, 560], [690, 600]]];
    A.forEach((a, i) => arrow(g, dust, curve(...a), YEL, 600 + i * 3, ck(`a${i + 1}`)));
    write(g, "WE TALK", 200, LY[0], 30, CHALK, 30, ck("l1"));
    write(g, "WE PLAN", 600, LY[0], 30, BLUE, 31, ck("l2"));
    write(g, "BUILT FROM PARTS", 1000, LY[0], 26, CHALK, 32, ck("l3"));
    write(g, "GOES LIVE", 400, LY[1], 30, PINK, 33, ck("l4"));
    write(g, "KEPT RUNNING", 800, LY[1], 30, YEL, 34, ck("l5"));
  }, 0.22);
};
export const bareRoad = chalkFilm("World region · the road (how it works)", N, HOLD, CUES, lesson, { bare: true });
