// Site-wide pointer craft: the pigment fill on calls to action, and the nav that steps aside on the way down.
import { gsap } from 'gsap';
import { ease, isTouch, onScroll, prefersReducedMotion } from '../engine';

export function initButtons() {
	if (isTouch() || prefersReducedMotion()) return; // CSS :active covers touch; reduced motion fills without moving
	document.querySelectorAll<HTMLElement>('.btn-call').forEach((btn) => {
		let fill = btn.querySelector<HTMLElement>('.btn-fill');
		if (!fill) {
			fill = document.createElement('span');
			fill.className = 'btn-fill';
			fill.setAttribute('aria-hidden', 'true');
			btn.prepend(fill);
		}
		const at = (e?: PointerEvent) => {
			if (!e) return '50% 50%';
			const r = btn.getBoundingClientRect();
			return `${e.clientX - r.left}px ${e.clientY - r.top}px`;
		};
		let closed = true;
		const open = (p: string) => {
			if (closed) gsap.set(fill, { clipPath: `circle(0% at ${p})` });
			closed = false;
			btn.classList.add('is-filled');
			gsap.to(fill, { clipPath: `circle(150% at ${p})`, duration: 0.6, ease: ease.soft, overwrite: true });
		};
		const close = (p: string) => {
			btn.classList.remove('is-filled');
			gsap.to(fill, { clipPath: `circle(0% at ${p})`, duration: 0.5, ease: ease.soft, overwrite: true, onComplete: () => void (closed = true) });
		};
		btn.addEventListener('pointerenter', (e) => open(at(e)));
		btn.addEventListener('pointerleave', (e) => close(at(e)));
		btn.addEventListener('focus', () => btn.matches(':focus-visible') && open(at()));
		btn.addEventListener('blur', () => close(at()));
	});
}

export function initNav() {
	let last = 0;
	onScroll(({ y }) => {
		if (Math.abs(y - last) < 4) return;
		const root = document.documentElement.classList;
		root.toggle('nav-away', y > 240 && y > last);
		root.toggle('nav-solid', y > 24);
		last = y;
	});
}
