// Page engine. The client router swaps pages without reloading (the world canvas persists), so scroll is set
// up once and each page's reveals and scroll triggers are set up on every swap, and torn down before it.
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initScroll, scrollToY, syncScroll } from './scroll';
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
	// the router swaps <html>'s attributes for the new page's: keep the classes this session set up
	let kept: string[] = [];
	document.addEventListener('astro:before-swap', () => { kept = ['js', 'motion', 'world', 'flat', 'lenis'].filter((c) => document.documentElement.classList.contains(c)); });
	document.addEventListener('astro:after-swap', () => kept.forEach((c) => document.documentElement.classList.add(c)));
	let traverse = false;
	document.addEventListener('astro:before-preparation', (e) => { traverse = (e as Event & { navigationType?: string }).navigationType === 'traverse'; });
	// every page, including the first: reveals and a fresh measure of the page
	let swapped = false;
	document.addEventListener('astro:after-swap', () => { swapped = true; });
	document.addEventListener('astro:page-load', () => {
		// only after a swap: on the first load (and a reload) the browser's own scroll restore stands
		// again on the next two frames: Lenis applies its last page's target once more before the reset takes
		if (swapped) { const t = traverse; syncScroll(t); requestAnimationFrame(() => { syncScroll(t); requestAnimationFrame(() => syncScroll(t)); }); }
		traverse = false;
		initReveals(document).play();
		document.fonts.ready.then(() => ScrollTrigger.refresh());
	});
	// leaving a page: its scroll triggers go with it (the world's own camera binding is re-made per page)
	document.addEventListener('astro:before-swap', () => ScrollTrigger.getAll().forEach((t) => t.kill()));
}
