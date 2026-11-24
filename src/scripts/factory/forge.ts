import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { $, $$, type Cond, motion } from './dom';
import { GLYPH } from './glyphs';

type Tile = { x: number; y: number; s: number; c: number; ox: number; oy: number; on: boolean };

// the forge: the headline as live modular type. one canvas, drawn on gsap's ticker
export function createForge() {
  const forge = $<HTMLCanvasElement>('.forge'), ctx = forge.getContext('2d')!, now = $('#forge-now');
  const chips = $$<HTMLButtonElement>('.chip:not(.back)');
  let W = 0, H = 0, cell = 0, beltY = 0, pal: string[] = [], tiles: Tile[] = [], live = true;
  const pointer = { x: -9999, y: -9999 };
  const readPal = () => { const cs = getComputedStyle(document.documentElement); pal = ['--ink', '--cobalt', '--coral', '--butter', '--teal', '--lilac'].map(v => cs.getPropertyValue(v).trim()); };
  const pickColor = () => Math.random() < .8 ? 0 : 1 + Math.floor(Math.random() * 5);
  const size = () => { const r = forge.getBoundingClientRect(), d = Math.min(devicePixelRatio, 2); W = r.width; H = r.height; forge.width = W * d; forge.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0); };
  const targetsFor = (word: string) => {
    const lines = word.split('|'), cols = Math.max(...lines.map(l => l.length * 6 - 1)), rows = lines.length * 7 + (lines.length - 1) * 2;
    const fr = forge.getBoundingClientRect(), gap = Math.max(24, H * .04);
    const padX = Math.min(100, W * .069), top = $('.hero-head').getBoundingClientRect().bottom - fr.top + gap, bottom = $('.hero .dock').getBoundingClientRect().top - fr.top - gap;
    cell = Math.max(3, Math.min((W - padX * 2) / cols, (bottom - top) / rows));
    beltY = H - Math.max(40, H * .02) - cell;
    const x0 = padX, y0 = top + (bottom - top - rows * cell) / 2, out: { x: number; y: number }[] = [];
    lines.forEach((ln, li) => [...ln].forEach((ch, ci) => {
      const g = GLYPH[ch]; if (!g) return;
      for (let k = 0; k < 35; k++) if (g[k] === '1') out.push({ x: x0 + (ci * 6 + k % 5) * cell, y: y0 + (li * 9 + Math.floor(k / 5)) * cell });
    }));
    return out;
  };
  const build = (word: string, instant?: boolean) => {
    const T = targetsFor(word).sort((a, b) => a.x - b.x || a.y - b.y);
    const first = !tiles.some(t => t.on);                     // first load builds from the belt; after that, parts morph in place
    const onNow = tiles.filter(t => t.on);
    while (tiles.length < T.length) {
      const from = onNow[Math.floor(Math.random() * onNow.length)];
      tiles.push(from && !first ? { x: from.x, y: from.y, s: 0, c: pickColor(), ox: 0, oy: 0, on: false }
                                : { x: -40 - Math.random() * W * .3, y: beltY, s: .7, c: pickColor(), ox: 0, oy: 0, on: false });
    }
    const pool = tiles.toSorted((a, b) => (+b.on - +a.on) || a.x - b.x || a.y - b.y).slice(0, T.length).toSorted((a, b) => a.x - b.x || a.y - b.y);
    const spare = tiles.filter(t => !pool.includes(t));
    tiles.forEach(t => gsap.killTweensOf(t));
    if (instant) { pool.forEach((t, i) => Object.assign(t, { x: T[i].x, y: T[i].y, s: 1, on: true })); spare.forEach(t => { t.on = false; }); return; }
    pool.forEach((t, i) => {
      const goal = T[i];
      if (first) {
        gsap.timeline({ delay: goal.x / W * .9 + Math.random() * .12 }).set(t, { on: true })
          .to(t, { x: goal.x, duration: .55, ease: 'power2.inOut' }).to(t, { y: goal.y, s: 1, duration: .6, ease: 'back.out(1.5)' }, '-=.25');
      } else {
        t.on = true;
        gsap.to(t, { x: goal.x, y: goal.y, s: 1, duration: .9, ease: 'expo.inOut', delay: goal.x / W * .25 + Math.random() * .08 });
      }
    });
    spare.forEach(t => { if (t.on) gsap.to(t, { s: 0, duration: .4, ease: 'power2.in', delay: Math.random() * .2, onComplete: () => { t.on = false; } }); });
  };
  const draw = () => {
    if (!live) return;
    ctx.clearRect(0, 0, W, H);
    const r = Math.max(36, cell * 7), sz = cell * .84;
    for (const t of tiles) {
      if (!t.on) continue;
      const dx = t.x - pointer.x, dy = t.y - pointer.y, d = Math.hypot(dx, dy);
      const push = d < r ? (1 - d / r) * cell * 3 : 0;
      t.ox += ((d ? dx / d : 0) * push - t.ox) * .18; t.oy += ((d ? dy / d : 0) * push - t.oy) * .18;
      const w = sz * t.s;
      ctx.fillStyle = pal[t.c];
      ctx.beginPath(); ctx.roundRect(t.x + t.ox + (cell - w) / 2, t.y + t.oy + (cell - w) / 2, w, w, w * .22); ctx.fill();
    }
  };
  let current = 'SOFTWARE|FACTORY', back: gsap.core.Tween | undefined, demo: gsap.core.Tween | undefined, userTook = false;
  const backBtn = $<HTMLButtonElement>('.chip.back');
  const show = (word: string, name: string, instant?: boolean) => { current = word; now.textContent = name; build(word, instant); };
  const clearUI = () => { back && back.kill(); gsap.killTweensOf(chips); chips.forEach(c => { c.setAttribute('aria-pressed', 'false'); c.style.removeProperty('--left'); }); backBtn.hidden = true; };
  const reset = (instant?: boolean) => { clearUI(); show('SOFTWARE|FACTORY', 'Software factory', instant); };
  let sized = false;
  new ResizeObserver(() => { if (!sized) { sized = true; return; } size(); build(current, true); }).observe(forge);
  // the letters sit between the heading and the dock; when those change size (web font arriving, wrapping), the parts move to fit
  let headSeen = 0;
  const refit = () => { size(); build(current, false); };
  const headRO = new ResizeObserver(() => { if (headSeen++ < 2) return; refit(); });
  ['.hero-head', '.hero .dock'].forEach(q => { const el = document.querySelector(q); if (el) headRO.observe(el); });
  document.fonts?.ready.then(refit);
  readPal(); size();

  const run = (c: Cond) => {
    // pick a need: build it, show a draining bar so people see it will come back, offer a way back now
    const HOLD = 6.5;
    const pick = (ch: HTMLButtonElement, fromDemo?: boolean) => {
      if (!fromDemo) { userTook = true; demo && demo.kill(); }
      if (ch.getAttribute('aria-pressed') === 'true' && !fromDemo) return reset(c.still);
      clearUI(); chips.forEach(o => o.setAttribute('aria-pressed', String(o === ch)));
      backBtn.hidden = false;
      show(ch.dataset.w!, 'Built: ' + ch.dataset.n, c.still);
      if (c.still) return;                                        // reduced motion: stays until the visitor goes back
      gsap.fromTo(ch, { '--left': 1 }, { '--left': 0, duration: HOLD, ease: 'none' });
      back = gsap.delayedCall(HOLD, () => reset(false));
    };
    chips.forEach(ch => ch.onclick = () => pick(ch));
    backBtn.onclick = () => { userTook = true; demo && demo.kill(); reset(c.still); };

    if (c.still) {
      reset(true); gsap.ticker.add(draw);
      return () => { gsap.ticker.remove(draw); };
    }

    // parts ride in on the belt and build the headline; the pointer scatters them, they snap back
    const onMove = (e: PointerEvent) => { const r = forge.getBoundingClientRect(); pointer.x = e.clientX - r.left - cell / 2; pointer.y = e.clientY - r.top - cell / 2; };
    const onLeave = () => { pointer.x = pointer.y = -9999; };
    forge.addEventListener('pointermove', onMove);
    forge.addEventListener('pointerleave', onLeave);
    tiles.length = 0; reset(false);
    gsap.ticker.add(draw);
    gsap.from('.hero-head > *, .forge-status, .needs > *:not([hidden])', { y: 20, opacity: 0, duration: .7, stagger: .05, ease: 'expo.out', delay: .3 });
    const idle: gsap.core.Tween = gsap.delayedCall(.16, function blink() {           // the system keeps running: a part swaps now and then
      const t = tiles[Math.floor(Math.random() * tiles.length)];
      if (t && t.on && !motion.paused) gsap.timeline().to(t, { s: .35, duration: .18, ease: 'power2.in', onComplete: () => { t.c = pickColor(); } }).to(t, { s: 1, duration: .45, ease: 'back.out(3)' });
      idle.restart(true);
    });
    // nobody has touched it yet: the factory demonstrates once per need, lighting the button it uses
    let di = 0;
    const runDemo = () => { if (userTook || !live || motion.paused) return demo!.restart(true); pick(chips[di++ % chips.length], true); demo = gsap.delayedCall(HOLD + 2.5, runDemo); };
    demo = gsap.delayedCall(4.2, runDemo);
    ScrollTrigger.create({ trigger: '.hero', start: 'top bottom', end: 'bottom top', onToggle: s => { live = s.isActive; s.isActive ? idle.resume() : idle.pause(); } });
    gsap.from('.hint', { opacity: 0, x: 20, duration: .6, ease: 'expo.out', delay: 2.4 });
    forge.addEventListener('pointerenter', () => gsap.to('.hint', { opacity: 0, duration: .4 }), { once: true });
    return () => { forge.removeEventListener('pointermove', onMove); forge.removeEventListener('pointerleave', onLeave); gsap.ticker.remove(draw); };
  };

  return { readPal, run };
}
