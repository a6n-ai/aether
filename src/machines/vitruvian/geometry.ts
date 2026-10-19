import * as k from '../../lib/anatomy/iso-kit';
import type { Flat, Plan, Point3, SolidPaths } from '../../lib/anatomy/iso-kit';
import { moverSvg, stepSvg, type Machine } from '../../lib/plate';

export const LABELS = ['your measure taken', 'built to fit', 'every part in proportion', 'reaching out'] as const;
export const CAPTION = 'We take your measure first, then build to fit: every part in proportion to your business. The last move is always the same: a hand held out to you.';

// A jointed wood-and-brass Vitruvian man facing +x, the viewer. His limbs are flat strips in the plane x = 0, posed with
// screen affines so a limb turns truly within its plane. Behind him stand the square (x -4.5..-1.5) and the ring (x -8..-5):
// the groin is the square's centre and the navel the ring's (as seen from his hands' plane). +y is the viewer's left, so
// his right arm is at +y. Leonardo's numbers: arm span equals height (180), navel at 0.6 of it, shoulders at 0.84.
const AZIMUTH = 20;
const ELEVATION = 20;
const G = 10; // soles, and the square's inner bottom edge
const NAVEL = G + 108;
const BASE: Plan = { x: -102, y: -136, w: 138, d: 272, r: 8 };
const BASE_H = 12;
const FOOT_H = 6;

const SQ = { x0: -4.5, x1: -1.5, inner: 90, outer: 95, top: G + 180 };
const RING = { x0: -8, x1: -5, ri: 105.5, ro: 110.5, R: 108 };
const RING_BACK = -62;
const TORSO = { x0: -8, x1: -1.2 };
const T = 0.6;

const SHOULDER = { y: 22, z: 162 };
const HIP = { y: 8, z: 106 };
const LU = 28;
const LF = 21.2;
const LT = 47;
const LS = 44;
const SPREAD = 22;
const REACH = { psi: 35, u: 18, f: 10 };
const TURN = 20;

const STAFF: [number, number] = [11, -124];
const XD = 16;
const DIV = 50;

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
const NY: Point3 = [0, -1, 0];
const O: Point3 = [0, 0, 0];
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
type P2 = [number, number];
const add2 = (a: P2, b: P2): P2 => [a[0] + b[0], a[1] + b[1]];
const mul2 = (a: P2, s: number): P2 => [a[0] * s, a[1] * s];
const dir2 = (deg: number): P2 => [Math.cos(deg * RAD), Math.sin(deg * RAD)];

/** A limb's plane: 2D (t, v) is o + e t + Z v, and s is the offset toward the viewer along n. */
interface Frame {
	o: Point3;
	e: Point3;
	n: Point3;
}
const at3 = (F: Frame, [t, v]: P2, s = 0): Point3 => add(F.o, add(add(mul(F.e, t), mul(Z, v)), mul(F.n, s)));
const frameAt = (o: Point3, e: Point3): Frame => ({ o, e, n: unit(cross(e, Z)).map((c, i) => (i === 0 ? Math.abs(c) : c)) as Point3 });

function solve(f: (x: number) => number, a: number, b: number) {
	let fa = f(a);
	if (Math.sign(fa) === Math.sign(f(b))) return null;
	for (let i = 0; i < 48; i++) {
		const m = (a + b) / 2;
		const fm = f(m);
		if (Math.sign(fm) === Math.sign(fa)) [a, fa] = [m, fm];
		else b = m;
	}
	return (a + b) / 2;
}

export function vitruvian(width = 720, height = 640): Machine {
	// the screen-still direction: a point moved along it does not move on screen
	const W3: Point3 = [1, Math.tan(AZIMUTH * RAD), Math.tan(ELEVATION * RAD) / Math.cos(AZIMUTH * RAD)];
	const seenAt = (p: Point3, x: number): Point3 => add(p, mul(W3, x - p[0]));

	// ---- limb poses, solved so fingertips and toes land on the ring as seen ----
	// The ring's centre sits where the navel is seen from the hands' plane, so the ring reads as centred on him.
	const RC = seenAt([4 * T, 0, NAVEL], RING.x1);
	const onRing = (p: Point3) => Math.hypot(...sub(seenAt(p, RING.x1), RC)) - RING.R;
	const armTip = (F: Frame, th: number) => at3(F, add2(mul2(dir2(th), LU + LF + 9.3 + 9.5), mul2(dir2(th + 90), 2.6)), 4 * T);
	const FR = frameAt([0, SHOULDER.y, SHOULDER.z], Y);
	const FL = frameAt([0, -SHOULDER.y, SHOULDER.z], NY);
	const RAISE = solve((th) => onRing(armTip(FR, th)), 0, 60) ?? 18;
	const LR = frameAt([0, HIP.y, HIP.z], Y);
	const LL = frameAt([0, -HIP.y, HIP.z], NY);
	const e4: Point3 = [Math.sin(REACH.psi * RAD), Math.cos(REACH.psi * RAD), 0];
	const F4 = frameAt(FR.o, e4);
	const reachTip = at3(F4, add2(add2(mul2(dir2(REACH.u), LU), mul2(dir2(REACH.f), LF + 18.8)), mul2(dir2(REACH.f + 90), 2.6)), 4 * T);

	const P = k.fitProjection(
		[...k.boxCorners(BASE, -BASE_H - FOOT_H, 0), [RING.x0, RC[1], RC[2] + RING.ro + 2], [RING.x0 + RING_BACK, RC[1], RC[2] + RING.ro + 2], [RING.x1, RC[1] + RING.ro + 1.5, RC[2]], [RING.x1, RC[1] - RING.ro - 1.5, RC[2]], [STAFF[0], STAFF[1], 206], reachTip],
		width,
		height,
		{ pad: 18, azimuth: AZIMUTH, elevation: ELEVATION },
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
	const seg = (a: Point3, b: Point3, tone: Tone | 'faint' = 'faint', free = false) => L(k.segment(a, b, P), { tone, free });
	const poly = (pts: Point3[]) => k.pathOf(pts.map(at), true);
	const halo = (plan: Plan, z: number, h: number) => `<path class="iso-halo" d="${k.haloOf(plan, z, h, P)}"/>`;
	const slab = (x: number, y: number, w: number, d: number, z: number, h: number, tone: Tone = 'mid', o: { r?: number; steps?: number; bevel?: number; seams?: number[]; lit?: boolean; thin?: boolean; inner?: string } = {}) => {
		const plan: Plan = { x, y, w, d, r: o.r ?? 0.5 };
		const seams = o.seams ? L(o.seams.map((z0) => k.sideSeam(plan, z0, P, o.steps ?? 2)).join(''), { tone: 'faint' }) : '';
		return S(k.slabOf(plan, z, h, P, o.steps ?? 2, o.bevel ?? 0.25), { tone, crease: o.thin ? 'none' : 'faint', lit: o.lit, inner: seams + (o.inner ?? '') });
	};
	const cyl = (cx: number, cy: number, r: number, z: number, h: number, tone: Tone = 'mid', o: { bevel?: number; arcs?: number[]; knurl?: number; lit?: boolean } = {}) => {
		const lines = (o.arcs ?? []).map((z0) => k.sideArc(cx, cy, r, z0, P, 24)).join('') + (o.knurl ? k.knurl(cx, cy, r, z, z + h, o.knurl, P, 0.3) : '');
		return S(k.cylinder(cx, cy, r, z, h, P, r > 5 ? 32 : 18, o.bevel ?? 0.3), { tone, lit: o.lit, inner: lines ? L(lines, { tone: 'faint' }) : '' });
	};
	const circ = (c: Point3, e1: Point3, e2: Point3, r: number, n = 18) =>
		k.pathOf(
			Array.from({ length: n }, (_, i) => at(add(c, add(mul(e1, r * Math.cos((i / n) * Math.PI * 2)), mul(e2, r * Math.sin((i / n) * Math.PI * 2)))))),
			true,
		);

	// ---- solids along any axis: a convex section swept along a vector, shaded by facing ----
	const shadeOf = (nn: Point3) => Math.min(3, Math.max(0, Math.floor(((nn[0] * LX + nn[1] * LY + 1) / 2 - 0.15 * Math.max(0, -nn[2])) * 4)));
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
			else shades[shadeOf(nn)].push(d);
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
	const knurlOf = (a: Point3, b: Point3, r: number, count: number) => {
		const [e1, e2] = frameOf(sub(b, a));
		const ax = unit(sub(b, a));
		const out: string[] = [];
		for (let i = 0; i < count; i++) {
			const t = (i / count) * Math.PI * 2;
			const nn = add(mul(e1, Math.cos(t)), mul(e2, Math.sin(t)));
			if (dot(nn, V) < 0.2) continue;
			out.push(k.segment(add(add(a, mul(nn, r)), mul(ax, 0.25)), add(add(b, mul(nn, r)), mul(ax, -0.25)), P));
		}
		return out.join('');
	};
	const rod = (a: Point3, b: Point3, r: number, tone: Tone = 'mid', o: { lit?: boolean; steps?: number; knurl?: number; inner?: string } = {}) => {
		const inner = (o.knurl ? L(knurlOf(a, b, r, o.knurl), { tone: 'faint' }) : '') + (o.inner ?? '');
		return S(rodPaths(a, b, r, o.steps), { tone, lit: o.lit, inner });
	};
	const boxPaths = (origin: Point3, axis: Point3, len: number, e1: Point3, e2: Point3, u0: number, u1: number, v0: number, v1: number, r = 0.6) => {
		const ring = k.roundedPlan({ x: u0, y: v0, w: u1 - u0, d: v1 - v0, r }, 2).map(([u, v]) => add(origin, add(mul(e1, u), mul(e2, v))));
		return prism(ring, mul(unit(axis), len));
	};
	const face = (pts: Point3[], shade: number, tone: Tone = 'lo') => {
		const d = poly(pts);
		const shades = ['', '', '', ''];
		shades[shade] = d;
		return S({ fill: d, outline: d, crease: '', top: '', shades }, { tone, crease: 'none' });
	};
	/** A curved band (a ring segment) round c in the plane (e1, e2), from radius ri to ro, d0..d1 along ax, angles t0..t1. */
	function band(c: Point3, e1: Point3, e2: Point3, ax: Point3, ri: number, ro: number, d0: number, d1: number, t0: number, t1: number, steps: number): SolidPaths {
		const pt = (t: number, r: number, d: number): Point3 => add(c, add(add(mul(e1, r * Math.cos(t * RAD)), mul(e2, r * Math.sin(t * RAD))), mul(ax, d)));
		const toward = dot(ax, V) > 0;
		const fd = toward ? d1 : d0;
		const bd = toward ? d0 : d1;
		const ts = Array.from({ length: steps + 1 }, (_, i) => t0 + ((t1 - t0) * i) / steps);
		const fill: string[] = [];
		const tops: string[] = [];
		const shades: string[][] = [[], [], [], []];
		const paint = (pts: Point3[], nn: Point3) => {
			const d = poly(pts);
			fill.push(d);
			if (nn[2] > 0.8) tops.push(d);
			else shades[shadeOf(nn)].push(d);
		};
		const front = [...ts.map((t) => pt(t, ro, fd)), ...[...ts].reverse().map((t) => pt(t, ri, fd))];
		paint(front, toward ? ax : mul(ax, -1));
		const full = Math.abs(t1 - t0) >= 360;
		const outline: string[] = full ? [poly(ts.slice(1).map((t) => pt(t, ro, fd))), poly(ts.slice(1).map((t) => pt(t, ri, fd)))] : [poly(front)];
		for (const [r, sgn] of [[ro, 1], [ri, -1]] as const) {
			let run: number[] = [];
			const flush = () => {
				if (!run.length) return;
				const open = (t: number) => !(full && (t === t0 || t === t1));
				const head = open(run[0]) ? [at(pt(run[0], r, fd))] : [];
				const tail = open(run[run.length - 1]) ? [at(pt(run[run.length - 1], r, fd))] : [];
				outline.push(k.pathOf([...head, ...run.map((t) => at(pt(t, r, bd))), ...tail]));
				run = [];
			};
			for (let i = 0; i < steps; i++) {
				const tm = ((ts[i] + ts[i + 1]) / 2) * RAD;
				const nn = mul(add(mul(e1, Math.cos(tm)), mul(e2, Math.sin(tm))), sgn);
				if (dot(nn, V) > 1e-6) {
					paint([pt(ts[i], r, d0), pt(ts[i + 1], r, d0), pt(ts[i + 1], r, d1), pt(ts[i], r, d1)], nn);
					if (!run.length) run.push(ts[i]);
					run.push(ts[i + 1]);
				} else flush();
			}
			flush();
		}
		for (const [t, sgn] of [[t0, -1], [t1, 1]] as const) {
			const nn = mul(add(mul(e1, -Math.sin(t * RAD)), mul(e2, Math.cos(t * RAD))), sgn);
			if (dot(nn, V) > 1e-6) {
				paint([pt(t, ri, d0), pt(t, ro, d0), pt(t, ro, d1), pt(t, ri, d1)], nn);
				outline.push(k.pathOf([at(pt(t, ri, fd)), at(pt(t, ri, bd)), at(pt(t, ro, bd)), at(pt(t, ro, fd))]));
			}
		}
		return { fill: fill.join(''), outline: outline.join(''), crease: '', top: tops.join(''), shades: shades.map((s) => s.join('')) };
	}

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
	/** A true turn by deg within the world plane (e1, e2) about c: the angle itself tweens, so nothing shrinks mid-turn. */
	const spin = (c: Point3, e1: Point3, e2: Point3, deg: number) => {
		const A = screenOf(e1, e2);
		const Ai = invert(A);
		const [px, py] = at(c).map(r4);
		return `translate(${px} ${py}) matrix(${A.slice(0, 4).map(r4).join(' ')} 0 0) rotate(${r4(deg)}) matrix(${Ai.slice(0, 4).map(r4).join(' ')} 0 0) translate(${-px} ${-py})`;
	};
	const plain = (name: string, transform: string, body: string) => `<g class="mover plain" data-part="${name}" transform="${transform}">${body}</g>`;

	// ---- the stand ----
	function base() {
		const out = [halo(BASE, -BASE_H - FOOT_H, BASE_H)];
		const feet = [...k.corners(BASE, 22), [BASE.x + 22, 0] as [number, number], [BASE.x + BASE.w - 22, 0] as [number, number]].sort((a, b) => depth([a[0], a[1], 0]) - depth([b[0], b[1], 0]));
		for (const [x, y] of feet) out.push(cyl(x, y, 8.5, -BASE_H - FOOT_H, 1.8, 'lo', { bevel: 0.4 }), cyl(x, y, 6.2, -BASE_H - FOOT_H + 1.8, FOOT_H - 1.8, 'mid'));
		out.push(S(k.slabOf(BASE, -BASE_H, BASE_H, P, 10, 1.6), { tone: 'mid', inner: L(k.sideSeam(BASE, -BASE_H / 2, P, 10), { tone: 'faint' }) }));
		out.push(L(k.planOutline(k.insetPlan(BASE, 5), 0, P, 10), { tone: 'lo' }), L(k.planOutline(k.insetPlan(BASE, 8), 0, P, 10), { tone: 'faint' }));
		const screws = k.corners(BASE, 11);
		out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.4, 0, P, 16)).join(''), { tone: 'lo' }), dots(screws.map(([x, y]) => [x, y, 0] as Point3), 0.55));
		for (const [x, y] of screws) out.push(L(k.lineOnTop([x - 1.4, y], [x + 1.4, y], 0, P), { tone: 'mid', free: true }));
		const fx = BASE.x + BASE.w;
		const fy = BASE.y + BASE.d;
		out.push(dots([-110, -66, -22, 22, 66, 110].map((y) => [fx, y, -BASE_H / 2 - 3] as Point3), 0.45), dots([-80, -40, 0].map((x) => [x, fy, -BASE_H / 2 - 3] as Point3), 0.45));
		const rule: Plan = { x: fx - 12, y: -96, w: 6, d: 184, r: 1 };
		out.push(S(k.slabOf(rule, 0, 0.6, P, 3), { tone: 'lo', crease: 'none' }));
		const t = k.topTicks(-90, 86, 4.5, 5, rule.x + 0.1, 0.6, [1.8, 3.6], P, 'y');
		out.push(L(t.minor, { tone: 'lo' }), L(t.major, { tone: 'mid' }), dots([[rule.x + 4, rule.y + 2, 0.6], [rule.x + 4, rule.y + rule.d - 2, 0.6]], 0.4));
		const plate: Plan = { x: fx - 20, y: 96, w: 15, d: 30, r: 1.5 };
		out.push(S(k.slabOf(plate, 0, 0.8, P, 3, 0.2), { tone: 'lo' }), L(k.planOutline(k.insetPlan(plate, 1.4), 0.8, P, 3), { tone: 'faint' }));
		out.push(k.faceTextSvg(k.topMatrix([plate.x + 7.4, plate.y + 24], 0.8, P, 'y'), 'a6n', { size: 6, tone: 'mid' }));
		for (const [x, len] of [[9.6, 18], [11.4, 13], [13, 16]] as const) out.push(L(k.lineOnTop([plate.x + x, plate.y + 24], [plate.x + x, plate.y + 24 - len], 0.8, P), { tone: 'lo', free: true }));
		out.push(dots([[plate.x + 7.5, plate.y + 3, 0.8], [plate.x + 7.5, plate.y + plate.d - 3, 0.8]], 0.45));
		return out.join('');
	}

	const [, CY, CZ] = RC;
	function rail() {
		const out = [slab(-98, CY - 3, 93.3, 6, 0, 1.5, 'lo', { r: 0.6, seams: [0.75] })];
		out.push(L(k.lineOnTop([-96, CY], [-6, CY], 1.5, P), { tone: 'faint' }));
		out.push(dots([-92, -77, -62, -47, -32, -17].map((x) => [x, CY - 1.8, 1.5] as Point3), 0.4));
		out.push(slab(-101, CY - 6, 4, 12, 0, 6, 'mid', { r: 1, seams: [3] }), dots([[-99, CY - 4, 6], [-99, CY + 4, 6]], 0.45));
		return out.join('');
	}

	// ---- the ring: twelve banded segments with clamp collars and rivets, a spoke and the navel hub, on a carriage ----
	function ring() {
		const c: Point3 = [0, CY, CZ];
		const low = CZ - RING.ro;
		const out: string[] = [];
		out.push(slab(-9.6, CY - 9, 4.9, 18, 1.5, 1.5, 'mid', { r: 0.8 }), dots([[-9, CY - 7.6, 3], [-5.3, CY - 7.6, 3], [-9, CY + 7.6, 3], [-5.3, CY + 7.6, 3]], 0.4));
		out.push(slab(-9.4, CY - 8, 1.3, 16, 3, 10, 'mid', { r: 0.4 }));
		out.push(slab(RING.x0, CY - 5, RING.x1 - RING.x0, 10, 3, low - 3, 'lo', { r: 0.4 }));
		const joins = Array.from({ length: 12 }, (_, i) => -75 + i * 30);
		const C2 = 2.2;
		const p = (t: number, r: number, x = RING.x1): Point3 => add(c, [x, r * Math.cos(t * RAD), r * Math.sin(t * RAD)]);
		for (const j of joins) {
			out.push(S(band(c, Y, Z, X, RING.ri, RING.ro, RING.x0, RING.x1, j + C2, j + 30 - C2, 10), { tone: 'mid' }));
			const mid = j + 15;
			out.push(L(k.pathOf(Array.from({ length: 11 }, (_, i) => at(p(j + C2 + ((30 - 2 * C2) * i) / 10, RING.R)))), { tone: 'faint' }));
			out.push(dots([p(mid - 6, 106.7), p(mid - 6, 109.3), p(mid + 6, 106.7), p(mid + 6, 109.3)], 0.4));
		}
		// the spoke stands on a plate bolted to the ring's back face, behind the pelvis, up to the hub
		out.push(slab(-8.4, CY - 5, 0.4, 10, low + 3.4, 14, 'mid', { r: 0.3, thin: true }));
		out.push(slab(-10, CY - 1.6, 1.6, 3.2, low + 5, CZ - 6.5 - low - 5, 'mid', { r: 0.4, seams: [40, 75] }));
		out.push(slab(-10.4, CY - 3.4, 2, 6.8, low + 5, 4.6, 'mid', { r: 0.5 }), dots([[-8.4, CY - 2, low + 7.3], [-8.4, CY + 2, low + 7.3]], 0.4));
		for (const j of joins) {
			out.push(S(band(c, Y, Z, X, RING.ri - 1, RING.ro + 1, RING.x0 - 0.7, RING.x1 + 0.7, j - C2, j + C2, 2), { tone: 'hi' }));
			out.push(dots([p(j, 106.4, RING.x1 + 0.7), p(j, 109.6, RING.x1 + 0.7)], 0.45, 'hi'));
		}
		const hubA: Point3 = [-11, CY, CZ];
		const hubB: Point3 = [-8.2, CY, CZ];
		const bolts = Array.from({ length: 6 }, (_, i) => add(hubB, [0, 4.6 * Math.cos((i * Math.PI) / 3), 4.6 * Math.sin((i * Math.PI) / 3)]) as Point3);
		out.push(rod(hubA, hubB, 7, 'hi', { steps: 28, inner: L(circ(hubB, Y, Z, 5.8, 28), { tone: 'faint' }) }), dots(bolts, 0.45));
		out.push(rod(hubB, [TORSO.x0, CY, CZ], 2.6, 'mid'), dots([[TORSO.x0, CY, CZ]], 0.5, 'hi'));
		out.push(slab(RING.x1, CY - 8, 0.3, 16, 3, 9, 'mid', { r: 0.15, thin: true }), dots([[RING.x1 + 0.3, CY - 5.5, 9], [RING.x1 + 0.3, CY + 5.5, 9], [RING.x1 + 0.3, CY, low + 6.5]], 0.45));
		return out.join('');
	}

	// ---- the square: two posts on foot blocks with gussets, a sill, a top bar, tick rulers and corner brackets ----
	const tickZ = Array.from({ length: 39 }, (_, i) => ({ v: G + 4.5 * (i + 1), major: (i + 1) % 5 === 0 }));
	const tickY = Array.from({ length: 39 }, (_, i) => ({ v: -SQ.inner + 4.5 * (i + 1), major: (i + 1) % 5 === 0 }));
	const SF = SQ.x1 + 0.3; // face of the ruler strips
	const SILL = 3.6;
	function squareLow() {
		const out: string[] = [];
		const marks: string[] = [];
		for (const s of [1, -1]) {
			const y0 = s > 0 ? SQ.inner : -SQ.outer - 10;
			out.push(slab(SQ.x0 - 3, y0, 10, 15, 0, 5, 'mid', { r: 1, seams: [2.5] }), dots([[SQ.x0 - 1.5, s * 92.5, 5], [SQ.x0 + 5.5, s * 92.5, 5], [SQ.x0 - 1.5, s * 102.5, 5], [SQ.x0 + 5.5, s * 102.5, 5]], 0.45));
			const gy = s * SQ.outer;
			out.push(S(prism([[SQ.x0 + 0.5, gy, 5], [SQ.x0 + 0.5, gy + s * 6, 5], [SQ.x0 + 0.5, gy, 24]], [2, 0, 0]), { tone: 'mid' }), dots([[SQ.x0 + 2.5, gy + s * 1.8, 8], [SQ.x0 + 2.5, gy + s * 1.8, 16]], 0.4));
			const py = s > 0 ? SQ.inner : -SQ.outer;
			out.push(slab(SQ.x0, py, SQ.x1 - SQ.x0, SQ.outer - SQ.inner, 5, SQ.top - 5, 'mid', { r: 0.4, seams: [55, 145] }));
			const sy = s > 0 ? SQ.inner + 1 : -SQ.inner - 4;
			out.push(slab(SQ.x1, sy, 0.3, 3, G + 2, 176, 'hi', { r: 0.15, thin: true }));
			const ticks = (major: boolean) => tickZ.filter((t) => t.major === major).map(({ v }) => k.segment([SF, s * (SQ.inner + 1), v], [SF, s * (SQ.inner + 1 + (major ? 2.4 : 1.3)), v], P)).join('');
			out.push(L(ticks(false), { tone: 'lo' }), L(ticks(true), { tone: 'mid' }));
			for (const { v } of tickZ.filter((t) => t.major)) marks.push(k.segment([SQ.x1, s * SQ.inner, v], [SQ.x1, s * SQ.outer, v], P));
		}
		out.push(slab(SQ.x0, -SQ.inner, SILL - SQ.x0, 2 * SQ.inner, 0, G, 'mid', { r: 0.4, seams: [5] }));
		out.push(slab(SILL, -86, 0.3, 172, 5.8, 3.4, 'hi', { r: 0.15, thin: true }));
		const sill = k.sideTicks(-85.5, 85.5, 4.5, 5, SILL + 0.3, 9.2, [1.3, 2.4], P, 'y');
		out.push(L(sill.minor, { tone: 'lo' }), L(sill.major, { tone: 'mid' }));
		for (const { v } of tickY.filter((t) => t.major)) marks.push(k.segment([SILL, v, G], [SILL, v, 0], P));
		// bottom corner brackets: an upright plate on each post and a foot plate on the sill
		for (const s of [1, -1]) {
			const py = s > 0 ? SQ.inner : -SQ.outer;
			out.push(S(boxPaths([SF, 0, 0], X, 0.5, Y, Z, py, py + 5, G, G + 14, 0.6), { tone: 'hi' }), dots([[SF + 0.5, s * 92.5, G + 4], [SF + 0.5, s * 92.5, G + 11]], 0.45));
			const by = s > 0 ? SQ.inner - 14 : -SQ.inner;
			out.push(slab(SQ.x1, by, 5, 14, G, 0.6, 'hi', { r: 0.6, thin: true }), dots([[SQ.x1 + 2.5, s * (SQ.inner - 3), G + 0.6], [SQ.x1 + 2.5, s * (SQ.inner - 11), G + 0.6]], 0.45));
		}
		return out.join('') + stepSvg('show-from', 1, L(marks.join(''), { tone: 'hi' }));
	}
	function squareTop() {
		const out = [slab(SQ.x0, -SQ.outer, SQ.x1 - SQ.x0, 2 * SQ.outer, SQ.top, 5, 'mid', { r: 0.4, seams: [SQ.top + 2.5] })];
		out.push(S(boxPaths([SQ.x1, 0, 0], X, 0.3, Y, Z, -88, 88, SQ.top + 0.8, SQ.top + 4.2, 0.2), { tone: 'hi', crease: 'none' }));
		const ticks = (major: boolean) => tickY.filter((t) => t.major === major && Math.abs(t.v) < 88).map(({ v }) => k.segment([SF, v, SQ.top + 0.8], [SF, v, SQ.top + 0.8 + (major ? 2.4 : 1.3)], P)).join('');
		out.push(L(ticks(false), { tone: 'lo' }), L(ticks(true), { tone: 'mid' }));
		const marks = tickY.filter((t) => t.major).map(({ v }) => k.segment([SQ.x1, v, SQ.top], [SQ.x1, v, SQ.top + 5], P));
		out.push(stepSvg('show-from', 1, L(marks.join(''), { tone: 'hi' })));
		for (const s of [1, -1]) {
			const py = s > 0 ? SQ.inner : -SQ.outer;
			out.push(S(boxPaths([SF, 0, 0], X, 0.5, Y, Z, py, py + 5, SQ.top - 14, SQ.top + 5, 0.6), { tone: 'hi' }));
			const hy = s > 0 ? SQ.inner - 14 : -SQ.inner;
			out.push(S(boxPaths([SF, 0, 0], X, 0.5, Y, Z, hy, hy + 14.4, SQ.top, SQ.top + 5, 0.6), { tone: 'hi' }));
			const screw = (y: number, z: number) => [L(circ([SF + 0.5, y, z], Y, Z, 1, 12), { tone: 'lo' }), dots([[SF + 0.5, y, z]], 0.4)].join('');
			out.push(screw(s * 92.5, SQ.top - 9), screw(s * 92.5, SQ.top + 2.5), screw(s * 84, SQ.top + 2.5), screw(s * 78.5, SQ.top + 2.5));
		}
		return out.join('');
	}

	// ---- the figure: pelvis 100..112, waist, chest 116..154, shoulder yoke 154..168, head 170..190 ----
	function torso() {
		const { x0, x1 } = TORSO;
		const w = x1 - x0;
		const out: string[] = [];
		out.push(slab(x0, -14, w, 28, 100, 12, 'mid', { r: 2, steps: 3, bevel: 0.5, seams: [102.5, 110] }));
		out.push(dots([-11, -4, 4, 11].map((y) => [x1, y, 101.4] as Point3), 0.45, 'hi'));
		out.push(slab(x0 + 0.5, -10, w - 1, 20, 112, 4, 'mid', { r: 1.5, steps: 3, seams: [114] }));
		out.push(slab(x0, -16, w, 32, 116, 38, 'mid', { r: 2.5, steps: 3, bevel: 0.6, seams: [118.5, 151.5] }), seg([x1, -12, 118.5], [x1, -12, 151.5]), seg([x1, 12, 118.5], [x1, 12, 151.5]));
		out.push(dots([[x1, -14, 117.3], [x1, 14, 117.3], [x1, -14, 152.8], [x1, 14, 152.8], [x1, -14, 135], [x1, 14, 135]], 0.4));
		out.push(slab(x0, -18, w, 36, 154, 12, 'mid', { r: 2, steps: 3, bevel: 0.5, seams: [160] }));
		for (const s of [1, -1]) out.push(slab(x0, s > 0 ? 18 : -27, 5, 9, 157, 10, 'mid', { r: 1.5, steps: 3, seams: [162] }));
		out.push(dots([-14, -5, 5, 14].map((y) => [x1, y, 164] as Point3), 0.45, 'hi'));
		for (const s of [1, -1]) out.push(rod([x0 + 5, s * SHOULDER.y, SHOULDER.z], [-T, s * SHOULDER.y, SHOULDER.z], 1, 'mid', { steps: 10 }));
		for (const s of [1, -1]) out.push(rod([x1, s * HIP.y, HIP.z], [-T, s * HIP.y, HIP.z], 1, 'mid', { steps: 10 }));
		return out.join('');
	}

	const gearRing = (c: Point3, r: number, teeth: number, deep = 0.7) => {
		const pts: Point3[] = [];
		for (let i = 0; i < teeth; i++) {
			const a = (i / teeth) * Math.PI * 2;
			const s = (Math.PI * 2) / teeth;
			for (const [f, rr] of [[0, r - deep], [0.22, r], [0.5, r], [0.72, r - deep]] as const) pts.push(add(c, [0, rr * Math.cos(a + f * s), rr * Math.sin(a + f * s)]));
		}
		return pts;
	};
	function chestFront() {
		const x1 = TORSO.x1;
		const out: string[] = [];
		// navel hub cap: the ring's centre
		const n0: Point3 = [x1, 0, NAVEL];
		out.push(rod(n0, [x1 + 0.6, 0, NAVEL], 4.2, 'mid', { steps: 24 }), rod([x1 + 0.6, 0, NAVEL], [x1 + 1.9, 0, NAVEL], 2.8, 'hi', { steps: 20 }));
		out.push(L(circ([x1 + 0.6, 0, NAVEL], Y, Z, 3.5, 24), { tone: 'lo' }), dots([[x1 + 1.9, 0, NAVEL]], 0.55, 'hi'), dots([45, 135, 225, 315].map((a) => [x1 + 0.6, 3.7 * Math.cos(a * RAD), NAVEL + 3.7 * Math.sin(a * RAD)] as Point3), 0.35));
		// the cam and its follower beside the navel
		const cc: Point3 = [x1, -10.5, 123];
		out.push(rod(add(cc, [0, 0.7, 0]), add(cc, [0.9, 0.7, 0]), 2.6, 'hi', { steps: 20 }), dots([add(cc, [0.9, 0, 0])], 0.5, 'mid'), L(circ(add(cc, [0.9, 0, 0]), Y, Z, 0.9, 12), { tone: 'lo' }));
		out.push(cyl(x1 + 0.6, -10.1, 0.55, cc[2] + 2.6, 3.2, 'mid', { bevel: 0 }), slab(x1, -11.7, 1.2, 3.2, cc[2] + 5.8, 2.6, 'mid', { r: 0.4 }), dots([[x1 + 1.2, -10.9, cc[2] + 7.1], [x1 + 1.2, -9.3, cc[2] + 7.1]], 0.35));
		// the chest door, a window onto the gear behind it
		const d0 = x1;
		const d1 = x1 + 0.6;
		const WZ = 141;
		const wc: Point3 = [d1, 1, WZ];
		const door = S(boxPaths([d0, 0, 0], X, 0.6, Y, Z, -8, 8, 133, 149, 1), { tone: 'hi' });
		const clip = circ(wc, Y, Z, 4.4, 32);
		const back: Point3 = [x1, 1, WZ];
		const gear = gearRing(add(back, [0.4, 0, 0]), 3.8, 14);
		const gd = poly(gear);
		const window =
			`<defs><clipPath id="vitruvian-window"><path d="${clip}"/></clipPath></defs><g clip-path="url(#vitruvian-window)">` +
			face(Array.from({ length: 32 }, (_, i) => add(back, [0, 4.6 * Math.cos((i / 32) * Math.PI * 2), 4.6 * Math.sin((i / 32) * Math.PI * 2)])), 0) +
			S({ fill: gd, outline: gd, crease: '', top: '', shades: ['', '', gd, ''] }, { tone: 'mid', crease: 'none' }) +
			L(circ(add(back, [0.4, 0, 0]), Y, Z, 2.2, 20), { tone: 'lo' }) +
			[0, 1, 2].map((i) => seg(add(back, [0.4, 0.9 * Math.cos((i * 2 * Math.PI) / 3), 0.9 * Math.sin((i * 2 * Math.PI) / 3)]), add(back, [0.4, 2.2 * Math.cos((i * 2 * Math.PI) / 3), 2.2 * Math.sin((i * 2 * Math.PI) / 3)]), 'lo')).join('') +
			dots([add(back, [0.4, 0, 0])], 0.55, 'hi') +
			`</g>`;
		out.push(door, window);
		out.push(S(band(wc, Y, Z, X, 4.4, 5.5, 0, 0.35, 0, 360, 36), { tone: 'mid' }), dots([45, 135, 225, 315].map((a) => add(wc, [0.35, 4.95 * Math.cos(a * RAD), 4.95 * Math.sin(a * RAD)])), 0.35, 'hi'));
		out.push(L(poly([[d1, -7, 134], [d1, 7, 134], [d1, 7, 148], [d1, -7, 148]]), { tone: 'faint' }), dots([[d1, -7, 134], [d1, 7, 134], [d1, -7, 148], [d1, 7, 148]], 0.35));
		for (const z0 of [134.5, 142.5]) out.push(cyl(x1 + 0.8, 8.7, 0.8, z0, 5, 'hi', { bevel: 0.2, arcs: [z0 + 2.5] }), dots([[x1 + 0.8, 8.7, z0 + 5]], 0.35));
		out.push(rod([d1, -6.2, WZ], [d1 + 1, -6.2, WZ], 0.6, 'mid', { steps: 8 }), rod([d1 + 1, -6.2, WZ], [d1 + 2, -6.2, WZ], 1.3, 'hi', { steps: 14, knurl: 10 }));
		return out.join('');
	}

	// the head: a turned block on a knurled collar; the face plate is its own group so the head can turn toward the hand
	const HX = (TORSO.x0 + TORSO.x1) / 2;
	const HR = 8.5;
	const headAxis: Point3 = [HX, 0, 0];
	const faceDir = rotZ(X, TURN);
	const faceTan = rotZ(Y, TURN);
	const faceC: Point3 = add([HX, 0, 178.5], mul(faceDir, 7.4));
	function head() {
		const out = [cyl(HX, 0, 3.3, 166, 2, 'mid', { bevel: 0.3, knurl: 18 }), cyl(HX, 0, 2.5, 168, 2.4, 'hi', { bevel: 0 })];
		out.push(cyl(HX, 0, 6, 170.4, 1.6, 'mid', { bevel: 0.4 }), cyl(HX, 0, HR, 172, 12.6, 'hi', { bevel: 0.3, arcs: [174.5, 182.5] }));
		const [vx, vy] = k.towardViewer(P);
		const side = Math.atan2(vy, vx);
		out.push(dots([-1.3, -1.0, 1.15, 1.45].map((a) => [HX + HR * Math.cos(side + a), HR * Math.sin(side + a), 178.5] as Point3), 0.5, 'mid'));
		out.push(cyl(HX, 0, HR + 0.7, 184.6, 2, 'mid', { bevel: 0.4, knurl: 36 }), cyl(HX, 0, 6.6, 186.6, 1.8, 'hi', { bevel: 0.5 }), L(k.ring(HX, 0, 4.6, 188.4, P, 28), { tone: 'faint' }));
		out.push(cyl(HX, 0, 2.2, 188.4, 1.6, 'mid', { bevel: 0.4 }), dots([[HX, 0, 190]], 0.45, 'hi'));
		return out.join('');
	}
	function facePlate() {
		const out = [S(boxPaths(faceC, faceDir, 1.4, faceTan, Z, -4.2, 4.2, -5.6, 5.6, 1.5), { tone: 'hi' })];
		const p = (u: number, v: number): Point3 => add(add(faceC, mul(faceDir, 1.4)), add(mul(faceTan, u), [0, 0, v]));
		const slot = [p(-3.4, 0.6), p(3.4, 0.6), p(3.4, 2.8), p(-3.4, 2.8)];
		out.push(face(slot, 0), L(poly(slot), { tone: 'lo' }));
		for (const u of [-1.7, 1.7]) out.push(L(circ(p(u, 1.7), faceTan, Z, 0.75, 14), { tone: 'mid' }), D([at(p(u, 1.7))], { size: 0.5, tone: 'hi' }));
		const grille = [p(-2.2, -3.2), p(2.2, -3.2), p(2.2, -2.1), p(-2.2, -2.1)];
		out.push(face(grille, 1), L(poly(grille), { tone: 'lo' }), L(k.pathOf([at(p(0, -3.2)), at(p(0, -2.1))]), { tone: 'faint' }));
		out.push(dots([p(-3.2, -4.6), p(3.2, -4.6), p(-3.2, 4.6), p(3.2, 4.6)], 0.35));
		return out.join('');
	}

	// ---- jointed limbs ----
	const stadium = (A: P2, B: P2, hw: number): P2[] => {
		const d = Math.atan2(B[1] - A[1], B[0] - A[0]);
		const arc = (c: P2, from: number) => Array.from({ length: 9 }, (_, i) => add2(c, mul2(dir2(from + (180 * i) / 8), hw)));
		return [...arc(B, d / RAD - 90), ...arc(A, d / RAD + 90)];
	};
	const rounded = (o: P2, deg: number, t0: number, t1: number, v0: number, v1: number, r: number): P2[] => {
		const [ux, uy] = dir2(deg);
		return k.roundedPlan({ x: t0, y: v0, w: t1 - t0, d: v1 - v0, r }, 3).map(([t, v]) => [o[0] + t * ux - v * uy, o[1] + t * uy + v * ux] as P2);
	};
	const strip = (F: Frame, pts: P2[], s0: number, tone: Tone = 'hi', o: { lit?: boolean; inner?: string } = {}) => S(prism(pts.map((q) => at3(F, q, s0)), mul(F.n, 2 * T), true), { tone, lit: o.lit, inner: o.inner });
	const holes = (F: Frame, A: P2, B: P2, s: number, from: number, to: number) => {
		const len = Math.hypot(B[0] - A[0], B[1] - A[1]);
		const u: P2 = [(B[0] - A[0]) / len, (B[1] - A[1]) / len];
		const out: string[] = [];
		for (let t = from; t <= len - to + 1e-6; t += 4.2) out.push(circ(at3(F, add2(A, mul2(u, t)), s), F.e, Z, 0.8, 12));
		return L(out.join(''), { tone: 'lo' });
	};
	/** A pin joint: washer, bolt head, washer ring and pin dot on the front face at s. */
	const knuckle = (F: Frame, q: P2, s: number, r: number) => {
		const a = at3(F, q, s);
		const b = at3(F, q, s + 0.4);
		const c = at3(F, q, s + 1.3);
		return rod(a, b, r + 0.9, 'mid', { steps: 20 }) + rod(b, c, r, 'hi', { steps: 6 }) + L(circ(b, F.e, Z, r + 0.5, 18), { tone: 'lo' }) + dots([c], 0.5, 'hi');
	};
	const FINGERS: [number, number][] = [[2.6, 9.5], [0.85, 9], [-0.9, 8], [-2.6, 6.5]];
	function arm(F: Frame, u: number, f: number, lit: boolean) {
		const Sh: P2 = [0, 0];
		const E = mul2(dir2(u), LU);
		const W = add2(E, mul2(dir2(f), LF));
		const h = f;
		const upper = strip(F, stadium(Sh, E, 4), -T, 'hi', { inner: holes(F, Sh, E, T, 7.4, 7.4) }) + knuckle(F, Sh, T, 1.9);
		const hand: string[] = [strip(F, rounded(W, h, -2.2, 9, -3.6, 3.6, 1.6), 3 * T)];
		FINGERS.forEach(([v, len], i) => {
			const m = 9.3 + 0.55 * len;
			hand.push(strip(F, rounded(W, h, 9.3, m, v - 0.72, v + 0.72, 0.6), 3 * T));
			const tip = strip(F, rounded(W, h, m + 0.3, 9.3 + len, v - 0.72, v + 0.72, 0.7), 3 * T, 'hi', { lit: lit && i === 0 });
			hand.push(lit && i === 0 ? stepSvg('lit-at', 4, tip) : tip);
		});
		const tb = add2(add2(W, mul2(dir2(h), 2.6)), mul2(dir2(h + 90), 2.7));
		hand.push(strip(F, rounded(tb, h + 40, 0, 4.2, -0.8, 0.8, 0.7), 5 * T), strip(F, rounded(tb, h + 40, 4.5, 7.8, -0.75, 0.75, 0.7), 5 * T));
		const fore = strip(F, stadium(E, W, 3.4), T, 'hi', { inner: holes(F, E, W, 3 * T, 7, 6.4) }) + knuckle(F, E, 3 * T, 1.7) + hand.join('') + knuckle(F, W, 5 * T, 1.3);
		const outline = [...stadium(Sh, E, 4), ...stadium(E, W, 3.4), ...rounded(W, h, -2.2, 19, -3.6, 4.4, 1)].map((q) => at3(F, q, T));
		return { upper, fore, E: at3(F, E), outline };
	}
	function leg(F: Frame, phi: number) {
		const a = -90 + phi;
		const K = mul2(dir2(a), LT);
		const A = mul2(dir2(a), LT + LS);
		const thigh = strip(F, stadium([0, 0], K, 4.6), -T, 'hi', { inner: holes(F, [0, 0], K, T, 8, 8) }) + knuckle(F, [0, 0], T, 2.1);
		const shin = strip(F, stadium(K, A, 3.8), T, 'hi', { inner: holes(F, K, A, 3 * T, 7.6, 7.6) }) + knuckle(F, K, 3 * T, 1.9);
		const foot = strip(F, rounded(A, a + 90, -3.5, 10, -5, 2.4, 1.6), 3 * T) + strip(F, rounded(A, a + 90, 10.3, 13, -5, -1.4, 1), 3 * T) + knuckle(F, A, 5 * T, 1.5);
		const outline = [...stadium([0, 0], K, 4.6), ...stadium(K, A, 3.8), ...rounded(A, a + 90, -3.5, 13, -5, 2.4, 1)].map((q) => at3(F, q, T));
		return { body: thigh + shin + foot, outline };
	}
	// Leonardo's first pose, left behind as ink once the limbs swing into the circle
	function ghosts() {
		const outlines = [arm(FR, 0, 0, false), arm(FL, 0, 0, false), leg(LR, 0), leg(LL, 0)].map((g) => k.pathOf(hull(g.outline.map(at)), true));
		return stepSvg('show-from', 3, L(outlines.join(''), { tone: 'faint', free: true }));
	}

	// ---- the dividers on their staff ----
	const SPAN = (SQ.inner - SHOULDER.y) / 2;
	const ZH = seenAt([0, -SHOULDER.y - SPAN, SHOULDER.z + 4 + Math.sqrt(DIV * DIV - SPAN * SPAN)], XD + T);
	const OPEN = (Math.asin(SPAN / DIV) * 180) / Math.PI;
	const H0: Point3 = [XD, -116.5, ZH[2] - 24];
	const divShift = sub([XD, ZH[1], ZH[2]], H0);
	const PEG_Z = H0[2] + 11.4;
	const STAFF_TOP = PEG_Z + 4;
	function staff() {
		const [x, y] = STAFF;
		const out = [halo({ x: x - 7, y: y - 7, w: 14, d: 14, r: 7 }, 0, 2)];
		out.push(cyl(x, y, 6, 0, 1.8, 'lo', { bevel: 0.4 }), cyl(x, y, 4.2, 1.8, 2.8, 'mid', { bevel: 0.4, knurl: 20 }));
		const arcs = Array.from({ length: Math.floor((STAFF_TOP - 10) / 10) }, (_, i) => 10 + i * 10);
		out.push(S(k.cylinder(x, y, 2.4, 4.6, STAFF_TOP - 4.6, P, 18, 0), { tone: 'mid', inner: L(arcs.filter((z) => z % 50).map((z) => k.sideArc(x, y, 2.4, z, P, 16)).join(''), { tone: 'faint' }) + L(arcs.filter((z) => !(z % 50)).map((z) => k.sideArc(x, y, 2.4, z, P, 16)).join(''), { tone: 'lo' }) }));
		out.push(cyl(x, y, 3.4, PEG_Z - 2.4, 4.8, 'mid', { bevel: 0.3, arcs: [PEG_Z] }), slab(x + 2, y - 1.6, XD + 1.6 - x - 2, 3.2, PEG_Z - 1.6, 3.2, 'mid', { r: 0.6 }), dots([[XD + 1.6, y, PEG_Z]], 0.4));
		out.push(rod([XD, y + 1.6, PEG_Z], [XD, -116.9, PEG_Z], 0.8, 'hi', { steps: 12 }));
		out.push(cyl(x, y, 3.2, STAFF_TOP, 2.2, 'hi', { bevel: 0.5 }), cyl(x, y, 1.4, STAFF_TOP + 2.2, 1.6, 'mid', { bevel: 0.3 }), dots([[x, y, STAFF_TOP + 3.8]], 0.4, 'hi'));
		return out.join('');
	}
	const pegFront = () => rod([XD, -116.1, PEG_Z], [XD, -115.3, PEG_Z], 0.8, 'hi', { steps: 12 }) + dots([[XD, -115.3, PEG_Z]], 0.35);
	const FD = frameAt(H0, Y);
	function divLeg(s0: number) {
		const body: P2[] = [...Array.from({ length: 9 }, (_, i) => mul2(dir2((180 * i) / 8), 1.9)), [-0.75, -42], [0.75, -42]];
		const point: P2[] = [[-0.7, -42.3], [0.7, -42.3], [0.12, -DIV], [-0.12, -DIV]];
		return strip(FD, body, s0, 'hi') + strip(FD, point, s0, 'lo') + dots([at3(FD, [0, -36], s0 + 2 * T)], 0.4);
	}
	function dividers() {
		const out: string[] = [];
		const loopC: Point3 = [XD, H0[1], PEG_Z - 1];
		out.push(S(band(loopC, X, Z, Y, 1.8, 2.5, -0.4, 0.4, 204, 564, 36), { tone: 'hi' }));
		out.push(cyl(XD, H0[1], 0.7, H0[2] + 6.4, 1.6, 'mid', { bevel: 0 }), cyl(XD, H0[1], 1.5, H0[2] + 1.8, 4.6, 'hi', { bevel: 0.3, knurl: 12 }));
		out.push(rod(at3(FD, [0, 0], -T - 0.5), at3(FD, [0, 0], -T), 2.6, 'mid', { steps: 20 }));
		out.push(plain('div-a', spin(H0, Y, Z, 0), divLeg(-T)));
		out.push(plain('div-b', spin(H0, Y, Z, 0), divLeg(T)));
		const a = at3(FD, [0, 0], 3 * T);
		const b = at3(FD, [0, 0], 3 * T + 1.6);
		out.push(rod(a, b, 3.2, 'hi', { steps: 28, knurl: 28 }), L(circ(b, Y, Z, 2.2, 20), { tone: 'lo' }), rod(b, add(b, [0.5, 0, 0]), 1.1, 'mid', { steps: 8 }), dots([add(b, [0.5, 0, 0])], 0.45, 'hi'));
		return out.join('');
	}

	// ---- poses and transforms ----
	const right = arm(F4, REACH.u, REACH.f, true);
	const left = arm(FL, RAISE, RAISE, false);
	const legR = leg(LR, SPREAD);
	const legL = leg(LL, SPREAD);
	const flatten = pose(FR.o, FR.o, [e4, Z], [Y, Z]);
	const faceBack = pose(faceC, add(headAxis, rotZ(sub(faceC, headAxis), -TURN)), [faceTan, Z], [rotZ(faceTan, -TURN), Z]);
	const rightSteps = [
		{ u: 0, f: 0, m: flatten },
		{ u: 0, f: 0, m: flatten },
		{ u: RAISE, f: RAISE, m: flatten },
		{ u: REACH.u, f: REACH.f, m: ID },
	];
	const transforms: Record<string, string[]> = {
		ring: [[RING_BACK, 0, 0] as Point3, O, O, O].map((p) => fmt(shiftOf(p))),
		dividers: [divShift, O, O, O].map((p) => fmt(shiftOf(p))),
		'div-a': [OPEN, 0, 0, 0].map((d) => spin(H0, Y, Z, d)),
		'div-b': [-OPEN, 0, 0, 0].map((d) => spin(H0, Y, Z, d)),
		'leg-r': [-SPREAD, -SPREAD, 0, 0].map((d) => spin(LR.o, Y, Z, d)),
		'leg-l': [-SPREAD, -SPREAD, 0, 0].map((d) => spin(LL.o, NY, Z, d)),
		'arm-l': [-RAISE, -RAISE, 0, 0].map((d) => spin(FL.o, NY, Z, d)),
		'arm-r': rightSteps.map((s) => `${fmt(s.m)} ${spin(F4.o, e4, Z, s.u - REACH.u)}`),
		'fore-r': rightSteps.map((s) => spin(right.E, e4, Z, s.f - s.u - (REACH.f - REACH.u))),
		face: [faceBack, faceBack, faceBack, ID].map(fmt),
	};
	const T4 = (name: string) => transforms[name][3];


	const body = [
		base(),
		rail(),
		moverSvg('ring', T4('ring'), ring()),
		squareLow(),
		torso(),
		chestFront(),
		head(),
		plain('face', T4('face'), facePlate()),
		squareTop(),
		ghosts(),
		plain('leg-l', T4('leg-l'), legL.body),
		plain('leg-r', T4('leg-r'), legR.body),
		plain('arm-l', T4('arm-l'), left.upper + left.fore),
		plain('arm-r', T4('arm-r'), right.upper + plain('fore-r', T4('fore-r'), right.fore)),
		staff(),
		moverSvg('dividers', T4('dividers'), dividers()),
		pegFront(),
	];

	const svg = k.figureSvg({
		width,
		height,
		label:
			"A jointed wood-and-brass Vitruvian man on a measuring stand, held at the navel by the hub of a brass ring and standing inside a square ruled with Leonardo's proportion marks. His left hand and both feet rest on the ring while faint ink keeps his first pose; his right arm lifts off the ring and reaches forward toward you, index finger extended and its tip lit, as his head turns toward the hand. A pair of brass dividers hangs on the staff beside him.",
		body,
	});
	return { svg, labels: LABELS, transforms };
}
