import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { $, type Cond } from './dom';
import { initTheme } from './theme';
import { createSketch } from './sketch';
import { runWinch, runTour } from './floor';
import { createCabinet } from './cabinet';

gsap.registerPlugin(ScrollTrigger);

initTheme();
const winch = createSketch($<HTMLCanvasElement>('.winch-canvas'), '/art/leo-winch.webp');
$('.toggle').addEventListener('click', () => winch.refresh());
const cabinet = createCabinet();

// the winch is independent of width, so it gets its own context: a resize never redraws it
gsap.matchMedia().add({ motion: '(prefers-reduced-motion: no-preference)', still: '(prefers-reduced-motion: reduce)' }, (ctx) => {
  const cleanup = runWinch(ctx.conditions as Cond, winch);
  return () => cleanup();
});

gsap.matchMedia().add({
  motion: '(prefers-reduced-motion: no-preference)',
  still: '(prefers-reduced-motion: reduce)',
  wide: '(min-width: 821px)',
}, (ctx) => {
  const c = ctx.conditions as Cond;
  const cleanups: (void | (() => void))[] = [runTour(c), cabinet.run(c)];
  return () => cleanups.forEach(fn => fn && fn());
});
