import * as k from '../../lib/anatomy/iso-kit';
import type { Plan, Plane, Point3 } from '../../lib/anatomy/iso-kit';
import { moverSvg, stepSvg, transformsFrom, type Machine } from '../../lib/plate';

export const LABELS = ['your idea', 'drawn up', 'built from parts', 'open for customers'] as const;
export const CAPTION = 'Have an idea? We draw it up with you, build it from parts that already work, and open it to your customers.';

const BENCH: Plan = { x: -175, y: -82, w: 350, d: 164, r: 8 };
const BENCH_H = 12;
const FOOT_H = 6;

const TRAY: Plan = { x: -96, y: 10, w: 90, d: 52, r: 4 };
const TRAY_Z = 2;
const WALL = 4;
const WALL_TOP = 11;

const SILL: Plan = { x: 56, y: -60, w: 88, d: 30, r: 2 };
const SILL_H = 6;
const SHOP_TOP = 60;
const DOOR_H = 38;
const CANOPY_Z = SILL_H + DOOR_H + 3;
const PANE: Plan = { x: 110, y: -50, w: 24, d: 2, r: 0.4 };

const LIFT = 40;

interface Mover {
	name: 'door' | 'canopy' | 'planter';
	from: Point3;
	to: Point3;
}
export const MOVERS: Mover[] = [
	{ name: 'door', from: [-80, 50, TRAY_Z], to: [92, -49, SILL_H] },
	{ name: 'canopy', from: [-52, 28, TRAY_Z], to: [92, -50, CANOPY_Z] },
	{ name: 'planter', from: [-24, 46, TRAY_Z], to: [122, -40, SILL_H] },
];

function poseAt(step: number): Record<Mover['name'], Point3> {
	const pose = {} as Record<Mover['name'], Point3>;
	for (const m of MOVERS) {
		const travel: Point3 = [m.to[0] - m.from[0], m.to[1] - m.from[1], m.to[2] - m.from[2]];
		pose[m.name] = step <= 1 ? [0, 0, 0] : step === 2 ? [0, 0, LIFT] : travel;
	}
	return pose;
}

export function buildNew(width = 720, height = 480): Machine {
	const P = k.fitProjection(
		[...k.boxCorners(BENCH, -BENCH_H - FOOT_H, 0), [SILL.x, SILL.y, SHOP_TOP + 6], [-130, -10, 76], [-80, 50, TRAY_Z + LIFT + DOOR_H + 4]],
		width,
		height,
		{ pad: 22, azimuth: 40 },
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

	function bench() {
		const out = [halo(BENCH, -BENCH_H - FOOT_H, BENCH_H)];
		for (const [x, y] of byDepth(k.corners(BENCH, 24))) {
			out.push(S(k.cylinder(x, y, 8, -BENCH_H - FOOT_H, 1.8, P, 28), { tone: 'lo' }));
			out.push(S(k.cylinder(x, y, 6, -BENCH_H - FOOT_H + 1.8, FOOT_H - 1.8, P, 28), { tone: 'mid' }));
		}
		out.push(S(k.slabOf(BENCH, -BENCH_H, BENCH_H, P, 8, 1.6), { tone: 'mid', inner: L(k.sideSeam(BENCH, -BENCH_H / 2, P), { tone: 'faint' }) }));
		out.push(L(k.planOutline(k.insetPlan(BENCH, 5), 0, P), { tone: 'lo' }));
		const screws = k.corners(BENCH, 11);
		out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(''), { tone: 'lo' }));
		out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
		const strip: Plan = { x: -150, y: 66, w: 190, d: 7, r: 1 };
		out.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: 'lo', crease: 'none' }));
		const ticks = k.topTicks(strip.x + 4, strip.x + strip.w - 4, 4, 5, strip.y + 0.8, 0.6, [2, 3.6], P);
		out.push(L(ticks.minor, { tone: 'lo' }), L(ticks.major, { tone: 'mid' }));
		const label: Plan = { x: 62, y: 60, w: 40, d: 13, r: 1.5 };
		out.push(S(k.slabOf(label, 0, 0.8, P, 3), { tone: 'lo' }));
		for (const dy of [3.5, 6.5, 9.5]) out.push(L(k.lineOnTop([label.x + 5, label.y + dy], [label.x + label.w - (dy === 9.5 ? 16 : 5), label.y + dy], 0.8, P), { tone: 'faint', free: true }));
		out.push(D([at([label.x + 2, label.y + 2, 0.8]), at([label.x + label.w - 2, label.y + label.d - 2, 0.8])], { size: 0.4 }));
		const fx = BENCH.x + BENCH.w;
		const fy = BENCH.y + BENCH.d;
		for (let y = -48; y <= 48; y += 16) out.push(L(rectX(fx, y - 5, y + 5, -4.8, -2.6), { tone: 'lo' }));
		for (let x = -120; x <= 120; x += 30) out.push(L(rectY(fy, x - 7, x + 7, -4.8, -2.6), { tone: 'lo' }));
		out.push(dotsAt([-150, -90, -30, 30, 90, 150].map((x) => [x, fy, -9] as Point3), 0.45), dotsAt([-60, -20, 20, 60].map((y) => [fx, y, -9] as Point3), 0.45));
		out.push(L([-120, 0, 120].map((x) => k.ring(x, -76, 2, 0, P, 14)).join(''), { tone: 'lo' }), dotsAt([-120, 0, 120].map((x) => [x, -76, 0] as Point3), 0.45));
		out.push(L(k.planOutline({ x: 130, y: 40, w: 36, d: 28, r: 2 }, 0, P), { tone: 'faint' }));
		return out.join('');
	}

	function lampAndStrip() {
		const out: string[] = [];
		const [lx, ly] = [-120, -62];
		out.push(halo({ x: lx - 8, y: ly - 8, w: 16, d: 16, r: 8 }, 0, 3, 2));
		out.push(S(k.cylinder(lx, ly, 8, 0, 2.4, P, 28, 0.6), { tone: 'mid' }));
		out.push(L(k.ring(lx, ly, 5.6, 2.4, P, 20), { tone: 'lo' }));
		out.push(S(k.cylinder(lx, ly, 1.3, 2.4, 40, P, 12), { tone: 'hi', crease: 'none' }));
		out.push(S(k.cylinder(lx, ly, 2.6, 22, 2, P, 14), { tone: 'mid' }));
		out.push(S(k.cylinder(lx, ly, 8, 42, 9, P, 28, 0.8), { tone: 'hi' }));
		out.push(L(k.sideArc(lx, ly, 8, 46, P, 24), { tone: 'mid' }));
		out.push(L(k.ring(lx, ly, 5, 51, P, 20), { tone: 'lo' }));
		out.push(S(k.cylinder(lx, ly, 2.2, 51, 2.4, P, 12), { tone: 'mid' }));
		out.push(D([at([lx, ly, 53.4]), at([lx, ly, 24])], { size: 0.45, tone: 'hi' }));
		const strip: Plan = { x: 10, y: -78, w: 50, d: 10, r: 1.5 };
		out.push(halo(strip, 0, 3.6, 2), S(k.slabOf(strip, 0, 3.6, P, 3, 0.6), { tone: 'mid' }));
		out.push(L(k.planOutline(k.insetPlan(strip, 2), 3.6, P), { tone: 'faint' }));
		for (const x of [20, 32, 44]) out.push(L(rectY(strip.y + strip.d, x - 3.5, x + 3.5, 0.9, 2.7), { tone: 'lo' }));
		out.push(S(k.slabOf({ x: 52, y: -75, w: 5, d: 4, r: 1 }, 3.6, 1.6, P, 3, 0.3), { tone: 'hi' }));
		out.push(D([at([14, -74, 3.6]), at([56, -74, 3.6]), at([14, -70, 3.6])], { size: 0.4 }));
		out.push(k.wireSvg(at([lx + 7.6, ly + 1, 0.6]), at([20, strip.y + strip.d, 1.8]), { via: [at([-100, -62, 0.6]), at([-100, -66, 0.6]), at([20, -66, 0.6])], size: 1 }));
		return out.join('');
	}

	function clock() {
		const b: Plan = { x: 146, y: -74, w: 18, d: 7, r: 2 };
		const out = [halo({ ...b, x: b.x - 2, w: b.w + 4 }, 0, 20, 2)];
		out.push(S(k.slabOf({ x: b.x - 2, y: b.y - 1, w: b.w + 4, d: b.d + 2, r: 1.5 }, 0, 1.6, P, 3, 0.4), { tone: 'lo' }));
		out.push(S(k.slabOf(b, 1.6, 19, P, 4, 0.8), { tone: 'hi' }));
		const [cx, f, cz] = [b.x + b.w / 2, b.y + b.d, 11];
		out.push(L(k.sideRing([cx, f, cz], 6.6, 'y', P, 32), { tone: 'mid' }));
		for (let i = 0; i < 12; i++) {
			const a = (i / 12) * Math.PI * 2;
			const [c, s2] = [Math.sin(a), Math.cos(a)];
			out.push(L(seg([cx + c * 5.2, f, cz + s2 * 5.2], [cx + c * 6.2, f, cz + s2 * 6.2]), { tone: i % 3 ? 'lo' : 'mid' }));
		}
		out.push(L(seg([cx, f, cz], [cx, f, cz + 4.4]) + seg([cx, f, cz], [cx + 3.4, f, cz - 1.4]), { tone: 'hi' }));
		out.push(D([at([cx, f, cz]), at([b.x + 3, f, 4]), at([b.x + b.w - 3, f, 4])], { size: 0.5, tone: 'hi' }));
		out.push(S(k.slabOf({ x: b.x + 4, y: b.y + 2, w: b.w - 8, d: 3, r: 1 }, 20.6, 2, P, 3, 0.3), { tone: 'mid' }));
		return out.join('');
	}

	function mat() {
		const m: Plan = { x: 14, y: -6, w: 72, d: 46, r: 2 };
		const out = [halo(m, 0, 0.8, 2), S(k.slabOf(m, 0, 0.8, P, 3, 0.3), { tone: 'lo' })];
		out.push(L(k.planOutline(k.insetPlan(m, 3), 0.8, P), { tone: 'faint' }));
		let g = '';
		for (let x = m.x + 10; x < m.x + m.w - 4; x += 8) g += k.lineOnTop([x, m.y + 3], [x, m.y + m.d - 3], 0.8, P);
		for (let y = m.y + 10; y < m.y + m.d - 4; y += 8) g += k.lineOnTop([m.x + 3, y], [m.x + m.w - 3, y], 0.8, P);
		out.push(L(g, { tone: 'faint' }));
		out.push(D(k.corners(m, 1.6).map(([x, y]) => at([x, y, 0.8])), { size: 0.4 }));
		const t = k.topTicks(m.x + 4, m.x + m.w - 4, 3, 5, m.y + 0.6, 0.8, [1.2, 2.4], P);
		out.push(L(t.minor, { tone: 'lo' }), L(t.major, { tone: 'mid' }));
		out.push(...swatches(), ...setSquare(), ...tape());
		return out.join('');
	}
	function swatches() {
		const out: string[] = [];
		for (let i = 0; i < 4; i++) {
			const pl: Plan = { x: 22 + i * 1.6, y: 10 + i * 2.6, w: 20, d: 7, r: 0.8 };
			out.push(S(k.slabOf(pl, 0.8 + i * 0.5, 0.5, P, 3, 0.15), { tone: i % 2 ? 'hi' : 'mid', crease: 'none' }));
		}
		out.push(S(k.slabOf({ x: 23.6 + 4.8, y: 18, w: 12, d: 5.4, r: 0.6 }, 2.8, 0.4, P, 2), { tone: 'hi', crease: 'none' }));
		out.push(D([at([26, 14, 3]), at([40, 14, 3])], { size: 0.35 }));
		return out;
	}
	function setSquare() {
		const out = [S(k.extrude([[54, 6], [76, 6], [54, 26]], 0.8, 1, P), { tone: 'hi' })];
		out.push(L(k.onTop([[57, 9], [70, 9], [57, 19]], 1.8, P, true), { tone: 'faint' }));
		out.push(D([at([58, 10, 1.8])], { size: 0.45 }));
		return out;
	}
	function tape() {
		const out = [halo({ x: 20, y: 28, w: 20, d: 20, r: 10 }, 0.8, 4, 2)];
		out.push(S(k.cylinder(30, 33, 6.2, 0.8, 4, P, 28, 0.4), { tone: 'mid' }));
		out.push(L(k.ring(30, 33, 3.2, 4.8, P, 20), { tone: 'lo' }), L(k.ring(30, 33, 5, 4.8, P, 24), { tone: 'faint' }));
		out.push(S(k.slabOf({ x: 36, y: 36, w: 9, d: 3, r: 0.5 }, 0.8, 0.5, P, 2), { tone: 'hi', crease: 'none' }));
		return out;
	}

	function mug() {
		const [cx, cy] = [-156, 38];
		const out = [halo({ x: cx - 7, y: cy - 7, w: 14, d: 14, r: 7 }, 0, 10, 2)];
		out.push(S(k.cylinder(cx, cy, 6, 0, 10, P, 28, 0.6), { tone: 'hi' }));
		out.push(L(k.knurl(cx, cy, 6, 1, 9, 22, P, 0.3), { tone: 'faint' }), L(k.ring(cx, cy, 4.6, 10, P, 22), { tone: 'mid' }));
		out.push(S(k.slabOf({ x: cx + 5, y: cy - 1, w: 4.4, d: 2, r: 0.8 }, 3, 5, P, 3, 0.3), { tone: 'mid' }));
		[[-1.6, 0.6, 24], [1.2, -1.2, 22], [0.4, 1.8, 26]].forEach(([dx, dy, h], i) => {
			out.push(S(k.cylinder(cx + dx, cy + dy, 0.9, 6, h - 6 + 6, P, 8), { tone: i === 1 ? 'mid' : 'hi', crease: 'none' }));
			out.push(S(k.cylinder(cx + dx, cy + dy, 0.9, 6 + h, 1.4, P, 8), { tone: 'lo' }));
		});
		return out.join('');
	}

	function plant() {
		const [cx, cy] = [-134, 46];
		const out = [halo({ x: cx - 7, y: cy - 7, w: 14, d: 14, r: 7 }, 0, 8, 2)];
		out.push(S(k.cylinder(cx, cy, 6.4, 0, 8, P, 28, 0.6), { tone: 'mid' }));
		out.push(L(k.ring(cx, cy, 5, 8, P, 22) + k.ring(cx, cy, 6.4, 6, P, 28), { tone: 'lo' }), L(k.knurl(cx, cy, 6.4, 1, 5, 20, P, 0.3), { tone: 'faint' }));
		out.push(S(k.cylinder(cx, cy, 4.4, 8, 0.8, P, 20), { tone: 'lo', crease: 'none' }));
		for (const [dx, dy, h] of [[0, 0, 24], [-2.6, 1.2, 17], [2.6, -1, 19], [0.8, 2.6, 13]] as const) {
			out.push(L(seg([cx, cy, 8.8], [cx + dx, cy + dy, 8.8 + h]), { tone: 'mid' }));
			out.push(S(k.extrude([[cx + dx - 3.4, cy + dy], [cx + dx, cy + dy - 1.8], [cx + dx + 3.4, cy + dy], [cx + dx, cy + dy + 1.8]], 8.8 + h, 0.6, P), { tone: 'hi' }));
			out.push(L(k.lineOnTop([cx + dx - 2.6, cy + dy], [cx + dx + 2.6, cy + dy], 9.4 + h, P), { tone: 'faint' }));
		}
		return out.join('');
	}
	function pencilCase() {
		const c: Plan = { x: 8, y: 54, w: 38, d: 14, r: 4 };
		const out = [halo(c, 0, 6, 2), S(k.slabOf(c, 0, 6, P, 6, 0.9), { tone: 'hi', inner: L(k.sideSeam(c, 3, P, 6), { tone: 'faint' }) })];
		out.push(L(k.planOutline(k.insetPlan(c, 2.4), 6, P, 6), { tone: 'faint' }), L(k.lineOnTop([c.x + 6, c.y + 7], [c.x + c.w - 6, c.y + 7], 6, P), { tone: 'lo' }));
		out.push(S(k.slabOf({ x: c.x + c.w - 11, y: c.y + 5.4, w: 5, d: 3.2, r: 1 }, 6, 1.2, P, 3, 0.3), { tone: 'mid' }), D([at([c.x + 6, c.y + 7, 6]), at([c.x + c.w - 6, c.y + 7, 6])], { size: 0.45 }));
		out.push(S(k.slabOf({ x: c.x + 8, y: c.y + 2, w: 12, d: 3, r: 0.6 }, 6, 0.8, P, 2), { tone: 'mid', crease: 'none' }));
		return out.join('');
	}

	function receiptsAndTags() {
		const out: string[] = [];
		for (const [x, y] of [[138, 52], [150, 56]] as const) {
			out.push(halo({ x: x - 5, y: y - 5, w: 10, d: 10, r: 5 }, 0, 9, 2));
			out.push(S(k.cylinder(x, y, 5, 0, 9, P, 24, 0.4), { tone: 'hi' }));
			out.push(L(k.ring(x, y, 2, 9, P, 14), { tone: 'mid' }), L(k.knurl(x, y, 5, 1.5, 7.5, 16, P, 0.3), { tone: 'faint' }));
		}
		out.push(S(k.slabOf({ x: 133, y: 59, w: 10, d: 14, r: 0.4 }, 0, 0.5, P, 2), { tone: 'hi', crease: 'none' }));
		out.push(L(k.lineOnTop([135, 62], [141, 62], 0.5, P) + k.lineOnTop([135, 65], [139, 65], 0.5, P), { tone: 'faint', free: true }));
		const stand: Plan = { x: 114, y: 54, w: 12, d: 2.4, r: 0.6 };
		out.push(halo(stand, 0, 11, 2), S(k.slabOf({ ...stand, y: 52, d: 5, w: 14, x: 113 }, 0, 1.6, P, 2, 0.3), { tone: 'mid' }));
		out.push(S(k.slabOf({ x: 114, y: 54, w: 12, d: 1.6, r: 0.5 }, 1.6, 9, P, 2, 0.3), { tone: 'hi' }));
		out.push(L(rectY(55.6, 116, 124, 4, 9.5), { tone: 'mid' }) + L(seg([117, 55.6, 7.8], [123, 55.6, 7.8]), { tone: 'faint' }));
		out.push(D([at([116, 55.6, 3]), at([124, 55.6, 3])], { size: 0.35 }));
		for (let i = 0; i < 3; i++) out.push(S(k.cylinder(155 + i * 0.4, 38 + i * 0.3, 2.4, i * 0.6, 0.6, P, 14), { tone: 'hi', crease: 'none' }));
		out.push(L(k.ring(155, 38, 1.4, 1.8, P, 10), { tone: 'lo' }));
		return out.join('');
	}

	function easel() {
		const out: string[] = [];
		const ledge: Plan = { x: -152, y: -14, w: 50, d: 12, r: 1.5 };
		const card: Plan = { x: -146, y: -10, w: 38, d: 1.6, r: 0.5 };
		const front = card.y + card.d;
		out.push(halo(ledge, 0, 14, 3));
		for (const x of [-150, -108]) out.push(S(k.slabOf({ x, y: -12, w: 5, d: 5, r: 1 }, 0, 80, P, 3, 0.4), { tone: 'mid' }));
		out.push(S(k.slabOf({ x: -152, y: -12.5, w: 50, d: 3, r: 0.8 }, 62, 3, P, 3, 0.4), { tone: 'mid' }));
		out.push(S(k.slabOf(ledge, 12, 3, P, 3, 0.5), { tone: 'mid' }));
		out.push(S(k.slabOf(card, 15, 44, P, 2, 0.3), { tone: 'hi' }));
		const cx = card.x + card.w / 2;
		out.push(L(k.sideRing([cx, front, 46], 8, 'y', P, 28), { tone: 'mid' }));
		out.push(L(k.segment([cx - 3, front, 37], [cx + 3, front, 37], P) + k.segment([cx - 2.5, front, 34], [cx + 2.5, front, 34], P), { tone: 'mid' }));
		out.push(L(k.segment([cx - 3, front, 41], [cx - 1.5, front, 45], P) + k.segment([cx + 3, front, 41], [cx + 1.5, front, 45], P) + k.segment([cx - 1.5, front, 45], [cx + 1.5, front, 45], P), { tone: 'lo' }));
		for (const [dx, dz] of [[-12, 0], [12, 0], [0, 12], [-9, 9], [9, 9]] as const) {
			const sx = dx === 0 ? 0 : Math.sign(dx);
			const sz = dz === 0 ? 0 : dz === 12 ? 1 : 0.7;
			out.push(L(k.segment([cx + dx * 0.8, front, 46 + dz * 0.75], [cx + dx * 0.8 + sx * 3, front, 46 + dz * 0.75 + sz * 3], P), { tone: 'lo' }));
		}
		out.push(L(k.segment([card.x + 3, front, 21], [card.x + 22, front, 21], P) + k.segment([card.x + 3, front, 24], [card.x + 14, front, 24], P), { tone: 'faint' }));
		out.push(D([at([card.x + 3, front, 56]), at([card.x + card.w - 3, front, 56]), at([card.x + 3, front, 18]), at([card.x + card.w - 3, front, 18])], { size: 0.4 }));
		out.push(S(k.slabOf({ x: -128, y: -1, w: 16, d: 2.4, r: 1 }, 15, 2.4, P, 3), { tone: 'hi', crease: 'none' }));
		out.push(L(rectY(front, card.x + 2, card.x + card.w - 2, 17, 57), { tone: 'faint' }));
		for (const x of [card.x + 1, card.x + card.w - 7]) out.push(S(k.slabOf({ x, y: card.y - 0.2, w: 6, d: 2, r: 0.3 }, 17.5, 0.5, P, 2), { tone: 'lo', crease: 'none' }), S(k.slabOf({ x, y: card.y - 0.2, w: 6, d: 2, r: 0.3 }, 55.5, 0.5, P, 2), { tone: 'lo', crease: 'none' }));
		for (const x of [-150, -108]) out.push(S(k.cylinder(x + 2.5, -9.5, 3.4, -0.1, 1.2, P, 14), { tone: 'lo' }), S(k.cylinder(x + 2.5, -9.5, 1.8, 80, 2, P, 12, 0.3), { tone: 'hi' }));
		out.push(L(k.sideSeam({ x: -150, y: -12, w: 5, d: 5, r: 1 }, 40, P, 3) + k.sideSeam({ x: -108, y: -12, w: 5, d: 5, r: 1 }, 40, P, 3), { tone: 'faint' }));
		out.push(D([at([-147.5, -7, 74]), at([-105.5, -7, 74]), at([-147.5, -7, 8]), at([-105.5, -7, 8]), at([-140, -11, 65]), at([-114, -11, 65]), at([cx, -11, 65])], { size: 0.4 }));
		return out.join('');
	}

	function sheet() {
		const sh: Plan = { x: -84, y: -64, w: 74, d: 46, r: 1.5 };
		const t = 0.8;
		const out = [halo(sh, 0, t, 2), S(k.slabOf(sh, 0, t, P, 3, 0.2), { tone: 'hi' })];
		out.push(L(k.planOutline(k.insetPlan(sh, 4), t, P), { tone: 'faint' }));
		out.push(L(k.planOutline({ x: -66, y: -52, w: 40, d: 18, r: 0 }, t, P, 1), { tone: 'mid' }));
		out.push(L(k.planOutline({ x: -60, y: -48, w: 10, d: 10, r: 0 }, t, P, 1) + k.planOutline({ x: -42, y: -48, w: 12, d: 10, r: 0 }, t, P, 1), { tone: 'lo' }));
		out.push(L(k.lineOnTop([-66, -28], [-26, -28], t, P) + k.lineOnTop([-66, -30.5], [-66, -25.5], t, P) + k.lineOnTop([-26, -30.5], [-26, -25.5], t, P), { tone: 'lo' }));
		out.push(L(k.lineOnTop([-18, -52], [-18, -34], t, P) + k.lineOnTop([-20.5, -52], [-15.5, -52], t, P) + k.lineOnTop([-20.5, -34], [-15.5, -34], t, P), { tone: 'lo' }));
		out.push(D([at([-80, -60, t]), at([-14, -60, t]), at([-80, -22, t]), at([-14, -22, t])], { size: 0.45 }));
		out.push(L(k.ring(-52, -27, 5, t, P, 22), { tone: 'lo' }), L(k.lineOnTop([-57, -27], [-47, -27], t, P) + k.lineOnTop([-52, -32], [-52, -22], t, P), { tone: 'faint' }));
		out.push(L(k.planOutline({ x: -78, y: -26, w: 12, d: 6, r: 0 }, t, P, 1) + k.lineOnTop([-78, -23], [-66, -23], t, P), { tone: 'lo' }));
		out.push(L(k.lineOnTop([-60, -43], [-30, -43], t, P) + k.lineOnTop([-60, -40], [-38, -40], t, P), { tone: 'faint', free: true }));
		out.push(S(k.slabOf({ x: -12, y: -46, w: 6, d: 8, r: 0.6 }, t, 0.5, P, 2), { tone: 'mid', crease: 'none' }), D([at([-9, -42, t + 0.5])], { size: 0.4 }));
		out.push(S(k.slabOf({ x: -88, y: -66, w: 8, d: 2.4, r: 0.4 }, t, 0.4, P, 2), { tone: 'lo', crease: 'none' }), S(k.slabOf({ x: -88, y: -21, w: 8, d: 2.4, r: 0.4 }, t, 0.4, P, 2), { tone: 'lo', crease: 'none' }));
		return stepSvg('show-from', 2, out.join(''));
	}

	function rulerAndPencil() {
		const ruler: Plan = { x: -86, y: -14, w: 78, d: 7, r: 0.8 };
		const out = [halo(ruler, 0, 1.6, 2), S(k.slabOf(ruler, 0, 1.6, P, 3, 0.3), { tone: 'hi' })];
		const ticks = k.topTicks(ruler.x + 3, ruler.x + ruler.w - 3, 3, 5, ruler.y + 0.8, 1.6, [1.6, 3], P);
		out.push(L(ticks.minor, { tone: 'lo' }), L(ticks.major, { tone: 'mid' }));
		out.push(halo({ x: -44, y: -3, w: 34, d: 4, r: 1.5 }, 0, 3, 2));
		out.push(S(k.slabOf({ x: -44, y: -3, w: 26, d: 4, r: 1.2 }, 0, 3, P, 3, 0.4), { tone: 'hi' }));
		out.push(S(k.slabOf({ x: -18, y: -2.4, w: 7, d: 2.8, r: 1 }, 0, 2.4, P, 3), { tone: 'mid', crease: 'none' }));
		out.push(L(k.lineOnTop([-40, -1], [-22, -1], 3, P), { tone: 'faint' }));
		out.push(L(k.ring(ruler.x + ruler.w - 4, ruler.y + 3.5, 1.4, 1.6, P, 10), { tone: 'lo' }), D([at([ruler.x + 2, ruler.y + 3.5, 1.6]), at([ruler.x + ruler.w - 4, ruler.y + 3.5, 1.6])], { size: 0.4 }));
		out.push(S(k.slabOf({ x: -26, y: -2.6, w: 6, d: 3.2, r: 0.8 }, 3, 0.8, P, 3), { tone: 'lo', crease: 'none' }));
		const sh: Plan = { x: -4, y: -6, w: 12, d: 10, r: 1.5 };
		out.push(halo(sh, 0, 2.4, 2), S(k.slabOf(sh, 0, 2.4, P, 4, 0.4), { tone: 'mid', inner: L(k.sideSeam(sh, 1.2, P, 4), { tone: 'faint' }) }), L(k.ring(2, -1, 2, 2.4, P, 14), { tone: 'lo' }), D([at([2, -1, 2.4])], { size: 0.6, tone: 'lo' }));
		return out.join('');
	}

	const tw = {
		back: { x: TRAY.x, y: TRAY.y, w: TRAY.w, d: WALL, r: 1 },
		left: { x: TRAY.x, y: TRAY.y + WALL, w: WALL, d: TRAY.d - WALL * 2, r: 1 },
		right: { x: TRAY.x + TRAY.w - WALL, y: TRAY.y + WALL, w: WALL, d: TRAY.d - WALL * 2, r: 1 },
		front: { x: TRAY.x, y: TRAY.y + TRAY.d - WALL, w: TRAY.w, d: WALL, r: 1 },
	} satisfies Record<string, Plan>;
	const wall = (plan: Plan) => S(k.slabOf(plan, TRAY_Z, WALL_TOP - TRAY_Z, P, 3, 0.5), { tone: 'mid' });

	function trayBack() {
		const out = [halo(TRAY, 0, 2, 5), S(k.slabOf(TRAY, 0, TRAY_Z, P, 6, 0.6), { tone: 'mid' })];
		out.push(wall(tw.back), wall(tw.left), wall(tw.right));
		out.push(D([at([TRAY.x + 6, TRAY.y + 2, WALL_TOP]), at([TRAY.x + TRAY.w - 6, TRAY.y + 2, WALL_TOP])], { size: 0.45 }));
		out.push(L(k.planOutline(k.insetPlan(TRAY, 6), TRAY_Z, P), { tone: 'faint' }));
		out.push(L(k.planOutline({ x: -90, y: 47, w: 20, d: 5, r: 0.6 }, TRAY_Z, P, 2) + k.planOutline({ x: -71, y: 19, w: 38, d: 18, r: 0.8 }, TRAY_Z, P, 2) + k.planOutline({ x: -36, y: 40, w: 24, d: 12, r: 1 }, TRAY_Z, P, 2), { tone: 'faint' }));
		out.push(L(k.sideSeam(tw.back, 7, P, 2) + k.sideSeam(tw.right, 7, P, 2), { tone: 'faint' }));
		const rx = TRAY.x + TRAY.w;
		out.push(L(rectX(rx, TRAY.y + 22, TRAY.y + 40, 5, 8.4), { tone: 'lo' }));
		out.push(D([at([rx, TRAY.y + 10, 6]), at([rx, TRAY.y + 46, 6]), at([TRAY.x + 12, TRAY.y, TRAY_Z]), at([TRAY.x + TRAY.w - 12, TRAY.y, TRAY_Z])], { size: 0.4 }));
		out.push(L(k.ring(TRAY.x + 8, TRAY.y + 8, 1.8, TRAY_Z, P, 10) + k.ring(TRAY.x + TRAY.w - 8, TRAY.y + 8, 1.8, TRAY_Z, P, 10), { tone: 'lo' }), D([at([TRAY.x + 8, TRAY.y + 8, TRAY_Z]), at([TRAY.x + TRAY.w - 8, TRAY.y + 8, TRAY_Z])], { size: 0.4 }));
		return out.join('');
	}
	function trayFront() {
		const pull: Plan = { x: TRAY.x + TRAY.w / 2 - 12, y: tw.front.y + WALL, w: 24, d: 3, r: 1.2 };
		return wall(tw.front) + S(k.slabOf(pull, 4, 4, P, 3, 0.4), { tone: 'mid' }) + D([at([pull.x + 3, pull.y + 3, 6]), at([pull.x + pull.w - 3, pull.y + 3, 6])], { size: 0.4 });
	}

	function leftovers() {
		const out: string[] = [];
		for (const [x, y] of [[-14, 20], [-14, 32]] as const) {
			out.push(S(k.cylinder(x, y, 3.2, TRAY_Z, 2.4, P, 6), { tone: 'hi' }));
			out.push(S(k.cylinder(x, y, 1.1, TRAY_Z + 2.4, 3, P, 12), { tone: 'mid' }));
		}
		for (const y of [16, 22]) out.push(S(k.slabOf({ x: -88, y, w: 18, d: 3.4, r: 0.6 }, TRAY_Z, 2, P, 2), { tone: 'hi' }));
		for (const x of [-66, -12]) out.push(S(k.cylinder(x, 55, 1.8, TRAY_Z, 1.4, P, 8), { tone: 'hi' }), L(k.ring(x, 55, 1, TRAY_Z + 1.4, P, 8), { tone: 'lo' }));
		out.push(S(k.slabOf({ x: -52, y: 53.4, w: 10, d: 2.6, r: 0.5 }, TRAY_Z, 1.2, P, 2), { tone: 'mid', crease: 'none' }), D([at([-48, 54.7, TRAY_Z + 1.2])], { size: 0.4 }));
		return stepSvg('dim-from', 3, out.join(''));
	}

	function props() {
		const out = [halo({ x: 100, y: 14, w: 22, d: 22, r: 11 }, 0, 18, 3)];
		out.push(S(k.cylinder(111, 25, 10, 0, 18, P, 36, 0.8), { tone: 'mid' }));
		out.push(L(k.ring(111, 25, 7, 18, P, 28), { tone: 'lo' }));
		out.push(L(k.knurl(111, 25, 10, 2, 16, 36, P, 0.3), { tone: 'faint' }));
		out.push(S(k.cylinder(111, 25, 2.4, 18, 3, P, 14), { tone: 'hi' }));
		for (let i = 0; i < 3; i++) out.push(S(k.slabOf({ x: 128 - i * 1.5, y: 8 + i * 0.6, w: 34, d: 11, r: 0.8 }, i * 3.2, 3.2, P, 2, 0.3), { tone: i % 2 ? 'hi' : 'mid' }));
		out.push(D([at([111, 25, 21])], { size: 0.4, tone: 'hi' }));
		out.push(L(k.ring(111, 25, 9.6, 14, P, 36) + k.ring(111, 25, 9.6, 4, P, 36), { tone: 'lo' }), D([at([111, 35, 9]), at([102.6, 30, 9]), at([119.4, 30, 9])], { size: 0.45 }));
		out.push(S(k.slabOf({ x: 107, y: 14, w: 8, d: 2, r: 0.5 }, 0.5, 6, P, 2), { tone: 'hi', crease: 'none' }));
		for (let i = 0; i < 3; i++) out.push(L(k.sideSeam({ x: 128 - i * 1.5, y: 8 + i * 0.6, w: 34, d: 11, r: 0.8 }, i * 3.2 + 1.6, P, 2), { tone: 'faint' }));
		out.push(S(k.slabOf({ x: 134, y: 12, w: 14, d: 4, r: 0.6 }, 9.6, 0.8, P, 2, 0.2), { tone: 'lo', crease: 'none' }), D([at([136, 14, 10.4]), at([146, 14, 10.4])], { size: 0.35 }));
		return out.join('');
	}

	function shop() {
		const out = [halo(SILL, 0, SILL_H)];
		out.push(S(k.slabOf(SILL, 0, SILL_H, P, 3, 0.6), { tone: 'mid' }));
		out.push(S(k.slabOf({ x: SILL.x + 6, y: SILL.y + 2, w: SILL.w - 12, d: 4, r: 0.6 }, SILL_H, SHOP_TOP - SILL_H, P, 2), { tone: 'lo', crease: 'none' }));
		const bay: Plan = { x: SILL.x + 10, y: PANE.y, w: 26, d: 2, r: 0.4 };
		out.push(S(k.slabOf(bay, SILL_H, 44, P, 2), { tone: 'mid' }));
		const bf = bay.y + bay.d;
		for (let z = SILL_H + 6; z < SILL_H + 44; z += 6) out.push(L(k.segment([bay.x + 1, bf, z], [bay.x + bay.w - 1, bf, z], P), { tone: 'faint' }));
		out.push(stepSvg('lit-at', 4, S(k.slabOf(PANE, 18, 28, P, 2), { tone: 'hi', lit: true })));
		const mid = PANE.x + PANE.w / 2;
		out.push(L(k.segment([mid, PANE.y + 2, 18], [mid, PANE.y + 2, 46], P) + k.segment([PANE.x, PANE.y + 2, 32], [PANE.x + PANE.w, PANE.y + 2, 32], P), { tone: 'mid' }));
		for (const x of [SILL.x + 2, SILL.x + SILL.w - 10]) out.push(S(k.slabOf({ x, y: SILL.y + 4, w: 8, d: 8, r: 1 }, SILL_H, SHOP_TOP - SILL_H, P, 3, 0.4), { tone: 'mid' }));
		out.push(S(k.slabOf({ x: SILL.x, y: SILL.y + 2, w: SILL.w, d: 12, r: 1 }, SHOP_TOP - 10, 10, P, 3, 0.5), { tone: 'mid' }));
		const hy = SILL.y + 14;
		out.push(L(seg([SILL.x + 4, hy, 52], [SILL.x + SILL.w - 4, hy, 52]) + seg([SILL.x + 4, hy, 58], [SILL.x + SILL.w - 4, hy, 58]), { tone: 'faint' }));
		out.push(D(Array.from({ length: 8 }, (_, i) => at([SILL.x + 8 + i * 10.5, hy, 55])), { size: 0.4 }));
		const sf = SILL.y + SILL.d;
		out.push(L(rectY(sf, SILL.x + 8, SILL.x + 38, 1.4, 4.6) + rectY(sf, SILL.x + 50, SILL.x + 80, 1.4, 4.6), { tone: 'faint' }), D([at([SILL.x + 4, sf, 3]), at([SILL.x + SILL.w - 4, sf, 3]), at([SILL.x + 44, sf, 3])], { size: 0.45 }));
		out.push(D(k.corners(SILL, 3).map(([x, y]) => at([x, y, SILL_H])), { size: 0.4 }));
		out.push(S(k.slabOf({ x: SILL.x + 6, y: -48, w: 20, d: 2.6, r: 0.4 }, 24, 1.2, P, 2, 0.2), { tone: 'hi' }), S(k.slabOf({ x: SILL.x + 6, y: -48, w: 20, d: 2.6, r: 0.4 }, 36, 1.2, P, 2, 0.2), { tone: 'hi' }));
		for (const [z, xs] of [[25.2, [64, 69, 75]], [37.2, [66, 72]]] as const) for (const x of xs) out.push(S(k.cylinder(x, -46.7, 1.9, z, 5, P, 12, 0.3), { tone: 'lo' }), S(k.cylinder(x, -46.7, 1.1, z + 5, 1, P, 8), { tone: 'mid' }));
		out.push(S(k.slabOf({ x: 108, y: -50, w: 28, d: 4, r: 0.6 }, 15.6, 2.4, P, 2, 0.3), { tone: 'hi' }), L(rectY(-46, 109, 135, 16, 17.4), { tone: 'faint' }));
		out.push(L(rectY(PANE.y + 2, PANE.x - 1.6, PANE.x + PANE.w + 1.6, 16.6, 47.6), { tone: 'lo' }));
		out.push(S(k.slabOf({ x: 84, y: -43, w: 20, d: 10, r: 1.5 }, SILL_H, 0.7, P, 3, 0.2), { tone: 'lo' }), L(k.lineOnTop([86, -40.5], [102, -40.5], SILL_H + 0.7, P) + k.lineOnTop([86, -37.5], [102, -37.5], SILL_H + 0.7, P), { tone: 'faint' }), D([at([86, -41.5, SILL_H + 0.7]), at([102, -34.5, SILL_H + 0.7])], { size: 0.35 }));
		out.push(S(k.slabOf({ x: SILL.x + 28, y: SILL.y + 3, w: 32, d: 2, r: 0.4 }, SHOP_TOP, 9, P, 2, 0.3), { tone: 'hi' }), S(k.slabOf({ x: SILL.x + 28, y: SILL.y + 3, w: 32, d: 2, r: 0.4 }, SHOP_TOP + 9, 1.2, P, 2, 0.2), { tone: 'mid', crease: 'none' }));
		out.push(L(rectY(SILL.y + 5, SILL.x + 31, SILL.x + 57, SHOP_TOP + 2, SHOP_TOP + 7), { tone: 'lo' }), D([at([SILL.x + 31, SILL.y + 5, SHOP_TOP + 4.5]), at([SILL.x + 57, SILL.y + 5, SHOP_TOP + 4.5])], { size: 0.4 }));
		return out.join('');
	}

	function door([cx, cy, z]: Point3) {
		const f = cy + 1.5;
		const out = [halo({ x: cx - 12, y: cy - 6, w: 24, d: 12, r: 4 }, z, 0.1, 3)];
		out.push(S(k.slabOf({ x: cx - 8, y: cy - 1.5, w: 16, d: 3, r: 0.5 }, z, DOOR_H, P, 2, 0.4), { tone: 'hi' }));
		const top = z + DOOR_H - 4;
		out.push(L(k.segment([cx - 5, f, z + 4], [cx - 5, f, top], P) + k.segment([cx + 5, f, z + 4], [cx + 5, f, top], P) + k.segment([cx - 5, f, top], [cx + 5, f, top], P) + k.segment([cx - 5, f, z + 4], [cx + 5, f, z + 4], P), { tone: 'mid' }));
		out.push(L(k.segment([cx - 5, f, z + 20], [cx + 5, f, z + 20], P), { tone: 'faint' }));
		out.push(S(k.cylinder(cx + 5.5, f + 0.5, 1.3, z + 18, 0.8, P, 10), { tone: 'mid' }));
		out.push(S(k.slabOf({ x: cx - 8.8, y: cy - 1.5, w: 1.4, d: 3.8, r: 0.3 }, z + 7, 3, P, 2), { tone: 'lo', crease: 'none' }), S(k.slabOf({ x: cx - 8.8, y: cy - 1.5, w: 1.4, d: 3.8, r: 0.3 }, z + 28, 3, P, 2), { tone: 'lo', crease: 'none' }));
		out.push(L(k.sideRing([cx, f, z + 29], 2.6, 'y', P, 16) + seg([cx - 3.4, f, z + 12], [cx + 3.4, f, z + 12]) + seg([cx - 3.4, f, z + 8], [cx + 3.4, f, z + 8]), { tone: 'lo' }), D([at([cx - 6.5, f, z + 2]), at([cx + 6.5, f, z + 2]), at([cx, f, z + 29])], { size: 0.4 }));
		out.push(L(rectY(f, cx - 7, cx + 7, z + 1, z + 3), { tone: 'faint' }));
		return out.join('');
	}
	function canopy([cx, cy, z]: Point3) {
		const plan: Plan = { x: cx - 18, y: cy - 8, w: 36, d: 16, r: 1.5 };
		const out = [halo(plan, z, 0.1, 3), S(k.slabOf(plan, z, 4, P, 3, 0.6), { tone: 'hi' })];
		for (let x = plan.x + 6; x < plan.x + plan.w - 3; x += 6) out.push(L(k.lineOnTop([x, plan.y + 1], [x, plan.y + plan.d - 1], z + 4, P), { tone: 'faint' }));
		const cf = plan.y + plan.d;
		for (let x = plan.x + 6; x < plan.x + plan.w - 3; x += 6) out.push(L(seg([x, cf, z], [x, cf, z + 4]), { tone: 'faint' }));
		out.push(L(k.sideSeam(plan, z + 1.4, P, 3), { tone: 'lo' }), D([at([plan.x + 2.5, cf, z + 2]), at([plan.x + plan.w - 2.5, cf, z + 2])], { size: 0.4 }));
		out.push(L(k.planOutline(k.insetPlan(plan, 1), z + 4, P), { tone: 'lo' }));
		return out.join('');
	}
	function planter([cx, cy, z]: Point3) {
		const plan: Plan = { x: cx - 10, y: cy - 4.5, w: 20, d: 9, r: 1.2 };
		const out = [halo(plan, z, 0.1, 3), S(k.slabOf(plan, z, 7, P, 3, 0.5), { tone: 'hi' })];
		out.push(L(k.sideSeam(plan, z + 3.5, P), { tone: 'faint' }));
		for (const dx of [-5, 0, 5]) {
			const h = dx === 0 ? 16 : 13;
			out.push(L(k.segment([cx + dx, cy, z + 7], [cx + dx, cy, z + h], P), { tone: 'mid' }));
			out.push(S(k.cylinder(cx + dx, cy, 2.6, z + h - 1, 1, P, 10), { tone: 'hi' }));
			out.push(S(k.cylinder(cx + dx + (dx || 3) * 0.5, cy, 1.1, z + 7, 4 + (dx ? 0 : 3), P, 8), { tone: 'mid', crease: 'none' }));
		}
		const pf = plan.y + plan.d;
		out.push(L(k.lineOnTop([cx - 8.5, cy - 3.5], [cx + 8.5, cy - 3.5], z + 7, P) + k.lineOnTop([cx - 8.5, cy + 3.5], [cx + 8.5, cy + 3.5], z + 7, P), { tone: 'lo' }));
		out.push(L(rectY(pf, cx - 6, cx + 6, z + 1.2, z + 2.6), { tone: 'faint' }), D([at([cx - 8, pf, z + 5]), at([cx + 8, pf, z + 5])], { size: 0.4 }));
		return out.join('');
	}
	const draw = { door, canopy, planter };

	const transforms = transformsFrom(P, Object.fromEntries(MOVERS.map((m) => [m.name, [1, 2, 3, 4].map((s) => poseAt(s)[m.name])])));
	const mover = (m: Mover) => moverSvg(m.name, transforms[m.name][3], draw[m.name](m.from));

	const svg = k.figureSvg({
		width,
		height,
		label:
			'A workbench tells the story of a new idea. A sketch of a lightbulb sits on an easel, a plan of a shop is drawn on a sheet beside a ruler, and a door, a canopy and a planter lift out of a tray of ready-made parts and are fitted onto a small shop front, whose window then lights up: open for customers.',
		body: [bench(), lampAndStrip(), clock(), easel(), sheet(), rulerAndPencil(), mat(), mug(), plant(), props(), shop(), trayBack(), leftovers(), ...MOVERS.map(mover), trayFront(), pencilCase(), receiptsAndTags()],
	});
	return { svg, labels: LABELS, transforms };
}
