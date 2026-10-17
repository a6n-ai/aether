import * as k from '../../lib/anatomy/iso-kit';
import type { Plan, Plane, Point3 } from '../../lib/anatomy/iso-kit';
import { moverSvg, stepSvg, transformsFrom, type Machine } from '../../lib/plate';

export const LABELS = ['you send a message', 'kept safe', 'tried again if needed', 'it arrives'] as const;
export const CAPTION = 'Receipts, reminders and offers reach your customers. If a message fails to send, it is tried again automatically.';

const BASE: Plan = { x: -175, y: -90, w: 350, d: 180, r: 8 };
const BASE_H = 12;
const FOOT_H = 6;

const LY = -34;
const LANE_W = 16;
const STEP = 9;
const A_X0 = -136;
const A_STEPS = 12;
const B_X0 = -12;
const B_STEPS = 10;
const zA = (x: number) => 40.4 - 0.2 * (x - A_X0);
const zB = (x: number) => 56 - 0.2 * (x + 20);
const LIFT_X = -20;
const FOOT_Z = zA(LIFT_X);
const TOP_Z = 56;
const POST_Y: [number, number] = [LY - 15, LY + 15];
const MARBLE_R = 3.6;
const HOLD_X = A_X0 + STEP * 7 + STEP / 2;
const START_X = A_X0 + STEP * 1 + STEP / 2;
const CUP_X = 98;
const CUP: Plan = { x: B_X0 + STEP * B_STEPS, y: LY - 11, w: 36, d: 22, r: 2 };
const SEND: Plane = [-152, -10];
const RECV: Plane = [152, -2];

export function relay(width = 720, height = 480): Machine {
	const P = k.fitProjection(
		[...k.boxCorners(BASE, -BASE_H - FOOT_H, 0), [LIFT_X, LY, 76], [SEND[0], SEND[1], 52], [RECV[0], RECV[1], 52], [A_X0, LY, 54]],
		width,
		height,
		{ pad: 20, azimuth: 40 },
	);
	const at = (p: Point3) => k.iso(p, P);
	const S = k.solidSvg;
	const L = k.lineSvg;
	const D = k.dotsSvg;
	const byDepth = (points: Plane[]) => [...points].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
	const halo = (plan: Plan, z: number, h: number, blur = 0) => `<path class="iso-halo" d="${k.haloOf(plan, z, h, P)}"${blur ? ` style="filter:blur(${blur}px)"` : ''}/>`;

	const seg = (a: Point3, b: Point3) => k.segment(a, b, P);
	const rectY = (y: number, x0: number, x1: number, z0: number, z1: number) => seg([x0, y, z0], [x1, y, z0]) + seg([x1, y, z0], [x1, y, z1]) + seg([x1, y, z1], [x0, y, z1]) + seg([x0, y, z1], [x0, y, z0]);
	const rectX = (x: number, y0: number, y1: number, z0: number, z1: number) => seg([x, y0, z0], [x, y1, z0]) + seg([x, y1, z0], [x, y1, z1]) + seg([x, y1, z1], [x, y0, z1]) + seg([x, y0, z1], [x, y0, z0]);
	const dotsAt = (pts: Point3[], size = 0.4, tone: k.Tone = 'mid') => D(pts.map(at), { size, tone });
	const slots = (face: 'x' | 'y', at0: number, from: number, to: number, step: number, z0: number, z1: number, half: number) => {
		let d = '';
		for (let v = from; v <= to; v += step) d += face === 'x' ? rectX(at0, v - half, v + half, z0, z1) : rectY(at0, v - half, v + half, z0, z1);
		return d;
	};

	function base() {
		const out = [halo(BASE, -BASE_H - FOOT_H, BASE_H)];
		for (const [x, y] of byDepth(k.corners(BASE, 24))) {
			out.push(S(k.cylinder(x, y, 8, -BASE_H - FOOT_H, 1.8, P, 28), { tone: 'lo' }));
			out.push(S(k.cylinder(x, y, 6, -BASE_H - FOOT_H + 1.8, FOOT_H - 1.8, P, 28), { tone: 'mid' }));
		}
		out.push(S(k.slabOf(BASE, -BASE_H, BASE_H, P, 8, 1.6), { tone: 'mid', inner: L(k.sideSeam(BASE, -BASE_H / 2, P), { tone: 'faint' }) }));
		out.push(L(k.planOutline(k.insetPlan(BASE, 5), 0, P), { tone: 'lo' }));
		const screws = k.corners(BASE, 11);
		out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(''), { tone: 'lo' }));
		out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
		const strip: Plan = { x: -150, y: BASE.y + BASE.d - 16, w: 170, d: 7, r: 1 };
		out.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: 'lo', crease: 'none' }));
		const ticks = k.topTicks(strip.x + 4, strip.x + strip.w - 4, 4, 5, strip.y + 0.8, 0.6, [2, 3.6], P);
		out.push(L(ticks.minor, { tone: 'lo' }), L(ticks.major, { tone: 'mid' }));
		out.push(D([at([strip.x + 2, strip.y + 3.5, 0.6]), at([strip.x + strip.w - 2, strip.y + 3.5, 0.6])], { size: 0.45 }));
		const label: Plan = { x: 112, y: BASE.y + BASE.d - 24, w: 44, d: 13, r: 1.5 };
		out.push(S(k.slabOf(label, 0, 0.8, P, 3), { tone: 'lo' }));
		for (const dy of [3.5, 6.5, 9.5]) out.push(L(k.lineOnTop([label.x + 5, label.y + dy], [label.x + label.w - (dy === 9.5 ? 16 : 5), label.y + dy], 0.8, P), { tone: 'faint', free: true }));
		out.push(D([at([label.x + 2, label.y + 2, 0.8]), at([label.x + label.w - 2, label.y + label.d - 2, 0.8])], { size: 0.4 }));
		const fx = BASE.x + BASE.w;
		const fy = BASE.y + BASE.d;
		out.push(L(slots('x', fx, -56, 56, 16, -4.8, -2.6, 5) + slots('y', fy, -120, 120, 30, -4.8, -2.6, 7), { tone: 'lo' }));
		out.push(dotsAt([-150, -90, -30, 30, 90, 150].map((x) => [x, fy, -9] as Point3), 0.45), dotsAt([-60, -20, 20, 60].map((y) => [fx, y, -9] as Point3), 0.45));
		out.push(L([-120, 0, 120].map((x) => k.ring(x, 83, 1.6, 0, P, 12)).join('') + [-60, 0, 60].map((y) => k.ring(166, y, 1.6, 0, P, 12)).join(''), { tone: 'lo' }), dotsAt([...[-120, 0, 120].map((x) => [x, 83, 0] as Point3), ...[-60, 0, 60].map((y) => [166, y, 0] as Point3)], 0.4));
		out.push(L(k.planOutline(k.insetPlan(BASE, 9), 0, P), { tone: 'faint' }));
		return out.join('');
	}
	const ZERO: Point3 = [0, 0, 0];
	function phone([cx, cy]: Plane, lit: boolean) {
		const foot: Plan = { x: cx - 16, y: cy - 9, w: 32, d: 18, r: 2 };
		const out = [halo(foot, 0, 3)];
		out.push(S(k.slabOf(foot, 0, 3, P, 3, 0.5), { tone: 'mid' }));
		const body: Plan = { x: cx - 13, y: cy - 2.5, w: 26, d: 5, r: 2 };
		out.push(S(k.slabOf(body, 3, 46, P, 4, 0.6), { tone: 'mid' }));
		const front = body.y + body.d;
		const screen: Plan = { x: cx - 10, y: front, w: 20, d: 0.8, r: 0.5 };
		const glass = S(k.slabOf(screen, 12, 30, P, 2), { tone: 'hi', lit });
		out.push(lit ? stepSvg('lit-at', 4, glass) : glass);
		out.push(L(k.sideRing([cx, front, 7.4], 1.8, 'y', P, 14), { tone: 'lo' }));
		out.push(L(k.segment([cx - 3, front, 45.6], [cx + 3, front, 45.6], P), { tone: 'lo' }));
		out.push(D([at([cx - 6, front, 47.2]), at([cx + 6, front, 47.2])], { size: 0.4 }));
		out.push(L(k.planOutline(k.insetPlan(foot, 2.5), 3, P), { tone: 'faint' }));
		out.push(S(k.slabOf({ x: cx - 6, y: foot.y + foot.d, w: 12, d: 0.6, r: 0.3 }, 0.8, 1.4, P, 2), { tone: 'lo', crease: 'none' }));
		out.push(D(k.corners(foot, 3).map(([x, y]) => at([x, y, 3])), { size: 0.4 }));
		for (const [dz, h] of [[34, 5], [26, 5], [19, 3]]) out.push(S(k.slabOf({ x: cx + 13, y: cy - 1.2, w: 0.9, d: 2.4, r: 0.3 }, dz, h, P, 2), { tone: 'lo', crease: 'none' }));
		out.push(L(k.rise([cx - 13, front], 8, 42, P), { tone: 'faint' }));
		return out.join('');
	}

	function gearRing([cx, cy]: Plane, outer: number, root: number, teeth: number, phase: number): Plane[] {
		const pitch = (Math.PI * 2) / teeth;
		const ring: Plane[] = [];
		const pt = (r: number, a: number): Plane => [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
		for (let i = 0; i < teeth; i++) {
			const a = phase + i * pitch;
			ring.push(pt(root, a - 0.5 * pitch), pt(root, a - 0.3 * pitch), pt(outer, a - 0.17 * pitch), pt(outer, a + 0.17 * pitch), pt(root, a + 0.3 * pitch));
		}
		return ring;
	}

	function marble([cx, cy]: Plane, z: number, still = false) {
		const out = [halo({ x: cx - 4, y: cy - 4, w: 8, d: 8, r: 4 }, z, 0.1, 1.5)];
		out.push(S(k.cylinder(cx, cy, 2.4, z, 1.2, P, 16), { tone: 'mid' }), S(k.cylinder(cx, cy, MARBLE_R, z + 1.2, 4.8, P, 24, 0.8), { tone: 'hi' }), S(k.cylinder(cx, cy, 2.4, z + 6, 1.2, P, 16), { tone: 'hi' }));
		out.push(L(k.sideArc(cx, cy, MARBLE_R, z + 3.6, P, 18), { tone: 'mid' }));
		if (!still) out.push(D([at([cx - 1, cy + 1, z + 7.2])], { size: 0.4, tone: 'hi' }));
		return out.join('');
	}

	function steps(x0: number, n: number, zOf: (x: number) => number, name: string) {
		const out: string[] = [];
		for (let i = 0; i < n; i++) {
			const x = x0 + i * STEP;
			const top = zOf(x + STEP / 2);
			const plan: Plan = { x, y: LY - LANE_W / 2, w: STEP, d: LANE_W, r: 0.6 };
			out.push(halo(plan, top - 3, 0.1, 1.5));
			out.push(S(k.slabOf(plan, top - 3, 3, P, 2, 0.3), { tone: 'mid' }));
			out.push(L(k.lineOnTop([x + 0.8, LY], [x + STEP - 0.8, LY], top, P), { tone: 'faint', free: true }));
			out.push(S(k.slabOf({ x, y: LY - LANE_W / 2 - 2, w: STEP, d: 2, r: 0.4 }, top - 3, 8.4, P, 2, 0.2), { tone: 'hi' }));
			out.push(L(k.lineOnTop([x + 1, LY + LANE_W / 2 - 0.8], [x + STEP - 1, LY + LANE_W / 2 - 0.8], top, P), { tone: 'lo', free: true }));
			if (i % 3 === 1) out.push(dotsAt([[x + STEP / 2, LY + LANE_W / 2, top - 1.5]], 0.4, 'hi'));
		}
		void name;
		return out;
	}
	const postUnder = (x: number, top: number) => S(k.cylinder(x, LY, 2.2, 0, top - 3, P, 12), { tone: 'mid', crease: 'none' }) + S(k.cylinder(x, LY, 3.4, 0, 1.6, P, 14), { tone: 'lo' }) + L(k.sideArc(x, LY, 2.2, (top - 3) / 2, P, 10), { tone: 'faint' });

	function laneA() {
		const out: string[] = [];
		for (let i = 1; i < A_STEPS; i += 3) out.push(postUnder(A_X0 + i * STEP + STEP / 2, zA(A_X0 + i * STEP + STEP / 2)));
		out.push(...steps(A_X0, A_STEPS, zA, 'a'));
		return out.join('');
	}
	function laneB() {
		const out: string[] = [];
		for (let i = 1; i < B_STEPS; i += 3) out.push(postUnder(B_X0 + i * STEP + STEP / 2, zB(B_X0 + i * STEP + STEP / 2)));
		out.push(...steps(B_X0, B_STEPS, zB, 'b'));
		return out.join('');
	}

	function hopper() {
		const out: string[] = [];
		const x0 = A_X0;
		const top = zA(x0 + STEP / 2);
		for (const [x, y] of [[x0 + 3, LY - 11], [x0 + 3, LY + 11], [x0 + 22, LY - 11], [x0 + 22, LY + 11]] as const) out.push(S(k.cylinder(x, y, 2.4, 0, zA(x) - 3, P, 12), { tone: 'mid', crease: 'none' }), S(k.cylinder(x, y, 3.8, 0, 1.6, P, 14), { tone: 'lo' }));
		out.push(S(k.slabOf({ x: x0 - 3, y: LY - LANE_W / 2 - 2, w: 3, d: LANE_W + 4, r: 0.6 }, top - 3, 12.4, P, 2, 0.3), { tone: 'hi' }));
		out.push(L(k.rise([x0 - 1.5, LY + LANE_W / 2 + 2], top - 2, top + 8, P), { tone: 'faint' }));
		out.push(S(k.slabOf({ x: x0, y: LY + LANE_W / 2 - 1, w: 3 * STEP, d: 1.4, r: 0.4 }, zA(x0 + 3 * STEP) - 1, 3.4, P, 2, 0.2), { tone: 'mid', crease: 'none' }));
		out.push(dotsAt([[x0 - 1.5, LY - 6, top + 8], [x0 - 1.5, LY + 6, top + 8], [x0 + 6, LY + LANE_W / 2 + 0.4, zA(x0 + 6) + 1]], 0.45));
		return out.join('');
	}

	function waiting() {
		return marble([A_X0 + STEP / 2, LY - 3.8], zA(A_X0 + STEP / 2), true) + marble([A_X0 + STEP / 2, LY + 3.8], zA(A_X0 + STEP / 2), true);
	}

	function gate() {
		const out: string[] = [];
		const gx = HOLD_X + 5.8;
		const sz = zA(gx);
		out.push(S(k.slabOf({ x: gx - 0.4, y: LY - 4, w: 2, d: 8, r: 0.4 }, sz, 3.4, P, 2, 0.2), { tone: 'lo' }));
		for (const y of [LY - 11, LY + 11]) out.push(S(k.cylinder(gx, y, 2.4, sz - 3, 19, P, 14), { tone: 'mid', crease: 'none' }), S(k.cylinder(gx, y, 3.4, sz - 3, 1.6, P, 14), { tone: 'lo' }), L(k.sideArc(gx, y, 2.4, sz + 6, P, 12), { tone: 'faint' }));
		const lz = sz + 16;
		out.push(halo({ x: gx - 3, y: LY - 14, w: 6, d: 28, r: 2 }, lz, 3, 1.5));
		out.push(S(k.slabOf({ x: gx - 3, y: LY - 14, w: 6, d: 28, r: 1.4 }, lz, 3.4, P, 3, 0.4), { tone: 'hi' }));
		out.push(L(k.lineOnTop([gx, LY - 12], [gx, LY + 12], lz + 3.4, P), { tone: 'faint', free: true }));
		const gc: Plane = [gx, LY - 4];
		out.push(S(k.cylinder(gc[0], gc[1], 1.6, lz + 3.4, 3, P, 10), { tone: 'mid' }), S(k.extrude(gearRing(gc, 6, 4.2, 10, 0.3), lz + 6.4, 2.2, P, { convex: false }), { tone: 'hi' }), S(k.cylinder(gc[0], gc[1], 1.2, lz + 8.6, 1.2, P, 8), { tone: 'mid' }));
		out.push(S(k.slabOf({ x: gx - 1.2, y: LY + 2, w: 2.4, d: 8, r: 0.6 }, lz + 3.4, 1.8, P, 2), { tone: 'mid' }), D([at([gx, LY + 8, lz + 5.2]), at([gc[0], gc[1], lz + 9.8])], { size: 0.45, tone: 'hi' }));
		return out.join('');
	}

	function tower() {
		const out: string[] = [];
		const H = 74;
		for (const y of POST_Y) {
			out.push(halo({ x: LIFT_X - 6, y: y - 6, w: 12, d: 12, r: 6 }, 0, 3, 2));
			out.push(S(k.cylinder(LIFT_X, y, 6, 0, 3, P, 24, 0.4), { tone: 'lo' }), L(k.knurl(LIFT_X, y, 6, 0, 3, 18, P, 0.3), { tone: 'faint' }), S(k.cylinder(LIFT_X, y, 2.4, 3, H - 3, P, 16), { tone: 'mid', crease: 'none' }));
			out.push(L(k.sideArc(LIFT_X, y, 2.4, 20, P, 12) + k.sideArc(LIFT_X, y, 2.4, 40, P, 12) + k.sideArc(LIFT_X, y, 2.4, 60, P, 12), { tone: 'faint' }), D([at([LIFT_X - 1.4, y, 30]), at([LIFT_X - 1.4, y, 50])], { size: 0.4, tone: 'hi' }));
		}
		return out.join('');
	}
	function towerTop() {
		const out: string[] = [];
		const H = 74;
		const bar: Plan = { x: LIFT_X - 4, y: POST_Y[0] - 3, w: 8, d: POST_Y[1] - POST_Y[0] + 6, r: 1.6 };
		out.push(halo(bar, H, 4, 1.5), S(k.slabOf(bar, H, 4, P, 3, 0.5), { tone: 'hi' }), L(k.planOutline(k.insetPlan(bar, 1.4), H + 4, P, 3), { tone: 'faint' }));
		out.push(S(k.cylinder(LIFT_X, LY, 5.6, H + 4, 3, P, 24, 0.4), { tone: 'mid' }), L(k.knurl(LIFT_X, LY, 5.6, H + 4, H + 7, 20, P, 0.3), { tone: 'lo' }), S(k.cylinder(LIFT_X, LY, 1.8, H + 7, 3, P, 10), { tone: 'hi' }), D([at([LIFT_X, LY, H + 10]), at([LIFT_X, POST_Y[0], H + 4]), at([LIFT_X, POST_Y[1], H + 4])], { size: 0.5, tone: 'hi' }));
		return out.join('');
	}
	function motor() {
		const box: Plan = { x: -9, y: LY + 17, w: 20, d: 12, r: 1.6 };
		const out = [halo(box, 0, 10), S(k.slabOf(box, 0, 10, P, 3, 0.7), { tone: 'mid', inner: L(k.sideSeam(box, 6, P, 3), { tone: 'faint' }) })];
		const f = box.y + box.d;
		out.push(L(k.planOutline(k.insetPlan(box, 2), 10, P, 3), { tone: 'faint' }), S(k.cylinder(-3, LY + 22, 3.6, 10, 2.4, P, 18), { tone: 'hi' }), L(k.knurl(-3, LY + 22, 3.6, 10, 12.4, 14, P, 0.3), { tone: 'lo' }), L(k.lineOnTop([-3, LY + 22], [-1, LY + 20.4], 12.4, P), { tone: 'mid', free: true }));
		out.push(S(k.slabOf({ x: -6, y: f, w: 14, d: 0.8, r: 0.3 }, 2.6, 4.4, P, 2), { tone: 'lo', crease: 'none' }), L(`${k.segment([-4, f + 0.8, 5.4], [6, f + 0.8, 5.4], P)}${k.segment([-4, f + 0.8, 3.8], [2, f + 0.8, 3.8], P)}`, { tone: 'faint', free: true }), dotsAt([[box.x + 2, f, 8], [box.x + box.w - 2, f, 8], [box.x + box.w, box.y + 3, 6]], 0.4));
		out.push(S(k.cylinder(6, LY + 22, 2.8, 10, 4, P, 14), { tone: 'mid' }), D([at([6, LY + 22, 14])], { size: 0.45, tone: 'hi' }));
		return out.join('');
	}

	function bucket() {
		const out: string[] = [];
		const x = LIFT_X - 7;
		const fz = FOOT_Z;
		const tray: Plan = { x, y: LY - 7.6, w: 14, d: 15.2, r: 1.2 };
		for (const y of POST_Y) {
			const near = y > LY;
			out.push(S(k.slabOf({ x: LIFT_X - 2.4, y: near ? LY + 7 : y - 3.4, w: 4.8, d: Math.abs(y - LY) - 7 + 3.4, r: 0.6 }, fz - 2.6, 3, P, 2, 0.3), { tone: 'mid' }));
			out.push(S(k.cylinder(LIFT_X, y, 4, fz - 3.4, 5.6, P, 18, 0.4), { tone: 'hi' }), L(k.ring(LIFT_X, y, 4, fz + 0.6, P, 18), { tone: 'lo' }));
		}
		out.push(halo(tray, fz - 2, 2, 1.5), S(k.slabOf(tray, fz - 2, 2, P, 3, 0.4), { tone: 'hi' }));
		out.push(S(k.slabOf({ x, y: tray.y - 1.6, w: 14, d: 1.8, r: 0.4 }, fz - 2, 7, P, 2, 0.2), { tone: 'hi' }), S(k.slabOf({ x, y: tray.y + tray.d - 0.2, w: 14, d: 1.4, r: 0.4 }, fz - 2, 3, P, 2, 0.2), { tone: 'mid' }));
		out.push(L(k.lineOnTop([x + 1.2, LY], [x + 12.8, LY], fz, P), { tone: 'faint', free: true }), dotsAt([[x + 3, tray.y + tray.d, fz], [x + 11, tray.y + tray.d, fz]], 0.4, 'hi'));
		return out.join('');
	}

	function cup() {
		const out = [halo(CUP, 0, zB(CUP_X) - 2)];
		for (const [x, y] of [[CUP.x + 4, CUP.y + 4], [CUP.x + CUP.w - 4, CUP.y + 4], [CUP.x + 4, CUP.y + CUP.d - 4], [CUP.x + CUP.w - 4, CUP.y + CUP.d - 4]] as const) out.push(S(k.cylinder(x, y, 2.4, 0, zB(CUP_X) - 3.4, P, 12), { tone: 'mid', crease: 'none' }), S(k.cylinder(x, y, 3.8, 0, 1.6, P, 14), { tone: 'lo' }));
		const fz = zB(CUP_X);
		out.push(S(k.slabOf(CUP, fz - 2, 2, P, 3, 0.5), { tone: 'mid', inner: L(k.sideSeam(CUP, fz - 1, P, 3), { tone: 'faint' }) }));
		out.push(S(k.slabOf({ x: CUP.x, y: CUP.y, w: CUP.w, d: 2, r: 0.5 }, fz, 7, P, 2, 0.2), { tone: 'hi' }), S(k.slabOf({ x: CUP.x + CUP.w - 2, y: CUP.y + 2, w: 2, d: CUP.d - 2, r: 0.5 }, fz, 7, P, 2, 0.2), { tone: 'hi' }));
		out.push(S(k.slabOf({ x: CUP.x + 2, y: CUP.y + CUP.d - 1.6, w: CUP.w - 2, d: 1.6, r: 0.4 }, fz, 2.6, P, 2, 0.2), { tone: 'mid' }));
		out.push(L(k.planOutline(k.insetPlan(CUP, 3), fz, P, 3), { tone: 'faint' }), L(k.ring(CUP_X, LY, 6, fz, P, 24), { tone: 'lo' }), L(k.ring(CUP_X, LY, 4, fz, P, 20), { tone: 'faint' }));
		out.push(dotsAt([[CUP.x + 4, CUP.y + CUP.d, fz - 1], [CUP.x + CUP.w - 4, CUP.y + CUP.d, fz - 1], [CUP.x + CUP.w, CUP.y + 4, fz + 5]], 0.45));
		return out.join('');
	}


	const start: Plane = [START_X, LY];
	const base0 = zA(START_X);
	const POS = [
		[START_X, zA(START_X)],
		[HOLD_X, zA(HOLD_X)],
		[LIFT_X, TOP_Z],
		[CUP_X, zB(CUP_X)],
	] as const;
	const transforms = transformsFrom(P, {
		marble: POS.map(([x, z]): Point3 => [x - START_X, 0, z - base0]),
		bucket: [ZERO, ZERO, [0, 0, TOP_Z - FOOT_Z], ZERO],
	});

	const svg = k.figureSvg({
		width,
		height,
		label:
			'A marble run for messages: a phone and a hopper of marbles on the left, a sloping lane down to a gate that holds the marble safe, a small lift that carries it up to try again, a second lane running to a receiving cup beside another phone whose screen lights when the marble arrives.',
		body: [
			base(),
			hopper(),
			laneA(),
			waiting(),
			gate(),
			tower(),
			motor(),
			moverSvg('bucket', transforms.bucket[3], bucket()),
			laneB(),
			cup(),
			moverSvg('marble', transforms.marble[3], marble(start, base0)),
			towerTop(),
			phone(SEND, false),
			phone(RECV, true),
		],
	});
	return { svg, labels: LABELS, transforms };
}
