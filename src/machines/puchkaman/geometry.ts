import * as k from '../../lib/anatomy/iso-kit';
import type { Plan, Point3 } from '../../lib/anatomy/iso-kit';
import { stepSvg, transformsFrom, type Machine } from '../../lib/plate';

export const LABELS = ['menu on your till', 'same menu online', 'customer orders and pays', 'order lands on the till'] as const;
export const CAPTION = "The menu lives on the restaurant's till. The website shows the same menu, takes the order and payment, and sends it back to the till.";

const BASE: Plan = { x: -200, y: -44, w: 298, d: 90, r: 8 };
const BASE_H = 10;
const FOOT_H = 5;
const WZ = 80;
const TILL_X = -96;
const TAB_X = 10;
const DISH_Y = -12;

export function puchkaman(width = 720, height = 480): Machine {
	const P = k.fitProjection([...k.boxCorners(BASE, -BASE_H - FOOT_H, 0), [-108, 0, 92], [34, -12, 92], [64, -20, 66]], width, height, { pad: 14, azimuth: 40, elevation: 38 });
	const at = (p: Point3) => k.iso(p, P);
	const S = k.solidSvg;
	const L = k.lineSvg;
	const D = k.dotsSvg;
	const dots = (pts: Point3[], size = 0.45, tone: 'hi' | 'mid' | 'lo' | 'faint' = 'mid') => D(pts.map(at), { size, tone });
	const halo = (plan: Plan, z: number, h: number) => `<path class="iso-halo" d="${k.haloOf(plan, z, h, P)}"/>`;
	type Tone = 'hi' | 'mid' | 'lo';
	const slab = (x: number, y: number, w: number, d: number, z: number, h: number, tone: Tone = 'mid', o: { r?: number; steps?: number; bevel?: number; thin?: boolean; lit?: boolean; seam?: number } = {}) => {
		const plan: Plan = { x, y, w, d, r: o.r ?? 0.6 };
		const inner = o.seam ? L(k.sideSeam(plan, o.seam, P, o.steps ?? 3), { tone: 'faint' }) : '';
		return S(k.slabOf(plan, z, h, P, o.steps ?? 2, o.bevel ?? 0.2), { tone, crease: o.thin ? 'none' : 'faint', lit: o.lit, inner });
	};
	const cyl = (cx: number, cy: number, r: number, z: number, h: number, tone: Tone = 'mid', bevel = 0.3, lit = false) => S(k.cylinder(cx, cy, r, z, h, P, r > 5 ? 14 : 10, bevel), { tone, lit });
	const seg = (a: Point3, b: Point3, tone: 'hi' | 'mid' | 'lo' | 'faint' = 'mid') => L(k.segment(a, b, P), { tone, free: true });
	const tint = (pigment: string, body: string) => `<g class="tint" style="--pigment:${pigment}">${body}</g>`;
	const lamp = (x: number, y: number, z: number, from: number) => cyl(x, y, 1.9, z, 1.8, 'mid', 0.2) + stepSvg('lit-at', from, cyl(x, y, 1.3, z + 1.8, 1.1, 'hi', 0.15, true));


	function base() {
		const out = [halo(BASE, -BASE_H - FOOT_H, BASE_H)];
		for (const [x, y] of [...k.corners(BASE, 24), [0, BASE.y + 24], [0, BASE.y + BASE.d - 24]].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P))) {
			out.push(cyl(x, y, 9, -BASE_H - FOOT_H, 1.8, 'lo', 0.4), cyl(x, y, 6.5, -BASE_H - FOOT_H + 1.8, FOOT_H - 1.8, 'mid', 0.3));
		}
		out.push(S(k.slabOf(BASE, -BASE_H, BASE_H, P, 10, 1.6), { tone: 'mid', inner: L(k.sideSeam(BASE, -BASE_H / 2, P, 10), { tone: 'faint' }) }));
		out.push(L(k.planOutline(k.insetPlan(BASE, 5), 0, P, 10), { tone: 'lo' }), L(k.planOutline(k.insetPlan(BASE, 8), 0, P, 10), { tone: 'faint' }));
		const screws = k.corners(BASE, 11);
		out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.4, 0, P, 14)).join(''), { tone: 'lo' }), dots(screws.map(([x, y]) => [x, y, 0] as Point3), 0.55));
		for (const [x, y] of screws) out.push(L(k.lineOnTop([x - 1.4, y], [x + 1.4, y], 0, P), { tone: 'faint', free: true }));
		const strip: Plan = { x: -30, y: BASE.y + BASE.d - 17, w: 150, d: 6, r: 1 };
		out.push(slab(strip.x, strip.y, strip.w, strip.d, 0, 0.6, 'lo', { thin: true, steps: 3 }));
		const ft = k.topTicks(strip.x + 4, strip.x + strip.w - 4, 5, 5, strip.y + 0.8, 0.6, [2, 3.4], P);
		out.push(L(ft.minor, { tone: 'lo' }), L(ft.major, { tone: 'mid' }), dots([[strip.x + 2, strip.y + 3, 0.6], [strip.x + strip.w - 2, strip.y + 3, 0.6]]));
		const lab: Plan = { x: -192, y: BASE.y + BASE.d - 19, w: 50, d: 11, r: 1.5 };
		out.push(slab(lab.x, lab.y, lab.w, lab.d, 0, 0.8, 'lo', { steps: 3 }));
		for (const [dy, w] of [[2.6, 40], [5.4, 28], [8.2, 36]] as const) out.push(L(k.lineOnTop([lab.x + 5, lab.y + dy], [lab.x + w, lab.y + dy], 0.8, P), { tone: 'faint', free: true }));
		out.push(dots([[lab.x + 2, lab.y + 2, 0.8], [lab.x + lab.w - 2, lab.y + 2, 0.8], [lab.x + 2, lab.y + lab.d - 2, 0.8], [lab.x + lab.w - 2, lab.y + lab.d - 2, 0.8]], 0.4));
		const back: Plan = { x: -60, y: BASE.y + 4, w: 110, d: 6, r: 1 };
		out.push(slab(back.x, back.y, back.w, back.d, 0, 0.6, 'lo', { thin: true, steps: 3 }));
		const bt = k.topTicks(back.x + 4, back.x + back.w - 4, 5, 5, back.y + 0.8, 0.6, [2, 3.4], P);
		out.push(L(bt.minor, { tone: 'lo' }), L(bt.major, { tone: 'mid' }));
		return out.join('');
	}

	// A split-flap menu board: housing, a window of flaps with printed menu lines. The flaps are returned separately so one board can move them.
	const BOARD_Y = -24;
	function housing(x0: number, w: number) {
		const o: string[] = [];
		const H: Plan = { x: x0, y: BOARD_Y, w, d: 6, r: 1.4 };
		o.push(S(k.slabOf(H, 28, 36, P, 3, 0.6), { tone: 'mid', inner: L(k.sideSeam(H, 33, P, 3), { tone: 'faint' }) }));
		o.push(L(k.planOutline(k.insetPlan(H, 1.4), 64, P), { tone: 'faint' }), dots(k.corners(H, 1.6).map(([px, py]) => [px, py, 64] as Point3), 0.4));
		const f = BOARD_Y + 6;
		o.push(slab(x0 + 2, f - 0.2, w - 4, 0.6, 30, 32, 'lo', { thin: true, r: 0.6 }));
		o.push(slab(x0 + 2, f - 0.2, w - 4, 0.9, 62, 1.6, 'hi', { thin: true, r: 0.3 }));
		for (const sx of [x0 + 2.6, x0 + w - 2.6]) o.push(cyl(sx, f + 0.6, 1.3, 63.4, 0.4, 'lo', 0.1), dots([[sx, f + 0.6, 66]], 0.4, 'lo'));
		return o.join('');
	}
	function flaps(x0: number, w: number, ink: boolean) {
		const o: string[] = [];
		const f = BOARD_Y + 6;
		const n = 5;
		const cw = (w - 8) / n;
		for (let r = 0; r < 3; r++) {
			const z = 32 + r * 10;
			for (let i = 0; i < n; i++) {
				const x = x0 + 4 + i * cw;
				o.push(slab(x + 0.4, f, cw - 0.8, 0.7, z, 8.4, 'hi', { thin: true, r: 0.4 }));
				o.push(seg([x + 1.6, f + 0.7, z + 4.2], [x + cw - 1.6, f + 0.7, z + 4.2], 'faint'));
				if (ink) o.push(seg([x + 1.6, f + 0.7, z + 6.6], [x + cw - 3 - ((i + r) % 3), f + 0.7, z + 6.6], 'mid'), dots([[x + cw - 2, f + 0.7, z + 2.2]], 0.5, 'hi'));
			}
			o.push(seg([x0 + 3, f + 0.7, z + 8.9], [x0 + w - 3, f + 0.7, z + 8.9], 'lo'));
		}
		return o.join('');
	}

	function till() {
		const out: string[] = [];
		const C: Plan = { x: -178, y: -26, w: 64, d: 52, r: 2 };
		out.push(halo(C, 0, 28));
		out.push(S(k.slabOf(C, 0, 28, P, 4, 0.8), { tone: 'mid', inner: L(k.sideSeam(C, 7, P, 4), { tone: 'faint' }) + L(k.sideSeam(C, 21, P, 4), { tone: 'faint' }) }));
		const fy = C.y + C.d;
		for (const [i, x] of [-166, -150, -134].entries()) {
			out.push(slab(x - 5, fy - 0.2, 10, 0.8, 4 + (i % 2) * 8, 6, 'lo', { thin: true, r: 0.3 }), slab(x - 2.4, fy + 0.5, 4.8, 0.8, 6.4 + (i % 2) * 8, 1.4, 'hi', { thin: true, r: 0.3 }));
		}
		out.push(slab(C.x + 3, fy - 0.2, C.w - 6, 0.8, 18, 6, 'lo', { thin: true, r: 0.3 }), seg([C.x + 6, fy + 0.6, 21], [C.x + C.w - 16, fy + 0.6, 21], 'faint'));
		const rx = C.x + C.w;
		for (const z of [6, 11, 16, 21]) out.push(seg([rx, C.y + 8, z], [rx, C.y + C.d - 8, z], 'faint'));
		out.push(slab(rx, C.y + 5, 0.8, 5, 3, 2.4, 'lo', { thin: true, r: 0.2 }), slab(rx, C.y + C.d - 10, 0.8, 5, 3, 2.4, 'lo', { thin: true, r: 0.2 }));
		out.push(L(k.planOutline(k.insetPlan(C, 3), 28, P), { tone: 'faint' }), dots(k.corners(C, 3).map(([px, py]) => [px, py, 28] as Point3), 0.45));
		// board at the back, then the register in front of it
		out.push(housing(-176, 52), flaps(-176, 52, true));
		const R: Plan = { x: -166, y: -2, w: 34, d: 24, r: 2 };
		out.push(S(k.slabOf(R, 28, 9, P, 3, 0.6), { tone: 'lo', inner: L(k.sideSeam(R, 32, P, 3), { tone: 'faint' }) }));
		out.push(slab(R.x + 3, R.y + R.d - 0.2, R.w - 6, 0.7, 29.6, 4.4, 'hi', { thin: true, r: 0.3 }), seg([R.x + 5, R.y + R.d + 0.6, 31.8], [R.x + R.w - 12, R.y + R.d + 0.6, 31.8], 'mid'));
		out.push(slab(R.x + 4, R.y + 4, R.w - 8, 13, 37, 1, 'mid', { r: 1.2, steps: 3, thin: true }));
		for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) out.push(slab(R.x + 6 + i * 5, R.y + 5.4 + j * 3.6, 3.8, 2.8, 38, 1.2, 'hi', { r: 0.5, thin: true, bevel: 0.2 }));
		out.push(slab(R.x + 6, R.y + 14, 22, 5, 38, 7, 'mid', { r: 0.8, bevel: 0.3 }), slab(R.x + 8, R.y + 19.2, 18, 0.6, 40, 4, 'hi', { thin: true, r: 0.4 }), seg([R.x + 10, R.y + 19.8, 42], [R.x + 22, R.y + 19.8, 42], 'mid'));
		out.push(cyl(-124, 14, 3.6, 28, 3, 'mid', 0.5), L(k.knurl(-124, 14, 3.6, 28, 31, 12, P, 0.3), { tone: 'lo' }), L(k.ring(-124, 14, 2.2, 31, P, 10), { tone: 'faint' }));
		// shaft gear on the board's right end
		out.push(cyl(-120, BOARD_Y + 3, 5, 44, 2.4, 'mid', 0.4), L(k.knurl(-120, BOARD_Y + 3, 5, 44, 46.4, 16, P, 0.3), { tone: 'lo' }), cyl(-120, BOARD_Y + 3, 1.6, 46.4, 1.4, 'hi', 0.2));
		return out.join('');
	}

	function shaft() {
		const o: string[] = [];
		const y = BOARD_Y + 1;
		for (const x of [-72, -20, 30]) {
			o.push(slab(x - 3, y - 3, 6, 6, 0, 43, 'lo', { r: 0.8, bevel: 0.3 }), slab(x - 5, y - 5, 10, 10, 0, 1.6, 'mid', { thin: true }), cyl(x, y + 3.2, 2.6, 42, 3.4, 'mid', 0.3));
			o.push(slab(x + 3.6, y - 1.8, 1.8, 3.6, 43, 4, 'hi', { thin: true, r: 0.3 }));
		}
		o.push(slab(-124, y - 1.2, 166, 2.4, 45, 2.4, 'mid', { r: 0.6, bevel: 0.3 }));
		o.push(L(k.lineOnTop([-110, y], [32, y], 47.4, P), { tone: 'faint', free: true }));
		return o.join('');
	}

	function receivePost() {
		const o: string[] = [];
		const x = -114;
		o.push(slab(x - 4, -7, 14, 14, 0, 1.8, 'mid', { thin: true, r: 1 }), dots(k.corners({ x: x - 4, y: -7, w: 14, d: 14, r: 1 }, 2).map(([px, py]) => [px, py, 1.8] as Point3), 0.4));
		o.push(slab(x, -3, 6, 6, 1.8, 84, 'lo', { r: 0.8, bevel: 0.4 }));
		for (const z of [18, 36, 54, 72]) o.push(slab(x - 0.6, -3.6, 7.2, 7.2, z, 1.4, 'mid', { thin: true, r: 0.4 }));
		o.push(slab(x - 1, -4, 8, 8, 78, 5, 'mid', { r: 0.8, bevel: 0.3 }), slab(x - 1.6, -4.6, 9.2, 9.2, 84, 1.6, 'hi', { r: 1, thin: true }));
		o.push(slab(x + 6, -1.2, 5, 2.4, WZ - 1.2, 2.4, 'hi', { thin: true, r: 0.4 }));
		o.push(cyl(x + 6, 0, 2.2, 66, 1.6, 'lo', 0.2), slab(x + 6, -2, 2.4, 4, 62, 8, 'mid', { thin: true, r: 0.5 }));
		o.push(lamp(x + 3, 0, 85.6, 4));
		return o.join('');
	}

	function endPost() {
		const o: string[] = [];
		const x = 25;
		o.push(slab(x - 4, -7, 14, 14, 0, 1.8, 'mid', { thin: true, r: 1 }), dots(k.corners({ x: x - 4, y: -7, w: 14, d: 14, r: 1 }, 2).map(([px, py]) => [px, py, 1.8] as Point3), 0.4));
		o.push(slab(x, -3, 6, 6, 1.8, 84, 'lo', { r: 0.8, bevel: 0.4 }));
		for (const z of [18, 36, 54, 72]) o.push(slab(x - 0.6, -3.6, 7.2, 7.2, z, 1.4, 'mid', { thin: true, r: 0.4 }));
		o.push(slab(x - 1, -4, 8, 8, 78, 5, 'mid', { r: 0.8, bevel: 0.3 }), slab(x - 1.6, -4.6, 9.2, 9.2, 84, 1.6, 'hi', { r: 1, thin: true }));
		o.push(slab(x - 5, -1.2, 5, 2.4, WZ - 1.2, 2.4, 'hi', { thin: true, r: 0.4 }));
		o.push(cyl(x - 4, 0, 2.2, 66, 1.6, 'lo', 0.2), slab(x - 2.4, -2, 2.4, 4, 62, 8, 'mid', { thin: true, r: 0.5 }));
		return o.join('');
	}

	function wire() {
		const o: string[] = [];
		o.push(seg([-104, 0, WZ], [20, 0, WZ], 'hi'), seg([-104, 0.5, WZ - 0.6], [20, 0.5, WZ - 0.6], 'lo'));
		o.push(slab(-104, -0.6, 124, 1.2, WZ - 0.6, 1.2, 'lo', { thin: true, r: 0.3, bevel: 0 }));
		for (const x of [-100, -92]) o.push(cyl(x, 0, 0.9, WZ - 3, 3, 'lo', 0.1));
		for (const x of [14, 6]) o.push(cyl(x, 0, 0.9, WZ - 3, 3, 'lo', 0.1));
		return o.join('');
	}

	function tablet() {
		const out: string[] = [];
		const C: Plan = { x: 40, y: -26, w: 54, d: 12, r: 2 };
		const x0 = 42;
		const w = 50;
		out.push(halo(C, 0, 28));
		// cabinet first, then the housing; the flaps mover is drawn before the cabinet front so it rises out of it
		return { housing: housing(x0, w), cabinet: (() => {
			const o: string[] = [];
			o.push(S(k.slabOf(C, 0, 28, P, 4, 0.8), { tone: 'mid', inner: L(k.sideSeam(C, 7, P, 4), { tone: 'faint' }) + L(k.sideSeam(C, 21, P, 4), { tone: 'faint' }) }));
			const fy = C.y + C.d;
			o.push(L(k.planOutline(k.insetPlan(C, 2.4), 28, P), { tone: 'faint' }), dots(k.corners(C, 2.4).map(([px, py]) => [px, py, 28] as Point3), 0.45));
			for (const x of [50, 67, 84]) o.push(slab(x - 6, fy - 0.2, 12, 0.8, 5, 17, 'lo', { thin: true, r: 0.3 }), slab(x - 2.4, fy + 0.5, 4.8, 0.8, 19, 1.4, 'hi', { thin: true, r: 0.3 }));
			const rx = C.x + C.w;
			for (const z of [6, 11, 16, 21]) o.push(seg([rx, C.y + 3, z], [rx, C.y + C.d - 3, z], 'faint'));
			return o.join('');
		})(), flaps: flaps(x0, w, true) };
	}

	function console() {
		const o: string[] = [];
		const x = 26;
		const y = -18;
		o.push(slab(x - 2, y - 2, 14, 16, 0, 1.8, 'mid', { thin: true, r: 1 }), dots(k.corners({ x: x - 2, y: y - 2, w: 14, d: 16, r: 1 }, 2).map(([px, py]) => [px, py, 1.8] as Point3), 0.4));
		o.push(slab(x, y, 10, 12, 1.8, 70, 'mid', { r: 1, bevel: 0.5, seam: 30 }));
		o.push(slab(x + 1.4, y + 12 - 0.2, 7.2, 0.6, 40, 24, 'lo', { thin: true, r: 0.6 }), slab(x + 2.4, y + 12.2, 5.2, 0.5, 44, 14, 'hi', { thin: true, r: 0.4 }));
		for (const [i, z] of [56, 52, 48].entries()) o.push(seg([x + 3, y + 12.8, z], [x + 7 - i, y + 12.8, z], 'faint'));
		o.push(dots([[x + 5, y + 12.2, 8], [x + 5, y + 12.2, 62]], 0.5));
		// arm and coin dish reaching over the parked carrier from behind
		o.push(slab(TAB_X - 10, y + 1, 24, 3, 69, 2, 'mid', { r: 0.6, bevel: 0.3 }));
		const D: Plan = { x: TAB_X - 7, y: DISH_Y - 6, w: 14, d: 12, r: 1.4 };
		o.push(S(k.slabOf(D, 71, 1.4, P, 3, 0.3), { tone: 'hi' }));
		o.push(slab(D.x, D.y, 14, 1.2, 72.4, 2, 'lo', { thin: true, r: 0.3 }), slab(D.x, D.y, 1.2, 12, 72.4, 2, 'lo', { thin: true, r: 0.3 }), slab(D.x + 12.8, D.y, 1.2, 12, 72.4, 2, 'lo', { thin: true, r: 0.3 }));
		return o.join('');
	}

	function carrier() {
		const o: string[] = [];
		const cx = TILL_X;
		const trolley: Plan = { x: cx - 6, y: -2.4, w: 12, d: 4.8, r: 1 };
		o.push(S(k.slabOf(trolley, WZ - 3.4, 6.4, P, 3, 0.5), { tone: 'mid', inner: L(k.sideSeam(trolley, WZ, P, 3), { tone: 'faint' }) }));
		for (const dx of [-3.6, 3.6]) o.push(cyl(cx + dx, 0, 2, WZ + 3, 1.4, 'hi', 0.3), dots([[cx + dx, 0, WZ + 4.4]], 0.4, 'lo'));
		o.push(slab(cx - 5.6, -0.7, 1.4, 1.4, 62, WZ - 62 - 3, 'lo', { thin: true, r: 0.3 }), slab(cx + 4.2, -0.7, 1.4, 1.4, 62, WZ - 62 - 3, 'lo', { thin: true, r: 0.3 }));
		o.push(cyl(cx, 0, 7, 48, 14, 'hi', 0.5), cyl(cx, 0, 7.8, 61, 1.6, 'mid', 0.3), cyl(cx, 0, 7.8, 48, 1.4, 'mid', 0.3));
		o.push(L(k.sideArc(cx, 0, 7, 55, P, 18) + k.sideArc(cx, 0, 7, 52, P, 18), { tone: 'faint' }));
		o.push(cyl(cx, 0, 5.4, 62.4, 0.3, 'lo', 0.05), L(k.ring(cx, 0, 5.4, 62.7, P, 14), { tone: 'lo' }));
		for (const dx of [-7.8, 7.8]) o.push(cyl(cx + dx, 0, 1.2, 60.6, 2.4, 'lo', 0.2));
		return o.join('');
	}

	const slipSvg = (cx: number, cy: number, z: number) => slab(cx - 3.6, cy - 0.3, 7.2, 0.6, z, 9, 'hi', { thin: true, r: 0.3 }) + seg([cx - 2.4, cy + 0.3, z + 6.4], [cx + 2.4, cy + 0.3, z + 6.4], 'mid') + seg([cx - 2.4, cy + 0.3, z + 4], [cx + 0.8, cy + 0.3, z + 4], 'faint');
	const coinSvg = (cx: number, cy: number, z: number) => cyl(cx, cy, 2.6, z, 0.9, 'hi', 0.2) + L(k.ring(cx, cy, 1.5, z + 0.9, P, 10), { tone: 'faint' });

	const mv = (name: string, draw: string, tf: string) => `<g class="mover plain" data-part="${name}" transform="${tf}">${draw}</g>`;
	const dx = TILL_X - TAB_X;
	const T = transformsFrom(P, {
		carrier: [[-dx, 0, 0], [-dx, 0, 0], [-dx, 0, 0], [0, 0, 0]],
		coin: [[-dx, DISH_Y, 16], [-dx, DISH_Y, 16], [-dx, 0, 0], [0, 0, 0]],
		slip: [[-dx, DISH_Y, 19], [-dx, DISH_Y, 19], [-dx, 0, 0], [0, 0, 0]],
		flaps: [[0, 0, -22], [0, 0, 0], [0, 0, 0], [0, 0, 0]],
	} as Record<string, Point3[]>);
	const tab = tablet();

	const svg = k.figureSvg({
		width,
		height,
		label:
			'An old shop cash railway on a base: a till counter with a split-flap menu board and a register at one end, a customer tablet kiosk with its own flap board at the other, joined by a shaft under the bench and by an overhead wire between two posts. The menu flaps rise on the kiosk to match the till, a coin and an order slip drop into a carrier cup on the wire, and the carrier runs along the wire to the till post, whose lamp lights.',
		body: [base(), shaft(), till(), receivePost(), tab.housing, mv('flaps', tab.flaps, T.flaps[3]), tab.cabinet, console(), wire(), endPost(), mv('carrier', carrier(), T.carrier[3]), mv('slip', slipSvg(TILL_X, 0, 56), T.slip[3]), mv('coin', coinSvg(TILL_X, 0, 60.6), T.coin[3])],
	});
	return { svg, labels: LABELS, transforms: T };
}
