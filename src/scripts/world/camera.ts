// The camera over the world sheet: where it rests for each stop, and where it is at any scroll position.
// Pure maths, no DOM: world units in, world units out.

/** The world point at the centre of the viewport, and the zoom (screen px per world unit). */
export type Cam = { x: number; y: number; z: number };
export type Box = { x: number; y: number; w: number; h: number };
export type Side = 'left' | 'right' | 'below';

/** Each stop takes 1.6 viewport heights of scroll: 0.6 travelling in, then 1.0 dwelling. */
export const STOP_VH = 1.6;
const TRAVEL = 0.6 / STOP_VH;
const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2); // power2.inOut

/**
 * The camera that frames a region beside its text panel. On wide screens the region fills 58% of the
 * width on the side away from the panel (8% margins); on phones it fills the width less 16px gutters
 * and sits in the top of the screen, with the panel below.
 */
export function fit(r: Box | 'whole', vw: number, vh: number, side: Side, world: { w: number; h: number } = { w: 7200, h: 4600 }): Cam {
	if (r === 'whole') {
		const z = Math.min(vw / world.w, vh / world.h) * 0.94;
		return { x: world.w / 2, y: world.h / 2, z };
	}
	const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
	if (side === 'below') {
		const z = (vw - 32) / r.w;
		// the region's centre sits at 34% of the screen height, leaving the lower part for the panel
		return { x: cx, y: cy + (vh * 0.5 - vh * 0.34) / z, z };
	}
	const z = Math.min((vw * 0.58) / r.w, (vh * 0.84) / r.h);
	const at = side === 'right' ? 0.08 + 0.29 : 1 - 0.08 - 0.29; // the region's centre, as a share of the width
	return { x: cx + (vw * 0.5 - vw * at) / z, y: cy, z };
}

/** The camera at `t` stop units: integer n starts stop n, whose first 0.375 is the travel from the stop before. */
export function cameraAt(t: number, keys: Cam[]): Cam {
	if (!keys.length) return { x: 0, y: 0, z: 1 };
	const n = Math.max(0, Math.min(keys.length - 1, Math.floor(t)));
	if (t >= keys.length || n === 0) return n === 0 && t < 1 ? keys[0] : keys[keys.length - 1];
	const local = t - n;
	if (local >= TRAVEL) return keys[n];
	const a = keys[n - 1], b = keys[n], e = ease(local / TRAVEL);
	return { x: a.x + (b.x - a.x) * e, y: a.y + (b.y - a.y) * e, z: Math.exp(Math.log(a.z) + (Math.log(b.z) - Math.log(a.z)) * e) };
}

export const scrollForStop = (i: number, vh: number) => i * STOP_VH * vh;
export const stopIndexForScroll = (y: number, vh: number) => Math.max(0, Math.floor(y / (STOP_VH * vh)));

/** Whether a region falls inside the viewport, grown by `margin` of its size on every side. */
export function visible(r: Box, cam: Cam, vw: number, vh: number, margin = 0.25): boolean {
	const hw = (vw / (2 * cam.z)) * (1 + margin), hh = (vh / (2 * cam.z)) * (1 + margin);
	return r.x < cam.x + hw && r.x + r.w > cam.x - hw && r.y < cam.y + hh && r.y + r.h > cam.y - hh;
}

/** Keeps the view inside the sheet: never past an edge while the view is smaller than the sheet, centred when it is not. */
export function clampCam(c: Cam, vw: number, vh: number, world: { w: number; h: number } = { w: 7200, h: 4600 }): Cam {
	const hw = vw / 2 / c.z, hh = vh / 2 / c.z;
	const x = hw * 2 >= world.w ? world.w / 2 : Math.min(world.w - hw, Math.max(hw, c.x));
	const y = hh * 2 >= world.h ? world.h / 2 : Math.min(world.h - hh, Math.max(hh, c.y));
	return x === c.x && y === c.y ? c : { x, y, z: c.z };
}

/** The camera `k` of the way (0-1, eased) through a flight from one place to another: the travel between pages. */
export function flight(a: Cam, b: Cam, k: number): Cam {
	if (k <= 0) return a;
	if (k >= 1) return b;
	const e = ease(k);
	return { x: a.x + (b.x - a.x) * e, y: a.y + (b.y - a.y) * e, z: Math.exp(Math.log(a.z) + (Math.log(b.z) - Math.log(a.z)) * e) };
}
