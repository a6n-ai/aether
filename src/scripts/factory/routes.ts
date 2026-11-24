import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { $, $$, type Cond } from './dom';

// routes: each part leaves from its own spot and curves into the business
export function createRoutes() {
  const hub = $('.hub'), stage = $('.hub .stage'), wires = $<SVGSVGElement>('.wires'), nodes = $$('.hub .node'), coreName = $('#core-name'), biz = $<HTMLInputElement>('#biz'), core = $('.hub .core');
  const NS = 'http://www.w3.org/2000/svg';
  const KINDS = ['Your bakery', 'Your clinic', 'Your agency', 'Your store', 'Your studio', 'Your restaurant', 'Your business'];
  const mk = (cls?: string, n?: HTMLElement) => { const e = document.createElementNS(NS, 'path'); if (cls) e.setAttribute('class', cls); if (n) e.style.setProperty('--c', n.style.getPropertyValue('--c')); wires.appendChild(e); return e; };
  const lines = nodes.map(() => mk());
  const lives = nodes.map(n => mk('live', n));
  // one line icon per part, in node order; each lights up in its route colour when its part arrives
  const ICONS = [
    '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 9h18"/><circle cx="6" cy="7" r=".6"/><circle cx="8.5" cy="7" r=".6"/>',
    '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/>',
    '<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>',
    '<path d="M9 7V3M15 7V3M6 7h12v4a6 6 0 0 1-12 0zM12 17v4"/>',
    '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/>',
    '<path d="M6 2.5h8l4 4v15H6z"/><path d="M14 2.5v4h4M9 12h6M9 15.5h6M9 19h4"/>',
    '<path d="M2 9.5 12 5l10 4.5L12 14z"/><path d="M6 11.5V16c3 2.5 9 2.5 12 0v-4.5"/>',
  ];
  $('.runs', core).innerHTML = nodes.map((n, i) => `<i style="--c:${n.style.getPropertyValue('--c')}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[i % ICONS.length]}</svg></i>`).join('');
  const count = $('.runs-count', core);
  const tally = () => { const n = $$('.runs i.on', core).length; count.textContent = n >= nodes.length ? 'Everything runs here.' : `${n} of ${nodes.length} parts running`; };
  const runDots = $$('.runs i', core);
  const placeHub = () => {
    const W = stage.offsetWidth, H = stage.offsetHeight, narrow = W < 700;
    if (narrow) {                                            // phones: parts on top in two columns, routes fall into the card below
      const cw = W, chH = 220; gsap.set(core, { left: 0, top: H - chH, width: cw, height: chH });
      nodes.forEach((n, i) => { const col = i % 2, row = Math.floor(i / 2); gsap.set(n, { left: W * (col ? .74 : .26), top: 24 + row * 58 }); });
      nodes.forEach((n, i) => {
        const sx = parseFloat(n.style.left), sy = parseFloat(n.style.top) + n.offsetHeight / 2, ex = W * (.12 + i * .76 / (nodes.length - 1)), ey = H - chH;
        const d = `M${sx},${sy} C${sx},${(sy + ey) / 2} ${ex},${(sy + ey) / 2} ${ex},${ey}`;
        lines[i].setAttribute('d', d); lives[i].setAttribute('d', d);
      });
      return;
    }
    const cw = Math.min(420, W * .32), chH = H * .78, cx = W - cw, cy = (H - chH) / 2;
    gsap.set(core, { left: cx, top: cy, width: cw, height: chH });
    nodes.forEach((n, i) => {
      const sy = 28 + i * (H - 56) / (nodes.length - 1), sx0 = (i % 2) * 150;
      gsap.set(n, { left: sx0, top: sy });
      const sx = sx0 + n.offsetWidth, ey = cy + chH * (.14 + i * .72 / (nodes.length - 1)), ex = cx, mx = sx + (ex - sx) * (.35 + (i % 3) * .12);
      const d = `M${sx},${sy} C${mx},${sy} ${mx},${ey} ${ex},${ey}`;
      lines[i].setAttribute('d', d); lives[i].setAttribute('d', d);
    });
  };
  placeHub(); ScrollTrigger.addEventListener('refreshInit', placeHub); addEventListener('resize', placeHub);
  let typed = false;
  biz.addEventListener('input', () => { const v = biz.value.trim(); typed = !!v; coreName.textContent = v || 'Your business'; });

  const run = (c: Cond) => {
    if (c.still) {
      lives.forEach(l => { l.setAttribute('pathLength', '1'); l.style.strokeDasharray = '1'; l.style.strokeDashoffset = '0'; });
      runDots.forEach(d => d.classList.add('on')); tally();
      return;
    }
    // each route draws itself into the business, its part lands, the card lights a dot; parts keep travelling
    lives.forEach(l => { l.setAttribute('pathLength', '1'); gsap.set(l, { strokeDasharray: 1, strokeDashoffset: 1 }); });
    // a part landing: soft swell and glow, ignored while the tile is still answering the last one
    const arrive = (tile: HTMLElement) => {
      if (gsap.isTweening(tile)) return;
      gsap.timeline().to(tile, { scale: 1.06, boxShadow: '0 0 0 4px color-mix(in srgb, var(--c) 35%, transparent)', duration: .35, ease: 'sine.out' })
        .to(tile, { scale: 1, boxShadow: '0 0 0 0px color-mix(in srgb, var(--c) 0%, transparent)', duration: .6, ease: 'sine.inOut' });
    };
    const hubIn = gsap.timeline({ paused: true }).from(core, { scale: .9, opacity: 0, duration: .5, ease: 'back.out(2)' });
    nodes.forEach((n, i) => hubIn
      .from(n, { x: -30, opacity: 0, duration: .35, ease: 'back.out(2.4)' }, .25 + i * .1)
      .to(lives[i], { strokeDashoffset: 0, duration: .7, ease: 'power2.inOut' }, .35 + i * .1)
      .call(() => { runDots[i].classList.add('on'); tally(); gsap.fromTo(runDots[i], { scale: 1.35 }, { scale: 1, duration: .45, ease: 'back.out(3)' }); }, undefined, 1.05 + i * .1));
    ScrollTrigger.create({ trigger: stage, start: 'top 72%', once: true, onEnter: () => hubIn.play() });

    const flow = gsap.timeline({ paused: true });
    const COLORS = ['--cobalt', '--coral', '--butter', '--teal', '--lilac'];
    lines.forEach((path, i) => {
      for (let k = 0; k < 2; k++) {
        const rct = document.createElementNS(NS, 'rect'); rct.setAttribute('width', '11'); rct.setAttribute('height', '11'); rct.setAttribute('rx', '3');
        rct.style.fill = `var(${COLORS[(i + k * 2) % 5]})`; wires.appendChild(rct);
        const o = { p: 0 };
        flow.add(gsap.to(o, { p: 1, duration: gsap.utils.random(2.6, 4), repeat: -1, ease: 'power1.inOut', delay: 1.6 + gsap.utils.random(0, 3),
          onUpdate: () => { const L = path.getTotalLength(), pt = path.getPointAtLength(L * o.p); rct.setAttribute('x', String(pt.x - 5.5)); rct.setAttribute('y', String(pt.y - 5.5)); rct.style.opacity = String(o.p < .06 ? o.p / .06 : o.p > .9 ? (1 - o.p) / .1 : 1); },
          onRepeat: () => { if (k === 0) arrive(runDots[i]); } }), 0);
      }
    });
    let ki = 0;
    const cycle: gsap.core.Tween = gsap.delayedCall(2.4, function swap() {
      if (!typed) gsap.timeline().to(coreName, { yPercent: -30, opacity: 0, duration: .2, ease: 'power2.in', onComplete: () => { coreName.textContent = KINDS[++ki % KINDS.length]; } })
        .fromTo(coreName, { yPercent: 30, opacity: 0 }, { yPercent: 0, opacity: 1, duration: .45, ease: 'back.out(2.4)' });
      cycle.restart(true);
    }).pause();
    ScrollTrigger.create({ trigger: hub, start: 'top bottom', end: 'bottom top', onToggle: s => { [flow, cycle].forEach(t => s.isActive ? t.resume() : t.pause()); } });
  };

  return { run };
}
