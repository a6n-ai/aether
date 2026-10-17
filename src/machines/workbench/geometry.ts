import * as k from '../../lib/anatomy/iso-kit';
import type { Flat, Plan, Plane, Point3 } from '../../lib/anatomy/iso-kit';
import { moverSvg, stepSvg, transformsFrom, type Machine } from '../../lib/plate';

export const STEP_LABELS = ['parts that already work', 'pick what you need', 'fitted to your business', 'your app, open for customers'] as const;

const BENCH: Plan = { x: -175, y: -82, w: 350, d: 164, r: 8 };
const BENCH_H = 12;
const FOOT_H = 6;

const TRAY: Plan = { x: -152, y: -54, w: 124, d: 104, r: 4 };
const TRAY_FLOOR = 2;
const WALL = 4;
const WALL_TOP = 11;

const SILL: Plan = { x: 36, y: -66, w: 118, d: 26, r: 2 };
const SILL_H = 6;
const POST_TOP = 92;
const AWNING_Z = POST_TOP;
const PANE_Y = -52;
const PANE_Z: [number, number] = [16, 78];

const COUNTER: Plan = { x: 42, y: -26, w: 106, d: 26, r: 2 };
const COUNTER_H = 16;

const PHONE_STAND: Plan = { x: 132, y: 42, w: 34, d: 16, r: 2 };

const TRAY_Z = TRAY_FLOOR;
const SEAT_Y = COUNTER.y + COUNTER.d / 2;
const LIFT = 40;

interface Mover {
	name: 'key' | 'coin' | 'van';
	from: Point3;
	to: Point3;
}

export const MOVERS: Mover[] = [
	{ name: 'key', from: [-122, -26, TRAY_Z], to: [58, SEAT_Y, COUNTER_H] },
	{ name: 'coin', from: [-88, -26, TRAY_Z], to: [88, SEAT_Y, COUNTER_H] },
	{ name: 'van', from: [-114, 22, TRAY_Z], to: [122, SEAT_Y, COUNTER_H] },
];

export type Pose = Record<Mover['name'], Point3>;

/** Offset of each moving part from where it was drawn (its tray seat), for step 1..4. */
export function poseAt(step: number): Pose {
	const pose = {} as Pose;
	for (const m of MOVERS) {
		const travel: Point3 = [m.to[0] - m.from[0], m.to[1] - m.from[1], m.to[2] - m.from[2]];
		pose[m.name] = step <= 1 ? [0, 0, 0] : step === 2 ? [0, 0, LIFT] : travel;
	}
	return pose;
}

export function workbench(width = 720, height = 480): Machine {
	const P = k.fitProjection(
		[...k.boxCorners(BENCH, -BENCH_H - FOOT_H, 0), [SILL.x, SILL.y, AWNING_Z + 8], [SILL.x + SILL.w, SILL.y + SILL.d, AWNING_Z + 8], [-122, -26, TRAY_Z + LIFT + 8], [-170, -82, 50], [-62, -82, 50], [166, -60, 80]],
		width,
		height,
		{ pad: 22, azimuth: 40 },
	);
	const at = (p: Point3) => k.iso(p, P);
	const S = k.solidSvg;
	const L = k.lineSvg;
	const D = k.dotsSvg;
	type Tone = 'hi' | 'mid' | 'lo';
	const box = (plan: Plan, z: number, h: number, tone: Tone = 'mid', steps = 3, bevel = 0.4) => S(k.slabOf(plan, z, h, P, steps, bevel), { tone });
	const post = (cx: number, cy: number, r: number, z: number, h: number, tone: Tone = 'mid', bevel = 0) => S(k.cylinder(cx, cy, r, z, h, P, r > 6 ? 28 : 16, bevel), { tone });
	const halo = (plan: Plan, z: number, h: number, blur = 4) => `<path class="iso-halo" d="${k.haloOf(plan, z, h, P)}" style="filter:blur(${blur}px)"/>`;
	const cable = (pts: Plane[], z: number) => L(k.onTop(pts, z, P), { tone: 'mid', free: true }) + D([at([...pts[0], z]), at([...pts[pts.length - 1], z])], { size: 0.8, tone: 'hi' });
	const byDepth = (points: Plane[]) => [...points].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));

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
		const strip: Plan = { x: -150, y: BENCH.y + BENCH.d - 16, w: 190, d: 7, r: 1 };
		out.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: 'lo', crease: 'none' }));
		const ticks = k.topTicks(strip.x + 4, strip.x + strip.w - 4, 4, 5, strip.y + 0.8, 0.6, [2, 3.6], P);
		out.push(L(ticks.minor, { tone: 'lo' }), L(ticks.major, { tone: 'mid' }));
		out.push(D([at([strip.x + 2, strip.y + 3.5, 0.6]), at([strip.x + strip.w - 2, strip.y + 3.5, 0.6])], { size: 0.45 }));
		const label: Plan = { x: 62, y: BENCH.y + BENCH.d - 22, w: 40, d: 13, r: 1.5 };
		out.push(S(k.slabOf(label, 0, 0.8, P, 3), { tone: 'lo' }));
		for (const dy of [3.5, 6.5, 9.5]) out.push(L(k.lineOnTop([label.x + 5, label.y + dy], [label.x + label.w - (dy === 9.5 ? 16 : 5), label.y + dy], 0.8, P), { tone: 'faint', free: true }));
		out.push(D([at([label.x + 2, label.y + 2, 0.8]), at([label.x + label.w - 2, label.y + label.d - 2, 0.8])], { size: 0.4 }));
		return out.join('');
	}

	const walls = {
		back: { x: TRAY.x, y: TRAY.y, w: TRAY.w, d: WALL, r: 1 },
		left: { x: TRAY.x, y: TRAY.y + WALL, w: WALL, d: TRAY.d - WALL * 2, r: 1 },
		right: { x: TRAY.x + TRAY.w - WALL, y: TRAY.y + WALL, w: WALL, d: TRAY.d - WALL * 2, r: 1 },
		front: { x: TRAY.x, y: TRAY.y + TRAY.d - WALL, w: TRAY.w, d: WALL, r: 1 },
	} satisfies Record<string, Plan>;
	const wall = (plan: Plan) => S(k.slabOf(plan, TRAY_FLOOR, WALL_TOP - TRAY_FLOOR, P, 3, 0.5), { tone: 'mid', inner: L(k.sideSeam(plan, 6.5, P, 3), { tone: 'faint' }) });
	const cap = (x: number, y: number) => box({ x, y, w: 7, d: 7, r: 1.5 }, WALL_TOP, 1.4, 'hi', 3, 0.3) + D([at([x + 3.5, y + 3.5, WALL_TOP + 1.4])], { size: 0.45 });

	function trayBack() {
		const out = [`<path class="iso-halo" d="${k.haloOf(TRAY, 0, 2, P)}" style="filter:blur(5px)"/>`];
		out.push(S(k.slabOf(TRAY, 0, TRAY_FLOOR, P, 6, 0.6), { tone: 'mid' }));
		const midY = TRAY.y + TRAY.d / 2 - 1;
		out.push(L(k.lineOnTop([TRAY.x + WALL, midY], [TRAY.x + TRAY.w - WALL, midY], TRAY_FLOOR, P), { tone: 'faint' }));
		for (const x of [-105, -71]) out.push(L(k.lineOnTop([x, TRAY.y + WALL], [x, midY], TRAY_FLOOR, P), { tone: 'faint' }));
		out.push(L(k.lineOnTop([-90, midY], [-90, TRAY.y + TRAY.d - WALL], TRAY_FLOOR, P), { tone: 'faint' }));
		const padTop = TRAY_FLOOR + 0.7;
		const pads: Plan[] = [
			{ x: -146, y: -47.5, w: 40, d: 42, r: 2 },
			{ x: -102.5, y: -47.5, w: 29, d: 42, r: 2 },
			{ x: -68.5, y: -47.5, w: 34, d: 42, r: 2 },
			{ x: -145.5, y: 0.5, w: 53, d: 43.5, r: 2 },
			{ x: -87.5, y: 0.5, w: 53, d: 43.5, r: 2 },
		];
		for (const pad of pads) out.push(box(pad, TRAY_FLOOR, 0.7, 'lo', 3, 0.2), L(k.planOutline(k.insetPlan(pad, 2.2), padTop, P), { tone: 'faint' }));
		out.push(L(k.planOutline({ x: -139.8, y: -33, w: 34.6, d: 14, r: 6 }, padTop, P), { tone: 'lo' }), L(k.ring(-88, -26, 10.6, padTop, P, 36), { tone: 'lo' }), L(k.ring(-58, -26, 11.8, padTop, P, 36), { tone: 'lo' }));
		out.push(L(k.planOutline({ x: -129, y: 13, w: 30, d: 18, r: 3 }, padTop, P), { tone: 'lo' }), L(k.planOutline({ x: -76, y: 12.5, w: 28, d: 19, r: 1.5 }, padTop, P), { tone: 'lo' }));
		out.push(box({ x: TRAY.x + WALL, y: midY - 0.7, w: TRAY.w - WALL * 2, d: 1.4, r: 0.5 }, TRAY_FLOOR, 3, 'mid', 2, 0.2));
		for (const x of [-105, -71]) out.push(box({ x: x - 0.7, y: TRAY.y + WALL, w: 1.4, d: 7, r: 0.5 }, TRAY_FLOOR, 3, 'mid', 2, 0.2));
		out.push(box({ x: -90.7, y: TRAY.y + TRAY.d - WALL - 7, w: 1.4, d: 7, r: 0.5 }, TRAY_FLOOR, 3, 'mid', 2, 0.2));
		out.push(wall(walls.back), wall(walls.left), wall(walls.right));
		out.push(box({ x: TRAY.x - 3, y: -9, w: 3, d: 14, r: 1 }, 4, 3, 'hi', 2, 0.3), box({ x: TRAY.x + TRAY.w, y: -9, w: 3, d: 14, r: 1 }, 4, 3, 'hi', 2, 0.3));
		out.push(cap(TRAY.x, TRAY.y), cap(TRAY.x + TRAY.w - 7, TRAY.y), cap(TRAY.x, TRAY.y + TRAY.d - 7));
		out.push(D([at([TRAY.x + 6, TRAY.y + 2, WALL_TOP]), at([TRAY.x + TRAY.w - 6, TRAY.y + 2, WALL_TOP])], { size: 0.45 }));
		return out.join('');
	}
	function trayFront() {
		const front = walls.front;
		const pull: Plan = { x: TRAY.x + TRAY.w / 2 - 12, y: front.y + WALL, w: 24, d: 3, r: 1.2 };
		return wall(front) + cap(TRAY.x + TRAY.w - 7, TRAY.y + TRAY.d - 7) + S(k.slabOf(pull, 4, 4, P, 3, 0.4), { tone: 'mid' }) + D([at([pull.x + 3, pull.y + 3, 6]), at([pull.x + pull.w - 3, pull.y + 3, 6])], { size: 0.4 });
	}

	function key([cx, cy, z]: Point3) {
		const out = [`<path class="iso-halo" d="${k.haloOf({ x: cx - 16, y: cy - 6, w: 32, d: 12, r: 6 }, z, 0.1, P)}" style="filter:blur(3px)"/>`];
		out.push(S(k.slabOf({ x: cx - 6, y: cy - 1.8, w: 22, d: 3.6, r: 0.8 }, z, 2, P, 2, 0.3), { tone: 'hi' }));
		for (const dx of [10, 14]) out.push(S(k.slabOf({ x: cx + dx, y: cy + 1.6, w: 2.4, d: 2.4, r: 0.4 }, z, 2, P, 2), { tone: 'hi', crease: 'none' }));
		out.push(S(k.cylinder(cx - 10, cy, 6.5, z, 2.2, P, 32, 0.4), { tone: 'hi' }));
		out.push(L(k.ring(cx - 11.5, cy, 2.4, z + 2.2, P, 20), { tone: 'mid' }));
		return out.join('');
	}
	function coin([cx, cy, z]: Point3) {
		const out = [`<path class="iso-halo" d="${k.haloOf({ x: cx - 9, y: cy - 9, w: 18, d: 18, r: 9 }, z, 0.1, P)}" style="filter:blur(3px)"/>`];
		out.push(S(k.cylinder(cx, cy, 9, z, 2.6, P, 48, 0.6), { tone: 'hi' }));
		out.push(L(k.knurl(cx, cy, 9, z, z + 2.6, 48, P, 0.3), { tone: 'lo' }));
		out.push(L(k.ring(cx, cy, 6.4, z + 2.6, P, 40), { tone: 'mid' }));
		out.push(D([at([cx, cy, z + 2.6])], { size: 0.6, tone: 'hi' }));
		return out.join('');
	}
	function star([cx, cy, z]: Point3) {
		const ring: Plane[] = [];
		for (let i = 0; i < 10; i++) {
			const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
			const r = i % 2 ? 4.4 : 10;
			ring.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
		}
		return S(k.extrude(ring, z, 2.4, P, { convex: false }), { tone: 'hi' }) + D([at([cx, cy, z + 2.4])], { size: 0.5, tone: 'mid' });
	}
	function van([cx, cy, z]: Point3) {
		const out = [`<path class="iso-halo" d="${k.haloOf({ x: cx - 14, y: cy - 8, w: 28, d: 16, r: 3 }, z, 0.1, P)}" style="filter:blur(3px)"/>`];
		const body: Plan = { x: cx - 13, y: cy - 7, w: 18, d: 14, r: 1.6 };
		const cab: Plan = { x: cx + 5, y: cy - 7, w: 8, d: 14, r: 1.6 };
		out.push(S(k.slabOf(cab, z + 1.5, 8, P, 3, 0.4), { tone: 'hi' }));
		out.push(S(k.slabOf(body, z + 1.5, 12, P, 3, 0.5), { tone: 'hi' }));
		out.push(L(k.segment([cab.x + 2, cab.y + cab.d, z + 6.5], [cab.x + cab.w - 1, cab.y + cab.d, z + 6.5], P), { tone: 'mid' }));
		for (const wx of [cx - 8, cx + 8]) {
			out.push(L(k.sideRing([wx, cy + 7.1, z + 2.6], 2.6, 'y', P, 20), { tone: 'hi' }));
			out.push(D([at([wx, cy + 7.1, z + 2.6])], { size: 0.45, tone: 'hi' }));
		}
		return out.join('');
	}
	function envelope([cx, cy, z]: Point3) {
		const plan: Plan = { x: cx - 12, y: cy - 8, w: 24, d: 16, r: 1 };
		const top = z + 1.4;
		return (
			S(k.slabOf(plan, z, 1.4, P, 2, 0.3), { tone: 'hi' }) +
			L(k.lineOnTop([plan.x + 1, plan.y + 1], [cx, cy + 1.5], top, P) + k.lineOnTop([cx, cy + 1.5], [plan.x + plan.w - 1, plan.y + 1], top, P), { tone: 'mid' })
		);
	}

	function shopFront() {
		const out = [`<path class="iso-halo" d="${k.haloOf(SILL, 0, SILL_H, P)}"/>`];
		out.push(S(k.slabOf(SILL, 0, SILL_H, P, 3, 0.6), { tone: 'mid' }));
		const back: Plan = { x: SILL.x + 6, y: SILL.y + 2, w: SILL.w - 12, d: 4, r: 0.6 };
		out.push(S(k.slabOf(back, SILL_H, POST_TOP - SILL_H, P, 2), { tone: 'lo', crease: 'none' }));
		const pane: Plan = { x: SILL.x + 12, y: PANE_Y, w: SILL.w - 24, d: 2, r: 0.4 };
		out.push(stepSvg('lit-at', 4, S(k.slabOf(pane, PANE_Z[0], PANE_Z[1] - PANE_Z[0], P, 2), { tone: 'hi', lit: true })));
		const front = pane.y + pane.d;
		const mid = pane.x + pane.w / 2;
		out.push(L(k.segment([mid, front, PANE_Z[0]], [mid, front, PANE_Z[1]], P), { tone: 'mid' }));
		out.push(L(k.segment([pane.x, front, 50], [pane.x + pane.w, front, 50], P), { tone: 'mid' }));
		const [i0, i1, j0, j1] = [pane.x + 4, pane.x + pane.w - 4, PANE_Z[0] + 4, PANE_Z[1] - 4];
		out.push(L(k.segment([i0, front, j0], [i1, front, j0], P) + k.segment([i1, front, j0], [i1, front, j1], P) + k.segment([i1, front, j1], [i0, front, j1], P) + k.segment([i0, front, j1], [i0, front, j0], P), { tone: 'faint' }));
		out.push(L(k.segment([i0 + 6, front, j0 + 10], [i0 + 22, front, j0 + 38], P) + k.segment([i0 + 12, front, j0 + 6], [i0 + 32, front, j0 + 40], P), { tone: 'faint' }));
		out.push(D([at([i0 + 2, front, j0 + 2]), at([i1 - 2, front, j0 + 2]), at([i0 + 2, front, j1 - 2]), at([i1 - 2, front, j1 - 2])], { size: 0.45, tone: 'mid' }));
		for (const x of [SILL.x + 2, SILL.x + SILL.w - 10]) {
			const post: Plan = { x, y: SILL.y + 4, w: 8, d: 8, r: 1 };
			out.push(S(k.slabOf(post, SILL_H, POST_TOP - SILL_H, P, 3, 0.4), { tone: 'mid' }));
		}
		const lintel: Plan = { x: SILL.x, y: SILL.y + 2, w: SILL.w, d: 12, r: 1 };
		out.push(S(k.slabOf(lintel, POST_TOP - 10, 10, P, 3, 0.5), { tone: 'mid' }));
		const awning: Plan = { x: SILL.x - 6, y: SILL.y - 2, w: SILL.w + 12, d: 30, r: 2 };
		out.push(S(k.slabOf(awning, AWNING_Z, 5, P, 4, 0.8), { tone: 'mid' }));
		for (let x = awning.x + 12; x < awning.x + awning.w - 6; x += 12) out.push(L(k.lineOnTop([x, awning.y + 1], [x, awning.y + awning.d - 1], AWNING_Z + 5, P), { tone: 'faint' }));
		const vy = awning.y + awning.d - 1.6;
		for (let i = 0; i < 10; i++) out.push(box({ x: awning.x + 0.8 + i * 12.9, y: vy, w: 11, d: 1.6, r: 0.8 }, AWNING_Z - (i % 2 ? 4 : 7), i % 2 ? 9 : 12, i % 2 ? 'hi' : 'mid', 2, 0.3));
		for (let i = 0; i < 5; i++) out.push(box({ x: awning.x + 6 + i * 24, y: awning.y + 1.5, w: 12, d: awning.d - 5, r: 0.6 }, AWNING_Z + 5, 0.6, 'lo', 2, 0.2));
		const pf = pane.y + pane.d;
		out.push(box({ x: pane.x - 2.5, y: pane.y - 1, w: 2.5, d: 4, r: 0.5 }, PANE_Z[0] - 2, PANE_Z[1] - PANE_Z[0] + 4, 'mid', 2, 0.3), box({ x: pane.x + pane.w, y: pane.y - 1, w: 2.5, d: 4, r: 0.5 }, PANE_Z[0] - 2, PANE_Z[1] - PANE_Z[0] + 4, 'mid', 2, 0.3));
		out.push(box({ x: pane.x - 2.5, y: pane.y - 1, w: pane.w + 5, d: 4, r: 0.5 }, PANE_Z[1], 3, 'mid', 2, 0.3), box({ x: pane.x - 3.5, y: pane.y - 3, w: pane.w + 7, d: 6, r: 0.8 }, PANE_Z[0] - 4, 2.4, 'hi', 2, 0.4));
		out.push(D([at([pane.x - 1.2, pf + 0.4, 40]), at([pane.x + pane.w + 1.2, pf + 0.4, 40])], { size: 0.45 }));
		const fb: Plan = { x: 50, y: -48, w: 90, d: 7, r: 1.2 };
		out.push(S(k.slabOf(fb, SILL_H, 7, P, 3, 0.5), { tone: 'mid', inner: L(k.sideSeam(fb, SILL_H + 3.5, P, 3), { tone: 'faint' }) }), L(k.planOutline(k.insetPlan(fb, 1.4), SILL_H + 7, P), { tone: 'lo' }));
		for (let i = 0; i < 6; i++) {
			const bx = 58 + i * 14.4;
			out.push(L(k.segment([bx, -44.5, SILL_H + 7], [bx, -44.5, SILL_H + 11], P), { tone: 'lo' }), S(k.cylinder(bx, -44.5, 2.2, SILL_H + 11, 1.4, P, 14, 0.2), { tone: 'hi' }), D([at([bx, -44.5, SILL_H + 12.4])], { size: 0.45, tone: 'mid' }));
		}
		out.push(box({ x: 150, y: -60.5, w: 9, d: 2, r: 0.6 }, 76, 2, 'mid', 2, 0.3), post(158, -59.5, 3.2, 61, 1.2, 'lo'), post(158, -59.5, 2.6, 62.2, 8, 'hi', 0.3), post(158, -59.5, 3.4, 70.2, 1.4, 'mid'), L(k.sideArc(158, -59.5, 2.6, 66, P, 14), { tone: 'lo' }), L(k.segment([158, -59.5, 71.6], [158, -59.5, 76], P), { tone: 'mid' }));
		out.push(box({ x: 20, y: -61, w: 18, d: 2, r: 0.6 }, 76, 2, 'mid', 2, 0.3), box({ x: 21, y: -60.2, w: 11, d: 1.4, r: 0.6 }, 62, 10, 'hi', 2, 0.4), L(k.segment([22.5, -59, 76], [22.5, -59, 72], P) + k.segment([30.5, -59, 76], [30.5, -59, 72], P), { tone: 'mid' }), L(k.sideRing([26.5, -58.8, 67], 2.6, 'y', P, 16), { tone: 'lo' }), D([at([22.5, -58.8, 71]), at([30.5, -58.8, 71])], { size: 0.5, tone: 'hi' }));
		return out.join('');
	}

	function counter() {
		const out = [`<path class="iso-halo" d="${k.haloOf(COUNTER, 0, COUNTER_H, P)}"/>`];
		out.push(box({ x: 40, y: -28, w: 110, d: 30, r: 2.4 }, 0, 2.4, 'lo', 3, 0.5));
		out.push(S(k.slabOf(COUNTER, 2.4, COUNTER_H - 2.4, P, 3, 0.8), { tone: 'mid', inner: L(k.sideSeam(COUNTER, COUNTER_H - 4, P), { tone: 'faint' }) }));
		for (const m of MOVERS) out.push(L(k.ring(m.to[0], m.to[1], 11, COUNTER_H, P, 32), { tone: 'faint' }));
		out.push(L(k.planOutline(k.insetPlan(COUNTER, 3), COUNTER_H, P), { tone: 'lo' }));
		const fy = COUNTER.y + COUNTER.d;
		for (const x of [66, 94, 122]) out.push(L(k.segment([x, fy, 4.5], [x, fy, COUNTER_H - 5], P), { tone: 'faint' }));
		for (const x of [54, 80, 108, 135]) out.push(D([at([x, fy, 9])], { size: 0.6, tone: 'mid' }), L(k.segment([x - 5, fy, 9], [x + 5, fy, 9], P), { tone: 'lo' }));
		out.push(D(k.corners(COUNTER, 5).map(([x, y]) => at([x, y, COUNTER_H])), { size: 0.45 }));
		out.push(post(46, -22.5, 3.4, COUNTER_H, 1, 'lo'), post(46, -22.5, 2.6, COUNTER_H + 1, 3.5, 'hi', 0.3), L(k.ring(46, -22.5, 0.9, COUNTER_H + 4.5, P, 10), { tone: 'mid' }), L(k.sideArc(46, -22.5, 2.6, COUNTER_H + 3, P, 12), { tone: 'lo' }));
		out.push(box({ x: 99, y: -23, w: 8, d: 3, r: 0.8 }, COUNTER_H, 1.2, 'lo', 2), post(103, -21.5, 0.7, COUNTER_H + 1.2, 5, 'mid'), box({ x: 99.5, y: -22.5, w: 7, d: 1.2, r: 0.4 }, COUNTER_H + 5, 5, 'hi', 2, 0.3), L(k.lineOnTop([100.5, -22.4], [105, -22.4], COUNTER_H + 10, P), { tone: 'mid' }));
		out.push(post(143, -21, 4.4, COUNTER_H, 5.4, 'mid', 0.4), L(k.ring(143, -21, 3.2, COUNTER_H + 5.4, P, 16), { tone: 'lo' }), post(143, -21, 1.8, COUNTER_H + 5.4, 8, 'hi'), post(145.6, -21, 1.1, COUNTER_H + 8, 4, 'hi'), post(140.6, -21, 1.1, COUNTER_H + 9.4, 3.2, 'hi'));
		out.push(`<path class="iso-halo" d="${k.haloOf({ x: 139, y: -25, w: 9, d: 9, r: 4.5 }, COUNTER_H, 0.1, P)}" style="filter:blur(2px)"/>`);
		return out.join('');
	}

	function phone() {
		const out = [`<path class="iso-halo" d="${k.haloOf(PHONE_STAND, 0, 3, P)}"/>`];
		out.push(S(k.slabOf(PHONE_STAND, 0, 3, P, 3, 0.5), { tone: 'mid' }));
		out.push(box({ x: 143, y: 43.5, w: 10, d: 3.6, r: 0.8 }, 3, 36, 'lo', 2, 0.3));
		const body: Plan = { x: PHONE_STAND.x + 4, y: PHONE_STAND.y + 6, w: 26, d: 4, r: 1.6 };
		out.push(S(k.slabOf(body, 3, 50, P, 3, 0.5), { tone: 'mid' }));
		const screen: Plan = { x: body.x + 2.5, y: body.y + body.d, w: body.w - 5, d: 0.6, r: 0.4 };
		out.push(stepSvg('lit-at', 4, S(k.slabOf(screen, 8, 40, P, 2), { tone: 'hi', lit: true })));
		out.push(D([at([body.x + body.w / 2, body.y + body.d + 0.6, 50.5])], { size: 0.5, tone: 'mid' }));
		out.push(L(k.segment([body.x + 9, body.y + body.d + 0.6, 50.6], [body.x + 17, body.y + body.d + 0.6, 50.6], P), { tone: 'lo' }), D([at([body.x + 6, body.y + body.d + 0.6, 50.6])], { size: 0.45, tone: 'lo' }));
		out.push(box({ x: body.x + body.w, y: body.y + 0.8, w: 0.9, d: 2.2, r: 0.3 }, 36, 5, 'lo', 2), box({ x: body.x + body.w, y: body.y + 0.8, w: 0.9, d: 2.2, r: 0.3 }, 28, 5, 'lo', 2));
		for (const [x, y] of k.corners(PHONE_STAND, 3.5)) out.push(D([at([x, y, 3])], { size: 0.5 }));
		out.push(L(k.planOutline(k.insetPlan(PHONE_STAND, 2.5), 3, P), { tone: 'lo' }));
		out.push(box({ x: 162, y: 24, w: 9, d: 6, r: 1.2 }, 0, 4.4, 'lo', 3, 0.4), box({ x: 164, y: 30, w: 1, d: 2, r: 0.2 }, 0.8, 0.8, 'hi', 2), box({ x: 167, y: 30, w: 1, d: 2, r: 0.2 }, 0.8, 0.8, 'hi', 2));
		out.push(cable([[166.2, 52], [168, 40], [166.5, 30]], 0.2));
		return out.join('');
	}

	function rack() {
		const out = [halo({ x: -170, y: -82, w: 112, d: 10, r: 2 }, 0, 46, 5)];
		for (const x of [-170, -62]) out.push(box({ x, y: -82, w: 5, d: 9, r: 1 }, 0, 48, 'mid', 2, 0.5));
		out.push(box({ x: -166, y: -80, w: 108, d: 3, r: 0.8 }, 10, 34, 'mid', 2, 0.6));
		out.push(box({ x: -168, y: -81, w: 112, d: 6, r: 1 }, 44, 2.6, 'hi', 3, 0.5));
		out.push(box({ x: -166, y: -80, w: 100, d: 8, r: 1 }, 8, 2, 'hi', 3, 0.5));
		const holes: Flat[] = [];
		for (const z of [15, 21, 27, 33, 39]) for (let x = -160; x <= -66; x += 8) holes.push(at([x, -77, z]));
		out.push(D(holes, { size: 0.4, tone: 'lo' }));
		out.push(D([at([-163, -77, 41]), at([-61, -77, 41])], { size: 0.6, tone: 'hi' }));
		const f = -76.4;
		out.push(box({ x: -146, y: f, w: 2.6, d: 1.6, r: 0.5 }, 15, 24, 'hi', 2, 0.3), box({ x: -152, y: f - 0.4, w: 14, d: 2.4, r: 0.8 }, 37, 5, 'mid', 2, 0.4), box({ x: -155, y: f, w: 4, d: 1.6, r: 0.5 }, 35, 3, 'mid', 2));
		out.push(box({ x: -128, y: f, w: 3.5, d: 1.4, r: 0.5 }, 15, 22, 'hi', 2, 0.3), box({ x: -131.5, y: f, w: 10.5, d: 1.4, r: 0.6 }, 35, 8, 'mid', 2, 0.3), L(k.sideRing([-126.2, f + 1.5, 39], 2.2, 'y', P, 14), { tone: 'lo' }));
		out.push(box({ x: -110, y: f - 0.3, w: 4.4, d: 2.4, r: 0.8 }, 28, 10, 'hi', 2, 0.3), box({ x: -108.6, y: f + 0.2, w: 1.2, d: 1.2, r: 0.3 }, 14, 14, 'lo', 2), L(k.segment([-109, f + 2.7, 30], [-109, f + 2.7, 36], P) + k.segment([-107, f + 2.7, 30], [-107, f + 2.7, 36], P), { tone: 'lo' }));
		out.push(box({ x: -94, y: f - 0.4, w: 12, d: 3, r: 1 }, 24, 12, 'hi', 3, 0.4), L(k.sideRing([-88, f + 2.7, 30], 4.4, 'y', P, 20), { tone: 'mid' }), D([at([-88, f + 2.7, 30])], { size: 0.6 }), box({ x: -82, y: f, w: 5, d: 1.6, r: 0.5 }, 24, 2, 'mid', 2));
		out.push(box({ x: -76, y: f, w: 2.4, d: 1.4, r: 0.5 }, 16, 16, 'mid', 2, 0.2), box({ x: -72.6, y: f, w: 2.4, d: 1.4, r: 0.5 }, 16, 16, 'mid', 2, 0.2), D([at([-72.8, f + 1.4, 32])], { size: 0.5, tone: 'hi' }));
		out.push(D([at([-145, -77, 41]), at([-127, -77, 41]), at([-107, -77, 41]), at([-88, -77, 38]), at([-74, -77, 34])], { size: 0.7, tone: 'hi' }));
		for (const [x, r, h] of [[-150, 3.6, 6], [-136, 3, 5]] as const) out.push(post(x, -75, r, 10, h, 'hi', 0.3), post(x, -75, r + 0.2, 10 + h, 1.2, 'mid'), L(k.sideArc(x, -75, r, 10 + h / 2, P, 14), { tone: 'lo' }));
		out.push(post(-118, -75, 3.4, 10, 6, 'hi', 0.3), L(k.ring(-118, -75, 2.3, 16, P, 14), { tone: 'mid' }));
		for (const [dx, h] of [[-1.2, 5], [0.6, 7], [1.8, 4.5]] as const) out.push(post(-118 + dx, -75 + dx / 2, 0.5, 16, h, 'lo'));
		return out.join('');
	}

	function lamp() {
		const [x, y] = [-46, -68];
		const out = [halo({ x: x - 7, y: y - 7, w: 14, d: 14, r: 7 }, 0, 4, 3)];
		out.push(post(x, y, 5.6, 0, 2, 'lo', 0.4), post(x, y, 3.2, 2, 2, 'mid'), post(x, y, 1, 4, 24, 'mid'));
		out.push(L(k.ring(x, y, 4, 2, P, 18), { tone: 'mid' }));
		out.push(L(k.segment([x, y, 27], [x + 8, y + 5, 36], P) + k.segment([x + 8, y + 5, 36], [x + 18, y + 8, 32], P), { tone: 'hi', free: true }));
		out.push(post(x + 18, y + 8, 5, 24, 8, 'hi', 0.4), L(k.ring(x + 18, y + 8, 3, 24, P, 16), { tone: 'mid' }), D([at([x + 8, y + 5, 36]), at([x, y, 27])], { size: 0.6, tone: 'hi' }));
		out.push(box({ x: -22, y: -81, w: 24, d: 7, r: 1.2 }, 0, 3.4, 'lo', 3, 0.4), D([at([-17, -76.8, 3.4]), at([-10, -76.8, 3.4]), at([-3, -76.8, 3.4])], { size: 0.7, tone: 'mid' }));
		out.push(cable([[x, y + 4], [x + 4, y + 12], [-30, -58], [-14, -64], [-10, -75]], 0.2));
		return out.join('');
	}

	function vise() {
		const out = [halo({ x: -173, y: -34, w: 17, d: 26, r: 2 }, 0, 16, 4)];
		out.push(box({ x: -173, y: -34, w: 17, d: 26, r: 1.5 }, 0, 4, 'mid', 3, 0.6));
		out.push(box({ x: -170, y: -29, w: 11, d: 12, r: 1 }, 4, 6, 'lo', 2, 0.3), L(k.lineOnTop([-168, -23], [-161, -23], 10, P), { tone: 'faint' }));
		out.push(box({ x: -173, y: -34, w: 17, d: 5, r: 1 }, 4, 12, 'hi', 3, 0.5));
		out.push(box({ x: -173, y: -17, w: 17, d: 5, r: 1 }, 4, 12, 'hi', 3, 0.5));
		out.push(box({ x: -166.2, y: -12, w: 2.4, d: 22, r: 0.8 }, 8, 2.4, 'mid', 2, 0.3), post(-165, 10.5, 2.2, 8, 2.4, 'hi', 0.3));
		out.push(box({ x: -172, y: -9, w: 15, d: 2.6, r: 0.8 }, 4, 2, 'mid', 2));
		out.push(D([at([-170, -31.5, 15]), at([-159, -31.5, 15]), at([-170, -14.5, 15]), at([-159, -14.5, 15]), at([-165, 1, 10.4])], { size: 0.45 }));
		return out.join('');
	}

	function benchFront() {
		const out: string[] = [];
		out.push(post(-14, 58, 6.5, 0, 1.4, 'lo', 0.3), post(-14, 58, 3, 1.4, 6, 'mid'), post(-14, 58, 6.5, 7.4, 1.4, 'lo', 0.3));
		out.push(halo({ x: -22, y: 50, w: 16, d: 16, r: 8 }, 0, 9, 3));
		out.push(L(k.ring(-14, 58, 6.5, 8.8, P, 28), { tone: 'mid' }), L(k.ring(-14, 58, 4.2, 8.8, P, 20), { tone: 'faint' }), L(k.sideArc(-14, 58, 3, 5, P, 16), { tone: 'lo' }));
		const C: Plan = { x: 6, y: 44, w: 34, d: 18, r: 1.5 };
		out.push(halo(C, 0, 16));
		out.push(S(k.slabOf(C, 0, 16, P, 3, 0.7), { tone: 'mid', inner: L(k.sideSeam(C, 14.6, P, 3), { tone: 'faint' }) }));
		for (const z of [1.4, 5.9, 10.4]) {
			out.push(box({ x: 8, y: C.y + C.d, w: 30, d: 1.2, r: 0.5 }, z, 3.8, 'hi', 2, 0.3));
			out.push(D([at([23, C.y + C.d + 1.2, z + 2.4])], { size: 0.6, tone: 'mid' }));
			out.push(L(k.segment([14, C.y + C.d + 1.2, z + 2.4], [32, C.y + C.d + 1.2, z + 2.4], P), { tone: 'faint' }));
		}
		out.push(L(k.planOutline(k.insetPlan(C, 3), 16, P), { tone: 'faint' }));
		out.push(post(14, 53, 3.6, 16, 5, 'hi', 0.3), post(14, 53, 3.8, 21, 1.2, 'mid'), post(28, 52, 3, 16, 4, 'hi', 0.3), post(28, 52, 3.2, 20, 1, 'mid'));
		const B: Plan = { x: 46, y: 45, w: 16, d: 10, r: 1 };
		out.push(S(k.slabOf(B, 0, 4, P, 3, 0.4), { tone: 'mid', inner: L(k.sideSeam(B, 2.2, P, 3), { tone: 'faint' }) }), L(k.planOutline(k.insetPlan(B, 2), 4, P), { tone: 'lo' }));
		for (const [x, y] of [[51, 49], [55, 51], [58, 48], [50, 52]] as const) out.push(post(x, y, 0.9, 4, 1, 'hi'));
		out.push(D([at([54, 50, 5])], { size: 0.4 }));
		return out.join('');
	}

	function mugs() {
		const out = [halo({ x: 72, y: 43, w: 12, d: 10, r: 4 }, 0, 6, 3)];
		out.push(post(78, 48, 4, 0, 5.6, 'hi', 0.3), box({ x: 81.5, y: 47, w: 3.6, d: 2, r: 0.8 }, 1.4, 3.4, 'hi', 2), L(k.ring(78, 48, 2.9, 5.6, P, 18), { tone: 'mid' }), L(k.sideArc(78, 48, 4, 2.6, P, 18), { tone: 'lo' }));
		out.push(post(92, 50, 3.6, 0, 7, 'hi', 0.3), L(k.ring(92, 50, 2.6, 7, P, 16), { tone: 'mid' }), L(k.sideArc(92, 50, 3.6, 3.5, P, 16), { tone: 'lo' }));
		for (const [dx, dy, h, t] of [[-1.2, -0.6, 7, 'lo'], [0.4, 0.5, 9, 'hi'], [1.4, -0.8, 6, 'lo']] as const) out.push(post(92 + dx, 50 + dy, 0.55, 7, h, t));
		return out.join('');
	}

	function extras() {
		const out: string[] = [];
		const T: Plan = { x: -152, y: 52.5, w: 40, d: 12.5, r: 2 };
		out.push(halo(T, 0, 12), S(k.slabOf(T, 0, 12, P, 3, 0.7), { tone: 'mid', inner: L(k.sideSeam(T, 7, P, 3), { tone: 'faint' }) }));
		out.push(box({ x: T.x - 0.6, y: T.y - 0.6, w: T.w + 1.2, d: T.d + 1.2, r: 2 }, 7, 5.4, 'hi', 3, 0.6), L(k.planOutline(k.insetPlan(T, 3), 12.4, P), { tone: 'faint' }));
		for (const x of [-140, -124]) out.push(box({ x: x - 2, y: T.y + T.d, w: 4, d: 1.4, r: 0.5 }, 5.6, 3.4, 'lo', 2, 0.3), D([at([x, T.y + T.d + 1.4, 7.3])], { size: 0.45, tone: 'hi' }));
		for (const x of [-148, -118]) out.push(box({ x, y: T.y + 5, w: 2.4, d: 3, r: 0.6 }, 12.4, 3.6, 'mid', 2, 0.3));
		out.push(box({ x: -148, y: T.y + 5.6, w: 32, d: 1.8, r: 0.6 }, 16, 1.8, 'mid', 2, 0.3));
		out.push(L(k.segment([-148, T.y + T.d, 3], [-148, T.y + T.d, 11], P) + k.segment([-112, T.y + T.d, 3], [-112, T.y + T.d, 11], P), { tone: 'faint' }));
		const cp: Plan = { x: 106, y: 61, w: 16, d: 19, r: 1.2 };
		out.push(halo(cp, 0, 1.6, 2), box(cp, 0, 1.2, 'mid', 3, 0.4));
		out.push(box({ x: 108, y: 63, w: 12, d: 15, r: 0.6 }, 1.2, 0.5, 'hi', 2, 0.2), box({ x: 111, y: 61.4, w: 6, d: 3, r: 0.8 }, 1.7, 1.4, 'lo', 2, 0.3));
		for (const y of [67, 70, 73]) out.push(L(k.lineOnTop([109.5, y], [118.5, y], 1.7, P), { tone: 'faint' }));
		out.push(box({ x: 124, y: 70, w: 2.2, d: 14, r: 1 }, 0, 2.2, 'hi', 2, 0.3), L(k.lineOnTop([124.8, 72], [124.8, 82 - 2], 2.2, P), { tone: 'lo' }));
		const bs = 82;
		for (const x of [-100, -20, 60, 140]) out.push(L(k.segment([x, bs, -11], [x, bs, -1], P), { tone: 'faint' }));
		for (const x of [-140, -60, 20, 100]) out.push(box({ x: x - 7, y: bs, w: 14, d: 1.6, r: 0.6 }, -8.5, 2.2, 'hi', 2, 0.3), D([at([x - 5, bs + 1.6, -7.4]), at([x + 5, bs + 1.6, -7.4])], { size: 0.4 }));
		for (const y of [-35, 30]) out.push(box({ x: 175, y: y - 7, w: 1.6, d: 14, r: 0.6 }, -8.5, 2.2, 'hi', 2, 0.3));
		return out.join('');
	}

	const transforms = transformsFrom(P, Object.fromEntries(MOVERS.map((m) => [m.name, [1, 2, 3, 4].map((step) => poseAt(step)[m.name])])));
	const mover = (m: Mover, draw: (p: Point3) => string) => moverSvg(m.name, transforms[m.name][3], draw(m.from));

	const svg = k.figureSvg({
		width,
		height,
		label:
			'A workbench with a tray of ready-made parts: a key for signing in, a coin for payments, a star for loyalty rewards, a delivery van and an envelope for messages. The key, coin and van lift out of the tray and are fitted onto the counter of a small shop front, and then the shop window and a phone beside it light up: your app, open for customers.',
		body: [
			bench(),
			vise(),
			rack(),
			lamp(),
			trayBack(),
			stepSvg('dim-from', 3, star([-58, -26, TRAY_Z]) + envelope([-62, 22, TRAY_Z])),
			shopFront(),
			counter(),
			...MOVERS.map((m) => mover(m, m.name === 'key' ? key : m.name === 'coin' ? coin : van)),
			trayFront(),
			benchFront(),
			extras(),
			mugs(),
			phone(),
		],
	});
	return { svg, labels: STEP_LABELS, transforms };
}
