import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { $, $$, type Cond } from './dom';
import { GLYPH } from './glyphs';

const D = 6;
const dotName = (name: string) => {
  let x = 0, r = '';
  for (const ch of name.toUpperCase()) {
    const g = GLYPH[ch];
    if (!g) { x += 4 * D; continue; }
    for (let k = 0; k < 35; k++) if (g[k] === '1') r += `<rect x="${x + (k % 5) * D}" y="${Math.floor(k / 5) * D}" width="4.6" height="4.6" rx="1.2"/>`;
    x += 6 * D;
  }
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  s.setAttribute('viewBox', `0 0 ${x - D} 40.6`); s.setAttribute('class', 'dn'); s.setAttribute('aria-hidden', 'true');
  s.innerHTML = r;
  return s;
};

// each row: quote types in, the name builds in dots, then crossfades to the real text
export function runOutputLog(c: Cond) {
  if (c.still) return;
  const undo: (() => void)[] = [];
  $$('.log tbody tr').forEach(tr => {
    const q = $('.q', tr), real = $('.real', tr), ship = $('.ship', tr), pips = $$('.dots i', tr);
    const text = q.textContent!;
    // building the timeline costs ~50 ms a row on a phone (one tween per letter, a bbox per dot),
    // so each row is built just before it comes on screen, not at page start
    let t: gsap.core.Timeline | undefined, svg: SVGSVGElement | undefined;
    const build = () => {
      if (t) return t;
      q.textContent = '';
      const chars: HTMLElement[] = [];
      text.split(' ').forEach((w, i, a) => {
        const ws = document.createElement('span'); ws.className = 'w';
        for (const ch of w) { const s = document.createElement('span'); s.textContent = ch; ws.append(s); chars.push(s); }
        q.append(ws); if (i < a.length - 1) q.append(' ');
      });
      svg = dotName(real.textContent!); ship.append(svg);
      const dots = $$('rect', svg);
      gsap.set(chars, { opacity: 0 }); gsap.set(real, { opacity: 0 }); gsap.set(pips, { opacity: 0 });
      let prev: HTMLElement | undefined;
      const mark = (ch?: HTMLElement) => { prev?.classList.remove('cur'); ch?.classList.add('cur'); prev = ch; };
      const tl = gsap.timeline({ paused: true });
      chars.forEach((ch, i) => tl.set(ch, { opacity: 1 }, i * .025).call(mark, [ch], i * .025));
      tl.call(mark, [undefined], '+=.35')
        .from(dots, { opacity: 0, scale: 0, transformOrigin: '50% 50%', duration: .25, ease: 'back.out(3)', stagger: { each: .004, from: 'random' } }, .1)
      .to({}, { duration: .2 })
        .to(svg, { opacity: 0, duration: .3 }, '+=.2').to(real, { opacity: 1, duration: .3 }, '<')
        .fromTo(pips, { scale: 0 }, { scale: 1, opacity: 1, duration: .3, ease: 'back.out(3)', stagger: .08 }, '<');
      return (t = tl);
    };
    const prep = ScrollTrigger.create({ trigger: tr, start: 'top bottom+=300', once: true, onEnter: build });
    const go = ScrollTrigger.create({ trigger: tr, start: 'top 88%', once: true, onEnter: () => build().play() });
    undo.push(
      () => { prep.kill(); go.kill(); },
      () => { t?.kill(); q.textContent = text; svg?.remove(); },
    );
  });
  return () => undo.forEach(f => f());
}
