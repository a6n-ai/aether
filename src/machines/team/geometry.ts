import * as k from '../../lib/anatomy/iso-kit';
import type { Plan, Plane, Point3 } from '../../lib/anatomy/iso-kit';
import { moverSvg, stepSvg, transformsFrom, type Machine } from '../../lib/plate';

export const LABELS = ['your shop', 'our bench inside it', 'fixed on the spot', 'one team, yours'] as const;
export const CAPTION = 'We work like your own tech team, not a vendor you chase. The same people, every week, building inside your business.';

const BASE: Plan = { x: -170, y: -100, w: 340, d: 260, r: 8 };
const BASE_H = 8;
const FOOT_H = 6;
const WALL_H = 70;
const WALL = 8;
const SHOP_FRONT = 100;

const PLANK: Plan = { x: -150, y: -92, w: 120, d: 18, r: 1.5 };
const PLANK_TOP = 30;
const BENCH_AT = { x: 106, y: 134 };
const BENCH_TOP = 26;
const TRAVEL_Y = -184;
const WRENCH_REST: Point3 = [BENCH_AT.x + 6, BENCH_AT.y + 3, BENCH_TOP];
const WRENCH_FIX: Point3 = [-72, -83, PLANK_TOP + 0.6];

const MAT: Plan = { x: 50, y: -88, w: 112, d: 72, r: 3 };

export function team(width = 720, height = 480): Machine {
	const P = k.fitProjection(
		[...k.boxCorners(BASE, -BASE_H - FOOT_H, 0), [-170, -100, 104], [170, -100, 104], [BENCH_AT.x, BENCH_AT.y, 60], [0, -98, 114], [-155, 132, 60]],
		width,
		height,
		{ pad: 20, azimuth: 40 },
	);
	const at = (p: Point3) => k.iso(p, P);
	const S = k.solidSvg;
	const L = k.lineSvg;
	const D = k.dotsSvg;
	const byDepth = (points: Plane[]) => [...points].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
	const box = (plan: Plan, z: number, h: number, tone: 'hi' | 'mid' | 'lo' = 'mid', steps = 3, bevel = 0.4) => S(k.slabOf(plan, z, h, P, steps, bevel), { tone });
	const post = (cx: number, cy: number, r: number, z: number, h: number, tone: 'hi' | 'mid' | 'lo' = 'mid', bevel = 0) => S(k.cylinder(cx, cy, r, z, h, P, r > 6 ? 28 : 16, bevel), { tone });
	const halo = (plan: Plan, z: number, h: number, blur = 4) => `<path class="iso-halo" d="${k.haloOf(plan, z, h, P)}" style="filter:blur(${blur}px)"/>`;
	const cable = (pts: Plane[], z: number) => L(k.onTop(pts, z, P), { tone: 'mid', free: true }) + D([at([...pts[0], z]), at([...pts[pts.length - 1], z])], { size: 0.8, tone: 'hi' });

	function base() {
		const out = [`<path class="iso-halo" d="${k.haloOf(BASE, -BASE_H - FOOT_H, BASE_H, P)}"/>`];
		for (const [x, y] of byDepth(k.corners(BASE, 22))) {
			out.push(S(k.cylinder(x, y, 8, -BASE_H - FOOT_H, 1.8, P, 28), { tone: 'lo' }));
			out.push(S(k.cylinder(x, y, 6, -BASE_H - FOOT_H + 1.8, FOOT_H - 1.8, P, 28), { tone: 'mid' }));
		}
		out.push(S(k.slabOf(BASE, -BASE_H, BASE_H, P, 8, 1.6), { tone: 'mid', inner: L(k.sideSeam(BASE, -BASE_H / 2, P), { tone: 'faint' }) }));
		out.push(L(k.planOutline(k.insetPlan(BASE, 5), 0, P), { tone: 'lo' }));
		for (let y = -70; y < SHOP_FRONT - 10; y += 30) out.push(L(k.lineOnTop([-160, y], [160, y], 0, P), { tone: 'faint' }));
		out.push(L(k.lineOnTop([-160, SHOP_FRONT], [160, SHOP_FRONT], 0, P), { tone: 'mid' }));
		const step: Plan = { x: 40, y: SHOP_FRONT - 2, w: 130, d: 8, r: 1 };
		out.push(L(k.planOutline(step, 0, P), { tone: 'mid' }), L(k.planOutline(k.insetPlan(step, 2), 0, P), { tone: 'faint' }));
		for (let x = 48; x < 168; x += 12) out.push(L(k.lineOnTop([x, step.y + 2], [x, step.y + step.d - 2], 0, P), { tone: 'faint' }));
		const mat2: Plan = { x: 74, y: 112, w: 64, d: 22, r: 2 };
		out.push(L(k.planOutline(mat2, 0, P), { tone: 'lo' }), L(k.planOutline(k.insetPlan(mat2, 3), 0, P), { tone: 'faint' }));
		for (const [row, y0] of [[0, -70], [1, -40], [2, -10], [3, 20], [4, 50], [5, 80]] as const) for (let x = -150 + (row % 2) * 30; x < 160; x += 60) out.push(L(k.lineOnTop([x, y0], [x, y0 + 30], 0, P), { tone: 'faint' }));
		for (const cx of [-120, -75]) out.push(S(k.slabOf({ x: cx - 16, y: 114, w: 32, d: 12, r: 1.6 }, 0, 9, P, 3, 0.6), { tone: 'mid', inner: L(k.sideSeam({ x: cx - 16, y: 114, w: 32, d: 12, r: 1.6 }, 4.5, P, 3), { tone: 'faint' }) }), L(k.planOutline({ x: cx - 14, y: 116, w: 28, d: 8, r: 1 }, 9, P), { tone: 'lo' }), ...[-10, -3.3, 3.3, 10].map((dx) => post(cx + dx, 120, 2.2, 9, 1.6, 'hi') + L(k.segment([cx + dx, 120, 8], [cx + dx, 120, 9], P), { tone: 'lo' })));
		const screws = k.corners(BASE, 11);
		out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(''), { tone: 'lo' }));
		out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
		const strip: Plan = { x: -150, y: BASE.y + BASE.d - 16, w: 150, d: 7, r: 1 };
		out.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: 'lo', crease: 'none' }));
		const ticks = k.topTicks(strip.x + 4, strip.x + strip.w - 4, 4, 5, strip.y + 0.8, 0.6, [2, 3.6], P);
		out.push(L(ticks.minor, { tone: 'lo' }), L(ticks.major, { tone: 'mid' }));
		return out.join('');
	}

	function walls() {
		const back: Plan = { x: -170, y: -100, w: 340, d: WALL, r: 1 };
		const left: Plan = { x: -170, y: -100 + WALL, w: WALL, d: SHOP_FRONT + 100 - WALL, r: 1 };
		const out = [S(k.slabOf(left, 0, WALL_H, P, 2, 0.6), { tone: 'mid' }), S(k.slabOf(back, 0, WALL_H, P, 2, 0.6), { tone: 'mid' })];
		for (const z of [14, 56]) out.push(L(k.segment([-162, -92, z], [-162, 100, z], P), { tone: 'faint' }));
		const poster: Plan = { x: -162, y: -10, w: 1.4, d: 40, r: 0.4 };
		out.push(S(k.slabOf(poster, 28, 30, P, 2), { tone: 'lo', crease: 'none' }));
		out.push(L(k.segment([-160.6, 0, 50], [-160.6, 22, 50], P), { tone: 'faint' }), L(k.segment([-160.6, 0, 42], [-160.6, 26, 42], P), { tone: 'faint' }), L(k.segment([-160.6, 0, 35], [-160.6, 14, 35], P), { tone: 'faint' }));
		const pane: Plan = { x: -10, y: -92, w: 70, d: 1.4, r: 0.4 };
		out.push(S(k.slabOf(pane, 26, 28, P, 2), { tone: 'lo', crease: 'none' }));
		out.push(L(k.segment([25, -90.6, 26], [25, -90.6, 54], P), { tone: 'mid' }), L(k.segment([-10, -90.6, 40], [60, -90.6, 40], P), { tone: 'mid' }));
		out.push(L(k.sideRing([112, -92, 46], 10, 'y', P, 28), { tone: 'mid' }), L(k.sideRing([112, -92, 46], 7.5, 'y', P, 28), { tone: 'faint' }));
		out.push(L(k.segment([112, -92, 46], [112, -92, 52.5], P) + k.segment([112, -92, 46], [117, -92, 46], P), { tone: 'hi', free: true }));
		out.push(D([at([112, -92, 46])], { size: 0.6, tone: 'hi' }));
		const tickDots: Flat2 = [];
		for (let i = 0; i < 12; i++) tickDots.push(at([112 + Math.sin((i / 12) * Math.PI * 2) * 8.6, -92, 46 + Math.cos((i / 12) * Math.PI * 2) * 8.6]));
		out.push(D(tickDots, { size: 0.35, tone: 'lo' }), box({ x: 109, y: -92, w: 6, d: 1.6, r: 0.5 }, 55.5, 2, 'lo', 2, 0.2));
		out.push(box({ x: -162, y: -92, w: 324, d: 1.8, r: 0.4 }, 0, 5, 'lo', 2, 0.3), box({ x: -162, y: -90.2, w: 1.8, d: 190, r: 0.4 }, 0, 5, 'lo', 2, 0.3));
		out.push(L(k.segment([-162, -90.2, 5], [162, -90.2, 5], P), { tone: 'faint' }));
		out.push(box({ x: -13, y: -92, w: 3, d: 2.6, r: 0.4 }, 24, 32, 'mid', 2, 0.3), box({ x: 60, y: -92, w: 3, d: 2.6, r: 0.4 }, 24, 32, 'mid', 2, 0.3), box({ x: -13, y: -92, w: 76, d: 2.6, r: 0.4 }, 54, 3, 'mid', 2, 0.3), box({ x: -15, y: -92, w: 80, d: 6, r: 0.8 }, 22, 2.6, 'hi', 2, 0.5));
		out.push(box({ x: -18, y: -91, w: 86, d: 1.4, r: 0.5 }, 59, 1.4, 'lo', 2, 0.2), box({ x: -18, y: -91, w: 12, d: 2.2, r: 0.6 }, 28, 31, 'mid', 2, 0.3), post(-19, -90.3, 1.2, 58, 3.4, 'hi'), post(69, -90.3, 1.2, 58, 3.4, 'hi'));
		for (const x of [-15, -12.4, -9.8]) out.push(L(k.segment([x, -88.8, 30], [x, -88.8, 56], P), { tone: 'faint' }));
		out.push(post(46, -88.5, 3.2, 24.6, 4, 'hi', 0.3), L(k.ring(46, -88.5, 2.2, 28.6, P, 12), { tone: 'mid' }), post(46, -88.5, 0.6, 28.6, 5, 'lo'), post(44.2, -88.5, 1.3, 31, 2.4, 'hi'), post(47.8, -88.5, 1.3, 32.6, 2, 'hi'));
		const cb: Plan = { x: -162, y: 40, w: 1.6, d: 30, r: 0.4 };
		out.push(box(cb, 26, 24, 'lo', 2, 0.2), L(k.segment([-160.4, 41.5, 27.5], [-160.4, 68.5, 27.5], P) + k.segment([-160.4, 41.5, 48.5], [-160.4, 68.5, 48.5], P) + k.segment([-160.4, 41.5, 27.5], [-160.4, 41.5, 48.5], P) + k.segment([-160.4, 68.5, 27.5], [-160.4, 68.5, 48.5], P), { tone: 'mid' }));
		for (const [y, z, w, h] of [[43.5, 36, 7, 9], [53, 40, 6, 7], [60, 31, 6, 8]] as const) out.push(box({ x: -160.4, y, w: 1, d: w, r: 0.2 }, z, h, 'hi', 2), D([at([-159.4, y + w / 2, z + h - 1.2])], { size: 0.5, tone: 'mid' }));
		out.push(box({ x: -162, y: 76, w: 2, d: 20, r: 0.5 }, 46, 3, 'mid', 2, 0.3), box({ x: -160, y: 78, w: 3, d: 1.4, r: 0.4 }, 46, 1.4, 'lo', 2), box({ x: -160, y: 86, w: 3, d: 1.4, r: 0.4 }, 46, 1.4, 'lo', 2), box({ x: -160, y: 93, w: 3, d: 1.4, r: 0.4 }, 46, 1.4, 'lo', 2));
		out.push(box({ x: -160.6, y: 79, w: 1.2, d: 10, r: 0.5 }, 24, 22, 'hi', 2, 0.3), L(k.segment([-159.4, 80, 40], [-159.4, 87, 40], P), { tone: 'faint' }), D([at([-159.4, 84, 33])], { size: 0.6, tone: 'mid' }));
		return out.join('');
	}

	function shelf() {
		const out: string[] = [];
		for (const x of [-142, -38]) out.push(box({ x, y: -92, w: 4, d: 14, r: 0.6 }, 17, PLANK_TOP - 3 - 17, 'lo', 2, 0.2));
		out.push(box(PLANK, PLANK_TOP - 3, 3, 'mid', 3, 0.6));
		out.push(L(k.lineOnTop([PLANK.x + 3, PLANK.y + 9], [PLANK.x + PLANK.w - 3, PLANK.y + 9], PLANK_TOP, P), { tone: 'faint' }));
		const tins: [number, number, number][] = [[-138, 5.2, 11], [-124, 4.4, 8], [-111, 5, 13]];
		for (const [x, r, h] of tins) {
			out.push(post(x, -83, r, PLANK_TOP, h, 'hi'));
			out.push(L(k.ring(x, -83, r - 1.4, PLANK_TOP + h, P, 20), { tone: 'mid' }));
			out.push(L(k.sideArc(x, -83, r, PLANK_TOP + h * 0.5, P, 18), { tone: 'lo' }));
		}
		for (const x of [-146, -66]) out.push(box({ x, y: -92, w: 3, d: 10, r: 0.5 }, 38, 8, 'lo', 2, 0.2));
		out.push(box({ x: -150, y: -92, w: 90, d: 12, r: 1.2 }, 46, 2.6, 'mid', 3, 0.5), L(k.lineOnTop([-147, -82], [-63, -82], 48.6, P), { tone: 'faint' }));
		for (const x of [-140, -128]) out.push(post(x, -86, 3.6, 48.6, 7, 'hi', 0.3), post(x, -86, 3.8, 55.6, 1.2, 'mid'), L(k.sideArc(x, -86, 3.6, 52, P, 14), { tone: 'lo' }));
		for (const [z, w] of [[48.6, 16], [50.8, 13], [53, 14]] as const) out.push(box({ x: -112, y: -90, w, d: 9, r: 0.5 }, z, 2.2, 'hi', 2, 0.3));
		out.push(post(-84, -86, 3.4, 48.6, 5, 'mid', 0.3), post(-84, -86, 0.7, 53.6, 5, 'hi'), post(-86, -86, 1.3, 56, 2.6, 'hi'), post(-82, -86, 1.3, 57, 2.4, 'hi'));
		out.push(box({ x: -103, y: -87, w: 7, d: 9, r: 1 }, PLANK_TOP, 6, 'hi', 2, 0.3), D([at([-99.5, -78, PLANK_TOP + 3])], { size: 0.45, tone: 'mid' }));
		return out.join('');
	}

	function sign() {
		const out: string[] = [];
		for (const x of [4, 66]) out.push(box({ x, y: -98, w: 6, d: 6, r: 1 }, WALL_H, 8, 'lo', 2, 0.2));
		const board: Plan = { x: -4, y: -98, w: 90, d: 4, r: 1.5 };
		out.push(stepSvg('lit-at', 4, S(k.slabOf(board, WALL_H + 8, 26, P, 3, 0.5), { tone: 'hi', lit: true })));
		const face = board.y + board.d + 0.1;
		const [x0, x1, z0, z1] = [-1, 83, WALL_H + 11, WALL_H + 31];
		out.push(L(k.segment([x0, face, z0], [x1, face, z0], P) + k.segment([x1, face, z0], [x1, face, z1], P) + k.segment([x1, face, z1], [x0, face, z1], P) + k.segment([x0, face, z1], [x0, face, z0], P), { tone: 'faint' }));
		for (const x of [24, 41, 58]) out.push(L(k.sideRing([x, face, WALL_H + 21], 7, 'y', P, 26), { tone: 'faint' }));
		out.push(D([at([x0 + 3, face, z0 + 3]), at([x1 - 3, face, z0 + 3]), at([x0 + 3, face, z1 - 3]), at([x1 - 3, face, z1 - 3])], { size: 0.5, tone: 'hi' }));
		for (const x of [20, 62]) out.push(post(x, -96, 0.8, WALL_H + 34, 4, 'lo'), box({ x: x - 4, y: -98.5, w: 8, d: 5, r: 1.6 }, WALL_H + 38, 2.6, 'mid', 3, 0.4), D([at([x, -96, WALL_H + 40.6])], { size: 0.45, tone: 'hi' }));
		out.push(box({ x: -6, y: -99, w: 94, d: 1.4, r: 0.5 }, WALL_H + 6.4, 1.6, 'lo', 2, 0.2));
		out.push(cable([[4, -97], [-4, -92.5], [-30, -92.5]], WALL_H + 0.4));
		return out.join('');
	}

	function mat() {
		const out = [box(MAT, 0, 0.6, 'lo', 4, 0.2)];
		out.push(L(k.planOutline(k.insetPlan(MAT, 4), 0.6, P), { tone: 'mid' }));
		for (let x = MAT.x + 14; x < MAT.x + MAT.w - 8; x += 10) out.push(L(k.lineOnTop([x, MAT.y + 6], [x, MAT.y + MAT.d - 6], 0.6, P), { tone: 'faint' }));
		const a: Plan = { x: 138, y: -90, w: 24, d: 24, r: 1.5 };
		out.push(S(k.slabOf(a, 0.6, 15, P, 3, 0.5), { tone: 'mid', inner: L(k.sideSeam(a, 8, P, 3), { tone: 'faint' }) }));
		const b: Plan = { x: 142, y: -86, w: 16, d: 16, r: 1.2 };
		out.push(box(b, 15.6, 11, 'hi', 3, 0.4));
		out.push(L(k.lineOnTop([b.x + 2, b.y + 8], [b.x + b.w - 2, b.y + 8], 26.6, P), { tone: 'mid' }));
		out.push(L(k.lineOnTop([a.x + 11, a.y + 1], [a.x + 11, a.y + a.d - 1], 15.6, P) + k.lineOnTop([a.x + 13, a.y + 1], [a.x + 13, a.y + a.d - 1], 15.6, P), { tone: 'lo' }));
		out.push(box({ x: 146, y: -78, w: 8, d: 5, r: 0.8 }, 26.6, 0.8, 'lo', 2, 0.2), D([at([150, -75.5, 27.4])], { size: 0.4 }));
		out.push(box({ x: 56, y: -44, w: 18, d: 12, r: 1 }, 0.6, 7, 'mid', 3, 0.5), L(k.planOutline(k.insetPlan({ x: 56, y: -44, w: 18, d: 12, r: 1 }, 2), 7.6, P), { tone: 'lo' }), post(60, -38, 2.2, 7.6, 1.2, 'hi'), post(68, -38, 2.2, 7.6, 1.2, 'hi'));
		return out.join('');
	}

	function props() {
		const rug: Plan = { x: -124, y: -34, w: 90, d: 60, r: 3 };
		const out = [box(rug, 0, 1.2, 'lo', 4, 0.2), L(k.planOutline(k.insetPlan(rug, 4), 1.2, P), { tone: 'mid' })];
		for (let y = rug.y + 12; y < rug.y + rug.d - 6; y += 8) out.push(L(k.lineOnTop([rug.x + 6, y], [rug.x + rug.w - 6, y], 1.2, P), { tone: 'faint' }));
		const chair = (cx: number, cy: number, face: 1 | -1) => {
			const o: string[] = [];
			const seat: Plan = { x: cx - 7, y: cy - 6, w: 14, d: 12, r: 1.4 };
			for (const [x, y] of byDepth(k.corners(seat, 1.8))) o.push(post(x, y, 1, 0, 9, 'lo'));
			const back: Plan = { x: cx - 7, y: face > 0 ? cy + 4.4 : cy - 6, w: 14, d: 1.6, r: 0.5 };
			if (face < 0) o.push(box(back, 9, 13, 'mid', 2, 0.3), L(k.lineOnTop([cx - 4, cy - 5.2], [cx + 4, cy - 5.2], 22, P), { tone: 'faint' }));
			o.push(box(seat, 9, 2.4, 'hi', 3, 0.4), L(k.planOutline(k.insetPlan(seat, 2), 11.4, P), { tone: 'faint' }));
			if (face > 0) o.push(box(back, 9, 13, 'mid', 2, 0.3), L(k.lineOnTop([cx - 4, cy + 5.2], [cx + 4, cy + 5.2], 22, P), { tone: 'faint' }));
			return o.join('');
		};
		out.push(chair(-80, -30, -1));
		const T: Plan = { x: -104, y: -20, w: 48, d: 28, r: 2 };
		out.push(`<path class="iso-halo" d="${k.haloOf(T, 0, 18, P)}" style="filter:blur(4px)"/>`);
		for (const [x, y] of byDepth(k.corners(T, 3.5))) out.push(post(x, y, 1.8, 0, 15, 'lo'));
		out.push(box(T, 15, 3, 'hi', 3, 0.6));
		out.push(L(k.planOutline(k.insetPlan(T, 3), 18, P), { tone: 'faint' }));
		out.push(post(-94, -10, 4.4, 18, 8, 'hi'), L(k.ring(-94, -10, 3, 26, P, 18), { tone: 'mid' }), post(-82, -4, 3.6, 18, 6, 'hi'), L(k.ring(-82, -4, 2.2, 24, P, 16), { tone: 'mid' }));
		out.push(box({ x: -72, y: -14, w: 12, d: 10, r: 1 }, 18, 5, 'hi', 2, 0.3), box({ x: -70, y: -12, w: 8, d: 7, r: 1 }, 23, 4, 'hi', 2, 0.3));
		out.push(box({ x: -102, y: -1, w: 13, d: 8, r: 0.8 }, 18, 1.2, 'mid', 2, 0.3), box({ x: -102, y: -2, w: 13, d: 1.2, r: 0.5 }, 19.2, 8.4, 'hi', 2, 0.3), D(k.dotGrid(-100.5, 1.4, 5, 2, 2.4, 19.2, P), { size: 0.35, tone: 'mid' }));
		out.push(box({ x: -66, y: -2, w: 7, d: 9, r: 0.5 }, 18, 0.7, 'lo', 2), L(k.lineOnTop([-64.5, 0], [-60.5, 0], 18.7, P) + k.lineOnTop([-64.5, 2.4], [-60.5, 2.4], 18.7, P) + k.lineOnTop([-64.5, 4.8], [-61.5, 4.8], 18.7, P), { tone: 'faint' }));
		out.push(chair(-80, 20, 1));
		const [sx, sy] = [-30, 62];
		for (const [dx, dy] of [[-4.5, -3], [4.5, -3], [0, 5]]) out.push(post(sx + dx, sy + dy, 1.3, 0, 13, 'lo'));
		out.push(post(sx, sy, 7.5, 13, 2.4, 'hi', 0.4), L(k.ring(sx, sy, 5, 15.4, P, 20), { tone: 'mid' }));
		const [s2x, s2y] = [-4, 72];
		for (const [dx, dy] of [[-4.5, -3], [4.5, -3], [0, 5]]) out.push(post(s2x + dx, s2y + dy, 1.3, 0, 13, 'lo'));
		out.push(L(k.ring(s2x, s2y, 4.6, 6, P, 16), { tone: 'lo' }), post(s2x, s2y, 7.5, 13, 2.4, 'hi', 0.4), L(k.ring(s2x, s2y, 5, 15.4, P, 20), { tone: 'mid' }));
		const [px, py] = [-150, -82];
		out.push(post(px, py, 6.5, 0, 9, 'hi', 0.4), L(k.ring(px, py, 5, 9, P, 20), { tone: 'mid' }), L(k.sideArc(px, py, 6.5, 4.5, P, 18), { tone: 'lo' }));
		for (const [dx, dy, h] of [[0, 0, 22], [-3, 2, 15], [3, 2, 17]]) {
			out.push(post(px + dx, py + dy, 0.9, 9, h, 'lo'));
			out.push(post(px + dx, py + dy, 3.6, 9 + h, 1, 'hi'));
		}
		return out.join('');
	}

	function till() {
		const C: Plan = { x: -140, y: 34, w: 80, d: 36, r: 2 };
		const out = [`<path class="iso-halo" d="${k.haloOf(C, 0, 24, P)}"/>`];
		out.push(S(k.slabOf(C, 0, 24, P, 3, 0.8), { tone: 'mid', inner: L(k.sideSeam(C, 18, P, 3), { tone: 'faint' }) }));
		out.push(L(k.planOutline(k.insetPlan(C, 4), 24, P), { tone: 'lo' }));
		const reg: Plan = { x: -128, y: 44, w: 30, d: 20, r: 1.5 };
		out.push(box(reg, 24, 9, 'hi', 3, 0.5));
		const scr: Plan = { x: -126, y: 44, w: 26, d: 2.5, r: 0.6 };
		out.push(box(scr, 33, 15, 'hi', 2, 0.3));
		out.push(L(k.segment([-123, 46.6, 37], [-103, 46.6, 37], P) + k.segment([-123, 46.6, 43], [-110, 46.6, 43], P), { tone: 'mid', free: true }));
		out.push(D(k.dotGrid(-124, 52, 5, 2, 4.2, 33, P), { size: 0.5, tone: 'mid' }));
		out.push(box({ x: -121, y: 61, w: 14, d: 1.5, r: 0.4 }, 28, 2, 'lo', 2));
		out.push(post(-76, 52, 6.5, 24, 5, 'hi'));
		out.push(post(-76, 52, 3, 29, 2, 'hi'));
		out.push(L(k.ring(-76, 52, 4.4, 24, P, 20), { tone: 'mid' }));
		out.push(box({ x: -92, y: 60, w: 10, d: 6, r: 1 }, 24, 2.5, 'hi', 2));
		out.push(box({ x: -142, y: 32, w: 84, d: 40, r: 2.4 }, 0, 2.4, 'lo', 3, 0.5));
		for (let i = 0; i < 3; i++) out.push(box({ x: -136 + i * 26, y: C.y + C.d, w: 22, d: 1.2, r: 0.6 }, 6, 13, 'hi', 2, 0.4), D([at([-125 + i * 26, C.y + C.d + 1.2, 12.5])], { size: 0.6, tone: 'mid' }), L(k.segment([-130 + i * 26, C.y + C.d + 1.2, 12.5], [-120 + i * 26, C.y + C.d + 1.2, 12.5], P), { tone: 'faint' }));
		out.push(post(-134, 41, 3.6, 24, 8, 'hi', 0.3), post(-134, 41, 3.9, 32, 1.4, 'mid'), L(k.sideArc(-134, 41, 3.6, 28, P, 14), { tone: 'lo' }), post(-134, 41, 1, 33.4, 1.2, 'hi'));
		out.push(box({ x: -73, y: 37, w: 7, d: 5, r: 0.8 }, 24, 9, 'hi', 2, 0.3), box({ x: -66, y: 38, w: 6, d: 5, r: 0.8 }, 24, 7, 'hi', 2, 0.3), L(k.lineOnTop([-72, 39.5], [-67, 39.5], 33, P), { tone: 'mid' }));
		out.push(post(-64, 64, 3, 24, 1.6, 'hi', 0.3), post(-64, 64, 1, 25.6, 1.4, 'hi'));
		out.push(box({ x: -98, y: 38, w: 9, d: 5, r: 0.8 }, 24, 2.4, 'lo', 2, 0.3), D([at([-95, 40.5, 26.4]), at([-92, 40.5, 26.4])], { size: 0.4, tone: 'mid' }));
		out.push(box({ x: -138, y: 60, w: 6, d: 4, r: 0.6 }, 24, 6, 'mid', 2, 0.3), L(k.lineOnTop([-137, 62], [-133, 62], 30, P), { tone: 'lo' }));
		return out.join('');
	}

	function gondola() {
		const G: Plan = { x: 2, y: -32, w: 46, d: 14, r: 1.5 };
		const out = [halo(G, 0, 36)];
		out.push(S(k.slabOf(G, 0, 6, P, 3, 0.6), { tone: 'mid', inner: L(k.sideSeam(G, 3, P, 3), { tone: 'faint' }) }));
		for (const x of [G.x + 1, G.x + G.w - 4]) out.push(box({ x, y: G.y + 2, w: 3, d: G.d - 4, r: 0.6 }, 6, 30, 'mid', 2, 0.4));
		for (const z of [14, 22, 30]) out.push(box({ x: G.x, y: G.y + 1, w: G.w, d: G.d - 2, r: 0.8 }, z, 2, 'hi', 3, 0.4), L(k.lineOnTop([G.x + 3, G.y + G.d - 3], [G.x + G.w - 3, G.y + G.d - 3], z + 2, P), { tone: 'faint' }));
		for (const [x, z] of [[8, 6], [22, 6], [36, 6]] as const) out.push(box({ x, y: G.y + 3, w: 9, d: 8, r: 0.8 }, z, 8, 'hi', 2, 0.3), L(k.lineOnTop([x + 1.5, G.y + 7], [x + 7.5, G.y + 7], z + 8, P), { tone: 'faint' }));
		for (const [x, h] of [[8, 5], [14, 7], [20, 5], [28, 6]] as const) out.push(box({ x, y: G.y + 3, w: 5, d: 7, r: 0.6 }, 24, h, 'hi', 2, 0.3));
		out.push(box({ x: 14, y: G.y + 3, w: 22, d: 7, r: 0.8 }, 32, 4, 'lo', 2, 0.3), D([at([G.x + 3, G.y + G.d, 3]), at([G.x + G.w - 3, G.y + G.d, 3])], { size: 0.5 }));
		return out.join('');
	}

	function crates() {
		const out: string[] = [];
		const crate = (plan: Plan, z: number, h: number) => {
			out.push(S(k.slabOf(plan, z, h, P, 3, 0.5), { tone: 'mid', inner: L(k.sideSeam(plan, z + h * 0.38, P, 3) + k.sideSeam(plan, z + h * 0.72, P, 3), { tone: 'faint' }) }));
			out.push(L(k.planOutline(k.insetPlan(plan, 1.8), z + h, P), { tone: 'lo' }));
		};
		out.push(halo({ x: 146, y: -8, w: 22, d: 32, r: 3 }, 0, 16));
		crate({ x: 148, y: -6, w: 18, d: 14, r: 1.2 }, 0, 8);
		crate({ x: 148, y: 10, w: 18, d: 14, r: 1.2 }, 0, 8);
		crate({ x: 149, y: 0, w: 16, d: 14, r: 1.2 }, 8, 7);
		for (const [x, y] of [[154, 5], [159.5, 8], [155, 11]] as const) out.push(post(x, y, 2.4, 15, 2.6, 'hi', 0.4), D([at([x, y, 17.6])], { size: 0.4, tone: 'mid' }));
		const lx = 158;
		const ly = 44;
		out.push(halo({ x: lx - 6, y: ly - 6, w: 12, d: 12, r: 6 }, 0, 4, 3));
		out.push(post(lx, ly, 5.4, 0, 2, 'lo', 0.4), post(lx, ly, 3, 2, 1.6, 'mid'), post(lx, ly, 0.9, 3.6, 46, 'mid'), L(k.ring(lx, ly, 4, 2, P, 16), { tone: 'mid' }));
		out.push(post(lx, ly, 6.4, 46, 10, 'hi', 0.5), L(k.ring(lx, ly, 4.4, 56, P, 18), { tone: 'mid' }), L(k.sideArc(lx, ly, 6.4, 51, P, 16), { tone: 'lo' }), D([at([lx, ly, 56])], { size: 0.8, tone: 'hi' }));
		out.push(box({ x: 163, y: 52, w: 5, d: 6, r: 0.8 }, 0, 3.4, 'lo', 2, 0.3), D([at([165.5, 54, 3.4]), at([165.5, 56.6, 3.4])], { size: 0.45, tone: 'mid' }));
		out.push(cable([[lx + 3, ly + 4], [lx + 4, ly + 9], [164, 52]], 0.2));
		return out.join('');
	}

	function street() {
		const out: string[] = [];
		const [lx, ly] = [-155, 132];
		out.push(halo({ x: lx - 6, y: ly - 6, w: 12, d: 12, r: 6 }, 0, 4, 3));
		out.push(post(lx, ly, 5.6, 0, 2.4, 'lo', 0.4), post(lx, ly, 3.2, 2.4, 3, 'mid'), post(lx, ly, 1.4, 5.4, 46, 'mid'), L(k.ring(lx, ly, 4, 2.4, P, 16), { tone: 'mid' }), post(lx, ly, 2.4, 51, 1.4, 'lo'));
		out.push(L(k.segment([lx, ly, 50], [lx + 8, ly - 4, 54], P), { tone: 'hi', free: true }), box({ x: lx + 4, y: ly - 9, w: 8, d: 8, r: 1.6 }, 52, 8, 'hi', 3, 0.5), box({ x: lx + 3, y: ly - 10, w: 10, d: 10, r: 1.8 }, 60, 1.6, 'mid', 3, 0.4), D([at([lx + 8, ly - 4, 52])], { size: 0.8, tone: 'hi' }));
		const [ax, ay] = [-30, 124];
		out.push(halo({ x: ax - 2, y: ay - 6, w: 30, d: 14, r: 2 }, 0, 28, 3));
		out.push(box({ x: ax, y: ay - 5, w: 2.4, d: 7, r: 0.6 }, 0, 24, 'lo', 2, 0.2), box({ x: ax + 22, y: ay - 5, w: 2.4, d: 7, r: 0.6 }, 0, 24, 'lo', 2, 0.2));
		out.push(box({ x: ax - 1, y: ay + 1, w: 28, d: 2, r: 0.8 }, 2, 26, 'hi', 3, 0.6), L(k.planOutline({ x: ax + 2, y: ay + 3, w: 22, d: 0.1, r: 0 }, 0, P), { tone: 'faint' }));
		out.push(L(k.segment([ax + 3, ay + 3.1, 8], [ax + 23, ay + 3.1, 8], P) + k.segment([ax + 3, ay + 3.1, 24], [ax + 23, ay + 3.1, 24], P) + k.segment([ax + 3, ay + 3.1, 8], [ax + 3, ay + 3.1, 24], P) + k.segment([ax + 23, ay + 3.1, 8], [ax + 23, ay + 3.1, 24], P), { tone: 'lo' }), L(k.sideRing([ax + 13, ay + 3.1, 17], 4, 'y', P, 18), { tone: 'mid' }), D([at([ax + 13, ay + 3.1, 17])], { size: 0.5 }));
		const [cx, cy] = [18, 122];
		out.push(halo({ x: cx - 14, y: cy - 14, w: 28, d: 28, r: 14 }, 0, 14, 3));
		for (const [dx, dy] of [[-4, -3], [4, -3], [0, 4]]) out.push(post(cx + dx, cy + dy, 0.9, 0, 12, 'lo'));
		out.push(post(cx, cy, 6, 0, 1.2, 'lo'), post(cx, cy, 11, 12, 2.2, 'hi', 0.5), L(k.ring(cx, cy, 8.4, 14.2, P, 24), { tone: 'mid' }), post(cx + 2, cy - 1, 2.4, 14.2, 3, 'hi', 0.3), L(k.ring(cx + 2, cy - 1, 1.6, 17.2, P, 12), { tone: 'mid' }), post(cx - 4, cy + 3, 1.8, 14.2, 2, 'hi'));
		for (const [dx, dy] of [[-17, -6], [3, 18]]) {
			for (const [qx, qy] of [[-2.6, -2], [2.6, -2], [0, 2.6]]) out.push(post(cx + dx + qx, cy + dy + qy, 0.8, 0, 8, 'lo'));
			out.push(post(cx + dx, cy + dy, 5, 8, 2, 'hi', 0.4), L(k.ring(cx + dx, cy + dy, 3.4, 10, P, 16), { tone: 'mid' }));
		}
		const [tx, ty] = [160, 120];
		out.push(halo({ x: tx - 10, y: ty - 10, w: 20, d: 20, r: 10 }, 0, 12, 3));
		out.push(post(tx, ty, 8.4, 0, 10, 'mid', 0.6), L(k.sideArc(tx, ty, 8.4, 5, P, 18), { tone: 'lo' }), L(k.ring(tx, ty, 6.6, 10, P, 22), { tone: 'mid' }), post(tx, ty, 1.5, 10, 24, 'lo'), post(tx, ty, 10, 34, 7, 'hi', 0.6), post(tx - 1, ty, 7, 41, 5, 'hi', 0.5), L(k.sideArc(tx, ty, 10, 37.5, P, 18), { tone: 'lo' }));
		return out.join('');
	}

	function wallArt() {
		const out: string[] = [];
		const cal: Plan = { x: 78, y: -92, w: 18, d: 1.2, r: 0.4 };
		out.push(box(cal, 28, 24, 'lo', 2, 0.2), box({ x: 78, y: -92, w: 18, d: 1.6, r: 0.3 }, 44, 8, 'hi', 2, 0.2));
		const f = -90.8;
		const grid: Flat2 = [];
		for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) grid.push(at([80 + c * 3.4, f, 41 - r * 4.4]));
		out.push(D(grid, { size: 0.5, tone: 'mid' }), D([at([84, -90.4, 51]), at([90, -90.4, 51])], { size: 0.5, tone: 'hi' }), L(k.segment([79.5, f, 42.5], [94.5, f, 42.5], P), { tone: 'faint' }));
		for (const [y, z, w, h] of [[-62, 40, 20, 24], [-32, 44, 14, 14]] as const) {
			out.push(box({ x: -162, y, w: 1.4, d: w, r: 0.4 }, z, h, 'lo', 2, 0.2), L(k.segment([-160.6, y + 2, z + 2], [-160.6, y + w - 2, z + 2], P) + k.segment([-160.6, y + w - 2, z + 2], [-160.6, y + w - 2, z + h - 2], P) + k.segment([-160.6, y + w - 2, z + h - 2], [-160.6, y + 2, z + h - 2], P) + k.segment([-160.6, y + 2, z + h - 2], [-160.6, y + 2, z + 2], P), { tone: 'mid' }));
			out.push(L(k.onTop([[y + 4, z + 4]].map(([a, b]) => [a, b] as Plane), 0, P) + '', { tone: 'faint' }));
		}
		out.push(L(k.segment([-160.6, -57, 46], [-160.6, -49, 56], P) + k.segment([-160.6, -49, 56], [-160.6, -44, 50], P) + k.segment([-160.6, -57, 56], [-160.6, -44, 48], P), { tone: 'faint' }));
		out.push(L(k.sideRing([-160.6, -25, 51], 3.4, 'x', P, 14), { tone: 'mid' }));
		return out.join('');
	}

	function fix() {
		const g: string[] = [box({ x: -87, y: -92, w: 5, d: 14, r: 0.6 }, 17, PLANK_TOP - 3 - 17, 'hi', 2, 0.3)];
		for (const x of [-90, -78]) g.push(post(x, -87, 1.6, PLANK_TOP - 0.2, 0.8, 'hi'), D([at([x, -87, PLANK_TOP + 0.6])], { size: 0.5, tone: 'mid' }));
		return stepSvg('show-from', 3, g.join(''));
	}

	function bench([cx, cy]: [number, number]) {
		const T: Plan = { x: cx - 32, y: cy - 17, w: 64, d: 34, r: 2 };
		const out = [`<path class="iso-halo" d="${k.haloOf(T, 0, BENCH_TOP, P)}" style="filter:blur(4px)"/>`];
		for (const [x, y] of byDepth(k.corners(T, 4))) out.push(post(x, y, 2.6, 0, 2.4, 'lo', 0.3), post(x, y, 2.2, 2.4, 17.6, 'mid'), L(k.ring(x, y, 1.1, 2.4, P, 10), { tone: 'lo' }));
		out.push(box(k.insetPlan(T, 3), 8, 2, 'lo', 2, 0.2));
		out.push(box({ x: cx + 3, y: cy - 12, w: 26, d: 24, r: 1.2 }, 10, 10, 'mid', 3, 0.4));
		for (const z of [10.6, 15]) out.push(box({ x: cx + 5, y: cy + 12, w: 22, d: 1.2, r: 0.5 }, z, 3.8, 'hi', 2, 0.3), D([at([cx + 16, cy + 13.2, z + 1.9])], { size: 0.5, tone: 'mid' }));
		out.push(box({ x: cx - 24, y: cy - 8, w: 10, d: 7, r: 1 }, 10, 5, 'hi', 2, 0.3), box({ x: cx - 12, y: cy - 8, w: 9, d: 6, r: 1 }, 10, 3, 'hi', 2, 0.3));
		const peg: Plan = { x: cx - 30, y: cy - 16, w: 60, d: 2.4, r: 0.6 };
		out.push(box(peg, BENCH_TOP, 30, 'mid', 2, 0.4));
		out.push(box(T, 20, 6, 'hi', 3, 0.6));
		const face = peg.y + peg.d + 0.1;
		const dots: Flat2 = [];
		for (const z of [31, 37]) for (let i = 0; i < 10; i++) dots.push(at([cx - 27 + i * 6, face, z]));
		out.push(D(dots, { size: 0.45, tone: 'mid' }));
		for (const dx of [-5, 0, 5]) out.push(L(k.sideRing([cx + dx, face, 48], 4.6, 'y', P, 22), { tone: 'hi' }));
		out.push(L(k.segment([cx - 24, face, 55], [cx - 24, face, 43], P) + k.segment([cx - 27.5, face, 53.5], [cx - 20.5, face, 53.5], P), { tone: 'lo', free: true }));
		out.push(L(k.segment([cx + 22, face, 55], [cx + 22, face, 44], P) + k.sideRing([cx + 22, face, 42], 2.4, 'y', P, 14), { tone: 'lo', free: true }));
		const tb: Plan = { x: cx - 28, y: cy - 8, w: 17, d: 10, r: 1.2 };
		out.push(S(k.slabOf(tb, BENCH_TOP, 7, P, 3, 0.4), { tone: 'hi', inner: L(k.sideSeam(tb, BENCH_TOP + 3, P, 3), { tone: 'faint' }) }));
		out.push(L(k.lineOnTop([tb.x + 4, tb.y + 5], [tb.x + tb.w - 4, tb.y + 5], BENCH_TOP + 7, P), { tone: 'mid' }));
		out.push(post(cx + 22, cy + 5, 4.4, BENCH_TOP, 3, 'hi'));
		out.push(L(k.ring(cx + 22, cy + 5, 2.2, BENCH_TOP + 3, P, 14), { tone: 'mid' }));
		const screws = k.corners(T, 3);
		out.push(D(screws.map(([x, y]) => at([x, y, 26])), { size: 0.45 }));
		out.push(box({ x: cx + 9, y: face - 0.7, w: 2.4, d: 1.5, r: 0.5 }, 38, 14, 'hi', 2, 0.3), box({ x: cx + 5.5, y: face - 1.2, w: 9.4, d: 2.2, r: 0.7 }, 49.5, 5, 'mid', 2, 0.3));
		out.push(box({ x: cx - 12, y: face - 0.7, w: 2.6, d: 1.5, r: 0.5 }, 36, 16, 'hi', 2, 0.3), box({ x: cx - 14, y: face - 0.7, w: 6.4, d: 1.5, r: 0.5 }, 31, 3.4, 'lo', 2, 0.3));
		out.push(box({ x: cx + 25, y: face - 0.5, w: 2.4, d: 1.2, r: 0.4 }, 32, 18, 'mid', 2, 0.3));
		out.push(box({ x: cx - 6, y: cy, w: 14, d: 9, r: 0.8 }, BENCH_TOP, 1.2, 'mid', 2, 0.3), box({ x: cx - 6, y: cy - 1, w: 14, d: 1.2, r: 0.5 }, BENCH_TOP + 1.2, 8, 'mid', 2, 0.3), D(k.dotGrid(cx - 4.6, cy + 2.6, 5, 2, 2.4, BENCH_TOP + 1.2, P), { size: 0.35, tone: 'lo' }));
		const rs: Plan = { x: cx - 28, y: cy + 11, w: 56, d: 4.4, r: 0.6 };
		out.push(S(k.slabOf(rs, BENCH_TOP, 0.5, P, 2), { tone: 'lo', crease: 'none' }));
		const tk = k.topTicks(rs.x + 2, rs.x + rs.w - 2, 3, 5, rs.y + 0.4, BENCH_TOP + 0.5, [1.2, 2.4], P);
		out.push(L(tk.minor, { tone: 'lo' }), L(tk.major, { tone: 'mid' }));
		out.push(cable([[cx + 8, cy + 3], [cx + 14, cy + 8], [cx + 20, cy + 6]], BENCH_TOP + 0.6));
		return out.join('');
	}

	function wrench([cx, cy, z]: Point3) {
		const out = [`<path class="iso-halo" d="${k.haloOf({ x: cx - 22, y: cy - 6, w: 44, d: 12, r: 6 }, z, 0.1, P)}" style="filter:blur(3px)"/>`];
		out.push(S(k.slabOf({ x: cx - 15, y: cy - 2.2, w: 30, d: 4.4, r: 1.6 }, z, 1.8, P, 3, 0.3), { tone: 'hi' }));
		out.push(S(k.cylinder(cx + 17, cy, 6, z, 1.8, P, 24, 0.3), { tone: 'hi' }));
		out.push(S(k.cylinder(cx - 16, cy, 4.2, z, 1.8, P, 20, 0.3), { tone: 'hi' }));
		out.push(L(k.ring(cx + 18, cy, 2.8, z + 1.8, P, 16), { tone: 'mid' }), L(k.ring(cx - 16, cy, 1.8, z + 1.8, P, 12), { tone: 'mid' }));
		out.push(L(k.lineOnTop([cx - 8, cy], [cx + 8, cy], z + 1.8, P), { tone: 'lo', free: true }));
		return out.join('');
	}

	const rest: Point3 = [0, 0, 0];
	const drive: Point3 = [0, TRAVEL_Y, 0.6];
	const fixAt: Point3 = [WRENCH_FIX[0] - WRENCH_REST[0], WRENCH_FIX[1] - WRENCH_REST[1], WRENCH_FIX[2] - WRENCH_REST[2]];
	const transforms = transformsFrom(P, { bench: [rest, drive, drive, drive], wrench: [rest, [0, TRAVEL_Y, 3.5], fixAt, fixAt] });

	const svg = k.figureSvg({
		width,
		height,
		label:
			'A small shop with a till, a shelf of tins and a back room with a mat. The a6n workbench with its tools slides in from the street into the back room, then a spanner goes over to the shelf and tightens a new bracket, and the shop sign lights up: one team, yours.',
		body: [
			base(),
			walls(),
			shelf(),
			sign(),
			mat(),
			wallArt(),
			gondola(),
			props(),
			till(),
			fix(),
			crates(),
			street(),
			moverSvg('bench', transforms.bench[3], bench([BENCH_AT.x, BENCH_AT.y])),
			moverSvg('wrench', transforms.wrench[3], wrench(WRENCH_REST)),
		],
	});
	return { svg, labels: LABELS, transforms };
}

type Flat2 = [number, number][];
