import * as k from '../../lib/anatomy/iso-kit';
import type { Plan, Point3 } from '../../lib/anatomy/iso-kit';
import { moverSvg, stepSvg, type Machine } from '../../lib/plate';

export const LABELS = ['your tools today', 'joined into one', 'shaped around you', 'running every day'] as const;
export const CAPTION = 'a6n joins your website, customer app, payments, messages, staff screen and reports into one system, then shapes it around how your business works.';

const BASE: Plan = { x: -200, y: -145, w: 400, d: 290, r: 10 };
const BASE_H = 10;
const FOOT_H = 5;
const PLINTH: Plan = { x: -36, y: -30, w: 72, d: 60, r: 3 };
const T = 2.4;

interface Mod {
	name: string;
	dock: [number, number];
	loose: [number, number];
	tilt: number;
}
const MODS: Mod[] = [
	{ name: 'website', dock: [-105, -28], loose: [-160, -72], tilt: -9 },
	{ name: 'app', dock: [-82, 52], loose: [-155, 100], tilt: 7 },
	{ name: 'payments', dock: [-5, 80], loose: [-30, 120], tilt: -11 },
	{ name: 'messages', dock: [95, -65], loose: [160, -100], tilt: 8 },
	{ name: 'staff', dock: [-18, -88], loose: [28, -108], tilt: 12 },
	{ name: 'reports', dock: [92, 22], loose: [155, 60], tilt: -7 },
];

export function system(width = 760, height = 520): Machine {
	const P = k.fitProjection(
		[...k.boxCorners(BASE, -BASE_H - FOOT_H, 0), [0, -20, 100]],
		width,
		height,
		{ pad: 14, azimuth: 40, elevation: 38 },
	);
	const at = (p: Point3) => k.iso(p, P);
	const S = k.solidSvg;
	const L = k.lineSvg;
	const D = k.dotsSvg;
	const dots = (pts: Point3[], size = 0.45, tone: 'hi' | 'mid' | 'lo' | 'faint' = 'mid') => D(pts.map(at), { size, tone });
	const halo = (plan: Plan, z: number, h: number) => `<path class="iso-halo" d="${k.haloOf(plan, z, h, P)}"/>`;
	const slab = (x: number, y: number, w: number, d: number, z: number, h: number, tone: 'hi' | 'mid' | 'lo' = 'mid', o: { r?: number; steps?: number; bevel?: number; thin?: boolean; lit?: boolean; seam?: number } = {}) => {
		const plan: Plan = { x, y, w, d, r: o.r ?? 0.6 };
		const inner = o.seam ? L(k.sideSeam(plan, o.seam, P, o.steps ?? 3), { tone: 'faint' }) : '';
		return S(k.slabOf(plan, z, h, P, o.steps ?? 2, o.bevel ?? 0.2), { tone, crease: o.thin ? 'none' : 'faint', lit: o.lit, inner });
	};
	const cyl = (cx: number, cy: number, r: number, z: number, h: number, tone: 'hi' | 'mid' | 'lo' = 'mid', bevel = 0.3, lit = false) => S(k.cylinder(cx, cy, r, z, h, P, r > 5 ? 28 : 16, bevel), { tone, lit });
	const seg = (a: Point3, b: Point3, tone: 'mid' | 'lo' | 'faint' = 'mid') => L(k.segment(a, b, P), { tone, free: true });
	const flat = (pts: [number, number][], z: number, tone: 'mid' | 'lo' | 'faint' = 'lo') => L(k.onTop(pts, z, P), { tone, free: true });
	const lamp = (x: number, y: number, z: number) => cyl(x, y, 1.7, z, 1.6, 'mid', 0.2) + stepSvg('lit-at', 4, cyl(x, y, 1.2, z + 1.6, 0.9, 'hi', 0.15, true));

	function base() {
		const out = [halo(BASE, -BASE_H - FOOT_H, BASE_H)];
		for (const [x, y] of [...k.corners(BASE, 26), [0, BASE.y + 26], [0, BASE.y + BASE.d - 26]].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P))) {
			out.push(cyl(x, y, 9, -BASE_H - FOOT_H, 1.8, 'lo', 0.4), cyl(x, y, 6.5, -BASE_H - FOOT_H + 1.8, FOOT_H - 1.8, 'mid', 0.3));
		}
		out.push(S(k.slabOf(BASE, -BASE_H, BASE_H, P, 10, 1.6), { tone: 'mid', inner: L(k.sideSeam(BASE, -BASE_H / 2, P, 10), { tone: 'faint' }) }));
		out.push(L(k.planOutline(k.insetPlan(BASE, 5), 0, P, 10), { tone: 'lo' }), L(k.planOutline(k.insetPlan(BASE, 8), 0, P, 10), { tone: 'faint' }));
		const screws = k.corners(BASE, 11);
		out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.4, 0, P, 16)).join(''), { tone: 'lo' }), dots(screws.map(([x, y]) => [x, y, 0] as Point3), 0.55));
		for (const [x, y] of screws) out.push(L(k.lineOnTop([x - 1.4, y], [x + 1.4, y], 0, P), { tone: 'faint', free: true }));
		const back: Plan = { x: -140, y: BASE.y + 11, w: 280, d: 6, r: 1 };
		out.push(slab(back.x, back.y, back.w, back.d, 0, 0.6, 'lo', { thin: true, steps: 3 }));
		const bt = k.topTicks(back.x + 4, back.x + back.w - 4, 5, 5, back.y + 0.8, 0.6, [2, 3.4], P);
		out.push(L(bt.minor, { tone: 'lo' }), L(bt.major, { tone: 'mid' }), dots([[back.x + 2, back.y + 3, 0.6], [back.x + back.w - 2, back.y + 3, 0.6]]));
		const front: Plan = { x: 0, y: BASE.y + BASE.d - 17, w: 110, d: 6, r: 1 };
		out.push(slab(front.x, front.y, front.w, front.d, 0, 0.6, 'lo', { thin: true, steps: 3 }));
		const ft = k.topTicks(front.x + 4, front.x + front.w - 4, 5, 5, front.y + 0.8, 0.6, [2, 3.4], P);
		out.push(L(ft.minor, { tone: 'lo' }), L(ft.major, { tone: 'mid' }), dots([[front.x + 2, front.y + 3, 0.6], [front.x + front.w - 2, front.y + 3, 0.6]]));
		const side: Plan = { x: BASE.x + BASE.w - 17, y: -70, w: 6, d: 110, r: 1 };
		out.push(slab(side.x, side.y, side.w, side.d, 0, 0.6, 'lo', { thin: true, steps: 3 }));
		const st = k.topTicks(side.y + 4, side.y + side.d - 4, 5, 5, side.x + 0.8, 0.6, [2, 3.4], P, 'y');
		out.push(L(st.minor, { tone: 'lo' }), L(st.major, { tone: 'mid' }));
		const lab: Plan = { x: -185, y: BASE.y + BASE.d - 19, w: 54, d: 11, r: 1.5 };
		out.push(slab(lab.x, lab.y, lab.w, lab.d, 0, 0.8, 'lo', { steps: 3 }));
		for (const [dy, w] of [[2.6, 44], [5.4, 30], [8.2, 38]] as const) out.push(L(k.lineOnTop([lab.x + 5, lab.y + dy], [lab.x + w, lab.y + dy], 0.8, P), { tone: 'faint', free: true }));
		out.push(dots([[lab.x + 2, lab.y + 2, 0.8], [lab.x + lab.w - 2, lab.y + 2, 0.8], [lab.x + 2, lab.y + lab.d - 2, 0.8], [lab.x + lab.w - 2, lab.y + lab.d - 2, 0.8]], 0.4));
		return out.join('');
	}

	function cableOf([cx, cy]: [number, number]) {
		const ex = cx * Math.min(36 / Math.abs(cx), 30 / Math.abs(cy));
		const ey = cy * Math.min(36 / Math.abs(cx), 30 / Math.abs(cy));
		const kx = cx - cx * Math.min(27 / Math.abs(cx), 23 / Math.abs(cy));
		const ky = cy - cy * Math.min(27 / Math.abs(cx), 23 / Math.abs(cy));
		return { a: [kx, ky] as [number, number], b: [ex, ey] as [number, number] };
	}

	function docks() {
		const out: string[] = [];
		const sorted = [...MODS].sort((p, q) => k.depthOf([p.dock[0], p.dock[1], 0], P) - k.depthOf([q.dock[0], q.dock[1], 0], P));
		for (const m of sorted) {
			const [cx, cy] = m.dock;
			const pad: Plan = { x: cx - 28, y: cy - 24, w: 56, d: 48, r: 3 };
			out.push(halo(pad, 0, 3));
			out.push(S(k.slabOf(pad, 0, 3, P, 4, 0.7), { tone: 'lo', inner: L(k.sideSeam(pad, 1.6, P, 4), { tone: 'faint' }) }));
			out.push(L(k.planOutline(k.insetPlan(pad, 3), 3, P), { tone: 'faint' }), L(k.planOutline(k.insetPlan(pad, 5), 3, P), { tone: 'faint' }));
			out.push(slab(cx - 25, cy - 21, 3, 42, 3, 1.6, 'mid', { thin: true }), slab(cx + 22, cy - 21, 3, 42, 3, 1.6, 'mid', { thin: true }));
			for (const [x, y] of k.corners(pad, 3)) out.push(L(k.ring(x, y, 1.2, 3, P, 10), { tone: 'lo' }));
			out.push(dots(k.corners(pad, 3).map(([x, y]) => [x, y, 3] as Point3), 0.45));
			out.push(L(k.lineOnTop([cx - 12, cy + 19.4], [cx + 12, cy + 19.4], 3, P), { tone: 'faint', free: true }));
			const { a } = cableOf(m.dock);
			out.push(slab(a[0] - 2.4, a[1] - 2.4, 4.8, 4.8, 3, 2, 'hi', { r: 0.8, thin: true }));
			out.push(cyl(cx + 18, cy + 17, 1.9, 3, 1.2, 'lo', 0.2));
			out.push(stepSvg('show-from', 3, L(k.ring(cx + 18, cy + 17, 3.1, 3, P, 14), { tone: 'mid' }) + cyl(cx + 18, cy + 17, 1.3, 4.2, 0.9, 'hi', 0.15) + dots([[cx + 18, cy + 17, 5.1]], 0.4, 'hi')));
			out.push(stepSvg('lit-at', 4, cyl(cx + 18, cy + 17, 1.1, 5.1, 0.7, 'hi', 0.1, true)));
		}
		return out.join('');
	}

	function cables() {
		const out: string[] = [];
		for (const m of MODS) {
			const { a, b } = cableOf(m.dock);
			const mid: [number, number] = [(a[0] + b[0]) / 2 + (m.dock[1] > 0 ? 6 : -6), (a[1] + b[1]) / 2 + (m.dock[0] > 0 ? -6 : 6)];
			out.push(L(k.onTop([a, mid, b], 3.4, P), { tone: 'lo' }) + L(k.onTop([a, mid, b], 0.4, P), { tone: 'faint' }));
			out.push(dots([[a[0], a[1], 3.4], [b[0], b[1], 2.4]], 1, 'hi'));
			out.push(slab(mid[0] - 2, mid[1] - 2, 4, 4, 0, 1.4, 'mid', { thin: true, r: 0.8 }), dots([[mid[0], mid[1], 1.4]], 0.4));
		}
		return stepSvg('show-from', 2, out.join(''));
	}

	function hub() {
		const out = [halo(PLINTH, 0, 4)];
		out.push(S(k.slabOf(PLINTH, 0, 4, P, 4, 0.8), { tone: 'lo', inner: L(k.sideSeam(PLINTH, 2, P, 4), { tone: 'faint' }) }));
		out.push(L(k.planOutline(k.insetPlan(PLINTH, 3), 4, P), { tone: 'faint' }));
		out.push(dots(k.corners(PLINTH, 3.4).map(([x, y]) => [x, y, 4] as Point3), 0.5), L(k.corners(PLINTH, 3.4).map(([x, y]) => k.ring(x, y, 1.5, 4, P, 12)).join(''), { tone: 'lo' }));
		for (const m of MODS) {
			const { b } = cableOf(m.dock);
			out.push(slab(b[0] - 2.6, b[1] - 2.6, 5.2, 5.2, 0, 2.6, 'hi', { r: 0.8, thin: true }));
		}
		const B: Plan = { x: -32, y: -26, w: 64, d: 52, r: 3 };
		const BT = 4;
		const BH = 32;
		const top = BT + BH;
		out.push(halo(B, BT, BH));
		out.push(S(k.slabOf(B, BT, BH, P, 4, 0.9), { tone: 'mid', inner: L(k.sideSeam(B, BT + 10, P, 4), { tone: 'faint' }) + L(k.sideSeam(B, BT + 24, P, 4), { tone: 'faint' }) }));
		out.push(L(k.planOutline(k.insetPlan(B, 3), top, P), { tone: 'faint' }));
		out.push(dots(k.corners(B, 3).map(([x, y]) => [x, y, top] as Point3), 0.45));
		const fy = B.y + B.d;
		// socket row on the front face: one per module
		out.push(slab(-28, fy, 56, 0.8, BT + 8, 9, 'lo', { r: 0.3, thin: true }));
		for (let i = 0; i < 6; i++) {
			const x = -23 + i * 9.2;
			out.push(L(k.ring(x, fy + 0.8, 2.2, BT + 12.5, P, 12), { tone: 'mid', free: true }), D([at([x, fy + 0.8, BT + 12.5])], { size: 0.8, tone: 'hi' }));
		}
		for (const z of [BT + 3, BT + 5]) out.push(seg([-28, fy, z], [28, fy, z], 'faint'));
		for (const x of [-26, 26]) out.push(slab(x - 1.6, fy - 0.2, 3.2, 0.9, BT, 2, 'lo', { thin: true, r: 0.2 }));
		// vents on the right face
		const rx = B.x + B.w;
		for (const z of [BT + 6, BT + 10, BT + 14, BT + 18, BT + 22]) out.push(seg([rx, -16, z], [rx, 16, z], 'faint'));
		out.push(slab(rx, -20, 0.8, 5, BT + 26, 3, 'lo', { thin: true, r: 0.2 }), slab(rx, 15, 0.8, 5, BT + 26, 3, 'lo', { thin: true, r: 0.2 }));
		// desk top: lamps, knobs, keys, slider
		for (let i = 0; i < 6; i++) out.push(lamp(-23 + i * 9.2, fy - 4.2, top));
		for (const [x, y] of [[-20, 8], [-9, 8]] as const) {
			out.push(cyl(x, y, 3.8, top, 3.4, 'mid', 0.5), L(k.knurl(x, y, 3.8, top, top + 3.4, 14, P, 0.3), { tone: 'lo' }), L(k.ring(x, y, 2.4, top + 3.4, P, 12), { tone: 'faint' }), L(k.lineOnTop([x, y], [x + 1.6, y - 2.2], top + 3.4, P), { tone: 'mid', free: true }));
		}
		out.push(slab(2, 3, 28, 13, top, 1, 'lo', { r: 1.5, steps: 3, thin: true }));
		for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) out.push(slab(4.4 + i * 6.4, 5 + j * 5.4, 4.8, 4, top + 1, 1.6, 'hi', { r: 0.8, bevel: 0.25, thin: true }));
		out.push(slab(-26, 0, 8, 1.8, top, 0.8, 'lo', { thin: true }), slab(-23, -0.6, 1.8, 3, top + 0.8, 1, 'hi', { thin: true }));
		out.push(L(k.lineOnTop([-30, 3], [-28, 3], top, P), { tone: 'mid', free: true }));
		// upright head and screen
		const H: Plan = { x: -28, y: -24, w: 56, d: 9, r: 2 };
		out.push(S(k.slabOf(H, top, 36, P, 4, 0.8), { tone: 'mid', inner: L(k.sideSeam(H, top + 5, P, 4), { tone: 'faint' }) }));
		out.push(L(k.planOutline(k.insetPlan(H, 1.6), top + 36, P), { tone: 'faint' }));
		const sy = H.y + H.d;
		out.push(slab(-25, sy - 0.2, 50, 0.6, top + 3, 30, 'lo', { r: 0.6, thin: true }));
		out.push(stepSvg('lit-at', 4, S(k.slabOf({ x: -23, y: sy + 0.2, w: 46, d: 0.6, r: 0.5 }, top + 5, 26, P, 2), { tone: 'hi', lit: true })));
		for (const [i, z] of [top + 28, top + 23, top + 18].entries()) {
			out.push(seg([-14, sy + 0.8, z], [8 - i * 3, sy + 0.8, z], 'mid'), L(k.ring(-19, sy + 0.8, 1.2, z, P, 10), { tone: 'mid', free: true }), dots([[17, sy + 0.8, z]], 0.8 - i * 0.1));
		}
		for (const [i, h] of [3, 5, 7, 5, 9, 6].entries()) out.push(seg([-20 + i * 3.6, sy + 0.8, top + 7], [-20 + i * 3.6, sy + 0.8, top + 7 + h], 'mid'));
		out.push(dots([[0, sy, top + 2], [0, sy, top + 33]], 0.5));
		// aerial / flag pole (flag appears at step 3)
		out.push(cyl(20, -19, 2, top + 36, 1.4, 'lo', 0.3), cyl(20, -19, 0.8, top + 37.4, 22, 'mid', 0.2));
		out.push(cyl(20, -19, 1.3, top + 59.4, 1, 'hi', 0.2));
		out.push(stepSvg('show-from', 3, slab(20.8, -19.4, 0.9, 11, top + 50, 8, 'hi', { thin: true, r: 0.2 }) + seg([20.8, -19.4 + 3, top + 54], [20.8, -19.4 + 8, top + 54], 'mid') + seg([20.8, -19.4 + 3, top + 56.4], [20.8, -19.4 + 6, top + 56.4], 'mid')));
		// nameplate on the front (appears at step 3)
		out.push(stepSvg('show-from', 3, slab(-17, fy, 34, 0.9, BT + 19, 9, 'hi', { r: 0.4, thin: true }) + seg([-14, fy + 0.9, BT + 25], [10, fy + 0.9, BT + 25], 'mid') + seg([-14, fy + 0.9, BT + 22.5], [2, fy + 0.9, BT + 22.5], 'faint') + dots([[-15.5, fy + 0.9, BT + 20.2], [15.5, fy + 0.9, BT + 20.2], [-15.5, fy + 0.9, BT + 26.8], [15.5, fy + 0.9, BT + 26.8]], 0.4)));
		return out.join('');
	}

	function tray(cx: number, cy: number, n: number) {
		const plan: Plan = { x: cx - 22, y: cy - 18, w: 44, d: 36, r: 3 };
		const out = [halo(plan, 0, T)];
		out.push(S(k.slabOf(plan, 0, T, P, 4, 0.6), { tone: 'mid', inner: L(k.sideSeam(plan, T / 2, P, 4), { tone: 'faint' }) }));
		out.push(L(k.planOutline(k.insetPlan(plan, 2.6), T, P), { tone: 'faint' }));
		out.push(dots(k.corners(plan, 2.6).map(([x, y]) => [x, y, T] as Point3), 0.45));
		out.push(slab(cx + 11, cy + 8.5, 10, 7, T, 0.8, 'lo', { r: 1, thin: true }));
		out.push(k.faceTextSvg(k.topMatrix([cx + 16, cy + 14.2], T + 0.8, P, 'x'), String(n), { size: 4, tone: 'hi', anchor: 'middle' }));
		out.push(dots([[cx + 12.2, cy + 9.7, T + 0.8], [cx + 19.8, cy + 9.7, T + 0.8]], 0.3, 'faint'));
		return out.join('');
	}

	function website([cx, cy]: [number, number]) {
		const out = [tray(cx, cy, 1)];
		const f = cy + 6;
		out.push(halo({ x: cx - 17, y: cy - 14, w: 34, d: 20, r: 1 }, T, 22));
		out.push(slab(cx - 17, cy - 14, 34, 20, T, 22, 'mid', { r: 1, steps: 3, bevel: 0.5, seam: T + 8 }));
		out.push(slab(cx - 15, f, 15, 0.7, T + 6, 10, 'hi', { thin: true, r: 0.3 }));
		out.push(seg([cx - 7.5, f + 0.7, T + 6], [cx - 7.5, f + 0.7, T + 16], 'mid'), seg([cx - 15, f + 0.7, T + 11], [cx, f + 0.7, T + 11], 'mid'));
		out.push(slab(cx - 16.2, f, 17.4, 0.9, T + 5.2, 0.8, 'lo', { thin: true, r: 0.2 }));
		for (const [i, z] of [T + 13.4, T + 8.4].entries()) out.push(seg([cx - 13.4, f + 0.7, z], [cx - 9.4 + i, f + 0.7, z], 'faint'));
		out.push(slab(cx + 4, f, 10, 0.7, T, 15, 'lo', { thin: true, r: 0.3 }));
		out.push(seg([cx + 9, f + 0.7, T], [cx + 9, f + 0.7, T + 15], 'faint'), dots([[cx + 7, f + 0.7, T + 7], [cx + 11, f + 0.7, T + 7]], 0.55, 'hi'));
		out.push(slab(cx - 11, f, 22, 0.9, T + 16.6, 4.4, 'hi', { thin: true, r: 0.3 }));
		for (const dx of [-8, -3, 2]) out.push(seg([cx + dx, f + 0.9, T + 18.2], [cx + dx + 3.6, f + 0.9, T + 18.2], 'mid'));
		out.push(cyl(cx - 12, cy + 13, 3, T, 5, 'mid', 0.4), L(k.ring(cx - 12, cy + 13, 2.2, T + 5, P, 12), { tone: 'lo' }));
		for (const [dx, h] of [[-1, 4], [0.6, 5.6], [-0.4, 6.8]] as const) out.push(seg([cx - 12 + dx, cy + 13, T + 5], [cx - 12 + dx * 2, cy + 13, T + 5 + h], 'mid'));
		const roof = slab(cx - 18.5, cy - 15, 37, 22, T + 22, 2, 'mid', { r: 1, steps: 3, bevel: 0.5 });
		out.push(slab(cx + 7, cy - 11, 6, 6, T + 24, 7, 'lo', { r: 0.8 }), slab(cx + 6, cy - 12, 8, 8, T + 31, 1.2, 'hi', { r: 1 }));
		out.push(roof, L(k.planOutline(k.insetPlan({ x: cx - 18.5, y: cy - 15, w: 37, d: 22, r: 1 }, 2.4), T + 24, P), { tone: 'faint' }));
		// awning
		const ay = f;
		out.push(slab(cx - 19.5, ay, 39, 11, T + 15.4, 1.6, 'mid', { r: 0.6, steps: 2, bevel: 0.3 }));
		for (let i = 0; i < 6; i++) out.push(slab(cx - 19.5 + i * 6.5, ay, 6.5, 11, T + 17, 0.5, i % 2 ? 'hi' : 'lo', { thin: true, r: 0.1, bevel: 0 }));
		for (const x of [cx - 18.6, cx + 18.6]) out.push(cyl(x, ay + 10, 0.7, T, 15.4, 'lo', 0.1));
		out.push(slab(cx + 6, ay + 2, 8, 0.9, T, 0.9, 'lo', { thin: true, r: 0.3 }));
		out.push(lamp(cx - 12, cy - 6, T + 24));
		return out.join('');
	}

	function app([cx, cy]: [number, number]) {
		const out = [tray(cx, cy, 2)];
		out.push(halo({ x: cx - 11, y: cy - 13, w: 22, d: 22, r: 11 }, T, 2.4));
		out.push(cyl(cx, cy - 2, 11, T, 2.4, 'lo', 0.6), L(k.ring(cx, cy - 2, 8.4, T + 2.4, P, 24), { tone: 'faint' }), L(k.knurl(cx, cy - 2, 11, T, T + 2.4, 28, P, 0.3), { tone: 'faint' }));
		out.push(slab(cx - 3, cy - 7, 6, 5, T + 2.4, 9, 'mid', { r: 1, bevel: 0.4 }), slab(cx - 7, cy - 8.5, 14, 2.6, T + 9, 2.4, 'hi', { r: 0.8 }));
		out.push(halo({ x: cx - 10, y: cy - 9, w: 20, d: 4, r: 2 }, T + 11, 33));
		const ph: Plan = { x: cx - 10, y: cy - 9, w: 20, d: 3.4, r: 2.2 };
		out.push(S(k.slabOf(ph, T + 11, 34, P, 4, 0.7), { tone: 'mid', inner: L(k.sideSeam(ph, T + 20, P, 4), { tone: 'faint' }) }));
		const f = ph.y + ph.d;
		out.push(slab(cx - 8.2, f, 16.4, 0.6, T + 14, 28, 'hi', { thin: true, r: 0.8 }));
		out.push(seg([cx - 4, f + 0.6, T + 40], [cx + 4, f + 0.6, T + 40], 'faint'), seg([cx - 6, f + 0.6, T + 37], [cx + 2, f + 0.6, T + 37], 'mid'));
		for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) out.push(D([at([cx - 4.6 + i * 4.6, f + 0.6, T + 31 - j * 5.2])], { size: 1.1, tone: 'mid' }), seg([cx - 5.8 + i * 4.6, f + 0.6, T + 28.6 - j * 5.2], [cx - 3.4 + i * 4.6, f + 0.6, T + 28.6 - j * 5.2], 'faint'));
		out.push(seg([cx - 3, f + 0.6, T + 15.6], [cx + 3, f + 0.6, T + 15.6], 'mid'));
		out.push(dots([[cx, f, T + 12.4], [cx - 3.4, f, T + 43.2]], 0.5), seg([cx - 1.6, f, T + 43.2], [cx + 2.8, f, T + 43.2], 'faint'));
		out.push(slab(cx + 10, ph.y + 0.6, 0.8, 4, T + 32, 2.4, 'lo', { thin: true, r: 0.2 }), slab(cx + 10, ph.y + 0.6, 0.8, 3, T + 22, 4, 'lo', { thin: true, r: 0.2 }));
		out.push(flat([[cx + 4, cy - 3], [cx + 10, cy + 6], [cx + 18, cy + 9]], T, 'lo'), dots([[cx + 4, cy - 3, T], [cx + 18, cy + 9, T]], 0.7, 'hi'));
		out.push(slab(cx - 18, cy + 9, 9, 4, T, 1.2, 'hi', { r: 1, thin: true }));
		out.push(lamp(cx + 13, cy - 11, T));
		return out.join('');
	}

	function payments([cx, cy]: [number, number]) {
		const out = [tray(cx, cy, 3)];
		const body: Plan = { x: cx - 16, y: cy - 12, w: 32, d: 20, r: 2 };
		out.push(halo(body, T, 10));
		out.push(S(k.slabOf(body, T, 10, P, 3, 0.7), { tone: 'mid', inner: L(k.sideSeam(body, T + 4, P, 3), { tone: 'faint' }) }));
		const f = body.y + body.d;
		out.push(slab(cx - 14, f, 28, 0.7, T + 2.5, 3.4, 'lo', { thin: true, r: 0.3 }));
		out.push(seg([cx - 14, f + 0.7, T + 8], [cx + 14, f + 0.7, T + 8], 'faint'));
		out.push(L(k.planOutline(k.insetPlan(body, 2), T + 10, P), { tone: 'faint' }));
		out.push(slab(cx - 14, cy - 12, 28, 5, T + 10, 9, 'mid', { r: 1.2, bevel: 0.4 }));
		out.push(slab(cx - 12, cy - 7, 24, 0.6, T + 11.4, 6, 'hi', { thin: true, r: 0.6 }));
		out.push(seg([cx - 9, cy - 6.4, T + 15.4], [cx + 3, cy - 6.4, T + 15.4], 'mid'), seg([cx - 9, cy - 6.4, T + 13.4], [cx - 1, cy - 6.4, T + 13.4], 'faint'), dots([[cx + 8, cy - 6.4, T + 14.4]], 0.9));
		out.push(slab(cx - 12, cy - 4, 24, 12, T + 10, 0.8, 'lo', { r: 1.4, steps: 3, thin: true }));
		for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) out.push(slab(cx - 10.4 + i * 4.6, cy - 2.4 + j * 3.6, 3.6, 2.8, T + 10.8, 1.2, i === 3 ? 'lo' : 'hi', { r: 0.5, thin: true, bevel: 0.2 }));
		out.push(L(k.ring(cx + 9, cy - 3, 1.4, T + 10.8, P, 10), { tone: 'mid', free: true }));
		out.push(slab(cx + 12, cy - 8, 6, 0.6, T + 12, 9, 'hi', { thin: true, r: 0.2 }), seg([cx + 13.4, cy - 7.4, T + 17], [cx + 16.6, cy - 7.4, T + 17], 'mid'), seg([cx + 13.4, cy - 7.4, T + 15], [cx + 16.6, cy - 7.4, T + 15], 'mid'));
		out.push(seg([cx + 16, cy - 8, T + 6], [cx + 16, cy + 6, T + 6], 'faint'));
		const tray2: Plan = { x: cx - 15, y: cy + 10, w: 30, d: 7, r: 1.5 };
		out.push(halo(tray2, T, 2.6));
		out.push(S(k.slabOf(tray2, T, 2.6, P, 3, 0.4), { tone: 'lo' }), L(k.planOutline(k.insetPlan(tray2, 1.2), T + 2.6, P), { tone: 'faint' }));
		for (const [dx, n] of [[-8, 2], [-1, 4], [6, 3]] as const) {
			for (let i = 0; i < n; i++) out.push(cyl(cx + dx, cy + 13.4, 2.8, T + 2.6 + i * 0.9, 0.9, 'hi', 0.2));
			out.push(L(k.ring(cx + dx, cy + 13.4, 1.6, T + 2.6 + n * 0.9, P, 10), { tone: 'faint' }));
		}
		out.push(cyl(cx + 12, cy + 13.4, 2.8, T + 2.6, 0.9, 'hi', 0.2));
		out.push(lamp(cx + 13, cy - 10.4, T + 19));
		return out.join('');
	}

	function messages([cx, cy]: [number, number]) {
		const out = [tray(cx, cy, 4)];
		const bx = cx - 8;
		out.push(halo({ x: bx - 9, y: cy - 9, w: 18, d: 18, r: 9 }, T, 22));
		out.push(cyl(bx, cy, 9, T, 1.8, 'lo', 0.4));
		out.push(S(k.cylinder(bx, cy, 7.5, T + 1.8, 18, P, 28, 0.5), { tone: 'mid' }), L(k.sideArc(bx, cy, 7.5, T + 8, P, 18), { tone: 'faint' }), L(k.sideArc(bx, cy, 7.5, T + 14, P, 18), { tone: 'faint' }));
		out.push(slab(bx - 5, cy + 7, 10, 0.8, T + 14, 2.2, 'lo', { thin: true, r: 0.3 }));
		out.push(slab(bx - 3.6, cy + 7, 7.2, 0.7, T + 4, 7, 'hi', { thin: true, r: 0.3 }), dots([[bx, cy + 7.8, T + 7.6]], 0.55), seg([bx - 2.4, cy + 7.8, T + 9.6], [bx + 2.4, cy + 7.8, T + 9.6], 'faint'));
		out.push(cyl(bx, cy, 8.4, T + 19.8, 2.4, 'hi', 0.5), L(k.knurl(bx, cy, 8.4, T + 19.8, T + 22.2, 24, P, 0.3), { tone: 'lo' }), cyl(bx, cy, 5, T + 22.2, 2, 'mid', 0.6), cyl(bx, cy, 1.1, T + 24.2, 1.8, 'hi', 0.2));
		out.push(L(k.ring(bx, cy, 6.4, T + 22.2, P, 20), { tone: 'faint' }));
		// pneumatic tube with capsule and collars
		const tx = cx + 13;
		const ty = cy - 4;
		out.push(halo({ x: tx - 4, y: ty - 4, w: 8, d: 8, r: 4 }, T, 32));
		out.push(S(k.cylinder(tx, ty, 2.8, T, 30, P, 16, 0.2), { tone: 'mid' }), L(k.sideArc(tx, ty, 2.8, T + 15, P, 10), { tone: 'faint' }));
		for (const z of [T, T + 14, T + 28]) out.push(cyl(tx, ty, 3.8, z, 1.8, 'hi', 0.3), L(k.ring(tx, ty, 2.6, z + 1.8, P, 12), { tone: 'lo' }));
		out.push(cyl(tx, ty, 2, T + 30, 5, 'hi', 0.5), L(k.sideArc(tx, ty, 2, T + 33, P, 10), { tone: 'faint' }), cyl(tx, ty, 1.2, T + 35, 0.8, 'mid', 0.2));
		out.push(flat([[tx, ty + 3.8], [tx - 2, cy + 12], [bx + 8, cy + 14]], T, 'lo'), dots([[bx + 8, cy + 14, T]], 0.8, 'hi'));
		out.push(slab(cx - 21, cy - 14, 3, 3, T, 1.6, 'lo', { r: 0.8, thin: true }));
		out.push(lamp(cx + 13, cy + 12.4, T));
		return out.join('');
	}

	function staff([cx, cy]: [number, number]) {
		const out = [tray(cx, cy, 5)];
		out.push(halo({ x: cx - 8, y: cy - 13, w: 16, d: 10, r: 2 }, T, 1.8));
		out.push(slab(cx - 8, cy - 13, 16, 10, T, 1.8, 'lo', { r: 2, steps: 3, bevel: 0.5 }));
		out.push(slab(cx - 2.6, cy - 10, 5.2, 4, T + 1.8, 9, 'mid', { r: 0.8, bevel: 0.3 }), L(k.rise([cx, cy - 6], T + 3, T + 9, P), { tone: 'faint', free: true }));
		out.push(halo({ x: cx - 16, y: cy - 12, w: 32, d: 3.6, r: 1.2 }, T + 9, 23));
		const pn: Plan = { x: cx - 16, y: cy - 12, w: 32, d: 3.6, r: 1.4 };
		out.push(S(k.slabOf(pn, T + 9, 23, P, 4, 0.6), { tone: 'mid', inner: L(k.sideSeam(pn, T + 14, P, 4), { tone: 'faint' }) }));
		const f = pn.y + pn.d;
		out.push(slab(cx - 14, f, 28, 0.6, T + 11, 19, 'lo', { thin: true, r: 0.6 }));
		out.push(slab(cx - 13, f + 0.5, 26, 0.5, T + 12, 17, 'hi', { thin: true, r: 0.5 }));
		out.push(seg([cx - 11, f + 1, T + 26], [cx - 3, f + 1, T + 26], 'mid'), dots([[cx + 9, f + 1, T + 26]], 0.7));
		for (const [i, z] of [T + 22, T + 18, T + 14.4].entries()) out.push(seg([cx - 11, f + 1, z], [cx + 6 - i * 3, f + 1, z], 'faint'), L(k.ring(cx + 10, f + 1, 1.1, z, P, 8), { tone: 'faint', free: true }));
		out.push(dots([[cx, f, T + 10]], 0.5, 'hi'), slab(cx + 11, f, 3, 0.6, T + 9.6, 0.8, 'hi', { thin: true, r: 0.2 }));
		out.push(lamp(cx - 14, f - 0.4, T + 9.3).replace(/<g class="lit-at/, '<g class="lit-at'));
		const kb: Plan = { x: cx - 15, y: cy + 3, w: 28, d: 11, r: 1.6 };
		out.push(halo(kb, T, 1.8));
		out.push(S(k.slabOf(kb, T, 1.8, P, 3, 0.4), { tone: 'mid' }));
		out.push(D(k.dotGrid(cx - 12, cy + 5.4, 8, 3, 3.3, T + 1.8, P), { size: 0.62, tone: 'hi' }), slab(cx - 7, cy + 11.4, 14, 1.4, T + 1.8, 0.3, 'hi', { thin: true, r: 0.4, bevel: 0 }));
		out.push(slab(cx + 16, cy + 5, 4.6, 6.4, T, 1.8, 'hi', { r: 2, steps: 3, bevel: 0.5 }), seg([cx + 18.3, cy + 5, T + 1.8], [cx + 18.3, cy + 8, T + 1.8], 'faint'));
		out.push(flat([[cx, cy - 3], [cx - 1, cy + 3]], T, 'lo'), flat([[cx + 18, cy + 5], [cx + 18, cy], [cx + 4, cy - 3]], T, 'lo'));
		return out.join('');
	}

	function reports([cx, cy]: [number, number]) {
		const out = [tray(cx, cy, 6)];
		const bk: Plan = { x: cx - 20, y: cy - 14, w: 26, d: 20, r: 1 };
		out.push(halo(bk, T, 5.4));
		out.push(S(k.slabOf(bk, T, 5.4, P, 3, 0.5), { tone: 'mid', inner: L(k.sideSeam(bk, T + 0.8, P, 3), { tone: 'faint' }) }));
		const f = bk.y + bk.d;
		out.push(slab(cx - 19, f - 0.1, 25, 0.5, T + 0.9, 3.6, 'hi', { thin: true, r: 0.2 }));
		for (const z of [T + 2, T + 3, T + 4]) out.push(seg([cx - 18, f + 0.5, z], [cx + 5, f + 0.5, z], 'faint'));
		out.push(slab(bk.x, bk.y, 3, 20, T + 5.4, 0.5, 'lo', { thin: true, r: 0.3, bevel: 0 }));
		out.push(L(k.planOutline(k.insetPlan(bk, 2), T + 5.4, P), { tone: 'faint' }));
		out.push(slab(cx - 14, cy - 10, 14, 8, T + 5.4, 0.6, 'hi', { r: 0.8, thin: true }));
		for (const [dy, w] of [[2.4, 11], [4.2, 8], [6, 10]] as const) out.push(L(k.lineOnTop([cx - 12, cy - 10 + dy], [cx - 12 + w, cy - 10 + dy], T + 6, P), { tone: 'faint', free: true }));
		out.push(slab(cx - 3, f - 7, 1.6, 12, T + 5.4, 0.5, 'lo', { thin: true, r: 0.3, bevel: 0 }), slab(cx - 3, f + 4.4, 1.6, 4, T + 4, 1, 'lo', { thin: true, r: 0.3, bevel: 0 }));
		out.push(slab(cx - 12, cy + 1, 15, 1.2, T + 6, 1.2, 'hi', { r: 0.5, thin: true, bevel: 0.2 }), seg([cx - 3, cy + 2.2, T + 6.6], [cx + 0.6, cy + 2.2, T + 6.6], 'mid'));
		out.push(dots(k.corners(bk, 2.6).map(([x, y]) => [x, y, T + 5.4] as Point3), 0.45));
		const gx = cx + 14;
		const gy = cy - 3;
		out.push(halo({ x: gx - 7, y: gy - 7, w: 14, d: 14, r: 7 }, T, 12));
		out.push(cyl(gx, gy, 6, T, 1.4, 'lo', 0.3), S(k.cylinder(gx, gy, 2.2, T + 1.4, 8, P, 14, 0.2), { tone: 'mid' }), L(k.ring(gx, gy, 2.2, T + 6, P, 12), { tone: 'faint' }));
		const gz = T + 9.4;
		out.push(cyl(gx, gy, 7.2, gz, 3.2, 'hi', 0.7), L(k.knurl(gx, gy, 7.2, gz, gz + 3.2, 28, P, 0.3), { tone: 'lo' }), L(k.ring(gx, gy, 5.8, gz + 3.2, P, 28), { tone: 'lo' }));
		const rt = k.radialTicks(gx, gy, 5.4, 36, 6, gz + 3.2, [0.9, 1.8], P, -2.4, 4.8);
		out.push(L(rt.minor, { tone: 'lo' }), L(rt.major, { tone: 'mid' }));
		out.push(L(k.lineOnTop([gx, gy], [gx + 3.8, gy - 3.2], gz + 3.4, P), { tone: 'mid', free: true }), dots([[gx, gy, gz + 3.4]], 0.9, 'hi'));
		out.push(lamp(cx + 13, cy + 13, T));
		return out.join('');
	}

	const builders: Record<string, (c: [number, number]) => string> = { website, app, payments, messages, staff, reports };
	const tf = (m: Mod, step: number) => {
		const { loose, dock, tilt } = m;
		const [ox, oy] = step === 1 ? [loose[0] - dock[0], loose[1] - dock[1]] : [0, 0];
		const [sx, sy] = k.axisVector(P, [ox, oy, 0]);
		const [px, py] = at([dock[0], dock[1], 0]);
		return `translate(${Math.round(sx * 100) / 100} ${Math.round(sy * 100) / 100}) rotate(${step === 1 ? tilt : 0} ${Math.round(px * 10) / 10} ${Math.round(py * 10) / 10})`;
	};
	const transforms = Object.fromEntries(MODS.map((m) => [m.name, [1, 2, 3, 4].map((s) => tf(m, s))]));

	const items = [{ depth: k.depthOf([0, 0, 0], P), svg: hub() }, ...MODS.map((m) => ({ depth: k.depthOf([m.dock[0], m.dock[1], 0], P), svg: moverSvg(m.name, transforms[m.name][3], builders[m.name](m.dock)) }))];
	items.sort((a, b) => a.depth - b.depth);

	const svg = k.figureSvg({
		width,
		height,
		label:
			'A control desk stands in the middle of a workbench with a screen, a row of sockets and lamps. Six small objects, a shop front, a phone on a stand, a card terminal, a post box, a staff monitor and a ledger with a dial, slide into docks around it and are joined to it by cables. A nameplate and flag appear, and then the desk screen and every lamp light up.',
		body: [base(), docks(), cables(), ...items.map((i) => i.svg), props()],
	});
	return { svg, labels: LABELS, transforms };

	function props() {
		const out: string[] = [];
		const mug = [182, 124] as const;
		out.push(halo({ x: mug[0] - 6, y: mug[1] - 6, w: 12, d: 12, r: 6 }, 0, 10));
		out.push(S(k.cylinder(mug[0], mug[1], 5.4, 0, 9, P, 20, 0.5), { tone: 'mid' }), L(k.sideArc(mug[0], mug[1], 5.4, 4.5, P, 14), { tone: 'faint' }), L(k.ring(mug[0], mug[1], 4, 9, P, 14), { tone: 'lo' }));
		out.push(S(k.cylinder(mug[0] + 6.8, mug[1], 1.6, 3, 3.4, P, 10, 0.2), { tone: 'hi' }));
		const pot = [-185, -130] as const;
		out.push(halo({ x: pot[0] - 7, y: pot[1] - 7, w: 14, d: 14, r: 7 }, 0, 9));
		out.push(S(k.cylinder(pot[0], pot[1], 6.2, 0, 8, P, 20, 0.5), { tone: 'mid' }), L(k.ring(pot[0], pot[1], 5, 8, P, 14), { tone: 'lo' }), L(k.sideArc(pot[0], pot[1], 6.2, 3, P, 14), { tone: 'faint' }));
		for (const [dx, dy, h] of [[0, 0, 12], [-3, 2, 8], [3, 1.4, 9], [1.6, -2.6, 7]] as const) out.push(S(k.cylinder(pot[0] + dx, pot[1] + dy, 1.8, 8, h, P, 10, 0.4), { tone: 'hi' }));
		const cup = [100, -132] as const;
		out.push(S(k.cylinder(cup[0], cup[1], 5, 0, 10, P, 18, 0.4), { tone: 'lo' }), L(k.ring(cup[0], cup[1], 3.8, 10, P, 14), { tone: 'lo' }));
		for (const [dx, dy, h] of [[-1.5, 0, 6], [0.8, 1, 8], [1.6, -1.2, 5]] as const) out.push(seg([cup[0] + dx, cup[1] + dy, 10], [cup[0] + dx * 1.6, cup[1] + dy, 10 + h], 'mid'));
		const pad: Plan = { x: 50, y: 100, w: 24, d: 18, r: 1 };
		out.push(halo(pad, 0, 1.6), S(k.slabOf(pad, 0, 1.6, P, 3, 0.3), { tone: 'hi' }), L(k.planOutline(k.insetPlan(pad, 2), 1.6, P), { tone: 'faint' }));
		for (const dy of [4, 7.4, 10.8, 14]) out.push(L(k.lineOnTop([pad.x + 4, pad.y + dy], [pad.x + pad.w - (dy > 12 ? 10 : 4), pad.y + dy], 1.6, P), { tone: 'faint', free: true }));
		out.push(dots([[pad.x + 3, pad.y + 2, 1.6], [pad.x + 9, pad.y + 2, 1.6], [pad.x + 15, pad.y + 2, 1.6]], 0.5, 'lo'));
		return out.join('');
	}
}
