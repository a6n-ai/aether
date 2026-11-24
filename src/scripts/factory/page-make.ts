import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { $, $$, type Cond } from './dom';
import { initTheme } from './theme';

gsap.registerPlugin(ScrollTrigger);

initTheme();

// Wide screens with motion: a sheet's leaders draw out from the centre, then its labels stamp in
// and the matching list in the spec column flashes. Phones and reduced motion keep the finished drawing.
gsap.matchMedia().add({
  motion: '(prefers-reduced-motion: no-preference)',
  wide: '(min-width: 821px)',
}, (ctx) => {
  const c = ctx.conditions as Cond;
  if (!(c.motion && c.wide)) return;
  $$<HTMLElement>('.make-sheet').forEach((sheet) => {
    const diagram = $<SVGSVGElement>('.make-diagram-wide', sheet);
    const leaders = $$<SVGPathElement>('.make-leader', diagram);
    const labels = $$<SVGGElement>('.make-label', diagram);
    const hits = $$<HTMLElement>('.make-hit', sheet);
    gsap.set(leaders, { strokeDashoffset: 1 });
    gsap.set(labels, { scale: 0, opacity: 0, transformOrigin: '50% 50%' });

    const tl = gsap.timeline({ scrollTrigger: { trigger: sheet, start: 'top 75%', once: true } });
    leaders.forEach((leader, i) => tl.to(leader, { strokeDashoffset: 0, duration: .6, ease: 'power2.out' }, i * .12));
    const stamp = leaders.length * .12 + .2;
    labels.forEach((label, i) => {
      const at = stamp + i * .14;
      tl.to(label, { scale: 1, opacity: 1, duration: .4, ease: 'back.out(3)' }, at);
      tl.fromTo(hits[i], { opacity: 0 }, { opacity: .22, duration: .18, repeat: 1, yoyo: true }, at + .3);
    });
  });
});
