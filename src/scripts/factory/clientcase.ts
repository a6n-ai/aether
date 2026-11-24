import { gsap } from 'gsap';
import { $$ } from './dom';
import { initTheme } from './theme';

initTheme();

// the client's name is scattered in dot type, then stamps together; with motion off it is already assembled
gsap.matchMedia().add({ motion: '(prefers-reduced-motion: no-preference)' }, () => {
  gsap.from($$('[data-dot] rect'), {
    x: () => gsap.utils.random(-60, 60),
    y: () => gsap.utils.random(-60, 60),
    rotate: () => gsap.utils.random(-60, 60),
    opacity: 0,
    scale: 0.4,
    duration: 0.9,
    ease: 'back.out(2)',
    stagger: { each: 0.012, from: 'random' },
  });
});
