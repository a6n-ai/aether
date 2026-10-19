import * as k from '../../lib/anatomy/iso-kit';
import type { Plan, Plane, Point3 } from '../../lib/anatomy/iso-kit';
import { moverSvg, stepSvg, transformsFrom, type Machine } from '../../lib/plate';

export const LABELS = ['your shop', 'our bench inside it', 'fixed on the spot', 'one team, yours'] as const;
export const CAPTION = 'We work like your own tech team, not a vendor you chase. The same people, every week, building inside your business.';

// A shop counter with a service drawer built into its end: our tools come out of inside your shop,
// a spanner fixes the loose shelf bracket behind, and the counter sign lights once the job is done.
const BASE: Plan = { x: -170, y: -112, w: 340, d: 176, r: 8 };
const BASE_H = 8;
const FOOT_H = 6;
const WALL: Plan = { x: -164, y: -110, w: 328, d: 6, r: 1 };
const WALL_H = 92;

const CARCASS: Plan = { x: -140, y: -62, w: 220, d: 92, r: 1.5 };
const TOP: Plan = { x: -143, y: -65, w: 226, d: 98, r: 2.5 };
const TOP_Z = 31;
const TOP_H = 4;
const SURFACE = TOP_Z + TOP_H;

// The opening in the counter's end face, and the drawer that slides out of it along +x.
const FACE_X = CARCASS.x + CARCASS.w;
const HOLE = { y0: -43, y1: 13, z0: 5, z1: 29 };
const OUT = 72;
const TRAY = { x: -10, y: -38, w: 89, d: 46, z: 12, h: 10 };

const ARM_TOP = 51.5;
const BOARD: Plan = { x: -110, y: -104, w: 262, d: 20, r: 1 };
const BRACKETS = [-90, -30, 30, 85];
const LOOSE_X = 132;
const BOLT_Y = -72;
const PIVOT: Point3 = [LOOSE_X, -103, 46];
const DROOP = -50;

const SPAN_OUT: Point3 = [115.1, -16, 15];
const SPAN_FIX: Point3 = [115.1, BOLT_Y, ARM_TOP];
const SPAN_IN: Point3 = [SPAN_OUT[0] - OUT, SPAN_OUT[1], SPAN_OUT[2]];

type Tone = 'hi' | 'mid' | 'lo';

export function team(width = 720, height = 480): Machine {
	const P = k.fitProjection(
		[...k.boxCorners(BASE, -BASE_H - FOOT_H, 0), [WALL.x, WALL.y, WALL_H], [WALL.x + WALL.w, WALL.y, WALL_H], [FACE_X + OUT + 6, HOLE.y0, HOLE.z1], [58, -56, 62]],
		width,
		height,
		{ pad: 20, azimuth: 40 },
	);
	const at = (p: Point3) => k.iso(p, P);
	const S = k.solidSvg;
	const L = k.lineSvg;
	const D = k.dotsSvg;
	const dots = (pts: Point3[], size = 0.45, tone: Tone | 'faint' = 'mid') => D(pts.map(at), { size, tone });
	const byDepth = <T extends { at: Plane }>(list: T[]) => [...list].sort((a, b) => k.depthOf([a.at[0], a.at[1], 0], P) - k.depthOf([b.at[0], b.at[1], 0], P));
	const halo = (plan: Plan, z: number, h: number) => `<path class="iso-halo" d="${k.haloOf(plan, z, h, P)}"/>`;
	const box = (plan: Plan, z: number, h: number, tone: Tone = 'mid', o: { steps?: number; bevel?: number; seam?: number; lit?: boolean; thin?: boolean } = {}) =>
		S(k.slabOf(plan, z, h, P, o.steps ?? 3, o.bevel ?? 0.4), { tone, lit: o.lit, crease: o.thin ? 'none' : 'faint', inner: o.seam === undefined ? '' : L(k.sideSeam(plan, o.seam, P, o.steps ?? 3), { tone: 'faint' }) });
	const slab = (x: number, y: number, w: number, d: number, z: number, h: number, tone: Tone = 'mid', o: { r?: number; steps?: number; bevel?: number; seam?: number; lit?: boolean; thin?: boolean } = {}) => box({ x, y, w, d, r: o.r ?? 0.5 }, z, h, tone, { steps: o.steps ?? 2, bevel: o.bevel ?? 0.25, seam: o.seam, lit: o.lit, thin: o.thin });
	const cyl = (cx: number, cy: number, r: number, z: number, h: number, tone: Tone = 'mid', bevel = 0.3, lit = false, steps?: number) => S(k.cylinder(cx, cy, r, z, h, P, steps ?? (r > 6 ? 32 : 18), bevel), { tone, lit });
	const top = (a: Plane, b: Plane, z: number, tone: Tone | 'faint' = 'faint') => L(k.lineOnTop(a, b, z, P), { tone, free: true });
	const seg = (a: Point3, b: Point3, tone: Tone | 'faint' = 'mid') => L(k.segment(a, b, P), { tone, free: true });

	function base() {
		const out = [halo(BASE, -BASE_H - FOOT_H, BASE_H)];
		for (const [x, y] of byDepth(k.corners(BASE, 24).map((c) => ({ at: c }))).map((c) => c.at)) out.push(cyl(x, y, 8.5, -BASE_H - FOOT_H, 1.8, 'lo', 0.4), cyl(x, y, 6.2, -BASE_H - FOOT_H + 1.8, FOOT_H - 1.8, 'mid'));
		out.push(S(k.slabOf(BASE, -BASE_H, BASE_H, P, 10, 1.6), { tone: 'mid', inner: L(k.sideSeam(BASE, -BASE_H / 2, P, 10), { tone: 'faint' }) }));
		out.push(L(k.planOutline(k.insetPlan(BASE, 5), 0, P, 10), { tone: 'lo' }), L(k.planOutline(k.insetPlan(BASE, 8), 0, P, 10), { tone: 'faint' }));
		const screws = k.corners(BASE, 11);
		out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.4, 0, P, 16)).join(''), { tone: 'lo' }), dots(screws.map(([x, y]) => [x, y, 0] as Point3), 0.55));
		for (const [x, y] of screws) out.push(top([x - 1.4, y], [x + 1.4, y], 0));
		// a ruler along the front edge, and a travel ruler that measures how far the drawer comes out
		const front: Plan = { x: -150, y: BASE.y + BASE.d - 16, w: 200, d: 6, r: 1 };
		out.push(box(front, 0, 0.6, 'lo', { thin: true }));
		const ft = k.topTicks(front.x + 4, front.x + front.w - 4, 4, 5, front.y + 0.8, 0.6, [1.8, 3.6], P);
		out.push(L(ft.minor, { tone: 'lo' }), L(ft.major, { tone: 'mid' }), dots([[front.x + 2, front.y + 3, 0.6], [front.x + front.w - 2, front.y + 3, 0.6]]));
		const travel: Plan = { x: FACE_X + 4, y: 20, w: OUT + 4, d: 6, r: 1 };
		out.push(box(travel, 0, 0.6, 'lo', { thin: true }));
		const tt = k.topTicks(travel.x + 3, travel.x + travel.w - 3, 4, 6, travel.y + 0.8, 0.6, [1.8, 3.6], P);
		out.push(L(tt.minor, { tone: 'lo' }), L(tt.major, { tone: 'mid' }));
		for (const x of [travel.x + 2, travel.x + travel.w - 2]) out.push(dots([[x, travel.y + 3, 0.6]], 0.4));
		const plate: Plan = { x: 78, y: BASE.y + BASE.d - 17, w: 62, d: 11, r: 1.5 };
		out.push(box(plate, 0, 0.8, 'lo'));
		out.push(k.faceTextSvg(k.topMatrix([plate.x + 5, plate.y + 7.4], 0.8, P, 'x'), 'a6n team', { size: 4.4, tone: 'mid' }));
		out.push(dots(k.corners(plate, 2).map(([x, y]) => [x, y, 0.8] as Point3), 0.4));
		return out.join('');
	}

	// The backboard the shelf is screwed to.
	function wall() {
		const out = [halo(WALL, 0, WALL_H), box(WALL, 0, WALL_H, 'mid', { steps: 2, bevel: 0.6, seam: 20 })];
		const f = WALL.y + WALL.d;
		for (const z of [20, 66]) out.push(seg([WALL.x, f, z], [WALL.x + WALL.w, f, z], 'faint'));
		out.push(L(k.planOutline(k.insetPlan(WALL, 1.4), WALL_H, P, 2), { tone: 'faint' }));
		for (const x of [-120, 0, 120]) out.push(seg([x, f, 0], [x, f, WALL_H], 'faint'));
		out.push(dots(k.corners(WALL, 3).map(([x, y]) => [x, y, WALL_H] as Point3), 0.45));
		const rivets: Point3[] = [];
		for (const x of [-120, 0, 120]) for (const z of [8, 34, 58, 80]) rivets.push([x + 3, f, z]);
		out.push(dots(rivets, 0.4, 'lo'));
		return out.join('');
	}

	// A shelf bracket in two parts: what sits under the board (plate, gusset, arm) and what shows in front of it (arm tip, levelling bolt).
	function bracketBack(x: number) {
		const out: string[] = [];
		const f = WALL.y + WALL.d;
		out.push(slab(x - 2.5, f, 5, 2, 24, ARM_TOP - 24, 'mid', { thin: true, r: 0.4 }));
		out.push(seg([x - 2.5, f + 2, 30], [x + 2.5, f + 2, 30], 'faint'), dots([[x, f + 2, 28], [x, f + 2, 46]], 0.5, 'hi'));
		for (const [y0, w, z0] of [[f + 2, 6, 38], [f + 8, 7, 43], [f + 15, 5, 47]] as const) out.push(slab(x - 1, y0, 2, w, z0, ARM_TOP - 2 - z0, 'lo', { thin: true, r: 0.2, bevel: 0 }));
		out.push(seg([x + 1, f + 2, 36], [x + 1, f + 20, ARM_TOP - 2], 'lo'));
		out.push(slab(x - 2.5, f, 5, BOARD.y + BOARD.d - f, ARM_TOP - 2, 2, 'mid', { thin: true, r: 0.4 }));
		return out.join('');
	}

	function bracketFront(x: number) {
		const out: string[] = [];
		const y0 = BOARD.y + BOARD.d;
		out.push(slab(x - 2.5, y0, 5, BOLT_Y + 6 - y0, ARM_TOP - 2, 2, 'mid', { thin: true, r: 0.4 }));
		out.push(cyl(x, BOLT_Y, 4.4, ARM_TOP, 0.6, 'lo', 0.15, false, 18), cyl(x, BOLT_Y, 3.4, ARM_TOP + 0.6, 2.4, 'hi', 0.2, false, 6));
		out.push(L(k.ring(x, BOLT_Y, 1.6, ARM_TOP + 3, P, 6), { tone: 'lo' }), dots([[x, BOLT_Y, ARM_TOP + 3]], 0.4, 'hi'));
		return out.join('');
	}

	function shelfBoard() {
		const out = [halo(BOARD, ARM_TOP, 3)];
		out.push(box(BOARD, ARM_TOP, 3, 'hi', { steps: 3, bevel: 0.5, seam: ARM_TOP + 1.5 }));
		out.push(L(k.planOutline(k.insetPlan(BOARD, 2.4), ARM_TOP + 3, P), { tone: 'faint' }));
		for (const x of [...BRACKETS, LOOSE_X]) out.push(dots([[x, BOARD.y + BOARD.d - 4, ARM_TOP + 3]], 0.5));
		for (const [bx, w, h] of [[-100, 18, 9], [-76, 14, 12], [-52, 20, 7]] as const) {
			out.push(slab(bx, -98, w, 12, ARM_TOP + 3, h, 'mid', { r: 0.8, seam: ARM_TOP + 3 + h * 0.6 }));
			out.push(top([bx + 2, -85.2], [bx + w - 2, -85.2], ARM_TOP + 3 + h, 'faint'));
		}
		return out.join('');
	}

	function counterBody() {
		const out = [halo(TOP, 0, SURFACE)];
		out.push(box(k.insetPlan(CARCASS, 3), 0, 4, 'lo', { steps: 3, seam: 2 }));
		out.push(box(CARCASS, 4, TOP_Z - 4, 'mid', { steps: 4, bevel: 0.7, seam: 18 }));
		// carcass end: a frame round the opening the drawer slides out of
		out.push(slab(FACE_X, HOLE.y0 - 3, 0.6, HOLE.y1 - HOLE.y0 + 6, HOLE.z0 - 2, HOLE.z1 - HOLE.z0 + 4, 'hi', { r: 0.4, thin: true }));
		out.push(slab(FACE_X + 0.6, HOLE.y0, 0.5, HOLE.y1 - HOLE.y0, HOLE.z0, HOLE.z1 - HOLE.z0, 'lo', { r: 0.3, thin: true }));
		const fx = FACE_X + 1.2;
		out.push(dots([[fx, HOLE.y0 - 1.5, HOLE.z0 - 1], [fx, HOLE.y1 + 1.5, HOLE.z0 - 1], [fx, HOLE.y0 - 1.5, HOLE.z1 + 1], [fx, HOLE.y1 + 1.5, HOLE.z1 + 1]], 0.4));
		// raised panels along the customer side
		const fy = CARCASS.y + CARCASS.d;
		for (let i = 0; i < 4; i++) {
			const x = -131 + i * 51;
			out.push(slab(x, fy, 44, 1.2, 8, 20, 'hi', { r: 0.6, thin: true, bevel: 0.2 }));
			out.push(seg([x + 4, fy + 1.2, 12], [x + 40, fy + 1.2, 12], 'faint'), seg([x + 4, fy + 1.2, 24], [x + 40, fy + 1.2, 24], 'faint'), seg([x + 4, fy + 1.2, 12], [x + 4, fy + 1.2, 24], 'faint'), seg([x + 40, fy + 1.2, 12], [x + 40, fy + 1.2, 24], 'faint'));
		}
		out.push(cyl(-52, fy + 1.2, 1.8, 17, 1.2, 'mid', 0.2), dots([[-52, fy + 1.2, 18.2]], 0.5, 'hi'));
		out.push(slab(-126, fy + 1.2, 6, 0.6, 15, 6, 'lo', { r: 0.3, thin: true }), dots([[-123, fy + 1.8, 18]], 0.4, 'hi'));
		// top slab with a trim inlay and a ruler along the customer edge
		out.push(box(TOP, TOP_Z, TOP_H, 'hi', { steps: 5, bevel: 0.9, seam: TOP_Z + 2 }));
		out.push(L(k.planOutline(k.insetPlan(TOP, 3), SURFACE, P, 5), { tone: 'faint' }), L(k.planOutline(k.insetPlan(TOP, 6), SURFACE, P, 5), { tone: 'faint' }));
		const rule: Plan = { x: -128, y: 22, w: 190, d: 5, r: 0.8 };
		out.push(box(rule, SURFACE, 0.5, 'lo', { thin: true, steps: 2 }));
		const rt = k.topTicks(rule.x + 3, rule.x + rule.w - 3, 4, 5, rule.y + 0.6, SURFACE + 0.5, [1.4, 2.8], P);
		out.push(L(rt.minor, { tone: 'lo' }), L(rt.major, { tone: 'mid' }));
		out.push(dots(k.corners(TOP, 4).map(([x, y]) => [x, y, SURFACE] as Point3), 0.45));
		return out.join('');
	}

	function till() {
		const z = SURFACE;
		const out = [halo({ x: -128, y: -54, w: 46, d: 34, r: 2 }, z, 14)];
		out.push(slab(-126, -52, 42, 30, z, 9, 'mid', { r: 1.6, steps: 3, bevel: 0.5, seam: z + 4 }));
		out.push(slab(-126, -52, 30, 3, z + 9, 14, 'hi', { r: 0.8, bevel: 0.3 }));
		const sy = -49;
		out.push(slab(-124, sy - 0.2, 26, 0.6, z + 11, 10, 'lo', { r: 0.6, thin: true }));
		out.push(seg([-121, sy + 0.6, z + 18], [-105, sy + 0.6, z + 18], 'mid'), seg([-121, sy + 0.6, z + 15.4], [-111, sy + 0.6, z + 15.4], 'faint'), dots([[-100, sy + 0.6, z + 18]], 0.6, 'hi'));
		for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) out.push(slab(-124 + i * 5.2, -46 + j * 4.6, 4, 3.2, z + 9, 1.3, i === 3 ? 'lo' : 'hi', { r: 0.5, thin: true, bevel: 0.2 }));
		out.push(slab(-123, -33, 32, 6, z + 2, 5, 'hi', { r: 0.8, thin: true }), seg([-123, -27, z + 4.5], [-91, -27, z + 4.5], 'faint'), dots([[-107, -27, z + 3.5]], 0.5));
		out.push(slab(-84, -50, 5, 12, z, 12, 'lo', { r: 1, seam: z + 6 }), cyl(-81.5, -44, 3, z + 12, 6, 'hi', 0.4), L(k.ring(-81.5, -44, 2, z + 18, P, 14), { tone: 'lo' }));
		out.push(cyl(-94, -46, 3, z + 9, 2, 'mid', 0.3), dots([[-94, -46, z + 11]], 0.5, 'hi'));
		return out.join('');
	}

	function bell() {
		const z = SURFACE;
		const [cx, cy] = [-46, -24];
		const out = [halo({ x: cx - 8, y: cy - 8, w: 16, d: 16, r: 8 }, z, 10)];
		out.push(cyl(cx, cy, 8, z, 1.6, 'lo', 0.5), L(k.ring(cx, cy, 6.4, z + 1.6, P, 22), { tone: 'faint' }));
		out.push(cyl(cx, cy, 6, z + 1.6, 3.2, 'mid', 0.5), cyl(cx, cy, 4.6, z + 4.8, 2.6, 'hi', 0.8), L(k.sideArc(cx, cy, 6, z + 3, P, 18), { tone: 'faint' }));
		out.push(cyl(cx, cy, 1.2, z + 7.4, 1.8, 'mid', 0.2), cyl(cx, cy, 2.6, z + 9.2, 1.2, 'hi', 0.4), dots([[cx, cy, z + 10.4]], 0.5, 'hi'));
		return out.join('');
	}

	function reader() {
		const z = SURFACE;
		const out = [halo({ x: -28, y: -34, w: 20, d: 18, r: 1.6 }, z, 4)];
		out.push(slab(-28, -34, 20, 18, z, 3, 'mid', { r: 1.6, steps: 3, bevel: 0.4, seam: z + 1.5 }));
		out.push(slab(-26, -34, 16, 6, z + 3, 0.8, 'lo', { r: 0.8, thin: true }), D(k.dotGrid(-24.5, -25, 4, 3, 3.4, z + 3, P), { size: 0.5, tone: 'hi' }));
		out.push(slab(-30, -22, 3, 4, z, 1.4, 'lo', { r: 0.8, thin: true }));
		return out.join('');
	}

	// The counter's sign: a lamp box on two posts. It lights at the last step.
	function sign() {
		const z = SURFACE;
		const out = [halo({ x: 40, y: -58, w: 34, d: 10, r: 1.4 }, z, 26)];
		out.push(slab(42, -58, 30, 8, z, 2, 'lo', { r: 1.2, steps: 3, bevel: 0.4 }));
		for (const x of [48, 66]) out.push(cyl(x, -54, 1.2, z + 2, 8, 'mid', 0.2));
		out.push(slab(40, -56, 34, 3.2, z + 10, 16, 'mid', { r: 1.4, steps: 3, bevel: 0.5, seam: z + 18 }));
		out.push(slab(40.8, -52.8, 32.4, 0.8, z + 10.8, 14.4, 'lo', { r: 1, thin: true }));
		out.push(stepSvg('lit-at', 4, S(k.slabOf({ x: 43, y: -52.2, w: 28, d: 0.8, r: 1 }, z + 12, 11, P, 3, 0.3), { tone: 'hi', lit: true })));
		out.push(dots([[42, -52.2, z + 11.6], [72, -52.2, z + 11.6], [42, -52.2, z + 24.4], [72, -52.2, z + 24.4]], 0.4, 'hi'));
		out.push(cyl(57, -54.4, 1, z + 26, 3, 'lo', 0.2), cyl(57, -54.4, 2.4, z + 29, 1, 'mid', 0.3));
		return out.join('');
	}

	// What slides out: tray, foam, tools, front panel. Drawn closed (its last-step place) and moved +x along the counter.
	function drawer() {
		const T = TRAY;
		const out: string[] = [];
		out.push(box({ x: T.x, y: T.y, w: T.w, d: T.d, r: 1.2 }, T.z, 1.6, 'lo', { steps: 3 }));
		const wallT = 2;
		out.push(slab(T.x, T.y, wallT, T.d, T.z + 1.6, T.h - 1.6, 'mid', { r: 0.4, thin: true }));
		out.push(slab(T.x, T.y, T.w, wallT, T.z + 1.6, T.h - 1.6, 'mid', { r: 0.4, seam: T.z + 5 }));
		const iy0 = T.y + wallT;
		const iy1 = T.y + T.d - wallT;
		out.push(box({ x: T.x + wallT, y: iy0, w: T.w - wallT, d: iy1 - iy0, r: 0.8 }, T.z + 1.6, 1.4, 'hi', { steps: 3, bevel: 0.2 }));
		const fz = T.z + 3;
		// the spanner's own cut-out stays in the foam when it leaves
		const [sx, sy] = [SPAN_IN[0], SPAN_IN[1]];
		out.push(L(k.planOutline({ x: sx - 18, y: sy - 3, w: 30, d: 6, r: 2.4 }, fz, P, 4) + k.planOutline({ x: sx + 9, y: sy - 7, w: 14, d: 14, r: 1.6 }, fz, P, 3), { tone: 'lo' }));
		// hammer
		out.push(slab(2, -33, 30, 3.6, fz, 3, 'hi', { r: 1.4, steps: 3, bevel: 0.3 }), slab(32, -37, 6, 11, fz, 5, 'mid', { r: 0.6, bevel: 0.3 }), top([4, -31.2], [30, -31.2], fz + 3, 'lo'));
		// screws tin
		out.push(slab(58, -36, 16, 10, fz, 4, 'mid', { r: 1, steps: 3, seam: fz + 2 }), D(k.dotGrid(61, -33, 4, 2, 3.4, fz + 4, P), { size: 0.55, tone: 'hi' }));
		// tape measure
		out.push(cyl(71, -16, 5.6, fz, 4.4, 'hi', 0.6), L(k.ring(71, -16, 3.4, fz + 4.4, P, 18), { tone: 'lo' }), L(k.knurl(71, -16, 5.6, fz, fz + 4.4, 16, P, 0.3), { tone: 'lo' }), slab(75, -12, 6, 3, fz, 1.4, 'mid', { r: 0.8, thin: true }));
		// screwdriver
		out.push(slab(6, -1, 16, 4.6, fz, 4, 'mid', { r: 2, steps: 3, bevel: 0.5 }), slab(22, 0.2, 22, 2.2, fz, 1.6, 'hi', { r: 0.6, thin: true }), slab(44, 0.6, 3, 1.4, fz, 1.2, 'lo', { r: 0.3, thin: true }), top([8, 1.3], [20, 1.3], fz + 4, 'lo'));
		// pliers
		for (const [dy, tone] of [[-1, 'hi'], [3, 'mid']] as const) out.push(slab(52, dy, 22, 2.2, fz, 2, tone, { r: 0.8, steps: 3, bevel: 0.25 }));
		out.push(cyl(63, 1.8, 1.6, fz + 2, 1, 'lo', 0.2), dots([[63, 1.8, fz + 3]], 0.4, 'hi'));
		// front panel with its pull
		const px = TRAY.x + TRAY.w;
		const my = (HOLE.y0 + HOLE.y1) / 2;
		out.push(slab(px, HOLE.y0 + 1, 3, HOLE.y1 - HOLE.y0 - 2, HOLE.z0 + 1, HOLE.z1 - HOLE.z0 - 2, 'hi', { r: 0.8, steps: 3, bevel: 0.4, seam: 17 }));
		const pf = px + 3;
		const [a, b, c, d] = [HOLE.y0 + 4, HOLE.y1 - 4, HOLE.z0 + 5, HOLE.z1 - 5];
		out.push(seg([pf, a, c], [pf, b, c], 'faint'), seg([pf, a, d], [pf, b, d], 'faint'), seg([pf, a, c], [pf, a, d], 'faint'), seg([pf, b, c], [pf, b, d], 'faint'));
		for (const y of [my - 11, my + 11]) out.push(cyl(pf + 1.4, y, 1.1, 14, 2.4, 'lo', 0.15, false, 12));
		out.push(slab(pf + 3.2, my - 12, 3, 24, 13.6, 2.2, 'mid', { r: 1, steps: 3, bevel: 0.4 }));
		return out.join('');
	}

	function spanner([cx, cy, z]: Point3) {
		const out = [`<path class="iso-halo" d="${k.haloOf({ x: cx - 21, y: cy - 6, w: 44, d: 12, r: 5 }, z, 0.1, P)}"/>`];
		out.push(slab(cx - 16, cy - 2.2, 29, 4.4, z, 1.8, 'hi', { r: 1.6, steps: 4, bevel: 0.3 }));
		out.push(cyl(cx - 17, cy, 4.8, z, 1.8, 'hi', 0.3, false, 24), L(k.ring(cx - 17, cy, 2.4, z + 1.8, P, 14), { tone: 'mid' }));
		out.push(slab(cx + 10, cy - 6.2, 3.4, 12.4, z, 1.8, 'hi', { r: 1, steps: 3, bevel: 0.3 }));
		out.push(slab(cx + 13.4, cy - 6.2, 8.6, 2.6, z, 1.8, 'hi', { r: 0.8, thin: true, bevel: 0.25 }), slab(cx + 13.4, cy + 3.6, 8.6, 2.6, z, 1.8, 'hi', { r: 0.8, thin: true, bevel: 0.25 }));
		out.push(top([cx - 10, cy], [cx + 8, cy], z + 1.8, 'lo'));
		return out.join('');
	}

	// Clips that stay put on the screen. The drawer shows only what is outside the counter's end face; a vertical cut keeps
	// the spanner hidden while it is still inside the closed drawer and shows it everywhere it travels afterwards.
	const hull = (pts: [number, number][]) => {
		const s = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
		const cross = (o: number[], a: number[], b: number[]) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
		const half = (list: [number, number][]) => {
			const h: [number, number][] = [];
			for (const p of list) {
				while (h.length > 1 && cross(h[h.length - 2], h[h.length - 1], p) <= 0) h.pop();
				h.push(p);
			}
			return h;
		};
		return [...half(s).slice(0, -1), ...half([...s].reverse()).slice(0, -1)];
	};
	const r1 = (n: number) => Math.round(n * 10) / 10;
	const faceCorners = (x: number): Point3[] => [[x, HOLE.y0, HOLE.z0], [x, HOLE.y1, HOLE.z0], [x, HOLE.y1, HOLE.z1], [x, HOLE.y0, HOLE.z1]];
	const prism = hull([...faceCorners(FACE_X), ...faceCorners(FACE_X + 400)].map((p) => at(p) as [number, number]));
	const spanBox = (c: Point3): Point3[] => {
		const pts: Point3[] = [];
		for (const x of [c[0] - 22, c[0] + 22]) for (const y of [c[1] - 6.2, c[1] + 6.2]) for (const z of [c[2], c[2] + 2]) pts.push([x, y, z]);
		return pts;
	};
	const closedMaxX = Math.max(...spanBox(SPAN_IN).map((p) => at(p)[0]));
	const openMinX = Math.min(...[SPAN_OUT, SPAN_FIX].flatMap((c) => spanBox(c).map((p) => at(p)[0])));
	const cutX = r1((closedMaxX + openMinX) / 2);
	const defs = `<defs><clipPath id="team-drawer-clip"><path d="M${prism.map(([x, y]) => `${r1(x)} ${r1(y)}`).join('L')}Z"/></clipPath><clipPath id="team-spanner-clip"><path d="M${cutX} -4000H4000V4000H${cutX}Z"/></clipPath></defs>`;

	// Movers. Offsets are from where each part is drawn (its last-step place).
	const drawerOut: Point3 = [OUT, 0, 0];
	const spanAt = (c: Point3): Point3 => [c[0] - SPAN_FIX[0], c[1] - SPAN_FIX[1], c[2] - SPAN_FIX[2]];
	const transforms = transformsFrom(P, {
		drawer: [[0, 0, 0], drawerOut, drawerOut, [0, 0, 0]],
		spanner: [spanAt(SPAN_IN), spanAt(SPAN_OUT), [0, 0, 0], spanAt(SPAN_IN)],
	});
	const [px, py] = at(PIVOT);
	const spin = (a: number) => `translate(0 0) rotate(${a} ${r1(px)} ${r1(py)})`;
	transforms.bracket = [spin(DROOP), spin(DROOP), spin(0), spin(0)];

	const statics = BRACKETS.map((x) => ({ at: [x, -90] as Plane, x }));
	const body = [
		base(),
		defs,
		wall(),
		...byDepth(statics).map((b) => bracketBack(b.x)),
		moverSvg('bracket', transforms.bracket[3], bracketBack(LOOSE_X)),
		shelfBoard(),
		...byDepth(statics).map((b) => bracketFront(b.x)),
		moverSvg('bracket', transforms.bracket[3], bracketFront(LOOSE_X)),
		counterBody(),
		till(),
		bell(),
		reader(),
		sign(),
		`<g clip-path="url(#team-drawer-clip)">${moverSvg('drawer', transforms.drawer[3], drawer())}</g>`,
		`<g clip-path="url(#team-spanner-clip)">${moverSvg('spanner', transforms.spanner[3], spanner(SPAN_FIX))}</g>`,
	];

	const svg = k.figureSvg({
		width,
		height,
		label:
			'A shop counter on a base, with a till, a service bell and a sign lamp on top, and a shelf with brackets on the wall behind it. A tool drawer slides out of the end of the counter, so our tools come from inside your shop. A spanner lifts from the drawer to a loose shelf bracket, the bracket swings level and is fixed, then the drawer slides back in and the counter sign lights up: one team, yours.',
		body,
	});
	return { svg, labels: LABELS, transforms };
}
