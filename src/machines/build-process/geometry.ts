import * as k from '../../lib/anatomy/iso-kit';
import type { Plan, Point3 } from '../../lib/anatomy/iso-kit';
import { moverSvg, stepSvg, transformsFrom, type Machine } from '../../lib/plate';

export const LABELS = ['we talk', 'we plan', 'built from parts', 'goes live', 'kept running'] as const;
export const CAPTION = 'Every project follows the same path: a conversation, a plan, a build from parts that already work, a launch, and then we keep it running.';

const BOARD: Plan = { x: -205, y: -40, w: 410, d: 80, r: 6 };
const BOARD_H = 12;
const FOOT_H = 6;
const XS = [-160, -82, -4, 74, 152];
const TRAVEL = XS.map((x) => x - XS[0]);
const NAMES = ['1 talk', '2 plan', '3 build', '4 live', '5 run'];
const PLAT_TOP = 3;
const LOOP = { x0: 108, x1: 196, y: -26 };

export function buildProcess(width = 1000, height = 400): Machine {
	const P = k.fitProjection(
		[...k.boxCorners(BOARD, -BOARD_H - FOOT_H, 0), [-160, 16, 30], [152, 16, 34], [-4, 16, 28], [74, 16, 26], [-194, -18, 30], [196, -26, 22], [-190, 34, 12]],
		width,
		height,
		{ pad: 14, azimuth: 68, elevation: 34 },
	);
	const at = (p: Point3) => k.iso(p, P);
	const S = k.solidSvg;
	const L = k.lineSvg;
	const D = k.dotsSvg;
	type Tone = 'hi' | 'mid' | 'lo';
	const dots = (pts: Point3[], size = 0.45, tone: 'hi' | 'mid' | 'lo' | 'faint' = 'mid') => D(pts.map(at), { size, tone });
	const halo = (plan: Plan, z: number, h: number) => `<path class="iso-halo" d="${k.haloOf(plan, z, h, P)}"/>`;
	const slab = (x: number, y: number, w: number, d: number, z: number, h: number, tone: Tone = 'mid', o: { r?: number; steps?: number; bevel?: number; thin?: boolean; lit?: boolean; seam?: number } = {}) => {
		const plan: Plan = { x, y, w, d, r: o.r ?? 0.6 };
		const inner = o.seam ? L(k.sideSeam(plan, o.seam, P, o.steps ?? 3), { tone: 'faint' }) : '';
		return S(k.slabOf(plan, z, h, P, o.steps ?? 2, o.bevel ?? 0.2), { tone, crease: o.thin ? 'none' : 'faint', lit: o.lit, inner });
	};
	const cyl = (cx: number, cy: number, r: number, z: number, h: number, tone: Tone = 'mid', bevel = 0.3, lit = false) => S(k.cylinder(cx, cy, r, z, h, P, r > 5 ? 28 : 14, bevel), { tone, lit });
	const seg = (a: Point3, b: Point3, tone: 'mid' | 'lo' | 'faint' = 'mid') => L(k.segment(a, b, P), { tone, free: true });
	const flat = (pts: [number, number][], z: number, tone: 'mid' | 'lo' | 'faint' = 'lo') => L(k.onTop(pts, z, P), { tone, free: true });
	const depth = (x: number, y: number) => k.depthOf([x, y, 0], P);

	function board() {
		const out = [halo(BOARD, -BOARD_H - FOOT_H, BOARD_H)];
		const feet = k.corners(BOARD, 24).sort((a, b) => depth(a[0], a[1]) - depth(b[0], b[1]));
		for (const [x, y] of feet) out.push(cyl(x, y, 8, -BOARD_H - FOOT_H, 1.8, 'lo', 0.4), cyl(x, y, 6, -BOARD_H - FOOT_H + 1.8, FOOT_H - 1.8, 'mid'));
		out.push(S(k.slabOf(BOARD, -BOARD_H, BOARD_H, P, 8, 1.6), { tone: 'mid', inner: L(k.sideSeam(BOARD, -BOARD_H / 2, P, 8), { tone: 'faint' }) }));
		out.push(L(k.planOutline(k.insetPlan(BOARD, 5), 0, P), { tone: 'lo' }), L(k.planOutline(k.insetPlan(BOARD, 8), 0, P), { tone: 'faint' }));
		const screws = k.corners(BOARD, 11);
		out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(''), { tone: 'lo' }), dots(screws.map(([x, y]) => [x, y, 0] as Point3), 0.5));
		for (const [x, y] of screws) out.push(L(k.lineOnTop([x - 1.3, y], [x + 1.3, y], 0, P), { tone: 'faint', free: true }));
		const strip: Plan = { x: -100, y: 28, w: 190, d: 6, r: 1 };
		out.push(slab(strip.x, strip.y, strip.w, strip.d, 0, 0.6, 'lo', { thin: true, steps: 3 }));
		const t = k.topTicks(strip.x + 4, strip.x + strip.w - 4, 5, 5, strip.y + 0.8, 0.6, [1.8, 3.2], P);
		out.push(L(t.minor, { tone: 'lo' }), L(t.major, { tone: 'mid' }), dots([[strip.x + 2, strip.y + 3, 0.6], [strip.x + strip.w - 2, strip.y + 3, 0.6]]));
		const lab: Plan = { x: 112, y: 26, w: 76, d: 10, r: 1.5 };
		out.push(slab(lab.x, lab.y, lab.w, lab.d, 0, 0.8, 'lo', { steps: 3 }));
		XS.forEach((_, i) => out.push(dots(Array.from({ length: i + 1 }, (_, j) => [lab.x + 8 + i * 14 + (j - i / 2) * 2.4, lab.y + 5, 0.8] as Point3), 0.5, 'hi')));
		out.push(dots(k.corners(lab, 2).map(([x, y]) => [x, y, 0.8] as Point3), 0.35));
		const fy = BOARD.y + BOARD.d;
		for (const x of [-150, -50, 50, 150]) out.push(slab(x - 8, fy, 16, 1.4, -8.5, 2.2, 'hi', { thin: true, r: 0.5 }), dots([[x - 5.5, fy + 1.4, -7.4], [x + 5.5, fy + 1.4, -7.4]], 0.35));
		for (const x of [-100, 0, 100]) out.push(seg([x, fy, -11], [x, fy, -1], 'faint'));
		return out.join('');
	}

	function controller() {
		const c: Plan = { x: -196, y: 24, w: 40, d: 12, r: 2 };
		const out = [halo(c, 0, 8)];
		out.push(S(k.slabOf(c, 0, 8, P, 4, 0.6), { tone: 'mid', inner: L(k.sideSeam(c, 3, P, 4), { tone: 'faint' }) }));
		out.push(L(k.planOutline(k.insetPlan(c, 2), 8, P), { tone: 'faint' }), dots(k.corners(c, 2.6).map(([x, y]) => [x, y, 8] as Point3), 0.4));
		out.push(cyl(-184, 30, 3.6, 8, 3, 'mid', 0.5), L(k.knurl(-184, 30, 3.6, 8, 11, 14, P, 0.3), { tone: 'lo' }), L(k.ring(-184, 30, 2.2, 11, P, 12), { tone: 'faint' }), L(k.lineOnTop([-184, 30], [-182.4, 27.8], 11, P), { tone: 'mid', free: true }));
		const rt = k.radialTicks(-184, 30, 6.4, 10, 5, 8, [1, 1.8], P, -2.4, 4.8);
		out.push(L(rt.minor, { tone: 'lo' }), L(rt.major, { tone: 'mid' }));
		out.push(slab(-174, 27, 10, 6, 8, 1, 'lo', { r: 1, thin: true }), slab(-172.5, 28, 3, 2, 9, 2, 'hi', { r: 0.6, thin: true }), slab(-168, 28, 3, 2, 9, 2, 'hi', { r: 0.6, thin: true }));
		out.push(slab(-160, 29, 4, 2, 8, 1.4, 'hi', { r: 0.6, thin: true }));
		out.push(flat([[-196, 31], [-198, 31], [-198, 0], [-196, 0]], 0, 'lo'));
		return out.join('');
	}

	const rail = (x0: number, x1: number, y: number) => slab(x0, y - 0.6, x1 - x0, 1.2, 0.8, 1.2, 'hi', { r: 0.2, thin: true, bevel: 0.1, steps: 1 });
	const railY = (y0: number, y1: number, x: number) => slab(x - 0.6, y0, 1.2, y1 - y0, 0.8, 1.2, 'hi', { r: 0.2, thin: true, bevel: 0.1, steps: 1 });
	const sleepersX = (x0: number, x1: number, y: number, step = 10) => {
		const out: string[] = [];
		for (let x = x0; x <= x1 + 0.1; x += step) out.push(slab(x - 1.2, y - 5, 2.4, 10, 0, 0.8, 'lo', { r: 0.3, thin: true, bevel: 0.1, steps: 1 }));
		return out.join('');
	};
	const sleepersY = (y0: number, y1: number, x: number, step = 10) => {
		const out: string[] = [];
		for (let y = y0; y <= y1 + 0.1; y += step) out.push(slab(x - 5, y - 1.2, 10, 2.4, 0, 0.8, 'lo', { r: 0.3, thin: true, bevel: 0.1, steps: 1 }));
		return out.join('');
	};

	function trackBack() {
		const out: string[] = [];
		out.push(sleepersX(LOOP.x0 + 10, LOOP.x1 - 10, LOOP.y, 15), rail(LOOP.x0 - 2, LOOP.x1 + 2, LOOP.y - 2.4), rail(LOOP.x0 - 2, LOOP.x1 + 2, LOOP.y + 2.4));
		for (const x of [LOOP.x0, LOOP.x1]) {
			out.push(sleepersY(LOOP.y + 8, -8, x, 12), railY(LOOP.y - 2, 2, x - 2.4), railY(LOOP.y - 2, 2, x + 2.4));
		}
		return out.join('');
	}

	function trackMain() {
		const out: string[] = [];
		const x0 = -200;
		const x1 = LOOP.x1 + 3;
		out.push(sleepersX(x0 + 6, x1 - 6, 0, 13), rail(x0, x1, -2.4), rail(x0, x1, 2.4));
		out.push(slab(x0 - 3, -5, 3, 10, 0, 4, 'hi', { r: 0.6 }), slab(x0 - 3.4, -5.4, 1.2, 10.8, 3.2, 1.4, 'lo', { r: 0.4, thin: true }));
		out.push(dots([[x0 - 1.5, -3, 4], [x0 - 1.5, 3, 4]], 0.45));
		for (const [tx, ty] of [[LOOP.x0, 0], [LOOP.x1, 0]]) out.push(slab(tx - 3.4, ty - 3.4, 6.8, 6.8, 0.8, 0.6, 'lo', { r: 1.4, thin: true }), dots([[tx, ty, 1.4]], 0.5, 'hi'));
		return out.join('');
	}

	function platform(i: number) {
		const x = XS[i];
		const pl: Plan = { x: x - 31, y: 10, w: 62, d: 12, r: 1.2 };
		const out = [halo(pl, 0, PLAT_TOP)];
		out.push(S(k.slabOf(pl, 0, PLAT_TOP, P, 4, 0.5), { tone: 'mid', inner: L(k.sideSeam(pl, 1.4, P, 4), { tone: 'faint' }) }));
		out.push(L(k.lineOnTop([x - 29, 10.8], [x + 29, 10.8], PLAT_TOP, P), { tone: 'mid', free: true }), L(k.planOutline(k.insetPlan(pl, 2.2), PLAT_TOP, P), { tone: 'faint' }));
		out.push(dots(k.corners(pl, 2.2).map(([cx, cy]) => [cx, cy, PLAT_TOP] as Point3), 0.4));
		out.push(slab(x - 34, 11, 3, 10, 0, 1.6, 'lo', { thin: true, r: 0.4 }), slab(x + 31, 11, 3, 10, 0, 1.6, 'lo', { thin: true, r: 0.4 }));
		return out.join('');
	}

	function signalPost(i: number) {
		const sx = XS[i] - 34;
		const out = [halo({ x: sx - 2, y: -11, w: 4, d: 4, r: 2 }, 0, 20)];
		out.push(cyl(sx, -9, 3, 0, 1.4, 'lo', 0.3), slab(sx - 1.1, -10.1, 2.2, 2.2, 1.4, 16, 'mid', { r: 0.4, thin: true }));
		out.push(slab(sx - 2.4, -10.4, 4.8, 2.8, 17.4, 4.2, 'lo', { r: 0.8 }), cyl(sx, -7.4, 1.1, 18.6, 1, 'mid', 0.15), L(k.ring(sx, -7.4, 1.5, 19.6, P, 10), { tone: 'faint' }));
		for (const z of [4, 9, 14]) out.push(seg([sx - 1.1, -7.9, z], [sx + 1.1, -7.9, z], 'faint'));
		return out.join('');
	}
	function signalArm(i: number) {
		const sx = XS[i] - 34;
		return slab(sx - 3.6, -8.2, 7.2, 1, 5, 4, 'hi', { r: 0.3, thin: true }) + seg([sx - 2.2, -7.2, 7], [sx + 2.2, -7.2, 7], 'mid') + dots([[sx - 2.8, -7.2, 8.4], [sx + 2.8, -7.2, 8.4]], 0.35);
	}

	function nameBoard(i: number) {
		const x = XS[i] - 9;
		const out: string[] = [];
		for (const dx of [-9, 9]) out.push(cyl(x + dx, -18, 0.9, 0, 11, 'lo', 0.1));
		out.push(slab(x - 12, -19.2, 24, 1.6, 8, 8, 'hi', { r: 0.6, seam: 12 }), L(k.planOutline(k.insetPlan({ x: x - 12, y: -19.2, w: 24, d: 1.6, r: 0.6 }, 0.5), 16, P), { tone: 'faint' }));
		out.push(k.faceTextSvg(k.sideMatrix([x, -17.55], 10.2, P, 'left'), NAMES[i], { size: 3.6, tone: 'hi', anchor: 'middle' }));
		out.push(dots([[x - 10.4, -17.6, 14.4], [x + 10.4, -17.6, 14.4], [x - 10.4, -17.6, 9.6], [x + 10.4, -17.6, 9.6]], 0.35));
		return out.join('');
	}

	const WAGON = { x0: -34, x1: 0 };
	function train(X: number) {
		const out: string[] = [];
		const bogie = (bx: number) => {
			for (const sy of [-1, 1]) out.push(slab(bx, sy > 0 ? 3.6 : -4.8, 8, 1.2, 0.5, 2.2, 'lo', { r: 0.4, thin: true }), dots([[bx + 2, sy > 0 ? 4.8 : -4.8, 1.6], [bx + 6, sy > 0 ? 4.8 : -4.8, 1.6]], 0.45, 'hi'));
		};
		bogie(X - 31);
		bogie(X - 11);
		out.push(slab(X - 34, -4.5, 34, 9, 1.4, 1.6, 'mid', { r: 0.8, steps: 3, seam: 2.2 }));
		for (const y of [-2.4, 0, 2.4]) out.push(L(k.lineOnTop([X - 33, y], [X - 1, y], 3, P), { tone: 'faint', free: true }));
		out.push(L(k.planOutline(k.insetPlan({ x: X - 34, y: -4.5, w: 34, d: 9, r: 0.8 }, 1), 3, P), { tone: 'faint' }));
		out.push(slab(X - 34, -4.5, 1.2, 9, 3, 2.2, 'hi', { r: 0.3, thin: true }), slab(X - 1.2, -4.5, 1.2, 9, 3, 2.2, 'hi', { r: 0.3, thin: true }));
		out.push(slab(X, -0.8, 3, 1.6, 1.8, 1.2, 'lo', { r: 0.3, thin: true }), dots([[X + 1.5, 0, 3]], 0.45, 'hi'));
		const wheelFrames = (x0: number) => {
			for (const sy of [-1, 1]) {
				const y = sy > 0 ? 3.8 : -5;
				out.push(slab(x0, y, 20, 1.2, 0.5, 2.6, 'lo', { r: 0.4, thin: true }));
				for (const wx of [3, 10, 17]) out.push(dots([[x0 + wx, sy > 0 ? 5 : -5, 1.8]], 0.7, 'hi'));
				if (sy > 0) out.push(seg([x0 + 3, 5, 1.8], [x0 + 17, 5, 1.8], 'mid'));
			}
		};
		wheelFrames(X + 4);
		out.push(slab(X + 3, -4, 25, 8, 1.4, 2, 'mid', { r: 1, steps: 3 }));
		out.push(slab(X + 11, -3.4, 15, 6.8, 3.4, 6.4, 'hi', { r: 3.2, steps: 4, bevel: 0.5, seam: 6.5 }));
		out.push(slab(X + 24.6, -3.4, 2.8, 6.8, 3.4, 6.4, 'mid', { r: 1.2 }));
		out.push(L(k.sideArc(X + 18.5, 0, 3.4, 9.2, P, 10), { tone: 'faint' }));
		out.push(slab(X + 3, -4.2, 8.4, 8.4, 3.4, 8.8, 'mid', { r: 0.8, seam: 8 }));
		out.push(slab(X + 2, -5, 10.4, 10, 12.2, 1.2, 'hi', { r: 0.8 }));
		out.push(slab(X + 4.6, 4.2, 4.2, 0.5, 7.2, 3.6, 'lo', { r: 0.3, thin: true }), seg([X + 6.7, 4.7, 7.2], [X + 6.7, 4.7, 10.8], 'faint'));
		out.push(slab(X + 3.6, -4.8, 6, 1.2, 3.4, 1, 'lo', { r: 0.3, thin: true }));
		out.push(cyl(X + 24, 0, 1.5, 9.8, 3.4, 'lo', 0.3), cyl(X + 24, 0, 2.1, 13.2, 0.9, 'hi', 0.3), L(k.ring(X + 24, 0, 1.2, 14.1, P, 10), { tone: 'faint' }));
		out.push(cyl(X + 18, 0, 2.1, 9.8, 2.2, 'mid', 0.4), cyl(X + 18, 0, 1.4, 12, 0.8, 'hi', 0.2), cyl(X + 14.5, 0, 0.7, 9.8, 2.2, 'lo', 0.1));
		out.push(seg([X + 12, 3.4, 8.2], [X + 24, 3.4, 8.2], 'mid'), dots([[X + 12, 3.4, 8.2], [X + 24, 3.4, 8.2]], 0.45, 'hi'));
		out.push(seg([X + 12, 3.4, 5], [X + 24, 3.4, 5], 'faint'));
		out.push(slab(X + 27.4, -4.4, 1.4, 8.8, 1.4, 2.6, 'lo', { r: 0.4, thin: true }), cyl(X + 28.6, -2.6, 0.9, 1.6, 1.4, 'hi', 0.2), cyl(X + 28.6, 2.6, 0.9, 1.6, 1.4, 'hi', 0.2));
		out.push(cyl(X + 27.8, 0, 1.1, 4, 1.8, 'hi', 0.2), L(k.ring(X + 27.8, 0, 0.6, 5.8, P, 8), { tone: 'lo' }));
		out.push(slab(X + 27, -4.2, 1, 8.4, 6, 0.5, 'lo', { r: 0.2, thin: true }));
		return out.join('');
	}

	const PAPER_X = -26.5;
	function note(X: number) {
		const out = [slab(X + PAPER_X - 4.5, 12, 9, 7, 3, 0.9, 'hi', { r: 0.6, thin: true })];
		out.push(flat([[X + PAPER_X - 3, 14], [X + PAPER_X - 1, 16.8], [X + PAPER_X + 1, 14.6], [X + PAPER_X + 3, 17]], 3.9, 'mid'));
		out.push(L(k.lineOnTop([X + PAPER_X - 3, 18.2], [X + PAPER_X + 1, 18.2], 3.9, P), { tone: 'faint', free: true }));
		return out.join('');
	}
	function planSheet(X: number) {
		const out = [slab(X + PAPER_X - 4.5, 12, 9, 7, 8, 0.9, 'hi', { r: 0.5, thin: true })];
		out.push(L(k.planOutline({ x: X + PAPER_X - 3.4, y: 13.1, w: 6.8, d: 4.8, r: 0 }, 8.9, P), { tone: 'mid' }));
		out.push(L(k.lineOnTop([X + PAPER_X - 3.4, 15.5], [X + PAPER_X + 3.4, 15.5], 8.9, P), { tone: 'faint', free: true }), L(k.lineOnTop([X + PAPER_X, 13.1], [X + PAPER_X, 17.9], 8.9, P), { tone: 'faint', free: true }));
		return out.join('');
	}
	function wall(X: number) {
		const x = X - 21;
		const out = [slab(x, 11.5, 16, 8, 3.8, 7, 'mid', { r: 0.6, steps: 3, seam: 6.5 })];
		out.push(slab(x + 6.5, 19.5, 3.4, 0.5, 3.8, 4.4, 'lo', { r: 0.2, thin: true }), dots([[x + 9, 20, 5.8]], 0.4, 'hi'));
		for (const wx of [x + 2, x + 11.2]) out.push(slab(wx, 19.5, 2.8, 0.5, 6.6, 2.6, 'hi', { r: 0.2, thin: true }), seg([wx + 1.4, 20, 6.6], [wx + 1.4, 20, 9.2], 'faint'));
		return out.join('');
	}
	function roof(X: number) {
		const x = X - 22;
		const out = [slab(x, 10.5, 18, 10, 12.3, 3, 'hi', { r: 0.8, steps: 3, bevel: 0.4 })];
		out.push(L(k.planOutline(k.insetPlan({ x, y: 10.5, w: 18, d: 10, r: 0.8 }, 1.6), 15.3, P), { tone: 'faint' }));
		for (let i = 1; i < 6; i++) out.push(L(k.lineOnTop([x + i * 3, 11.4], [x + i * 3, 19.6], 15.3, P), { tone: 'faint', free: true }));
		return out.join('');
	}
	function pole(X: number) {
		const px = X - 2.5;
		const out = [cyl(px, 15.5, 0.9, 3, 15, 'mid', 0.2), cyl(px, 15.5, 1.5, 18, 0.9, 'hi', 0.2)];
		out.push(slab(px - 8.4, 15.1, 7.6, 0.8, 12.4, 4.6, 'hi', { r: 0.2, thin: true }), seg([px - 6.8, 15.9, 14.8], [px - 2, 15.9, 14.8], 'mid'), seg([px - 6.8, 15.9, 13.4], [px - 3.4, 15.9, 13.4], 'faint'));
		return out.join('');
	}

	function kiosk(X: number) {
		const x = X + 6;
		const out = [halo({ x, y: 11.5, w: 20, d: 10, r: 1 }, 3, 8)];
		out.push(slab(x, 11.5, 20, 10, PLAT_TOP, 7, 'mid', { r: 0.8, steps: 3, bevel: 0.4, seam: 6 }));
		out.push(slab(x + 2, 21.5, 7, 0.5, PLAT_TOP, 5, 'lo', { r: 0.3, thin: true }), dots([[x + 7.6, 22, 5.6]], 0.4, 'hi'));
		out.push(slab(x + 11, 21.5, 7, 0.5, 6, 3.4, 'hi', { r: 0.3, thin: true }), seg([x + 14.5, 22, 6], [x + 14.5, 22, 9.4], 'faint'), slab(x + 10.4, 21.7, 8.2, 1.4, 5.4, 0.8, 'lo', { r: 0.3, thin: true }));
		out.push(slab(x - 1, 10.5, 22, 12, 10, 1.4, 'hi', { r: 1, steps: 3, bevel: 0.4 }), L(k.planOutline(k.insetPlan({ x: x - 1, y: 10.5, w: 22, d: 12, r: 1 }, 1.6), 11.4, P), { tone: 'faint' }));
		out.push(cyl(x + 16, 15, 1.4, 11.4, 2.4, 'mid', 0.3), cyl(x + 16, 15, 0.7, 13.8, 1.2, 'hi', 0.1));
		return out.join('');
	}

	function table(X: number) {
		const x0 = X - 34;
		const out: string[] = [];
		const legs = k.corners({ x: x0 + 1.5, y: 11, w: 14, d: 10, r: 0 }, 0).sort((a, b) => depth(a[0], a[1]) - depth(b[0], b[1]));
		for (const [lx, ly] of legs) out.push(cyl(lx, ly, 1, PLAT_TOP, 3.6, 'lo', 0.1));
		out.push(slab(x0 + 1, 10.5, 15, 11, 6.4, 1.6, 'hi', { r: 0.8, steps: 3, bevel: 0.4 }), L(k.planOutline(k.insetPlan({ x: x0 + 1, y: 10.5, w: 15, d: 11, r: 0.8 }, 1), 8, P), { tone: 'faint' }));
		out.push(slab(x0 + 1, 21.5, 15, 0.6, 5.6, 0.8, 'lo', { thin: true, r: 0.2 }));
		out.push(slab(x0 + 11.6, 11.2, 0.9, 9.8, 8, 0.6, 'lo', { thin: true, r: 0.2 }), slab(x0 + 11.6, 11.2, 3.2, 0.9, 8, 0.6, 'lo', { thin: true, r: 0.2 }));
		out.push(cyl(x0 + 14.2, 19.6, 0.8, 8, 3.2, 'mid', 0.2), seg([x0 + 14.2, 19.6, 11.2], [x0 + 14.6, 19.9, 12.2], 'mid'));
		out.push(slab(X + 4, 12, 20, 8, PLAT_TOP, 4.2, 'mid', { r: 0.8, steps: 3, seam: 2 }));
		for (let i = 0; i < 4; i++) out.push(slab(X + 6 + i * 4.4, 20, 3.4, 0.5, 4.2, 2.4, 'lo', { r: 0.2, thin: true }), dots([[X + 7.7 + i * 4.4, 20.5, 5.4]], 0.35, 'hi'));
		out.push(slab(X + 5, 13, 18, 6, 7.2, 0.8, 'lo', { r: 0.6, thin: true }));
		for (const dx of [8, 12, 16]) out.push(seg([X + dx, 14, 8], [X + dx, 18, 8], 'faint'));
		return out.join('');
	}

	function parts(X: number) {
		const out: string[] = [];
		out.push(slab(X - 23, 10.5, 20, 11, PLAT_TOP, 0.8, 'lo', { r: 0.6, thin: true }));
		out.push(L(k.planOutline(k.insetPlan({ x: X - 23, y: 10.5, w: 20, d: 11, r: 0.6 }, 1), 3.8, P), { tone: 'faint' }));
		return out.join('');
	}
	function rack(X: number) {
		const out: string[] = [];
		out.push(slab(X - 23, 21.2, 20, 0.8, 3.8, 8.5, 'lo', { r: 0.2, thin: true }));
		for (const px of [X - 22, X - 4]) out.push(cyl(px, 20.4, 0.9, 3.8, 7, 'mid', 0.15), dots([[px, 20.4, 10.8]], 0.4, 'hi'));
		out.push(slab(X - 23, 10, 20, 11.4, 10.8, 1.5, 'mid', { r: 0.6, steps: 3, seam: 11.5 }), L(k.planOutline(k.insetPlan({ x: X - 23, y: 10, w: 20, d: 11.4, r: 0.6 }, 1.2), 12.3, P), { tone: 'faint' }));
		out.push(seg([X - 23, 10, 11.6], [X - 3, 10, 11.6], 'faint'));
		out.push(slab(X - 1, 11, 5, 9, PLAT_TOP, 1.6, 'lo', { r: 0.6, thin: true }), cyl(X - 2.5, 15.5, 1.8, 3, 0.4, 'hi', 0.1));
		for (let i = 0; i < 3; i++) out.push(slab(X + 6 + i * 6, 12, 4, 4, PLAT_TOP, 2.4, 'lo', { r: 0.6 }), dots([[X + 8 + i * 6, 14, 5.4]], 0.45, 'hi'));
		return out.join('');
	}

	function pad(X: number) {
		const out: string[] = [];
		const pl: Plan = { x: X - 23, y: 10, w: 24, d: 11.4, r: 0.8 };
		out.push(S(k.slabOf(pl, PLAT_TOP, 0.8, P, 3, 0.2), { tone: 'lo', inner: L(k.sideSeam(pl, 3.4, P, 3), { tone: 'faint' }) }));
		out.push(L(k.planOutline(k.insetPlan(pl, 1), 3.8, P), { tone: 'faint' }));
		out.push(cyl(X - 2.5, 15.5, 1.7, 3.8, 0.5, 'hi', 0.1), L(k.ring(X - 2.5, 15.5, 1.1, 4.3, P, 10), { tone: 'lo' }));
		out.push(dots(k.corners(pl, 1.6).map(([cx, cy]) => [cx, cy, 3.8] as Point3), 0.4));
		return out.join('');
	}
	function counter(X: number) {
		const out: string[] = [];
		out.push(slab(X + 6, 11.5, 18, 9, PLAT_TOP, 5, 'mid', { r: 0.8, steps: 3, seam: 5.5 }));
		out.push(slab(X + 7, 20.5, 16, 0.5, 5.8, 3.4, 'lo', { r: 0.3, thin: true }));
		out.push(L(k.sideRing([X + 11.5, 21, 7.5], 1.5, 'y', P, 12), { tone: 'mid', free: true }));
		for (let i = 0; i < 3; i++) out.push(slab(X + 14 + i * 3, 20.6, 2.2, 0.5, 6.2, 2.4, 'hi', { r: 0.2, thin: true }), seg([X + 15.1 + i * 3, 21.2, 6.8], [X + 15.1 + i * 3, 21.2, 8.2], 'mid'));
		out.push(slab(X + 5.4, 11, 19.2, 10, 8, 0.8, 'hi', { r: 0.6, thin: true }));
		return out.join('');
	}

	function shed(X: number) {
		const x = X - 30;
		const out = [halo({ x, y: 11.5, w: 24, d: 10, r: 1 }, 3, 9)];
		out.push(slab(x, 11.5, 24, 10, PLAT_TOP, 8, 'mid', { r: 0.8, steps: 3, bevel: 0.4, seam: 7 }));
		out.push(slab(x - 1, 10.5, 26, 12, 11, 1.4, 'hi', { r: 1, steps: 3, bevel: 0.4 }), L(k.planOutline(k.insetPlan({ x: x - 1, y: 10.5, w: 26, d: 12, r: 1 }, 1.6), 12.4, P), { tone: 'faint' }));
		out.push(slab(x + 2, 21.5, 7, 0.5, PLAT_TOP, 5.4, 'lo', { r: 0.3, thin: true }), dots([[x + 7.6, 22, 5.8]], 0.4, 'hi'));
		const dx = x + 17;
		out.push(slab(dx - 4.6, 21.5, 9.2, 0.6, 5, 5.6, 'lo', { r: 0.3, thin: true }));
		out.push(L(k.sideRing([dx, 22.1, 7.8], 2.2, 'y', P, 20), { tone: 'hi', free: true }), L(k.sideRing([dx, 22.1, 7.8], 3.2, 'y', P, 20), { tone: 'faint', free: true }));
		for (let i = 0; i <= 6; i++) {
			const a = -2.2 + i * 0.73;
			out.push(seg([dx + Math.sin(a) * 1.7, 22.1, 7.8 - Math.cos(a) * 1.7], [dx + Math.sin(a) * 2.2, 22.1, 7.8 - Math.cos(a) * 2.2], 'mid'));
		}
		out.push(dots([[dx, 22.1, 7.8]], 0.6, 'hi'));
		out.push(stepSvg('show-from', 5, seg([dx, 22.1, 7.8], [dx + 1.6, 22.1, 9.2], 'mid')));
		return out.join('');
	}
	function beacon(X: number) {
		const bx = X + 12;
		const out: string[] = [halo({ x: bx - 3, y: 13, w: 6, d: 6, r: 3 }, 3, 20)];
		out.push(cyl(bx, 16, 3.6, PLAT_TOP, 1.2, 'lo', 0.3), cyl(bx, 16, 1.4, 4.2, 13, 'mid', 0.2));
		out.push(L(k.sideArc(bx, 16, 1.4, 9, P, 8), { tone: 'faint' }));
		out.push(cyl(bx, 16, 3, 17.2, 1.2, 'hi', 0.3), cyl(bx, 16, 2.2, 18.4, 3.6, 'mid', 0.4), stepSvg('lit-at', 5, cyl(bx, 16, 1.7, 18.8, 2.8, 'hi', 0.3, true)), cyl(bx, 16, 2.6, 22, 1, 'hi', 0.3), cyl(bx, 16, 0.8, 23, 1.2, 'lo', 0.1));
		for (const [cx, cy] of [[X + 22, 14], [X + 22, 19]] as const) out.push(cyl(cx, cy, 2.2, PLAT_TOP, 4.4, 'mid', 0.4), L(k.ring(cx, cy, 1.4, 7.4, P, 12), { tone: 'lo' }), L(k.sideArc(cx, cy, 2.2, 5.2, P, 10), { tone: 'faint' }));
		return out.join('');
	}

	const stopAt = (i: number) => XS[i];

	const toStep = (f: (s: number) => Point3) => [0, 1, 2, 3, 4].map((s) => f(s));
	const offsets: Record<string, Point3[]> = {
		train: toStep((s) => [TRAVEL[s], 0, 0]),
		note: toStep((s) => [TRAVEL[s], -15.5, 0]),
		wall: toStep((s) => (s < 2 ? [0, 0, 0] : s === 2 ? [0, -15.5, -0.8] : [TRAVEL[3] - TRAVEL[2], 0, 0])),
		pole: toStep((s) => (s < 2 ? [0, 0, 0] : s === 2 ? [0, -15.5, 0] : [TRAVEL[3] - TRAVEL[2], 0, 0.8])),
		roof: toStep((s) => (s < 2 ? [0, 0, 0] : s === 2 ? [0, -15.5, -2.3] : [TRAVEL[3] - TRAVEL[2], 0, -1.5])),
		plan: toStep((s) => (s < 1 ? [0, 0, 0] : [TRAVEL[s] - TRAVEL[1], -15.5, -4.1])),
		...Object.fromEntries(XS.map((_, i) => [`signal${i + 1}`, toStep((s) => [0, 0, s >= i ? 5 : 0] as Point3)])),
	};
	const transforms = transformsFrom(P, offsets);
	const final = (name: string) => transforms[name][4];

	const backItems = [
		...XS.map((_, i) => ({ d: depth(XS[i] - 9, -18), svg: nameBoard(i) })),
		...XS.map((_, i) => ({ d: depth(XS[i] - 34, -9), svg: signalPost(i) + moverSvg(`signal${i + 1}`, final(`signal${i + 1}`), signalArm(i)) })),
	].sort((a, b) => a.d - b.d);

	const front = [kiosk(stopAt(0)), table(stopAt(1)), rack(stopAt(2)), counter(stopAt(3)), shed(stopAt(4)), beacon(stopAt(4))];

	const svg = k.figureSvg({
		width,
		height,
		label:
			'A model railway on a baseboard: one track runs past five small stations, each with a name board and a signal. A little steam train carries a note, a blueprint, then the walls and roof of a tiny house from station to station, puts the house up and raises a flag at the fourth, and ends on a loop at the last, where a beacon lamp glows and a dial gauge shows a reading.',
		body: [
			board(),
			trackBack(),
			...backItems.map((i) => i.svg),
			trackMain(),
			...XS.map((_, i) => platform(i)),
			parts(stopAt(2)),
			pad(stopAt(3)),
			controller(),
			moverSvg('train', final('train'), train(stopAt(0))),
			moverSvg('note', final('note'), note(stopAt(0))),
			moverSvg('wall', final('wall'), wall(stopAt(2))),
			moverSvg('pole', final('pole'), pole(stopAt(2))),
			...front,
			moverSvg('roof', final('roof'), roof(stopAt(2))),
			moverSvg('plan', final('plan'), planSheet(stopAt(1))),
		],
	});
	return { svg, labels: LABELS, transforms };
}
