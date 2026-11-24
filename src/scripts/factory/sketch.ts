// Leonardo sketches: one PNG where R = ink strength and G = when the pixel appears (1..255).
// The painter draws the sketch up to progress p (0..1) into the canvas. Callers choose the clock (time or scroll).
export type Sketch = ReturnType<typeof createSketch>;

export function createSketch(canvas: HTMLCanvasElement, src: string) {
  const ctx = canvas.getContext('2d')!;
  const W = canvas.width, H = canvas.height;
  // ink pixels sorted by reveal time once (a counting sort on G), so each frame only touches the pixels whose
  // time has just come or gone, instead of rewriting all W x H pixels on every frame
  let order: Uint32Array | null = null, start: Uint32Array | null = null, alpha: Uint8ClampedArray | null = null, out: ImageData | null = null;
  let p = 0, shown = 0, ready: Promise<void> | undefined;
  let rgb = [12, 14, 20];

  const readInk = () => {
    const m = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim().match(/\w\w/g);
    if (m) rgb = m.map(h => parseInt(h, 16));
  };
  const fill = (from: number, to: number, on: boolean) => {   // buckets [from, to)
    const px = out!.data;
    for (let k = start![from]; k < start![to]; k++) { const i = order![k]; px[i * 4 + 3] = on ? alpha![i] : 0; }
  };
  const paint = () => {
    if (!order || !out) return;
    const t = Math.floor(p * 255) + 1;          // buckets 1..t-1 are visible
    if (t === shown) return;
    t > shown ? fill(shown, t, true) : fill(t, shown, false);
    shown = t;
    ctx.putImageData(out, 0, 0);
  };
  const recolour = () => {
    if (!out) return;
    const px = out.data;
    for (let i = 0; i < px.length; i += 4) { px[i] = rgb[0]; px[i + 1] = rgb[1]; px[i + 2] = rgb[2]; }
  };

  // loads once; resolves after the first paint so a time-driven tween can start when the ink is there
  const load = () => ready ??= new Promise<void>((resolve) => {
    const img = new Image();
    img.onload = () => {
      const off = document.createElement('canvas'); off.width = W; off.height = H;
      const o = off.getContext('2d', { willReadFrequently: true })!; o.drawImage(img, 0, 0);
      const d = o.getImageData(0, 0, W, H).data;
      const count = new Uint32Array(257);
      alpha = new Uint8ClampedArray(W * H);
      for (let i = 0, j = 0; i < W * H; i++, j += 4) { const g = d[j + 1]; if (g) { count[g + 1]++; alpha[i] = Math.min(255, d[j] * 2); } }
      start = new Uint32Array(257);
      for (let g = 1; g < 257; g++) start[g] = start[g - 1] + count[g];
      order = new Uint32Array(start[256]);
      const at = start.slice();
      for (let i = 0, j = 1; i < W * H; i++, j += 4) { const g = d[j]; if (g) order[at[g]++] = i; }
      out = ctx.createImageData(W, H); readInk(); recolour();
      shown = 1; paint();
      resolve();
    };
    img.src = src;
  });

  return {
    load,
    setProgress(v: number) { p = Math.min(1, Math.max(0, v)); paint(); },
    // after a theme change: the ink colour comes from --ink
    refresh() { if (!out) return; readInk(); recolour(); ctx.putImageData(out, 0, 0); },
  };
}
