// The world's region films: each plays once, the first time its place is reached, and only one decodes at a
// time. Once played (or failed to play) a region is drawn for good, and shows its still from then on.

/** The parts of <video> the world uses; a stub stands in for it under test. */
export type FilmVideo = {
	src: string;
	preload: string;
	playbackRate: number;
	currentTime: number;
	muted: boolean;
	play(): Promise<void>;
	addEventListener(type: string, fn: () => void, opts?: { once?: boolean }): void;
};

/** A ramp of `n` alphas, 0 at both ends and 1 more than `edge` steps in: the feathered edge of a region. */
export const featherMask = (n: number, edge: number): number[] => Array.from({ length: n }, (_, i) => Math.min(1, Math.min(i, n - 1 - i) / edge));

export function createFilms(make: (id: string) => FilmVideo, rate = 1.5) {
	const drawn = new Set<string>();
	const videos = new Map<string, FilmVideo>();
	let current: string | null = null;
	let finish: (() => void) | null = null;
	let queue: Promise<void> = Promise.resolve();

	const run = (id: string, r = rate) =>
		new Promise<void>((resolve) => {
			const v = videos.get(id) ?? make(id);
			videos.set(id, v);
			current = id;
			let settled = false;
			const done = () => {
				if (settled) return;
				settled = true;
				drawn.add(id);
				current = null;
				finish = null;
				resolve();
			};
			finish = () => { (v as unknown as { pause?: () => void }).pause?.(); done(); };
			v.preload = 'auto';
			v.muted = true;
			v.playbackRate = r;
			v.addEventListener('ended', done, { once: true });
			v.addEventListener('error', done, { once: true });
			v.play().catch(done);
			// a browser may hold back a film it was not asked to preload; never leave a place unfinished
			setTimeout(() => v.currentTime === 0 && done(), 4000);
		});

	return {
		/** Play a region's film once; resolves when it has ended, failed, or was already drawn. */
		playRegion(id: string, r?: number): Promise<void> {
			if (drawn.has(id)) return Promise.resolve();
			queue = queue.then(() => (drawn.has(id) ? undefined : run(id, r)));
			return queue;
		},
		isDrawn: (id: string) => drawn.has(id),
		/** The region whose film is decoding now, if any. */
		playing: () => current,
		video: (id: string) => videos.get(id),
		/** Mark a region drawn without playing it (the finale, or a direct load past it). */
		markDrawn: (id: string) => drawn.add(id),
		/** A place left behind: its film stops (or never starts) and it shows its finished still. */
		skip(id: string) {
			if (current === id) finish?.();
			else drawn.add(id);
		},
	};
}
export type Films = ReturnType<typeof createFilms>;
