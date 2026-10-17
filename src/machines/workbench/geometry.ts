import * as k from '../../lib/anatomy/iso-kit';
import type { Plan, Plane, Point3 } from '../../lib/anatomy/iso-kit';
import { moverSvg, stepSvg, transformsFrom, type Machine } from '../../lib/plate';

export const STEP_LABELS = ['parts that already work', 'pick what you need', 'fitted to your business', 'your app, open for customers'] as const;

// A letterpress bench: type already cast (parts already running for others) is picked from the case,
// locked into your chase on the stone, and pulled as one printed proof: your app.
const BASE: Plan = { x: -178, y: -90, w: 356, d: 176, r: 9 };
const BASE_H = 10;
const FOOT_H = 5;

const CASE: Plan = { x: -164, y: -76, w: 126, d: 102, r: 3 };
const CASE_FLOOR = 2;
const CASE_WALL = 3;
const CASE_TOP = 13;
const COLS = 4;
const ROWS = 4;

const STONE: Plan = { x: -18, y: -60, w: 124, d: 100, r: 2 };
const STONE_H = 16;
const CHASE: Plan = { x: -4, y: -48, w: 96, d: 74, r: 1.5 };
const BAR = 4;
const BAR_H = 6;

const BLOCK_W = 20;
const BLOCK_D = 22;
const TYPE_H = 12;
const HOVER = 24;

const STACK: Plan = { x: 122, y: -30, w: 40, d: 30, r: 0.6 };
const STACK_H = 7;
const BOARD: Plan = { x: 118, y: 30, w: 48, d: 40, r: 1.6 };
const BOARD_H = 2;
const SHEET = { w: 38, d: 28 };
const INK: [number, number] = [134, -66];

type Icon = 'site' | 'key' | 'coin' | 'parcel' | 'letter';
interface Sort {
	name: Icon;
	slot: Plane;
	cell: [number, number];
	drift: Plane;
}
// Five ready parts: your website, sign-in, payments, orders and messages. Each waits in its own compartment.
const SORTS: Sort[] = [
	{ name: 'site', slot: [CHASE.x + 10, CHASE.y + 10], cell: [0, 1], drift: [-6, -4] },
	{ name: 'key', slot: [CHASE.x + 38, CHASE.y + 10], cell: [2, 0], drift: [3, -7] },
	{ name: 'coin', slot: [CHASE.x + 66, CHASE.y + 10], cell: [1, 2], drift: [8, -2] },
	{ name: 'parcel', slot: [CHASE.x + 24, CHASE.y + 40], cell: [3, 1], drift: [-5, 6] },
	{ name: 'letter', slot: [CHASE.x + 52, CHASE.y + 40], cell: [2, 3], drift: [6, 5] },
];

const cellSize = () => [(CASE.w - CASE_WALL * 2) / COLS, (CASE.d - CASE_WALL * 2) / ROWS] as const;
const cellOrigin = ([c, r]: [number, number]): Plane => {
	const [cw, cd] = cellSize();
	return [CASE.x + CASE_WALL + c * cw, CASE.y + CASE_WALL + r * cd];
};

export function workbench(width = 720, height = 480): Machine {
	const P = k.fitProjection(
		[...k.boxCorners(BASE, -BASE_H - FOOT_H, 0), [INK[0], INK[1], 44], [CHASE.x, CHASE.y, STONE_H + TYPE_H + HOVER + 4], [CHASE.x + CHASE.w, CHASE.y, STONE_H + TYPE_H + HOVER + 4], [2, -84, 56], [108, -84, 56]],
		width,
		height,
		{ pad: 18, azimuth: 38 },
	);
	const at = (p: Point3) => k.iso(p, P);
	const S = k.solidSvg;
	const L = k.lineSvg;
	const D = k.dotsSvg;
	type Tone = 'hi' | 'mid' | 'lo';
	const dots = (pts: Point3[], size = 0.45, tone: Tone | 'faint' = 'mid') => D(pts.map(at), { size, tone });
	const halo = (plan: Plan, z: number, h: number) => `<path class="iso-halo" d="${k.haloOf(plan, z, h, P)}"/>`;
	const box = (plan: Plan, z: number, h: number, tone: Tone = 'mid', o: { steps?: number; bevel?: number; seam?: number; lit?: boolean; thin?: boolean } = {}) =>
		S(k.slabOf(plan, z, h, P, o.steps ?? 3, o.bevel ?? 0.4), { tone, lit: o.lit, crease: o.thin ? 'none' : 'faint', inner: o.seam === undefined ? '' : L(k.sideSeam(plan, o.seam, P, o.steps ?? 3), { tone: 'faint' }) });
	const cyl = (cx: number, cy: number, r: number, z: number, h: number, tone: Tone = 'mid', bevel = 0.3, lit = false) => S(k.cylinder(cx, cy, r, z, h, P, r > 6 ? 32 : 18, bevel), { tone, lit });
	const top = (a: Plane, b: Plane, z: number, tone: Tone | 'faint' = 'faint') => L(k.lineOnTop(a, b, z, P), { tone, free: true });
	const seg = (a: Point3, b: Point3, tone: Tone | 'faint' = 'mid') => L(k.segment(a, b, P), { tone, free: true });
	const byDepth = <T extends { at: Plane }>(list: T[]) => [...list].sort((a, b) => k.depthOf([a.at[0], a.at[1], 0], P) - k.depthOf([b.at[0], b.at[1], 0], P));

	function base() {
		const out = [halo(BASE, -BASE_H - FOOT_H, BASE_H)];
		for (const [x, y] of byDepth(k.corners(BASE, 24).map((c) => ({ at: c }))).map((c) => c.at)) out.push(cyl(x, y, 8.5, -BASE_H - FOOT_H, 1.8, 'lo', 0.4), cyl(x, y, 6.2, -BASE_H - FOOT_H + 1.8, FOOT_H - 1.8, 'mid'));
		out.push(S(k.slabOf(BASE, -BASE_H, BASE_H, P, 10, 1.6), { tone: 'mid', inner: L(k.sideSeam(BASE, -BASE_H / 2, P, 10), { tone: 'faint' }) }));
		out.push(L(k.planOutline(k.insetPlan(BASE, 5), 0, P, 10), { tone: 'lo' }), L(k.planOutline(k.insetPlan(BASE, 8), 0, P, 10), { tone: 'faint' }));
		const screws = k.corners(BASE, 11);
		out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.4, 0, P, 16)).join(''), { tone: 'lo' }), dots(screws.map(([x, y]) => [x, y, 0] as Point3), 0.55));
		for (const [x, y] of screws) out.push(top([x - 1.4, y], [x + 1.4, y], 0));
		// A pica rule along the front edge and a line gauge along the right: the printer's measures.
		const rule: Plan = { x: -150, y: BASE.y + BASE.d - 16, w: 226, d: 6, r: 1 };
		out.push(box(rule, 0, 0.6, 'lo', { thin: true }));
		const rt = k.topTicks(rule.x + 4, rule.x + rule.w - 4, 4, 6, rule.y + 0.8, 0.6, [1.8, 3.6], P);
		out.push(L(rt.minor, { tone: 'lo' }), L(rt.major, { tone: 'mid' }), dots([[rule.x + 2, rule.y + 3, 0.6], [rule.x + rule.w - 2, rule.y + 3, 0.6]]));
		const gauge: Plan = { x: BASE.x + BASE.w - 15, y: -70, w: 6, d: 90, r: 1 };
		out.push(box(gauge, 0, 0.6, 'lo', { thin: true }));
		const gt = k.topTicks(gauge.y + 4, gauge.y + gauge.d - 4, 4, 6, gauge.x + 0.8, 0.6, [1.8, 3.6], P, 'y');
		out.push(L(gt.minor, { tone: 'lo' }), L(gt.major, { tone: 'mid' }));
		const plate: Plan = { x: 90, y: BASE.y + BASE.d - 16, w: 52, d: 10, r: 1.5 };
		out.push(box(plate, 0, 0.8, 'lo'));
		out.push(k.faceTextSvg(k.topMatrix([plate.x + 5, plate.y + 7], 0.8, P, 'x'), 'a6n press', { size: 4.4, tone: 'mid' }));
		out.push(dots(k.corners(plate, 2).map(([x, y]) => [x, y, 0.8] as Point3), 0.4));
		return out.join('');
	}

	// The type case: sixteen compartments of ready-cast type, a few already taken by the parts you'll pick.
	function typeCase() {
		const out = [halo(CASE, 0, CASE_TOP)];
		out.push(box(CASE, 0, CASE_FLOOR, 'lo', { steps: 4 }));
		const [cw, cd] = cellSize();
		const taken = new Set(SORTS.map((s) => s.cell.join()));
		const inner = k.insetPlan(CASE, CASE_WALL);
		// Back and left walls first, then each row back to front: its cells' type, then the divider in front of it.
		out.push(box({ x: CASE.x, y: CASE.y, w: CASE.w, d: CASE_WALL, r: 1 }, CASE_FLOOR, CASE_TOP - CASE_FLOOR, 'mid', { seam: 8 }));
		out.push(box({ x: CASE.x, y: CASE.y, w: CASE_WALL, d: CASE.d, r: 1 }, CASE_FLOOR, CASE_TOP - CASE_FLOOR, 'mid'));
		for (let r = 0; r < ROWS; r++) {
			const items: { at: Plane; svg: string }[] = [];
			for (let c = 0; c < COLS; c++) {
				const [ox, oy] = cellOrigin([c, r]);
				if (c > 0) items.push({ at: [ox, oy + cd / 2], svg: box({ x: ox - 0.6, y: oy, w: 1.2, d: cd, r: 0.2 }, CASE_FLOOR, 8, 'lo', { thin: true, steps: 2, bevel: 0 }) });
				items.push({ at: [ox + cw / 2, oy + cd - 3], svg: box({ x: ox + cw / 2 - 5, y: oy + cd - 2.6, w: 10, d: 0.6, r: 0.2 }, CASE_FLOOR + 6, 1.6, 'hi', { thin: true, steps: 2, bevel: 0 }) });
				if (taken.has(`${c},${r}`)) {
					items.push({ at: [ox + cw / 2, oy + cd / 2], svg: top([ox + 3, oy + 3], [ox + cw - 3, oy + cd - 3], CASE_FLOOR) + top([ox + cw - 3, oy + 3], [ox + 3, oy + cd - 3], CASE_FLOOR) });
					continue;
				}
				const n = ((c * 7 + r * 5) % 6) + 4;
				for (let i = 0; i < n; i++) {
					const gx = ox + 3.4 + (i % 4) * 6.2;
					const gy = oy + 3.4 + Math.floor(i / 4) * 6.6;
					const h = 7 + ((i + c + r) % 3);
					items.push({ at: [gx + 2.4, gy + 2.4], svg: box({ x: gx, y: gy, w: 4.8, d: 4.8, r: 0.3 }, CASE_FLOOR, h, i % 3 ? 'mid' : 'hi', { steps: 2, bevel: 0.25 }) + top([gx + 1.2, gy + 2.4], [gx + 3.6, gy + 2.4], CASE_FLOOR + h, 'lo') });
				}
			}
			out.push(...byDepth(items).map((i) => i.svg));
			if (r < ROWS - 1) {
				const y = inner.y + (r + 1) * cd;
				out.push(box({ x: inner.x, y: y - 0.6, w: inner.w, d: 1.2, r: 0.2 }, CASE_FLOOR, 8, 'lo', { thin: true, steps: 2, bevel: 0 }));
			}
		}
		return out.join('');
	}

	function caseFront() {
		const out: string[] = [];
		out.push(box({ x: CASE.x + CASE.w - CASE_WALL, y: CASE.y, w: CASE_WALL, d: CASE.d, r: 1 }, CASE_FLOOR, CASE_TOP - CASE_FLOOR, 'mid'));
		const front: Plan = { x: CASE.x, y: CASE.y + CASE.d - CASE_WALL, w: CASE.w, d: CASE_WALL, r: 1 };
		out.push(box(front, CASE_FLOOR, CASE_TOP - CASE_FLOOR, 'mid', { seam: 8 }));
		// Brass label holders and a pull on the case front.
		for (let c = 0; c < COLS; c++) {
			const x = cellOrigin([c, 0])[0] + cellSize()[0] / 2;
			out.push(box({ x: x - 6, y: front.y + CASE_WALL, w: 12, d: 0.6, r: 0.2 }, CASE_FLOOR + 3, 5, 'hi', { thin: true, steps: 2, bevel: 0 }));
			out.push(seg([x - 4, front.y + CASE_WALL + 0.6, CASE_FLOOR + 5.5], [x + 3, front.y + CASE_WALL + 0.6, CASE_FLOOR + 5.5], 'faint'));
			out.push(dots([[x - 5.2, front.y + CASE_WALL + 0.6, CASE_FLOOR + 7.4], [x + 5.2, front.y + CASE_WALL + 0.6, CASE_FLOOR + 7.4]], 0.3, 'lo'));
		}
		return out.join('');
	}

	// A composing stick on the bench: its knee slides to set the measure, the way a job is set to one business.
	function stick() {
		const x = -150;
		const y = 44;
		const w = 96;
		const out = [halo({ x, y, w, d: 12, r: 1 }, 0, 9)];
		out.push(box({ x, y, w, d: 12, r: 0.8 }, 0, 1.6, 'mid', { steps: 2 }));
		out.push(box({ x, y, w, d: 2, r: 0.4 }, 1.6, 8, 'mid', { steps: 2, seam: 5 }));
		out.push(box({ x, y: y + 2, w: 3, d: 10, r: 0.4 }, 1.6, 8, 'lo', { steps: 2 }));
		const sorts: { at: Plane; svg: string }[] = [];
		for (let i = 0; i < 9; i++) {
			const sx = x + 4 + i * 5.4;
			sorts.push({ at: [sx + 2.4, y + 6], svg: box({ x: sx, y: y + 2.4, w: 4.8, d: 7, r: 0.3 }, 1.6, 7, i % 3 ? 'mid' : 'hi', { steps: 2, bevel: 0.2 }) + top([sx + 1.2, y + 5.9], [sx + 3.6, y + 5.9], 8.6, 'lo') });
		}
		out.push(...byDepth(sorts).map((p) => p.svg));
		const kx = x + 56;
		out.push(box({ x: kx, y: y + 2, w: 5, d: 10, r: 0.6 }, 1.6, 9, 'lo', { steps: 2, seam: 5 }));
		out.push(cyl(kx + 2.5, y + 15, 3.4, 0, 3.2, 'hi', 0.4), L(k.knurl(kx + 2.5, y + 15, 3.4, 0, 3.2, 16, P, 0.3), { tone: 'lo' }), box({ x: kx + 1.5, y: y + 12, w: 2, d: 2, r: 0.4 }, 1, 1.2, 'mid', { steps: 2 }));
		const st = k.topTicks(kx + 8, x + w - 3, 3, 5, y + 0.4, 9.6, [0.9, 1.8], P);
		out.push(L(st.minor, { tone: 'lo' }), L(st.major, { tone: 'mid' }));
		// A few loose sorts and a type-high gauge beside it.
		for (const [lx, ly, h] of [[-44, 48, 7], [-37, 54, 8], [-45, 58, 7]] as const) out.push(box({ x: lx, y: ly, w: 4.8, d: 4.8, r: 0.3 }, 0, h, 'hi', { steps: 2, bevel: 0.2 }));
		out.push(box({ x: -26, y: 50, w: 22, d: 8, r: 0.6 }, 0, 3, 'mid', { steps: 2, seam: 1.5 }), box({ x: -12, y: 50, w: 3, d: 8, r: 0.4 }, 3, 6, 'lo', { steps: 2 }));
		return out.join('');
	}

	function inkDisc() {
		const [cx, cy] = INK;
		const out = [halo({ x: cx - 20, y: cy - 20, w: 40, d: 40, r: 20 }, 0, 30)];
		out.push(cyl(cx, cy, 10, 0, 2.4, 'lo', 0.5), L(k.ring(cx, cy, 8, 2.4, P, 24), { tone: 'faint' }));
		out.push(cyl(cx, cy, 3, 2.4, 24, 'mid', 0.2), L(k.ring(cx, cy, 3, 12, P, 16), { tone: 'faint' }));
		out.push(cyl(cx, cy, 5, 26.4, 2, 'lo', 0.3));
		out.push(cyl(cx, cy, 19, 28.4, 3, 'hi', 0.8), L(k.ring(cx, cy, 16.5, 31.4, P, 40), { tone: 'lo' }), L(k.ring(cx, cy, 11, 31.4, P, 36), { tone: 'mid' }), L(k.ring(cx, cy, 6, 31.4, P, 28), { tone: 'lo' }));
		out.push(dots([[cx, cy, 31.4]], 0.9, 'hi'));
		// The ink knife resting across the rim.
		out.push(box({ x: cx - 4, y: cy + 10, w: 20, d: 3, r: 1 }, 31.4, 0.6, 'mid', { thin: true, steps: 2 }), box({ x: cx + 16, y: cy + 10.4, w: 10, d: 2.2, r: 1 }, 30, 2.4, 'lo', { steps: 2 }));
		return out.join('');
	}

	function stone() {
		const out = [halo(STONE, 0, STONE_H)];
		out.push(box({ x: STONE.x + 4, y: STONE.y + 4, w: STONE.w - 8, d: STONE.d - 8, r: 1 }, 0, 4, 'lo', { steps: 2 }));
		out.push(box(STONE, 4, STONE_H - 4, 'mid', { seam: 10, bevel: 0.8 }));
		out.push(L(k.planOutline(k.insetPlan(STONE, 3), STONE_H, P), { tone: 'faint' }));
		out.push(dots(k.corners(STONE, 4).map(([x, y]) => [x, y, STONE_H] as Point3), 0.45));
		// Chase back and left bars, behind the type.
		out.push(box({ x: CHASE.x, y: CHASE.y, w: CHASE.w, d: BAR, r: 0.6 }, STONE_H, BAR_H, 'lo', { steps: 2, seam: STONE_H + 3 }));
		out.push(box({ x: CHASE.x, y: CHASE.y, w: BAR, d: CHASE.d, r: 0.6 }, STONE_H, BAR_H, 'lo', { steps: 2 }));
		return out.join('');
	}

	// The furniture rack: an upright cabinet of wooden spacers and quoins beside the stone. Each piece is a mover that
	// rests here at step 1, is lifted clear and carried over its gap at step 2, and is lowered into the chase at step 3.
	const RACK: Plan = { x: 2, y: -84, w: 106, d: 22, r: 1 };
	const SHELF = [22, 44];
	const RACK_TOP = 52;
	const FZ = STONE_H;
	const HOVER_F = 9;
	interface Piece {
		name: string;
		plan: Plan;
		h: number;
		quoin?: boolean;
		rack: Point3;
		front?: boolean;
	}
	const CX = CHASE.x;
	const CY = CHASE.y;
	const MID = CY + 33;
	const mk = (name: string, x: number, y: number, w: number, d: number, h: number, rack: Point3, o: { quoin?: boolean; front?: boolean } = {}): Piece => ({ name, plan: { x, y, w, d, r: 0.4 }, h, rack, ...o });
	const PIECES: Piece[] = [
		mk('spacerB0', CX + 4, CY + 4, 43.5, 4, 5, [8, -70, SHELF[1]]),
		mk('spacerB1', CX + 48.5, CY + 4, 43.5, 4, 5, [53, -70, SHELF[1]]),
		mk('spacerL0', CX + 4, CY + 8, 4, 20, 5, [12, -82, SHELF[0]]),
		mk('spacerL1', CX + 4, CY + 29, 4, 20, 5, [19, -82, SHELF[0]]),
		mk('spacerL2', CX + 4, CY + 50, 4, 20, 5, [26, -82, SHELF[0]]),
		mk('spacerM0', CX + 8, MID, 40, 3, 5, [8, -78, SHELF[1]], { front: true }),
		mk('spacerM1', CX + 49, MID, 40, 3, 5, [53, -78, SHELF[1]], { front: true }),
		mk('spacerV0', CX + 10, MID + 5, 8, 20, 5, [36, -82, SHELF[0]], { front: true }),
		mk('spacerV1', CX + 78, MID + 5, 8, 20, 5, [48, -82, SHELF[0]], { front: true }),
		mk('quoinF0', CX + 18, CY + CHASE.d - BAR - 5, 20, 5, 6, [62, -81, SHELF[0]], { quoin: true, front: true }),
		mk('quoinF1', CX + 58, CY + CHASE.d - BAR - 5, 20, 5, 6, [62, -74, SHELF[0]], { quoin: true, front: true }),
		mk('quoinR', CX + CHASE.w - BAR - 5, CY + 12, 5, 20, 6, [88, -82, SHELF[0]], { quoin: true, front: true }),
	];
	// The quoin key: a bar and a knurled knob. It hangs on the upper shelf and is carried to the stone to turn the quoins.
	const KEY = { x: 98, y: -30, w: 2.4, d: 16, knobY: -11 };
	const KEY_RACK: Point3 = [KEY.x, -82, SHELF[1]];

	function rack() {
		const out = [halo(RACK, 0, RACK_TOP)];
		const R = RACK;
		out.push(box({ x: R.x, y: R.y, w: R.w, d: R.d, r: 1 }, 0, 4, 'lo', { steps: 3, seam: 2 }));
		out.push(box({ x: R.x + 4, y: R.y, w: R.w - 8, d: 2.4, r: 0.4 }, 4, RACK_TOP - 8, 'lo', { steps: 2, seam: 30 }));
		for (const z of [14, 33, 47]) out.push(top([R.x + 6, R.y + 2.4], [R.x + R.w - 6, R.y + 2.4], z, 'faint'));
		const cheek = (x: number) => box({ x, y: R.y, w: 4, d: R.d, r: 0.6 }, 4, RACK_TOP - 4, 'mid', { steps: 3, seam: 28 }) + cyl(x + 2, R.y + 11, 1.6, RACK_TOP, 1.4, 'hi', 0.3);
		const shelf = (z: number) => box({ x: R.x + 4, y: R.y + 2.4, w: R.w - 8, d: R.d - 2.4, r: 0.4 }, z - 2, 2, 'mid', { steps: 3, seam: z - 1 }) + top([R.x + 6, R.y + R.d - 1], [R.x + R.w - 6, R.y + R.d - 1], z, 'lo');
		out.push(cheek(R.x), shelf(SHELF[0]), shelf(SHELF[1]), cheek(R.x + R.w - 4));
		for (const z of SHELF) out.push(box({ x: R.x + 12, y: R.y + R.d, w: 40, d: 0.6, r: 0.2 }, z - 2, 2, 'hi', { thin: true, steps: 2, bevel: 0 }));
		return out.join('');
	}

	function pieceBody(pc: Piece) {
		const { plan, h } = pc;
		const out = [box(plan, FZ, h, pc.quoin ? 'mid' : 'lo', { steps: 2, bevel: 0.3, seam: FZ + h / 2 })];
		const long = plan.w >= plan.d;
		if (pc.quoin) {
			const a: Point3 = long ? [plan.x + 2, plan.y + plan.d, FZ + 2.5] : [plan.x + plan.w, plan.y + 2, FZ + 2.5];
			const b: Point3 = long ? [plan.x + plan.w - 2, plan.y + plan.d, FZ + h - 1] : [plan.x + plan.w, plan.y + plan.d - 2, FZ + h - 1];
			out.push(seg(a, b, 'lo'), cyl(plan.x + plan.w / 2, plan.y + plan.d / 2, 1.1, FZ + h, 0.6, 'lo', 0.1));
		} else if (long) out.push(top([plan.x + 2, plan.y + plan.d / 2], [plan.x + plan.w - 2, plan.y + plan.d / 2], FZ + h, 'lo'));
		else out.push(top([plan.x + plan.w / 2, plan.y + 2], [plan.x + plan.w / 2, plan.y + plan.d - 2], FZ + h, 'lo'));
		return out.join('');
	}

	const pieceMover = (pc: Piece) => {
		const body = pieceBody(pc);
		return pc.quoin ? moverSvg(pc.name, transforms[pc.name][3], body) : `<g class="mover plain" data-part="${pc.name}" transform="${transforms[pc.name][3]}">${body}</g>`;
	};
	const piecesOf = (front: boolean) => PIECES.filter((pc) => !!pc.front === front).map(pieceMover).join('');

	function chaseFront() {
		const z = STONE_H;
		const out: string[] = [];
		out.push(box({ x: CHASE.x + CHASE.w - BAR, y: CHASE.y, w: BAR, d: CHASE.d, r: 0.6 }, z, BAR_H, 'lo', { steps: 2 }));
		out.push(box({ x: CHASE.x, y: CHASE.y + CHASE.d - BAR, w: CHASE.w, d: BAR, r: 0.6 }, z, BAR_H, 'lo', { steps: 2, seam: z + 3 }));
		out.push(dots(k.corners(CHASE, BAR / 2).map(([x, y]) => [x, y, z + BAR_H] as Point3), 0.5, 'hi'));
		return out.join('');
	}

	function quoinKey() {
		const z = STONE_H;
		const kx = KEY.x + KEY.w / 2;
		return box({ x: KEY.x, y: KEY.y, w: KEY.w, d: KEY.d, r: 1 }, z, 1.6, 'mid', { steps: 2 }) + cyl(kx, KEY.knobY, 3.4, z, 3, 'hi', 0.4) + L(k.knurl(kx, KEY.knobY, 3.4, z, z + 3, 16, P, 0.3), { tone: 'lo' });
	}

	function relief(s: Sort, x: number, y: number, z: number) {
		const cx = x + BLOCK_W / 2;
		const cy = y + BLOCK_D / 2;
		const out: string[] = [];
		const raised = (plan: Plan) => box(plan, z, 1.2, 'hi', { thin: true, steps: 2, bevel: 0.15 });
		if (s.name === 'site') {
			out.push(raised({ x: x + 3, y: y + 3, w: 14, d: 3, r: 0.4 }));
			out.push(L(k.planOutline({ x: x + 3, y: y + 8, w: 14, d: 11, r: 0.6 }, z, P), { tone: 'mid' }));
			for (const dy of [11, 14, 17]) out.push(top([x + 5, y + dy], [x + (dy === 17 ? 10 : 15), y + dy], z, 'lo'));
		} else if (s.name === 'key') {
			out.push(cyl(cx - 3, cy, 4, z, 1.2, 'hi', 0.2), L(k.ring(cx - 3, cy, 1.6, z + 1.2, P, 14), { tone: 'lo' }));
			out.push(raised({ x: cx, y: cy - 1, w: 7, d: 2, r: 0.3 }), raised({ x: cx + 4.6, y: cy + 1, w: 1.4, d: 2.4, r: 0.2 }));
		} else if (s.name === 'coin') {
			out.push(cyl(cx, cy, 6.4, z, 1.2, 'hi', 0.3), L(k.ring(cx, cy, 5, z + 1.2, P, 28), { tone: 'lo' }), L(k.ring(cx, cy, 2, z + 1.2, P, 14), { tone: 'mid' }));
		} else if (s.name === 'parcel') {
			out.push(raised({ x: cx - 6, y: cy - 6, w: 12, d: 12, r: 0.5 }));
			out.push(top([cx, cy - 6], [cx, cy + 6], z + 1.2, 'lo'), top([cx - 6, cy], [cx + 6, cy], z + 1.2, 'lo'));
		} else {
			out.push(raised({ x: cx - 7, y: cy - 5, w: 14, d: 10, r: 0.5 }));
			out.push(L(k.onTop([[cx - 7, cy - 5], [cx, cy + 1], [cx + 7, cy - 5]], z + 1.2, P), { tone: 'lo', free: true }));
		}
		return out.join('');
	}

	// Each picked part is a type block drawn locked in the chase, its final place.
	function block(s: Sort) {
		const [x, y] = s.slot;
		const z = STONE_H;
		const plan: Plan = { x, y, w: BLOCK_W, d: BLOCK_D, r: 0.6 };
		const out = [halo(plan, z, TYPE_H)];
		out.push(box(plan, z, TYPE_H - 2, 'mid', { steps: 2, bevel: 0.3, seam: z + 3 }));
		out.push(box(k.insetPlan(plan, 1.2), z + TYPE_H - 2, 2, 'mid', { steps: 2, bevel: 0.3 }));
		out.push(seg([x + 3, y + BLOCK_D, z + 5], [x + BLOCK_W - 3, y + BLOCK_D, z + 5], 'lo'));
		out.push(relief(s, x, y, z + TYPE_H));
		return out.join('');
	}

	function paper() {
		const out = [halo(STACK, 0, STACK_H)];
		for (let i = 0; i < 6; i++) out.push(box({ x: STACK.x + (i % 2) * 0.6, y: STACK.y + (i % 3) * 0.4, w: STACK.w, d: STACK.d, r: 0.4 }, i * 1.1, 1.1, i === 5 ? 'hi' : 'mid', { thin: true, steps: 2, bevel: 0 }));
		out.push(box({ x: STACK.x - 3, y: STACK.y + 6, w: 3, d: 18, r: 0.5 }, 0, 9, 'lo', { steps: 2 }), box({ x: STACK.x + 6, y: STACK.y - 3, w: 28, d: 3, r: 0.5 }, 0, 9, 'lo', { steps: 2 }));
		return out.join('');
	}

	function board() {
		const out = [halo(BOARD, 0, BOARD_H)];
		out.push(box(BOARD, 0, BOARD_H, 'lo', { steps: 3, seam: 1 }));
		for (const [x, y] of [[BOARD.x + 3, BOARD.y + 3], [BOARD.x + BOARD.w - 3, BOARD.y + 3]] as Plane[]) out.push(box({ x: x - 1.5, y: y - 1.5, w: 3, d: 3, r: 0.4 }, BOARD_H, 1.6, 'hi', { steps: 2 }));
		out.push(L(k.planOutline(k.insetPlan(BOARD, 2.4), BOARD_H, P), { tone: 'faint' }));
		return out.join('');
	}

	// The pulled proof, drawn on the delivery board: one page printed from all the parts at once.
	function sheet() {
		const x = BOARD.x + (BOARD.w - SHEET.w) / 2;
		const y = BOARD.y + (BOARD.d - SHEET.d) / 2;
		const z = BOARD_H;
		const out = [box({ x, y, w: SHEET.w, d: SHEET.d, r: 0.4 }, z, 0.5, 'hi', { thin: true, steps: 2, bevel: 0 })];
		const zt = z + 0.5;
		const ink = [
			box({ x: x + 3, y: y + 3, w: SHEET.w - 6, d: 4, r: 0.3 }, zt, 0.25, 'hi', { thin: true, steps: 2, bevel: 0, lit: true }),
			box({ x: x + 3, y: y + 10, w: 14, d: 10, r: 0.4 }, zt, 0.25, 'hi', { thin: true, steps: 2, bevel: 0, lit: true }),
			L(k.ring(x + 26, y + 15, 4, zt, P, 20), { tone: 'hi' }),
			box({ x: x + 22, y: y + 22, w: 12, d: 3, r: 1.2 }, zt, 0.25, 'hi', { thin: true, steps: 2, bevel: 0, lit: true }),
			top([x + 3, y + 23], [x + 16, y + 23], zt, 'mid'),
		];
		out.push(stepSvg('show-from', 4, ink.join('')));
		return out.join('');
	}

	const sheetOrigin: Point3 = [BOARD.x + (BOARD.w - SHEET.w) / 2, BOARD.y + (BOARD.d - SHEET.d) / 2, BOARD_H];
	const onStack: Point3 = [STACK.x + 1, STACK.y + 1, STACK_H - 0.4];
	const lift = (o: Point3, dz: number): Point3 => [o[0], o[1], o[2] + dz];
	const toStack: Point3 = [onStack[0] - sheetOrigin[0], onStack[1] - sheetOrigin[1], onStack[2] - sheetOrigin[2]];
	const offsets: Record<string, Point3[]> = Object.fromEntries(
		SORTS.map((s) => {
			const [cw, cd] = cellSize();
			const [ox, oy] = cellOrigin(s.cell);
			const inCase: Point3 = [ox + (cw - BLOCK_W) / 2 - s.slot[0], oy + (cd - BLOCK_D) / 2 - s.slot[1], CASE_FLOOR + 3 - STONE_H];
			return [s.name, [inCase, [s.drift[0], s.drift[1], HOVER], [0, 0, 0], [0, 0, 0]]];
		}),
	);
	for (const pc of PIECES) {
		const r: Point3 = [pc.rack[0] - pc.plan.x, pc.rack[1] - pc.plan.y, pc.rack[2] - FZ];
		offsets[pc.name] = [r, [0, 0, HOVER_F], [0, 0, 0], [0, 0, 0]];
	}
	const keyRack: Point3 = [KEY_RACK[0] - KEY.x, KEY_RACK[1] - KEY.y, KEY_RACK[2] - STONE_H];
	offsets.key = [keyRack, keyRack, [0, 0, 0], [0, 0, 0]];
	offsets.sheet = [toStack, toStack, lift(toStack, 0), [0, 0, 0]];
	const transforms = transformsFrom(P, offsets);
	const blocks = byDepth(SORTS.map((s) => ({ at: [s.slot[0] + BLOCK_W / 2, s.slot[1] + BLOCK_D / 2] as Plane, svg: moverSvg(s.name, transforms[s.name][3], block(s)) }))).map((b) => b.svg);

	const svg = k.figureSvg({
		width,
		height,
		label:
			'A letterpress bench. On the left, a wooden type case holds compartments of ready-cast type. Five type blocks, each carrying a part of an app: a web page, a key for signing in, a coin for payments, a parcel for orders and an envelope for messages, lift out of the case and set into a steel chase on the stone. Wooden spacers and quoins stored in a tall rack behind the stone are lifted out and lowered into the gaps to lock them tight, and a sheet from the paper stack comes out on the delivery board printed as one app page.',
		body: [base(), inkDisc(), typeCase(), caseFront(), stick(), rack(), stone(), piecesOf(false), ...blocks, piecesOf(true), chaseFront(), `<g class="mover" data-part="key" transform="${transforms.key[3]}">${quoinKey()}</g>`, paper(), board(), `<g class="mover plain" data-part="sheet" transform="${transforms.sheet[3]}">${sheet()}</g>`],
	});
	return { svg, labels: STEP_LABELS, transforms };
}
