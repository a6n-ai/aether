import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { $$ } from './dom';
import { initTheme } from './theme';

gsap.registerPlugin(ScrollTrigger);
initTheme();

// each step's number stamps in as it reaches the reader; with motion off the numbers are already in place
gsap.matchMedia().add({ motion: '(prefers-reduced-motion: no-preference)' }, () => {
  $$('.step').forEach((step) => {
    const dots = $$('[data-dot] rect', step);
    ScrollTrigger.create({
      trigger: step,
      start: 'top 85%',
      once: true,
      onEnter: () => gsap.from(dots, { scale: 0, opacity: 0, duration: 0.45, ease: 'back.out(3)', stagger: { each: 0.02, from: 'random' } }),
    });
  });
});
