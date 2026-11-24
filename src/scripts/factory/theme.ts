import { $, motion } from './dom';

export function initTheme() {
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
