// The a6n world: one sheet, 8000 x 5000 world units, laid out as a walk around its centre (see
// docs/superpowers/specs/2026-11-15-one-sheet-design.md). Pure numbers: the stills are attached in
// src/data/world.ts, which Astro can import and these tests cannot.
import type { Box, Side } from './camera.ts';

// a margin all round, so no place sits against an edge where keeping the view on the sheet would push it off-centre
export const WORLD = { w: 8000, h: 5000 };
const MX = 800, MY = 500;

/** A drawn place on the sheet. `film` is its id under public/world/ (also its still's name); none for an area with no art. */
export type Region = Box & { id: string; film?: string };

// Drafting pieces are 1400 x 900, chalk pieces 1200 x 800; the street's three shops and the four
// workshops are shown smaller so each row fits the sheet.
const S = 0.8, W = 0.7;
export const REGIONS: Region[] = [
	{ id: 'bench', film: 'bench', x: MX + 250, y: MY + 250, w: 1400, h: 900 },
	{ id: 'shop', film: 'shop', x: MX + 1900, y: MY + 300, w: 1200, h: 800 },
	// the street: two shops over one, a cluster the camera can frame large without leaving the sheet
	{ id: 'street-new', film: 'street-new', x: MX + 3300, y: MY + 400, w: 1200 * S, h: 800 * S },
	{ id: 'street-move', film: 'street-move', x: MX + 4330, y: MY + 400, w: 1200 * S, h: 800 * S },
	{ id: 'street-grow', film: 'street-grow', x: MX + 3815, y: MY + 1110, w: 1200 * S, h: 800 * S },
	{ id: 'post', film: 'post', x: MX + 5150, y: MY + 1450, w: 1400 * 0.85, h: 900 * 0.85 },
	// the four workshops in a 2 x 2 block, so the camera frames them together at a readable size
	{ id: 'workshop-tiffingrab', film: 'workshop-tiffingrab', x: MX + 4760, y: MY + 2620, w: 1400 * W, h: 900 * W },
	{ id: 'workshop-puchkaman', film: 'workshop-puchkaman', x: MX + 3700, y: MY + 2620, w: 1400 * W, h: 900 * W },
	{ id: 'workshop-xplorers', film: 'workshop-xplorers', x: MX + 3700, y: MY + 3320, w: 1400 * W, h: 900 * W },
	// our own products sit together: Relay on the post, Copper + Cloves just below it
	{ id: 'workshop-copper-cloves', film: 'workshop-copper-cloves', x: MX + 5800, y: MY + 2300, w: 1400 * W, h: 900 * W },
	{ id: 'road', film: 'road', x: MX + 250, y: MY + 2750, w: 1200, h: 800 },
	{ id: 'notes', x: MX + 300, y: MY + 1450, w: 1300, h: 900 },
	{ id: 'vitruvian', x: MX + 2700, y: MY + 1370, w: 1000, h: 1260 },
	{ id: 'corner', x: MX + 5820, y: MY + 3740, w: 520, h: 220 },
];

/** A few regions read as one place: the street's three shops, and the four workshops. */
export const GROUPS: Record<string, string[]> = {
	street: ['street-new', 'street-move', 'street-grow'],
	// the businesses we built for (our own products are not in it)
	work: ['workshop-tiffingrab', 'workshop-puchkaman', 'workshop-xplorers'],
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
	{ id: 'bench', page: '/', target: 'bench', side: 'center' },
	{ id: 'shop', page: '/', target: 'shop', side: 'center' },
	{ id: 'street', page: '/', target: 'street', side: 'left' },
	{ id: 'relay', page: '/', target: 'post', side: 'left' },
	{ id: 'copper', page: '/', target: 'workshop-copper-cloves', side: 'right' },
	{ id: 'work', page: '/', target: 'work', side: 'right' },
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
export const STROKES: Stroke[] = [join('bench', 'shop'), join('shop', 'street'), join('street', 'post'), join('post', 'workshop-copper-cloves'), join('workshop-copper-cloves', 'work'), join('work', 'road'), join('road', 'notes'), join('notes', 'bench')];
