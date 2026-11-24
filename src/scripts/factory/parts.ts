import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { $$, motion, type Cond } from './dom';

type Scene = (q: (s: string) => SVGElement[]) => [gsap.core.Timeline, gsap.core.Timeline];
const tl = (v: gsap.TimelineVars = {}) => gsap.timeline({ paused: true, ...v });
const loop = () => tl({ repeat: -1, repeatDelay: 1.4 });
const pop = 'back.out(2.6)';

const scenes: Record<string, Scene> = {
  ai: q => [
    tl().from(q('.b'), { scale: .6, opacity: 0, y: 10, duration: .45, ease: pop, stagger: .35 })
      .from(q('.ty'), { opacity: 0, scale: .7, duration: .3, ease: pop }, '>-.1'),
    loop().to(q('.td'), { y: -4, duration: .22, yoyo: true, repeat: 1, stagger: .12, ease: 'power1.inOut' }),
  ],
  dash: q => [
    tl().from(q('.sq'), { scale: 0, opacity: 0, transformOrigin: '50% 100%', duration: .35, ease: pop, stagger: .016 }),
    loop().to(q('.top'), { opacity: .25, duration: .25, yoyo: true, repeat: 1, stagger: { each: .12, from: 'random' }, ease: 'steps(2)' }),
  ],
  notif: q => [
    tl().from(q('.card'), { y: -60, rotate: i => (i - 1) * 7, opacity: 0, duration: .5, ease: 'back.out(2)', stagger: .2 }),
    loop().to(q('.fr'), { y: -3, duration: .12, yoyo: true, repeat: 1 }).to(q('.badge'), { scale: 1.5, duration: .15, yoyo: true, repeat: 1 }, 0),
  ],
  sign: q => [
    tl().from(q('.sh'), { y: -16, duration: .5, ease: 'back.out(3)' }).from(q('.pb'), { scale: 1.08, duration: .3, ease: 'back.out(3)' }, '>-.05'),
    loop().to(q('.sh'), { y: -3, duration: .12, yoyo: true, repeat: 1 }),
  ],
  report: q => [
    tl().from(q('.hd'), { scaleX: 0, transformOrigin: '0% 50%', duration: .3, ease: pop }).from(q('.rd'), { scale: 0, opacity: 0, duration: .2, ease: pop, stagger: .012 }, '>-.1')
      .from(q('.cur'), { opacity: 0, duration: .1 }),
    tl({ repeat: -1 }).to(q('.cur'), { opacity: 0, duration: .01, delay: .5 }).to(q('.cur'), { opacity: 1, duration: .01, delay: .5 }),
  ],
  integ: q => {
    const nodes = q('.nd'), pk = q('.pk')[0], idle = tl({ repeat: -1, repeatDelay: .8 });
    nodes.forEach((n, i) => idle.fromTo(pk, { x: 0, y: 0, opacity: 1 }, { x: +n.getAttribute('cx')! - 50, y: +n.getAttribute('cy')! - 50, duration: .6, ease: 'power1.inOut' }, i * .9).to(pk, { opacity: 0, duration: .1 }, i * .9 + .6));
    return [
      tl().from(nodes, { scale: 0, transformOrigin: '50% 50%', duration: .4, ease: pop, stagger: .1 }).from(q('.ln'), { strokeDashoffset: 1, strokeDasharray: 1, duration: .4, ease: 'power2.out', stagger: .1 }, '>-.2').from(q('.hub'), { scale: 0, duration: .3, ease: pop }, 0),
      idle,
    ];
  },
};

// each tile plays its scene once when it scrolls in, then idles only while on screen
export function runParts(c: Cond) {
  if (c.still) return;
  $$('.tile').forEach(tile => {
    const mk = scenes[tile.dataset.scene!];
    const [intro, idle] = mk(s => $$<SVGElement>(s, tile));
    let on = false, done = false;
    const sync = () => (on && done && !motion.paused ? idle.play() : idle.pause());
    motion.on(sync);
    intro.eventCallback('onComplete', () => { done = true; sync(); });
    ScrollTrigger.create({ trigger: tile, start: 'top 85%', once: true, onEnter: () => intro.play() });
    ScrollTrigger.create({ trigger: tile, start: 'top bottom', end: 'bottom top', onToggle: s => { on = s.isActive; sync(); } });
  });
}
