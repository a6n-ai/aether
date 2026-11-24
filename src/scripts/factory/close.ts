import { gsap } from 'gsap';
import type { ScrollTrigger } from 'gsap/ScrollTrigger';
import { $, type Cond } from './dom';

// Closing: Leonardo's hand study draws itself. The art is one PNG: R = ink strength, G = when the pixel appears (1..255).
// Scrolling in draws most of it; the visitor's sentence finishes the sketch.
export function createClose() {
  const need = $<HTMLTextAreaElement>('#need'), sent = $('.sent'), canvas = $<HTMLCanvasElement>('.sketch-canvas');
  const ctx = canvas.getContext('2d')!;
  const W = canvas.width, H = canvas.height;
  let ink: Uint8ClampedArray | null = null, when: Uint8ClampedArray | null = null, out: ImageData | null = null;
  const state = { scroll: 0, typed: 0, done: 0 };
  let shown = -1;

  const paint = () => {
    if (!ink || !when || !out) return;
    const t = Math.min(1, state.scroll * .8 + state.typed * .2 + state.done) * 255;
    if (Math.abs(t - shown) < .5) return;
    shown = t;
    const [r, g, b] = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim().match(/\w\w/g)!.map(h => parseInt(h, 16));
    const px = out.data;
    for (let i = 0, j = 0; i < ink.length; i++, j += 4) {
      const a = when[i] && when[i] <= t ? Math.min(255, ink[i] * 2) : 0;
      px[j] = r; px[j + 1] = g; px[j + 2] = b; px[j + 3] = a;
    }
    ctx.putImageData(out, 0, 0);
  };

  // load the art only when the section is close
  const load = () => {
    const img = new Image();
    img.onload = () => {
      const off = document.createElement('canvas'); off.width = W; off.height = H;
      const o = off.getContext('2d', { willReadFrequently: true })!; o.drawImage(img, 0, 0);
      const d = o.getImageData(0, 0, W, H).data;
      ink = new Uint8ClampedArray(W * H); when = new Uint8ClampedArray(W * H);
      for (let i = 0; i < W * H; i++) { ink[i] = d[i * 4]; when[i] = d[i * 4 + 1]; }
      out = ctx.createImageData(W, H); shown = -1; paint();
    };
    img.src = '/art/leo-hands.png';
  };
  const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); load(); } }, { rootMargin: '800px 0px' });
  io.observe(canvas);

  need.addEventListener('input', () => { gsap.to(state, { typed: Math.min(1, need.value.trim().length / 40), duration: .6, ease: 'power2.out', onUpdate: paint }); });
  $('.toggle')?.addEventListener('click', () => { shown = -1; paint(); });

  const run = (c: Cond) => {
    const formSubmit = (e: Event) => {
      e.preventDefault();
      if (!need.value.trim()) { need.focus(); sent.textContent = 'Add a sentence about what you need first.'; return; }
      sent.textContent = 'Sketch finished. This preview does not send anything yet.';
      gsap.to(state, { done: 1, duration: c.still ? 0 : 1.2, ease: 'power2.inOut', onUpdate: paint });
    };
    const form = $('.close .form'); form.addEventListener('submit', formSubmit);
    let st: ScrollTrigger | undefined;
    if (c.still) { state.scroll = 1; paint(); }
    else st = gsap.to(state, { scroll: 1, ease: 'none', onUpdate: paint, scrollTrigger: { trigger: '.close', start: 'top 85%', end: 'center 45%', scrub: .6 } }).scrollTrigger;
    return () => { form.removeEventListener('submit', formSubmit); st?.kill(); };
  };

  return { run };
}
