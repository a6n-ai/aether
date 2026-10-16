import * as k from '../../lib/anatomy/iso-kit';
import type { Plan, Plane, Point3, Projection } from '../../lib/anatomy/iso-kit';

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

export function buildWorkbench(width: number, height: number): { svg: string; steps: 4; projection: Projection } {
	const P = k.fitProjection(
		[...k.boxCorners(BENCH, -BENCH_H - FOOT_H, 0), [SILL.x, SILL.y, AWNING_Z + 8], [SILL.x + SILL.w, SILL.y + SILL.d, AWNING_Z + 8], [-122, -26, TRAY_Z + LIFT + 8]],
		width,
		height,
		{ pad: 22, azimuth: 40 },
	);
	const at = (p: Point3) => k.iso(p, P);
	const S = k.solidSvg;
	const L = k.lineSvg;
	const D = k.dotsSvg;
	const byDepth = (points: Plane[]) => [...points].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
	const group = (name: string, body: string, extra = '') => `<g class="wb-${name}"${extra}>${body}</g>`;

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
	const wall = (plan: Plan) => S(k.slabOf(plan, TRAY_FLOOR, WALL_TOP - TRAY_FLOOR, P, 3, 0.5), { tone: 'mid' });

	function trayBack() {
		const out = [`<path class="iso-halo" d="${k.haloOf(TRAY, 0, 2, P)}" style="filter:blur(5px)"/>`];
		out.push(S(k.slabOf(TRAY, 0, TRAY_FLOOR, P, 6, 0.6), { tone: 'mid' }));
		const midY = TRAY.y + TRAY.d / 2 - 1;
		out.push(L(k.lineOnTop([TRAY.x + WALL, midY], [TRAY.x + TRAY.w - WALL, midY], TRAY_FLOOR, P), { tone: 'faint' }));
		for (const x of [-105, -71]) out.push(L(k.lineOnTop([x, TRAY.y + WALL], [x, midY], TRAY_FLOOR, P), { tone: 'faint' }));
		out.push(L(k.lineOnTop([-90, midY], [-90, TRAY.y + TRAY.d - WALL], TRAY_FLOOR, P), { tone: 'faint' }));
		out.push(wall(walls.back), wall(walls.left), wall(walls.right));
		out.push(D([at([TRAY.x + 6, TRAY.y + 2, WALL_TOP]), at([TRAY.x + TRAY.w - 6, TRAY.y + 2, WALL_TOP])], { size: 0.45 }));
		return out.join('');
	}
	function trayFront() {
		const front = walls.front;
		const pull: Plan = { x: TRAY.x + TRAY.w / 2 - 12, y: front.y + WALL, w: 24, d: 3, r: 1.2 };
		return wall(front) + S(k.slabOf(pull, 4, 4, P, 3, 0.4), { tone: 'mid' }) + D([at([pull.x + 3, pull.y + 3, 6]), at([pull.x + pull.w - 3, pull.y + 3, 6])], { size: 0.4 });
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
		out.push(group('window', S(k.slabOf(pane, PANE_Z[0], PANE_Z[1] - PANE_Z[0], P, 2), { tone: 'hi', lit: true, className: 'wb-pane' })));
		const front = pane.y + pane.d;
		const mid = pane.x + pane.w / 2;
		out.push(L(k.segment([mid, front, PANE_Z[0]], [mid, front, PANE_Z[1]], P), { tone: 'mid' }));
		out.push(L(k.segment([pane.x, front, 50], [pane.x + pane.w, front, 50], P), { tone: 'mid' }));
		for (const x of [SILL.x + 2, SILL.x + SILL.w - 10]) {
			const post: Plan = { x, y: SILL.y + 4, w: 8, d: 8, r: 1 };
			out.push(S(k.slabOf(post, SILL_H, POST_TOP - SILL_H, P, 3, 0.4), { tone: 'mid' }));
		}
		const lintel: Plan = { x: SILL.x, y: SILL.y + 2, w: SILL.w, d: 12, r: 1 };
		out.push(S(k.slabOf(lintel, POST_TOP - 10, 10, P, 3, 0.5), { tone: 'mid' }));
		const awning: Plan = { x: SILL.x - 6, y: SILL.y - 2, w: SILL.w + 12, d: 30, r: 2 };
		out.push(S(k.slabOf(awning, AWNING_Z, 5, P, 4, 0.8), { tone: 'mid' }));
		for (let x = awning.x + 12; x < awning.x + awning.w - 6; x += 12) out.push(L(k.lineOnTop([x, awning.y + 1], [x, awning.y + awning.d - 1], AWNING_Z + 5, P), { tone: 'faint' }));
		return out.join('');
	}

	function counter() {
		const out = [`<path class="iso-halo" d="${k.haloOf(COUNTER, 0, COUNTER_H, P)}"/>`];
		out.push(S(k.slabOf(COUNTER, 0, COUNTER_H, P, 3, 0.8), { tone: 'mid', inner: L(k.sideSeam(COUNTER, COUNTER_H - 4, P), { tone: 'faint' }) }));
		for (const m of MOVERS) out.push(L(k.ring(m.to[0], m.to[1], 11, COUNTER_H, P, 32), { tone: 'faint' }));
		return out.join('');
	}

	function phone() {
		const out = [`<path class="iso-halo" d="${k.haloOf(PHONE_STAND, 0, 3, P)}"/>`];
		out.push(S(k.slabOf(PHONE_STAND, 0, 3, P, 3, 0.5), { tone: 'mid' }));
		const body: Plan = { x: PHONE_STAND.x + 4, y: PHONE_STAND.y + 6, w: 26, d: 4, r: 1.6 };
		out.push(S(k.slabOf(body, 3, 50, P, 3, 0.5), { tone: 'mid' }));
		const screen: Plan = { x: body.x + 2.5, y: body.y + body.d, w: body.w - 5, d: 0.6, r: 0.4 };
		out.push(group('screen', S(k.slabOf(screen, 8, 40, P, 2), { tone: 'hi', lit: true, className: 'wb-pane' })));
		out.push(D([at([body.x + body.w / 2, body.y + body.d + 0.6, 50.5])], { size: 0.5, tone: 'mid' }));
		return out.join('');
	}

	const final = poseAt(4);
	const mover = (m: Mover, draw: (p: Point3) => string) =>
		`<g class="wb-mover" data-part="${m.name}" data-step="2" transform="${k.translateAlong(P, final[m.name])}">${draw(m.from)}</g>`;

	const svg = k.figureSvg({
		width,
		height,
		label:
			'A workbench with a tray of ready-made parts: a key for signing in, a coin for payments, a star for loyalty rewards, a delivery van and an envelope for messages. The key, coin and van lift out of the tray and are fitted onto the counter of a small shop front, and then the shop window and a phone beside it light up: your app, open for customers.',
		body: [
			bench(),
			trayBack(),
			group('spare', star([-58, -26, TRAY_Z]) + envelope([-62, 22, TRAY_Z]), ' data-step="1"'),
			shopFront(),
			counter(),
			...MOVERS.map((m) => mover(m, m.name === 'key' ? key : m.name === 'coin' ? coin : van)),
			trayFront(),
			phone(),
		],
	});
	return { svg, steps: 4, projection: P };
}
