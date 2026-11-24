import { gsap } from 'gsap';
import { $, $$, type Cond } from './dom';

// Parts store: one drawer open at a time. Opening presses the face down and reveals its line; Escape closes it.
export function createCabinet() {
  const root = $<HTMLElement>('.floor-cabinet');
  let reduced = false, open: HTMLButtonElement | null = null;
  const dur = (s: number) => (reduced ? 0 : s);
  const lineOf = (face: HTMLButtonElement) => document.getElementById(face.getAttribute('aria-controls')!)!;

  const close = (face: HTMLButtonElement) => {
    face.setAttribute('aria-expanded', 'false');
    gsap.to(face, { y: 0, duration: dur(.3), ease: 'back.out(2)' });
    lineOf(face).hidden = true;
    if (open === face) open = null;
  };

  const show = (face: HTMLButtonElement) => {
    if (open && open !== face) close(open);
    face.setAttribute('aria-expanded', 'true');
    const line = lineOf(face);
    line.hidden = false;
    open = face;
    gsap.fromTo(face, { y: 0 }, { y: 10, duration: dur(.35), ease: 'back.out(2.5)' });
    gsap.fromTo(line, { clipPath: 'inset(0 0 100% 0)', opacity: 0 }, { clipPath: 'inset(0 0 0% 0)', opacity: 1, duration: dur(.45), ease: 'power2.out' });
  };

  $$<HTMLButtonElement>('.floor-face', root).forEach((face) => {
    face.addEventListener('click', () => (face.getAttribute('aria-expanded') === 'true' ? close(face) : show(face)));
  });
  root.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && open) { const face = open; close(face); face.focus(); }
  });

  return {
    run(c: Cond) {
      reduced = !!c.still;
      return undefined;
    },
  };
}
