import { gsap } from 'gsap';
import { $$ } from './dom';
import { initTheme } from './theme';
import { repoGlyphs } from './glyphs';

initTheme();
repoGlyphs();
if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
  gsap.from('.oss header > *', { y: 24, opacity: 0, duration: .7, stagger: .08, ease: 'expo.out' });
  $$('.repo').forEach((rp, i) => gsap.from($$('rect', rp), { scale: 0, transformOrigin: 'center', opacity: 0, duration: .4, delay: .2 + i * .12, stagger: { each: .02, from: 'random' }, ease: 'back.out(3)' }));
}
