// Declarative motion through data attributes:
//   data-split="lines|words"  masked text reveal (SplitText), on scroll or with the intro
//   data-reveal="soak|up"      block reveal; soak grows an uneven wet-plaster mask
//   data-intro                 play with the page intro instead of on scroll
//   data-delay="0.2"           extra delay (seconds)
// Skipped under reduced motion; CSS keeps content visible without JS.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { ease, prefersReducedMotion } from './env';

gsap.registerPlugin(ScrollTrigger, SplitText);

const durations = { lines: 1.2, words: 1.1 } as const;
const staggers = { lines: 0.08, words: 0.035 } as const;

function splitTween(el: HTMLElement, isIntro: boolean) {
	const type = (el.dataset.split || 'lines') as keyof typeof durations;
	const delay = parseFloat(el.dataset.delay || '0');
	const s = { tween: undefined as gsap.core.Tween | undefined, done: false, requested: false };
	SplitText.create(el, {
		type: type === 'lines' ? 'lines' : `lines,${type}`,
		mask: 'lines',
		autoSplit: true,
		linesClass: 'split-line',
		onSplit(self) {
			gsap.set(el, { visibility: 'visible' });
			if (s.done) return;
			const targets = type === 'lines' ? self.lines : self.words;
			s.tween = gsap.from(targets, {
				yPercent: 110,
				rotate: 2,
				duration: durations[type],
				stagger: staggers[type],
				ease: ease.out,
				delay,
				paused: isIntro && !s.requested,
				onComplete: () => {
					s.done = true;
				},
				scrollTrigger: isIntro ? undefined : { trigger: el, start: 'top 96%', once: true },
			});
			return s.tween;
		},
	});
	return () => {
		s.requested = true;
		s.tween?.play();
	};
}

// Wet plaster: an uneven polygon edge that rises through the block.
const soakPath = (p: number) => {
	const pts: string[] = [];
	for (let i = 0; i <= 12; i++) {
		const x = (i / 12) * 100;
		const wobble = Math.sin(i * 2.3) * 4 + Math.sin(i * 5.1) * 2;
		pts.push(`${x}% ${Math.min(100, Math.max(0, 100 - p * 112 + wobble * (1 - p)))}%`);
	}
	return `polygon(0% 100%, ${pts.join(', ')}, 100% 100%)`;
};

function blockTween(el: HTMLElement, paused: boolean) {
	const kind = el.dataset.reveal || 'up';
	const delay = parseFloat(el.dataset.delay || '0');
	gsap.set(el, { visibility: 'visible' });
	if (kind === 'soak') {
		const state = { p: 0 };
		el.style.clipPath = soakPath(0);
		return gsap.to(state, {
			p: 1,
			duration: 1.5,
			ease: ease.out,
			delay,
			paused,
			onUpdate: () => {
				el.style.clipPath = soakPath(state.p);
			},
			onComplete: () => {
				el.style.clipPath = '';
			},
			scrollTrigger: paused ? undefined : { trigger: el, start: 'top 90%', once: true },
		});
	}
	return gsap.fromTo(
		el,
		{ y: 40, autoAlpha: 0 },
		{ y: 0, autoAlpha: 1, duration: 1.2, ease: ease.out, delay, paused, clearProps: 'transform', scrollTrigger: paused ? undefined : { trigger: el, start: 'top 90%', once: true } },
	);
}

/** Wire every reveal in the document. Returns the intro timeline (paused). */
export function initReveals(root: ParentNode = document) {
	const intro = gsap.timeline({ paused: true });
	if (prefersReducedMotion()) return intro;
	root.querySelectorAll<HTMLElement>('[data-split]').forEach((el) => {
		const isIntro = el.hasAttribute('data-intro');
		const play = splitTween(el, isIntro);
		if (isIntro) intro.add(play, 0);
	});
	root.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
		const isIntro = el.hasAttribute('data-intro');
		const t = blockTween(el, isIntro);
		if (isIntro) intro.add(() => void t.play(), 0);
	});
	return intro;
}
