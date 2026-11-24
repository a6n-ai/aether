import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { $, $$, afterLoad, type Cond } from './dom';
import type { Sketch } from './sketch';

gsap.registerPlugin(ScrollTrigger);

// Hero: the winch draws itself once on load. Reduced motion gets the finished drawing.
export function runWinch(c: Cond, sk: Sketch) {
  const st = { p: 0 };
  let tw: gsap.core.Tween | undefined, alive = true;
  afterLoad(sk.load).then(() => {
    if (!alive) return;
    if (c.still) return sk.setProgress(1);
    tw = gsap.to(st, { p: 1, duration: 2.5, ease: 'power1.inOut', onUpdate: () => sk.setProgress(st.p) });
  });
  return () => { alive = false; tw?.kill(); };
}

// Desktop: the section pins and the track slides so each room reaches the middle of the stage in turn.
// Phones and reduced motion keep the rooms in flow as cards; phones stamp each card in on enter.
export function runTour(c: Cond) {
  const tour = $<HTMLElement>('#tour');
  const track = $<HTMLElement>('.floor-track', tour);
  const rooms = $$<HTMLElement>('.floor-room', tour);
  const cells = $$<SVGGElement>('.floor-cell', tour);
  const last = rooms.length - 1;

  if (!(c.wide && c.motion)) {
    if (!c.motion) return undefined;
    const tweens = rooms.map(room => gsap.from(room, { opacity: 0, scale: .94, duration: .5, ease: 'back.out(2.5)', scrollTrigger: { trigger: room, start: 'top 88%', once: true } }));
    return () => { tweens.forEach(t => t.kill()); gsap.set(rooms, { clearProps: 'opacity,transform' }); };
  }

  tour.dataset.pin = '';
  let cur = -1;
  const show = (idx: number) => {
    if (idx === cur) return;
    cur = idx;
    rooms.forEach((room, i) => {
      const on = i <= idx;
      if (room.classList.contains('is-on') === on) return;
      room.classList.toggle('is-on', on);
      cells[i].classList.toggle('is-on', on);
      const outline = $<SVGPathElement>('.floor-outline', cells[i]), tint = $<SVGRectElement>('.floor-tint', cells[i]), panel = $('.floor-panel', room);
      if (on) {
        gsap.to(outline, { strokeDashoffset: 0, duration: .7, ease: 'power2.out' });
        gsap.to(tint, { opacity: .18, duration: .5 });
        gsap.fromTo(panel, { opacity: 0, scale: 1.12 }, { opacity: 1, scale: 1, duration: .4, ease: 'back.out(2.5)' });
      } else {
        gsap.set(outline, { strokeDashoffset: 1 });
        gsap.set(tint, { opacity: 0 });
        gsap.set(panel, { clearProps: 'opacity,transform' });
      }
    });
  };

  const cell = () => rooms[1].offsetLeft - rooms[0].offsetLeft;
  const tween = gsap.to(track, {
    x: () => -last * cell(),
    ease: 'none',
    scrollTrigger: {
      trigger: tour, start: 'top top', end: () => '+=' + Math.round(last * cell() * 1.1),
      pin: true, scrub: 1, invalidateOnRefresh: true,
      // each room comes to rest centred under the ticket, never half between two
      snap: { snapTo: 1 / last, duration: { min: .2, max: .5 }, delay: .08, ease: 'power2.inOut' },
      onUpdate: (self) => show(Math.round(self.progress * last)),
    },
  });
  show(0);
  const st = tween.scrollTrigger;

  return () => {
    st?.kill(true);
    tween.kill();
    delete tour.dataset.pin;
    cur = -1;
    gsap.set(track, { clearProps: 'transform' });
    rooms.forEach(room => room.classList.remove('is-on'));
    cells.forEach(cell => cell.classList.remove('is-on'));
    gsap.set([...cells.map(g => $('.floor-outline', g)), ...cells.map(g => $('.floor-tint', g))], { clearProps: 'strokeDashoffset,opacity' });
    gsap.set(rooms.map(room => $('.floor-panel', room)), { clearProps: 'opacity,transform' });
  };
}
