import gsap from 'gsap';

export function initMenu(): void {
	const menuBtn = document.getElementById('menu-toggle') as HTMLButtonElement | null;
	const closeBtn = document.getElementById('menu-close') as HTMLButtonElement | null;
	const index = document.getElementById('index');
	if (!menuBtn || !closeBtn || !index) return;

	const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	const links = index.querySelectorAll<HTMLElement>('a, .index-close, .index-theme');

	function setOpen(open: boolean): void {
		if ((menuBtn.getAttribute('aria-expanded') === 'true') === open) return;
		menuBtn.setAttribute('aria-expanded', String(open));
		index.setAttribute('aria-hidden', String(!open));
		document.body.style.overflow = open ? 'hidden' : '';
		gsap.killTweensOf([index, ...links]);

		if (reduce) {
			gsap.set(index, { display: open ? 'flex' : 'none', autoAlpha: open ? 1 : 0 });
			if (open) closeBtn.focus();
			else menuBtn.focus();
			return;
		}

		if (open) {
			gsap.set(index, { display: 'flex', autoAlpha: 0 });
			gsap.to(index, { autoAlpha: 1, duration: 0.28, ease: 'power2.out' });
			gsap.fromTo(
				links,
				{ y: 16, autoAlpha: 0 },
				{ y: 0, autoAlpha: 1, duration: 0.35, stagger: 0.045, ease: 'power2.out' },
			);
			closeBtn.focus();
		} else {
			gsap.to(index, {
				autoAlpha: 0,
				duration: 0.2,
				ease: 'power1.in',
				onComplete: () => {
					gsap.set(index, { display: 'none', autoAlpha: 0 });
				},
			});
			if (index.contains(document.activeElement)) menuBtn.focus();
		}
	}

	gsap.set(index, { display: 'none', autoAlpha: 0 });
	index.setAttribute('aria-hidden', 'true');

	menuBtn.addEventListener('click', () => {
		setOpen(menuBtn.getAttribute('aria-expanded') !== 'true');
	});
	closeBtn.addEventListener('click', () => setOpen(false));
	index.querySelectorAll('a[data-close]').forEach((node) => {
		node.addEventListener('click', () => setOpen(false));
	});
	index.addEventListener('click', (event) => {
		if (event.target === index) setOpen(false);
	});
	window.addEventListener('keydown', (event) => {
		if (event.key === 'Escape') setOpen(false);
	});
}
