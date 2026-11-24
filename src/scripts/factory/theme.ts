import { gsap } from 'gsap';
import { $, motion } from './dom';

export function initTheme() {
  initMenu();
  const toggle = $<HTMLButtonElement>('.toggle');
  const syncToggle = () => {
    const dark = document.documentElement.dataset.theme === 'dark';
    toggle.setAttribute('aria-pressed', String(dark));
    toggle.setAttribute('aria-label', dark ? 'Dark theme on. Switch to light' : 'Light theme on. Switch to dark');
  };
  syncToggle();
  // the browser's own UI (scrollbars, form controls) follows the chosen scheme through <meta name="color-scheme">
  const applyMeta = (theme: string) => {
    document.querySelector('meta[name="color-scheme"]')?.setAttribute('content', theme);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0c0e14' : '#efe7d6');
  };
  applyMeta(document.documentElement.dataset.theme || 'light');
  toggle.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('a6n-theme-v2', next);
    applyMeta(next);
    syncToggle();
  });

  const pause = document.querySelector<HTMLButtonElement>('.motion-btn');
  pause?.addEventListener('click', () => {
    motion.set(!motion.paused);
    pause.textContent = motion.paused ? 'Play motion' : 'Pause motion';
  });
  return toggle;
}

// the phone menu: a full-screen ink sheet that wipes down like a press plate, links stamping in one by one.
// Opening, Escape and focus come from the native popover; GSAP only plays the entrance and the exit.
export function initMenu() {
  const menu = document.querySelector<HTMLElement>('#site-menu');
  if (!menu) return;
  const still = matchMedia('(prefers-reduced-motion: reduce)');
  const links = [...menu.querySelectorAll<HTMLElement>('.menu-link')];
  const rest = [...menu.querySelectorAll<HTMLElement>('.menu-top, .menu-foot')];
  const close = menu.querySelector<HTMLButtonElement>('.menu-close')!;
  menu.addEventListener('toggle', (e) => {
    if ((e as ToggleEvent).newState !== 'open') return;
    close.focus({ preventScroll: true });        // keyboard and screen reader users start inside the sheet
    if (still.matches) return;
    gsap.killTweensOf([menu, ...links, ...rest]);
    gsap.timeline()
      .fromTo(menu, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: .55, ease: 'expo.inOut' })
      .fromTo(links, { yPercent: 60, opacity: 0, scale: .96 }, { yPercent: 0, opacity: 1, scale: 1, duration: .5, ease: 'back.out(2.2)', stagger: .06 }, '-=.2')
      .fromTo(rest, { opacity: 0 }, { opacity: 1, duration: .35, stagger: .05 }, '<');
  });
  close.addEventListener('click', (e) => {
    if (still.matches) return;
    e.preventDefault();                       // play the plate back up, then hide
    gsap.to(menu, { clipPath: 'inset(0 0 100% 0)', duration: .4, ease: 'expo.in', onComplete: () => { menu.hidePopover(); gsap.set(menu, { clearProps: 'clipPath' }); } });
  });
}
