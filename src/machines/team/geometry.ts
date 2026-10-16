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
		[...k.boxCorners(BASE, -BASE_H - FOOT_H, 0), [-170, -100, 104], [170, -100, 104], [BENCH_AT.x, BENCH_AT.y, 60]],
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
	const post = (cx: number, cy: number, r: number, z: number, h: number, tone: 'hi' | 'mid' | 'lo' = 'mid') => S(k.cylinder(cx, cy, r, z, h, P, 16), { tone });

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
		out.push(box(step, 0, 2, 'lo', 2, 0.3));
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
		out.push(box({ x: -98, y: -87, w: 12, d: 9, r: 1 }, PLANK_TOP, 6, 'hi', 2, 0.3));
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
		return out.join('');
	}

	function mat() {
		const out = [box(MAT, 0, 1.6, 'lo', 4, 0.2)];
		out.push(L(k.planOutline(k.insetPlan(MAT, 4), 1.6, P), { tone: 'mid' }));
		for (let x = MAT.x + 14; x < MAT.x + MAT.w - 8; x += 10) out.push(L(k.lineOnTop([x, MAT.y + 6], [x, MAT.y + MAT.d - 6], 1.6, P), { tone: 'faint' }));
		const a: Plan = { x: 138, y: -90, w: 24, d: 24, r: 1.5 };
		out.push(S(k.slabOf(a, 1.6, 15, P, 3, 0.5), { tone: 'mid', inner: L(k.sideSeam(a, 8, P, 3), { tone: 'faint' }) }));
		const b: Plan = { x: 142, y: -86, w: 16, d: 16, r: 1.2 };
		out.push(box(b, 16.6, 11, 'hi', 3, 0.4));
		out.push(L(k.lineOnTop([b.x + 2, b.y + 8], [b.x + b.w - 2, b.y + 8], 27.6, P), { tone: 'mid' }));
		return out.join('');
	}

	function props() {
		const rug: Plan = { x: -124, y: -34, w: 90, d: 60, r: 3 };
		const out = [box(rug, 0, 1.2, 'lo', 4, 0.2), L(k.planOutline(k.insetPlan(rug, 4), 1.2, P), { tone: 'mid' })];
		for (let y = rug.y + 12; y < rug.y + rug.d - 6; y += 8) out.push(L(k.lineOnTop([rug.x + 6, y], [rug.x + rug.w - 6, y], 1.2, P), { tone: 'faint' }));
		const T: Plan = { x: -104, y: -20, w: 48, d: 28, r: 2 };
		out.push(`<path class="iso-halo" d="${k.haloOf(T, 0, 18, P)}" style="filter:blur(4px)"/>`);
		for (const [x, y] of byDepth(k.corners(T, 3.5))) out.push(post(x, y, 1.8, 0, 15, 'lo'));
		out.push(box(T, 15, 3, 'hi', 3, 0.6));
		out.push(L(k.planOutline(k.insetPlan(T, 3), 18, P), { tone: 'faint' }));
		out.push(post(-94, -10, 4.4, 18, 8, 'hi'), L(k.ring(-94, -10, 3, 26, P, 18), { tone: 'mid' }), post(-82, -4, 3.6, 18, 6, 'hi'), L(k.ring(-82, -4, 2.2, 24, P, 16), { tone: 'mid' }));
		out.push(box({ x: -72, y: -14, w: 12, d: 10, r: 1 }, 18, 5, 'hi', 2, 0.3), box({ x: -70, y: -12, w: 8, d: 7, r: 1 }, 23, 4, 'hi', 2, 0.3));
		const [sx, sy] = [-30, 62];
		for (const [dx, dy] of [[-4.5, -3], [4.5, -3], [0, 5]]) out.push(post(sx + dx, sy + dy, 1.3, 0, 13, 'lo'));
		out.push(post(sx, sy, 7.5, 13, 2.4, 'hi', 0.4), L(k.ring(sx, sy, 5, 15.4, P, 20), { tone: 'mid' }));
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
		for (const [x, y] of byDepth(k.corners(T, 4))) out.push(post(x, y, 2.2, 0, 20, 'lo'));
		out.push(box(k.insetPlan(T, 3), 8, 2, 'lo', 2, 0.2));
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
	const drive: Point3 = [0, TRAVEL_Y, 0];
	const fixAt: Point3 = [WRENCH_FIX[0] - WRENCH_REST[0], WRENCH_FIX[1] - WRENCH_REST[1], WRENCH_FIX[2] - WRENCH_REST[2]];
	const transforms = transformsFrom(P, { bench: [rest, drive, drive, drive], wrench: [rest, drive, fixAt, fixAt] });

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
			props(),
			till(),
			fix(),
			moverSvg('bench', transforms.bench[3], bench([BENCH_AT.x, BENCH_AT.y])),
			moverSvg('wrench', transforms.wrench[3], wrench(WRENCH_REST)),
		],
	});
	return { svg, labels: LABELS, transforms };
}

type Flat2 = [number, number][];
