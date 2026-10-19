import * as k from '../../lib/anatomy/iso-kit';
import type { Plan, Plane, Point3, Projection } from '../../lib/anatomy/iso-kit';
import { stepSvg } from '../../lib/plate';

/** The market kiosk of Plate V, shared with Plate VII so both plates draw the same object. */

// the lot's top: the kiosk stands on it
export const LZ = 6;
export const CAB: Plan = { x: -126, y: -44, w: 88, d: 46, r: 1 };
export const CAB_TOP = 40;
export const TOP: Plan = { x: -128, y: -46, w: 92, d: 50, r: 1.4 };
export const TZ = CAB_TOP + 3;
// front frame: two posts and a lintel standing on the counter
export const POST = 4;
export const POSTS = [-126, -42];
export const LINTEL_Z = 79;
// shutter runs in front of the posts and rolls up into the box under the roof
export const SH = { x: -124, y: 2, w: 84, d: 1.2, z: TZ, h: LINTEL_Z - TZ };
export const RISE = 38;
// roof assembly
export const ROOF: Plan = { x: -132, y: -50, w: 100, d: 58, r: 1.6 };
export const BOX: Plan = { x: -128, y: 2, w: 92, d: 6, r: 0.8 };
export const RZ = 86;
export const RT = 4;
export const SIGN = { x: -112, y: -30, w: 60, d: 3, z: RZ + RT, h: 22 };
// awning flap, hinged on the roof's front edge
export const FLAP = { x: -130, y: 8, w: 96, d: 1.2, z: RZ + RT, h: 22 };
export const SWING = -110;

export type Tn = 'hi' | 'mid' | 'lo';
export type Ln = 'hi' | 'mid' | 'lo' | 'faint';

/** Drawing helpers and the kiosk's parts, bound to one projection. */
export function kioskKit(P: Projection) {
	const at = (p: Point3) => k.iso(p, P);
	const S = k.solidSvg;
	const L = k.lineSvg;
	const D = k.dotsSvg;
	const dots = (pts: Point3[], size = 0.45, tone: Ln = 'mid') => D(pts.map(at), { size, tone });
	const halo = (plan: Plan, z: number, h: number) => `<path class="iso-halo" d="${k.haloOf(plan, z, h, P)}"/>`;
	const slab = (x: number, y: number, w: number, d: number, z: number, h: number, tone: Tn = 'mid', o: { r?: number; steps?: number; bevel?: number; thin?: boolean; lit?: boolean; seam?: number } = {}) => {
		const plan: Plan = { x, y, w, d, r: o.r ?? 0.5 };
		const inner = o.seam ? L(k.sideSeam(plan, o.seam, P, o.steps ?? 3), { tone: 'faint' }) : '';
		return S(k.slabOf(plan, z, h, P, o.steps ?? 2, o.bevel ?? 0.2), { tone, crease: o.thin ? 'none' : 'faint', lit: o.lit, inner });
	};
	const cyl = (cx: number, cy: number, r: number, z: number, h: number, tone: Tn = 'mid', bevel = 0.3, lit = false) => S(k.cylinder(cx, cy, r, z, h, P, r > 5 ? 28 : 16, bevel), { tone, lit });
	const seg = (a: Point3, b: Point3, tone: Ln = 'mid') => L(k.segment(a, b, P), { tone, free: true });
	const flat = (a: Plane, b: Plane, z: number, tone: Ln = 'faint') => L(k.lineOnTop(a, b, z, P), { tone, free: true });
	const byDepth = (points: Plane[]) => [...points].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
	const r1 = (v: number) => Math.round(v * 100) / 100;

	/** Screen matrix that carries a flat part from where it is drawn to `map` of it (exact in the plane through p0 spanned by ex, ey). */
	const affine = (p0: Point3, ex: Point3, ey: Point3, map: (p: Point3) => Point3) => {
		const add = (a: Point3, b: Point3): Point3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
		const [s0, s1, s2] = [p0, add(p0, ex), add(p0, ey)].map(at);
		const [d0, d1, d2] = [p0, add(p0, ex), add(p0, ey)].map((p) => at(map(p)));
		const [ux, uy, vx, vy] = [s1[0] - s0[0], s1[1] - s0[1], s2[0] - s0[0], s2[1] - s0[1]];
		const [px, py, qx, qy] = [d1[0] - d0[0], d1[1] - d0[1], d2[0] - d0[0], d2[1] - d0[1]];
		const det = ux * vy - vx * uy;
		const a = (px * vy - qx * uy) / det;
		const c = (qx * ux - px * vx) / det;
		const b = (py * vy - qy * uy) / det;
		const d = (qy * ux - py * vx) / det;
		const e = d0[0] - a * s0[0] - c * s0[1];
		const f = d0[1] - b * s0[0] - d * s0[1];
		const q = (v: number) => Math.round(v * 10000) / 10000;
		return `matrix(${q(a)} ${q(b)} ${q(c)} ${q(d)} ${r1(e)} ${r1(f)})`;
	};
	/** Turn about the x-parallel line through (y0, z0), then shift. */
	const turnX = (y0: number, z0: number, deg: number, shift: Point3 = [0, 0, 0]) => {
		const [c, s] = [Math.cos((deg * Math.PI) / 180), Math.sin((deg * Math.PI) / 180)];
		return ([x, y, z]: Point3): Point3 => [x + shift[0], y0 + (y - y0) * c - (z - z0) * s + shift[1], z0 + (y - y0) * s + (z - z0) * c + shift[2]];
	};

	/** Cabinet, top, back wall and, with `goods`, the fruit crate, cash box and bell, and the jars unless `jars` is false (they hide under a lowered awning). `onWall` is drawn on the back wall, behind the goods. */
	function counter({ goods = true, jars = goods, onWall = '' } = {}) {
		const out = [halo(CAB, LZ, CAB_TOP - LZ)];
		out.push(S(k.slabOf(CAB, LZ, CAB_TOP - LZ, P, 3, 0.6), { tone: 'mid', inner: L(k.sideSeam(CAB, LZ + 4, P, 3), { tone: 'faint' }) }));
		const fy = CAB.y + CAB.d;
		// toe kick and two cupboard doors with pulls
		out.push(slab(CAB.x + 2, fy, CAB.w - 4, 0.6, LZ, 3.4, 'lo', { thin: true, r: 0.2 }));
		for (const dx of [3, CAB.w / 2 + 1]) {
			const dw = CAB.w / 2 - 4;
			out.push(slab(CAB.x + dx, fy, dw, 0.7, LZ + 6, CAB_TOP - LZ - 9, 'hi', { thin: true, r: 0.3 }));
			const px = dx < 10 ? CAB.x + dx + dw - 5 : CAB.x + dx + 3;
			out.push(slab(px, fy + 0.7, 2, 1.2, LZ + 18, 6, 'mid', { thin: true, r: 0.3 }));
			out.push(dots([[CAB.x + dx + 2, fy + 0.7, LZ + 8], [CAB.x + dx + dw - 2, fy + 0.7, LZ + 8], [CAB.x + dx + 2, fy + 0.7, CAB_TOP - 5], [CAB.x + dx + dw - 2, fy + 0.7, CAB_TOP - 5]], 0.4));
		}
		// door hinges
		for (const hx of [CAB.x + 1.6, CAB.x + CAB.w - 3]) for (const hz of [LZ + 9, CAB_TOP - 8]) out.push(slab(hx, fy, 1.4, 0.9, hz, 4, 'lo', { thin: true, r: 0.2 }));
		// side vents and a price board on the side
		const rx = CAB.x + CAB.w;
		out.push(slab(rx, -10, 0.8, 8, LZ + 8, 18, 'hi', { thin: true, r: 0.3 }));
		for (const z of [LZ + 21, LZ + 17, LZ + 13]) out.push(seg([rx + 0.8, -8.6, z], [rx + 0.8, -3.4, z], 'mid'));
		for (const z of [LZ + 8, LZ + 12, LZ + 16]) out.push(L(k.segment([rx, -30, z], [rx, -12, z], P) + k.segment([rx, -12, z], [rx, -12, z + 2], P) + k.segment([rx, -12, z + 2], [rx, -30, z + 2], P) + k.segment([rx, -30, z + 2], [rx, -30, z], P), { tone: 'lo' }));
		// counter top
		out.push(S(k.slabOf(TOP, CAB_TOP, 3, P, 3, 0.8), { tone: 'hi', inner: L(k.sideSeam(TOP, CAB_TOP + 1.5, P, 3), { tone: 'faint' }) }));
		// back wall, and a row of sweet jars along the back of the counter
		const wall: Plan = { x: CAB.x + 2, y: CAB.y, w: CAB.w - 4, d: 3, r: 0.4 };
		out.push(slab(wall.x, wall.y, wall.w, wall.d, TZ, RZ - TZ, 'mid', { seam: TZ + 22 }));
		out.push(dots([[wall.x + 3, wall.y + 3, TZ + 4], [wall.x + wall.w - 3, wall.y + 3, TZ + 4], [wall.x + 3, wall.y + 3, RZ - 4], [wall.x + wall.w - 3, wall.y + 3, RZ - 4]], 0.45));
		out.push(onWall);
		if (jars)
			for (const [i, jx] of [-114, -102, -90, -78, -66].entries()) {
				const h = [9, 11, 8, 10, 9][i];
				out.push(cyl(jx, -34, 4, TZ, h, i % 2 ? 'mid' : 'hi', 0.4), cyl(jx, -34, 3, TZ + h, 1.6, 'lo', 0.3));
			}
		if (!goods) return out.join('');
		// on the counter: a crate of fruit, a cash box and a bell
		out.push(slab(-120, -20, 24, 16, TZ, 6, 'mid', { r: 0.6, seam: TZ + 3 }));
		out.push(D(k.dotGrid(-117, -17, 5, 3, 4.6, TZ + 6, P), { size: 1.6, tone: 'hi' }));
		out.push(slab(-62, -24, 16, 12, TZ, 5, 'lo', { r: 1, seam: TZ + 3.4 }), slab(-58, -21, 8, 3, TZ + 5, 0.6, 'hi', { thin: true, r: 0.3 }));
		out.push(cyl(-74, -6, 3.4, TZ, 1, 'lo', 0.3), cyl(-74, -6, 2.4, TZ + 1, 2.6, 'hi', 0.6), cyl(-74, -6, 0.6, TZ + 3.6, 1.2, 'mid', 0.1));
		return out.join('');
	}

	function frame() {
		const out: string[] = [];
		for (const x of POSTS) {
			out.push(slab(x - 1.2, -3.2, POST + 2.4, 5.2, TZ, 1.2, 'lo', { r: 0.5 }));
			out.push(slab(x, -2, POST, POST, TZ + 1.2, LINTEL_Z - TZ - 1.2, 'mid', { r: 0.6, seam: TZ + 18 }));
		}
		for (const x of POSTS) out.push(slab(x - 0.6, -2.6, POST + 1.2, 4.6, LINTEL_Z - 3, 3, 'hi', { r: 0.4 }));
		out.push(slab(POSTS[0], -2, POSTS[1] + POST - POSTS[0], POST, LINTEL_Z, RZ - LINTEL_Z, 'mid', { r: 0.6 }));
		return out.join('');
	}

	function shutter() {
		const { x, y, w, d, z, h } = SH;
		const out = [slab(x, y, w, d, z, h, 'hi', { r: 0.2, thin: true })];
		const fy = y + d;
		for (let zz = z + 3; zz < z + h - 1; zz += 3) out.push(seg([x, fy, zz], [x + w, fy, zz], 'lo'));
		out.push(slab(x, fy, w, 1, z, 2.4, 'mid', { thin: true, r: 0.3 }), slab(x + w / 2 - 6, fy + 1, 12, 1, z + 0.6, 1.2, 'hi', { thin: true, r: 0.3 }));
		return out.join('');
	}

	/** Roof with its shutter box and vent; with `sign`, the OPEN sign and its lamp, lit at step 4 when `lit`. */
	function roof({ sign = true, lit = true } = {}) {
		const out = [halo(ROOF, RZ, RT)];
		// shutter box under the front edge, with its slot
		out.push(S(k.slabOf(BOX, LINTEL_Z, RZ - LINTEL_Z, P, 2, 0.4), { tone: 'mid', inner: L(k.sideSeam(BOX, LINTEL_Z + 2, P, 2), { tone: 'faint' }) }));
		out.push(dots([[BOX.x + 3, BOX.y + BOX.d, RZ - 2.4], [BOX.x + BOX.w - 3, BOX.y + BOX.d, RZ - 2.4]], 0.45));
		out.push(S(k.slabOf(ROOF, RZ, RT, P, 3, 1), { tone: 'mid', inner: L(k.sideSeam(ROOF, RZ + 1.6, P, 3), { tone: 'faint' }) }));
		const top = RZ + RT;
		out.push(L(k.planOutline(k.insetPlan(ROOF, 3), top, P), { tone: 'faint' }));
		for (let x = ROOF.x + 3 + 13.4; x < ROOF.x + ROOF.w - 6; x += 13.4) out.push(flat([x, ROOF.y + 3], [x, ROOF.y + ROOF.d - 3], top, 'faint'));
		out.push(dots(k.corners(ROOF, 5).map(([x, y]) => [x, y, top] as Point3), 0.45));
		// hinge knuckles along the front edge
		for (const x of [-124, -84, -44]) out.push(slab(x, FLAP.y - 3, 8, 3, top, 1.6, 'lo', { r: 0.4 }), dots([[x + 4, FLAP.y - 1.5, top + 1.6]], 0.45));
		// vent cap
		out.push(cyl(-50, -38, 4.4, top, 1.2, 'lo', 0.3), cyl(-50, -38, 2.8, top + 1.2, 3.4, 'mid', 0.3), cyl(-50, -38, 4, top + 4.6, 1.2, 'hi', 0.3));
		if (!sign) return out.join('');
		// sign on two legs, with its lamp
		const { x, y, w, d, z, h } = SIGN;
		for (const lx of [x + 10, x + w - 14]) out.push(slab(lx, y - 3, 4, 3, z, 10, 'lo', { r: 0.4 }));
		out.push(slab(x, y, w, d, z + 4, h - 4, 'hi', { r: 0.6, seam: z + 6 }));
		const fy = y + d;
		out.push(k.faceTextSvg(k.sideMatrix([x + w / 2, fy], z + 9, P, 'left'), 'OPEN', { size: 9, tone: 'hi', anchor: 'middle' }));
		out.push(dots([[x + 2.6, fy, z + h - 2.4], [x + w - 2.6, fy, z + h - 2.4]], 0.45));
		const [lx, ly] = [x + w / 2, y + d / 2];
		out.push(cyl(lx, ly, 3.2, z + h, 1.2, 'lo', 0.3), cyl(lx, ly, 1, z + h + 1.2, 2, 'mid', 0.2));
		const lamp = cyl(lx, ly, 3.4, z + h + 3.2, 3.6, 'hi', 0.6, lit);
		out.push(lit ? stepSvg('lit-at', 4, lamp) : lamp);
		return out.join('');
	}

	function awning() {
		const { x, y, w, d, z, h } = FLAP;
		const out = [slab(x, y, w, d, z, h, 'mid', { r: 0.2, thin: true })];
		const fy = y + d;
		const n = 8;
		for (let i = 0; i < n; i++) out.push(slab(x + (i * w) / n, fy, w / n, 0.3, z + 0.6, h - 4.6, i % 2 ? 'lo' : 'hi', { thin: true, r: 0, bevel: 0 }));
		out.push(slab(x, fy, w, 0.5, z + h - 4, 4, 'mid', { thin: true, r: 0.2 }));
		return out.join('');
	}

	/** The awning's transform when swung down over the counter, plus an optional world shift. */
	const awningDown = (shift: Point3 = [0, 0, 0]) => affine([FLAP.x, FLAP.y + FLAP.d, FLAP.z], [1, 0, 0], [0, 0, 1], turnX(FLAP.y, FLAP.z, SWING, shift));

	return { at, S, L, D, dots, halo, slab, cyl, seg, flat, byDepth, r1, affine, turnX, counter, frame, shutter, roof, awning, awningDown };
}
