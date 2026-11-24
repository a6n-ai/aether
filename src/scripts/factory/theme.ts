import { $ } from './dom';

export function initTheme() {
  const toggle = $<HTMLButtonElement>('.toggle');
  const syncToggle = () => {
    const dark = document.documentElement.dataset.theme === 'dark';
    toggle.setAttribute('aria-pressed', String(dark));
    toggle.setAttribute('aria-label', dark ? 'Dark theme on. Switch to light' : 'Light theme on. Switch to dark');
  };
  syncToggle();
  toggle.addEventListener('click', () => {
    document.documentElement.dataset.theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('a6n-theme-v2', document.documentElement.dataset.theme);
    syncToggle();
  });
  return toggle;
}
