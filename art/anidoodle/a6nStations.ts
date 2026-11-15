import type { P } from "./core";
import { CYAN, type Kit, cut, stagger } from "./leoKit";
import { BASE, envelope, laptop, outline, phone, rbox, rule, screenRows, stationSheet, steps, terminal, tick, till, type Station } from "./a6nDraft";
// Plates VIII and X-XIII as station sheets: four real things on one bench, one per step, washed bright.
const V = "#d4472c", S = "#e8a317", G = "#1c8a7a", L = "#2858a8";

// ---------------------------------------------------------------- small objects
const ticket = (k: Kit, q: number, x: number, y: number, w: number, h: number, seed: number) => {
  rule(k, [[x, y], [x + w, y], [x + w, y + h * 0.4], [x + w - 8, y + h * 0.5], [x + w, y + h * 0.6], [x + w, y + h], [x, y + h], [x, y + h * 0.6], [x + 8, y + h * 0.5], [x, y + h * 0.4]], 1.6, seed, q);
};
const card = (k: Kit, q: number, x: number, y: number, seed: number) => { outline(k, rbox(x, y, 70, 44, 6), 1.5, seed, cut(q, 0, 0.7)); k.ln([x + 8, y + 14], [x + 62, y + 14], 2.2, { seed: seed + 1, progress: cut(q, 0.6, 1) }); };
const seat = (k: Kit, q: number, x: number, seed: number) => rule(k, [[x, BASE], [x, BASE - 50], [x + 40, BASE - 50], [x + 40, BASE], [x + 40, BASE - 50], [x + 40, BASE - 100], [x + 34, BASE - 100], [x + 34, BASE - 50]], 1.5, seed, q, { closed: false });

const relay: Station[] = [
  { draw: (k, q, cx) => { laptop(k, cut(q, 0, 0.7), cx, BASE, 2000); envelope(k, cut(q, 0.6, 1), cx - 30, BASE - 230, 60, 2010); k.ln([cx, BASE - 175], [cx, BASE - 195], 1.2, { seed: 2015, color: CYAN, progress: cut(q, 0.9, 1) }); },
    wash: (cx) => [[rbox(cx - 84, BASE - 149, 168, 118, 4), L, 0.34], [[[cx - 30, BASE - 230], [cx + 30, BASE - 230], [cx + 30, BASE - 193], [cx - 30, BASE - 193]], S, 0.5]] },
  { draw: (k, q, cx) => { const s = steps(q, 3); outline(k, rbox(cx - 95, BASE - 210, 190, 210, 6), 1.9, 2100, s(0)); const gs = stagger(s(1), 4, 0.5); [1, 2].forEach((i, j) => k.ln([cx - 95 + i * 63, BASE - 210], [cx - 95 + i * 63, BASE], 1.2, { seed: 2110 + j, progress: gs(j) })); [1, 2].forEach((i, j) => k.ln([cx - 95, BASE - i * 70], [cx + 95, BASE - i * 70], 1.2, { seed: 2120 + j, progress: gs(2 + j) })); const es = stagger(s(2), 4, 0.4); ([[0, 0], [1, 1], [2, 0], [0, 2]] as [number, number][]).forEach(([c, r], i) => envelope(k, es(i), cx - 85 + c * 63, BASE - 195 + r * 70, 42, 2130 + i * 10)); },
    wash: (cx) => [[rbox(cx - 95, BASE - 210, 190, 210, 6), S, 0.3]] },
  { draw: (k, q, cx) => { const c: P = [cx, BASE - 110]; k.circle(c[0], c[1], 74, 1.8, { seed: 2200, progress: cut(q, 0, 0.55) * 0.86, a0: -1.2, color: CYAN }); if (q > 0.55) k.arrow([c[0] + Math.cos(-1.2 + Math.PI * 2 * 0.86) * 74, c[1] + Math.sin(-1.2 + Math.PI * 2 * 0.86) * 74], -1.2 + Math.PI * 2 * 0.86 + Math.PI / 2, 12, CYAN); envelope(k, cut(q, 0.5, 1), cx - 32, BASE - 130, 64, 2210); },
    wash: (cx) => [[[[cx - 32, BASE - 130], [cx + 32, BASE - 130], [cx + 32, BASE - 90], [cx - 32, BASE - 90]], V, 0.4]] },
  { draw: (k, q, cx) => { phone(k, cut(q, 0, 0.6), cx, BASE, 2300); envelope(k, cut(q, 0.55, 0.85), cx - 22, BASE - 130, 44, 2310); tick(k, cut(q, 0.85, 1), cx + 50, BASE - 170, 1, 2320); },
    wash: (cx) => [[rbox(cx - 35.5, BASE - 154, 71, 132, 4), G, 0.38]] },
];

const tiffin: Station[] = [
  { draw: (k, q, cx) => { phone(k, cut(q, 0, 0.5), cx, BASE, 3000, 200); const gs = stagger(cut(q, 0.5, 1), 6, 0.3); for (let i = 0; i < 6; i++) outline(k, rbox(cx - 34 + (i % 2) * 36, BASE - 172 + Math.floor(i / 2) * 44, 30, 36, 4), 1, 3010 + i, gs(i)); },
    wash: (cx) => [[rbox(cx - 42, BASE - 184, 84, 152, 4), G, 0.3], [rbox(cx - 34, BASE - 172, 30, 36, 4), S, 0.6], [rbox(cx + 2, BASE - 128, 30, 36, 4), V, 0.5]] },
  { draw: (k, q, cx) => { const s = steps(q, 4); outline(k, rbox(cx - 110, BASE - 90, 220, 90, 6), 1.9, 3100, s(0)); outline(k, rbox(cx - 60, BASE - 170, 120, 80, 18), 1.8, 3110, s(1)); k.ln([cx - 70, BASE - 170], [cx + 70, BASE - 170], 1.8, { seed: 3115, progress: s(2) }); const st = stagger(s(3), 3, 0.5); [-25, 0, 25].forEach((d, i) => k.pen([[cx + d, BASE - 182], [cx + d - 8, BASE - 205], [cx + d + 4, BASE - 228]], 1.1, { seed: 3120 + i, color: CYAN, progress: st(i) })); },
    wash: (cx) => [[rbox(cx - 60, BASE - 170, 120, 80, 18), S, 0.42]] },
  { draw: (k, q, cx) => { const ts = stagger(q, 3, 0.45); [0, 1, 2].forEach((i) => { const y = BASE - 62 - i * 64, p = ts(i); outline(k, rbox(cx - 60, y, 120, 58, 10), 1.8, 3200 + i * 5, cut(p, 0, 0.6)); outline(k, rbox(cx - 34, y + 16, 68, 26, 3), 1.1, 3202 + i * 5, cut(p, 0.55, 1)); }); k.pen([[cx - 50, BASE - 190], [cx, BASE - 236], [cx + 50, BASE - 190]], 1.8, { seed: 3230, progress: cut(q, 0.85, 1) }); },
    wash: (cx) => [0, 1, 2].map((i): [P[], string, number] => [rbox(cx - 34, BASE - 46 - i * 64, 68, 26, 3), [V, S, G][i], 0.55]) },
  { draw: (k, q, cx) => { const s = steps(q, 4); k.circle(cx - 70, BASE - 30, 30, 1.9, { seed: 3300, progress: s(0) }); k.circle(cx + 70, BASE - 30, 30, 1.9, { seed: 3301, progress: s(0) }); rule(k, [[cx - 70, BASE - 30], [cx - 40, BASE - 80], [cx + 50, BASE - 80], [cx + 70, BASE - 30]], 1.8, 3310, s(1), { closed: false }); rule(k, [[cx - 40, BASE - 80], [cx - 30, BASE - 150], [cx - 10, BASE - 150]], 1.8, 3320, s(2), { closed: false }); outline(k, rbox(cx + 6, BASE - 160, 76, 80, 6), 1.8, 3330, s(3)); },
    wash: (cx) => [[rbox(cx + 6, BASE - 160, 76, 80, 6), L, 0.4]] },
];

const puchka: Station[] = [
  { draw: (k, q, cx) => { till(k, cut(q, 0, 0.7), cx, BASE, 4000); screenRows(k, cut(q, 0.7, 1), cx, BASE - 222, 110, 4, 4010); },
    wash: (cx) => [[rbox(cx - 76, BASE - 240, 152, 92, 9), L, 0.32], [rbox(cx - 100, BASE - 76, 200, 76, 8), S, 0.3]] },
  { draw: (k, q, cx) => { laptop(k, cut(q, 0, 0.7), cx, BASE, 4100); screenRows(k, cut(q, 0.7, 1), cx, BASE - 130, 120, 4, 4110); },
    wash: (cx) => [[rbox(cx - 84, BASE - 149, 168, 118, 4), L, 0.32]] },
  { draw: (k, q, cx) => { phone(k, cut(q, 0, 0.55), cx - 50, BASE, 4200, 150); card(k, cut(q, 0.55, 1), cx + 10, BASE - 120, 4210); },
    wash: (cx) => [[rbox(cx - 81, BASE - 136, 62, 112, 4), G, 0.36], [rbox(cx + 10, BASE - 120, 70, 44, 6), S, 0.55]] },
  { draw: (k, q, cx) => { till(k, cut(q, 0, 0.6), cx, BASE, 4300); ticket(k, cut(q, 0.6, 0.9), cx + 108, BASE - 150, 50, 70, 4310); tick(k, cut(q, 0.88, 1), cx + 120, BASE - 180, 0.8, 4320); },
    wash: (cx) => [[rbox(cx - 76, BASE - 240, 152, 92, 9), L, 0.32], [rbox(cx + 108, BASE - 150, 50, 70, 2), V, 0.3]] },
];

const xplore: Station[] = [
  { draw: (k, q, cx) => { const s = steps(q, 3); outline(k, rbox(cx - 100, BASE - 250, 200, 150, 6), 1.9, 5000, s(0)); rule(k, [[cx - 70, BASE - 100], [cx - 90, BASE], [cx + 90, BASE], [cx + 70, BASE - 100]], 1.6, 5010, s(1), { closed: false }); const gs = stagger(s(2), 9, 0.25); for (let i = 0; i < 9; i++) outline(k, rbox(cx - 84 + (i % 3) * 58, BASE - 236 + Math.floor(i / 3) * 44, 50, 34, 3), 0.9, 5020 + i, gs(i)); },
    wash: (cx) => [[rbox(cx - 100, BASE - 250, 200, 150, 6), G, 0.3], [rbox(cx - 26, BASE - 192, 50, 34, 3), S, 0.6]] },
  { draw: (k, q, cx) => { const ss = stagger(cut(q, 0, 0.8), 4, 0.4); [0, 1, 2, 3].forEach((i) => seat(k, ss(i), cx - 110 + i * 56, 5100 + i * 10)); k.circle(cx - 110 + 2 * 56 + 20, BASE - 60, 48, 1.4, { seed: 5150, color: CYAN, progress: cut(q, 0.8, 1) }); },
    wash: (cx) => [[[[cx + 2, BASE - 50], [cx + 42, BASE - 50], [cx + 42, BASE], [cx + 2, BASE]], S, 0.55]] },
  { draw: (k, q, cx) => terminal(k, q, cx, BASE, 5200), wash: (cx) => [[rbox(cx - 28, BASE - 162, 56, 46, 4), V, 0.4]] },
  { draw: (k, q, cx) => { ticket(k, cut(q, 0, 0.7), cx - 90, BASE - 140, 180, 90, 5300); k.ln([cx - 40, BASE - 140], [cx - 40, BASE - 50], 1, { seed: 5310, color: CYAN, progress: cut(q, 0.6, 0.75) }); tick(k, cut(q, 0.75, 1), cx - 10, BASE - 96, 1.2, 5320); },
    wash: (cx) => [[rbox(cx - 90, BASE - 140, 180, 90, 2), L, 0.3]] },
];

const copper: Station[] = [
  { draw: (k, q, cx) => { phone(k, cut(q, 0, 0.55), cx, BASE, 6000, 200); outline(k, rbox(cx - 34, BASE - 160, 68, 96, 6), 1.3, 6010, cut(q, 0.55, 0.8)); k.circle(cx, BASE - 128, 14, 1.1, { seed: 6015, progress: cut(q, 0.75, 0.9) }); k.ln([cx - 20, BASE - 90], [cx + 20, BASE - 90], 1.2, { seed: 6016, progress: cut(q, 0.88, 1) }); },
    wash: (cx) => [[rbox(cx - 34, BASE - 160, 68, 96, 6), S, 0.5]] },
  { draw: (k, q, cx) => { const s = steps(q, 3); outline(k, rbox(cx - 100, BASE - 220, 200, 200, 6), 1.9, 6100, s(0)); k.ln([cx - 100, BASE - 186], [cx + 100, BASE - 186], 1.4, { seed: 6105, progress: s(1) }); const gs = stagger(s(2), 12, 0.2); for (let i = 0; i < 12; i++) outline(k, rbox(cx - 88 + (i % 4) * 45, BASE - 174 + Math.floor(i / 4) * 48, 38, 40, 3), 0.9, 6110 + i, gs(i)); },
    wash: (cx) => [[rbox(cx - 88 + 2 * 45, BASE - 174 + 48, 38, 40, 3), G, 0.6]] },
  { draw: (k, q, cx) => { const s = steps(q, 3); outline(k, rbox(cx - 90, BASE - 260, 110, 260, 4), 1.9, 6200, s(0)); k.circle(cx + 4, BASE - 130, 5, 1.2, { seed: 6205, progress: s(0) }); outline(k, rbox(cx + 40, BASE - 160, 40, 60, 6), 1.6, 6210, s(1)); phone(k, s(2), cx + 110, BASE - 80, 6220, 100); },
    wash: (cx) => [[rbox(cx + 40, BASE - 160, 40, 60, 6), L, 0.45]] },
  { draw: (k, q, cx) => { const s = steps(q, 3); outline(k, rbox(cx - 120, BASE - 30, 80, 30, 14), 1.6, 6300, s(0)); rule(k, [[cx - 20, BASE - 90], [cx + 30, BASE - 90], [cx + 24, BASE], [cx - 14, BASE]], 1.7, 6310, s(1)); k.pen([[cx + 30, BASE - 76], [cx + 46, BASE - 64], [cx + 28, BASE - 40]], 1.4, { seed: 6315, progress: s(1) }); rule(k, [[cx + 60, BASE - 110], [cx + 130, BASE - 110], [cx + 140, BASE], [cx + 50, BASE]], 1.7, 6320, s(2)); k.pen([[cx + 76, BASE - 110], [cx + 95, BASE - 140], [cx + 114, BASE - 110]], 1.4, { seed: 6325, progress: s(2) }); },
    wash: (cx) => [[rbox(cx - 120, BASE - 30, 80, 30, 14), G, 0.5], [[[cx - 20, BASE - 90], [cx + 30, BASE - 90], [cx + 24, BASE], [cx - 14, BASE]], V, 0.45], [[[cx + 60, BASE - 110], [cx + 130, BASE - 110], [cx + 140, BASE], [cx + 50, BASE]], S, 0.45]] },
];

export const draftRelay = stationSheet({ title: "MESSAGES IN LINE", plate: "VIII", labels: ["you send a message", "kept safe", "tried again if needed", "it arrives"], notes: ["EVERY MESSAGE WAITS ITS TURN", "A FAILED SEND IS TRIED AGAIN", "RECEIPTS GO EVEN IF OFFERS DO NOT"], stations: relay });
export const draftTiffin = stationSheet({ title: "TIFFINGRAB", plate: "X", labels: ["customer picks meals", "kitchen packs", "labelled tins", "driver delivers"], notes: ["MEALS CHOSEN FOR THE WEEK", "PACKING SHEET FROM THE ORDERS", "EACH DRIVER GETS A ROUTE"], stations: tiffin });
export const draftPuchka = stationSheet({ title: "PUCHKAMAN", plate: "XI", labels: ["menu on your till", "same menu online", "customer orders and pays", "order lands on the till"], notes: ["ONE MENU, TWO PLACES", "PAID BEFORE IT REACHES THE TILL"], stations: puchka });
export const draftXplorers = stationSheet({ title: "XPLORERS", plate: "XII", labels: ["classes on the board", "family picks a seat", "pays", "seat booked"], notes: ["A FULL CLASS TAKES NO MORE", "ONE SEAT, ONE CHILD"], stations: xplore });
export const draftCopper = stationSheet({ title: "COPPER CLOVES", plate: "XIII", labels: ["member buys a pass", "books a class", "scans at the door", "class, cafe and shop"], notes: ["ONE PASS FOR EVERYTHING", "ONLY A MEMBER'S PASS OPENS IT"], stations: copper });
export const bareRelay = stationSheet({ ...{ title: "MESSAGES IN LINE", plate: "VIII", labels: ["you send a message", "kept safe", "tried again if needed", "it arrives"], notes: ["EVERY MESSAGE WAITS ITS TURN", "A FAILED SEND IS TRIED AGAIN", "RECEIPTS GO EVEN IF OFFERS DO NOT"], stations: relay }, bare: true });
export const bareTiffin = stationSheet({ ...{ title: "TIFFINGRAB", plate: "X", labels: ["customer picks meals", "kitchen packs", "labelled tins", "driver delivers"], notes: ["MEALS CHOSEN FOR THE WEEK", "PACKING SHEET FROM THE ORDERS", "EACH DRIVER GETS A ROUTE"], stations: tiffin }, bare: true });
export const barePuchka = stationSheet({ ...{ title: "PUCHKAMAN", plate: "XI", labels: ["menu on your till", "same menu online", "customer orders and pays", "order lands on the till"], notes: ["ONE MENU, TWO PLACES", "PAID BEFORE IT REACHES THE TILL"], stations: puchka }, bare: true });
export const bareXplorers = stationSheet({ ...{ title: "XPLORERS", plate: "XII", labels: ["classes on the board", "family picks a seat", "pays", "seat booked"], notes: ["A FULL CLASS TAKES NO MORE", "ONE SEAT, ONE CHILD"], stations: xplore }, bare: true });
export const bareCopper = stationSheet({ ...{ title: "COPPER CLOVES", plate: "XIII", labels: ["member buys a pass", "books a class", "scans at the door", "class, cafe and shop"], notes: ["ONE PASS FOR EVERYTHING", "ONLY A MEMBER'S PASS OPENS IT"], stations: copper }, bare: true });
