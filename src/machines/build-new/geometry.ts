import * as k from '../../lib/anatomy/iso-kit';
import type { Plan, Plane, Point3 } from '../../lib/anatomy/iso-kit';
import { moverSvg, stepSvg, transformsFrom, type Machine } from '../../lib/plate';

export const LABELS = ['your idea', 'drawn up', 'built from parts', 'open for customers'] as const;
export const CAPTION = 'Have an idea? We draw it up with you, build it from parts that already work, and open it to your customers.';

const BASE: Plan = { x: -160, y: -70, w: 292, d: 140, r: 8 };
const BASE_H = 10;
const FOOT_H = 5;

// the lot: an empty plinth, and the kiosk's footprint on it
const LOT: Plan = { x: -148, y: -58, w: 130, d: 116, r: 3 };
const LZ = 6;
const CAB: Plan = { x: -126, y: -44, w: 88, d: 46, r: 1 };
const CAB_TOP = 40;
const TOP: Plan = { x: -128, y: -46, w: 92, d: 50, r: 1.4 };
const TZ = CAB_TOP + 3;
// front frame: two posts and a lintel standing on the counter
const POST = 4;
const POSTS = [-126, -42];
const LINTEL_Z = 79;
// shutter runs in front of the posts and rolls up into the box under the roof
const SH = { x: -124, y: 2, w: 84, d: 1.2, z: TZ, h: LINTEL_Z - TZ };
const RISE = 38;
// roof assembly
const ROOF: Plan = { x: -132, y: -50, w: 100, d: 58, r: 1.6 };
const BOX: Plan = { x: -128, y: 2, w: 92, d: 6, r: 0.8 };
const RZ = 86;
const RT = 4;
const SIGN = { x: -112, y: -30, w: 60, d: 3, z: RZ + RT, h: 22 };
// awning flap, hinged on the roof's front edge
const FLAP = { x: -130, y: 8, w: 96, d: 1.2, z: RZ + RT, h: 22 };
const SWING = -110;
// sketch card: two halves folded on y = FOLD
const CARD = { x: -101, w: 38, half: 17, z: LZ, t: 0.6 };
const FOLD = 34;

// delivery pallet beside the lot
const PALLET: Plan = { x: 0, y: -62, w: 112, d: 120, r: 1 };
const PZ = 9;
const COUNTER_AT: Point3 = [134, -14, PZ - LZ];
const FRAME_AT: Point3 = [134, -8, PZ - TZ];
const ROOF_AT: Point3 = [136, 48, PZ - (RZ - 7)];

export function buildNew(width = 720, height = 480): Machine {
	const P = k.fitProjection(
		[...k.boxCorners(BASE, -BASE_H - FOOT_H, 0), [-82, -30, SIGN.z + SIGN.h + 6], [-82, 8, FLAP.z + FLAP.h], [60, -58, PZ + 84]],
		width,
		height,
		{ pad: 22, azimuth: 55 },
	);
	const at = (p: Point3) => k.iso(p, P);
	const S = k.solidSvg;
	const L = k.lineSvg;
	const D = k.dotsSvg;
	type Tn = 'hi' | 'mid' | 'lo';
	type Ln = 'hi' | 'mid' | 'lo' | 'faint';
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
	const ring = (cx: number, cy: number, r: number, z: number, tone: Ln = 'lo') => L(k.ring(cx, cy, r, z, P, r > 5 ? 28 : 16), { tone });
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
	const still = 'matrix(1 0 0 1 0 0)';

	function base() {
		const out = [halo(BASE, -BASE_H - FOOT_H, BASE_H)];
		const feet = [...k.corners(BASE, 24), [-14, BASE.y + 24], [-14, BASE.y + BASE.d - 24]] as Plane[];
		for (const [x, y] of byDepth(feet)) out.push(cyl(x, y, 8, -BASE_H - FOOT_H, 1.8, 'lo', 0.4), cyl(x, y, 6, -BASE_H - FOOT_H + 1.8, FOOT_H - 1.8, 'mid', 0.3));
		out.push(S(k.slabOf(BASE, -BASE_H, BASE_H, P, 8, 1.6), { tone: 'mid', inner: L(k.sideSeam(BASE, -BASE_H / 2, P), { tone: 'faint' }) }));
		out.push(L(k.planOutline(k.insetPlan(BASE, 5), 0, P), { tone: 'lo' }));
		const screws = k.corners(BASE, 10);
		out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(''), { tone: 'lo' }), dots(screws.map(([x, y]) => [x, y, 0] as Point3), 0.5));
		for (const [x, y] of screws) out.push(flat([x - 1.3, y], [x + 1.3, y], 0));
		const strip: Plan = { x: -142, y: 61, w: 120, d: 5, r: 1 };
		out.push(slab(strip.x, strip.y, strip.w, strip.d, 0, 0.6, 'lo', { thin: true, steps: 3 }));
		const tk = k.topTicks(strip.x + 4, strip.x + strip.w - 4, 4, 5, strip.y + 0.6, 0.6, [1.6, 3], P);
		out.push(L(tk.minor, { tone: 'lo' }), L(tk.major, { tone: 'mid' }));
		const label: Plan = { x: 30, y: 60, w: 60, d: 8, r: 1.5 };
		out.push(slab(label.x, label.y, label.w, label.d, 0, 0.8, 'lo', { steps: 3 }));
		for (const [dy, w] of [[2.5, 50], [5.2, 34]] as const) out.push(flat([label.x + 5, label.y + dy], [label.x + w, label.y + dy], 0.8));
		out.push(dots([[label.x + 2.4, label.y + 4, 0.8], [label.x + label.w - 2.4, label.y + 4, 0.8]]));
		return out.join('');
	}

	function lot() {
		const out = [halo(LOT, 0, LZ)];
		out.push(S(k.slabOf(LOT, 0, LZ, P, 4, 0.8), { tone: 'lo', inner: L(k.sideSeam(LOT, LZ / 2, P, 4), { tone: 'faint' }) }));
		out.push(L(k.planOutline(k.insetPlan(LOT, 3), LZ, P), { tone: 'faint' }));
		// paving joints, edge to edge inside the kerb line
		for (let x = LOT.x + 3 + 31; x < LOT.x + LOT.w - 6; x += 31) out.push(flat([x, LOT.y + 3], [x, LOT.y + LOT.d - 3], LZ));
		for (let y = LOT.y + 3 + 37; y < LOT.y + LOT.d - 6; y += 37) out.push(flat([LOT.x + 3, y], [LOT.x + LOT.w - 3, y], LZ));
		// boundary pins at the lot's corners
		for (const [x, y] of byDepth(k.corners(LOT, 7))) out.push(cyl(x, y, 1.8, LZ, 1.6, 'mid', 0.3), dots([[x, y, LZ + 1.6]], 0.5, 'hi'));
		return out.join('');
	}

	function chalk() {
		const z = LZ + 0.05;
		const fp = k.insetPlan(CAB, -1);
		const out = [L(k.planOutline({ ...fp, r: 0 }, z, P, 2), { tone: 'hi', dashed: true, free: true })];
		// peg marks: a cross at each corner of the footprint, and the two post squares
		for (const [x, y] of k.corners(fp)) out.push(flat([x - 3, y - 3], [x + 3, y + 3], z, 'hi'), flat([x - 3, y + 3], [x + 3, y - 3], z, 'hi'));
		for (const x of POSTS) out.push(L(k.planOutline({ x: x - 1, y: -3, w: POST + 2, d: POST + 2, r: 0 }, z, P, 2), { tone: 'mid', free: true }));
		// centre line and the counter's front, measured off
		out.push(flat([-82, fp.y - 4], [-82, fp.y + fp.d + 6], z, 'mid'), flat([fp.x, fp.y + fp.d + 4], [fp.x + fp.w, fp.y + fp.d + 4], z, 'mid'));
		out.push(flat([fp.x, fp.y + fp.d + 2], [fp.x, fp.y + fp.d + 6], z, 'mid'), flat([fp.x + fp.w, fp.y + fp.d + 2], [fp.x + fp.w, fp.y + fp.d + 6], z, 'mid'));
		return stepSvg('show-from', 2, out.join(''));
	}

	function cardHalf(front: boolean) {
		const { x, w, half, z, t } = CARD;
		const y = front ? FOLD : FOLD - half;
		const top = z + t;
		const out = [slab(x, y, w, half, z, t, 'hi', { r: 0.4, thin: true, steps: 2, bevel: 0 })];
		if (front) {
			// the idea, in pencil: a little stall with an awning
			const L0 = x + 6;
			const R0 = x + w - 6;
			const yy = (f: number) => y + 2 + f * (half - 4);
			out.push(flat([L0, yy(0.1)], [R0, yy(0.1)], top, 'mid'), flat([L0 - 2, yy(0.32)], [R0 + 2, yy(0.32)], top, 'mid'), flat([L0 - 2, yy(0.32)], [L0, yy(0.1)], top, 'mid'), flat([R0 + 2, yy(0.32)], [R0, yy(0.1)], top, 'mid'));
			out.push(flat([L0, yy(0.32)], [L0, yy(1)], top, 'mid'), flat([R0, yy(0.32)], [R0, yy(1)], top, 'mid'), flat([L0, yy(0.64)], [R0, yy(0.64)], top, 'mid'), flat([L0 - 1, yy(1)], [R0 + 1, yy(1)], top, 'mid'));
			for (let i = 1; i < 4; i++) out.push(flat([L0 + ((R0 - L0) * i) / 4, yy(0.12)], [L0 - 2 + ((R0 - L0 + 4) * i) / 4, yy(0.3)], top));
		} else {
			for (const [dy, w2] of [[3, 16], [6, 12], [9, 15]] as const) out.push(flat([x + 4, y + dy], [x + 4 + w2, y + dy], top, 'lo'));
		}
		return out.join('');
	}

	function pallet() {
		const out = [halo(PALLET, 0, PZ)];
		const { x, y, w, d } = PALLET;
		for (const bx of [x + 2, x + w / 2 - 5, x + w - 12]) out.push(slab(bx, y, 10, d, 0, 2, 'lo', { r: 0.4 }));
		const blocks: Plane[] = [];
		for (const bx of [x + 2, x + w / 2 - 5, x + w - 12]) for (const by of [y + 1, y + d / 2 - 5, y + d - 11]) blocks.push([bx, by]);
		for (const [bx, by] of byDepth(blocks)) out.push(slab(bx, by, 10, 10, 2, 4, 'mid', { r: 0.6 }), dots([[bx + 5, by + 10, 4]], 0.4));
		const boards = 7;
		const bd = (d - (boards - 1) * 3) / boards;
		for (let i = 0; i < boards; i++) {
			const by = y + i * (bd + 3);
			out.push(slab(x, by, w, bd, 6, PZ - 6, 'lo', { r: 0.5, seam: 7.5 }));
			out.push(dots([[x + 7, by + bd / 2, PZ], [x + w / 2, by + bd / 2, PZ], [x + w - 7, by + bd / 2, PZ]], 0.4));
		}
		// dunnage block that props the roof's back edge
		out.push(slab(10, 0, 88, 8, PZ, 7, 'lo', { r: 0.6, seam: PZ + 3.5 }));
		return out.join('');
	}

	function counter() {
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
		for (const [i, jx] of [-114, -102, -90, -78, -66].entries()) {
			const h = [9, 11, 8, 10, 9][i];
			out.push(cyl(jx, -34, 4, TZ, h, i % 2 ? 'mid' : 'hi', 0.4), cyl(jx, -34, 3, TZ + h, 1.6, 'lo', 0.3));
		}
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

	function roof() {
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
		// sign on two legs, with its lamp
		const { x, y, w, d, z, h } = SIGN;
		for (const lx of [x + 10, x + w - 14]) out.push(slab(lx, y - 3, 4, 3, z, 10, 'lo', { r: 0.4 }));
		out.push(slab(x, y, w, d, z + 4, h - 4, 'hi', { r: 0.6, seam: z + 6 }));
		const fy = y + d;
		out.push(k.faceTextSvg(k.sideMatrix([x + w / 2, fy], z + 9, P, 'left'), 'OPEN', { size: 9, tone: 'hi', anchor: 'middle' }));
		out.push(dots([[x + 2.6, fy, z + h - 2.4], [x + w - 2.6, fy, z + h - 2.4]], 0.45));
		const [lx, ly] = [x + w / 2, y + d / 2];
		out.push(cyl(lx, ly, 3.2, z + h, 1.2, 'lo', 0.3), cyl(lx, ly, 1, z + h + 1.2, 2, 'mid', 0.2));
		out.push(stepSvg('lit-at', 4, cyl(lx, ly, 3.4, z + h + 3.2, 3.6, 'hi', 0.6, true)));
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

	// moves
	const zero: Point3 = [0, 0, 0];
	const transforms = transformsFrom(P, {
		counter: [COUNTER_AT, COUNTER_AT, zero, zero],
		frame: [FRAME_AT, FRAME_AT, zero, zero],
		shutter: [FRAME_AT, FRAME_AT, zero, [0, 0, RISE]],
		roof: [ROOF_AT, ROOF_AT, zero, zero],
	});
	const fp0: Point3 = [FLAP.x, FLAP.y + FLAP.d, FLAP.z];
	const onPallet = affine(fp0, [1, 0, 0], [0, 0, 1], ([x, y, z]) => [x + ROOF_AT[0], y + ROOF_AT[1], z + ROOF_AT[2]]);
	transforms.awning = [onPallet, onPallet, still, affine(fp0, [1, 0, 0], [0, 0, 1], turnX(FLAP.y, FLAP.z, SWING))];
	const cp0: Point3 = [CARD.x, FOLD, CARD.z + CARD.t];
	const rise = CARD.half * Math.sin(Math.PI / 3);
	const tentBack = affine(cp0, [1, 0, 0], [0, 1, 0], turnX(FOLD, cp0[2], 60, [0, 0, rise]));
	const tentFront = affine(cp0, [1, 0, 0], [0, 1, 0], turnX(FOLD, cp0[2], -60, [0, 0, rise]));
	transforms.cardBack = [tentBack, still, still, still];
	transforms.cardFront = [tentFront, still, still, still];

	// the shutter rolls up into its box: a static window cut away above the box's floor
	const hole = [at([SH.x - 1, SH.y + SH.d + 0.5, LINTEL_Z]), at([SH.x + SH.w + 1, SH.y + SH.d + 0.5, LINTEL_Z]), at([SH.x + SH.w + 1, SH.y + SH.d + 0.5, 400]), at([SH.x - 1, SH.y + SH.d + 0.5, 400])];
	const clip = `<defs><clipPath id="build-new-shutter"><path clip-rule="evenodd" d="M-2000 -2000H3000V3000H-2000Z M${hole.map(([x, y]) => `${r1(x)} ${r1(y)}`).join('L')}Z"/></clipPath></defs>`;
	const plain = (name: string, body: string) => `<g class="mover plain" data-part="${name}" transform="${transforms[name][3]}">${body}</g>`;
	const last = (n: string) => transforms[n][3];

	const svg = k.figureSvg({
		width,
		height,
		label:
			'A market kiosk raised from a flat-pack kit. An empty paved plinth stands beside a delivery pallet loaded with a counter, a frame of two posts with a rolled-down shutter, and a roof carrying a folded awning and an OPEN sign. A folded sketch card stands on the plinth, then lies flat as chalk lines mark the footprint; the counter, posts and roof lift across onto the plinth, the awning swings down, the shutter rolls up and the sign lamp lights.',
		body: [
			clip,
			base(),
			lot(),
			pallet(),
			chalk(),
			plain('cardBack', cardHalf(false)),
			plain('cardFront', cardHalf(true)),
			moverSvg('counter', last('counter'), counter()),
			moverSvg('frame', last('frame'), frame()),
			`<g clip-path="url(#build-new-shutter)">${moverSvg('shutter', last('shutter'), shutter())}</g>`,
			moverSvg('roof', last('roof'), roof()),
			moverSvg('awning', last('awning'), awning()),
		],
	});
	return { svg, labels: LABELS, transforms };
}
