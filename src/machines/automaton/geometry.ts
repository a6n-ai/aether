import * as k from '../../lib/anatomy/iso-kit';
import type { Flat, Plan, Point3, SolidPaths } from '../../lib/anatomy/iso-kit';
import { stepSvg, type Machine } from '../../lib/plate';

export const LABELS = ['parts on the bench', 'put together', 'wound once', 'reaching out'] as const;
export const CAPTION = 'Made from parts that already work, wound once, then it runs on its own. The last move is always the same: a hand held out to you.';

// A wood-and-brass automaton on a workshop stand, facing +y. Its right arm is at +x, nearest the viewer. Each arm is a
// jointed profile of flat strips in its own y-z plane, so raising it is a true turn within that plane.
const FX = -40;
const BASE: Plan = { x: -116, y: -50, w: 214, d: 100, r: 8 };
const BASE_H = 10;
const FOOT_H = 6;
const AZIMUTH = 35;

const SHOULDER_Z = 117;
const ARM_X = 23;
const LU = 30;
const LF = 27;
const READY = { u: -62, f: -2, h: -10 };
const REACH = { u: 30, f: 44, h: 36 };

const OPEN = { x0: FX - 11, x1: FX + 11, z0: 90, z1: 120 };
const CAV = { x0: FX - 14, x1: FX + 14, y0: -8, y1: 11, z0: 88, z1: 122 };
const DOOR = { x0: FX - 12, x1: FX + 12, y0: 11, y1: 13, z0: 89, z1: 121, wx0: FX - 8, wx1: FX + 8, wz0: 93, wz1: 116 };

const HEAD_Z = 135;
const TURN = 18;
const POST: [number, number] = [12, -38];
const CUP_TOP = 138;
const KEY = { x: FX + 10, z: 96, y0: -11, y1: -25, bow: 1.4 };
const DIAL = { x: FX + 10, y: 28, r: 8.5, top: 4.2 };
const TRAY: Plan = { x: 22, y: -46, w: 70, d: 92, r: 3 };
const FLOOR = 2;
const PAD: Plan = { x: -112, y: -42, w: 26, d: 76, r: 2 };

const RAD = Math.PI / 180;
const add = (a: Point3, b: Point3): Point3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: Point3, b: Point3): Point3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a: Point3, s: number): Point3 => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a: Point3, b: Point3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Point3, b: Point3): Point3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = (a: Point3) => mul(a, 1 / (Math.hypot(...a) || 1));
const X: Point3 = [1, 0, 0];
const Y: Point3 = [0, 1, 0];
const Z: Point3 = [0, 0, 1];
const rotZ = (v: Point3, deg: number): Point3 => {
	const [c, s] = [Math.cos(deg * RAD), Math.sin(deg * RAD)];
	return [v[0] * c - v[1] * s, v[0] * s + v[1] * c, v[2]];
};
const r4 = (n: number) => Math.round(n * 10000) / 10000;

/** Screen affine [a b c d e f]: x' = a x + c y + e, y' = b x + d y + f. */
type Affine = [number, number, number, number, number, number];
const compose = (m: Affine, n: Affine): Affine => [
	m[0] * n[0] + m[2] * n[1],
	m[1] * n[0] + m[3] * n[1],
	m[0] * n[2] + m[2] * n[3],
	m[1] * n[2] + m[3] * n[3],
	m[0] * n[4] + m[2] * n[5] + m[4],
	m[1] * n[4] + m[3] * n[5] + m[5],
];
const invert = (m: Affine): Affine => {
	const det = m[0] * m[3] - m[1] * m[2];
	const [a, b, c, d] = [m[3] / det, -m[1] / det, -m[2] / det, m[0] / det];
	return [a, b, c, d, -(a * m[4] + c * m[5]), -(b * m[4] + d * m[5])];
};
const fmt = (m: Affine) => `matrix(${m.map(r4).join(' ')})`;
const ID: Affine = [1, 0, 0, 1, 0, 0];

function hull(points: Flat[]): Flat[] {
	const s = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
	const turn = (o: Flat, a: Flat, b: Flat) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
	const half = (list: Flat[]) => {
		const h: Flat[] = [];
		for (const p of list) {
			while (h.length > 1 && turn(h[h.length - 2], h[h.length - 1], p) <= 0) h.pop();
			h.push(p);
		}
		return h;
	};
	return [...half(s).slice(0, -1), ...half([...s].reverse()).slice(0, -1)];
}

type Tone = 'hi' | 'mid' | 'lo';
interface Item {
	d: number;
	s: string;
}
const sorted = (items: Item[]) => [...items].sort((a, b) => a.d - b.d).map((i) => i.s).join('');
type P2 = [number, number];
const add2 = (a: P2, b: P2): P2 => [a[0] + b[0], a[1] + b[1]];
const mul2 = (a: P2, s: number): P2 => [a[0] * s, a[1] * s];
const dir2 = (deg: number): P2 => [Math.cos(deg * RAD), Math.sin(deg * RAD)];

export function automaton(width = 720, height = 480): Machine {
	const reachTip = (() => {
		const E = add2([0, SHOULDER_Z], mul2(dir2(REACH.u), LU));
		const W = add2(E, mul2(dir2(REACH.f), LF));
		return add2(add2(W, mul2(dir2(REACH.h), 25)), mul2(dir2(REACH.h + 90), 2));
	})();
	const P = k.fitProjection(
		[...k.boxCorners(BASE, -BASE_H - FOOT_H, 0), [POST[0], POST[1], 170], [FX, 0, 167], [FX + ARM_X, reachTip[0], reachTip[1] + 4], [FX + ARM_X, reachTip[0] + 4, reachTip[1]]],
		width,
		height,
		{ pad: 22, azimuth: AZIMUTH },
	);
	const cam = k.cameraOf(P);
	const V: Point3 = [cam.cosA * cam.cosE, cam.sinA * cam.cosE, cam.sinE];
	const [LX, LY] = [-cam.sinA, cam.cosA];
	const at = (p: Point3) => k.iso(p, P);
	const vec = (v: Point3) => k.axisVector(P, v);
	const depth = (p: Point3) => k.depthOf(p, P);
	const S = k.solidSvg;
	const L = k.lineSvg;
	const D = k.dotsSvg;
	const dots = (pts: Point3[], size = 0.45, tone: Tone | 'faint' = 'mid') => D(pts.map(at), { size, tone });
	const seg = (a: Point3, b: Point3, tone: Tone | 'faint' = 'faint') => L(k.segment(a, b, P), { tone, free: true });
	const poly = (pts: Point3[]) => k.pathOf(pts.map(at), true);
	const halo = (plan: Plan, z: number, h: number) => `<path class="iso-halo" d="${k.haloOf(plan, z, h, P)}"/>`;
	const slab = (x: number, y: number, w: number, d: number, z: number, h: number, tone: Tone = 'mid', o: { r?: number; steps?: number; bevel?: number; seams?: number[]; lit?: boolean; thin?: boolean } = {}) => {
		const plan: Plan = { x, y, w, d, r: o.r ?? 0.5 };
		const inner = o.seams ? L(o.seams.map((z0) => k.sideSeam(plan, z0, P, o.steps ?? 2)).join(''), { tone: 'faint' }) : '';
		return S(k.slabOf(plan, z, h, P, o.steps ?? 2, o.bevel ?? 0.25), { tone, crease: o.thin ? 'none' : 'faint', lit: o.lit, inner });
	};
	const cyl = (cx: number, cy: number, r: number, z: number, h: number, tone: Tone = 'mid', o: { bevel?: number; arcs?: number[]; knurl?: number; lit?: boolean } = {}) => {
		const lines = (o.arcs ?? []).map((z0) => k.sideArc(cx, cy, r, z0, P, 24)).join('') + (o.knurl ? k.knurl(cx, cy, r, z, z + h, o.knurl, P, 0.3) : '');
		return S(k.cylinder(cx, cy, r, z, h, P, r > 5 ? 32 : 18, o.bevel ?? 0.3), { tone, lit: o.lit, inner: lines ? L(lines, { tone: 'faint' }) : '' });
	};

	// ---- solids along any axis: a convex section swept along a vector, shaded by facing ----
	function prism(ring: Point3[], dir: Point3, capTop = false): SolidPaths {
		const n = ring.length;
		const dn = unit(dir);
		const mid = mul(ring.reduce((s, p) => add(s, p), [0, 0, 0] as Point3), 1 / n);
		const normals = ring.map((p, i) => {
			const q = ring[(i + 1) % n];
			const nn = unit(cross(sub(q, p), dn));
			return dot(nn, sub(mul(add(p, q), 0.5), mid)) < 0 ? mul(nn, -1) : nn;
		});
		const seen = normals.map((nn) => dot(nn, V) > 1e-6);
		const A = ring.map(at);
		const B = ring.map((p) => at(add(p, dir)));
		const outline = k.pathOf(hull([...A, ...B]), true);
		const tops: string[] = [];
		const shades: string[][] = [[], [], [], []];
		const paint = (pts: Flat[], nn: Point3, top = false) => {
			const d = k.pathOf(pts, true);
			if (top || nn[2] > 0.8) tops.push(d);
			else {
				const lit = (nn[0] * LX + nn[1] * LY + 1) / 2 - 0.15 * Math.max(0, -nn[2]);
				shades[Math.min(3, Math.max(0, Math.floor(lit * 4)))].push(d);
			}
		};
		normals.forEach((nn, i) => {
			if (seen[i]) paint([A[i], A[(i + 1) % n], B[(i + 1) % n], B[i]], nn);
		});
		const crease: string[] = [];
		for (const [cap, nn] of [[A, mul(dn, -1)], [B, dn]] as const) {
			if (dot(nn, V) > 1e-6) {
				paint(cap, nn, capTop);
				crease.push(k.pathOf(cap, true));
			}
		}
		for (let i = 0; i < n; i++) {
			const j = (i + n - 1) % n;
			if (seen[i] && seen[j] && dot(normals[i], normals[j]) < 0.75) crease.push(k.pathOf([A[i], B[i]]));
		}
		return { fill: outline, outline, crease: crease.join(''), top: tops.join(''), shades: shades.map((s) => s.join('')) };
	}
	const frameOf = (axis: Point3): [Point3, Point3] => {
		const a = unit(axis);
		const e1 = unit(Math.abs(a[2]) < 0.9 ? cross(a, Z) : cross(a, X));
		return [e1, cross(a, e1)];
	};
	const rodPaths = (a: Point3, b: Point3, r: number, steps = 18) => {
		const [e1, e2] = frameOf(sub(b, a));
		const ring = Array.from({ length: steps }, (_, i) => {
			const t = (i / steps) * Math.PI * 2;
			return add(a, add(mul(e1, r * Math.cos(t)), mul(e2, r * Math.sin(t))));
		});
		return prism(ring, sub(b, a));
	};
	const rodArc = (c: Point3, axis: Point3, r: number) => {
		const [e1, e2] = frameOf(axis);
		const f = Math.atan2(dot(V, e2), dot(V, e1));
		return k.pathOf(
			Array.from({ length: 19 }, (_, i) => {
				const t = f - Math.PI / 2 + (i / 18) * Math.PI;
				return at(add(c, add(mul(e1, r * Math.cos(t)), mul(e2, r * Math.sin(t)))));
			}),
		);
	};
	const rod = (a: Point3, b: Point3, r: number, tone: Tone = 'mid', o: { arcs?: number[]; lit?: boolean; steps?: number } = {}) => {
		const axis = sub(b, a);
		const inner = o.arcs?.length ? L(o.arcs.map((t) => rodArc(add(a, mul(axis, t)), axis, r)).join(''), { tone: 'faint' }) : '';
		return S(rodPaths(a, b, r, o.steps), { tone, lit: o.lit, inner });
	};
	const rodItem = (a: Point3, b: Point3, r: number, tone: Tone = 'mid', o: { arcs?: number[] } = {}): Item => ({ d: depth(mul(add(a, b), 0.5)), s: rod(a, b, r, tone, o) });
	const boxPaths = (origin: Point3, axis: Point3, len: number, e1: Point3, e2: Point3, u0: number, u1: number, v0: number, v1: number, r = 0.6) => {
		const ring = k.roundedPlan({ x: u0, y: v0, w: u1 - u0, d: v1 - v0, r }, 2).map(([u, v]) => add(origin, add(mul(e1, u), mul(e2, v))));
		return prism(ring, mul(unit(axis), len));
	};
	const face = (pts: Point3[], shade: number) => {
		const d = poly(pts);
		const shades = ['', '', '', ''];
		shades[shade] = d;
		return S({ fill: d, outline: d, crease: '', top: '', shades }, { tone: 'lo', crease: 'none' });
	};

	// ---- transforms ----
	const screenOf = (e1: Point3, e2: Point3): Affine => {
		const [a, b] = vec(e1);
		const [c, d] = vec(e2);
		return [a, b, c, d, 0, 0];
	};
	/** Screen map carrying the plane through `from` spanned by e onto the plane through `to` spanned by f: exact for that plane. */
	function pose(from: Point3, to: Point3, e: [Point3, Point3], f: [Point3, Point3]): Affine {
		const M = compose(screenOf(f[0], f[1]), invert(screenOf(e[0], e[1])));
		const [fx, fy] = at(from);
		const [tx, ty] = at(to);
		return [M[0], M[1], M[2], M[3], tx - (M[0] * fx + M[2] * fy), ty - (M[1] * fx + M[3] * fy)];
	}
	const shiftOf = (by: Point3): Affine => {
		const [x, y] = vec(by);
		return [1, 0, 0, 1, x, y];
	};
	/** A true turn by deg within the world plane (e1, e2) about c, then a world shift: the angle itself tweens, so nothing shrinks mid-turn. */
	const spin = (c: Point3, e1: Point3, e2: Point3, deg: number, by: Point3 = [0, 0, 0]) => {
		const A = screenOf(e1, e2);
		const Ai = invert(A);
		const [px, py] = at(c).map(r4);
		const [sx, sy] = vec(by).map(r4);
		return `translate(${sx} ${sy}) translate(${px} ${py}) matrix(${A.slice(0, 4).map(r4).join(' ')} 0 0) rotate(${r4(deg)}) matrix(${Ai.slice(0, 4).map(r4).join(' ')} 0 0) translate(${-px} ${-py})`;
	};
	const mover = (name: string, transform: string, body: string, pigment?: string) =>
		pigment ? `<g class="mover tint" style="--pigment:var(--${pigment})" data-part="${name}" transform="${transform}">${body}</g>` : `<g class="mover plain" data-part="${name}" transform="${transform}">${body}</g>`;

	// ---- the stand ----
	function base() {
		const out = [halo(BASE, -BASE_H - FOOT_H, BASE_H)];
		const feet = [...k.corners(BASE, 22)].sort((a, b) => depth([a[0], a[1], 0]) - depth([b[0], b[1], 0]));
		for (const [x, y] of feet) out.push(cyl(x, y, 8.5, -BASE_H - FOOT_H, 1.8, 'lo', { bevel: 0.4 }), cyl(x, y, 6.2, -BASE_H - FOOT_H + 1.8, FOOT_H - 1.8, 'mid'));
		out.push(S(k.slabOf(BASE, -BASE_H, BASE_H, P, 10, 1.6), { tone: 'mid', inner: L(k.sideSeam(BASE, -BASE_H / 2, P, 10), { tone: 'faint' }) }));
		out.push(L(k.planOutline(k.insetPlan(BASE, 5), 0, P, 10), { tone: 'lo' }), L(k.planOutline(k.insetPlan(BASE, 8), 0, P, 10), { tone: 'faint' }));
		const screws = k.corners(BASE, 11);
		out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.4, 0, P, 16)).join(''), { tone: 'lo' }), dots(screws.map(([x, y]) => [x, y, 0] as Point3), 0.55));
		for (const [x, y] of screws) out.push(L(k.lineOnTop([x - 1.4, y], [x + 1.4, y], 0, P), { tone: 'mid', free: true }));
		const fy = BASE.y + BASE.d;
		const fx = BASE.x + BASE.w;
		out.push(dots([-100, -50, 0, 50, 100].map((x) => [x, fy, -5] as Point3), 0.45), dots([-30, 0, 30].map((y) => [fx, y, -5] as Point3), 0.45));
		const rule: Plan = { x: -66, y: 41, w: 84, d: 6, r: 1 };
		out.push(S(k.slabOf(rule, 0, 0.6, P, 3), { tone: 'lo', crease: 'none' }));
		const t = k.topTicks(rule.x + 4, rule.x + rule.w - 4, 4, 5, rule.y + 0.8, 0.6, [1.8, 3.6], P);
		out.push(L(t.minor, { tone: 'lo' }), L(t.major, { tone: 'mid' }), dots([[rule.x + 2, rule.y + 3, 0.6], [rule.x + rule.w - 2, rule.y + 3, 0.6]], 0.4));
		const plate: Plan = { x: -108, y: 37, w: 30, d: 10, r: 1.5 };
		out.push(S(k.slabOf(plate, 0, 0.8, P, 3, 0.2), { tone: 'lo' }), L(k.planOutline(k.insetPlan(plate, 1.4), 0.8, P, 3), { tone: 'faint' }));
		out.push(k.faceTextSvg(k.topMatrix([plate.x + 9, plate.y + 6.6], 0.8, P, 'x'), 'a6n', { size: 5, tone: 'mid' }));
		out.push(dots([[plate.x + 3, plate.y + 5, 0.8], [plate.x + plate.w - 3, plate.y + 5, 0.8]], 0.45));
		const mount: Plan = { x: FX - 18, y: -11, w: 36, d: 25, r: 2 };
		out.push(S(k.slabOf(mount, 0, 1.5, P, 3, 0.3), { tone: 'lo' }), dots(k.corners(mount, 2.5).map(([x, y]) => [x, y, 1.5] as Point3), 0.5));
		return out.join('');
	}

	function pad() {
		const out = [S(k.slabOf(PAD, 0, 2, P, 3, 0.3), { tone: 'lo', inner: L(k.sideSeam(PAD, 1, P, 3), { tone: 'faint' }) })];
		out.push(L(k.planOutline(k.insetPlan(PAD, 2.5), 2, P, 3), { tone: 'faint' }), dots(k.corners(PAD, 2).map(([x, y]) => [x, y, 2] as Point3), 0.45));
		return out.join('');
	}

	function post() {
		const [x, y] = POST;
		const out = [halo({ x: x - 8, y: y - 8, w: 16, d: 16, r: 8 }, 0, 2)];
		out.push(cyl(x, y, 7, 0, 2, 'lo', { bevel: 0.4 }), cyl(x, y, 4, 2, 3, 'mid', { bevel: 0.4 }), cyl(x, y, 2.4, 5, CUP_TOP - 10, 'mid', { bevel: 0, arcs: [40, 80, 118] }));
		out.push(slab(x - 5, y - 4, 10, 8, 98, 6, 'mid', { r: 1.4, seams: [101] }), rod([x + 5, y, 101], [x + 8, y, 101], 1, 'mid'), rod([x + 8, y, 101], [x + 10.4, y, 101], 2.2, 'hi'));
		out.push(cyl(x, y, 3.6, CUP_TOP - 5, 2, 'mid'), cyl(x, y, 8, CUP_TOP - 3, 3, 'hi', { bevel: 0.5 }), L(k.ring(x, y, 6.4, CUP_TOP, P, 28), { tone: 'lo' }));
		return out.join('');
	}

	// ---- the figure ----
	function legs() {
		const leg = (x: number) => {
			const out = [slab(x - 5, -7, 10, 17, 1.5, 4, 'mid', { r: 2.4, steps: 3, bevel: 0.4, seams: [3.5] }), dots([[x - 2.5, 7, 5.5], [x + 2.5, 7, 5.5]], 0.45, 'hi')];
			out.push(cyl(x, 0, 4.2, 5.5, 3, 'mid', { bevel: 0.4 }), cyl(x, 0, 3.4, 8.5, 24.5, 'hi', { bevel: 0, arcs: [14, 27] }));
			out.push(cyl(x, 0, 4.8, 33, 5, 'mid', { bevel: 0.5, knurl: 16 }), cyl(x, 0, 4, 38, 20, 'hi', { bevel: 0, arcs: [44, 52] }), cyl(x, 0, 5, 58, 4, 'mid', { bevel: 0.5 }));
			return out.join('');
		};
		return leg(FX - 8.5) + leg(FX + 8.5);
	}

	function trunk() {
		const out: string[] = [];
		out.push(slab(FX - 15, -7, 30, 14, 62, 8, 'mid', { r: 2, steps: 3, bevel: 0.5, seams: [66] }));
		out.push(dots([[FX - 12, 7, 66], [FX + 12, 7, 66], [FX + 15, -4, 66], [FX + 15, 4, 66]], 0.45, 'hi'));
		out.push(slab(FX - 14, -9, 28, 18, 70, 16, 'mid', { r: 2.5, steps: 3, bevel: 0.6, seams: [74, 82] }));
		out.push(dots([-9, -3, 3, 9].map((dx) => [FX + dx, 9, 78] as Point3), 0.45, 'hi'));
		const chest: Plan = { x: FX - 17, y: -11, w: 34, d: 22, r: 2 };
		out.push(S(k.slabOf(chest, 86, 38, P, 3, 0.8), { tone: 'mid', inner: L(k.sideSeam(chest, 88.5, P, 3), { tone: 'faint' }) }));
		const sx = FX + 17;
		out.push(slab(sx, -8, 1, 16, 92, 26, 'hi', { r: 0.5, thin: true }));
		const f = sx + 1;
		out.push(L(poly([[f, -6, 94], [f, 6, 94], [f, 6, 116], [f, -6, 116]]), { tone: 'lo' }));
		out.push(L(k.sideRing([f, 0, 103], 4.2, 'x', P, 28) + k.sideRing([f, 0, 103], 2.2, 'x', P, 20), { tone: 'mid' }), dots([[f, 0, 103]], 0.55, 'hi'));
		out.push(dots([[f, -6, 94], [f, 6, 94], [f, -6, 116], [f, 6, 116]], 0.4));
		for (const [x0, z0] of [[FX - 17, 120], [FX + 13, 120], [FX - 17, 86.6], [FX + 13, 86.6]] as const) {
			out.push(slab(x0, 11, 4, 0.6, z0, 3.4, 'hi', { r: 0.4, thin: true }), dots([[x0 + 2, 11.6, z0 + 1.7]], 0.4, 'mid'));
		}
		for (const z0 of [92, 112]) out.push(slab(FX - 15.6, 11, 3, 0.4, z0, 6, 'hi', { r: 0.3, thin: true }), dots([[FX - 14.1, 11.4, z0 + 1.6], [FX - 14.1, 11.4, z0 + 4.4]], 0.35));
		return out.join('');
	}

	// shoulder socket on the chest side and the pin the arm strip turns on
	const shoulder = (side: 1 | -1) => {
		const at0 = (dx: number): Point3 => [FX + side * dx, 0, SHOULDER_Z];
		const [a, b] = side > 0 ? [at0(17), at0(19.5)] : [at0(19.5), at0(17)];
		const [c, d] = side > 0 ? [at0(19.5), at0(ARM_X - 0.75)] : [at0(ARM_X - 0.75), at0(19.5)];
		return rod(a, b, 5.8, 'mid') + rod(c, d, 2.4, 'hi');
	};

	function yoke() {
		const out = [slab(FX - 19, -12, 38, 24, 124, 4, 'mid', { r: 2.5, steps: 3, bevel: 0.6, seams: [126] })];
		out.push(dots([[FX - 16, 9, 128], [FX + 16, 9, 128], [FX + 16, -9, 128]], 0.45, 'hi'));
		out.push(cyl(FX, 0, 8, 128, 3, 'hi', { bevel: 0.4, knurl: 28 }), cyl(FX, 0, 4.5, 131, 4, 'mid', { bevel: 0, arcs: [133] }));
		return out.join('');
	}

	// gears and the mainspring behind the chest door
	const BAR = { at: [FX - 5, -1] as P2, r: 6 };
	const GA = { at: [FX + 5.4, 0.5] as P2 };
	const GB = { at: [FX - 3, 5.5] as P2 };
	const CAM = { at: [FX - 10, 2] as P2 };
	const gearRing = (cx: number, cy: number, r: number, teeth: number, deep = 1) => {
		const out: P2[] = [];
		for (let i = 0; i < teeth; i++) {
			const a = (i / teeth) * Math.PI * 2;
			const s = (Math.PI * 2) / teeth;
			for (const [f, rr] of [[0, r - deep], [0.22, r], [0.5, r], [0.72, r - deep]] as const) out.push([cx + rr * Math.cos(a + f * s), cy + rr * Math.sin(a + f * s)]);
		}
		return out;
	};
	const gear = (cx: number, cy: number, r: number, teeth: number, z: number, h: number, tone: Tone = 'hi') => S(k.extrude(gearRing(cx, cy, r, teeth, r > 4 ? 1 : 0.7), z, h, P, { convex: false }), { tone, crease: 'none' });
	const spinXY = (c: P2, z: number, deg: number) => spin([c[0], c[1], z], X, Y, deg);
	const turns = { barrel: -24, wheelA: 0, wheelB: 0, cams: 40 };
	turns.wheelA = (-turns.barrel * 30) / 8;
	turns.wheelB = (-turns.wheelA * 26) / 7;
	const gearSteps = (deg: number) => [0, 0, deg, deg];

	function cavity() {
		const { x0, x1, y0, y1, z0, z1 } = CAV;
		const out: string[] = [];
		out.push(face([[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]], 1));
		for (const x of [FX - 7, FX, FX + 7]) out.push(seg([x, y0, z0], [x, y0, z1], 'faint'));
		out.push(face([[x0, y0, z0], [x0, y1, z0], [x0, y1, z1], [x0, y0, z1]], 0));
		out.push(face([[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]], 2));
		const items: { z: number; d: number; s: string }[] = [];
		const put = (z: number, c: P2, s: string) => items.push({ z, d: depth([c[0], c[1], 0]), s });
		const arbor = (c: P2, za: number, zb: number) => put(za, c, cyl(c[0], c[1], 0.7, za, zb - za, 'mid', { bevel: 0 }));
		const [bx, by] = BAR.at;
		arbor(BAR.at, z0, 89);
		const spiral = k.pathOf(
			Array.from({ length: 80 }, (_, i) => {
				const t = i / 79;
				const a = t * Math.PI * 2 * 3.2;
				const r = 1.8 + t * 4.2;
				return at([bx + r * Math.cos(a), by + r * Math.sin(a), 98]);
			}),
		);
		const barrel =
			cyl(bx, by, BAR.r, 89, 7.5, 'mid', { bevel: 0.3, arcs: [92.5] }) +
			gear(bx, by, 7.4, 30, 96.5, 1.5) +
			L(spiral, { tone: 'lo', free: true }) +
			S(k.extrude(gearRing(bx, by, 2.6, 10, 0.6), 98, 1, P, { convex: false }), { tone: 'mid', crease: 'none' }) +
			dots([[bx, by, 99]], 0.5, 'hi');
		put(89, BAR.at, mover('barrel', spinXY(BAR.at, 94, turns.barrel), barrel, 'verdigris'));
		arbor(BAR.at, 99, z1);
		const [ax, ay] = GA.at;
		arbor(GA.at, z0, 96.4);
		const spokes = [0, 1, 2, 3].map((i) => k.lineOnTop([ax + 1.8 * Math.cos(i * 1.571), ay + 1.8 * Math.sin(i * 1.571)], [ax + 5.8 * Math.cos(i * 1.571), ay + 5.8 * Math.sin(i * 1.571)], 103.4, P)).join('');
		const wheelA = gear(ax, ay, 2.6, 8, 96.4, 1.8, 'mid') + cyl(ax, ay, 0.9, 98.2, 3.8, 'mid', { bevel: 0 }) + gear(ax, ay, 7.4, 26, 102, 1.4) + L(spokes + k.ring(ax, ay, 5.8, 103.4, P, 30), { tone: 'lo' }) + cyl(ax, ay, 1.6, 103.4, 1, 'mid');
		put(96.4, GA.at, mover('wheel-a', spinXY(GA.at, 100, turns.wheelA), wheelA, 'verdigris'));
		arbor(GA.at, 104.4, z1);
		const [gx, gy] = GB.at;
		arbor(GB.at, z0, 102);
		const wheelB = gear(gx, gy, 2.2, 7, 102, 1.4, 'mid') + cyl(gx, gy, 0.8, 103.4, 3.6, 'mid', { bevel: 0 }) + gear(gx, gy, 5.4, 20, 107, 1.2) + L(k.ring(gx, gy, 3.8, 108.2, P, 24), { tone: 'lo' }) + cyl(gx, gy, 1.3, 108.2, 0.8, 'mid');
		put(102, GB.at, mover('wheel-b', spinXY(GB.at, 105, turns.wheelB), wheelB, 'verdigris'));
		arbor(GB.at, 109, z1);
		const [cx, cy] = CAM.at;
		arbor(CAM.at, z0, 100.5);
		const cams = [0, 120, 240].map((a, i) => cyl(cx + 1.1 * Math.cos(a * RAD), cy + 1.1 * Math.sin(a * RAD), 3, 100.5 + i * 2.6, 1.6, 'hi', { bevel: 0.2 })).join('') + cyl(cx, cy, 0.8, 108.3, 0.6, 'mid', { bevel: 0 });
		put(100.5, CAM.at, mover('cams', spinXY(CAM.at, 104, turns.cams), cams, 'verdigris'));
		arbor(CAM.at, 108.9, z1);
		items.sort((a, b) => a.z - b.z || a.d - b.d);
		out.push(...items.map((i) => i.s));
		out.push(face([[OPEN.x0, 8, OPEN.z0], [OPEN.x0, 11, OPEN.z0], [OPEN.x0, 11, OPEN.z1], [OPEN.x0, 8, OPEN.z1]], 2));
		out.push(face([[OPEN.x0, 8, OPEN.z0], [OPEN.x1, 8, OPEN.z0], [OPEN.x1, 11, OPEN.z0], [OPEN.x0, 11, OPEN.z0]], 3));
		const clip = poly([[OPEN.x0, 11, OPEN.z0], [OPEN.x1, 11, OPEN.z0], [OPEN.x1, 11, OPEN.z1], [OPEN.x0, 11, OPEN.z1]]);
		return `<defs><clipPath id="automaton-cavity"><path d="${clip}"/></clipPath></defs><g clip-path="url(#automaton-cavity)">${out.join('')}</g>`;
	}

	function door() {
		const { x0, x1, y0, z0, z1, wx0, wx1, wz0, wz1 } = DOOR;
		const t = DOOR.y1 - DOOR.y0;
		const out: string[] = [];
		out.push(slab(wx0, y0, wx1 - wx0, t, wz1, z1 - wz1, 'hi', { r: 0.3, bevel: 0.3 }), slab(wx0, y0, wx1 - wx0, t, z0, wz0 - z0, 'hi', { r: 0.3, bevel: 0.3 }));
		out.push(slab(x0, y0, wx0 - x0, t, z0, z1 - z0, 'hi', { r: 0.4, bevel: 0.3 }), slab(wx1, y0, x1 - wx1, t, z0, z1 - z0, 'hi', { r: 0.4, bevel: 0.3 }));
		const f = DOOR.y1;
		out.push(L(poly([[wx0 - 1.2, f, wz0 - 1.2], [wx1 + 1.2, f, wz0 - 1.2], [wx1 + 1.2, f, wz1 + 1.2], [wx0 - 1.2, f, wz1 + 1.2]]), { tone: 'faint' }));
		out.push(dots([[x0 + 2, f, z0 + 2], [x1 - 2, f, z0 + 2], [x0 + 2, f, z1 - 2], [x1 - 2, f, z1 - 2]], 0.45, 'mid'));
		out.push(rod([x1 - 2, f, 105], [x1 - 2, f + 1.8, 105], 0.9, 'mid'), rod([x1 - 2, f + 1.8, 105], [x1 - 2, f + 3, 105], 1.8, 'hi'));
		return out.join('');
	}
	const hinges = () => [92, 112].map((z0) => cyl(DOOR.x0 - 0.8, 12.2, 1.2, z0, 6, 'hi', { bevel: 0.2, arcs: [z0 + 3] }) + dots([[DOOR.x0 - 0.8, 12.2, z0 + 6]], 0.4)).join('');

	const keyBack = () => rod([KEY.x, KEY.y0 - 2, KEY.z], [KEY.x, KEY.y0, KEY.z], 2.6, 'mid') + rod([KEY.x, KEY.y1, KEY.z], [KEY.x, KEY.y0 - 2, KEY.z], 1.1, 'hi', { arcs: [0.5] });
	const keyBow = () => {
		const o: Point3 = [KEY.x, KEY.y1, KEY.z];
		return S(boxPaths(o, [0, -1, 0], KEY.bow, X, Z, -7.5, 7.5, -2.8, 2.8, 2.6), { tone: 'hi' }) + rod([KEY.x, KEY.y1 + 0.6, KEY.z], [KEY.x, KEY.y1, KEY.z], 2, 'mid') + L(k.sideRing([KEY.x - 4.8, KEY.y1, KEY.z], 1.2, 'y', P, 14) + k.sideRing([KEY.x + 4.8, KEY.y1, KEY.z], 1.2, 'y', P, 14), { tone: 'lo' });
	};

	// the head: a turned block; the face plate is its own group so the head can turn toward the hand
	const headAxis: Point3 = [FX, 0, 0];
	const faceDir = rotZ(Y, -TURN);
	const faceTan = rotZ(X, -TURN);
	const faceC: Point3 = add([FX, 0, 146.5], mul(faceDir, 9.5));
	function head() {
		const z = HEAD_Z;
		const out = [cyl(FX, 0, 6.5, z, 2, 'mid', { bevel: 0.3 }), cyl(FX, 0, 9.5, z + 2, 17, 'hi', { bevel: 0.3, arcs: [z + 6, z + 15] })];
		const [vx, vy] = k.towardViewer(P);
		const side = Math.atan2(vy, vx);
		out.push(dots([0.9, 1.25].map((a) => [FX + 9.5 * Math.cos(side + a), 9.5 * Math.sin(side + a), z + 10.5] as Point3), 0.5, 'mid'));
		out.push(cyl(FX, 0, 10.3, z + 19, 2.5, 'mid', { bevel: 0.4, knurl: 36 }), cyl(FX, 0, 7.8, z + 21.5, 3, 'hi', { bevel: 0.6 }), L(k.ring(FX, 0, 5.6, z + 24.5, P, 28), { tone: 'faint' }));
		out.push(cyl(FX, 0, 1.8, z + 24.5, 3.5, 'mid', { bevel: 0 }), cyl(FX, 0, 3, z + 28, 2.4, 'hi', { bevel: 0.6 }), dots([[FX, 0, z + 30.4]], 0.5, 'hi'));
		return out.join('');
	}
	function facePlate() {
		const out = [S(boxPaths(faceC, faceDir, 1.2, faceTan, Z, -6, 6, -6.5, 6.5, 2), { tone: 'hi' })];
		const p = (u: number, v: number): Point3 => add(add(faceC, mul(faceDir, 1.2)), add(mul(faceTan, u), [0, 0, v]));
		const slot = [p(-4.6, -3.6), p(4.6, -3.6), p(4.6, -1.8), p(-4.6, -1.8)];
		out.push(face(slot, 0), L(poly(slot), { tone: 'lo' }));
		for (const u of [-2.9, 2.9]) {
			const ring = (r: number) => k.pathOf(Array.from({ length: 16 }, (_, i) => at(p(u + r * Math.cos((i / 16) * Math.PI * 2), 2.4 + r * Math.sin((i / 16) * Math.PI * 2)))), true);
			out.push(L(ring(1.5), { tone: 'mid' }), L(ring(0.7), { tone: 'lo' }), D([at(p(u, 2.4))], { size: 0.55, tone: 'hi' }));
		}
		out.push(L(k.pathOf([at(p(-5, 5)), at(p(5, 5))]), { tone: 'faint' }), dots([p(-4.6, -5.4), p(4.6, -5.4), p(-4.6, 5.6), p(4.6, 5.6)], 0.35));
		return out.join('');
	}

	// An arm: wooden strips joined by brass bolts, all in the plane x = xa. (y, z) points describe it.
	function arm(side: 1 | -1, a: { u: number; f: number; h: number }, pointing: boolean) {
		const xa = FX + side * ARM_X;
		const T = 0.75;
		const p3 = ([y, z]: P2, x = xa): Point3 => [x, y, z];
		const Sh: P2 = [0, SHOULDER_Z];
		const E = add2(Sh, mul2(dir2(a.u), LU));
		const W = add2(E, mul2(dir2(a.f), LF));
		const plate = (pts: P2[], tone: Tone = 'hi', o: { lit?: boolean; inner?: string } = {}) => S(prism(pts.map((q) => p3(q, xa - T)), [2 * T, 0, 0], true), { tone, lit: o.lit, inner: o.inner });
		const stadium = (A: P2, B: P2, hw: number): P2[] => {
			const d = Math.atan2(B[1] - A[1], B[0] - A[0]);
			const arc = (c: P2, from: number) => Array.from({ length: 9 }, (_, i) => add2(c, mul2(dir2(from + (180 * i) / 8), hw)));
			return [...arc(B, d / RAD - 90), ...arc(A, d / RAD + 90)];
		};
		const rounded = (o: P2, deg: number, t0: number, t1: number, v0: number, v1: number, r: number): P2[] => {
			const [ux, uy] = dir2(deg);
			return k.roundedPlan({ x: t0, y: v0, w: t1 - t0, d: v1 - v0, r }, 3).map(([t, v]) => [o[0] + t * ux - v * uy, o[1] + t * uy + v * ux] as P2);
		};
		const holes = (A: P2, B: P2, from: number, to: number) => {
			const len = Math.hypot(B[0] - A[0], B[1] - A[1]);
			const out: string[] = [];
			for (let t = from; t <= len - to + 1e-6; t += 4.2) out.push(k.sideRing(p3(add2(A, mul2([(B[0] - A[0]) / len, (B[1] - A[1]) / len], t)), xa + T), 0.85, 'x', P, 12));
			return L(out.join(''), { tone: 'lo' });
		};
		const bolt = (c: P2, r: number) => rod(p3(c, xa + T), p3(c, xa + T + 1), r, 'mid', { steps: 6 }) + L(k.sideRing(p3(c, xa + T + 1), r * 0.5, 'x', P, 12), { tone: 'lo' }) + dots([p3(c, xa + T + 1)], 0.45, 'hi');
		const upper = plate(stadium(Sh, E, 4.4), 'hi', { inner: holes(Sh, E, 8.4, 8.4) }) + bolt(Sh, 2.6);
		// hand, in its own (t, v) frame from the wrist
		const hd = a.h;
		const hp = (t: number, v: number): P2 => add2(W, add2(mul2(dir2(hd), t), mul2(dir2(hd + 90), v)));
		const hand: string[] = [plate(rounded(W, hd, 0, 11.5, -4.6, 2.8, 1.8)), plate(rounded(hp(4.2, 2.2), hd + 52, 0, 8, -1.2, 1.2, 1.1))];
		let tip: P2;
		if (pointing) {
			const grooves = L([-1.2, -2.4, -3.6].map((v) => k.pathOf([at(p3(hp(9.5, v), xa + T)), at(p3(hp(14.4, v), xa + T))])).join(''), { tone: 'faint' });
			hand.push(plate(rounded(W, hd, 9.5, 14.4, -4.8, 0.2, 1), 'hi', { inner: grooves }));
			hand.push(plate(rounded(W, hd, 10, 19.6, 0.8, 3.2, 1.1)));
			hand.push(L(k.pathOf([at(p3(hp(15, 0.8), xa + T)), at(p3(hp(15, 3.2), xa + T))]), { tone: 'faint' }));
			hand.push(stepSvg('lit-at', 4, plate(rounded(W, hd, 19.2, 25, 0.9, 3.1, 1.1), 'hi', { lit: true })));
			tip = hp(25, 2);
		} else {
			const grooves = L([-2.3, -0.8, 0.7].map((v) => k.pathOf([at(p3(hp(10, v), xa + T)), at(p3(hp(20.5, v), xa + T))])).join(''), { tone: 'faint' });
			hand.push(plate(rounded(W, hd, 10, 20.5, -3.8, 2.2, 1.2), 'hi', { inner: grooves }));
			tip = hp(20.5, 0);
		}
		const fore = plate(stadium(E, W, 3.7), 'hi', { inner: holes(E, W, 8.4, 7) }) + hand.join('') + bolt(W, 1.8) + bolt(E, 2.4);
		const corners2 = [...stadium(Sh, E, 4.4), ...stadium(E, W, 3.7), ...rounded(W, hd, 0, 25, -4.8, 3.2, 1)];
		return { upper, fore, Sh: p3(Sh), E: p3(E), W: p3(W), tip: p3(tip), pts: corners2.map((q) => p3(q)) };
	}

	// a slotted rest block that holds an arm upright on its edge
	const rest = (x: number, y: number, top: number) => slab(x - 4, y - 3, 8, 6, FLOOR, top - FLOOR, 'mid', { r: 1, seams: [top - 3] }) + L(k.lineOnTop([x - 1, y - 3], [x - 1, y + 3], top, P) + k.lineOnTop([x + 1, y - 3], [x + 1, y + 3], top, P), { tone: 'lo' });

	// ---- motion ----
	const right = arm(1, REACH, true);
	const left = arm(-1, READY, false);
	const rightReady = arm(1, READY, true);
	const lowest = (pts: Point3[]) => Math.min(...pts.map((p) => p[2]));
	const trayShift: Point3 = [52 - right.Sh[0], -30, FLOOR - lowest(rightReady.pts)];
	const padShift: Point3 = [-99 - left.Sh[0], -34, 2 - lowest(left.pts)];
	const restAt = (armPts: { E: Point3 }, by: Point3) => {
		const e = add(armPts.E, by);
		return { x: e[0], y: e[1] + 4, top: e[2] - 3.7 - 0.2 };
	};
	const rightRest = restAt(rightReady, trayShift);
	const leftRest = restAt(left, padShift);
	const dU = READY.u - REACH.u;
	const dF = READY.f - REACH.f;
	const doorAxis: Point3 = [DOOR.x0 - 0.8, 12.2, 105];
	const doorOpen = pose(doorAxis, doorAxis, [X, Z], [rotZ(X, 100), Z]);
	const faceBack = pose(faceC, add(headAxis, rotZ(sub(faceC, headAxis), TURN)), [faceTan, Z], [rotZ(faceTan, TURN), Z]);
	const headShift: Point3 = [POST[0] - FX, POST[1], CUP_TOP - HEAD_Z];
	const keyC: Point3 = [KEY.x, KEY.y1 - KEY.bow / 2, KEY.z];
	const dialC: Point3 = [DIAL.x, DIAL.y, DIAL.top];
	const NEEDLE = 1.75;
	const O: Point3 = [0, 0, 0];

	const transforms: Record<string, string[]> = {
		'arm-left': [padShift, O, O, O].map((p) => fmt(shiftOf(p))),
		'arm-right': [
			spin(right.Sh, Y, Z, dU, trayShift),
			spin(right.Sh, Y, Z, dU),
			spin(right.Sh, Y, Z, dU),
			spin(right.Sh, Y, Z, 0),
		],
		forearm: [dF - dU, dF - dU, dF - dU, 0].map((d) => spin(right.E, Y, Z, d)),
		door: [doorOpen, ID, ID, ID].map(fmt),
		head: [headShift, O, O, O].map((p) => fmt(shiftOf(p))),
		face: [faceBack, faceBack, faceBack, ID].map(fmt),
		key: [0, 0, 90, 90].map((d) => spin(keyC, X, Z, d)),
		barrel: gearSteps(turns.barrel).map((d) => spinXY(BAR.at, 94, d)),
		'wheel-a': gearSteps(turns.wheelA).map((d) => spinXY(GA.at, 100, d)),
		'wheel-b': gearSteps(turns.wheelB).map((d) => spinXY(GB.at, 105, d)),
		cams: gearSteps(turns.cams).map((d) => spinXY(CAM.at, 104, d)),
		needle: [(-2 * NEEDLE) / RAD, (-2 * NEEDLE) / RAD, 0, 0].map((d) => spin(dialC, X, Y, d)),
	};
	const T4 = (name: string) => transforms[name][3];

	function dial() {
		const { x, y, r, top } = DIAL;
		const out = [halo({ x: x - r - 2, y: y - r - 2, w: 2 * r + 4, d: 2 * r + 4, r: r + 2 }, 0, 1.2)];
		out.push(cyl(x, y, r + 1.6, 0, 1.2, 'lo', { bevel: 0.3 }), cyl(x, y, r, 1.2, 3, 'mid', { bevel: 0.6, knurl: 40 }), L(k.ring(x, y, r - 1.4, top, P, 40), { tone: 'lo' }));
		const t = k.radialTicks(x, y, r - 1.8, 14, 7, top, [0.9, 1.8], P, -NEEDLE, NEEDLE * 2);
		out.push(L(t.minor, { tone: 'lo' }), L(t.major, { tone: 'mid' }));
		const band = (from: number, to: number, ra: number, rb: number): Point3[] => {
			const arc = (rr: number, f: number, g: number) =>
				Array.from({ length: 9 }, (_, i) => {
					const a = f + ((g - f) * i) / 8;
					return [x + rr * Math.sin(a), y - rr * Math.cos(a), top] as Point3;
				});
			return [...arc(ra, from, to), ...arc(rb, to, from)];
		};
		out.push(stepSvg('show-from', 3, face(band(NEEDLE - 0.55, NEEDLE + 0.05, r - 5.2, r - 3.6), 0)));
		return out.join('');
	}
	const needle = () => {
		const { x, y, r, top } = DIAL;
		return L(k.lineOnTop([x - Math.sin(NEEDLE) * 1.8, y + Math.cos(NEEDLE) * 1.8], [x + Math.sin(NEEDLE) * (r - 3), y - Math.cos(NEEDLE) * (r - 3)], top + 0.2, P), { tone: 'hi', free: true });
	};
	const hub = () => cyl(DIAL.x, DIAL.y, 1.3, DIAL.top, 0.8, 'hi', { bevel: 0.2 });

	const TW = 2.5;
	const TH = 4.5;
	function trayBack() {
		const { x, y, w, d } = TRAY;
		const out = [halo(TRAY, 0, 2), S(k.slabOf(TRAY, 0, FLOOR, P, 3, 0.3), { tone: 'lo' }), L(k.planOutline(k.insetPlan(TRAY, 6), FLOOR, P, 3), { tone: 'faint' })];
		out.push(slab(x, y, w, TW, FLOOR, TH, 'mid', { r: 0.6 }), slab(x, y + TW, TW, d - 2 * TW, FLOOR, TH, 'mid', { r: 0.6 }));
		const tools: Item[] = [];
		tools.push({ d: depth([78, 26, 0]), s: gear(78, 26, 8, 22, FLOOR, 1.6) + cyl(78, 26, 2.4, FLOOR + 1.6, 1.2, 'mid') + L(k.ring(78, 26, 5.4, FLOOR + 1.6, P, 30), { tone: 'lo' }) + dots([[78, 26, FLOOR + 2.8]], 0.5, 'hi') });
		for (const [sx, sy] of [[72, -26], [78, -31], [84, -25]] as const) tools.push({ d: depth([sx, sy, 0]), s: cyl(sx, sy, 1.6, FLOOR, 1.1, 'hi', { bevel: 0.2 }) + L(k.lineOnTop([sx - 1, sy], [sx + 1, sy], FLOOR + 1.1, P), { tone: 'lo', free: true }) });
		tools.push({ d: depth([82, -8, 0]), s: cyl(82, -8, 5, FLOOR, 9, 'mid', { arcs: [FLOOR + 3, FLOOR + 7] }) + cyl(82, -8, 3.4, FLOOR + 9, 2, 'hi', { bevel: 0.4 }) + rod([82, -6, FLOOR + 10.5], [82, 4, FLOOR + 16], 0.7, 'mid') + cyl(82, -8, 1.6, FLOOR + 11, 1.6, 'mid') });
		const sd = 66;
		tools.push({ d: depth([sd, 0, 0]), s: sorted([rodItem([sd, -22, FLOOR + 3], [sd, -4, FLOOR + 3], 3, 'hi', { arcs: [0.2, 0.8] }), rodItem([sd, -4, FLOOR + 3], [sd, -1, FLOOR + 3], 1.8, 'mid'), rodItem([sd, -1, FLOOR + 3], [sd, 20, FLOOR + 3], 0.8, 'mid')]) + S(boxPaths([sd, 20, FLOOR + 3], Y, 2.6, X, Z, -1.2, 1.2, -0.4, 0.4, 0.2), { tone: 'hi' }) });
		out.push(sorted(tools), rest(rightRest.x, rightRest.y, rightRest.top));
		return out.join('');
	}
	function trayFront() {
		const { x, y, w, d } = TRAY;
		return slab(x + w - TW, y + TW, TW, d - 2 * TW, FLOOR, TH, 'mid', { r: 0.6 }) + slab(x, y + d - TW, w, TW, FLOOR, TH, 'mid', { r: 0.6 }) + dots([[x + 4, y + d, FLOOR + 2.2], [x + w - 4, y + d, FLOOR + 2.2], [x + w, y + 4, FLOOR + 2.2], [x + w, y + d - 4, FLOOR + 2.2]], 0.4);
	}

	const body = [
		base(),
		pad(),
		rest(leftRest.x, leftRest.y, leftRest.top),
		post(),
		keyBack(),
		mover('key', T4('key'), keyBow(), 'verdigris'),
		mover('arm-left', T4('arm-left'), left.upper + left.fore),
		shoulder(-1),
		legs(),
		trunk(),
		cavity(),
		mover('door', T4('door'), door()),
		hinges(),
		shoulder(1),
		yoke(),
		mover('head', T4('head'), head() + mover('face', T4('face'), facePlate())),
		dial(),
		mover('needle', T4('needle'), needle(), 'verdigris'),
		hub(),
		trayBack(),
		trayFront(),
		mover('arm-right', T4('arm-right'), right.upper + mover('forearm', T4('forearm'), right.fore)),
	];

	const svg = k.figureSvg({
		width,
		height,
		label:
			'A wood-and-brass automaton standing on a workshop stand beside a tool tray and an empty head rest. Its chest door shows the wound mainspring and gears through a window and the gauge on the stand reads full. It raises its right arm up and out across its chest, hand open with the index finger extended toward you and its fingertip lit, while its head turns toward the hand.',
		body,
	});
	return { svg, labels: LABELS, transforms };
}
