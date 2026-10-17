import gsap from 'gsap';

const DWELL_MS = 2600;
// One eased glide per step; movers leave a beat apart so the eye can follow each ingredient.
const GLIDE = { duration: 0.95, ease: 'power3.inOut', stagger: 0.09, overwrite: 'auto' } as const;

export function mountPlate(root: HTMLElement): () => void {
	const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
	const transforms: Record<string, string[]> = JSON.parse(root.dataset.transforms ?? '{}');
	const steps = Number(root.dataset.steps);
	const movers = [...root.querySelectorAll<SVGGElement>('.mover[data-part]')];
	const staged = [...root.querySelectorAll<SVGGElement>('[data-at]')].filter((g) => g.closest('svg'));
	const labels = [...root.querySelectorAll<HTMLLIElement>('li[data-step]')];
	const readout = root.querySelector<HTMLElement>('[data-readout]')!;
	const nav = root.querySelector<HTMLElement>('.nav')!;
	// The page renders the final step; the tour rewinds to step 1 only once the plate is seen, so nothing jumps on load.
	let step = steps;
	let started = false;
	let timer = 0;
	let touring = !still;
	let visible = false;
	let paused = false;

	const show = (next: number, instant = false) => {
		step = ((next - 1 + steps) % steps) + 1;
		const moving = movers.filter((g) => transforms[g.dataset.part!]?.[step - 1] !== g.getAttribute('transform'));
		if (instant) moving.forEach((g) => g.setAttribute('transform', transforms[g.dataset.part!][step - 1]));
		else if (moving.length) gsap.to(moving, { ...GLIDE, attr: { transform: (_: number, g: SVGGElement) => transforms[g.dataset.part!][step - 1] } });
		for (const g of staged) g.classList.toggle('on', step >= Number(g.dataset.at));
		labels.forEach((li, i) => (i + 1 === step ? li.setAttribute('aria-current', 'step') : li.removeAttribute('aria-current')));
		readout.textContent = `${step} / ${steps}`;
	};
	const schedule = () => {
		clearTimeout(timer);
		if (touring && visible && !paused) timer = window.setTimeout(() => (show(step + 1), schedule()), DWELL_MS);
	};
	// Manual steps stop the tour for good and are announced; the auto tour stays silent.
	const manual = (delta: number) => {
		touring = false;
		clearTimeout(timer);
		readout.setAttribute('aria-live', 'polite');
		show(step + delta, still);
	};

	const prev = root.querySelector<HTMLButtonElement>('[data-prev]')!;
	const next = root.querySelector<HTMLButtonElement>('[data-next]')!;
	const onPrev = () => manual(-1);
	const onNext = () => manual(1);
	const pause = () => ((paused = true), clearTimeout(timer));
	const resume = () => ((paused = false), schedule());
	nav.hidden = false;
	prev.addEventListener('click', onPrev);
	next.addEventListener('click', onNext);
	root.addEventListener('pointerenter', pause);
	root.addEventListener('pointerleave', resume);
	root.addEventListener('focusin', pause);
	root.addEventListener('focusout', resume);
	const io = new IntersectionObserver(([entry]) => {
		visible = entry.isIntersecting;
		if (!visible) return clearTimeout(timer);
		if (touring && !started) {
			started = true;
			timer = window.setTimeout(() => (show(1), schedule()), DWELL_MS / 2);
			return;
		}
		schedule();
	});
	io.observe(root);

	return () => {
		clearTimeout(timer);
		gsap.killTweensOf(movers);
		io.disconnect();
		prev.removeEventListener('click', onPrev);
		next.removeEventListener('click', onNext);
		root.removeEventListener('pointerenter', pause);
		root.removeEventListener('pointerleave', resume);
		root.removeEventListener('focusin', pause);
		root.removeEventListener('focusout', resume);
	};
}
