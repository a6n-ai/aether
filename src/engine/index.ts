// Page engine. The client router swaps pages without reloading (the world canvas persists), so scroll is set
// up once and each page's reveals and scroll triggers are set up on every swap, and torn down before it.
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initScroll, scrollToY } from './scroll';
import { initReveals } from './reveal';
import { prefersReducedMotion } from './env';

export { onScroll, scrollState, scrollToY } from './scroll';
export { ease, isTouch, isMobile, prefersReducedMotion } from './env';

let booted = false;
export function boot() {
	if (booted) return;
	booted = true;
	// a handle for the world's page travel and for driving the page from a test browser
	(window as Window & { a6nScrollTo?: (y: number) => void }).a6nScrollTo = scrollToY;
	document.documentElement.classList.toggle('motion', !prefersReducedMotion());
	initScroll();
	// every page, including the first: reveals and a fresh measure of the page
	document.addEventListener('astro:page-load', () => {
		initReveals(document).play();
		document.fonts.ready.then(() => ScrollTrigger.refresh());
	});
	// leaving a page: its scroll triggers go with it (the world's own camera binding is re-made per page)
	document.addEventListener('astro:before-swap', () => ScrollTrigger.getAll().forEach((t) => t.kill()));
}
