import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { $, $$, type Cond } from './dom';
import { initTheme } from './theme';
import { repoGlyphs } from './glyphs';
import { runOutputLog } from './outputlog';
import { createClose } from './close';

gsap.registerPlugin(ScrollTrigger);

initTheme();
const open = $('#open');
repoGlyphs(open);
const close = createClose();

gsap.matchMedia().add({
  motion: '(prefers-reduced-motion: no-preference)',
  still: '(prefers-reduced-motion: reduce)',
  wide: '(min-width: 821px)',
}, (ctx) => {
  const c = ctx.conditions as Cond;
  const cleanups: (void | (() => void))[] = [close.run(c), runOutputLog(c)];
  if (c.motion) $$('.repo', open).forEach((rp, i) => gsap.from($$('rect', rp), { scale: 0, transformOrigin: 'center', opacity: 0, duration: .4, delay: i * .12, stagger: { each: .02, from: 'random' }, ease: 'back.out(3)', scrollTrigger: { trigger: rp, start: 'top 85%', once: true } }));
  return () => cleanups.forEach(fn => fn && fn());
});
