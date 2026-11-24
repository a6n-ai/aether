import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { Cond } from './dom';
import { initTheme } from './theme';
import { createRoutes } from './routes';
import { runParts } from './parts';
import { runIndexRows } from './indexrows';
import { createClose } from './close';

gsap.registerPlugin(ScrollTrigger);

initTheme();
const routes = createRoutes();
const close = createClose();

gsap.matchMedia().add({
  motion: '(prefers-reduced-motion: no-preference)',
  still: '(prefers-reduced-motion: reduce)',
  wide: '(min-width: 821px)',
}, (ctx) => {
  const c = ctx.conditions as Cond;
  const cleanups: (void | (() => void))[] = [close.run(c), runParts(c), runIndexRows(c)];
  routes.run(c);
  return () => cleanups.forEach(fn => fn && fn());
});
