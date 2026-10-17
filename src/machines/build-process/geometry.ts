import * as k from '../../lib/anatomy/iso-kit';
import type { Plan, Plane, Point3 } from '../../lib/anatomy/iso-kit';
import { moverSvg, stepSvg, transformsFrom, type Machine } from '../../lib/plate';

export const LABELS = ['we talk', 'we plan', 'built from parts', 'goes live', 'kept running'] as const;
export const CAPTION = 'Every project follows the same path: a conversation, a plan, a build from parts that already work, a launch, and then we keep it running.';

const BENCH: Plan = { x: -205, y: -46, w: 410, d: 92, r: 6 };
const BENCH_H = 12;
const FOOT_H = 6;
const STATION_X = [-165, -85, -2, 88, 172];

const DESK = { x: -112, y: -22, w: 54, d: 44 };
const DESK_TOP = 16;
const TABLE_TOP = 17;
const TRAY: Plan = { x: -40, y: -20, w: 28, d: 40, r: 2 };
const TRAY_WALL = 8;
const JIG: Plan = { x: 6, y: -15, w: 36, d: 30, r: 2 };
const JIG_TOP = 6;
const OIL_AT: Point3 = [150, 28, 0];
const OIL_TO: Point3 = [148, 0, 8];

interface Block {
	name: 'wall' | 'door' | 'roof';
	plan: Plan;
	h: number;
	to: Point3;
}

const BLOCKS: Block[] = [
	{ name: 'wall', plan: { x: -37, y: -17, w: 22, d: 14, r: 1.5 }, h: 10, to: [23, 0, JIG_TOP] },
	{ name: 'door', plan: { x: -37, y: 0, w: 12, d: 4, r: 0.8 }, h: 8, to: [23, 9.2, JIG_TOP] },
	{ name: 'roof', plan: { x: -37, y: 7, w: 22, d: 10, r: 1.5 }, h: 3, to: [23, 0, JIG_TOP + 10] },
];
const LIFT = 16;

export function buildProcess(width = 720, height = 480): Machine {
	const P = k.fitProjection(
		[...k.boxCorners(BENCH, -BENCH_H - FOOT_H, 0), [88, -30, 72], [-85, 0, 44], [-165, 0, 34], [168, 0, 40], [-195, -32, 54], [131, -34, 30]],
		width,
		height,
		{ pad: 16, azimuth: 58 },
	);
	const at = (p: Point3) => k.iso(p, P);
	const S = k.solidSvg;
	const L = k.lineSvg;
	const D = k.dotsSvg;
	type Tone = 'hi' | 'mid' | 'lo';
	const byDepth = (points: Plane[]) => [...points].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
	const box = (plan: Plan, z: number, h: number, tone: Tone = 'mid', steps = 3, bevel = 0.4) => S(k.slabOf(plan, z, h, P, steps, bevel), { tone });
	const post = (cx: number, cy: number, r: number, z: number, h: number, tone: Tone = 'mid', bevel = 0) => S(k.cylinder(cx, cy, r, z, h, P, r > 6 ? 28 : 16, bevel), { tone });
	const halo = (plan: Plan, z: number, h: number, blur = 4) => `<path class="iso-halo" d="${k.haloOf(plan, z, h, P)}" style="filter:blur(${blur}px)"/>`;

	const cable = (pts: Plane[], z: number) => L(k.onTop(pts, z, P), { tone: 'mid', free: true }) + D([at([...pts[0], z]), at([...pts[pts.length - 1], z])], { size: 0.8, tone: 'hi' });

	function bench() {
		const out = [`<path class="iso-halo" d="${k.haloOf(BENCH, -BENCH_H - FOOT_H, BENCH_H, P)}"/>`];
		for (const [x, y] of byDepth(k.corners(BENCH, 24))) {
			out.push(S(k.cylinder(x, y, 8, -BENCH_H - FOOT_H, 1.8, P, 28), { tone: 'lo' }));
			out.push(S(k.cylinder(x, y, 6, -BENCH_H - FOOT_H + 1.8, FOOT_H - 1.8, P, 28), { tone: 'mid' }));
		}
		out.push(S(k.slabOf(BENCH, -BENCH_H, BENCH_H, P, 8, 1.6), { tone: 'mid', inner: L(k.sideSeam(BENCH, -BENCH_H / 2, P), { tone: 'faint' }) }));
		out.push(L(k.planOutline(k.insetPlan(BENCH, 5), 0, P), { tone: 'lo' }));
		const screws = k.corners(BENCH, 11);
		out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(''), { tone: 'lo' }));
		out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
		const strip: Plan = { x: -188, y: BENCH.y + BENCH.d - 15, w: 376, d: 6, r: 1 };
		out.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: 'lo', crease: 'none' }));
		const ticks = k.topTicks(strip.x + 4, strip.x + strip.w - 4, 4, 5, strip.y + 0.8, 0.6, [1.8, 3.4], P);
		out.push(L(ticks.minor, { tone: 'lo' }), L(ticks.major, { tone: 'mid' }));
		STATION_X.forEach((x, i) => {
			const pip: Plan = { x: x - 9, y: BENCH.y + BENCH.d - 28, w: 18, d: 8, r: 3.9 };
			out.push(box(pip, 0, 1.4, 'lo', 5, 0.2));
			const n = i + 1;
			out.push(D(Array.from({ length: n }, (_, j) => at([x + (j - (n - 1) / 2) * 2.7, pip.y + 4, 1.4])), { size: 0.55, tone: 'hi' }));
		});
		for (const x of [-125, -43, 45, 128]) out.push(L(k.lineOnTop([x, BENCH.y + 8], [x, BENCH.y + BENCH.d - 30], 0, P), { tone: 'faint', dashed: true }));
		const fy = BENCH.y + BENCH.d;
		for (const x of [-165, -85, -2, 88, 172]) out.push(box({ x: x - 9, y: fy, w: 18, d: 1.6, r: 0.6 }, -8.5, 2.2, 'hi', 2, 0.3), D([at([x - 6.5, fy + 1.6, -7.4]), at([x + 6.5, fy + 1.6, -7.4])], { size: 0.4 }));
		for (const x of [-125, -43, 45, 128]) out.push(L(k.segment([x, fy, -11], [x, fy, -1], P), { tone: 'faint' }));
		for (const y of [-20, 20]) out.push(box({ x: BENCH.x + BENCH.w, y: y - 7, w: 1.6, d: 14, r: 0.6 }, -8.5, 2.2, 'hi', 2, 0.3));
		out.push(L(k.onTop([[-190, BENCH.y + 6], [190, BENCH.y + 6]], 0, P), { tone: 'lo' }), L(k.onTop([[-190, BENCH.y + 9], [190, BENCH.y + 9]], 0, P), { tone: 'faint' }));
		return out.join('');
	}

	function chair(cx: number, cy: number, face: 1 | -1) {
		const out: string[] = [];
		const seat: Plan = { x: cx - 8, y: cy - 7, w: 16, d: 14, r: 1.5 };
		const back: Plan = { x: cx - 8, y: face > 0 ? cy + 5 : cy - 7, w: 16, d: 2, r: 0.6 };
		const legs = byDepth(k.corners(seat, 2));
		for (const [x, y] of legs) out.push(post(x, y, 1.1, 0, 9, 'lo'));
		if (face < 0) out.push(box(back, 9, 14, 'mid', 2, 0.3));
		out.push(box(seat, 9, 2.4, 'hi', 3, 0.4));
		if (face > 0) out.push(box(back, 9, 14, 'mid', 2, 0.3));
		const by = face > 0 ? cy + 5 : cy - 5;
		out.push(L(k.planOutline(k.insetPlan(seat, 2.2), 11.4, P), { tone: 'faint' }), L(k.segment([cx - 4, by + face * 2.1, 14], [cx - 4, by + face * 2.1, 21], P) + k.segment([cx, by + face * 2.1, 14], [cx, by + face * 2.1, 21], P) + k.segment([cx + 4, by + face * 2.1, 14], [cx + 4, by + face * 2.1, 21], P), { tone: 'faint' }));
		out.push(box({ x: cx - 6, y: cy - 4.4, w: 12, d: 8.8, r: 2 }, 11.4, 0.9, 'lo', 3, 0.2));
		out.push(box({ x: cx - 6, y: cy - 0.5, w: 12, d: 1, r: 0.4 }, 3.4, 1, 'lo', 2), D(k.corners(seat, 2).map(([x, y]) => at([x, y, 11.4])), { size: 0.35 }));
		return out.join('');
	}

	function talk() {
		const [cx, cy] = [STATION_X[0], 0];
		const out = [halo({ x: cx - 18, y: cy - 18, w: 36, d: 36, r: 18 }, 0, TABLE_TOP)];
		out.push(post(cx, cy, 21, 0, 0.6, 'lo', 0.2), L(k.ring(cx, cy, 18.5, 0.6, P, 48), { tone: 'mid' }), L(k.ring(cx, cy, 16.5, 0.6, P, 44), { tone: 'faint' }));
		out.push(L(Array.from({ length: 24 }, (_, i) => k.lineOnTop([cx + Math.cos((i / 24) * 6.2832) * 19, cy + Math.sin((i / 24) * 6.2832) * 19], [cx + Math.cos((i / 24) * 6.2832) * 20.6, cy + Math.sin((i / 24) * 6.2832) * 20.6], 0.6, P)).join(''), { tone: 'faint' }));
		out.push(chair(cx, cy - 32, -1));
		out.push(post(cx, cy, 3, 0, TABLE_TOP - 3, 'lo'), post(cx, cy, 8, 0, 1.6, 'lo'));
		out.push(S(k.cylinder(cx, cy, 17, TABLE_TOP - 3, 3, P, 48, 0.6), { tone: 'hi' }));
		out.push(L(k.ring(cx, cy, 13.5, TABLE_TOP, P, 40), { tone: 'faint' }));
		for (const [dx, dy] of [[-6, -12], [9, 11]]) {
			out.push(post(cx + dx, cy + dy, 4.8, TABLE_TOP, 0.6, 'lo'), post(cx + dx, cy + dy, 3.2, TABLE_TOP + 0.6, 4, 'hi', 0.3));
			out.push(L(k.ring(cx + dx, cy + dy, 2, TABLE_TOP + 4.6, P, 14), { tone: 'mid' }));
			out.push(L(k.sideRing([cx + dx + 3.2, cy + dy, TABLE_TOP + 2.4], 1.6, 'x', P, 10), { tone: 'mid', free: true }));
		}
		out.push(chair(cx, cy + 32, 1));
		out.push(L(k.ring(cx, cy, 8, 1.6, P, 24), { tone: 'lo' }), L(k.sideArc(cx, cy, 3, 8, P, 12), { tone: 'lo' }), L(k.ring(cx, cy, 17, TABLE_TOP - 3, P, 40), { tone: 'faint' }));
		return out.join('');
	}

	const SHEET0: Point3 = [STATION_X[0] - 1, 0, TABLE_TOP];
	const SHEET1: Point3 = [DESK.x + DESK.w / 2 + 2, 5, DESK_TOP + 1.2];
	function sheet([cx, cy, z]: Point3) {
		const out = [halo({ x: cx - 10, y: cy - 7, w: 20, d: 14, r: 1 }, z, 0.1, 2)];
		out.push(S(k.slabOf({ x: cx - 10, y: cy - 7, w: 20, d: 14, r: 0.8 }, z, 0.9, P, 2, 0.2), { tone: 'hi' }));
		out.push(L(k.onTop([[cx - 7, cy + 3], [cx - 4, cy - 2], [cx, cy + 2], [cx + 3, cy - 3], [cx + 7, cy]], z + 0.9, P), { tone: 'mid' }));
		out.push(L(k.lineOnTop([cx - 7, cy + 5], [cx + 2, cy + 5], z + 0.9, P), { tone: 'faint', free: true }));
		return out.join('');
	}

	function plan() {
		const out: string[] = [];
		const top: Plan = { x: DESK.x, y: DESK.y, w: DESK.w, d: DESK.d, r: 2 };
		out.push(halo(top, 0, DESK_TOP));
		for (const [x, y] of byDepth(k.corners(top, 3.5))) out.push(post(x, y, 2, 0, DESK_TOP - 3, 'lo'));
		out.push(box(k.insetPlan(top, 4), 5, 1.6, 'lo', 2, 0.2));
		out.push(box(top, DESK_TOP - 3, 3, 'hi', 3, 0.6));
		out.push(box({ x: DESK.x + 3, y: DESK.y - 1, w: DESK.w - 6, d: 3, r: 0.8 }, DESK_TOP, 22, 'mid', 2, 0.4));
		out.push(L(k.planOutline(k.insetPlan(top, 3), DESK_TOP, P), { tone: 'faint' }));
		const ticks = k.topTicks(top.x + 6, top.x + top.w - 6, 3, 5, top.y + top.d - 5, DESK_TOP, [1.6, 3], P);
		out.push(L(ticks.minor, { tone: 'lo' }), L(ticks.major, { tone: 'mid' }));
		out.push(box({ x: DESK.x + 3, y: DESK.y + 5, w: 4, d: DESK.d - 12, r: 0.8 }, DESK_TOP, 0.8, 'mid', 2, 0.2));
		out.push(box({ x: DESK.x + 3, y: DESK.y + 5, w: 40, d: 3.4, r: 0.6 }, DESK_TOP, 0.8, 'mid', 2, 0.2));
		out.push(post(DESK.x + DESK.w - 8, DESK.y + 7, 3, DESK_TOP, 6, 'hi'));
		for (const dx of [-1, 1]) out.push(box({ x: DESK.x + DESK.w - 8 + dx * 1.2 - 0.5, y: DESK.y + 6, w: 1, d: 1, r: 0.2 }, DESK_TOP + 6, 6, 'lo', 2));
		out.push(L(k.ring(DESK.x + DESK.w - 8, DESK.y + 7, 1.6, DESK_TOP + 6, P, 12), { tone: 'mid' }));
		return out.join('');
	}

	function deskItems() {
		const out: string[] = [];
		const tri: Plane[] = [[-91, -17], [-78, -17], [-91, -7]];
		out.push(S(k.extrude(tri, DESK_TOP, 0.6, P), { tone: 'hi' }), L(k.onTop([[-89, -15.4], [-81, -15.4], [-89, -10]], DESK_TOP + 0.6, P, true), { tone: 'lo' }));
		out.push(box({ x: -72, y: -17, w: 5, d: 3, r: 0.6 }, DESK_TOP, 1.6, 'mid', 2, 0.3));
		const f = DESK.y + 2;
		out.push(box({ x: DESK.x + 8, y: f, w: 9, d: 0.6, r: 0.3 }, 25, 8, 'hi', 2, 0.2), box({ x: DESK.x + 20, y: f, w: 8, d: 0.6, r: 0.3 }, 20, 6, 'hi', 2, 0.2), box({ x: DESK.x + 30, y: f, w: 10, d: 0.6, r: 0.3 }, 27, 7, 'hi', 2, 0.2));
		out.push(L(k.lineOnTop([DESK.x + 10, f + 0.6], [DESK.x + 16, f + 0.6], 31, P) + k.lineOnTop([DESK.x + 22, f + 0.6], [DESK.x + 27, f + 0.6], 24, P), { tone: 'faint', free: true }));
		out.push(D([at([DESK.x + 12.5, f + 0.6, 32]), at([DESK.x + 24, f + 0.6, 25]), at([DESK.x + 35, f + 0.6, 33])], { size: 0.6, tone: 'hi' }));
		out.push(L(k.segment([DESK.x + 6, f + 0.1, 18], [DESK.x + 6, f + 0.1, 36], P) + k.segment([DESK.x + 6, f + 0.1, 36], [DESK.x + DESK.w - 6, f + 0.1, 36], P) + k.segment([DESK.x + DESK.w - 6, f + 0.1, 36], [DESK.x + DESK.w - 6, f + 0.1, 18], P), { tone: 'faint' }));
		return out.join('');
	}

	function lamp() {
		const [x, y] = [DESK.x + 8, DESK.y + 6];
		const z0 = DESK_TOP + 22;
		return (
			post(x, y, 5, z0, 2, 'lo') +
			L(k.segment([x, y, z0 + 2], [x + 4, y + 8, z0 + 14], P) + k.segment([x + 4, y + 8, z0 + 14], [x + 18, y + 12, z0 + 12], P), { tone: 'hi', free: true }) +
			post(x + 18, y + 12, 5, z0 + 6, 6, 'mid', 0.3) +
			D([at([x + 4, y + 8, z0 + 14]), at([x, y, z0 + 2])], { size: 0.7, tone: 'hi' })
		);
	}

	function tray() {
		const out = [halo(TRAY, 0, 2, 4)];
		out.push(box(TRAY, 0, 2, 'mid', 4, 0.5));
		const w = 3;
		out.push(L(k.lineOnTop([TRAY.x + w, TRAY.y + 14], [TRAY.x + TRAY.w - w, TRAY.y + 14], 2, P), { tone: 'faint' }), L(k.lineOnTop([TRAY.x + w, TRAY.y + 27], [TRAY.x + TRAY.w - w, TRAY.y + 27], 2, P), { tone: 'faint' }));
		return { back: out.join('') + box({ x: TRAY.x, y: TRAY.y, w: TRAY.w, d: w, r: 0.6 }, 2, TRAY_WALL - 2, 'mid', 2, 0.3) + box({ x: TRAY.x, y: TRAY.y + w, w: w, d: TRAY.d - 2 * w, r: 0.6 }, 2, TRAY_WALL - 2, 'mid', 2, 0.3), front: box({ x: TRAY.x + TRAY.w - w, y: TRAY.y + w, w: w, d: TRAY.d - 2 * w, r: 0.6 }, 2, TRAY_WALL - 2, 'mid', 2, 0.3) + box({ x: TRAY.x, y: TRAY.y + TRAY.d - w, w: TRAY.w, d: w, r: 0.6 }, 2, TRAY_WALL - 2, 'mid', 2, 0.3) };
	}

	function jig() {
		const out = [halo(JIG, 0, JIG_TOP)];
		out.push(box(JIG, 0, JIG_TOP, 'mid', 4, 0.6));
		out.push(L(k.planOutline(k.insetPlan(JIG, 4), JIG_TOP, P), { tone: 'lo' }));
		for (const [x, y] of k.corners(JIG, 4)) out.push(L(k.ring(x, y, 1.8, JIG_TOP, P, 12), { tone: 'mid' }));
		out.push(D(k.corners(JIG, 4).map(([x, y]) => at([x, y, JIG_TOP])), { size: 0.45 }));
		return out.join('');
	}

	function blockSvg(b: Block) {
		const { plan: pl, h } = b;
		const z = 2;
		const out: string[] = [];
		if (b.name === 'wall') {
			out.push(S(k.slabOf(pl, z, h, P, 3, 0.5), { tone: 'hi', inner: L(k.sideSeam(pl, z + h / 2, P, 3), { tone: 'faint' }) }));
			out.push(L(k.ring(pl.x + pl.w / 2, pl.y + pl.d / 2, 2.6, z + h, P, 14), { tone: 'mid' }));
		} else if (b.name === 'door') {
			out.push(S(k.slabOf(pl, z, h, P, 2, 0.4), { tone: 'hi' }));
			out.push(D([at([pl.x + pl.w - 2.5, pl.y + pl.d, z + 4])], { size: 0.7, tone: 'mid' }));
		} else {
			out.push(S(k.slabOf(pl, z, h, P, 3, 0.5), { tone: 'hi' }));
			out.push(L(k.lineOnTop([pl.x + 3, pl.y + pl.d / 2], [pl.x + pl.w - 3, pl.y + pl.d / 2], z + h, P), { tone: 'mid' }));
		}
		return out.join('');
	}

	function shop() {
		const [cx, cy] = [STATION_X[3], 0];
		const plinth: Plan = { x: cx - 26, y: cy - 22, w: 52, d: 44, r: 3 };
		const out = [halo(plinth, 0, 5)];
		out.push(box(plinth, 0, 5, 'mid', 4, 0.8));
		out.push(L(k.planOutline(k.insetPlan(plinth, 4), 5, P), { tone: 'lo' }));
		const body: Plan = { x: cx - 20, y: cy - 16, w: 40, d: 28, r: 1.5 };
		out.push(box(body, 5, 38, 'mid', 3, 0.5));
		const front = body.y + body.d;
		const pane: Plan = { x: cx - 16, y: front - 1, w: 20, d: 2, r: 0.4 };
		out.push(stepSvg('lit-at', 4, S(k.slabOf(pane, 12, 22, P, 2), { tone: 'hi', lit: true })));
		out.push(L(k.segment([cx - 6, front + 1, 12], [cx - 6, front + 1, 34], P) + k.segment([cx - 16, front + 1, 23], [cx + 4, front + 1, 23], P), { tone: 'mid' }));
		const door: Plan = { x: cx + 8, y: front - 1, w: 9, d: 2, r: 0.4 };
		out.push(box(door, 5, 26, 'lo', 2, 0.2));
		out.push(D([at([cx + 10, front + 1, 17])], { size: 0.6, tone: 'hi' }));
		const aw: Plan = { x: cx - 25, y: cy - 14, w: 50, d: 34, r: 2 };
		out.push(box(aw, 43, 4, 'hi', 4, 0.8));
		for (let i = 0; i < 3; i++) out.push(box({ x: aw.x + 5 + i * 17, y: aw.y + 1.5, w: 8, d: aw.d - 3, r: 0.6 }, 47, 0.5, 'lo', 2, 0.2));
		for (let x = aw.x + 10; x < aw.x + aw.w - 4; x += 10) out.push(L(k.lineOnTop([x, aw.y + 1], [x, aw.y + aw.d - 1], 47, P), { tone: 'faint' }));
		out.push(box({ x: cx - 12, y: cy - 4, w: 24, d: 2.4, r: 0.6 }, 47, 10, 'lo', 2, 0.3));
		out.push(L(k.sideRing([cx, cy - 1.5, 52], 3.4, 'y', P, 18), { tone: 'hi', free: true }));
		const vy = aw.y + aw.d - 1.6;
		for (let i = 0; i < 7; i++) out.push(box({ x: aw.x + 0.8 + i * 7.1, y: vy, w: 6, d: 1.6, r: 0.8 }, 43 - (i % 2 ? 3.4 : 5.6), i % 2 ? 3.4 : 5.6, i % 2 ? 'hi' : 'mid', 2, 0.3));
		out.push(box({ x: cx - 18, y: front - 1.5, w: 2, d: 3, r: 0.4 }, 10, 26, 'mid', 2, 0.3), box({ x: cx + 2, y: front - 1.5, w: 2, d: 3, r: 0.4 }, 10, 26, 'mid', 2, 0.3), box({ x: cx - 18, y: front - 1.5, w: 22, d: 3, r: 0.4 }, 36, 2.4, 'mid', 2, 0.3), box({ x: cx - 19, y: front - 2.5, w: 24, d: 5, r: 0.8 }, 9, 2, 'hi', 2, 0.4));
		const fb: Plan = { x: cx - 18, y: front + 2, w: 24, d: 5, r: 1 };
		out.push(S(k.slabOf(fb, 5, 5, P, 3, 0.4), { tone: 'mid', inner: L(k.sideSeam(fb, 7.5, P, 3), { tone: 'faint' }) }));
		for (let i = 0; i < 4; i++) out.push(post(cx - 14 + i * 6, front + 4.5, 1.8, 10, 1.4, 'hi', 0.2), L(k.segment([cx - 14 + i * 6, front + 4.5, 9], [cx - 14 + i * 6, front + 4.5, 10], P), { tone: 'lo' }));
		out.push(box({ x: cx + 6, y: front + 1, w: 15, d: 6, r: 1 }, 5, 1.2, 'hi', 2, 0.3), L(k.planOutline({ x: cx + 7.4, y: front + 2.4, w: 12, d: 3.2, r: 0.6 }, 6.2, P), { tone: 'faint' }));
		out.push(box({ x: cx - 10, y: front - 1.5, w: 2.4, d: 2, r: 0.4 }, 36.4, 0.1, 'lo', 2));
		out.push(box({ x: cx + 12, y: -9, w: 1.4, d: 12, r: 0.4 }, 18, 14, 'lo', 2, 0.2), L(k.segment([cx + 12.2 + 1.4, -3, 18], [cx + 12.2 + 1.4, -3, 32], P) + k.segment([cx + 13.6, -9, 25], [cx + 13.6, 3, 25], P), { tone: 'mid' }));
		out.push(post(cx + 21, front - 1, 1.1, 5, 38, 'lo'), box({ x: cx + 18, y: front - 3.5, w: 6, d: 5, r: 0.8 }, 43, 1.6, 'lo', 2, 0.2));
		out.push(box({ x: cx + 12, y: cy - 12, w: 7, d: 7, r: 0.8 }, 47, 9, 'mid', 3, 0.4), box({ x: cx + 11, y: cy - 13, w: 9, d: 9, r: 1.4 }, 56, 1.6, 'hi', 3, 0.4), L(k.lineOnTop([cx + 13, cy - 8.5], [cx + 18, cy - 8.5], 57.6, P), { tone: 'mid' }));
		out.push(post(cx - 30, cy + 18, 4.2, 5, 5, 'mid', 0.5), post(cx - 30, cy + 18, 3.2, 10, 3, 'hi', 0.4), post(cx + 30, cy + 20, 3.2, 5, 4, 'mid', 0.5), post(cx + 30, cy + 20, 2.4, 9, 2.4, 'hi', 0.4));
		const lanx = cx + 30;
		out.push(post(lanx, cy - 18, 1.1, 5, 24, 'lo'), box({ x: lanx - 4, y: cy - 19, w: 8, d: 2, r: 0.6 }, 29, 1.6, 'mid', 2, 0.2), post(lanx, cy - 18, 3, 26, 3, 'hi', 0.3), D([at([lanx, cy - 18, 29])], { size: 0.6, tone: 'hi' }));
		out.push(cable([[lanx, cy - 17], [lanx - 6, cy - 8], [cx + 21, cy + 5]], 5.2));
		return out.join('');
	}

	function pipeAndGauge() {
		const out: string[] = [];
		out.push(box({ x: 112, y: -2, w: 20, d: 4, r: 1.2 }, 3, 4, 'lo', 3, 0.3));
		out.push(box({ x: 126, y: -2, w: 46, d: 4, r: 1.2 }, 3, 4, 'lo', 3, 0.3));
		out.push(halo({ x: 120, y: -10, w: 22, d: 20, r: 10 }, 0, 8));
		out.push(post(131, 0, 8.5, 0, 8, 'hi', 0.5));
		out.push(L(k.knurl(131, 0, 8.5, 0, 8, 24, P, 0.3), { tone: 'lo' }));
		out.push(L(k.ring(131, 0, 5.4, 8, P, 28), { tone: 'mid' }));
		out.push(post(131, 0, 2, 8, 3, 'mid'));
		out.push(L(k.ring(131, 0, 2.8, 11, P, 12), { tone: 'mid' }));
		const [gx, gy] = [172, 0];
		out.push(halo({ x: gx - 14, y: gy - 14, w: 28, d: 28, r: 14 }, 0, 24));
		out.push(post(gx, gy, 10, 0, 2.4, 'lo'));
		out.push(post(gx, gy, 3.6, 2.4, 18, 'mid'));
		out.push(S(k.cylinder(gx, gy, 13, 20.4, 5, P, 48, 0.8), { tone: 'hi' }));
		out.push(L(k.ring(gx, gy, 10.6, 25.4, P, 40), { tone: 'mid' }));
		const t = k.radialTicks(gx, gy, 10, 21, 5, 25.4, [1.6, 3.2], P, -Math.PI * 0.75, Math.PI * 1.5);
		out.push(L(t.minor, { tone: 'lo' }), L(t.major, { tone: 'mid' }));
		const a = -Math.PI / 2 + 0.55;
		out.push(L(k.lineOnTop([gx, gy], [gx + Math.cos(a) * 8.6, gy + Math.sin(a) * 8.6], 25.4, P), { tone: 'hi', free: true }));
		out.push(D([at([gx, gy, 25.4])], { size: 0.9, tone: 'hi' }));
			return out.join('');
	}

	function oilcan([cx, cy, z]: Point3) {
		const out = [halo({ x: cx - 12, y: cy - 8, w: 28, d: 16, r: 6 }, z, 0.1, 3)];
		out.push(post(cx, cy, 7, z, 12, 'hi', 0.5));
		out.push(L(k.sideArc(cx, cy, 7, z + 3.5, P, 24), { tone: 'lo' }), L(k.sideArc(cx, cy, 7, z + 8.5, P, 24), { tone: 'lo' }));
		out.push(post(cx, cy, 4.6, z + 12, 3, 'hi', 0.3));
		out.push(box({ x: cx - 15, y: cy - 1.3, w: 15, d: 2.6, r: 1 }, z + 11, 2.6, 'hi', 2, 0.3));
		out.push(box({ x: cx - 17, y: cy - 1, w: 4, d: 2, r: 0.8 }, z + 10, 2, 'hi', 2));
		out.push(L(k.sideRing([cx, cy + 7.1, z + 8], 4.5, 'y', P, 20), { tone: 'hi' }));
		out.push(D([at([cx, cy, z + 15])], { size: 0.6, tone: 'mid' }));
		return out.join('');
	}

	function floorLamp() {
		const [x, y] = [-195, -32];
		const out = [halo({ x: x - 7, y: y - 7, w: 14, d: 14, r: 7 }, 0, 4, 3)];
		out.push(post(x, y, 6, 0, 2, 'lo', 0.4), post(x, y, 3.4, 2, 2, 'mid'), post(x, y, 1, 4, 38, 'mid'), L(k.ring(x, y, 4.4, 2, P, 18), { tone: 'mid' }));
		out.push(post(x, y, 7.4, 40, 9, 'hi', 0.5), L(k.ring(x, y, 5, 49, P, 20), { tone: 'mid' }), L(k.sideArc(x, y, 7.4, 44.5, P, 18), { tone: 'lo' }), D([at([x, y, 49])], { size: 0.8, tone: 'hi' }));
		out.push(cable([[x + 4, y + 4], [x + 10, y + 12], [-182, -14]], 0.2));
		const [px, py] = [-193, 29];
		out.push(halo({ x: px - 8, y: py - 8, w: 16, d: 16, r: 8 }, 0, 12, 3));
		out.push(post(px, py, 6.6, 0, 9, 'mid', 0.5), post(px, py, 7.2, 9, 1.6, 'hi', 0.4), L(k.sideArc(px, py, 6.6, 4.5, P, 16), { tone: 'lo' }), L(k.ring(px, py, 5, 10.6, P, 16), { tone: 'mid' }));
		for (const [dx, dy, h] of [[0, 0, 18], [-3, 2, 12], [3, 1, 14]] as const) out.push(post(px + dx, py + dy, 0.8, 10.6, h, 'lo'), post(px + dx, py + dy, 3.4, 10.6 + h, 1, 'hi'));
		return out.join('');
	}

	function planExtras() {
		const out: string[] = [];
		const C: Plan = { x: -150, y: -44, w: 44, d: 14, r: 1.5 };
		out.push(halo(C, 0, 12));
		out.push(S(k.slabOf(C, 0, 12, P, 3, 0.7), { tone: 'mid', inner: L(k.sideSeam(C, 6, P, 3), { tone: 'faint' }) }), L(k.planOutline(k.insetPlan(C, 2.4), 12, P), { tone: 'faint' }));
		for (let i = 0; i < 3; i++) out.push(box({ x: C.x + 2 + i * 14, y: C.y + C.d, w: 12, d: 1.2, r: 0.5 }, 1.6, 4, 'hi', 2, 0.3), D([at([C.x + 8 + i * 14, C.y + C.d + 1.2, 3.6])], { size: 0.5, tone: 'mid' }));
		out.push(box({ x: C.x + 2, y: C.y + C.d, w: 40, d: 1.2, r: 0.5 }, 6.4, 4, 'hi', 2, 0.3), D([at([C.x + 22, C.y + C.d + 1.2, 8.4])], { size: 0.5, tone: 'mid' }));
		out.push(post(-142, -37, 3.2, 12, 0.8, 'lo'), post(-128, -37, 2.2, 12, 6, 'hi', 0.3), post(-128, -37, 2.5, 18, 0.8, 'mid'));
		out.push(box({ x: -120, y: -41, w: 10, d: 7, r: 0.8 }, 12, 1.8, 'hi', 2, 0.3), L(k.lineOnTop([-118, -39], [-112, -39], 13.8, P) + k.lineOnTop([-118, -37], [-114, -37], 13.8, P), { tone: 'faint' }));
		const [hx, hy] = [-128, 22];
		out.push(halo({ x: hx - 7, y: hy - 7, w: 14, d: 14, r: 7 }, 0, 18, 3));
		out.push(post(hx, hy, 5.4, 0, 14, 'mid', 0.5), L(k.ring(hx, hy, 4, 14, P, 16), { tone: 'mid' }), L(k.sideArc(hx, hy, 5.4, 4, P, 16) + k.sideArc(hx, hy, 5.4, 10, P, 16), { tone: 'lo' }));
		for (const [dx, dy, h] of [[-1.6, -1, 10], [1.8, 0.4, 8], [0, 2, 12]] as const) out.push(post(hx + dx, hy + dy, 1.7, 14, h, 'hi', 0.2), L(k.ring(hx + dx, hy + dy, 0.8, 14 + h, P, 8), { tone: 'lo' }));
		return out.join('');
	}

	function partsRack() {
		const out: string[] = [];
		const R: Plan = { x: -44, y: -44, w: 66, d: 17, r: 2 };
		out.push(halo(R, 0, 12));
		out.push(S(k.slabOf(R, 0, 4, P, 3, 0.7), { tone: 'mid', inner: L(k.sideSeam(R, 2, P, 3), { tone: 'faint' }) }));
		const bins: [number, string][] = [[-42, 'gear'], [-20, 'bolts'], [2, 'pipes']];
		for (const [bx, kind] of bins) {
			const B: Plan = { x: bx, y: -42.5, w: 19, d: 14, r: 1 };
			out.push(box(B, 4, 8, 'mid', 3, 0.4), L(k.planOutline(k.insetPlan(B, 1.8), 12, P), { tone: 'lo' }));
			const [mx, my] = [bx + 9.5, -35.5];
			if (kind === 'gear') {
				out.push(post(mx, my, 5, 11, 2, 'hi', 0.3), L(k.knurl(mx, my, 5, 11, 13, 18, P, 0.2), { tone: 'lo' }), L(k.ring(mx, my, 1.8, 13, P, 10), { tone: 'mid' }), post(mx + 3, my + 1, 2.6, 13, 1.6, 'hi', 0.2));
			} else if (kind === 'bolts') {
				for (const [dx, dy] of [[-4, -2], [0, 2.4], [4, -1]]) out.push(post(mx + dx, my + dy, 1.4, 11, 4, 'hi', 0.2), post(mx + dx, my + dy, 2, 15, 1, 'mid'), L(k.ring(mx + dx, my + dy, 0.8, 16, P, 8), { tone: 'lo' }));
			} else {
				for (const [dx, dy] of [[-4, -2], [0, 2], [4, -2]]) out.push(post(mx + dx, my + dy, 1.9, 11, 7, 'hi', 0.3), L(k.ring(mx + dx, my + dy, 1, 18, P, 10), { tone: 'mid' }));
			}
			out.push(box({ x: bx + 5, y: -28.4, w: 9, d: 1.2, r: 0.5 }, 5, 3, 'hi', 2, 0.3), D([at([bx + 9.5, -27.2, 6.5])], { size: 0.4 }));
		}
		out.push(L(k.segment([-44, -27, 2], [22, -27, 2], P), { tone: 'faint' }));
		out.push(D(k.corners(R, 3).map(([x, y]) => at([x, y, 4])), { size: 0.4 }));
		return out.join('');
	}

	function jigExtras() {
		const out: string[] = [];
		for (const [x, y] of k.corners(JIG, 1)) out.push(box({ x: x < JIG.x + 5 ? x - 0.5 : x - 3.5, y: y < JIG.y + 5 ? y - 0.5 : y - 3.5, w: 4, d: 4, r: 0.8 }, JIG_TOP, 3.2, 'mid', 2, 0.3));
		out.push(box({ x: 10, y: 33, w: 3, d: 2.4, r: 0.6 }, 0.6, 2, 'hi', 2), box({ x: 12, y: 33.4, w: 18, d: 1.6, r: 0.6 }, 0.6, 1.6, 'hi', 2, 0.3), box({ x: 29, y: 31.4, w: 7, d: 5.6, r: 1 }, 0.6, 5, 'mid', 2, 0.4), L(k.lineOnTop([30, 34.2], [35, 34.2], 5.6, P), { tone: 'lo' }));
		out.push(box({ x: 14, y: 40, w: 10, d: 3, r: 0.8 }, 0.6, 2.4, 'hi', 2, 0.3), box({ x: 24, y: 40.6, w: 14, d: 1.4, r: 0.5 }, 0.6, 1.2, 'lo', 2), D([at([36, 41.3, 1.8])], { size: 0.4 }));
		return out.join('');
	}

	function oilExtras() {
		const out: string[] = [];
		const [tx, ty] = [131, -34];
		out.push(halo({ x: tx - 9, y: ty - 9, w: 18, d: 18, r: 9 }, 0, 24));
		out.push(post(tx, ty, 8, 0, 3, 'lo', 0.4), post(tx, ty, 7, 3, 20, 'mid', 0.4), L(k.sideArc(tx, ty, 7, 9, P, 24) + k.sideArc(tx, ty, 7, 17, P, 24), { tone: 'lo' }), L(k.knurl(tx, ty, 7, 3, 23, 14, P, 0.3), { tone: 'faint' }));
		out.push(post(tx, ty, 7.6, 23, 1.6, 'hi', 0.4), post(tx, ty, 3, 24.6, 2.4, 'hi', 0.3), L(k.ring(tx, ty, 4.6, 24.6, P, 18), { tone: 'mid' }), L(k.ring(tx, ty, 1.6, 27, P, 10), { tone: 'mid' }));
		out.push(box({ x: tx - 2, y: ty + 7, w: 4, d: 28, r: 1 }, 3, 4, 'lo', 3, 0.3), post(tx, ty + 8, 3.2, 3, 5, 'hi', 0.3), L(k.ring(tx, ty + 8, 1.6, 8, P, 10), { tone: 'mid' }), post(tx, ty + 24, 3, 3, 5, 'hi', 0.3));
		out.push(D(Array.from({ length: 6 }, (_, i) => at([tx + Math.cos((i / 6) * 6.2832) * 5.4, ty + Math.sin((i / 6) * 6.2832) * 5.4, 23])), { size: 0.4 }));
		const [wx, wy] = [162, 34];
		out.push(halo({ x: wx, y: wy - 7, w: 28, d: 14, r: 4 }, 0, 2, 2));
		out.push(box({ x: wx + 8, y: wy - 1.6, w: 18, d: 3.2, r: 1.2 }, 0.6, 1.8, 'hi', 3, 0.3), post(wx + 5, wy, 5.4, 0.6, 1.8, 'hi', 0.3), L(k.ring(wx + 5, wy, 2.4, 2.4, P, 14), { tone: 'mid' }), post(wx + 27, wy, 3.6, 0.6, 1.8, 'hi', 0.3), L(k.ring(wx + 27, wy, 1.6, 2.4, P, 12), { tone: 'mid' }));
		const [gx, gy] = [194, 30];
		out.push(halo({ x: gx - 7, y: gy - 7, w: 14, d: 14, r: 7 }, 0, 10, 3));
		out.push(post(gx, gy, 5.6, 0, 9, 'hi', 0.4), L(k.sideArc(gx, gy, 5.6, 2.6, P, 18) + k.sideArc(gx, gy, 5.6, 6.4, P, 18), { tone: 'lo' }), post(gx, gy, 5.8, 9, 1.4, 'mid', 0.3), L(k.ring(gx, gy, 3.6, 10.4, P, 16), { tone: 'mid' }), D([at([gx, gy, 10.4])], { size: 0.5, tone: 'mid' }));
		out.push(post(116, 0, 3.4, 2, 6, 'mid', 0.3), L(k.ring(116, 0, 2, 8, P, 12), { tone: 'lo' }));
		return out.join('');
	}

	const drop = stepSvg('show-from', 5, post(131, 0, 1.2, 12, 6, 'hi', 0.2) + D([at([131, 0, 18])], { size: 0.6, tone: 'hi' }));

	const off = (to: Point3, from: Point3): Point3 => [to[0] - from[0], to[1] - from[1], to[2] - from[2]];
	const none: Point3 = [0, 0, 0];
	const toBoard = off(SHEET1, SHEET0);
	const blockMoves = Object.fromEntries(
		BLOCKS.map((b) => {
			const from: Point3 = [b.plan.x + b.plan.w / 2, b.plan.y + b.plan.d / 2, 2];
			const final = off(b.to, from);
			const lifted: Point3 = [0, 0, LIFT];
			return [b.name, [none, lifted, final, final, final]];
		}),
	);
	const oilMove = off(OIL_TO, OIL_AT);
	const transforms = transformsFrom(P, {
		sheet: [none, toBoard, toBoard, toBoard, toBoard],
		...blockMoves,
		oilcan: [none, none, none, none, oilMove],
	});

	const trayParts = tray();
	const svg = k.figureSvg({
		width,
		height,
		label:
			'One long workbench with five stations in a row, each marked with dots: two chairs and a table for the conversation, a drafting desk where the sketch is drawn up as a plan, a tray of ready-made parts that are fitted together on a stand, a small shop front whose window lights up when it goes live, and an oil can beside a gauge for keeping it running.',
		body: [
			bench(),
			floorLamp(),
			talk(),
			planExtras(),
			plan(),
			deskItems(),
			moverSvg('sheet', transforms.sheet[4], sheet(SHEET0)),
			lamp(),
			partsRack(),
			trayParts.back,
			jig(),
			...BLOCKS.map((b) => moverSvg(b.name, transforms[b.name][4], blockSvg(b))),
			trayParts.front,
			jigExtras(),
			shop(),
			oilExtras(),
			pipeAndGauge(),
			drop,
			moverSvg('oilcan', transforms.oilcan[4], oilcan(OIL_AT)),
		],
	});
	return { svg, labels: LABELS, transforms };
}
