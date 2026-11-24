import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { Cond } from './dom';
import { initTheme } from './theme';
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
  cleanups.push(hands.run(c));
  routes.run(c);
  cleanups.push(runStatement(c), runParts(c), runIndexRows(c), runWorkOrder(c), runOutputLog(c));
  return () => cleanups.forEach(fn => fn && fn());
});
