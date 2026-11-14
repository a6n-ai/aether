// The a6n world: one sheet, 6400 x 4000 world units, laid out as a walk around its centre (see
// docs/superpowers/specs/2026-11-15-one-sheet-design.md). Pure numbers: the stills are attached in
// src/data/world.ts, which Astro can import and these tests cannot.
import type { Box, Side } from './camera.ts';

export const WORLD = { w: 6400, h: 4000 };

/** A drawn place on the sheet. `film` is its id under public/world/ (also its still's name); none for an area with no art. */
export type Region = Box & { id: string; film?: string };

// Drafting pieces are 1400 x 900, chalk pieces 1200 x 800; the street's three shops and the four
// workshops are shown smaller so each row fits the sheet.
const S = 0.8, W = 0.7;
export const REGIONS: Region[] = [
	{ id: 'bench', film: 'bench', x: 250, y: 250, w: 1400, h: 900 },
	{ id: 'shop', film: 'shop', x: 1900, y: 300, w: 1200, h: 800 },
	{ id: 'street-new', film: 'street-new', x: 3350, y: 330, w: 1200 * S, h: 800 * S },
	{ id: 'street-move', film: 'street-move', x: 4380, y: 330, w: 1200 * S, h: 800 * S },
	{ id: 'street-grow', film: 'street-grow', x: 5410, y: 330, w: 1200 * S, h: 800 * S },
	{ id: 'post', film: 'post', x: 4900, y: 1350, w: 1400 * 0.85, h: 900 * 0.85 },
	{ id: 'workshop-tiffingrab', film: 'workshop-tiffingrab', x: 5300, y: 2950, w: 1400 * W, h: 900 * W },
	{ id: 'workshop-puchkaman', film: 'workshop-puchkaman', x: 4200, y: 2950, w: 1400 * W, h: 900 * W },
	{ id: 'workshop-xplorers', film: 'workshop-xplorers', x: 3100, y: 2950, w: 1400 * W, h: 900 * W },
	{ id: 'workshop-copper-cloves', film: 'workshop-copper-cloves', x: 2000, y: 2950, w: 1400 * W, h: 900 * W },
	{ id: 'road', film: 'road', x: 250, y: 2750, w: 1200, h: 800 },
	{ id: 'notes', x: 300, y: 1450, w: 1300, h: 900 },
	{ id: 'vitruvian', x: 2700, y: 1370, w: 1000, h: 1260 },
	{ id: 'corner', x: 5700, y: 3720, w: 600, h: 240 },
];

/** A few regions read as one place: the street's three shops, and the four workshops. */
const GROUPS: Record<string, string[]> = {
	street: ['street-new', 'street-move', 'street-grow'],
	workshops: ['workshop-tiffingrab', 'workshop-puchkaman', 'workshop-xplorers', 'workshop-copper-cloves'],
};

/** The box a stop frames: a region, a group of regions, or the whole sheet. */
export function boxOf(target: string): Box | null {
	if (target === 'whole') return { x: 0, y: 0, w: WORLD.w, h: WORLD.h };
	const ids = GROUPS[target] ?? [target];
	const rs = ids.map((id) => REGIONS.find((r) => r.id === id)).filter((r): r is Region => !!r);
	if (!rs.length) return null;
	const x0 = Math.min(...rs.map((r) => r.x)), y0 = Math.min(...rs.map((r) => r.y));
	const x1 = Math.max(...rs.map((r) => r.x + r.w)), y1 = Math.max(...rs.map((r) => r.y + r.h));
	return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

export type Stop = { id: string; page: string; target: string; side: Exclude<Side, 'below'> };
export const STOPS: Stop[] = [
	{ id: 'bench', page: '/', target: 'bench', side: 'right' },
	{ id: 'shop', page: '/', target: 'shop', side: 'left' },
	{ id: 'street', page: '/', target: 'street', side: 'left' },
	{ id: 'post', page: '/', target: 'post', side: 'left' },
	{ id: 'workshops', page: '/', target: 'workshops', side: 'right' },
	{ id: 'notes', page: '/', target: 'notes', side: 'right' },
	{ id: 'finale', page: '/', target: 'whole', side: 'right' },
	{ id: 'road', page: '/how-it-works/', target: 'road', side: 'right' },
	{ id: 'questions', page: '/how-it-works/', target: 'notes', side: 'right' },
	...['tiffingrab', 'puchkaman', 'xplorers', 'copper-cloves'].map((slug): Stop => ({ id: slug, page: `/clients/${slug}/`, target: `workshop-${slug}`, side: 'right' })),
	{ id: 'corner', page: '404', target: 'corner', side: 'left' },
];

/** Red-chalk lines joining the places along the walk, drawn as the camera travels between them. */
export type Stroke = { from: string; to: string; d: string };
const join = (from: string, to: string): Stroke => {
	const a = boxOf(from)!, b = boxOf(to)!;
	const p = [a.x + a.w / 2, a.y + a.h / 2], q = [b.x + b.w / 2, b.y + b.h / 2];
	// leave and arrive at the nearer edges, bowing a little away from the centre of the sheet
	const ax = p[0] + Math.sign(q[0] - p[0]) * (Math.abs(q[0] - p[0]) > Math.abs(q[1] - p[1]) ? a.w / 2 : 0);
	const ay = p[1] + Math.sign(q[1] - p[1]) * (Math.abs(q[0] - p[0]) > Math.abs(q[1] - p[1]) ? 0 : a.h / 2);
	const bx = q[0] - Math.sign(q[0] - p[0]) * (Math.abs(q[0] - p[0]) > Math.abs(q[1] - p[1]) ? b.w / 2 : 0);
	const by = q[1] - Math.sign(q[1] - p[1]) * (Math.abs(q[0] - p[0]) > Math.abs(q[1] - p[1]) ? 0 : b.h / 2);
	const mx = (ax + bx) / 2, my = (ay + by) / 2, ox = (mx - WORLD.w / 2) * 0.12, oy = (my - WORLD.h / 2) * 0.12;
	return { from, to, d: `M${ax.toFixed(0)} ${ay.toFixed(0)} Q${(mx + ox).toFixed(0)} ${(my + oy).toFixed(0)} ${bx.toFixed(0)} ${by.toFixed(0)}` };
};
export const STROKES: Stroke[] = [join('bench', 'shop'), join('shop', 'street'), join('street', 'post'), join('post', 'workshops'), join('workshops', 'road'), join('road', 'notes'), join('notes', 'bench')];
