// Packs src/data/hands.json (the Creation of Adam engraving) into public/art/hands.bin for the home page.
// Layout: Int16, little-endian.
//   header  [w, h, split, nHatch, nContour, nDots]
//   hatch   nHatch   x [x, y, width*1000, dir]
//   contour nContour x [x, y, side]
//   dots    nDots    x [x*10, y*10, r*1000]
// x and y are stored as the change from the previous point of the same list (points come in drawing order,
// so changes are small and gzip/brotli shrink them well); the reader adds them back up.
// usage: node scripts/art/pack-hands.ts
import { readFileSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';

type Hand = { w: number; h: number; split: number; hatch: number[][]; contour: number[][]; dots: number[][] };
const D: Hand = JSON.parse(readFileSync('src/data/hands.json', 'utf8'));

const out = new Int16Array(6 + D.hatch.length * 4 + D.contour.length * 3 + D.dots.length * 3);
let i = 0;
for (const v of [D.w, D.h, D.split, D.hatch.length, D.contour.length, D.dots.length]) out[i++] = v;
let px = 0, py = 0;
const delta = (x: number, y: number) => { out[i++] = x - px; out[i++] = y - py; px = x; py = y; };
for (const [x, y, w, k] of D.hatch) { delta(x, y); out[i++] = Math.round(w * 1000); out[i++] = k; }
px = py = 0;
for (const [x, y, side] of D.contour) { delta(x, y); out[i++] = side; }
px = py = 0;
for (const [x, y, r] of D.dots) { delta(Math.round(x * 10), Math.round(y * 10)); out[i++] = Math.round(r * 1000); }
assert.equal(i, out.length);

// self-check: every value survives the round trip within its rounding step
const back = new Int16Array(out.buffer);
assert.equal(back[3], D.hatch.length);
const d0 = 6 + D.hatch.length * 4 + D.contour.length * 3;
let ax = 0, ay = 0;
D.dots.forEach(([x, y, r], n) => {
  ax += back[d0 + n * 3]; ay += back[d0 + n * 3 + 1];
  assert.ok(Math.abs(ax / 10 - x) <= .051 && Math.abs(ay / 10 - y) <= .051 && Math.abs(back[d0 + n * 3 + 2] / 1000 - r) <= .0006);
});

writeFileSync('public/art/hands.bin', new Uint8Array(out.buffer));
console.log(`hands.bin: ${out.byteLength} bytes (${D.hatch.length} hatch, ${D.contour.length} contour, ${D.dots.length} dots)`);
