import type { Gfx, P } from "./core";
import { BLUE, CHALK, type Clock, type Cue, PINK, YEL, arrow, box, chalk, chalkFilm, curve, line, person, ring, scumble, write } from "./a6nChalk";
// PLATE III · YOUR OWN TEAM · chalkboard (a6n.ai home page, "Built for businesses like yours").
// IDEA: we work like your own team, not a vendor you chase: our bench sits inside your shop, and
// what breaks is fixed there and then, by the same people, every week.
// FOCAL: our bench inside the shop window, ringed in blue.
// THE LESSON, in a teacher's order: yesterday rubbed out; the title underlined twice; the shop
// (walls, the awning scumbled in stripes, window, door), labelled; our bench and our person at it
// inside the window, ringed and labelled; the arrow out to the fix (a spanner, sparks, a tick),
// labelled; the arrow down to the two people side by side, ringed in pink, labelled last.
// The four labels are the plate's steps, verbatim, so the board and the page say the same thing.

const N = 540, HOLD = 30;
const CUES: Cue[] = [
  ...Array.from({ length: 8 }, (_, i): Cue => ({ id: `swipe${i}`, a: i * 5, b: 15 + i * 5 })),
  { id: "title", a: 55, b: 90 }, { id: "under1", a: 90, b: 95 }, { id: "under2", a: 95, b: 100 },
  { id: "walls", a: 100, b: 125 }, { id: "awning", a: 125, b: 150 }, { id: "awnLine", a: 150, b: 160 },
  { id: "window", a: 160, b: 175 }, { id: "door", a: 175, b: 190 }, { id: "lab1", a: 190, b: 210 },
  { id: "bench", a: 210, b: 225 }, { id: "laptop", a: 225, b: 235 }, { id: "worker", a: 235, b: 255 }, { id: "ring2", a: 255, b: 265 }, { id: "lab2", a: 265, b: 285 },
  { id: "arrow1", a: 285, b: 300 }, { id: "spanner", a: 300, b: 320 }, { id: "sparks", a: 320, b: 330 }, { id: "tick", a: 330, b: 340 }, { id: "lab3", a: 340, b: 365 },
  { id: "arrow2", a: 365, b: 380 }, { id: "owner", a: 380, b: 400 }, { id: "ours", a: 400, b: 420 }, { id: "hands", a: 420, b: 425 }, { id: "ring4", a: 425, b: 440 }, { id: "lab4", a: 440, b: 465 },
  { id: "note", a: 465, b: 510 },
];

const AWN: [number, number] = [150, 640];
const lesson = (g: Gfx, ck: Clock) => {
  chalk(g, (dust) => {
    // the shop
    box(g, dust, 170, 250, 450, 400, 2.6, CHALK, 100, ck("walls"), 0.95);
    const stripes = 7, sw = (AWN[1] - AWN[0]) / stripes;
    for (let i = 0; i < stripes; i++) {
      const x0 = AWN[0] + i * sw, scallop: P[] = [[x0, 218], [x0 + sw, 218], [x0 + sw, 280], ...Array.from({ length: 7 }, (_, k): P => [x0 + sw - (k / 6) * sw, 280 + Math.sin((k / 6) * Math.PI) * 18])];
      const q = Math.max(0, Math.min(1, ck("awning") * stripes - i));
      scumble(g, dust, scallop, i % 2 ? CHALK : PINK, { angle: 1.2, gap: 3.4, w: 4, alpha: 0.4, seed: 110 + i, progress: q });
    }
    line(g, dust, [[AWN[0] - 6, 218], [AWN[1] + 6, 218]], 2.4, CHALK, 120, 0.9, 1, ck("awnLine"));
    box(g, dust, 200, 330, 230, 200, 2.2, CHALK, 130, ck("window"), 0.9);
    box(g, dust, 470, 400, 110, 250, 2.2, CHALK, 140, Math.min(1, ck("door") * 1.4), 0.9);
    line(g, dust, ring(560, 525, 5, 5, 0, 1, 8), 1.6, CHALK, 141, 0.9, 0.3, Math.max(0, ck("door") * 3 - 2));
    // our bench inside the window
    line(g, dust, [[220, 490], [410, 490]], 2.4, CHALK, 200, 0.92, 0.8, ck("bench"));
    line(g, dust, [[236, 490], [236, 526]], 2, CHALK, 201, 0.9, 0.8, ck("bench"));
    line(g, dust, [[394, 490], [394, 526]], 2, CHALK, 202, 0.9, 0.8, ck("bench"));
    line(g, dust, [[330, 488], [380, 488], [392, 446], [342, 446], [330, 488]], 1.8, BLUE, 210, 0.9, 0.6, ck("laptop"));
    person(g, dust, 290, 428, 0.95, 220, ck("worker"), "work");
  }, 0.2);
  chalk(g, (dust) => {
    line(g, dust, ring(315, 440, 135, 112, -2.2), 1.6, BLUE, 260, 0.85, 1.4, ck("ring2"));
    // the fix, out to the right
    arrow(g, dust, curve([650, 214], [700, 170], [770, 236]), YEL, 300, ck("arrow1"));
    const sp = ck("spanner");
    line(g, dust, [[814, 354], [926, 244]], 2.4, CHALK, 310, 0.95, 0.5, Math.min(1, sp * 1.6));
    line(g, dust, [[826, 366], [938, 256]], 2.4, CHALK, 313, 0.95, 0.5, Math.min(1, sp * 1.6));
    line(g, dust, ring(944, 236, 22, 22, 2.6, 0.78, 12), 2.6, CHALK, 311, 0.95, 0.6, Math.max(0, sp * 2.5 - 1.5));
    line(g, dust, ring(810, 372, 14, 14, -0.6, 1, 10), 2.4, CHALK, 312, 0.95, 0.6, Math.max(0, sp * 2.5 - 1.5));
    const spk = ck("sparks");
    ([[[990, 200], [1010, 180]], [[1000, 236], [1028, 236]], [[984, 270], [1004, 290]]] as [P, P][]).forEach(([a, b], i) => line(g, dust, [a, b], 1.8, YEL, 320 + i, 0.9, 0.3, Math.max(0, Math.min(1, spk * 3 - i))));
    line(g, dust, [[860, 420], [890, 452], [960, 380]], 3, YEL, 330, 0.95, 0.6, ck("tick"));
    // one team: the two of us, side by side
    arrow(g, dust, curve([880, 480], [860, 520], [900, 540]), YEL, 340, ck("arrow2"));
    person(g, dust, 860, 560, 0.85, 400, ck("owner"), "down");
    person(g, dust, 960, 560, 0.85, 420, ck("ours"), "down", BLUE);
    line(g, dust, [[877, 606], [943, 606]], 2, CHALK, 430, 0.9, 0.5, ck("hands"));
    line(g, dust, ring(910, 610, 120, 92, -1.8), 1.6, PINK, 440, 0.85, 1.4, ck("ring4"));
  }, 0.2);
  chalk(g, (dust) => {
    void dust;
    write(g, "YOUR OWN TEAM", 600, 64, 40, CHALK, 20, ck("title"));
    line(g, dust, [[400, 124], [600, 120], [800, 126]], 2.4, YEL, 21, 0.9, 1.2, ck("under1"));
    line(g, dust, [[430, 136], [610, 133], [770, 138]], 1.8, YEL, 22, 0.75, 1.4, ck("under2"));
    write(g, "YOUR SHOP", 395, 690, 22, CHALK, 30, ck("lab1"));
    write(g, "OUR BENCH INSIDE IT", 315, 584, 15, BLUE, 31, ck("lab2"));
    write(g, "FIXED ON THE SPOT", 900, 470, 17, YEL, 32, ck("lab3"), "left");
    write(g, "ONE TEAM, YOURS", 910, 716, 20, PINK, 33, ck("lab4"));
    write(g, "SAME PEOPLE, EVERY WEEK", 1150, 760, 12, CHALK, 34, ck("note"), "right");
  }, 0.22);
};

export const chalkTeam = chalkFilm("Plate III · Your own team · chalkboard", N, HOLD, CUES, lesson);
