import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { $$, type Cond } from './dom';

// hovering (or, on phones, scrolling to) a row scatters its pictogram dots, then they stamp back
export function runIndexRows(c: Cond) {
  if (c.still) return;
  const offs: (() => void)[] = [];
  $$('.index li').forEach(li => {
    const dots = $$('.pic rect', li);
    const go = () => {
      gsap.killTweensOf(dots);
      gsap.timeline()
        .to(dots, { x: () => gsap.utils.random(-9, 9), y: () => gsap.utils.random(-9, 9), rotate: () => gsap.utils.random(-40, 40), duration: .12, ease: 'power2.out' })
        .to(dots, { x: 0, y: 0, rotate: 0, duration: .5, ease: 'back.out(3)', stagger: { each: .008, from: 'random' } });
    };
    if (!c.wide) { const st = ScrollTrigger.create({ trigger: li, start: 'top 80%', once: true, onEnter: go }); offs.push(() => st.kill()); }
    li.addEventListener('pointerenter', go);
    li.addEventListener('focusin', go);
    offs.push(() => { li.removeEventListener('pointerenter', go); li.removeEventListener('focusin', go); });
  });
  return () => offs.forEach(f => f());
}
