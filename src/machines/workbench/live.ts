import { translateAlong } from '../../lib/anatomy/iso-kit';
import type { Projection } from '../../lib/anatomy/iso-kit';
import { poseAt } from './geometry';

const STEPS = 4;
const DWELL_MS = 2400;

export function mountWorkbench(root: HTMLElement): () => void {
	if (matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {};

	const P: Projection = JSON.parse(root.dataset.projection!);
	const movers = [...root.querySelectorAll<SVGGElement>('[data-part]')];
	const labels = [...root.querySelectorAll<HTMLLIElement>('li[data-step]')];
	const readout = root.querySelector<HTMLElement>('[data-readout]')!;
	let step = STEPS;
	let timer = 0;
	let touring = true;
	let visible = false;
	let paused = false;

	const show = (next: number) => {
		step = ((next - 1 + STEPS) % STEPS) + 1;
		const pose = poseAt(step);
		for (const g of movers) g.setAttribute('transform', translateAlong(P, pose[g.dataset.part as keyof typeof pose]));
		root.dataset.at = String(step);
		labels.forEach((li, i) => (i + 1 === step ? li.setAttribute('aria-current', 'step') : li.removeAttribute('aria-current')));
		readout.textContent = `${step} / ${STEPS}`;
	};
	const schedule = () => {
		clearTimeout(timer);
		if (touring && visible && !paused) timer = window.setTimeout(() => (show(step + 1), schedule()), DWELL_MS);
	};
	const manual = (delta: number) => {
		touring = false;
		clearTimeout(timer);
		show(step + delta);
	};

	const prev = root.querySelector<HTMLButtonElement>('[data-prev]')!;
	const next = root.querySelector<HTMLButtonElement>('[data-next]')!;
	const onPrev = () => manual(-1);
	const onNext = () => manual(1);
	const pause = () => ((paused = true), clearTimeout(timer));
	const resume = () => ((paused = false), schedule());
	prev.addEventListener('click', onPrev);
	next.addEventListener('click', onNext);
	root.addEventListener('pointerenter', pause);
	root.addEventListener('pointerleave', resume);
	root.addEventListener('focusin', pause);
	root.addEventListener('focusout', resume);
	const io = new IntersectionObserver(([entry]) => {
		visible = entry.isIntersecting;
		visible ? schedule() : clearTimeout(timer);
	});
	io.observe(root);
	show(1);

	return () => {
		clearTimeout(timer);
		io.disconnect();
		prev.removeEventListener('click', onPrev);
		next.removeEventListener('click', onNext);
		root.removeEventListener('pointerenter', pause);
		root.removeEventListener('pointerleave', resume);
		root.removeEventListener('focusin', pause);
		root.removeEventListener('focusout', resume);
	};
}
