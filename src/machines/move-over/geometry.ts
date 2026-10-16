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
const PILE_TOP = 4.8;

const BAR_X = -42;
const NIP: Point3[] = ROWS.map((y) => [-37, y, 17]);

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
		[...k.boxCorners(BENCH, -BENCH_H - FOOT_H, 0), [-54, -40, 34], [CAB.x, CAB.y, TRAY_TOP + 8], [100, -30, 56], [PILE_X, 20, 12]],
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
		return out.join('');
	}

	function piles() {
		const out: string[] = [];
		ROWS.forEach((y, i) => {
			const base: Plan = { x: PILE_X - 12, y: y - 8, w: 24, d: 16, r: 0.6 };
			out.push(halo(base, 0, PILE_TOP, 2));
			for (let n = 0; n < 3; n++) {
				const j = [0.8, -0.6, 0.4][(n + i) % 3];
				out.push(S(k.slabOf({ ...base, x: base.x + j, y: base.y - j * 0.6 }, n * 1.6, 1.6, P, 2, 0.2), { tone: n % 2 ? 'hi' : 'mid', crease: 'none' }));
			}
		});
		return out.join('');
	}

	function pressBack() {
		const out = [halo({ x: -54, y: -40, w: 34, d: 80, r: 3 }, 0, 3, 3)];
		out.push(S(k.slabOf({ x: -54, y: -40, w: 34, d: 80, r: 3 }, 0, 3, P, 4, 0.6), { tone: 'mid' }));
		out.push(S(k.slabOf({ x: BAR_X - 4, y: -38, w: 18, d: 6, r: 1.5 }, 3, 31, P, 3, 0.5), { tone: 'mid' }));
		out.push(D([at([BAR_X + 5, -35, 34]), at([-50, -34, 3]), at([-24, -34, 3])], { size: 0.4 }));
		out.push(S(k.slabOf({ x: BAR_X, y: -32, w: 10, d: 64, r: 4.8 }, 8, 7, P, 6, 0.8), { tone: 'hi' }));
		out.push(L(k.lineOnTop([BAR_X + 5, -30], [BAR_X + 5, 30], 15, P), { tone: 'faint' }));
		return out.join('');
	}
	function pressFront() {
		const out = [S(k.slabOf({ x: BAR_X, y: -32, w: 10, d: 64, r: 4.8 }, 20, 7, P, 6, 0.8), { tone: 'hi' })];
		out.push(L(k.lineOnTop([BAR_X + 5, -30], [BAR_X + 5, 30], 27, P), { tone: 'faint' }));
		const blk: Plan = { x: BAR_X - 4, y: 32, w: 18, d: 6, r: 1.5 };
		out.push(S(k.slabOf(blk, 3, 31, P, 3, 0.5), { tone: 'mid' }));
		const f = blk.y + blk.d;
		out.push(L(k.sideRing([BAR_X + 5, f, 11.5], 4.2, 'y', P, 20) + k.sideRing([BAR_X + 5, f, 23.5], 4.2, 'y', P, 20), { tone: 'lo' }));
		out.push(L(k.sideRing([BAR_X + 5, f + 0.2, 17.5], 9, 'y', P, 28), { tone: 'mid' }));
		out.push(L(seg([BAR_X + 5, f, 17.5], [BAR_X + 5 + 9, f, 17.5]) + seg([BAR_X + 5, f, 17.5], [BAR_X + 5 - 5, f, 17.5 + 7.8]) + seg([BAR_X + 5, f, 17.5], [BAR_X + 5 - 5, f, 17.5 - 7.8]), { tone: 'lo' }));
		out.push(S(k.cylinder(BAR_X + 14, f + 1.5, 1.8, 17, 1, P, 10), { tone: 'hi' }));
		out.push(D([at([BAR_X + 5, f, 17.5]), at([BAR_X + 5, f, 30])], { size: 0.55 }));
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
		return out.join('');
	}
	const trayY = (y: number) => y - 9;
	const WT = 1.6;
	const WH = 3.4;
	function trayBack() {
		const out: string[] = [];
		for (const y of ROWS) {
			out.push(S(k.slabOf({ x: TRAY_X, y: trayY(y), w: WT, d: 18, r: 0.4 }, TRAY_TOP, WH, P, 2), { tone: 'mid', crease: 'none' }));
			out.push(S(k.slabOf({ x: TRAY_X, y: trayY(y), w: TRAY_W, d: WT, r: 0.4 }, TRAY_TOP, WH, P, 2), { tone: 'mid', crease: 'none' }));
		}
		return out.join('');
	}
	function trayFront() {
		const out: string[] = [];
		for (const y of ROWS) {
			out.push(S(k.slabOf({ x: TRAY_X, y: trayY(y) + 18 - WT, w: TRAY_W, d: WT, r: 0.4 }, TRAY_TOP, WH, P, 2), { tone: 'mid', crease: 'none' }));
			out.push(S(k.slabOf({ x: TRAY_X + TRAY_W - WT, y: trayY(y), w: WT, d: 18, r: 0.4 }, TRAY_TOP, WH, P, 2), { tone: 'mid', crease: 'none' }));
		}
		return out.join('');
	}

	function tablet() {
		const base: Plan = { x: 96, y: -20, w: 36, d: 40, r: 3 };
		const out = [halo(base, 0, 3, 3), S(k.slabOf(base, 0, 3, P, 4, 0.6), { tone: 'mid' })];
		const body: Plan = { x: 108, y: -17, w: 5, d: 34, r: 2 };
		out.push(S(k.slabOf(body, 3, 46, P, 4, 0.6), { tone: 'mid' }));
		const fx = body.x + body.w;
		const screen: Plan = { x: fx, y: -14, w: 0.8, d: 28, r: 1 };
		out.push(stepSvg('lit-at', 4, S(k.slabOf(screen, 8, 36, P, 2), { tone: 'hi', lit: true })));
		for (const z of [18, 27, 36]) out.push(L(seg([fx + 0.8, -10, z], [fx + 0.8, 10, z]), { tone: 'mid' }));
		out.push(L(seg([fx + 0.8, 0, 12], [fx + 0.8, 0, 42]), { tone: 'faint' }));
		out.push(D([at([fx, 0, 5.5]), at([fx, 0, 46])], { size: 0.5, tone: 'mid' }));
		for (const y of [-14, 14]) out.push(S(k.cylinder(100, y, 2, 3, 6, P, 12), { tone: 'lo' }));
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
		body: [bench(), piles(), pressBack(), cabinet(), trayBack(), ...MOVERS.map(mover), pressFront(), trayFront(), tablet()],
	});
	return { svg, labels: LABELS, transforms };
}
