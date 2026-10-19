type Render = (target: HTMLElement, options?: { fig?: string; theme?: 'light'; tokens?: Record<string, string> }) => () => void;

// Static import strings so the bundler splits each figure into its own chunk.
const FIGURES = {
	'message-queue': () => import('anatomy-figures/element/message-queue'),
	computer: () => import('anatomy-figures/element/computer'),
	'hash-map': () => import('anatomy-figures/element/hash-map'),
	watch: () => import('anatomy-figures/element/watch'),
	'git-merge': () => import('anatomy-figures/element/git-merge'),
	dns: () => import('anatomy-figures/element/dns'),
	'tcp-handshake': () => import('anatomy-figures/element/tcp-handshake'),
	'rate-limiter': () => import('anatomy-figures/element/rate-limiter'),
	'public-key': () => import('anatomy-figures/element/public-key'),
} satisfies Record<string, () => Promise<{ render: Render }>>;

export type FigureName = keyof typeof FIGURES;

/** Rendered card height = slope × width + px, measured per figure; reserved before load so nothing shifts. */
export const SIZES: Record<FigureName, [slope: number, px: number]> = {
	'message-queue': [0.6667, 72],
	computer: [0.7333, 68.8],
	'hash-map': [0.6667, 72],
	watch: [0.9, 60.8],
	'git-merge': [0.5667, 76.8],
	dns: [0.7333, 68.8],
	'tcp-handshake': [0.6333, 73.6],
	'rate-limiter': [0.6, 75.2],
	'public-key': [0.5667, 76.8],
};

/** The figure's anatomy tokens, mixed from the stage's own --pigment and --lit like our plates. */
function tokensOf(stage: HTMLElement) {
	const css = getComputedStyle(stage);
	const card = css.getPropertyValue('--card');
	const pigment = css.getPropertyValue('--pigment');
	const lit = css.getPropertyValue('--lit');
	const mix = (pct: number) => `color-mix(in oklab, ${pigment} ${pct}%, ${card})`;
	return {
		'--anatomy-card': card,
		'--anatomy-paper': card,
		'--anatomy-face': mix(10),
		'--anatomy-top': mix(18),
		'--anatomy-shade-3': mix(30),
		'--anatomy-shade-2': mix(44),
		'--anatomy-shade-1': mix(58),
		'--anatomy-shade-0': mix(74),
		'--anatomy-faint': mix(26),
		'--anatomy-lo': mix(48),
		'--anatomy-mid': mix(78),
		// The corner title and hint, at the site's text contrast.
		'--anatomy-text': css.getPropertyValue('--text'),
		'--anatomy-muted': css.getPropertyValue('--muted'),
		'--anatomy-lit': lit,
		'--anatomy-lit-top': `color-mix(in oklab, ${lit} 62%, ${card})`,
		'--anatomy-lit-shade': `color-mix(in oklab, ${lit} 88%, ${card})`,
	};
}

/** Load and render the figure once it nears the viewport. */
export function mountFigure(stage: HTMLElement) {
	const load = FIGURES[stage.dataset.figure as FigureName];
	if (!load) return;
	const near = new IntersectionObserver(
		async ([entry]) => {
			if (!entry.isIntersecting) return;
			near.disconnect();
			const { render } = await load();
			render(stage, { fig: stage.dataset.fig, theme: 'light', tokens: tokensOf(stage) });
		},
		{ rootMargin: '600px 0px' },
	);
	near.observe(stage);
}
