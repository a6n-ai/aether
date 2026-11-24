import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { $, $$, type Cond } from './dom';
import { initTheme } from './theme';
import { repoGlyphs } from './glyphs';
import { createForge } from './forge';
import { createRoutes } from './routes';
import { createHands } from './hands';
import { runStatement } from './statement';
import { runParts } from './parts';
import { runIndexRows } from './indexrows';
import { runWorkOrder } from './workorder';
import { runOutputLog } from './outputlog';
import { createClose } from './close';

gsap.registerPlugin(ScrollTrigger);

const toggle = initTheme();
const close = createClose();
const forge = createForge();
const routes = createRoutes();
const hands = createHands();
const open = $('#open');
repoGlyphs(open);

gsap.matchMedia().add({
  motion: '(prefers-reduced-motion: no-preference)',
  still: '(prefers-reduced-motion: reduce)',
  wide: '(min-width: 821px)',
}, (ctx) => {
  const c = ctx.conditions as Cond;
  const cleanups: (void | (() => void))[] = [close.run(c)];
  toggle.addEventListener('click', forge.readPal);
  cleanups.push(() => toggle.removeEventListener('click', forge.readPal));
  cleanups.push(forge.run(c));
  // the hero runs now; each section below the fold is built in its own task after the first paint,
  // so no single start-up task blocks the phone's main thread (was one 276 ms task at 4x CPU)
  const later: (() => void | (() => void))[] = [
    () => hands.run(c),
    () => { routes.run(c); },
    () => runStatement(c), () => runParts(c), () => runIndexRows(c), () => runWorkOrder(c), () => runOutputLog(c),
    () => { if (c.motion) $$('.repo', open).forEach((rp, i) => gsap.from($$('rect', rp), { scale: 0, transformOrigin: 'center', opacity: 0, duration: .4, delay: i * .12, stagger: { each: .02, from: 'random' }, ease: 'back.out(3)', scrollTrigger: { trigger: rp, start: 'top 85%', once: true } })); },
  ];
  let alive = true, timer = 0;
  const step = () => {
    if (!alive) return;
    const job = later.shift();
    if (job) { ctx.add(() => cleanups.push(job())); timer = window.setTimeout(step, 0); return; }
    // triggers were made out of page order; put them back in order before measuring
    ScrollTrigger.sort(); ScrollTrigger.refresh();
  };
  requestAnimationFrame(() => { timer = window.setTimeout(step, 0); });
  return () => { alive = false; clearTimeout(timer); cleanups.forEach(fn => fn && fn()); };
});
