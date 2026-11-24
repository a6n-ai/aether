import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion, type Cond } from './dom';
import { decodeHands, type Hand } from './hands-data';

// One scroll value (p, 0..1) drives the scene, in the order an engraver and a machine would work:
//  1. a pen traces Adam's outline, 2. hatching builds tone in three passes, 3. the AI hand streams in as dots,
//  4. both arms reach like real arms (shoulder swing, wrist flex, small overshoot), 5. the touch: spark,
//  a ripple through the dots, a current up Adam's arm, 6. dots pour through the fingertips and become strokes.
// Ink is baked per hatch pass and per limb part (arm / hand) at the size of the drawing, then drawn with
// the limb's transform each frame. Everything is computed in crop space (the fresco crop's pixel grid).
const ANG = [-.3, .55, 1.2];
const DIRS = ANG.map(a => [Math.cos(a), Math.sin(a)]);

// joints, measured on the crop. Human: shoulder off the left edge, wrist before the knuckles. AI: mirrored.
const H_SHOULDER = { x: -40, y: 300 }, H_WRIST = { x: 455, y: 175 };
const A_SHOULDER = { x: 1140, y: 120 }, A_WRIST = { x: 770, y: 175 };
const ADAM = { x: 597, y: 207 }, GOD = { x: 610, y: 195 }, TOUCH = { x: ADAM.x - GOD.x + 4, y: ADAM.y - GOD.y };   // tips meet, they don't overlap

// order points into one pen path: greedy nearest neighbour from the shoulder end
function penPath(pts: number[][]) {
  const left = pts.slice(), out: number[][] = [];
  let cur = left.reduce((a, b) => (b[0] < a[0] ? b : a));
  while (left.length) {
    let bi = 0, bd = Infinity;
    for (let i = 0; i < left.length; i++) { const d = (left[i][0] - cur[0]) ** 2 + (left[i][1] - cur[1]) ** 2; if (d < bd) { bd = d; bi = i; } }
    cur = left.splice(bi, 1)[0]; out.push(cur);
  }
  return out;
}
const rot = (x: number, y: number, c: { x: number; y: number }, a: number) => {
  const cs = Math.cos(a), sn = Math.sin(a), dx = x - c.x, dy = y - c.y;
  return [c.x + dx * cs - dy * sn, c.y + dx * sn + dy * cs];
};

function handsWith(D: Hand) {
  const section = document.querySelector<HTMLElement>('.hands');
  const canvas = document.querySelector<HTMLCanvasElement>('.hands-canvas');
  if (!section || !canvas) return { run: (_c: Cond) => () => {} };
  const ctx = canvas.getContext('2d')!;
  // layers[part][pass]: part 0 = arm, 1 = hand
  const layers = [0, 1].map(() => ANG.map(() => document.createElement('canvas')));
  const outline = [document.createElement('canvas'), document.createElement('canvas')];
  let W = 0, H = 0, dpr = 1, s = 1, ox = 0, oy = 0, ink = '#0c0e14';
  const state = { p: 0, t: 0 };

  const rnd = gsap.utils.random;
  const clamp = gsap.utils.clamp(0, 1);
  const seg = (p: number, a: number, b: number) => clamp((p - a) / (b - a));
  const ease = gsap.parseEase('power3.inOut'), out3 = gsap.parseEase('expo.out'), soft = gsap.parseEase('sine.inOut'), reach = gsap.parseEase('back.out(1.3)');
  const fade = (x: number) => Math.max(0, Math.min(1, x / 90, (D.w - 220 - x) / 120 + 1));

  const pen = penPath(D.contour.filter(c => c[2] === 0));
  const dots = D.dots.map(([x, y, r], i) => {
    const h = D.hatch[(i * 37) % D.hatch.length];
    return {
      x, y, r: r * fade(x), cross: i % 4 === 0, tx: h[0], ty: h[1], dir: h[3] ?? 0, hand: x < A_WRIST.x,
      sx: x + rnd(260, 520), sy: y + rnd(-60, 60), delay: clamp((D.w - x) / (D.w - D.split)) * .55 + rnd(0, .12), pour: rnd(0, .5),
    };
  });

  // bake in crop space at screen resolution
  const bake = () => {
    const bw = Math.ceil(D.w * s * dpr), bh = Math.ceil(D.h * s * dpr);
    const all = [...layers.flat(), ...outline];
    for (const c of all) { c.width = bw; c.height = bh; }
    const g = all.map(c => { const x = c.getContext('2d')!; x.setTransform(s * dpr, 0, 0, s * dpr, 0, 0); x.fillStyle = ink; x.strokeStyle = ink; x.lineCap = 'round'; return x; });
    const L = (part: number, k: number) => g[part * 3 + k];
    for (const [x, y, w, k] of D.hatch) {
      const c = L(x >= H_WRIST.x ? 1 : 0, k); c.globalAlpha = fade(x); c.lineWidth = Math.max(.5 / s, w * .9);
      const [dx, dy] = DIRS[k]; c.beginPath(); c.moveTo(x, y); c.lineTo(x + dx * 1.8, y + dy * 1.8); c.stroke();
    }
    const o = [g[6], g[7]];
    for (const [x, y, side] of D.contour) if (side === 1) { const c = o[x < A_WRIST.x ? 1 : 0]; c.globalAlpha = fade(x) * .55; c.fillRect(x, y, .9, .9); }
  };
  const size = () => {
    const r = canvas.getBoundingClientRect(); dpr = Math.min(devicePixelRatio, 2);
    W = r.width; H = r.height; canvas.width = W * dpr; canvas.height = H * dpr;
    // narrow screens zoom in on the fingertips and let both arms run off the edges
    const narrow = W < 700;
    s = narrow ? Math.min((W * 2.3) / D.w, (H * .5) / D.h) : Math.min((W * 1.25) / D.w, (H * .72) / D.h);
    ox = W * (narrow ? .5 : .52) - D.split * s; oy = H * (narrow ? .6 : .58) - D.h * s / 2;
    ink = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim() || ink;
    bake();
  };

  // a sweeping half-plane with a ragged, hand-made edge, in crop space
  const jag = Array.from({ length: 40 }, () => rnd(-1, 1));
  const sweepClip = (a: number, d: number, rough: number) => {
    const ux = Math.cos(a), uy = Math.sin(a), vx = -uy, vy = ux, L = 2400;
    ctx.beginPath(); ctx.moveTo(-ux * L + vx * L, -uy * L + vy * L);
    for (let i = 0; i < jag.length; i++) { const t = -L + (2 * L * i) / (jag.length - 1), e = d + jag[i] * rough; ctx.lineTo(ux * e - vx * t, uy * e - vy * t); }
    ctx.lineTo(-ux * L - vx * L, -uy * L - vy * L); ctx.closePath(); ctx.clip();
  };
  const span = (a: number) => {
    const ux = Math.cos(a), uy = Math.sin(a), v = [0, D.split].flatMap(x => [0, D.h].map(y => x * ux + y * uy));
    return [Math.min(...v), Math.max(...v)];
  };

  const draw = () => {
    const p = state.p, t = state.t;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    const trace = seg(p, 0, .24);
    const pass = [ease(seg(p, .1, .38)), ease(seg(p, .2, .46)), ease(seg(p, .3, .52))];
    const m = seg(p, .38, .58), meet = reach(m), touch = seg(p, .58, .74), current = seg(p, .6, .72), pour = seg(p, .64, .97);
    const press = Math.sin(seg(p, .58, .68) * Math.PI);          // fingers press a touch at contact
    const breathe = Math.sin(t * 1.25) * .006, breathe2 = Math.sin(t * 1.1 + 1.7) * .006;

    // limb poses: apart, arms lowered and wrists dropped; together, straight with a small overshoot from back.out
    const mt = Math.min(1, meet), gap = (1 - mt) * 150;   // the overshoot bends the joints, never pushes the hands past each other
    const hS = -.11 * (1 - meet), hW = -.2 * (1 - meet) + .025 * press;
    const aS = .09 * (1 - meet), aW = .16 * (1 - meet) - .02 * press;
    const ax = gap + TOUCH.x * mt, ay = TOUCH.y * mt;
    const human = (x: number, y: number) => { let [a, b] = x >= H_WRIST.x ? rot(x, y, H_WRIST, hW) : [x, y]; [a, b] = rot(a, b, H_SHOULDER, hS); [a, b] = rot(a, b, ADAM, breathe); return [a - gap, b]; };
    const ai = (x: number, y: number) => { let [a, b] = x < A_WRIST.x ? rot(x, y, A_WRIST, aW) : [x, y]; [a, b] = rot(a, b, A_SHOULDER, aS); [a, b] = rot(a, b, GOD, breathe2); return [a + ax, b + ay]; };
    const toCrop = () => ctx.setTransform(dpr * s, 0, 0, dpr * s, dpr * ox, dpr * oy);
    const limb = (shoulder: { x: number; y: number }, sa: number, dx: number, dy: number, wrist?: { x: number; y: number }, wa = 0, tip = ADAM, br = 0) => {
      ctx.translate(dx, dy); ctx.translate(tip.x, tip.y); ctx.rotate(br); ctx.translate(-tip.x, -tip.y);
      ctx.translate(shoulder.x, shoulder.y); ctx.rotate(sa); ctx.translate(-shoulder.x, -shoulder.y);
      if (wrist) { ctx.translate(wrist.x, wrist.y); ctx.rotate(wa); ctx.translate(-wrist.x, -wrist.y); }
    };

    // 2. hatching in three passes, each part posed with its joints
    pass.forEach((pt, k) => {
      if (pt <= 0) return;
      const a = k === 0 ? 0 : k === 1 ? ANG[1] + Math.PI / 2 : -Math.PI / 2, [lo, hi] = span(a);
      for (const part of [0, 1]) {
        ctx.save(); toCrop(); limb(H_SHOULDER, hS, -gap, 0, part ? H_WRIST : undefined, hW, ADAM, breathe);
        sweepClip(a, lo + (hi - lo + 60) * pt, 26 * (1 - pt) + 4);
        ctx.drawImage(layers[part][k], 0, 0, D.w, D.h); ctx.restore();
      }
    });

    // 5b. the current: a band of extra ink running from the fingertip up the arm
    if (current > 0 && current < 1) {
      const x1 = ADAM.x + 20 - (ADAM.x + 80) * current;
      for (const part of [0, 1]) {
        ctx.save(); toCrop(); limb(H_SHOULDER, hS, -gap, 0, part ? H_WRIST : undefined, hW, ADAM, breathe);
        // feathered: thin slices whose strength follows a bell curve across the band
        const strength = Math.sin(current * Math.PI) * .8, SL = 10, BW = 90;
        for (let i = 0; i < SL; i++) {
          const f = Math.sin(((i + .5) / SL) * Math.PI) ** 2;
          ctx.save(); ctx.beginPath(); ctx.rect(x1 - BW + (i * BW) / SL, 0, BW / SL + .5, D.h); ctx.clip();
          ctx.globalAlpha = strength * f;
          for (const c of layers[part]) ctx.drawImage(c, 0, 0, D.w, D.h);
          ctx.restore();
        }
        ctx.restore();
      }
    }

    // AI outline fades in with the stream
    const stream = seg(p, .06, .5);
    if (stream > 0) for (const part of [0, 1]) {
      ctx.save(); toCrop(); limb(A_SHOULDER, aS, ax, ay, part ? A_WRIST : undefined, aW, GOD, breathe2);
      ctx.globalAlpha = stream; ctx.drawImage(outline[part], 0, 0, D.w, D.h); ctx.restore();
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.fillStyle = ink; ctx.strokeStyle = ink;
    // 1. the pen traces the outline, a point at its head
    const n = Math.floor(pen.length * trace), px = Math.max(1, s * .9);
    ctx.globalAlpha = .85;
    for (let i = 0; i < n; i++) { const [x, y] = human(pen[i][0], pen[i][1]); ctx.fillRect(ox + x * s, oy + y * s, px, px); }
    if (trace > 0 && trace < 1 && n > 0) {
      const [x, y] = human(pen[n - 1][0], pen[n - 1][1]); ctx.globalAlpha = 1;
      ctx.beginPath(); ctx.arc(ox + x * s, oy + y * s, 3.2, 0, Math.PI * 2); ctx.fill();
    }

    // 3/5a/6. dots: stream in, ripple at the touch, pour through the fingertips and become strokes
    const [tipX, tipY] = human(ADAM.x, ADAM.y), wave = touch * 520, ring = 70;
    ctx.globalAlpha = 1; ctx.beginPath();
    const strokes: number[][] = [];
    for (const d of dots) {
      if (d.r <= 0) continue;
      const k = out3(clamp((stream - d.delay) / .45));
      if (k <= 0) continue;
      const [fx, fy] = ai(d.x, d.y);
      let x = d.sx + (fx - d.sx) * k, y = d.sy + (fy - d.sy) * k;
      const R = d.r * s * (.4 + k * .6);
      if (touch > 0 && touch < 1) {
        const dx = x - tipX, dy = y - tipY, dist = Math.hypot(dx, dy) || 1, off = dist - wave;
        if (Math.abs(off) < ring) { const push = Math.cos((off / ring) * Math.PI / 2) * 9 * (1 - touch); x += (dx / dist) * push; y += (dy / dist) * push; }
      }
      if (d.cross && pour > 0) {
        const q = soft(clamp((pour - d.pour) / .5));
        if (q > 0) {
          const [tx, ty] = human(d.tx, d.ty), a1 = 1 - q, cx = tipX, cy = tipY - 18;   // through the contact point, then to its stroke
          x = a1 * a1 * x + 2 * a1 * q * cx + q * q * tx; y = a1 * a1 * y + 2 * a1 * q * cy + q * q * ty;
          if (q > .82) { strokes.push([ox + x * s, oy + y * s, d.dir, (q - .82) / .18]); continue; }
        }
      }
      const X = ox + x * s, Y = oy + y * s;
      ctx.moveTo(X + R, Y); ctx.arc(X, Y, R, 0, Math.PI * 2);
    }
    ctx.fill();
    if (strokes.length) {
      ctx.lineCap = 'round'; ctx.lineWidth = Math.max(.6, s * 1.1); ctx.beginPath();
      for (const [X, Y, k, u] of strokes) { const [dx, dy] = DIRS[k], len = 1.8 * s * (.4 + u * .6); ctx.moveTo(X, Y); ctx.lineTo(X + dx * len, Y + dy * len); }
      ctx.stroke();
    }

    // 5. the spark at the moment the fingers meet
    const spark = seg(p, .55, .61) * (1 - seg(p, .66, .84));
    if (spark > 0) {
      const X = ox + tipX * s, Y = oy + tipY * s, R = 6 + spark * 26;
      ctx.globalAlpha = spark; ctx.lineWidth = 2; ctx.beginPath();
      for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; ctx.moveTo(X + Math.cos(a) * R * .45, Y + Math.sin(a) * R * .45); ctx.lineTo(X + Math.cos(a) * R, Y + Math.sin(a) * R); }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  };

  // breathing idle: a slow sway while the section is on screen
  const tick = (time: number) => { if (!motion.paused) state.t = time; draw(); };
  let live = false;
  const setLive = (v: boolean) => { if (v === live) return; live = v; v ? gsap.ticker.add(tick) : gsap.ticker.remove(tick); };

  return {
    run(c: Cond) {
      size(); draw();
      const ro = new ResizeObserver(() => { size(); draw(); }); ro.observe(canvas);
      const toggle = document.querySelector('.toggle');
      const onTheme = () => { size(); draw(); };
      toggle?.addEventListener('click', onTheme);
      if (c.still) { state.p = 1; draw(); return () => { ro.disconnect(); toggle?.removeEventListener('click', onTheme); }; }
      const tl = gsap.timeline({ scrollTrigger: { trigger: section, start: 'top top', end: c.wide ? '+=2200' : '+=1500', pin: true, scrub: .8, invalidateOnRefresh: true, refreshPriority: 1 } })
        .to(state, { p: 1, ease: 'none', duration: 1 }, 0);
      const io = new IntersectionObserver(([e]) => setLive(e.isIntersecting)); io.observe(canvas);
      return () => { setLive(false); io.disconnect(); ro.disconnect(); tl.scrollTrigger?.kill(); tl.kill(); toggle?.removeEventListener('click', onTheme); };
    },
  };
}

// The drawing data loads as a small binary file (public/art/hands.bin, packed by scripts/art/pack-hands.ts),
// in parallel with the page. Once it lands the pinned scene is built and ScrollTrigger re-measures the page.
export function createHands() {
  return {
    run(c: Cond) {
      let stop = () => {}, dead = false;
      fetch('/art/hands.bin').then(r => r.arrayBuffer()).then(buf => {
        if (dead) return;
        stop = handsWith(decodeHands(buf)).run(c);
        ScrollTrigger.sort();      // this pin is created after the sections below it; refreshPriority puts it first
        ScrollTrigger.refresh();
      });
      return () => { dead = true; stop(); };
    },
  };
}
