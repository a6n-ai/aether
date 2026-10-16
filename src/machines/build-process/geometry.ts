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
		[...k.boxCorners(BENCH, -BENCH_H - FOOT_H, 0), [88, -30, 72], [-85, 0, 44], [-165, 0, 34], [168, 0, 40]],
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
		return out.join('');
	}

	function talk() {
		const [cx, cy] = [STATION_X[0], 0];
		const out = [halo({ x: cx - 18, y: cy - 18, w: 36, d: 36, r: 18 }, 0, TABLE_TOP)];
		out.push(chair(cx, cy - 32, -1));
		out.push(post(cx, cy, 3, 0, TABLE_TOP - 3, 'lo'), post(cx, cy, 8, 0, 1.6, 'lo'));
		out.push(S(k.cylinder(cx, cy, 17, TABLE_TOP - 3, 3, P, 48, 0.6), { tone: 'hi' }));
		out.push(L(k.ring(cx, cy, 13.5, TABLE_TOP, P, 40), { tone: 'faint' }));
		for (const [dx, dy] of [[-8, -9], [10, 8]]) {
			out.push(post(cx + dx, cy + dy, 3.2, TABLE_TOP, 4.5, 'hi'));
			out.push(L(k.ring(cx + dx, cy + dy, 2, TABLE_TOP + 4.5, P, 14), { tone: 'mid' }));
			out.push(L(k.sideRing([cx + dx + 3.2, cy + dy, TABLE_TOP + 2.4], 1.6, 'x', P, 10), { tone: 'mid', free: true }));
		}
		out.push(chair(cx, cy + 32, 1));
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
		out.push(box({ x: DESK.x + 3, y: DESK.y + 5, w: 4, d: DESK.d - 12, r: 0.8 }, DESK_TOP, 1.2, 'mid', 2, 0.2));
		out.push(box({ x: DESK.x + 3, y: DESK.y + 5, w: 40, d: 3.4, r: 0.6 }, DESK_TOP, 1.2, 'mid', 2, 0.2));
		out.push(post(DESK.x + DESK.w - 8, DESK.y + 7, 3, DESK_TOP, 6, 'hi'));
		for (const dx of [-1, 1]) out.push(box({ x: DESK.x + DESK.w - 8 + dx * 1.2 - 0.5, y: DESK.y + 6, w: 1, d: 1, r: 0.2 }, DESK_TOP + 6, 6, 'lo', 2));
		out.push(L(k.ring(DESK.x + DESK.w - 8, DESK.y + 7, 1.6, DESK_TOP + 6, P, 12), { tone: 'mid' }));
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
		for (let x = aw.x + 10; x < aw.x + aw.w - 4; x += 10) out.push(L(k.lineOnTop([x, aw.y + 1], [x, aw.y + aw.d - 1], 47, P), { tone: 'faint' }));
		out.push(box({ x: cx - 12, y: cy - 4, w: 24, d: 2.4, r: 0.6 }, 47, 10, 'lo', 2, 0.3));
		out.push(L(k.sideRing([cx, cy - 1.5, 52], 3.4, 'y', P, 18), { tone: 'hi', free: true }));
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
			talk(),
			plan(),
			moverSvg('sheet', transforms.sheet[4], sheet(SHEET0)),
			lamp(),
			trayParts.back,
			jig(),
			...BLOCKS.map((b) => moverSvg(b.name, transforms[b.name][4], blockSvg(b))),
			trayParts.front,
			shop(),
			pipeAndGauge(),
			drop,
			moverSvg('oilcan', transforms.oilcan[4], oilcan(OIL_AT)),
		],
	});
	return { svg, labels: LABELS, transforms };
}
