// Page engine for a multi-page site: every navigation is a full load (the browser's
// cross-document View Transition covers the swap), so boot() runs once per page.
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initScroll } from './scroll';
import { initReveals } from './reveal';
import { prefersReducedMotion } from './env';

export { onScroll, scrollState } from './scroll';
export { ease, isTouch, isMobile, prefersReducedMotion } from './env';

export function boot() {
	document.documentElement.classList.toggle('motion', !prefersReducedMotion());
	initScroll();
	const intro = initReveals(document);
	intro.play();
	document.fonts.ready.then(() => ScrollTrigger.refresh());
}
