import * as k from '../../lib/anatomy/iso-kit';
import type { Plan, Plane, Point3 } from '../../lib/anatomy/iso-kit';
import { moverSvg, stepSvg, transformsFrom, type Machine } from '../../lib/plate';

export const LABELS = ['paper and spreadsheets', 'fed in', 'sorted into your app', 'nothing lost'] as const;
export const CAPTION = 'Already running on paper, spreadsheets or an old system? We move everything across so nothing is lost.';

const BENCH: Plan = { x: -175, y: -82, w: 350, d: 164, r: 8 };
const BENCH_H = 12;
const FOOT_H = 6;

const ROWS = [-20, 0, 20];
const PILE_X = -135;
const TABLE_TOP = 26.5;
const PILE_TOP = TABLE_TOP + 4.8;
const LIFT = 15;

const BAR_X = -42;
const NIP: Point3[] = ROWS.map((y) => [-37, y, 17 + LIFT + 0.5]);

const CAB: Plan = { x: 28, y: -32, w: 30, d: 64, r: 2 };
const CAB_H = 30;
const FLOOR = 1.5;
const TRAY_TOP = CAB_H + FLOOR;
const TRAY_X = 29;
const TRAY_W = 28;

const NAMES = ['paper', 'sheet', 'ledger'] as const;
type Name = (typeof NAMES)[number];
interface Mover {
	name: Name;
	from: Point3;
	nip: Point3;
	to: Point3;
}
const ORDER: Name[] = ['paper', 'ledger', 'sheet'];
export const MOVERS: Mover[] = ORDER.map((name, i) => ({
	name,
	from: [PILE_X, ROWS[i], PILE_TOP],
	nip: NIP[i],
	to: [CAB.x + CAB.w / 2, ROWS[i], TRAY_TOP],
}));

function offsets(m: Mover): Point3[] {
	const d = (a: Point3, b: Point3): Point3 => [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
	return [[0, 0, 0], d(m.from, m.nip), d(m.from, m.to), d(m.from, m.to)];
}

export function moveOver(width = 720, height = 480): Machine {
	const P = k.fitProjection(
		[...k.boxCorners(BENCH, -BENCH_H - FOOT_H, 0), [-40, -38, 56], [30, -62, 56], [-150, -78, 22], [CAB.x, CAB.y, TRAY_TOP + 8], [100, -30, 56], [PILE_X, 20, TABLE_TOP + 8]],
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
		out.push(L([-120, 0, 120].map((x) => k.ring(x, 76, 2, 0, P, 14)).join(''), { tone: 'lo' }), dotsAt([-120, 0, 120].map((x) => [x, 76, 0] as Point3), 0.45));
		out.push(L(k.planOutline({ x: 110, y: 40, w: 56, d: 28, r: 2 }, 0, P), { tone: 'faint' }));
		return out.join('');
	}

	function feeder() {
		const t: Plan = { x: -158, y: -36, w: 70, d: 72, r: 3 };
		const out = [halo(t, 0, TABLE_TOP, 3)];
		const legs = byDepth(k.corners(t, 6));
		for (const [x, y] of legs) out.push(S(k.cylinder(x, y, 2.6, 0, TABLE_TOP - 2.5, P, 14), { tone: 'mid' }), S(k.cylinder(x, y, 3.6, 0, 1.4, P, 14), { tone: 'lo' }));
		const rail = (plan: Plan) => S(k.slabOf(plan, 9, 2.6, P, 2, 0.3), { tone: 'lo' });
		out.push(rail({ x: t.x + 6, y: t.y + 5.4, w: t.w - 12, d: 1.6, r: 0.4 }), rail({ x: t.x + 6, y: t.y + t.d - 7, w: t.w - 12, d: 1.6, r: 0.4 }), rail({ x: t.x + 5.4, y: t.y + 6, w: 1.6, d: t.d - 12, r: 0.4 }), rail({ x: t.x + t.w - 7, y: t.y + 6, w: 1.6, d: t.d - 12, r: 0.4 }));
		out.push(S(k.slabOf(t, TABLE_TOP - 2.5, 2.5, P, 6, 0.6), { tone: 'mid', inner: L(k.sideSeam(t, TABLE_TOP - 1.25, P, 6), { tone: 'faint' }) }));
		out.push(L(k.planOutline(k.insetPlan(t, 3), TABLE_TOP, P, 6), { tone: 'faint' }));
		out.push(D(k.corners(t, 3).map(([x, y]) => at([x, y, TABLE_TOP])), { size: 0.45 }));
		const fy = t.y + t.d;
		out.push(L(rectY(fy, t.x + 20, t.x + 50, TABLE_TOP - 2, TABLE_TOP - 0.6), { tone: 'lo' }), dotsAt([[t.x + 6, fy, TABLE_TOP - 1.2], [t.x + t.w - 6, fy, TABLE_TOP - 1.2]], 0.4));
		const rx = t.x + t.w;
		out.push(L(rectX(rx, t.y + 20, t.y + 52, TABLE_TOP - 2, TABLE_TOP - 0.6), { tone: 'lo' }));
		out.push(S(k.slabOf({ x: t.x + 4, y: -34, w: 4, d: 68, r: 1 }, TABLE_TOP, 2.2, P, 3, 0.4), { tone: 'mid' }), S(k.slabOf({ x: t.x + 4.8, y: -4, w: 2.4, d: 8, r: 0.6 }, TABLE_TOP + 2.2, 0.8, P, 2), { tone: 'hi', crease: 'none' }));
		return out.join('');
	}

	function piles() {
		const out: string[] = [];
		ROWS.forEach((y, i) => {
			const base: Plan = { x: PILE_X - 12, y: y - 8, w: 24, d: 16, r: 0.6 };
			out.push(halo(base, TABLE_TOP, 4.8, 2));
			for (let n = 0; n < 3; n++) {
				const j = [0.8, -0.6, 0.4][(n + i) % 3];
				out.push(S(k.slabOf({ ...base, x: base.x + j, y: base.y - j * 0.6 }, TABLE_TOP + n * 1.6, 1.6, P, 2, 0.2), { tone: n % 2 ? 'hi' : 'mid', crease: 'none' }));
			}
		});
		return out.join('');
	}

	const LO = 8 + LIFT;
	const HI = 20 + LIFT;
	const POST_H = 31 + LIFT;
	const roller = () => ({ x: BAR_X, y: -32, w: 10, d: 64, r: 4.8 }) satisfies Plan;
	function pressBack() {
		const base: Plan = { x: -54, y: -40, w: 34, d: 80, r: 3 };
		const out = [halo(base, 0, 3, 3)];
		out.push(S(k.slabOf(base, 0, 3, P, 4, 0.6), { tone: 'mid', inner: L(k.sideSeam(base, 1.5, P, 4), { tone: 'faint' }) }));
		out.push(L(k.planOutline(k.insetPlan(base, 3), 3, P, 4), { tone: 'faint' }));
		out.push(D(k.corners(base, 3).map(([x, y]) => at([x, y, 3])), { size: 0.45 }));
		for (const y of [-31.6, 30]) out.push(S(k.slabOf({ x: -50, y, w: 26, d: 1.6, r: 0.4 }, 3, 2.4, P, 2, 0.2), { tone: 'lo', crease: 'none' }));
		const post: Plan = { x: BAR_X - 4, y: -38, w: 18, d: 6, r: 1.5 };
		out.push(S(k.slabOf(post, 3, POST_H, P, 3, 0.5), { tone: 'mid', inner: L(k.sideSeam(post, 3 + POST_H / 2, P, 3), { tone: 'faint' }) }));
		out.push(D([at([BAR_X + 5, -35, 3 + POST_H]), at([-50, -34, 3]), at([-24, -34, 3])], { size: 0.4 }));
		out.push(S(k.cylinder(BAR_X + 5, -35, 3.6, 3 + POST_H, 3, P, 18, 0.4), { tone: 'hi' }), L(k.knurl(BAR_X + 5, -35, 3.6, 3 + POST_H, 6 + POST_H, 12, P, 0.3), { tone: 'lo' }));
		out.push(S(k.slabOf(roller(), LO, 7, P, 6, 0.8), { tone: 'hi' }));
		out.push(L(k.lineOnTop([BAR_X + 5, -30], [BAR_X + 5, 30], LO + 7, P), { tone: 'faint' }));
		let marks = '';
		for (let y = -26; y <= 26; y += 8) marks += k.lineOnTop([BAR_X, y], [BAR_X + 10, y], LO + 7, P);
		out.push(L(marks, { tone: 'lo' }));
		out.push(D([at([-30, -34, 18]), at([-26, -34, 36])], { size: 0.4 }));
		return out.join('');
	}
	function pressFront() {
		const out = [S(k.slabOf(roller(), HI, 7, P, 6, 0.8), { tone: 'hi' })];
		out.push(L(k.lineOnTop([BAR_X + 5, -30], [BAR_X + 5, 30], HI + 7, P), { tone: 'faint' }));
		let marks = '';
		for (let y = -26; y <= 26; y += 8) marks += k.lineOnTop([BAR_X, y], [BAR_X + 10, y], HI + 7, P);
		out.push(L(marks, { tone: 'lo' }));
		const blk: Plan = { x: BAR_X - 4, y: 32, w: 18, d: 6, r: 1.5 };
		out.push(S(k.slabOf(blk, 3, POST_H, P, 3, 0.5), { tone: 'mid', inner: L(k.sideSeam(blk, 3 + POST_H / 2, P, 3), { tone: 'faint' }) }));
		const f = blk.y + blk.d;
		const gz = 17.5 + LIFT;
		out.push(L(k.sideRing([BAR_X + 5, f, 11.5 + LIFT], 4.2, 'y', P, 20) + k.sideRing([BAR_X + 5, f, 23.5 + LIFT], 4.2, 'y', P, 20), { tone: 'lo' }));
		out.push(L(k.sideRing([BAR_X + 5, f + 0.2, gz], 9, 'y', P, 28), { tone: 'mid' }));
		out.push(L(seg([BAR_X + 5, f, gz], [BAR_X + 5 + 9, f, gz]) + seg([BAR_X + 5, f, gz], [BAR_X + 5 - 5, f, gz + 7.8]) + seg([BAR_X + 5, f, gz], [BAR_X + 5 - 5, f, gz - 7.8]), { tone: 'lo' }));
		out.push(S(k.cylinder(BAR_X + 14, f + 1.5, 1.8, gz - 0.5, 1, P, 10), { tone: 'hi' }));
		out.push(D([at([BAR_X + 5, f, gz]), at([BAR_X + 5, f, 30 + LIFT]), at([BAR_X - 2, f + 1, 6]), at([BAR_X + 12, f + 1, 6]), at([BAR_X - 2, f, 3 + POST_H - 3]), at([BAR_X + 12, f, 3 + POST_H - 3])], { size: 0.5 }));
		out.push(S(k.cylinder(BAR_X + 5, 35, 3.6, 3 + POST_H, 3, P, 18, 0.4), { tone: 'hi' }), L(k.knurl(BAR_X + 5, 35, 3.6, 3 + POST_H, 6 + POST_H, 12, P, 0.3), { tone: 'lo' }));
		out.push(S(k.slabOf({ x: BAR_X - 3, y: f, w: 16, d: 1, r: 0.4 }, 5, 3, P, 2), { tone: 'lo', crease: 'none' }));
		return out.join('');
	}

	function cabinet() {
		const out = [halo(CAB, 0, CAB_H, 3), S(k.slabOf(CAB, 0, CAB_H, P, 3, 0.8), { tone: 'mid' })];
		const fx = CAB.x + CAB.w;
		for (const [z0, z1] of [[2, 10], [11, 19], [20, 28]] as const) {
			out.push(L(seg([fx, CAB.y + 3, z0], [fx, CAB.y + CAB.d - 3, z0]) + seg([fx, CAB.y + 3, z1], [fx, CAB.y + CAB.d - 3, z1]) + seg([fx, CAB.y + 3, z0], [fx, CAB.y + 3, z1]) + seg([fx, CAB.y + CAB.d - 3, z0], [fx, CAB.y + CAB.d - 3, z1]), { tone: 'lo' }));
			out.push(S(k.slabOf({ x: fx, y: -9, w: 1.8, d: 18, r: 0.8 }, (z0 + z1) / 2 - 1, 2, P, 2), { tone: 'hi', crease: 'none' }));
			out.push(S(k.slabOf({ x: fx, y: -23, w: 1, d: 8, r: 0.4 }, z1 - 4, 2.6, P, 2), { tone: 'lo', crease: 'none' }));
		}
		out.push(S(k.slabOf({ x: CAB.x - 1, y: CAB.y - 1, w: CAB.w + 2, d: CAB.d + 2, r: 2 }, CAB_H, FLOOR, P, 3, 0.4), { tone: 'mid' }));
		out.push(D([at([CAB.x + 4, CAB.y + 4, CAB_H + FLOOR]), at([fx - 4, CAB.y + CAB.d - 4, CAB_H + FLOOR])], { size: 0.45 }));
		out.push(L(k.sideSeam({ x: CAB.x - 1, y: CAB.y - 1, w: CAB.w + 2, d: CAB.d + 2, r: 2 }, CAB_H + FLOOR / 2, P, 3), { tone: 'faint' }));
		out.push(L(k.planOutline({ x: CAB.x + 1, y: CAB.y + 1, w: CAB.w - 2, d: CAB.d - 2, r: 1 }, CAB_H + FLOOR, P), { tone: 'faint' }));
		for (const [z0, z1] of [[2, 10], [11, 19], [20, 28]] as const) {
			const lab: Plan = { x: fx, y: 12, w: 0.8, d: 11, r: 0.3 };
			out.push(S(k.slabOf(lab, z1 - 5.4, 3.6, P, 2), { tone: 'lo', crease: 'none' }));
			out.push(L(seg([fx + 0.8, 14, z1 - 3.4], [fx + 0.8, 21, z1 - 3.4]) + seg([fx + 0.8, 14, z1 - 2], [fx + 0.8, 19, z1 - 2]), { tone: 'faint', free: true }));
			out.push(dotsAt([[fx, CAB.y + 4.5, z0 + 1.5], [fx, CAB.y + CAB.d - 4.5, z0 + 1.5]], 0.35));
		}
		out.push(S(k.slabOf({ x: fx, y: -30, w: 1.4, d: 5, r: 0.6 }, 3, 3.4, P, 2), { tone: 'lo', crease: 'none' }), dotsAt([[fx + 1.4, -28, 4.4]], 0.35));
		return out.join('');
	}
	const trayY = (y: number) => y - 9;
	const WT = 1.6;
	const WH = 3.4;
	function trayBack() {
		const out: string[] = [];
		for (const y of ROWS) {
			out.push(L(k.planOutline({ x: TRAY_X + WT, y: trayY(y) + WT, w: TRAY_W - WT * 2, d: 18 - WT * 2, r: 0.4 }, TRAY_TOP, P, 2), { tone: 'faint' }));
			out.push(S(k.slabOf({ x: TRAY_X, y: trayY(y), w: TRAY_W, d: WT, r: 0.4 }, TRAY_TOP, WH, P, 2), { tone: 'mid', crease: 'none' }));
			out.push(D([at([TRAY_X + 6, trayY(y) + WT, TRAY_TOP + 1.7]), at([TRAY_X + TRAY_W - 6, trayY(y) + WT, TRAY_TOP + 1.7])], { size: 0.3 }));
		}
		return out.join('');
	}
	function trayFront() {
		const out: string[] = [];
		for (const y of ROWS) {
			out.push(S(k.slabOf({ x: TRAY_X, y: trayY(y) + 18 - WT, w: TRAY_W, d: WT, r: 0.4 }, TRAY_TOP, WH, P, 2), { tone: 'mid', crease: 'none' }));
			out.push(S(k.slabOf({ x: TRAY_X + TRAY_W - WT, y: trayY(y), w: WT, d: 18, r: 0.4 }, TRAY_TOP, WH, P, 2), { tone: 'mid', crease: 'none' }));
			out.push(D([at([TRAY_X + TRAY_W - WT / 2, trayY(y) + 3, TRAY_TOP + WH]), at([TRAY_X + TRAY_W - WT / 2, trayY(y) + 15, TRAY_TOP + WH])], { size: 0.3 }), S(k.slabOf({ x: TRAY_X + 9, y: trayY(y) + 18, w: 10, d: 0.5, r: 0.1 }, TRAY_TOP + 0.6, 2.2, P, 2), { tone: 'hi', crease: 'none' }), D([at([TRAY_X + 11, trayY(y) + 18.5, TRAY_TOP + 1.7]), at([TRAY_X + 17, trayY(y) + 18.5, TRAY_TOP + 1.7])], { size: 0.3 }));
		}
		return out.join('');
	}

	function tablet() {
		const base: Plan = { x: 96, y: -20, w: 36, d: 40, r: 3 };
		const out: string[] = [];
		out.push(k.wireSvg(at([CAB.x + CAB.w, -27, 4.4]), at([100, -17, 3]), { via: [at([CAB.x + CAB.w + 6, -27, 0.6]), at([98, -27, 0.6]), at([98, -20, 0.6]), at([98, -20, 3])], size: 1 }));
		out.push(halo(base, 0, 3, 3), S(k.slabOf(base, 0, 3, P, 4, 0.6), { tone: 'mid', inner: L(k.sideSeam(base, 1.5, P, 4), { tone: 'faint' }) }));
		out.push(L(k.planOutline(k.insetPlan(base, 3), 3, P, 4), { tone: 'faint' }), D(k.corners(base, 3).map(([x, y]) => at([x, y, 3])), { size: 0.45 }));
		const body: Plan = { x: 108, y: -17, w: 5, d: 34, r: 2 };
		out.push(S(k.slabOf(body, 3, 46, P, 4, 0.6), { tone: 'mid' }));
		const fx = body.x + body.w;
		out.push(L(rectY(base.y + base.d, 100, 128, 0.8, 2.2), { tone: 'lo' }), dotsAt([[100, base.y + base.d, 1.5], [128, base.y + base.d, 1.5]], 0.4));
		out.push(L(rectX(base.x + base.w, -12, 12, 0.8, 2.2), { tone: 'lo' }));
		const screen: Plan = { x: fx, y: -14, w: 0.8, d: 28, r: 1 };
		out.push(L(rectX(fx, -15.6, 15.6, 6.4, 45.6), { tone: 'faint' }));
		out.push(stepSvg('lit-at', 4, S(k.slabOf(screen, 8, 36, P, 2), { tone: 'hi', lit: true })));
		const sx = fx + 0.8;
		for (const z of [18, 27, 36]) {
			out.push(L(seg([sx, -10, z], [sx, 10, z]), { tone: 'mid' }));
			out.push(L(rectX(sx, -13, -10, z - 1.6, z + 1.6) + rectX(sx, 10, 13, z - 1.8, z + 1.8), { tone: 'lo' }));
			out.push(L(seg([sx, -10, z + 1.6], [sx, 4, z + 1.6]), { tone: 'faint' }));
		}
		out.push(L(seg([sx, 0, 12], [sx, 0, 42]), { tone: 'faint' }));
		out.push(D([at([fx, 0, 5.5]), at([fx, 0, 46]), at([fx, -9, 46]), at([fx, 9, 46])], { size: 0.5, tone: 'mid' }));
		out.push(L(seg([fx, -4, 46.6], [fx, 4, 46.6]), { tone: 'lo' }));
		for (const y of [-14, 14]) {
			out.push(S(k.cylinder(100, y, 2, 3, 6, P, 12), { tone: 'lo' }), S(k.cylinder(100, y, 1.2, 9, 1.6, P, 10), { tone: 'mid', crease: 'none' }));
		}
		out.push(S(k.slabOf({ x: 104, y: -15, w: 4, d: 30, r: 1 }, 3, 3.6, P, 3, 0.3), { tone: 'lo' }));
		return out.join('');
	}

	function backRow() {
		const out: string[] = [];
		const strip: Plan = { x: -50, y: -78, w: 44, d: 10, r: 1.5 };
		out.push(halo(strip, 0, 3.6, 2), S(k.slabOf(strip, 0, 3.6, P, 3, 0.6), { tone: 'mid' }));
		out.push(L(k.planOutline(k.insetPlan(strip, 2), 3.6, P), { tone: 'faint' }));
		for (const x of [-30, -18, -6 - 8]) out.push(L(rectY(strip.y + strip.d, x - 3.5, x + 3.5, 0.9, 2.7), { tone: 'lo' }));
		out.push(S(k.slabOf({ x: -14, y: -75, w: 5, d: 4, r: 1 }, 3.6, 1.6, P, 3, 0.3), { tone: 'hi' }), D([at([-46, -74, 3.6]), at([-10, -70, 3.6])], { size: 0.4 }));
		out.push(k.wireSvg(at([-48, -37, 3]), at([-44, strip.y + strip.d, 1.8]), { via: [at([-48, -40, 3]), at([-48, -40.4, 0.6]), at([-44, -66, 0.6])], size: 1 }));
		const [lx, ly] = [30, -62];
		out.push(halo({ x: lx - 8, y: ly - 8, w: 16, d: 16, r: 8 }, 0, 3, 2));
		out.push(S(k.cylinder(lx, ly, 8, 0, 2.4, P, 28, 0.6), { tone: 'mid' }), L(k.ring(lx, ly, 5.6, 2.4, P, 20), { tone: 'lo' }));
		out.push(S(k.cylinder(lx, ly, 1.3, 2.4, 40, P, 12), { tone: 'hi', crease: 'none' }), S(k.cylinder(lx, ly, 2.6, 22, 2, P, 14), { tone: 'mid' }));
		out.push(S(k.cylinder(lx, ly, 8, 42, 9, P, 28, 0.8), { tone: 'hi' }), L(k.sideArc(lx, ly, 8, 46, P, 24), { tone: 'mid' }), L(k.ring(lx, ly, 5, 51, P, 20), { tone: 'lo' }));
		out.push(S(k.cylinder(lx, ly, 2.2, 51, 2.4, P, 12), { tone: 'mid' }), D([at([lx, ly, 53.4]), at([lx, ly, 24])], { size: 0.45, tone: 'hi' }));
		out.push(k.wireSvg(at([lx + 7.6, ly + 1, 0.6]), at([-8, strip.y + strip.d, 1.8]), { via: [at([lx - 4, -66, 0.6]), at([-8, -66, 0.6])], size: 1 }));
		for (let i = 0; i < 3; i++) {
			const tr: Plan = { x: -152, y: -78, w: 38, d: 22, r: 2 };
			out.push(halo(tr, i * 7, 6, 2), S(k.slabOf(tr, i * 7, 6, P, 4, 0.6), { tone: i % 2 ? 'mid' : 'lo', inner: L(k.sideSeam(tr, i * 7 + 3, P, 4), { tone: 'faint' }) }));
			out.push(L(k.planOutline(k.insetPlan(tr, 2.4), i * 7 + 6, P, 4), { tone: 'faint' }), L(rectY(tr.y + tr.d, -140, -126, i * 7 + 1.6, i * 7 + 3.6), { tone: 'lo' }), dotsAt([[-148, tr.y + tr.d, i * 7 + 3], [-118, tr.y + tr.d, i * 7 + 3]], 0.4));
		}
		for (let n = 0; n < 3; n++) out.push(S(k.slabOf({ x: -148 + n * 1.2, y: -74 + n * 1.4, w: 28, d: 16, r: 0.6 }, 20 + n * 0.5, 0.5, P, 2), { tone: n % 2 ? 'mid' : 'hi', crease: 'none' }));
		out.push(L(k.lineOnTop([-144, -68], [-126, -68], 21.6, P) + k.lineOnTop([-144, -65], [-132, -65], 21.6, P), { tone: 'faint', free: true }));
		const [sx, sy] = [-100, -64];
		out.push(halo({ x: sx - 6, y: sy - 6, w: 12, d: 12, r: 6 }, 0, 3, 2), S(k.cylinder(sx, sy, 6, 0, 2, P, 20, 0.5), { tone: 'mid' }), L(k.ring(sx, sy, 4, 2, P, 16), { tone: 'lo' }));
		out.push(S(k.cylinder(sx, sy, 0.8, 2, 24, P, 8), { tone: 'hi', crease: 'none' }));
		for (let i = 0; i < 4; i++) out.push(S(k.cylinder(sx, sy, 3.6 - (i % 2) * 0.5, 2.2 + i * 0.7, 0.6, P, 14), { tone: i % 2 ? 'hi' : 'mid', crease: 'none' }));
		out.push(S(k.cylinder(sx, sy, 1.3, 26, 1.2, P, 10), { tone: 'mid' }));
		const calc: Plan = { x: -84, y: -76, w: 22, d: 18, r: 2 };
		out.push(halo(calc, 0, 3, 2), S(k.slabOf(calc, 0, 3, P, 4, 0.8), { tone: 'hi' }));
		out.push(S(k.slabOf({ x: calc.x + 3, y: calc.y + 2.4, w: 16, d: 4, r: 0.6 }, 3, 0.6, P, 2), { tone: 'lo', crease: 'none' }));
		out.push(D(k.dotGrid(calc.x + 4.5, calc.y + 8.6, 4, 3, 4.2, 3, P), { size: 0.9, tone: 'mid' }));
		out.push(L(k.planOutline(k.insetPlan(calc, 1.2), 3, P, 4), { tone: 'faint' }), D([at([calc.x + 2, calc.y + 16, 3])], { size: 0.4 }));
		const b: Plan = { x: 146, y: -74, w: 18, d: 7, r: 2 };
		out.push(halo({ ...b, x: b.x - 2, w: b.w + 4 }, 0, 20, 2), S(k.slabOf({ x: b.x - 2, y: b.y - 1, w: b.w + 4, d: b.d + 2, r: 1.5 }, 0, 1.6, P, 3, 0.4), { tone: 'lo' }), S(k.slabOf(b, 1.6, 19, P, 4, 0.8), { tone: 'hi' }));
		const [cx, f, cz] = [b.x + b.w / 2, b.y + b.d, 11];
		out.push(L(k.sideRing([cx, f, cz], 6.6, 'y', P, 32), { tone: 'mid' }));
		for (let i = 0; i < 12; i++) {
			const a = (i / 12) * Math.PI * 2;
			out.push(L(seg([cx + Math.sin(a) * 5.2, f, cz + Math.cos(a) * 5.2], [cx + Math.sin(a) * 6.2, f, cz + Math.cos(a) * 6.2]), { tone: i % 3 ? 'lo' : 'mid' }));
		}
		out.push(L(seg([cx, f, cz], [cx, f, cz + 4.4]) + seg([cx, f, cz], [cx + 3.4, f, cz - 1.4]), { tone: 'hi' }), D([at([cx, f, cz]), at([b.x + 3, f, 4]), at([b.x + b.w - 3, f, 4])], { size: 0.5, tone: 'hi' }));
		out.push(S(k.slabOf({ x: b.x + 4, y: b.y + 2, w: b.w - 8, d: 3, r: 1 }, 20.6, 2, P, 3, 0.3), { tone: 'mid' }));
		const [mx, my] = [80, -68];
		out.push(halo({ x: mx - 7, y: my - 7, w: 14, d: 14, r: 7 }, 0, 10, 2), S(k.cylinder(mx, my, 6, 0, 10, P, 28, 0.6), { tone: 'hi' }));
		out.push(L(k.knurl(mx, my, 6, 1, 9, 22, P, 0.3), { tone: 'faint' }), L(k.ring(mx, my, 4.6, 10, P, 22), { tone: 'mid' }), S(k.slabOf({ x: mx + 5, y: my - 1, w: 4.4, d: 2, r: 0.8 }, 3, 5, P, 3, 0.3), { tone: 'mid' }));
		return out.join('');
	}

	function frontRow() {
		const out: string[] = [];
		const bx: Plan = { x: -150, y: 44, w: 38, d: 18, r: 2 };
		out.push(halo(bx, 0, 9, 2), S(k.slabOf(bx, 0, 9, P, 4, 0.8), { tone: 'mid', inner: L(k.sideSeam(bx, 6, P, 4), { tone: 'faint' }) }));
		out.push(L(k.planOutline(k.insetPlan(bx, 2), 9, P, 4), { tone: 'faint' }));
		const bf = bx.y + bx.d;
		out.push(S(k.slabOf({ x: bx.x + 6, y: bf, w: 14, d: 0.8, r: 0.3 }, 1.6, 3.6, P, 2), { tone: 'hi' }), L(seg([bx.x + 8, bf + 0.8, 3.4], [bx.x + 18, bf + 0.8, 3.4]) + seg([bx.x + 8, bf + 0.8, 2.4], [bx.x + 15, bf + 0.8, 2.4]), { tone: 'faint', free: true }));
		out.push(L(rectY(bf, bx.x + 26, bx.x + 34, 4, 7.4), { tone: 'lo' }), dotsAt([[bx.x + 3, bf, 4.5], [bx.x + bx.w - 3, bf, 4.5], [bx.x + 3, bf, 7.5]], 0.4));
		for (let i = 0; i < 3; i++) out.push(S(k.slabOf({ x: bx.x + 4 + i * 5, y: bx.y + 3, w: 0.8, d: 10, r: 0.2 }, 9, 3.4 + i * 0.4, P, 2), { tone: i === 1 ? 'hi' : 'mid', crease: 'none' }));
		const pad: Plan = { x: -96, y: 46, w: 22, d: 14, r: 2 };
		out.push(halo(pad, 0, 2.4, 2), S(k.slabOf(pad, 0, 2.4, P, 3, 0.5), { tone: 'mid' }), S(k.slabOf(k.insetPlan(pad, 2), 2.4, 0.4, P, 3), { tone: 'lo', crease: 'none' }), D([at([pad.x + 1, pad.y + 1, 2.4]), at([pad.x + pad.w - 1, pad.y + pad.d - 1, 2.4])], { size: 0.35 }));
		const [tx, ty] = [-58, 54];
		out.push(halo({ x: tx - 5, y: ty - 5, w: 10, d: 10, r: 5 }, 0, 12, 2), S(k.cylinder(tx, ty, 4.4, 0, 1.4, P, 20, 0.3), { tone: 'lo' }), S(k.cylinder(tx, ty, 2.4, 1.4, 8, P, 14, 0.3), { tone: 'hi' }), L(k.knurl(tx, ty, 2.4, 2, 8.4, 12, P, 0.3), { tone: 'lo' }), S(k.cylinder(tx, ty, 3.6, 9.4, 2, P, 18, 0.5), { tone: 'mid' }), D([at([tx, ty, 11.4])], { size: 0.45, tone: 'hi' }));
		const [wx, wy] = [-12, 57];
		out.push(halo({ x: wx - 9, y: wy - 9, w: 18, d: 18, r: 9 }, 0, 14, 3), S(k.cylinder(wx, wy, 9, 0, 14, P, 32, 0.7), { tone: 'mid' }));
		out.push(L(k.ring(wx, wy, 7.4, 14, P, 28) + k.ring(wx, wy, 9, 2, P, 32) + k.ring(wx, wy, 9, 11, P, 32), { tone: 'lo' }), L(k.knurl(wx, wy, 9, 2.4, 10.6, 24, P, 0.3), { tone: 'faint' }));
		for (const [dx, dy, dz] of [[-2, -1, 14], [2.4, 1.6, 14], [0.4, 3, 14]] as const) out.push(S(k.cylinder(wx + dx, wy + dy, 2.6, dz - 0.6, 2.8, P, 8), { tone: 'hi', crease: 'none' }));
		for (let i = 0; i < 3; i++) {
			const fo: Plan = { x: 108 - i * 1.4, y: 40 + i * 1.2, w: 36, d: 24, r: 1 };
			out.push(S(k.slabOf(fo, i * 1.6, 1.6, P, 2, 0.2), { tone: i % 2 ? 'hi' : 'mid' }), S(k.slabOf({ x: fo.x + 4 + i * 10, y: fo.y + fo.d - 0.2, w: 9, d: 2.4, r: 0.4 }, i * 1.6, 1.6, P, 2), { tone: i % 2 ? 'mid' : 'hi', crease: 'none' }));
		}
		out.push(L(k.lineOnTop([112, 46], [132, 46], 4.8, P) + k.lineOnTop([112, 50], [124, 50], 4.8, P), { tone: 'faint', free: true }), D([at([108, 58, 4.8]), at([140, 42, 4.8])], { size: 0.4 }));
		const [qx, qy] = [156, 52];
		out.push(halo({ x: qx - 7, y: qy - 7, w: 14, d: 14, r: 7 }, 0, 8, 2), S(k.cylinder(qx, qy, 6.4, 0, 8, P, 28, 0.6), { tone: 'mid' }), L(k.ring(qx, qy, 5, 8, P, 22), { tone: 'lo' }), L(k.knurl(qx, qy, 6.4, 1, 5, 20, P, 0.3), { tone: 'faint' }), S(k.cylinder(qx, qy, 4.4, 8, 0.8, P, 20), { tone: 'lo', crease: 'none' }));
		for (const [dx, dy, h] of [[0, 0, 24], [-2.6, 1.2, 17], [2.6, -1, 19], [0.8, 2.6, 13]] as const) {
			out.push(L(seg([qx, qy, 8.8], [qx + dx, qy + dy, 8.8 + h]), { tone: 'mid' }));
			out.push(S(k.extrude([[qx + dx - 3.4, qy + dy], [qx + dx, qy + dy - 1.8], [qx + dx + 3.4, qy + dy], [qx + dx, qy + dy + 1.8]], 8.8 + h, 0.6, P), { tone: 'hi' }), L(k.lineOnTop([qx + dx - 2.6, qy + dy], [qx + dx + 2.6, qy + dy], 9.4 + h, P), { tone: 'faint' }));
		}
		return out.join('');
	}

	function paper([cx, cy, z]: Point3) {
		const plan: Plan = { x: cx - 11, y: cy - 7, w: 22, d: 14, r: 0.4 };
		const out = [S(k.slabOf(plan, z, 1.2, P, 2, 0.2), { tone: 'hi' })];
		const t = z + 1.2;
		for (const dy of [3, 6, 9, 12]) out.push(L(k.lineOnTop([plan.x + 3, plan.y + dy - 0.5], [plan.x + plan.w - (dy === 12 ? 9 : 3), plan.y + dy - 0.5], t, P), { tone: 'faint', free: true }));
		return out.join('');
	}
	function sheet([cx, cy, z]: Point3) {
		const plan: Plan = { x: cx - 11, y: cy - 7, w: 22, d: 14, r: 0.4 };
		const out = [S(k.slabOf(plan, z, 1.2, P, 2, 0.2), { tone: 'hi' })];
		const t = z + 1.2;
		for (const dy of [4, 8, 12]) out.push(L(k.lineOnTop([plan.x + 1, plan.y + dy - 1], [plan.x + plan.w - 1, plan.y + dy - 1], t, P), { tone: 'mid', free: true }));
		for (const dx of [7, 14]) out.push(L(k.lineOnTop([plan.x + dx, plan.y + 1], [plan.x + dx, plan.y + plan.d - 1], t, P), { tone: 'mid', free: true }));
		return out.join('');
	}
	function ledger([cx, cy, z]: Point3) {
		const plan: Plan = { x: cx - 11, y: cy - 7, w: 22, d: 14, r: 0.8 };
		const out = [S(k.slabOf(plan, z, 2.6, P, 3, 0.4), { tone: 'hi' })];
		const t = z + 2.6;
		out.push(S(k.slabOf({ x: plan.x, y: plan.y, w: 3.4, d: plan.d, r: 0.6 }, z, 2.8, P, 2), { tone: 'mid', crease: 'none' }));
		for (const dy of [3.5, 7, 10.5]) out.push(L(k.lineOnTop([plan.x + 6, plan.y + dy], [plan.x + plan.w - 2, plan.y + dy], t, P), { tone: 'faint', free: true }));
		return out.join('');
	}
	const draw: Record<Name, (p: Point3) => string> = { paper, sheet, ledger };

	const transforms = transformsFrom(P, Object.fromEntries(MOVERS.map((m) => [m.name, offsets(m)])));
	const mover = (m: Mover) => moverSvg(m.name, transforms[m.name][3], draw[m.name](m.from));

	const svg = k.figureSvg({
		width,
		height,
		label:
			'Piles of paper on a workbench: a loose page, a spreadsheet printout and a ledger book. They are fed through a roller press, drop into the labelled trays of a tidy drawer cabinet, and a tablet beside it lights up. Everything from your paper and spreadsheets now lives in your app and nothing is lost.',
		body: [bench(), backRow(), feeder(), piles(), pressBack(), cabinet(), tablet(), trayBack(), ...MOVERS.map(mover), pressFront(), trayFront(), frontRow()],
	});
	return { svg, labels: LABELS, transforms };
}
