// When the world gives way to the still page: reduced motion, no canvas, a low-memory device, or a
// world that cannot hold 40 fps in its first two seconds.
export type DegradeEnv = { reduced: boolean; canvas: boolean; deviceMemory?: number; fps?: number };

export const shouldDegrade = (e: DegradeEnv): boolean =>
	e.reduced || !e.canvas || (e.deviceMemory !== undefined && e.deviceMemory <= 2) || (e.fps !== undefined && e.fps < 40);

/** Frames per second over `ms` of animation frames. */
export const measureFps = (ms = 2000): Promise<number> =>
	new Promise((resolve) => {
		let frames = 0;
		const start = performance.now();
		const tick = (t: number) => {
			frames++;
			if (t - start < ms) requestAnimationFrame(tick);
			else resolve((frames * 1000) / (t - start));
		};
		requestAnimationFrame(tick);
	});
