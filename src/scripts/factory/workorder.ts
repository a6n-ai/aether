import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { $, $$, type Cond } from './dom';

const stamp = (el: gsap.TweenTarget, from: number) => gsap.fromTo(el, { scale: from }, { scale: 1, duration: .5, ease: 'back.out(2.6)', overwrite: true });

// a ticket rides the belt as you scroll; each step is checked when it arrives, LIVE lands at the end
export function runWorkOrder(c: Cond) {
  const lis = $$('.sheet li');
  if (c.still) { lis.forEach(li => li.classList.add('done')); return; }
  const sheet = $('.sheet'), tk = $('.rail .tk'), live = $('.stamp');
  let ys: number[] = [], endY = 0;
  const on = lis.map(() => false);
  let liveOn = false;
  const measure = () => {
    ys = lis.map(li => { const b = $('.box', li); return b.offsetTop + b.offsetHeight / 2; });
    endY = sheet.offsetHeight - 40;
  };
  const update = () => {
    const y = gsap.utils.clamp(ys[0], endY, innerHeight * .6 - sheet.getBoundingClientRect().top);
    gsap.to(tk, { y: y - tk.offsetHeight / 2, duration: .35, ease: 'power2.out', overwrite: true });
    lis.forEach((li, i) => {
      const now = y >= ys[i] - 2;
      if (now === on[i]) return;
      on[i] = now; li.classList.toggle('done', now);
      if (now) stamp($('.box', li), 1.6);
    });
    const end = y >= endY - 2;
    if (end !== liveOn) { liveOn = end; end ? gsap.fromTo(live, { opacity: 0, scale: 2.2 }, { opacity: 1, scale: 1, duration: .5, ease: 'back.out(2.6)', overwrite: true }) : gsap.to(live, { opacity: 0, duration: .2, overwrite: true }); }
  };
  lis.forEach(li => li.classList.remove('done'));
  gsap.set(live, { opacity: 0 });
  measure();
  gsap.set(tk, { top: 0, bottom: 'auto', y: ys[0] - tk.offsetHeight / 2 });
  ScrollTrigger.create({ trigger: sheet, start: 'top bottom', end: 'bottom top', onUpdate: update, onRefresh: () => { measure(); update(); } });
}
