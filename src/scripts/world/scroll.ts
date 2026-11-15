// Binds a page's stops to the world: scroll position becomes the camera, arriving at a place plays its film,
// travelling between places draws the line that joins them, and the finale inks the Vitruvian in.
import { cameraAt, clampCam, fit, type Cam } from './camera.ts';
import { boxOf, REGIONS, STOPS, STROKES } from './layout.ts';
import type { World } from './render.ts';

const TRAVEL = 0.375;
const GROUP_IDS: Record<string, string[]> = {
	street: ['street-new', 'street-move', 'street-grow'],
	workshops: ['workshop-tiffingrab', 'workshop-puchkaman', 'workshop-xplorers', 'workshop-copper-cloves'],
};
const regionsOf = (target: string) => (GROUP_IDS[target] ?? [target]).filter((id) => REGIONS.some((r) => r.id === id && r.film));
const strokesBetween = (from: string, to: string): string[] => {
	const id = (s: { from: string; to: string }) => `${s.from}>${s.to}`;
	const direct = STROKES.find((s) => s.from === from && s.to === to);
	if (direct) return [id(direct)];
	const out = STROKES.find((s) => s.from === from), back = out && STROKES.find((s) => s.from === out.to && s.to === to);
	return out && back ? [id(out), id(back)] : [];
};

/** The camera keys for a page's stops, fitted to the current viewport. */
export function keysFor(ids: string[], vw: number, vh: number): Cam[] {
	return ids.map((id) => {
		const stop = STOPS.find((s) => s.id === id)!;
		const side = vw < 768 ? 'below' : stop.side;
		return stop.target === 'whole' ? fit('whole', vw, vh, side) : fit(boxOf(stop.target)!, vw, vh, side);
	});
}

export function bindJourney(stops: HTMLElement[], world: World): () => void {
	const ids = stops.map((s) => s.dataset.stop!);
	const targets = ids.map((id) => STOPS.find((s) => s.id === id)!.target);
	let keys: Cam[] = [], tops: number[] = [], heights: number[] = [];
	const measure = () => {
		keys = keysFor(ids, innerWidth, innerHeight);
		tops = stops.map((s) => s.getBoundingClientRect().top + scrollY);
		heights = stops.map((s) => s.offsetHeight);
	};
	const arrived = new Set<number>();
	const tick = () => {
		const y = scrollY + innerHeight * 0.0;
		let i = -1;
		for (let k = 0; k < tops.length; k++) if (y >= tops[k]) i = k;
		const t = i < 0 ? 0 : i + Math.min(0.999, (y - tops[i]) / heights[i]);
		world.setCamera(clampCam(cameraAt(t, keys), innerWidth, innerHeight));
		// the line from the place before draws as the camera travels to this one
		for (let k = 1; k < targets.length; k++) {
			const p = k < Math.floor(t) ? 1 : k === Math.floor(t) ? Math.min(1, (t - k) / TRAVEL) : 0;
			for (const s of strokesBetween(targets[k - 1], targets[k])) world.setStrokeProgress(s, p);
		}
		// arriving: the place draws itself, once
		if (i >= 0 && t - i >= TRAVEL && !arrived.has(i)) {
			arrived.add(i);
			// places left behind finish at once, so the place you are at draws now, not after them
			targets.forEach((tg, k) => k !== i && (k < i || arrived.has(k)) && tg !== 'whole' && regionsOf(tg).forEach((r) => world.skip(r)));
			if (targets[i] === 'whole') REGIONS.forEach((r) => r.film && world.markDrawn(r.id));
			// a group's places draw quicker, one after another, so arriving at the street or the workshops stays brisk
			else { const rs = regionsOf(targets[i]); rs.forEach((r) => world.playRegion(r, rs.length > 1 ? 3 : 1.5)); }
		}
		// the finale: every place drawn, the Vitruvian inking in over its dwell
		if (i >= 0 && targets[i] === 'whole') world.revealVitruvian(Math.max(0, Math.min(1, (t - i - TRAVEL) / 0.3)));
	};
	measure();
	tick();
	const onResize = () => { measure(); tick(); };
	addEventListener('scroll', tick, { passive: true });
	addEventListener('resize', onResize);
	return () => {
		removeEventListener('scroll', tick);
		removeEventListener('resize', onResize);
	};
}
