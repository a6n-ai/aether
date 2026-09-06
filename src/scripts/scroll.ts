import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

function kill(): void {
	ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
}

function spinSmallGears(): void {
	gsap.utils.toArray<SVGGElement>('[data-gear="small"]').forEach((gear) => {
		gsap.to(gear, {
			rotate: 360,
			transformOrigin: '50% 50%',
			duration: 8,
			repeat: -1,
			ease: 'none',
			scrollTrigger: {
				trigger: gear,
				start: 'top 90%',
				toggleActions: 'play pause resume pause',
			},
		});
	});
}

function drawMeridians(): void {
	const globe = document.querySelector('[data-strip="globe"]');
	if (!globe) return;

	const marks = gsap.utils.toArray<SVGGeometryElement>(
		'[data-meridians] ellipse, [data-meridians] line',
	);
	marks.forEach((mark) => {
		let length = 0;
		try {
			length = mark.getTotalLength();
		} catch {
			return;
		}
		if (!length) return;
		mark.style.strokeDasharray = `${length}`;
		gsap.fromTo(
			mark,
			{ strokeDashoffset: length },
			{
				strokeDashoffset: 0,
				ease: 'none',
				scrollTrigger: {
					trigger: globe,
					start: 'top 75%',
					end: 'top 30%',
					scrub: 0.6,
				},
			},
		);
	});
}

function staggerCells(selector: string): void {
	const cells = gsap.utils.toArray<HTMLElement>(`${selector} [data-cell]`);
	if (!cells.length) return;
	gsap.fromTo(
		cells,
		{ y: 16 },
		{
			y: 0,
			duration: 0.55,
			stagger: 0.1,
			ease: 'power2.out',
			scrollTrigger: {
				trigger: selector,
				start: 'top 82%',
				once: true,
			},
		},
	);
}

export function initScroll(): void {
	kill();

	const media = gsap.matchMedia();

	media.add('(prefers-reduced-motion: reduce)', () => {
		gsap.set('[data-cell], [data-envelope], [data-globe], [data-gear], .cover-copy > *', {
			clearProps: 'all',
		});
	});

	media.add('(prefers-reduced-motion: no-preference)', () => {
		const intro = gsap.utils.toArray<HTMLElement>('.cover-copy > *');
		if (intro.length) {
			gsap.fromTo(
				intro,
				{ y: 18 },
				{
					y: 0,
					duration: 0.7,
					stagger: 0.08,
					ease: 'power2.out',
				},
			);
		}

		gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((section) => {
			const copy = section.querySelectorAll<HTMLElement>(':scope > .copy');
			if (!copy.length) return;
			gsap.fromTo(
				copy,
				{ y: 18 },
				{
					y: 0,
					duration: 0.55,
					stagger: 0.06,
					ease: 'power2.out',
					scrollTrigger: {
						trigger: section,
						start: 'top 82%',
						once: true,
					},
				},
			);
		});

		staggerCells('[data-strip="day"]');
		staggerCells('[data-strip="how"]');
		staggerCells('[data-strip="places"]');
		staggerCells('[data-strip="mail"]');

		spinSmallGears();
		drawMeridians();

		const globe = document.querySelector('[data-globe]');
		if (globe) {
			gsap.to(globe, {
				rotate: 360,
				transformOrigin: '50% 50%',
				duration: 80,
				repeat: -1,
				ease: 'none',
				scrollTrigger: {
					trigger: '[data-strip="globe"]',
					start: 'top 85%',
					toggleActions: 'play pause resume pause',
				},
			});
		}

		const envelope = document.querySelector('[data-envelope]');
		if (envelope) {
			gsap.to(envelope, {
				y: -10,
				repeat: -1,
				yoyo: true,
				duration: 1.4,
				ease: 'sine.inOut',
				scrollTrigger: {
					trigger: '[data-strip="mail"]',
					start: 'top 85%',
					toggleActions: 'play pause resume pause',
				},
			});
		}

		const refresh = () => ScrollTrigger.refresh();
		window.addEventListener('load', refresh);
		window.addEventListener('hashchange', refresh);
		document.fonts?.ready.then(refresh).catch(() => undefined);

		return () => {
			window.removeEventListener('load', refresh);
			window.removeEventListener('hashchange', refresh);
			kill();
		};
	});

	if (import.meta.hot) {
		import.meta.hot.dispose(() => {
			media.revert();
			kill();
		});
	}
}
