import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { $, $$, type Cond } from './dom';

const stamp = (el: gsap.TweenTarget) => gsap.fromTo(el, { scale: 1.25, '--k': 0 }, { scale: 1, '--k': 1, duration: .5, ease: 'back.out(2.6)', overwrite: true });

// one giant line: pinned and sliding left on wide screens, wrapped lines on small ones
export function runStatement(c: Cond) {
  if (c.still) return;
  const sec = $('.statement'), track = $('.st-track'), pills = $$('.pill', sec), shapes = $$('.shape', sec);
  gsap.set(pills, { '--k': 0 });

  if (!c.wide) {
    pills.forEach(p => ScrollTrigger.create({ trigger: p, start: 'top 88%', once: true, onEnter: () => stamp(p) }));
    gsap.to(shapes, { rotate: i => (i % 2 ? -360 : 360), ease: 'none', scrollTrigger: { trigger: sec, start: 'top bottom', end: 'bottom top', scrub: true } });
    return;
  }

  sec.dataset.pin = '';
  const last = pills[pills.length - 1];
  const dist = () => last.offsetLeft + last.offsetWidth / 2 - innerWidth / 2 + innerWidth * .12;
  const line = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: { trigger: sec, start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 1, invalidateOnRefresh: true },
  }).to(track, { x: () => -dist() }, 0).to(shapes, { rotate: i => (i % 2 ? -540 : 540) }, 0);
  pills.forEach(p => ScrollTrigger.create({
    trigger: p, containerAnimation: line, start: 'center center',
    onEnter: () => stamp(p), onEnterBack: () => stamp(p), onLeaveBack: () => gsap.set(p, { '--k': 0 }),
  }));
  return () => { delete sec.dataset.pin; };
}
