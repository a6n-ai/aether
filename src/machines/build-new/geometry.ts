import * as k from '../../lib/anatomy/iso-kit';
import type { Plan, Plane, Point3 } from '../../lib/anatomy/iso-kit';
import { moverSvg, stepSvg, transformsFrom, type Machine } from '../../lib/plate';

export const LABELS = ['your idea', 'drawn up', 'built from parts', 'open for customers'] as const;
export const CAPTION = 'Have an idea? We draw it up with you, build it from parts that already work, and open it to your customers.';

const BENCH: Plan = { x: -172, y: -80, w: 322, d: 156, r: 8 };
const BENCH_H = 12;
const FOOT_H = 6;

// cutting table with the pattern-paper housing at its left end
const C = 16;
const TABLE: Plan = { x: -128, y: -20, w: 176, d: 90, r: 3 };
const HOUSE: Plan = { x: -126, y: -14, w: 30, d: 46, r: 2 };
const HOUSE_H = 12;
const SHEET = { x: -123, y: -6, w: 24.5, d: 30, t: 0.9 };
const SLIDE = 44;

// cloth rack with four bolts standing in it
const RACK: Plan = { x: -166, y: -74, w: 92, d: 26, r: 1.5 };
const BOLT_Y = -61;
const BOLT_R = 8;
const BOLT_Z = 3;
const BOLTS = [-152, -130, -108, -86].map((x, i) => ({ x, h: 40 - i * 4 }));
const PT = 1.4;
const SKIRT = { w: 20, d: 16 };
const BODICE = { w: 15, d: 12 };
const COLLAR = { w: 10, d: 8 };

// dress form
const F: Plane = [98, 28];
const HIP_Z = 12;
const HIP_TOP = 20;
const CHEST_TOP = HIP_TOP + PT + 10.6;
const BODICE_TOP = CHEST_TOP + PT;
const COLLAR_TOP = BODICE_TOP + PT;

// tag lamp
const LAMP: Plane = [136, 28];

export function buildNew(width = 720, height = 480): Machine {
	const P = k.fitProjection(
		[...k.boxCorners(BENCH, -BENCH_H - FOOT_H, 0), [RACK.x, RACK.y, 52], [LAMP[0] + 8, LAMP[1], 44], [F[0], F[1], 46]],
		width,
		height,
		{ pad: 22, azimuth: 40 },
	);
	const at = (p: Point3) => k.iso(p, P);
	const S = k.solidSvg;
	const L = k.lineSvg;
	const D = k.dotsSvg;
	const dots = (pts: Point3[], size = 0.45, tone: 'hi' | 'mid' | 'lo' | 'faint' = 'mid') => D(pts.map(at), { size, tone });
	const halo = (plan: Plan, z: number, h: number, blur = 0) => `<path class="iso-halo" d="${k.haloOf(plan, z, h, P)}"${blur ? ` style="filter:blur(${blur}px)"` : ''}/>`;
	const slab = (x: number, y: number, w: number, d: number, z: number, h: number, tone: 'hi' | 'mid' | 'lo' = 'mid', o: { r?: number; steps?: number; bevel?: number; thin?: boolean; lit?: boolean; seam?: number } = {}) => {
		const plan: Plan = { x, y, w, d, r: o.r ?? 0.5 };
		const inner = o.seam ? L(k.sideSeam(plan, o.seam, P, o.steps ?? 3), { tone: 'faint' }) : '';
		return S(k.slabOf(plan, z, h, P, o.steps ?? 2, o.bevel ?? 0.2), { tone, crease: o.thin ? 'none' : 'faint', lit: o.lit, inner });
	};
	const cyl = (cx: number, cy: number, r: number, z: number, h: number, tone: 'hi' | 'mid' | 'lo' = 'mid', bevel = 0.3, lit = false) => S(k.cylinder(cx, cy, r, z, h, P, r > 5 ? 28 : 16, bevel), { tone, lit });
	const seg = (a: Point3, b: Point3, tone: 'mid' | 'lo' | 'faint' = 'mid') => L(k.segment(a, b, P), { tone, free: true });
	const flat = (a: Plane, b: Plane, z: number, tone: 'mid' | 'lo' | 'faint' = 'faint') => L(k.lineOnTop(a, b, z, P), { tone, free: true });
	const ring = (cx: number, cy: number, r: number, z: number, tone: 'mid' | 'lo' | 'faint' = 'lo') => L(k.ring(cx, cy, r, z, P, r > 5 ? 28 : 16), { tone });
	const byDepth = (points: Plane[]) => [...points].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
	const piece = (cx: number, cy: number, z: number, s: { w: number; d: number }, tone: 'hi' | 'mid' = 'hi') => {
		const x = cx - s.w / 2;
		const y = cy - s.d / 2;
		return slab(x, y, s.w, s.d, z, PT, tone, { r: 2.4, thin: true, steps: 4 }) + L(k.planOutline(k.insetPlan({ x, y, w: s.w, d: s.d, r: 2.4 }, 1.4), z + PT, P), { tone: 'faint' });
	};

	function bench() {
		const out = [halo(BENCH, -BENCH_H - FOOT_H, BENCH_H)];
		for (const [x, y] of byDepth(k.corners(BENCH, 24))) out.push(cyl(x, y, 8, -BENCH_H - FOOT_H, 1.8, 'lo', 0.4), cyl(x, y, 6, -BENCH_H - FOOT_H + 1.8, FOOT_H - 1.8, 'mid', 0.3));
		out.push(S(k.slabOf(BENCH, -BENCH_H, BENCH_H, P, 8, 1.6), { tone: 'mid', inner: L(k.sideSeam(BENCH, -BENCH_H / 2, P), { tone: 'faint' }) }));
		out.push(L(k.planOutline(k.insetPlan(BENCH, 5), 0, P), { tone: 'lo' }), L(k.planOutline(k.insetPlan(BENCH, 8), 0, P), { tone: 'faint' }));
		const screws = k.corners(BENCH, 11);
		out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(''), { tone: 'lo' }), dots(screws.map(([x, y]) => [x, y, 0] as Point3), 0.5));
		for (const [x, y] of screws) out.push(flat([x - 1.3, y], [x + 1.3, y], 0));
		const strip: Plan = { x: -140, y: BENCH.y + BENCH.d - 8, w: 200, d: 5, r: 1 };
		out.push(slab(strip.x, strip.y, strip.w, strip.d, 0, 0.6, 'lo', { thin: true, steps: 3 }));
		const tk = k.topTicks(strip.x + 4, strip.x + strip.w - 4, 4, 5, strip.y + 0.6, 0.6, [1.6, 3], P);
		out.push(L(tk.minor, { tone: 'lo' }), L(tk.major, { tone: 'mid' }));
		const label: Plan = { x: 70, y: BENCH.y + BENCH.d - 12, w: 56, d: 8, r: 1.5 };
		out.push(slab(label.x, label.y, label.w, label.d, 0, 0.8, 'lo', { steps: 3 }));
		for (const dy of [2.5, 5.2]) out.push(flat([label.x + 5, label.y + dy], [label.x + label.w - (dy > 5 ? 20 : 5), label.y + dy], 0.8));
		out.push(dots([[label.x + 2.4, label.y + 4, 0.8], [label.x + label.w - 2.4, label.y + 4, 0.8]]));
		const back: Plan = { x: -100, y: BENCH.y + 8, w: 130, d: 5, r: 1 };
		out.push(slab(back.x, back.y, back.w, back.d, 0, 0.6, 'lo', { thin: true, steps: 3 }));
		const bt = k.topTicks(back.x + 4, back.x + back.w - 4, 5, 5, back.y + 0.6, 0.6, [1.6, 3], P);
		out.push(L(bt.minor, { tone: 'lo' }), L(bt.major, { tone: 'mid' }));
		return out.join('');
	}

	function table() {
		const out = [halo(TABLE, 0, C, 4)];
		out.push(S(k.slabOf(TABLE, 0, C, P, 8, 1), { tone: 'mid', inner: L(k.sideSeam(TABLE, 2.2, P), { tone: 'faint' }) + L(k.sideSeam(TABLE, C - 1.6, P), { tone: 'faint' }) }));
		out.push(L(k.planOutline(k.insetPlan(TABLE, 4), C, P, 8), { tone: 'faint' }));
		const fy = TABLE.y + TABLE.d;
		for (const x of [-104, -56, -8, 40].slice(0, 3).map((v) => v - 6)) {
			out.push(slab(x, fy, 40, 0.8, 1.8, C - 4.4, 'lo', { r: 0.4, thin: true }), slab(x + 14, fy + 0.8, 12, 1, 5, 1.4, 'hi', { r: 0.5, thin: true }));
			out.push(dots([[x + 3, fy + 0.8, C - 4.4], [x + 37, fy + 0.8, C - 4.4]], 0.4));
		}
		const rx = TABLE.x + TABLE.w;
		for (const y of [-12, 14, 40]) out.push(slab(rx, y, 0.8, 22, 1.8, C - 4.4, 'lo', { r: 0.4, thin: true }), slab(rx + 0.8, y + 8, 1, 6, 5, 1.4, 'hi', { r: 0.5, thin: true }));
		const cs = k.corners(TABLE, 6);
		out.push(L(cs.map(([x, y]) => k.ring(x, y, 1.5, C, P, 12)).join(''), { tone: 'lo' }), dots(cs.map(([x, y]) => [x, y, C] as Point3), 0.45));
		// cutting mat
		const mat: Plan = { x: -90, y: -12, w: 130, d: 66, r: 1.5 };
		out.push(slab(mat.x, mat.y, mat.w, mat.d, C, 0.5, 'lo', { r: 1.5, thin: true, steps: 3 }));
		for (let x = mat.x + 13; x < mat.x + mat.w - 4; x += 13) out.push(flat([x, mat.y + 3], [x, mat.y + mat.d - 3], C + 0.5));
		for (let y = mat.y + 11; y < mat.y + mat.d - 4; y += 11) out.push(flat([mat.x + 3, y], [mat.x + mat.w - 3, y], C + 0.5));
		// ruler along the front edge
		const ruler: Plan = { x: -112, y: fy - 9, w: 156, d: 5, r: 0.8 };
		out.push(slab(ruler.x, ruler.y, ruler.w, ruler.d, C, 0.9, 'hi', { thin: true, steps: 3 }));
		const rt = k.topTicks(ruler.x + 3, ruler.x + ruler.w - 3, 3, 5, ruler.y + 0.6, C + 0.9, [1.4, 2.8], P);
		out.push(L(rt.minor, { tone: 'lo' }), L(rt.major, { tone: 'mid' }));
		return out.join('');
	}

	function house() {
		const out = [halo(HOUSE, C, HOUSE_H, 2)];
		out.push(S(k.slabOf(HOUSE, C, HOUSE_H, P, 8, 0.5), { tone: 'mid', inner: L(k.sideSeam(HOUSE, C + 3, P), { tone: 'faint' }) }));
		out.push(L(k.planOutline(k.insetPlan(HOUSE, 3), C + HOUSE_H, P), { tone: 'faint' }));
		const fx = HOUSE.x + HOUSE.w;
		out.push(slab(fx, SHEET.y - 3, 0.9, SHEET.d + 6, C + 0.2, 0.7, 'lo', { r: 0.3, thin: true }), slab(fx, SHEET.y - 3, 0.9, SHEET.d + 6, C + 2.4, 0.8, 'lo', { r: 0.3, thin: true }));
		out.push(dots([[fx, SHEET.y - 1, C + 1.2], [fx, SHEET.y + SHEET.d + 1, C + 1.2]], 0.45));
		for (const [x, y] of k.corners(HOUSE, 4)) out.push(dots([[x, y, C + HOUSE_H]], 0.45));
		const cx = HOUSE.x + HOUSE.w / 2;
		const cy = HOUSE.y + HOUSE.d / 2 - 4;
		const z0 = C + HOUSE_H;
		out.push(cyl(cx, cy, 10, z0, 2, 'lo', 0.5), cyl(cx, cy, 7.4, z0 + 2, 15, 'hi', 0.5));
		out.push(L(k.knurl(cx, cy, 7.4, z0 + 2, z0 + 17, 26, P, 0.5), { tone: 'faint' }), ring(cx, cy, 7.4, z0 + 9));
		out.push(cyl(cx, cy, 10, z0 + 17, 2, 'lo', 0.5), cyl(cx, cy, 2, z0 + 19, 4, 'mid', 0.2));
		out.push(dots([[cx, cy, z0 + 23]], 0.7, 'hi'));
		out.push(slab(HOUSE.x + 4, HOUSE.y + HOUSE.d - 8, 8, 1.4, C + HOUSE_H - 4, 2.4, 'lo', { r: 0.3, thin: true }));
		return out.join('');
	}

	function pattern() {
		const { x, y, w, d, t } = SHEET;
		const z = C + 0.6;
		const out = [slab(x, y, w, d, z, t, 'hi', { r: 0.6, thin: true, steps: 3 })];
		const top = z + t;
		out.push(L(k.planOutline(k.insetPlan({ x, y, w, d, r: 0.6 }, 1.2), top, P), { tone: 'faint' }));
		const chalk = [[x + 6, y + 6], [x + 6, y + d - 6], [x + w - 6, y + d - 9], [x + w - 6, y + 9]] as Plane[];
		out.push(L(k.onTop(chalk, top, P, true), { tone: 'lo', dashed: true, free: true }));
		out.push(flat([x + 6, y + d / 2], [x + w - 6, y + d / 2], top, 'lo'));
		out.push(dots(chalk.map(([px, py]) => [px, py, top] as Point3), 0.5, 'mid'));
		out.push(flat([x + 2, y + 2.6], [x + 8, y + 2.6], top), flat([x + w - 9, y + d - 2.6], [x + w - 2, y + d - 2.6], top));
		return out.join('');
	}

	function props() {
		const out: string[] = [];
		// shears
		const sx = -52;
		const sy = 36;
		out.push(slab(sx, sy, 36, 2.4, C + 0.5, 1.2, 'hi', { r: 0.8, thin: true, steps: 3 }), slab(sx + 4, sy + 2.2, 32, 2.4, C + 1.7, 1.2, 'mid', { r: 0.8, thin: true, steps: 3 }));
		out.push(flat([sx + 6, sy + 1.2], [sx + 34, sy + 1.2], C + 1.7, 'lo'), cyl(sx + 14, sy + 2.2, 1.5, C + 2.9, 1.1, 'lo', 0.2), dots([[sx + 14, sy + 2.2, C + 4]], 0.6, 'hi'));
		for (const hy of [sy - 3, sy + 7.6]) out.push(cyl(sx - 1, hy, 4.2, C + 0.5, 1.4, 'mid', 0.5), ring(sx - 1, hy, 2.6, C + 1.9, 'lo'));
		// tape measure
		const tx = 24;
		const ty = 40;
		out.push(halo({ x: tx - 8, y: ty - 8, w: 16, d: 16, r: 8 }, C, 4));
		out.push(cyl(tx, ty, 8, C + 0.5, 3, 'mid', 0.5), cyl(tx, ty, 5.4, C + 3.5, 0.8, 'hi', 0.3), L(k.knurl(tx, ty, 8, C + 0.5, C + 3.5, 24, P, 0.4), { tone: 'faint' }));
		out.push(cyl(tx, ty, 1.6, C + 4.3, 1, 'lo', 0.2), ring(tx, ty, 3.4, C + 4.3, 'faint'));
		out.push(slab(tx + 8, ty - 1.6, 16, 3.2, C + 0.5, 0.6, 'hi', { r: 0.4, thin: true }));
		const tt = k.topTicks(tx + 9, tx + 23, 1.4, 5, ty - 1.2, C + 1.1, [1, 2], P);
		out.push(L(tt.minor, { tone: 'lo' }), L(tt.major, { tone: 'mid' }), slab(tx + 22, ty - 2.2, 3, 4.4, C + 0.5, 1.2, 'lo', { r: 0.5, thin: true }));
		// chalk
		out.push(slab(-6, 14, 11, 3.2, C + 0.5, 2.4, 'hi', { r: 1, thin: true }), slab(-3, 21, 8, 2.8, C + 0.5, 2, 'mid', { r: 1, thin: true }));
		// pincushion
		out.push(cyl(-80, 44, 5, C + 0.5, 3.4, 'mid', 0.8), ring(-80, 44, 3, C + 3.9, 'faint'));
		for (const [dx, dy] of [[-1.6, -1], [1.4, -1.8], [0.4, 1.8]]) out.push(seg([-80 + dx, 44 + dy, C + 3.9], [-80 + dx * 1.6, 44 + dy * 1.6, C + 7.4], 'mid'), dots([[-80 + dx * 1.6, 44 + dy * 1.6, C + 7.4]], 0.5, 'hi'));
		// thread spools
		for (const [i, x] of [14, 26, 38].entries()) {
			const y = -8;
			out.push(cyl(x, y, 3.8, C + 0.5, 1, 'lo', 0.3), cyl(x, y, 2.4, C + 1.5, 5.2, i === 1 ? 'hi' : 'mid', 0.2), cyl(x, y, 3.8, C + 6.7, 1, 'lo', 0.3));
			out.push(L(k.knurl(x, y, 2.4, C + 1.5, C + 6.7, 10, P, 0.2), { tone: 'faint' }));
		}
		return out.join('');
	}

	function rack() {
		const out = [halo(RACK, 0, 24, 3)];
		out.push(slab(RACK.x, RACK.y, RACK.w, RACK.d, 0, BOLT_Z, 'lo', { r: 1.5, seam: 1.4 }));
		out.push(slab(RACK.x, RACK.y, RACK.w, 2, BOLT_Z, 22, 'lo', { r: 0.4, thin: true }));
		out.push(L(k.planOutline(k.insetPlan(RACK, 3), BOLT_Z, P), { tone: 'faint' }));
		out.push(...bolts());
		out.push(slab(RACK.x, RACK.y + RACK.d - 3, RACK.w, 1.8, 13, 2, 'mid', { r: 0.4, thin: true }));
		const px = [RACK.x, RACK.x + RACK.w - 3];
		for (const x of px) out.push(slab(x, RACK.y, 3, RACK.d, BOLT_Z, 22, 'mid', { r: 0.5 }), dots([[x + 1.5, RACK.y + RACK.d - 2, BOLT_Z + 22]], 0.45));
		out.push(slab(RACK.x + 6, RACK.y + RACK.d - 1, 40, 0.7, 0.4, 2.2, 'hi', { r: 0.3, thin: true }));
		out.push(flat([RACK.x + 10, RACK.y + RACK.d - 1], [RACK.x + 38, RACK.y + RACK.d - 1], 2.4));
		return out.join('');
	}

	function bolts() {
		const out: string[] = [];
		for (const [i, b] of BOLTS.entries()) {
			const y = BOLT_Y;
			out.push(cyl(b.x, y, BOLT_R + 1, BOLT_Z, 1.6, 'lo', 0.4), cyl(b.x, y, BOLT_R, BOLT_Z + 1.6, b.h - BOLT_Z - 1.6, i % 2 ? 'mid' : 'hi', 0.5));
			out.push(L(k.knurl(b.x, y, BOLT_R, BOLT_Z + 1.6, b.h, 22, P, 0.5), { tone: 'faint' }));
			out.push(ring(b.x, y, BOLT_R, b.h - 4, 'lo'), ring(b.x, y, BOLT_R, BOLT_Z + 7, 'lo'));
			out.push(slab(b.x - 3.4, y + BOLT_R - 0.6, 6.8, 0.7, b.h - 12, 5, 'hi', { r: 0.3, thin: true }));
			out.push(flat([b.x - 2.2, y + BOLT_R + 0.1], [b.x + 2.2, y + BOLT_R + 0.1], b.h - 12 + 3.6, 'lo'));
			if (i === 3) out.push(ring(b.x, y, BOLT_R - 2.6, b.h, 'lo'), cyl(b.x, y, 2, b.h, 1.4, 'lo', 0.2));
		}
		return out;
	}

	const formParts = {
		low() {
			const [fx, fy] = F;
			const out = [halo({ x: fx - 14, y: fy - 14, w: 28, d: 28, r: 8 }, 0, HIP_Z, 2)];
			out.push(slab(fx - 14, fy - 2.5, 28, 5, 0, 2, 'lo', { r: 1.2, steps: 3 }), slab(fx - 2.5, fy - 14, 5, 28, 0, 2, 'lo', { r: 1.2, steps: 3 }));
			for (const [x, y] of byDepth([[fx - 13, fy], [fx + 13, fy], [fx, fy - 13], [fx, fy + 13]])) out.push(cyl(x, y, 1.9, 2, 1.2, 'mid', 0.2));
			out.push(cyl(fx, fy, 2.2, 2, HIP_Z - 2, 'mid', 0.3), cyl(fx, fy, 3.2, 5.4, 2, 'lo', 0.3), ring(fx, fy, 2.2, 8, 'faint'));
			out.push(cyl(fx, fy, 11, HIP_Z, HIP_TOP - HIP_Z, 'hi', 0.8), L(k.sideArc(fx, fy, 11, 16, P, 18), { tone: 'faint' }), ring(fx, fy, 11, 15, 'faint'));
			return out.join('');
		},
		chest() {
			const [fx, fy] = F;
			return cyl(fx, fy, 8, HIP_TOP + PT, CHEST_TOP - HIP_TOP - PT, 'hi', 0.8) + L(k.sideArc(fx, fy, 8, 27, P, 16), { tone: 'faint' }) + ring(fx, fy, 8, 27, 'faint') + ring(fx, fy, 8, CHEST_TOP - 1.4, 'lo');
		},
		neck() {
			const [fx, fy] = F;
			return cyl(fx, fy, 2.6, COLLAR_TOP, 5, 'hi', 0.3) + cyl(fx, fy, 3.6, COLLAR_TOP + 5, 1.6, 'mid', 0.5) + dots([[fx, fy, COLLAR_TOP + 6.6]], 0.6, 'hi');
		},
	};

	function sketch() {
		const [fx, fy] = F;
		const cx = fx - 6;
		const y = fy + 8.4;
		const z = HIP_TOP + PT + 1.2;
		const yf = y + 0.8;
		const out = [slab(cx, y, 12, 0.8, z, 10, 'hi', { r: 0.3, thin: true })];
		out.push(seg([cx + 6, yf, z + 8.6], [cx + 4.4, yf, z + 4.4], 'mid'), seg([cx + 6, yf, z + 8.6], [cx + 7.6, yf, z + 4.4], 'mid'), seg([cx + 3.4, yf, z + 4.4], [cx + 8.6, yf, z + 4.4], 'mid'), seg([cx + 3.4, yf, z + 4.4], [cx + 2.6, yf, z + 1.4], 'lo'), seg([cx + 8.6, yf, z + 4.4], [cx + 9.4, yf, z + 1.4], 'lo'), seg([cx + 2.6, yf, z + 1.4], [cx + 9.4, yf, z + 1.4], 'lo'));
		out.push(cyl(cx + 6, y + 0.4, 0.9, z + 10, 1, 'lo', 0.15), dots([[cx + 6, y + 0.4, z + 11]], 0.6, 'hi'));
		return out.join('');
	}

	function stitches() {
		const [fx, fy] = F;
		const out: string[] = [];
		const sk = { x: fx - SKIRT.w / 2, y: fy - SKIRT.d / 2, w: SKIRT.w, d: SKIRT.d, r: 2.4 };
		out.push(L(k.planOutline(k.insetPlan(sk, 2.2), HIP_TOP + PT, P), { tone: 'mid', dotted: true, free: true }));
		out.push(flat([fx - 8, fy - 6], [fx - 8, fy + 6], HIP_TOP + PT, 'mid'), flat([fx + 8, fy - 6], [fx + 8, fy + 6], HIP_TOP + PT, 'mid'));
		const bd = { x: fx - BODICE.w / 2, y: fy - BODICE.d / 2, w: BODICE.w, d: BODICE.d, r: 2.4 };
		out.push(L(k.planOutline(k.insetPlan(bd, 2), BODICE_TOP, P), { tone: 'mid', dotted: true, free: true }));
		out.push(flat([fx, fy + 5], [fx, fy + 2], BODICE_TOP, 'mid'), flat([fx - 5.4, fy - 5], [fx - 5.4, fy + 5], BODICE_TOP, 'mid'), flat([fx + 5.4, fy - 5], [fx + 5.4, fy + 5], BODICE_TOP, 'mid'));
		out.push(ring(fx, fy, 3.4, COLLAR_TOP, 'mid'));
		return stepSvg('show-from', 4, out.join(''));
	}

	function lamp() {
		const [lx, ly] = LAMP;
		const out = [halo({ x: lx - 6, y: ly - 6, w: 12, d: 12, r: 6 }, 0, 2)];
		out.push(cyl(lx, ly, 5, 0, 1.8, 'lo', 0.4), cyl(lx, ly, 3.6, 1.8, 1.6, 'mid', 0.3), cyl(lx, ly, 1.1, 3.4, 27, 'mid', 0.2));
		out.push(slab(lx - 16, ly - 1, 17, 2, 29, 1.6, 'mid', { r: 0.6, thin: true }), cyl(lx, ly, 3.4, 30.6, 3.4, 'mid', 0.4), L(k.ring(lx, ly, 3.4, 32.4, P, 16), { tone: 'lo' }));
		out.push(stepSvg('lit-at', 4, cyl(lx, ly, 2.4, 34, 2.4, 'hi', 0.3, true)));
		// hang tag on a string from the arm
		const tx = lx - 14;
		out.push(seg([tx + 2.5, ly, 29], [tx + 2.5, ly, 26.6], 'mid'), slab(tx, ly - 0.5, 5, 0.9, 17, 9.4, 'hi', { r: 0.4, thin: true }));
		out.push(dots([[tx + 2.5, ly + 0.4, 25.2]], 0.5, 'lo'), seg([tx + 1, ly + 0.4, 21.6], [tx + 4, ly + 0.4, 21.6], 'lo'), seg([tx + 1, ly + 0.4, 19.6], [tx + 3, ly + 0.4, 19.6], 'faint'));
		return out.join('');
	}

	const z3: Point3 = [0, 0, 0];
	const skirtTo: Point3 = [F[0] - BOLTS[0].x, F[1] - BOLT_Y, HIP_TOP - BOLTS[0].h];
	const bodiceTo: Point3 = [F[0] - BOLTS[1].x, F[1] - BOLT_Y, CHEST_TOP - BOLTS[1].h];
	const collarTo: Point3 = [F[0] - BOLTS[2].x, F[1] - BOLT_Y, BODICE_TOP - BOLTS[2].h];
	const slideOut: Point3 = [SLIDE, 0, 0];
	const transforms = transformsFrom(P, {
		sketch: [z3, z3, z3, z3],
		pattern: [z3, slideOut, slideOut, slideOut],
		skirt: [z3, z3, skirtTo, skirtTo],
		bodice: [z3, z3, bodiceTo, bodiceTo],
		collar: [z3, z3, collarTo, collarTo],
	});
	const last = (n: string) => transforms[n][3];

	const dFormX = k.depthOf([F[0], F[1], 0], P);
	const scene: { depth: number; svg: string }[] = [
		{ depth: k.depthOf([-120, -61, 0], P), svg: rack() },
		{ depth: k.depthOf([-40, 25, 0], P), svg: table() + house() + moverSvg('pattern', last('pattern'), pattern()) + props() },
		{ depth: dFormX, svg: formParts.low() + moverSvg('skirt', last('skirt'), piece(BOLTS[0].x, BOLT_Y, BOLTS[0].h, SKIRT, 'mid')) + formParts.chest() + moverSvg('sketch', last('sketch'), sketch()) + moverSvg('bodice', last('bodice'), piece(BOLTS[1].x, BOLT_Y, BOLTS[1].h, BODICE, 'hi')) + moverSvg('collar', last('collar'), piece(BOLTS[2].x, BOLT_Y, BOLTS[2].h, COLLAR, 'mid')) + formParts.neck() + stitches() },
		{ depth: k.depthOf([LAMP[0], LAMP[1], 0], P), svg: lamp() },
	];
	scene.sort((a, b) => a.depth - b.depth);

	const svg = k.figureSvg({
		width,
		height,
		label:
			"A tailor's bench: a cutting table with a ruler, shears, a tape measure, chalk and thread, a roll of pattern paper at one end, a rack of cloth bolts, and a dress form on a stand with a sketch card pinned to it. The paper pattern slides out of the roll onto the table, cut pieces of cloth lift from the bolts onto the dress form, and the finished garment stands there with a price-tag lamp lit.",
		body: [bench(), ...scene.map((s) => s.svg)],
	});
	return { svg, labels: LABELS, transforms };
}
