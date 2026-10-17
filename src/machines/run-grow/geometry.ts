import * as k from '../../lib/anatomy/iso-kit';
import type { Plan, Plane, Point3 } from '../../lib/anatomy/iso-kit';
import { moverSvg, stepSvg, transformsFrom, type Machine } from '../../lib/plate';

export const LABELS = ['your app running', 'checked every day', 'fixed and improved', 'grows with you'] as const;
export const CAPTION = "Once you're live, we keep watch every day, fix what breaks and add what you need next.";

const BASE: Plan = { x: -175, y: -90, w: 350, d: 180, r: 8 };
const BASE_H = 12;
const FOOT_H = 6;

const STAND: Plan = { x: -120, y: -62, w: 176, d: 100, r: 4 };
const STAND_H = 10;
const PLATE: Plan = { x: -112, y: -54, w: 156, d: 84, r: 3 };
const PLATE_Z = 26;
const PLATE_TOP = 29;
const RAIL: Plan = { x: 44, y: -48, w: 100, d: 44, r: 2 };
const CHIME: Plan = { x: 8, y: -45, w: 34, d: 38, r: 3 };
const CHIME_SLIDE = 92;

const WZ = 34;
const BARREL: Plane = [-18, -26];
const CENTRE: Plane = [-46, -27];
const THIRD: Plane = [-58.6, -10.2];
const ESCAPE: Plane = [-74.9, -18];
const SLOT: Plane = [-64.8, 9.6];
const TRAY: Plan = { x: 30, y: 44, w: 70, d: 38, r: 3 };
const TRAY_TOP = 36;
const SPARE_AT: Plane = [56, 63];
const SPARE_Z = 41;
const PEND: Plane = [-130, -34];
const LOUPE_AT: Plane = [-150, -76];
const LOUPE_Z = 72;
const LOUPE_LEN = 95;
const LOUPE_ON = 45;
const GAUGE: Plane = [-146, 46];
const GAUGE_Z = 22;
const BRIDGE_Z = 46;

export function runGrow(width = 720, height = 480): Machine {
	const P = k.fitProjection(
		[...k.boxCorners(BASE, -BASE_H - FOOT_H, 0), [LOUPE_AT[0], LOUPE_AT[1], LOUPE_Z + 6], [PEND[0], PEND[1], 72], [RAIL.x + RAIL.w, RAIL.y, 60], [SPARE_AT[0], SPARE_AT[1], 50], [LOUPE_AT[0] + 80, LOUPE_AT[1] + 70, LOUPE_Z + 6]],
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

	function swing([px, py]: Plane, deg: number, z: number) {
		const a = k.axisVector(P, [1, 0, 0]);
		const b = k.axisVector(P, [0, 1, 0]);
		const det = a[0] * b[1] - a[1] * b[0];
		const inv = [[b[1] / det, -b[0] / det], [-a[1] / det, a[0] / det]];
		const t = (deg * Math.PI) / 180;
		const R = [[Math.cos(t), -Math.sin(t)], [Math.sin(t), Math.cos(t)]];
		const A = [[a[0], b[0]], [a[1], b[1]]];
		const mul = (X: number[][], Y: number[][]) => X.map((row) => [0, 1].map((j) => row[0] * Y[0][j] + row[1] * Y[1][j]));
		const M = mul(mul(A, R), inv);
		const q = k.iso([px, py, z], P);
		const tx = q[0] - (M[0][0] * q[0] + M[0][1] * q[1]);
		const ty = q[1] - (M[1][0] * q[0] + M[1][1] * q[1]);
		const f = (n: number) => Math.round(n * 1000) / 1000;
		return `matrix(${f(M[0][0])} ${f(M[1][0])} ${f(M[0][1])} ${f(M[1][1])} ${f(tx)} ${f(ty)})`;
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
	interface Wheel {
		c: Plane;
		outer: number;
		root: number;
		teeth: number;
		phase: number;
		hub: number;
		z: number;
		spokes: number;
		loose?: boolean;
	}
	function wheel(w: Wheel) {
		const [cx, cy] = w.c;
		const out = [halo({ x: cx - w.outer, y: cy - w.outer, w: w.outer * 2, d: w.outer * 2, r: w.outer }, w.loose ? w.z - 5 : PLATE_TOP, 0.1, 3)];
		if (w.loose) out.push(S(k.cylinder(cx, cy, w.hub + 0.8, w.z - 5, 5, P, 20), { tone: 'lo' }));
		else out.push(S(k.cylinder(cx, cy, w.hub + 1, PLATE_TOP, w.z - PLATE_TOP, P, 20), { tone: 'lo' }));
		out.push(S(k.extrude(gearRing(w.c, w.outer, w.root, w.teeth, w.phase), w.z, 3, P, { convex: false }), { tone: 'hi' }));
		const top = w.z + 3;
		out.push(L(k.ring(cx, cy, w.root - 2, top, P, 40), { tone: 'mid' }));
		for (let i = 0; i < w.spokes; i++) {
			const a = (i / w.spokes) * Math.PI * 2 + 0.3;
			out.push(L(k.ring(cx + Math.cos(a) * w.root * 0.55, cy + Math.sin(a) * w.root * 0.55, w.root * 0.17, top, P, 14), { tone: 'lo' }));
		}
		out.push(S(k.extrude(gearRing(w.c, w.hub + 2.8, w.hub + 1.2, 7, w.phase + 0.4), top, 2.6, P, { convex: false }), { tone: 'mid' }));
		out.push(S(k.cylinder(cx, cy, w.hub * 0.55, top + 2.6, 1.6, P, 14), { tone: 'hi' }), D([at([cx, cy, top + 4.2])], { size: 0.45, tone: 'hi' }));
		return out.join('');
	}
	const WHEELS: Wheel[] = [
		{ c: BARREL, outer: 18, root: 14.4, teeth: 16, phase: 0.1, hub: 4, z: WZ, spokes: 5 },
		{ c: CENTRE, outer: 13, root: 10, teeth: 12, phase: 0.5, hub: 3.4, z: WZ, spokes: 4 },
		{ c: THIRD, outer: 11, root: 8, teeth: 10, phase: 1.1, hub: 3, z: WZ, spokes: 4 },
		{ c: ESCAPE, outer: 10, root: 7.2, teeth: 15, phase: 0.2, hub: 2.6, z: WZ, spokes: 3 },
	];
	const SPARE: Wheel = { c: SLOT, outer: 13, root: 9.6, teeth: 10, phase: 0.9, hub: 3.2, z: WZ, spokes: 4, loose: true };

	function movement() {
		const out: string[] = [];
		const pg = [...WHEELS].sort((a, b) => k.depthOf([a.c[0], a.c[1], 0], P) - k.depthOf([b.c[0], b.c[1], 0], P));
		out.push(S(k.cylinder(SLOT[0], SLOT[1], 1.7, PLATE_TOP, 13, P, 12), { tone: 'hi', crease: 'none' }), S(k.cylinder(SLOT[0], SLOT[1], 3, PLATE_TOP, 1.2, P, 14), { tone: 'mid' }));
		for (const w of pg) out.push(wheel(w));
		const [px, py] = [-93, -34];
		out.push(S(k.cylinder(px, py, 2, PLATE_TOP, 12, P, 12), { tone: 'mid' }), S(k.cylinder(px, py, 3, 38, 2, P, 14), { tone: 'lo' }));
		out.push(S(k.extrude([[-99, -31], [-92, -42], [-79, -30.5], [-83, -26.5], [-92, -34], [-95, -26]], 40, 2.4, P, { convex: false }), { tone: 'hi' }));
		out.push(S(k.slabOf({ x: PEND[0] - 1.2, y: -35.2, w: 38, d: 2.4, r: 0.6 }, 44, 2, P, 2), { tone: 'mid' }), S(k.cylinder(px, py, 1.6, 42.4, 3, P, 10), { tone: 'hi' }), D([at([px, py, 45.8]), at([-83, -26.5, 42.4]), at([-79, -30.5, 42.4])], { size: 0.45, tone: 'hi' }));
		const bar: Plan = { x: -50, y: -30, w: 36, d: 6, r: 1.5 };
		out.push(S(k.cylinder(BARREL[0], BARREL[1], 2.2, WZ + 5.6, BRIDGE_Z - WZ - 5.6, P, 12), { tone: 'hi', crease: 'none' }), S(k.cylinder(CENTRE[0], CENTRE[1], 2.2, WZ + 5.6, BRIDGE_Z - WZ - 5.6, P, 12), { tone: 'hi', crease: 'none' }));
		out.push(halo(bar, BRIDGE_Z, 0.1, 2), S(k.slabOf(bar, BRIDGE_Z, 3, P, 3, 0.5), { tone: 'mid' }));
		for (const [x, y] of [BARREL, CENTRE]) out.push(S(k.cylinder(x, y === BARREL[1] ? -27 : -27.2, 2.4, BRIDGE_Z + 3, 1.4, P, 12), { tone: 'hi' }), L(k.lineOnTop([x - 1.6, -27], [x + 1.6, -27], BRIDGE_Z + 4.4, P), { tone: 'lo', free: true }));
		out.push(L(k.lineOnTop([-46, -28.4], [-22, -28.4], BRIDGE_Z + 3, P) + k.lineOnTop([-46, -25.4], [-22, -25.4], BRIDGE_Z + 3, P), { tone: 'faint', free: true }));
		return out.join('');
	}

	function standBody() {
		const out = [halo(STAND, 0, STAND_H)];
		out.push(S(k.slabOf(STAND, 0, STAND_H, P, 4, 0.8), { tone: 'lo', inner: L(k.sideSeam(STAND, 5, P, 4), { tone: 'faint' }) }));
		out.push(L(k.planOutline(k.insetPlan(STAND, 4), STAND_H, P, 4), { tone: 'faint' }));
		out.push(D(k.corners(STAND, 4).map(([x, y]) => at([x, y, STAND_H])), { size: 0.45 }));
		const fy = STAND.y + STAND.d;
		out.push(S(k.slabOf({ x: -60, y: fy, w: 30, d: 1.2, r: 0.4 }, 2.4, 5.2, P, 2), { tone: 'mid', crease: 'none' }));
		out.push(L(`${k.segment([-56, fy + 1.2, 6.8], [-36, fy + 1.2, 6.8], P)}${k.segment([-56, fy + 1.2, 4.6], [-46, fy + 1.2, 4.6], P)}`, { tone: 'faint', free: true }));
		out.push(L(slots('y', fy, -100, 40, 20, 3, 7, 4), { tone: 'lo' }), dotsAt([[-114, fy, 2.4], [50, fy, 2.4], [-114, fy, 8], [50, fy, 8]], 0.45));
		for (const [x, y] of [[-106, -48], [38, -48], [-106, 24], [38, 24]] as const) {
			out.push(halo({ x: x - 5, y: y - 5, w: 10, d: 10, r: 5 }, STAND_H, 0.1, 1.5), S(k.cylinder(x, y, 5, STAND_H, 2.4, P, 20), { tone: 'mid' }), S(k.cylinder(x, y, 3.2, STAND_H + 2.4, PLATE_Z - STAND_H - 2.4, P, 16), { tone: 'hi', crease: 'none' }), L(k.sideArc(x, y, 3.2, 18, P, 14), { tone: 'faint' }), S(k.cylinder(x, y, 4.4, PLATE_Z - 2, 2, P, 16), { tone: 'mid' }));
		}
		return out.join('');
	}
	function plate() {
		const out = [halo(PLATE, PLATE_Z, 3, 2)];
		out.push(S(k.slabOf(PLATE, PLATE_Z, 3, P, 4, 0.6), { tone: 'mid', inner: L(k.sideSeam(PLATE, PLATE_Z + 1.4, P, 4), { tone: 'faint' }) }));
		out.push(L(k.planOutline(k.insetPlan(PLATE, 3), PLATE_TOP, P, 4), { tone: 'faint' }));
		const screws = k.corners(PLATE, 6);
		out.push(L(screws.map(([x, y]) => k.ring(x, y, 1.8, PLATE_TOP, P, 12)).join(''), { tone: 'lo' }), D(screws.map(([x, y]) => at([x, y, PLATE_TOP])), { size: 0.45, tone: 'hi' }));
		const bay: Plan = { x: CHIME.x - 1.5, y: CHIME.y - 1.5, w: CHIME.w + 3, d: CHIME.d + 3, r: 4 };
		out.push(L(k.planOutline(bay, PLATE_TOP, P, 4) + k.planOutline(k.insetPlan(bay, 3), PLATE_TOP, P, 4), { tone: 'lo' }));
		out.push(D([[12, -41], [38, -41], [12, -11], [38, -11]].map(([x, y]) => at([x, y, PLATE_TOP])), { size: 0.4 }));
		for (const [x, y] of [[-100, -46], [-60, -46], [-100, 22], [-30, 22]] as const) out.push(L(k.ring(x, y, 2.4, PLATE_TOP, P, 12), { tone: 'faint' }));
		const ff = PLATE.y + PLATE.d;
		out.push(L(slots('y', ff, -90, 20, 22, PLATE_Z + 0.7, PLATE_Z + 2.3, 4), { tone: 'lo' }), L(k.sideSeam(PLATE, PLATE_Z + 0.7, P, 4), { tone: 'faint' }));
		const strip: Plan = { x: -98, y: 24, w: 56, d: 3.6, r: 0.6 };
		out.push(S(k.slabOf(strip, PLATE_TOP, 0.5, P, 2), { tone: 'lo', crease: 'none' }));
		const tk = k.topTicks(strip.x + 3, strip.x + strip.w - 3, 3, 5, strip.y + 0.4, PLATE_TOP + 0.5, [1.6, 2.8], P);
		out.push(L(tk.minor, { tone: 'lo' }), L(tk.major, { tone: 'mid' }));
		return out.join('');
	}
	function rail() {
		const out = [halo(RAIL, 0, PLATE_TOP, 3)];
		for (const [x, y] of [[136, -44], [136, -8]] as const) out.push(S(k.cylinder(x, y, 4, 0, 4, P, 18), { tone: 'lo' }), S(k.cylinder(x, y, 2.8, 4, PLATE_Z - 4, P, 14), { tone: 'mid', crease: 'none' }), L(k.sideArc(x, y, 2.8, 14, P, 12), { tone: 'faint' }));
		out.push(S(k.slabOf(RAIL, PLATE_Z, 3, P, 3, 0.5), { tone: 'mid', inner: L(k.sideSeam(RAIL, PLATE_Z + 1.4, P, 3), { tone: 'faint' }) }));
		out.push(S(k.slabOf({ x: RAIL.x, y: RAIL.y, w: RAIL.w, d: 2.2, r: 0.4 }, PLATE_TOP, 2.4, P, 2), { tone: 'lo' }), S(k.slabOf({ x: RAIL.x, y: RAIL.y + RAIL.d - 2.2, w: RAIL.w, d: 2.2, r: 0.4 }, PLATE_TOP, 2.4, P, 2), { tone: 'lo' }));
		out.push(S(k.slabOf({ x: RAIL.x + RAIL.w - 3, y: RAIL.y + 2.2, w: 3, d: RAIL.d - 4.4, r: 0.4 }, PLATE_TOP, 3.4, P, 2), { tone: 'mid' }));
		const rt = k.topTicks(RAIL.x + 6, RAIL.x + RAIL.w - 8, 4, 5, RAIL.y + 2.4, PLATE_TOP, [1.4, 2.4], P);
		out.push(L(rt.minor, { tone: 'lo' }), L(rt.major, { tone: 'mid' }));
		out.push(L(slots('y', RAIL.y + RAIL.d, 52, 130, 13, PLATE_Z + 0.6, PLATE_Z + 2.4, 3.4), { tone: 'lo' }), dotsAt([[RAIL.x + RAIL.w, -42, 31], [RAIL.x + RAIL.w, -10, 31]], 0.4));
		return out.join('');
	}

	function dial() {
		const [cx, cz] = [-58, 29];
		const foot: Plan = { x: -86, y: -78, w: 56, d: 9, r: 1.5 };
		const face: Plan = { x: -80, y: -73, w: 44, d: 2.4, r: 1.2 };
		const f = face.y + face.d;
		const out = [halo(foot, 0, 8, 2), S(k.slabOf(foot, 0, 8, P, 3, 0.6), { tone: 'lo' }), L(k.planOutline(k.insetPlan(foot, 1.6), 8, P, 3), { tone: 'faint' })];
		out.push(S(k.slabOf(face, 8, 42, P, 4, 0.6), { tone: 'hi' }));
		out.push(L(k.sideRing([cx, f, cz], 18, 'y', P, 48) + k.sideRing([cx, f, cz], 15.4, 'y', P, 40), { tone: 'mid' }));
		for (let i = 0; i < 12; i++) {
			const a = (i / 12) * Math.PI * 2;
			const [s, c] = [Math.sin(a), Math.cos(a)];
			const r0 = i % 3 ? 12.6 : 11;
			out.push(L(seg([cx + s * r0, f, cz + c * r0], [cx + s * 15.4, f, cz + c * 15.4]), { tone: i % 3 ? 'lo' : 'mid' }));
		}
		out.push(L(seg([cx, f, cz], [cx - 5.2, f, cz + 6]) + seg([cx, f, cz], [cx + 1.2, f, cz + 11]), { tone: 'hi' }), D([at([cx, f, cz]), at([face.x + 3, f, 11]), at([face.x + face.w - 3, f, 11]), at([face.x + 3, f, 47]), at([face.x + face.w - 3, f, 47])], { size: 0.5, tone: 'hi' }));
		return out.join('');
	}

	function pendulum() {
		const [px, py] = PEND;
		const post: Plane = [-147, -34];
		const out = [halo({ x: post[0] - 6, y: post[1] - 6, w: 12, d: 12, r: 6 }, 0, 4, 2)];
		out.push(S(k.cylinder(post[0], post[1], 6, 0, 3, P, 20, 0.4), { tone: 'lo' }), S(k.cylinder(post[0], post[1], 3, 3, 62, P, 16), { tone: 'mid', crease: 'none' }), L(k.sideArc(post[0], post[1], 3, 24, P, 14) + k.sideArc(post[0], post[1], 3, 44, P, 14), { tone: 'faint' }));
		out.push(S(k.slabOf({ x: post[0] - 3, y: -37, w: 25, d: 6, r: 1.5 }, 62, 4, P, 3, 0.4), { tone: 'hi' }), D([at([post[0], post[1], 66]), at([post[0] + 19, post[1], 66])], { size: 0.45, tone: 'hi' }));
		out.push(S(k.slabOf({ x: px - 1.2, y: py - 1.2, w: 2.4, d: 2.4, r: 0.6 }, 14, 48, P, 2), { tone: 'hi', crease: 'none' }));
		out.push(S(k.cylinder(px, py, 8, 8, 5, P, 32, 0.6), { tone: 'hi' }), L(k.ring(px, py, 5.4, 13, P, 24), { tone: 'mid' }), L(k.knurl(px, py, 8, 8, 13, 24, P, 0.3), { tone: 'lo' }), S(k.cylinder(px, py, 2.2, 13, 2, P, 12), { tone: 'mid' }), D([at([px, py, 15])], { size: 0.45, tone: 'hi' }));
		out.push(halo({ x: px - 8, y: py - 8, w: 16, d: 16, r: 8 }, 0, 0.1, 2.5));
		return out.join('');
	}

	function gauge() {
		const [cx, cy] = GAUGE;
		const out = [halo({ x: cx - 18, y: cy - 18, w: 36, d: 36, r: 18 }, 0, 4)];
		out.push(S(k.cylinder(cx, cy, 17, 0, 4, P, 40, 0.6), { tone: 'lo' }), L(k.knurl(cx, cy, 17, 0.6, 3.4, 30, P, 0.3), { tone: 'faint' }));
		out.push(S(k.cylinder(cx, cy, 4.4, 4, GAUGE_Z - 11, P, 20), { tone: 'mid', crease: 'none' }), L(k.sideArc(cx, cy, 4.4, 10, P, 14), { tone: 'faint' }));
		out.push(S(k.cylinder(cx, cy, 14, GAUGE_Z - 7, 7, P, 52, 0.8), { tone: 'hi' }), L(k.knurl(cx, cy, 14, GAUGE_Z - 7, GAUGE_Z, 40, P, 0.3), { tone: 'lo' }));
		out.push(L(k.ring(cx, cy, 11.6, GAUGE_Z, P, 44), { tone: 'mid' }), L(k.ring(cx, cy, 8, GAUGE_Z, P, 36), { tone: 'faint' }));
		const t = k.radialTicks(cx, cy, 11.6, 15, 5, GAUGE_Z, [1.6, 3], P, -2.1, 4.2);
		out.push(L(t.minor, { tone: 'lo' }), L(t.major, { tone: 'mid' }));
		const needle = (a: number) => {
			const tipP: Plane = [cx + Math.sin(a) * 10.2, cy - Math.cos(a) * 10.2];
			const tail: Plane = [cx - Math.sin(a) * 3.4, cy + Math.cos(a) * 3.4];
			const [sx, sy] = [Math.cos(a) * 1.2, Math.sin(a) * 1.2];
			return S(k.extrude([tipP, [cx + sx, cy + sy], tail, [cx - sx, cy - sy]], GAUGE_Z + 2, 0.7, P), { tone: 'lo' });
		};
		out.push(S(k.cylinder(cx, cy, 2.2, GAUGE_Z, 2, P, 14), { tone: 'mid' }));
		out.push(stepSvg('dim-from', 2, needle(-1.5)), stepSvg('show-from', 2, needle(0.5)));
		out.push(D([at([cx, cy, GAUGE_Z + 2])], { size: 0.5, tone: 'hi' }));
		const bolts: Point3[] = [0, 1, 2, 3, 4].map((i) => [cx + Math.cos(i * 1.2566 + 0.4) * 14.8, cy + Math.sin(i * 1.2566 + 0.4) * 14.8, 4]);
		out.push(L(bolts.map(([x, y]) => k.ring(x, y, 1.2, 4, P, 10)).join(''), { tone: 'lo' }), dotsAt(bolts, 0.4, 'hi'));
		return out.join('');
	}

	function tray() {
		const back = [halo(TRAY, 0, TRAY_TOP, 4)];
		for (const [x, y] of k.corners(TRAY, 4)) back.push(S(k.cylinder(x, y, 2.6, 0, TRAY_TOP - 4, P, 12), { tone: 'mid', crease: 'none' }));
		back.push(S(k.slabOf(TRAY, TRAY_TOP - 4, 4, P, 3, 0.5), { tone: 'mid', inner: L(k.sideSeam(TRAY, TRAY_TOP - 2, P, 3), { tone: 'faint' }) }));
		back.push(S(k.slabOf({ x: TRAY.x, y: TRAY.y, w: TRAY.w, d: 3, r: 1 }, TRAY_TOP, 5, P, 2, 0.3), { tone: 'mid' }));
		for (const x of [TRAY.x, TRAY.x + TRAY.w - 3]) back.push(S(k.slabOf({ x, y: TRAY.y + 3, w: 3, d: TRAY.d - 6, r: 1 }, TRAY_TOP, 5, P, 2, 0.3), { tone: 'mid' }));
		back.push(L(k.planOutline(k.insetPlan(TRAY, 6), TRAY_TOP, P, 3), { tone: 'faint' }));
		const [bx, by] = [88, 56];
		back.push(S(k.cylinder(bx, by, 5, TRAY_TOP, 1.8, P, 14), { tone: 'lo' }), S(k.extrude(gearRing([bx, by], 6.6, 4.6, 8, 0.3), TRAY_TOP + 1.8, 2, P, { convex: false }), { tone: 'hi' }), S(k.cylinder(bx, by, 1.6, TRAY_TOP + 3.8, 1.4, P, 10), { tone: 'mid' }));
		const box: Plan = { x: 80, y: 64, w: 14, d: 10, r: 1.4 };
		back.push(S(k.slabOf(box, TRAY_TOP, 3.6, P, 3, 0.4), { tone: 'lo' }), L(k.lineOnTop([box.x + 2, box.y + 5], [box.x + 12, box.y + 5], TRAY_TOP + 3.6, P), { tone: 'faint', free: true }));
		for (const [x, y] of [[40, 60], [43, 70], [38, 52]] as const) back.push(S(k.cylinder(x, y, 2, TRAY_TOP, 2.2, P, 8), { tone: 'hi' }), L(k.ring(x, y, 0.8, TRAY_TOP + 2.2, P, 8), { tone: 'lo' }));
		const front: Plan = { x: TRAY.x, y: TRAY.y + TRAY.d - 3, w: TRAY.w, d: 3, r: 1 };
		const ff = front.y + front.d;
		const fr = S(k.slabOf(front, TRAY_TOP, 5, P, 2, 0.3), { tone: 'mid' }) + L(k.segment([50, ff, TRAY_TOP + 1.6], [80, ff, TRAY_TOP + 1.6], P), { tone: 'faint', free: true }) + L(`${k.segment([50, ff, TRAY_TOP + 3.4], [66, ff, TRAY_TOP + 3.4], P)}`, { tone: 'faint', free: true }) + dotsAt([[TRAY.x + 4, ff, TRAY_TOP + 2.5], [TRAY.x + TRAY.w - 4, ff, TRAY_TOP + 2.5]], 0.4);
		return { back: back.join(''), front: fr };
	}

	function chime() {
		const out = [halo(CHIME, PLATE_TOP, 7, 2)];
		out.push(S(k.slabOf(CHIME, PLATE_TOP, 7, P, 4, 0.8), { tone: 'hi', inner: L(k.sideSeam(CHIME, PLATE_TOP + 3, P, 4), { tone: 'faint' }) }));
		out.push(L(k.planOutline(k.insetPlan(CHIME, 3), PLATE_TOP + 7, P, 4), { tone: 'faint' }));
		const top = PLATE_TOP + 7;
		const [bx, by] = [20, -33];
		out.push(S(k.cylinder(bx, by, 9, top, 3, P, 32, 0.4), { tone: 'mid' }), L(k.knurl(bx, by, 9, top, top + 3, 24, P, 0.3), { tone: 'lo' }));
		out.push(S(k.cylinder(bx, by, 7.2, top + 3, 4, P, 28), { tone: 'hi' }), S(k.cylinder(bx, by, 5, top + 7, 3, P, 24), { tone: 'hi' }), L(k.sideArc(bx, by, 7.2, top + 5, P, 20), { tone: 'mid' }), S(k.cylinder(bx, by, 2.2, top + 10, 2.2, P, 12), { tone: 'mid' }), D([at([bx, by, top + 12.2])], { size: 0.5, tone: 'hi' }));
		for (const [x, y, h] of [[33, -39, 15], [33, -31, 11], [33, -23, 7.5]] as const) out.push(S(k.cylinder(x, y, 1.3, top, h, P, 10), { tone: 'hi', crease: 'none' }), L(k.ring(x, y, 2.2, top + 0.4, P, 10), { tone: 'lo' }));
		out.push(S(k.slabOf({ x: 12, y: -22, w: 21, d: 2.4, r: 0.8 }, top + 5, 2, P, 2), { tone: 'mid' }), S(k.cylinder(31.6, -20.8, 2.4, top + 3.4, 5, P, 12), { tone: 'hi' }), S(k.cylinder(12, -20.8, 2.2, top, 7, P, 12), { tone: 'mid', crease: 'none' }), L(k.ring(12, -20.8, 3.2, top, P, 12), { tone: 'lo' }));
		out.push(S(k.cylinder(24, -12, 3, top, 4, P, 14), { tone: 'lo' }), S(k.extrude(gearRing([24, -12], 5.2, 3.6, 8, 0.2), top + 4, 2, P, { convex: false }), { tone: 'mid' }), S(k.cylinder(24, -12, 1.2, top + 6, 1.2, P, 8), { tone: 'hi' }));
		const fy = CHIME.y + CHIME.d;
		const win: Plan = { x: 14, y: fy, w: 22, d: 1.2, r: 0.6 };
		out.push(S(k.slabOf(win, PLATE_TOP + 1.4, 4.4, P, 2), { tone: 'lo' }));
		out.push(stepSvg('lit-at', 4, S(k.slabOf(k.insetPlan(win, 1.2), PLATE_TOP + 2, 3, P, 2), { tone: 'hi', lit: true })));
		out.push(S(k.slabOf({ x: 11.4, y: fy, w: 2.2, d: 1.4, r: 0.4 }, PLATE_TOP + 1, 5, P, 2), { tone: 'mid', crease: 'none' }), dotsAt([[CHIME.x + 3, fy, PLATE_TOP + 5.4], [CHIME.x + CHIME.w - 3, fy, PLATE_TOP + 5.4], [CHIME.x + CHIME.w, CHIME.y + 5, PLATE_TOP + 5], [CHIME.x + CHIME.w, fy - 5, PLATE_TOP + 5]], 0.45));
		out.push(L(slots('x', CHIME.x + CHIME.w, -38, -14, 8, PLATE_TOP + 1.6, PLATE_TOP + 5.2, 2.6), { tone: 'lo' }));
		return out.join('');
	}

	function loupePillar() {
		const [x, y] = LOUPE_AT;
		const out = [halo({ x: x - 9, y: y - 9, w: 18, d: 18, r: 9 }, 0, 4, 2)];
		out.push(S(k.cylinder(x, y, 9, 0, 3, P, 28, 0.5), { tone: 'lo' }), L(k.knurl(x, y, 9, 0, 3, 20, P, 0.3), { tone: 'faint' }), S(k.cylinder(x, y, 5.6, 3, 4, P, 24), { tone: 'mid' }));
		out.push(S(k.cylinder(x, y, 3, 7, LOUPE_Z - 9, P, 18), { tone: 'hi', crease: 'none' }), L(k.sideArc(x, y, 3, 24, P, 14) + k.sideArc(x, y, 3, 44, P, 14), { tone: 'faint' }), S(k.cylinder(x, y, 4.2, 30, 2.6, P, 18), { tone: 'mid' }), D([at([x - 2, y, 31])], { size: 0.4, tone: 'hi' }));
		return out.join('');
	}
	function loupeArm() {
		const [x, y] = LOUPE_AT;
		const tx = x + LOUPE_LEN;
		const out: string[] = [];
		out.push(S(k.slabOf({ x: x - 4, y: y - 3, w: LOUPE_LEN + 4, d: 6, r: 2 }, LOUPE_Z - 2, 4, P, 3, 0.5), { tone: 'hi' }), S(k.cylinder(x, y, 5, LOUPE_Z - 2, 6, P, 22, 0.4), { tone: 'mid' }), L(k.lineOnTop([x + 8, y], [tx - 14, y], LOUPE_Z + 2, P), { tone: 'faint' }));
		out.push(D([at([x, y, LOUPE_Z + 4.4]), at([tx - 4, y, LOUPE_Z + 2])], { size: 0.45, tone: 'hi' }));
		return out.join('');
	}
	function loupeLens() {
		const [x, y] = LOUPE_AT;
		const tx = x + LOUPE_LEN;
		const out: string[] = [];
		out.push(S(k.cylinder(tx, y, 1.4, LOUPE_Z - 12, 10, P, 10), { tone: 'hi', crease: 'none' }));
		const lz = LOUPE_Z - 22;
		out.push(S(k.cylinder(tx, y, 10, lz, 9, P, 36, 0.6), { tone: 'hi' }), L(k.knurl(tx, y, 10, lz, lz + 9, 28, P, 0.3), { tone: 'lo' }), L(k.ring(tx, y, 7.6, lz + 9, P, 30) + k.ring(tx, y, 5.4, lz + 9, P, 24), { tone: 'mid' }), L(k.lineOnTop([tx - 3, y + 2], [tx + 1, y - 3], lz + 9, P), { tone: 'faint', free: true }), L(k.sideArc(tx, y, 10, lz + 4.5, P, 24), { tone: 'mid' }));
		return out.join('');
	}

	const TO_SLOT: Point3 = [SLOT[0] - SPARE_AT[0], SLOT[1] - SPARE_AT[1], WZ - SPARE_Z];
	const swingOf = [0, LOUPE_ON, LOUPE_ON, 0].map((d) => swing(LOUPE_AT, d, LOUPE_Z));
	const lensAt = [0, LOUPE_ON, LOUPE_ON, 0].map((d): Point3 => [LOUPE_LEN * (Math.cos((d * Math.PI) / 180) - 1), LOUPE_LEN * Math.sin((d * Math.PI) / 180), 0]);
	const transforms: Record<'spare' | 'chime' | 'loupe' | 'lens', string[]> = {
		...(transformsFrom(P, {
			spare: [ZERO, ZERO, TO_SLOT, TO_SLOT],
			chime: [[CHIME_SLIDE, 0, 0], [CHIME_SLIDE, 0, 0], [CHIME_SLIDE, 0, 0], ZERO],
					lens: lensAt,
		}) as Record<'spare' | 'chime' | 'lens', string[]>),
		loupe: swingOf,
	};
	const pair = (name: string, tf: string, body: string) => `<g class="mover tint" style="--pigment:var(--verdigris)" data-part="${name}" transform="${tf}">${body}</g>`;
	const trayParts = tray();

	const svg = k.figureSvg({
		width,
		height,
		label:
			'An open clock movement on a watchmaker service stand: a train of brass gears under a bridge, an escapement, a pendulum and a dial. A loupe on a swing arm comes over the movement to check it and a gauge needle reads, a fresh gear is lifted from the parts tray into the empty slot in the train, and a chime module slides on beside it and lights.',
		body: [
			base(),
			dial(),
			loupePillar(),
			pendulum(),
			standBody(),
			rail(),
			plate(),
			movement(),
			moverSvg('chime', transforms.chime[3], chime()),
			gauge(),
			trayParts.back,
			moverSvg('spare', transforms.spare[3], wheel({ ...SPARE, c: SPARE_AT, z: SPARE_Z })),
			trayParts.front,
			pair('loupe', transforms.loupe[3], loupeArm()),
			pair('lens', transforms.lens[3], loupeLens()),
		],
	});
	return { svg, labels: LABELS, transforms };
}
