import gsap from 'gsap';

const DWELL_MS = 2600;
// One eased glide per step; movers leave a beat apart so the eye can follow each ingredient.
const GLIDE = { duration: 0.95, ease: 'power3.inOut', stagger: 0.09, overwrite: 'auto' } as const;
// Start fetching a plate's live SVG this far before it scrolls into view.
const PREFETCH = '600px 0px';

/** Swap the finished-plate <img> for the live inline SVG so its parts can move. */
async function inline(img: HTMLImageElement): Promise<SVGSVGElement | null> {
	try {
		const text = await (await fetch(img.dataset.svg ?? img.currentSrc ?? img.src)).text();
		const svg = new DOMParser().parseFromString(text, 'image/svg+xml').documentElement as unknown as SVGSVGElement;
		if (svg.nodeName !== 'svg') return null;
		svg.querySelector('style')?.remove(); // the page's own styles already cover it; the embedded copy is for <img>
		img.replaceWith(svg);
		return svg;
	} catch {
		return null; // the image stays: the plate still shows its finished story
	}
}

export function mountPlate(root: HTMLElement): () => void {
	const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
	const transforms: Record<string, string[]> = JSON.parse(root.dataset.transforms ?? '{}');
	const steps = Number(root.dataset.steps);
	const labels = [...root.querySelectorAll<HTMLLIElement>('li[data-step]')];
	const readout = root.querySelector<HTMLElement>('[data-readout]')!;
	const nav = root.querySelector<HTMLElement>('.nav')!;
	const prev = root.querySelector<HTMLButtonElement>('[data-prev]')!;
	const next = root.querySelector<HTMLButtonElement>('[data-next]')!;
	let movers: SVGGElement[] = [];
	let staged: SVGGElement[] = [];
	// The plate shows its final step; the tour rewinds to step 1 only once it is seen, so nothing jumps on load.
	let step = steps;
	let live = false;
	let started = false;
	let timer = 0;
	// A scrubbed plate is driven from outside (scroll) through a 'plate:step' event and never tours on its own.
	const scrubbed = root.hasAttribute('data-scrub');
	let touring = !still && !scrubbed;
	let visible = false;
	let paused = false;

	const show = (n: number, instant = false) => {
		step = ((n - 1 + steps) % steps) + 1;
		const moving = movers.filter((g) => transforms[g.dataset.part!]?.[step - 1] !== g.getAttribute('transform'));
		if (instant) moving.forEach((g) => g.setAttribute('transform', transforms[g.dataset.part!][step - 1]));
		else if (moving.length) gsap.to(moving, { ...GLIDE, attr: { transform: (_: number, g: SVGGElement) => transforms[g.dataset.part!][step - 1] } });
		for (const g of staged) g.classList.toggle('on', step >= Number(g.dataset.at));
		labels.forEach((li, i) => (i + 1 === step ? li.setAttribute('aria-current', 'step') : li.removeAttribute('aria-current')));
		readout.textContent = `${step} / ${steps}`;
	};
	const schedule = () => {
		clearTimeout(timer);
		if (live && touring && visible && !paused) timer = window.setTimeout(() => (show(step + 1), schedule()), DWELL_MS);
	};
	// Manual steps stop the tour for good and are announced; the auto tour stays silent.
	const manual = (delta: number) => {
		touring = false;
		clearTimeout(timer);
		readout.setAttribute('aria-live', 'polite');
		show(step + delta, still);
	};
	const onPrev = () => manual(-1);
	const onNext = () => manual(1);
	const pause = () => ((paused = true), clearTimeout(timer));
	const resume = () => ((paused = false), schedule());

	const begin = () => {
		if (!touring || started) return schedule();
		started = true;
		timer = window.setTimeout(() => (show(1), schedule()), DWELL_MS / 2);
	};
	const goLive = async () => {
		const img = root.querySelector<HTMLImageElement>('img[data-plate-img]');
		const svg = img ? await inline(img) : root.querySelector('svg');
		if (!svg) return;
		movers = [...svg.querySelectorAll<SVGGElement>('.mover[data-part]')];
		staged = [...svg.querySelectorAll<SVGGElement>('[data-at]')];
		live = true;
		nav.hidden = false;
		if (scrubbed && wanted) show(wanted, true);
		if (visible) begin();
	};

	let wanted = 0;
	const onStep = (e: Event) => {
		wanted = (e as CustomEvent<number>).detail;
		if (live && wanted !== step) show(wanted, still);
	};
	root.addEventListener('plate:step', onStep);
	prev.addEventListener('click', onPrev);
	next.addEventListener('click', onNext);
	root.addEventListener('pointerenter', pause);
	root.addEventListener('pointerleave', resume);
	root.addEventListener('focusin', pause);
	root.addEventListener('focusout', resume);
	const near = new IntersectionObserver(
		([entry]) => {
			if (!entry.isIntersecting) return;
			near.disconnect();
			goLive();
		},
		{ rootMargin: PREFETCH },
	);
	const seen = new IntersectionObserver(([entry]) => {
		visible = entry.isIntersecting;
		if (!visible) return clearTimeout(timer);
		if (live) begin();
	});
	near.observe(root);
	seen.observe(root);

	return () => {
		clearTimeout(timer);
		gsap.killTweensOf(movers);
		near.disconnect();
		seen.disconnect();
		root.removeEventListener('plate:step', onStep);
		prev.removeEventListener('click', onPrev);
		next.removeEventListener('click', onNext);
		root.removeEventListener('pointerenter', pause);
		root.removeEventListener('pointerleave', resume);
		root.removeEventListener('focusin', pause);
		root.removeEventListener('focusout', resume);
	};
}
