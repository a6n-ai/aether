import { gsap } from 'gsap';
import { $, $$ } from './dom';
import { initTheme } from './theme';

initTheme();

// the 404 scatters, then stamps back together; hovering it scatters it again
gsap.matchMedia().add({ motion: '(prefers-reduced-motion: no-preference)' }, () => {
  const dots = $$('[data-dot] rect');
  const place = () => gsap.to(dots, { x: 0, y: 0, rotate: 0, duration: 0.6, ease: 'back.out(2)', stagger: { each: 0.015, from: 'random' }, overwrite: true });
  const scatter = () =>
    gsap.to(dots, {
      x: () => gsap.utils.random(-40, 40),
      y: () => gsap.utils.random(-40, 40),
      rotate: () => gsap.utils.random(-50, 50),
      duration: 0.25,
      ease: 'power2.out',
      overwrite: true,
      onComplete: place,
    });
  $('[data-dot]').addEventListener('pointerenter', scatter);
  scatter();
});
