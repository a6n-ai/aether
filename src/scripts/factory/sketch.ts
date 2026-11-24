// Leonardo sketches: one PNG where R = ink strength and G = when the pixel appears (1..255).
// The painter draws the sketch up to progress p (0..1) into the canvas. Callers choose the clock (time or scroll).
export type Sketch = ReturnType<typeof createSketch>;

export function createSketch(canvas: HTMLCanvasElement, src: string) {
  const ctx = canvas.getContext('2d')!;
  const W = canvas.width, H = canvas.height;
  let ink: Uint8ClampedArray | null = null, when: Uint8ClampedArray | null = null, out: ImageData | null = null;
  let p = 0, shown = -1, ready: Promise<void> | undefined;

  const paint = (force = false) => {
    if (!ink || !when || !out) return;
    const t = p * 255;
    if (!force && Math.abs(t - shown) < .5) return;
    shown = t;
    const [r, g, b] = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim().match(/\w\w/g)!.map(h => parseInt(h, 16));
    const px = out.data;
    for (let i = 0, j = 0; i < ink.length; i++, j += 4) {
      const a = when[i] && when[i] <= t ? Math.min(255, ink[i] * 2) : 0;
      px[j] = r; px[j + 1] = g; px[j + 2] = b; px[j + 3] = a;
    }
    ctx.putImageData(out, 0, 0);
  };

  // loads once; resolves after the first paint so a time-driven tween can start when the ink is there
  const load = () => ready ??= new Promise<void>((resolve) => {
    const img = new Image();
    img.onload = () => {
      const off = document.createElement('canvas'); off.width = W; off.height = H;
      const o = off.getContext('2d', { willReadFrequently: true })!; o.drawImage(img, 0, 0);
      const d = o.getImageData(0, 0, W, H).data;
      ink = new Uint8ClampedArray(W * H); when = new Uint8ClampedArray(W * H);
      for (let i = 0; i < W * H; i++) { ink[i] = d[i * 4]; when[i] = d[i * 4 + 1]; }
      out = ctx.createImageData(W, H); shown = -1; paint(true);
      resolve();
    };
    img.src = src;
  });

  return {
    load,
    setProgress(v: number) { p = Math.min(1, Math.max(0, v)); paint(); },
    refresh() { shown = -1; paint(); },   // after a theme change: the ink colour is read from --ink on each paint
  };
}
