import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// One entrance per section: heading block first, then its plate or cards, once, as they scroll in.
// Without JS or with reduced motion nothing is hidden.
export function revealSections(): void {
	if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
	gsap.registerPlugin(ScrollTrigger);
	for (const section of document.querySelectorAll<HTMLElement>('[data-reveal]')) {
		const parts = section.querySelectorAll<HTMLElement>('[data-reveal-item]');
		const targets = parts.length ? [...parts] : [section];
		gsap.from(targets, {
			opacity: 0,
			y: 28,
			duration: 0.8,
			ease: 'power3.out',
			stagger: 0.12,
			clearProps: 'opacity,transform',
			scrollTrigger: { trigger: section, start: 'top 82%', once: true },
		});
	}
}
