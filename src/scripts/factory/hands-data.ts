// The Creation of Adam engraving data. hatch: [x, y, width, dir]; contour: [x, y, side]; dots: [x, y, r]. Crop pixel space.
// Packed by scripts/art/pack-hands.ts into public/art/hands.bin (Int16, x/y stored as deltas in drawing order).
export type Hand = { w: number; h: number; split: number; hatch: number[][]; contour: number[][]; dots: number[][] };

export function decodeHands(buf: ArrayBuffer): Hand {
  const a = new Int16Array(buf);
  const [w, h, split, nH, nC, nD] = a;
  let i = 6, px = 0, py = 0;
  const step = () => { px += a[i++]; py += a[i++]; return [px, py]; };
  const hatch: number[][] = [], contour: number[][] = [], dots: number[][] = [];
  for (let n = 0; n < nH; n++) { const [x, y] = step(); hatch.push([x, y, a[i++] / 1000, a[i++]]); }
  px = py = 0;
  for (let n = 0; n < nC; n++) { const [x, y] = step(); contour.push([x, y, a[i++]]); }
  px = py = 0;
  for (let n = 0; n < nD; n++) { const [x, y] = step(); dots.push([x / 10, y / 10, a[i++] / 1000]); }
  return { w, h, split, hatch, contour, dots };
}
