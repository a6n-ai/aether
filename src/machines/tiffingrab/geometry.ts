import * as k from '../../lib/anatomy/iso-kit';
import type { Plan, Point3 } from '../../lib/anatomy/iso-kit';
import { stepSvg, transformsFrom, type Machine } from '../../lib/plate';

export const LABELS = ['customer picks meals', 'kitchen packs', 'labelled tins', 'driver delivers'] as const;
export const CAPTION = 'Customers choose their meals for the week. The kitchen gets the packing sheet and labels, and drivers get their routes.';

const BASE: Plan = { x: -212, y: -68, w: 322, d: 150, r: 8 };
const BASE_H = 10;
const FOOT_H = 5;
const TZ = 30; // every tin stack stands at this height: kitchen shelf, route rack and crate floor
const TH = 7.2;
const SHELF: Plan = { x: -198, y: 0, w: 84, d: 44, r: 2 };
const RACK: Plan = { x: -108, y: -50, w: 108, d: 40, r: 2 };
const BAY_X = [-90, -66, -42, -18];
const BAY_Y = -30;
const RUN_Y = 32;
const START_X = -138;
const BIKE_X = 70;
const CODES = ['var(--lapis)', 'var(--violet)', 'var(--umber)', 'var(--verdigris)'];

export function tiffingrab(width = 720, height = 480): Machine {
	const P = k.fitProjection(
		[...k.boxCorners(BASE, -BASE_H - FOOT_H, 0), [-198, 0, 86], [BIKE_X, -44, 70], [BIKE_X, 40, 44], [-108, -56, 74]],
		width,
		height,
		{ pad: 14, azimuth: 40, elevation: 38 },
	);
	const at = (p: Point3) => k.iso(p, P);
	const S = k.solidSvg;
	const L = k.lineSvg;
	const D = k.dotsSvg;
	const dots = (pts: Point3[], size = 0.45, tone: 'hi' | 'mid' | 'lo' | 'faint' = 'mid') => D(pts.map(at), { size, tone });
	const halo = (plan: Plan, z: number, h: number) => `<path class="iso-halo" d="${k.haloOf(plan, z, h, P)}"/>`;
	type Tone = 'hi' | 'mid' | 'lo';
	const slab = (x: number, y: number, w: number, d: number, z: number, h: number, tone: Tone = 'mid', o: { r?: number; steps?: number; bevel?: number; thin?: boolean; lit?: boolean; seam?: number } = {}) => {
		const plan: Plan = { x, y, w, d, r: o.r ?? 0.6 };
		const inner = o.seam ? L(k.sideSeam(plan, o.seam, P, o.steps ?? 3), { tone: 'faint' }) : '';
		return S(k.slabOf(plan, z, h, P, o.steps ?? 2, o.bevel ?? 0.2), { tone, crease: o.thin ? 'none' : 'faint', lit: o.lit, inner });
	};
	const cyl = (cx: number, cy: number, r: number, z: number, h: number, tone: Tone = 'mid', bevel = 0.3, lit = false) => S(k.cylinder(cx, cy, r, z, h, P, r > 5 ? 14 : 10, bevel), { tone, lit });
	const seg = (a: Point3, b: Point3, tone: 'hi' | 'mid' | 'lo' | 'faint' = 'mid') => L(k.segment(a, b, P), { tone, free: true });
	const tint = (pigment: string, body: string) => `<g class="tint" style="--pigment:${pigment}">${body}</g>`;
	const lamp = (x: number, y: number, z: number, from: number) => cyl(x, y, 1.9, z, 1.8, 'mid', 0.2) + stepSvg('lit-at', from, cyl(x, y, 1.3, z + 1.8, 1.1, 'hi', 0.15, true));

	function base() {
		const out = [halo(BASE, -BASE_H - FOOT_H, BASE_H)];
		for (const [x, y] of [...k.corners(BASE, 26), [0, BASE.y + 26], [0, BASE.y + BASE.d - 26]].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P))) {
			out.push(cyl(x, y, 9, -BASE_H - FOOT_H, 1.8, 'lo', 0.4), cyl(x, y, 6.5, -BASE_H - FOOT_H + 1.8, FOOT_H - 1.8, 'mid', 0.3));
		}
		out.push(S(k.slabOf(BASE, -BASE_H, BASE_H, P, 10, 1.6), { tone: 'mid', inner: L(k.sideSeam(BASE, -BASE_H / 2, P, 10), { tone: 'faint' }) }));
		out.push(L(k.planOutline(k.insetPlan(BASE, 5), 0, P, 10), { tone: 'lo' }), L(k.planOutline(k.insetPlan(BASE, 8), 0, P, 10), { tone: 'faint' }));
		const screws = k.corners(BASE, 11);
		out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.4, 0, P, 14)).join(''), { tone: 'lo' }), dots(screws.map(([x, y]) => [x, y, 0] as Point3), 0.55));
		for (const [x, y] of screws) out.push(L(k.lineOnTop([x - 1.4, y], [x + 1.4, y], 0, P), { tone: 'faint', free: true }));
		const strip: Plan = { x: -20, y: BASE.y + BASE.d - 17, w: 140, d: 6, r: 1 };
		out.push(slab(strip.x, strip.y, strip.w, strip.d, 0, 0.6, 'lo', { thin: true, steps: 3 }));
		const ft = k.topTicks(strip.x + 4, strip.x + strip.w - 4, 5, 5, strip.y + 0.8, 0.6, [2, 3.4], P);
		out.push(L(ft.minor, { tone: 'lo' }), L(ft.major, { tone: 'mid' }), dots([[strip.x + 2, strip.y + 3, 0.6], [strip.x + strip.w - 2, strip.y + 3, 0.6]]));
		const back: Plan = { x: -190, y: BASE.y + 4, w: 110, d: 6, r: 1 };
		out.push(slab(back.x, back.y, back.w, back.d, 0, 0.6, 'lo', { thin: true, steps: 3 }));
		const bt = k.topTicks(back.x + 4, back.x + back.w - 4, 5, 5, back.y + 0.8, 0.6, [2, 3.4], P);
		out.push(L(bt.minor, { tone: 'lo' }), L(bt.major, { tone: 'mid' }), dots([[back.x + 2, back.y + 3, 0.6], [back.x + back.w - 2, back.y + 3, 0.6]]));
		const side: Plan = { x: BASE.x + BASE.w - 17, y: -44, w: 6, d: 76, r: 1 };
		out.push(slab(side.x, side.y, side.w, side.d, 0, 0.6, 'lo', { thin: true, steps: 3 }));
		const st = k.topTicks(side.y + 4, side.y + side.d - 4, 5, 5, side.x + 0.8, 0.6, [2, 3.4], P, 'y');
		out.push(L(st.minor, { tone: 'lo' }), L(st.major, { tone: 'mid' }));
		const lab: Plan = { x: -200, y: BASE.y + BASE.d - 19, w: 50, d: 11, r: 1.5 };
		out.push(slab(lab.x, lab.y, lab.w, lab.d, 0, 0.8, 'lo', { steps: 3 }));
		for (const [dy, w] of [[2.6, 40], [5.4, 28], [8.2, 36]] as const) out.push(L(k.lineOnTop([lab.x + 5, lab.y + dy], [lab.x + w, lab.y + dy], 0.8, P), { tone: 'faint', free: true }));
		out.push(dots([[lab.x + 2, lab.y + 2, 0.8], [lab.x + lab.w - 2, lab.y + 2, 0.8], [lab.x + 2, lab.y + lab.d - 2, 0.8], [lab.x + lab.w - 2, lab.y + lab.d - 2, 0.8]], 0.4));
		return out.join('');
	}

	// A stack of steel tins: three bowls, rims, a lid and a carrying frame. A painted ring on the lid is the route code.
	function tin(cx: number, cy: number, n: number, code?: { pigment: string; from?: number }) {
		const out: string[] = [];
		const top = TZ + n * TH;
		out.push(slab(cx - 9.6, cy - 0.7, 1.4, 1.4, TZ + 1, n * TH + 2, 'lo', { thin: true, r: 0.3 }));
		for (let i = 0; i < n; i++) {
			const z = TZ + i * TH;
			out.push(cyl(cx, cy, 7.4, z, TH - 0.9, 'mid', 0.4), cyl(cx, cy, 8.3, z + TH - 0.9, 0.9, 'hi', 0.2));
		}
		out.push(cyl(cx, cy, 7.6, top, 1.4, 'hi', 0.5), cyl(cx, cy, 2.2, top + 1.4, 2, 'mid', 0.4), cyl(cx, cy, 1.2, top + 3.4, 0.8, 'hi', 0.2));
		if (code) {
			const ring = tint(code.pigment, cyl(cx, cy, 7.9, top + 0.1, 1.2, 'mid', 0.2) + cyl(cx, cy, 4.2, top + 1.4, 0.2, 'mid', 0));
			out.push(code.from ? stepSvg('show-from', code.from, ring) : ring);
		}
		out.push(slab(cx + 8.2, cy - 0.7, 1.4, 1.4, TZ + 1, n * TH + 2, 'lo', { thin: true, r: 0.3 }));
		out.push(slab(cx - 9.6, cy - 1, 19.2, 2, top + 5, 1.4, 'hi', { r: 0.5, thin: true }));
		out.push(dots([[cx - 8.9, cy, top + 6.4], [cx + 8.9, cy, top + 6.4]], 0.4, 'lo'));
		return out.join('');
	}

	function kitchen() {
		const out = [halo(SHELF, TZ - 4, 4)];
		const { x, y, w, d } = SHELF;
		const legs: [number, number][] = [[x + 4, y + 4], [x + w - 8, y + 4], [x + 4, y + d - 8], [x + w - 8, y + d - 8]];
		for (const [lx, ly] of legs.sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P))) out.push(slab(lx, ly, 4, 4, 0, TZ - 4, 'lo', { r: 0.6, bevel: 0.3 }), slab(lx - 1, ly - 1, 6, 6, 0, 1.4, 'mid', { thin: true }));
		out.push(slab(x + 6, y + 6, w - 12, 1.6, 8, 1.4, 'lo', { thin: true }), slab(x + 6, y + d - 7.6, w - 12, 1.6, 8, 1.4, 'lo', { thin: true }));
		out.push(S(k.slabOf(SHELF, TZ - 4, 4, P, 4, 0.7), { tone: 'mid', inner: L(k.sideSeam(SHELF, TZ - 2, P, 4), { tone: 'faint' }) }));
		out.push(L(k.planOutline(k.insetPlan(SHELF, 3), TZ, P), { tone: 'faint' }), dots(k.corners(SHELF, 3).map(([px, py]) => [px, py, TZ] as Point3), 0.45));
		for (const px of [x + 12, x + 32, x + 52, x + 72]) out.push(seg([px, y + d, TZ - 3.4], [px, y + d, TZ - 0.6], 'faint'));
		// ticket rail: two posts, a bar and three order slips on clips
		const ry = y + 2;
		for (const px of [x + 2, x + w - 6]) out.push(slab(px, ry - 1, 4, 3, TZ, 56, 'lo', { r: 0.5, bevel: 0.3 }), slab(px - 1, ry - 2, 6, 5, TZ, 1.2, 'mid', { thin: true }));
		out.push(slab(x + 2, ry - 0.4, w - 8, 2, TZ + 52, 2.6, 'mid', { r: 0.6, bevel: 0.3 }));
		for (const [i, px] of [x + 16, x + 38, x + 60].entries()) {
			out.push(slab(px, ry + 1.6, 3, 1.4, TZ + 50.6, 2.4, 'hi', { thin: true, r: 0.3 }));
			out.push(slab(px - 4, ry + 3, 11, 0.8, TZ + 34, 17, 'hi', { thin: true, r: 0.4 }));
			for (const [j, z] of [47, 43, 39].entries()) out.push(seg([px - 2.6, ry + 3.8, TZ + z], [px + 5.6 - j * 1.6 - i * 0.6, ry + 3.8, TZ + z], j === 0 ? 'mid' : 'faint'));
			out.push(dots([[px + 0.6, ry + 3.8, TZ + 36]], 0.5, 'mid'));
		}
		const rows: [number, number, number][] = [[x + 24, y + 12, 3], [x + 48, y + 12, 2], [x + 72, y + 12, 3], [x + 12, y + 32, 3], [x + 36, y + 32, 2]];
		for (const [tx, ty, n] of rows.sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P))) out.push(tin(tx, ty, n));
		return out.join('');
	}

	function rack() {
		const { x, y, w, d } = RACK;
		const out = [halo(RACK, 0, TZ)];
		out.push(S(k.slabOf(RACK, 0, TZ - 2, P, 4, 0.8), { tone: 'mid', inner: L(k.sideSeam(RACK, 8, P, 4), { tone: 'faint' }) + L(k.sideSeam(RACK, TZ - 8, P, 4), { tone: 'faint' }) }));
		// pigeonhole cubbies on the front face, one per route
		const fy = y + d;
		for (const [i, bx] of BAY_X.entries()) {
			out.push(slab(bx - 10, fy - 0.2, 20, 0.8, 5, 16, 'lo', { thin: true, r: 0.3 }));
			out.push(seg([bx - 10, fy + 0.6, 21], [bx + 10, fy + 0.6, 21], 'mid'), seg([bx - 10, fy + 0.6, 5], [bx + 10, fy + 0.6, 5], 'mid'), seg([bx - 10, fy + 0.6, 5], [bx - 10, fy + 0.6, 21], 'mid'), seg([bx + 10, fy + 0.6, 5], [bx + 10, fy + 0.6, 21], 'mid'));
			out.push(tint(CODES[i], slab(bx - 8, fy - 0.2, 16, 1.2, 23, 3, 'mid', { thin: true, r: 0.3 })));
			out.push(dots([[bx - 8, fy + 1, 24.5], [bx + 8, fy + 1, 24.5]], 0.4, 'hi'));
		}
		out.push(slab(x + 3, fy - 0.2, w - 6, 0.8, 1.6, 1.6, 'lo', { thin: true, r: 0.3 }));
		const rx = x + w;
		for (const z of [7, 11, 15, 19]) out.push(seg([rx, y + 8, z], [rx, y + d - 8, z], 'faint'));
		out.push(slab(rx, y + 5, 0.8, 5, TZ - 8, 3, 'lo', { thin: true, r: 0.2 }), slab(rx, y + d - 10, 0.8, 5, TZ - 8, 3, 'lo', { thin: true, r: 0.2 }));
		// bay floor, back board with painted route plates
		const floor: Plan = { x: x - 2, y: y - 0.5, w: w + 4, d: d + 1.5, r: 1.5 };
		out.push(S(k.slabOf(floor, TZ - 2, 2, P, 4, 0.5), { tone: 'lo' }));
		out.push(L(k.planOutline(k.insetPlan(floor, 2.4), TZ, P), { tone: 'faint' }));
		const board: Plan = { x: x - 2, y: y - 6, w: w + 4, d: 5, r: 1 };
		out.push(S(k.slabOf(board, TZ, 46, P, 3, 0.6), { tone: 'mid', inner: L(k.sideSeam(board, TZ + 8, P, 3), { tone: 'faint' }) }));
		const by = board.y + board.d;
		for (const [i, bx] of BAY_X.entries()) {
			out.push(slab(bx - 11, by - 0.1, 22, 0.8, TZ + 22, 20, 'hi', { thin: true, r: 0.4 }));
			out.push(tint(CODES[i], slab(bx - 9, by + 0.6, 18, 0.5, TZ + 32, 8, 'mid', { thin: true, r: 0.3 })));
			for (let j = 0; j <= i; j++) out.push(tint(CODES[i], slab(bx - 7 + j * 4, by + 0.6, 2.4, 0.5, TZ + 25, 5, 'mid', { thin: true, r: 0.2, bevel: 0 })));
			out.push(dots([[bx - 9.6, by + 0.9, TZ + 40], [bx + 9.6, by + 0.9, TZ + 40], [bx - 9.6, by + 0.9, TZ + 23.4], [bx + 9.6, by + 0.9, TZ + 23.4]], 0.4, 'lo'));
		}
		out.push(dots(k.corners(board, 1.6).map(([px, py]) => [px, py, TZ + 46] as Point3), 0.4));
		// bays: static tins already sorted, a low chock between bays
		const statics: [number, number][] = [[0, 2], [1, 3], [2, 2]];
		for (const [i, n] of statics) {
			out.push(tin(BAY_X[i], BAY_Y, n, { pigment: CODES[i] }));
			out.push(slab(BAY_X[i] + 12 - 1, y + 1, 2, d - 2, TZ, 3, 'mid', { r: 0.4, bevel: 0.3 }));
		}
		out.push(slab(x - 1, y + 1, 2, d - 2, TZ, 3, 'mid', { r: 0.4, bevel: 0.3 }));
		return out.join('');
	}

	// roller lanes carry the tin between stations: shelf to rack front, up into its bay, and out to the crate
	function lane(x0: number, y0: number, w: number, d: number, along: 'x' | 'y', legs: number[]) {
		const o: string[] = [];
		const plan: Plan = { x: x0, y: y0, w, d, r: 1 };
		o.push(halo(plan, TZ - 3, 3));
		for (const l of legs) {
			const [lx, ly] = along === 'x' ? [x0 + l, y0 + d - 4] : [x0 + w - 4, y0 + l];
			const [bx, by] = along === 'x' ? [x0 + l, y0 + 1] : [x0 + 1, y0 + l];
			o.push(slab(bx, by, 3, 3, 0, TZ - 3, 'lo', { r: 0.5, bevel: 0.2 }), slab(lx, ly, 3, 3, 0, TZ - 3, 'lo', { r: 0.5, bevel: 0.2 }));
		}
		o.push(S(k.slabOf(plan, TZ - 3, 3, P, 3, 0.4), { tone: 'lo', inner: L(k.sideSeam(plan, TZ - 1.5, P, 3), { tone: 'faint' }) }));
		const n = Math.floor((along === 'x' ? w : d) / 6);
		for (let i = 1; i < n; i++) {
			const t = i * 6;
			o.push(along === 'x' ? seg([x0 + t, y0 + 2, TZ], [x0 + t, y0 + d - 2, TZ], 'faint') : seg([x0 + 2, y0 + t, TZ], [x0 + w - 2, y0 + t, TZ], 'faint'));
		}
		o.push(along === 'x' ? slab(x0, y0, w, 1.4, TZ, 2.2, 'mid', { r: 0.3, thin: true, bevel: 0.1 }) : slab(x0, y0, 1.4, d, TZ, 2.2, 'mid', { r: 0.3, thin: true, bevel: 0.1 }));
		o.push(along === 'x' ? slab(x0, y0 + d - 1.4, w, 1.4, TZ, 2.2, 'mid', { r: 0.3, thin: true, bevel: 0.1 }) : slab(x0 + w - 1.4, y0, 1.4, d, TZ, 2.2, 'mid', { r: 0.3, thin: true, bevel: 0.1 }));
		return o.join('');
	}
	function lanes() {
		const a = BAY_X[3];
		return lane(SHELF.x + SHELF.w, RUN_Y - 10, a + 12 - (SHELF.x + SHELF.w), 20, 'x', [6, 80]) + lane(a - 10, RACK.y + RACK.d, 20, RUN_Y + 10 - (RACK.y + RACK.d), 'y', [14]) + lane(RACK.x + RACK.w + 2, BAY_Y - 10, BIKE_X - 14 - (RACK.x + RACK.w + 2), 20, 'x', [3, 30]);
	}

	// A bicycle runs along y with its carrier crate over the rear wheel, open on the side that faces the rack.
	const WZ = 13;
	const REAR_Y = BAY_Y;
	const FRONT_Y = 28;
	const wheel = (wy: number) => {
		const o = [L(k.sideRing([BIKE_X - 1.4, wy, WZ], 13, 'x', P, 28) + k.sideRing([BIKE_X + 1.4, wy, WZ], 13, 'x', P, 28), { tone: 'hi' })];
		o.push(L(k.sideRing([BIKE_X, wy, WZ], 11, 'x', P, 28) + k.sideRing([BIKE_X, wy, WZ], 3, 'x', P, 12), { tone: 'faint' }));
		for (let i = 0; i < 8; i++) {
			const a = (i / 8) * Math.PI * 2;
			o.push(seg([BIKE_X, wy + 3 * Math.cos(a), WZ + 3 * Math.sin(a)], [BIKE_X, wy + 11 * Math.cos(a), WZ + 11 * Math.sin(a)], 'faint'));
		}
		o.push(dots([[BIKE_X, wy, WZ]], 1.1, 'hi'));
		return o.join('');
	};
	const CR: Plan = { x: BIKE_X - 14, y: REAR_Y - 15, w: 28, d: 30, r: 1 };

	function bikeBack() {
		const o = [halo({ x: BIKE_X - 14, y: REAR_Y - 20, w: 28, d: 80, r: 4 }, 0, 0.1)];
		o.push(wheel(REAR_Y));
		o.push(S(k.slabOf({ x: BIKE_X - 3, y: REAR_Y - 11, w: 6, d: 44, r: 1 }, 26, 2, P, 2, 0.3), { tone: 'lo' }));
		o.push(seg([BIKE_X, REAR_Y - 9, 27], [BIKE_X, REAR_Y, WZ], 'mid'), seg([BIKE_X, REAR_Y + 16, 27], [BIKE_X, REAR_Y, WZ], 'mid'));
		// crate: floor, back slats, left sill (the open end the tin slides through)
		o.push(slab(CR.x, CR.y, CR.w, CR.d, 28, 2, 'mid', { r: 1, bevel: 0.3, seam: 29 }));
		o.push(L(k.planOutline(k.insetPlan(CR, 2.6), 30, P), { tone: 'faint' }));
		for (const z of [31.4, 37, 42.6]) o.push(slab(CR.x, CR.y, CR.w, 2, z, 4, 'mid', { r: 0.4, bevel: 0.2, thin: true }));
		return o.join('');
	}

	function crateFront() {
		const o: string[] = [];
		const fx = CR.x + CR.w - 2;
		const fy = CR.y + CR.d - 2;
		for (const z of [31.4, 37, 42.6]) o.push(slab(fx, CR.y, 2, CR.d, z, 4, 'mid', { r: 0.4, bevel: 0.2, thin: true }), slab(CR.x, fy, CR.w, 2, z, 4, 'mid', { r: 0.4, bevel: 0.2, thin: true }));
		for (const [px, py] of [[CR.x, CR.y], [fx, CR.y], [CR.x, fy], [fx, fy]]) o.push(slab(px - 0.2, py - 0.2, 2.4, 2.4, 30, 16.4, 'lo', { r: 0.4, bevel: 0.3, thin: true }));
		o.push(dots([[fx + 2, CR.y + 7, 40], [fx + 2, CR.y + 15, 40], [fx + 2, CR.y + 23, 40], [CR.x + 7, fy + 2, 40], [CR.x + 14, fy + 2, 40], [CR.x + 21, fy + 2, 40]], 0.4, 'lo'));
		o.push(L(k.rise([fx + 1, CR.y + 1], 30, 46.4, P), { tone: 'faint', free: true }));
		o.push(slab(fx - 1, fy - 1, 4, 4, 46.4, 1.2, 'mid', { r: 0.6, thin: true }), lamp(fx + 1, fy + 1, 47.6, 4));
		return o.join('');
	}

	function bikeFront() {
		const o: string[] = [];
		const BB: Point3 = [BIKE_X, REAR_Y + 26, 11];
		const seat: Point3 = [BIKE_X, REAR_Y + 20, 38];
		const head: Point3 = [BIKE_X, FRONT_Y - 6, 38];
		const rhub: Point3 = [BIKE_X, REAR_Y, WZ];
		const fhub: Point3 = [BIKE_X, FRONT_Y, WZ];
		for (const [a, b] of [[rhub, BB], [rhub, seat], [BB, seat], [seat, head], [BB, head]] as [Point3, Point3][]) o.push(seg(a, b, 'hi'), seg([a[0] + 0.7, a[1], a[2]], [b[0] + 0.7, b[1], b[2]], 'lo'));
		o.push(seg(head, fhub, 'hi'), seg([BIKE_X + 0.7, head[1], head[2]], [BIKE_X + 0.7, fhub[1], fhub[2]], 'lo'));
		o.push(wheel(FRONT_Y));
		o.push(cyl(BIKE_X, BB[1], 3.4, BB[2] - 1.5, 3, 'mid', 0.4), slab(BIKE_X - 8, BB[1] - 0.6, 16, 1.2, BB[2] + 0.2, 1.2, 'lo', { thin: true, r: 0.3 }));
		o.push(slab(BIKE_X - 4, seat[1] - 8, 8, 14, seat[2] + 2, 2.4, 'mid', { r: 1.6, steps: 3, bevel: 0.5 }), cyl(BIKE_X, seat[1], 0.9, seat[2], 2, 'lo', 0.1));
		o.push(cyl(BIKE_X, head[1], 1.1, head[2], 6, 'lo', 0.1), slab(BIKE_X - 10, head[1] - 1, 20, 2, head[2] + 6, 1.6, 'hi', { r: 0.7, thin: true }));
		o.push(cyl(BIKE_X - 10.6, head[1], 1.4, head[2] + 6, 1.6, 'lo', 0.2), cyl(BIKE_X + 10.6, head[1], 1.4, head[2] + 6, 1.6, 'lo', 0.2));
		o.push(slab(BIKE_X - 2, FRONT_Y - 2, 4, 4, 30, 1.2, 'lo', { thin: true, r: 0.5 }));
		o.push(dots([[BIKE_X, FRONT_Y - 9, 31], [BIKE_X, FRONT_Y + 2, 27]], 0.4));
		return o.join('');
	}

	function phone() {
		const stand: Plan = { x: -196, y: 58, w: 40, d: 20, r: 2 };
		const out = [halo(stand, 0, 3)];
		out.push(S(k.slabOf(stand, 0, 3, P, 3, 0.5), { tone: 'mid' }));
		out.push(L(k.planOutline(k.insetPlan(stand, 2.6), 3, P), { tone: 'faint' }), dots(k.corners(stand, 3).map(([px, py]) => [px, py, 3] as Point3), 0.4));
		const body: Plan = { x: stand.x + 6, y: stand.y + 7, w: 28, d: 4, r: 1.6 };
		out.push(S(k.slabOf(body, 3, 40, P, 3, 0.5), { tone: 'mid' }));
		const scr: Plan = { x: body.x + 2.2, y: body.y + body.d, w: body.w - 4.4, d: 0.6, r: 0.4 };
		out.push(S(k.slabOf(scr, 8, 32, P, 2), { tone: 'hi' }));
		const f = scr.y + 0.6;
		for (const [i, z] of [36, 31, 26, 21, 16].entries()) {
			out.push(seg([scr.x + 7, f, z], [scr.x + scr.w - 1.6 - (i % 2) * 3, f, z], 'mid'), L(k.ring(scr.x + 3.4, f, 1.1, z, P, 8), { tone: 'mid', free: true }));
		}
		out.push(slab(scr.x + 2, f, scr.w - 4, 0.4, 10, 3.4, 'lo', { thin: true, r: 0.3 }), seg([scr.x + 3, f + 0.4, 11.7], [scr.x + scr.w - 3, f + 0.4, 11.7], 'hi'));
		out.push(dots([[body.x + body.w / 2, f, 5.4], [body.x + body.w / 2 - 3, f, 41.6], [body.x + body.w / 2 + 3, f, 41.6]], 0.4, 'mid'));
		out.push(slab(body.x + 8, stand.y + stand.d - 1, 12, 0.6, 0.8, 1.4, 'lo', { thin: true, r: 0.3 }));
		return out.join('');
	}

	// the single moving stack; drawn where it ends (in the crate) and slid from the kitchen shelf, to the rack front, into its bay, and across
	const home = [BIKE_X, BAY_Y];
	const stops = [[START_X, RUN_Y], [BAY_X[3], RUN_Y], [BAY_X[3], BAY_Y], home];
	const transforms = transformsFrom(P, { tin: stops.map(([x, y]) => [x - home[0], y - home[1], 0] as Point3) });
	const mover = `<g class="mover plain" data-part="tin" transform="${transforms.tin[3]}">${tin(home[0], home[1], 3, { pigment: CODES[3], from: 3 })}</g>`;

	const svg = k.figureSvg({
		width,
		height,
		label:
			'A tiffin sorting bench on a base: a kitchen shelf with stacked steel tiffin tins and a rail of order slips, a phone showing an order, a pigeonhole route rack with painted colour codes, and a bicycle with a slatted carrier crate. One tin stack slides along the shelf to the rack, is marked with its colour code, slides into its route bay, and then into the bicycle crate, whose lamp lights.',
		body: [base(), kitchen(), phone(), rack(), lanes(), bikeBack(), mover, crateFront(), bikeFront()],
	});
	return { svg, labels: LABELS, transforms };
}
