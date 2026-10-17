import * as k from '../../lib/anatomy/iso-kit';
import type { Plan, Plane, Point3 } from '../../lib/anatomy/iso-kit';
import { moverSvg, stepSvg, transformsFrom, type Machine } from '../../lib/plate';

export const LABELS = ['paper and spreadsheets', 'fed in', 'sorted into your app', 'nothing lost'] as const;
export const CAPTION = 'Already running on paper, spreadsheets or an old system? We move everything across so nothing is lost.';

const BENCH: Plan = { x: -166, y: -72, w: 244, d: 134, r: 8 };
const BENCH_H = 12;
const FOOT_H = 6;

// feed deck: the hopper floor runs on under the portal and along the front of the sorting frame
const DECK: Plan = { x: -152, y: -14, w: 174, d: 44, r: 1 };
const DZ = 2;
const HOPPER_R = -114;

// sorting frame: pigeonholes, row 0 takes the papers, row 1 holds the app's existing records
const RX = -90;
const RY = -50;
const FRONT = -14;
const PITCH = 34;
const COLS = 3;
const DIV = 2;
const RACK_W = COLS * PITCH + DIV;
const CELL_H = 14;
const SHELF = 4;
const R0 = DZ;
const R1 = R0 + CELL_H + SHELF;
const CAP = R1 + CELL_H;
const TOP = CAP + SHELF;
const cellX = (c: number) => RX + c * PITCH + DIV + (PITCH - DIV) / 2;
const SLOT_Y = -25;

const PW = 24;
const PD = 11;

const NAMES = ['paper', 'sheet', 'ledger'] as const;
type Name = (typeof NAMES)[number];
interface Mover {
	name: Name;
	col: number;
	lane: number;
	from: Point3;
}
const LANES: Record<Name, number> = { paper: 22, sheet: 10, ledger: -2 };
export const MOVERS: Mover[] = NAMES.map((name, col) => ({ name, col, lane: LANES[name], from: [-133, LANES[name], DZ] }));

function offsets(m: Mover): Point3[] {
	const dx = cellX(m.col) - m.from[0];
	const dy = SLOT_Y - m.lane;
	return [[0, 0, 0], [dx, 0, 0], [dx, dy, 0], [dx, dy, 0]];
}

export function moveOver(width = 720, height = 480): Machine {
	const P = k.fitProjection(
		[...k.boxCorners(BENCH, -BENCH_H - FOOT_H, 0), [RX, RY, TOP + 14], [RX + RACK_W, RY, TOP + 14], [-152, 30, 20], [66, 0, 30], [-150, 60, 30]],
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
	const byDepth = (points: Plane[]) => [...points].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
	const frontText = (x: number, y: number, z: number, text: string, size: number, anchor: 'start' | 'middle' = 'start') => k.faceTextSvg(k.sideMatrix([x, y], z, P, 'left'), text, { size, tone: 'lo', anchor });
	const box = (y: number, x0: number, x1: number, z0: number, z1: number) => seg([x0, y, z0], [x1, y, z0], 'lo') + seg([x1, y, z0], [x1, y, z1], 'lo') + seg([x1, y, z1], [x0, y, z1], 'lo') + seg([x0, y, z1], [x0, y, z0], 'lo');

	function bench() {
		const out = [halo(BENCH, -BENCH_H - FOOT_H, BENCH_H)];
		for (const [x, y] of byDepth(k.corners(BENCH, 24))) out.push(cyl(x, y, 8, -BENCH_H - FOOT_H, 1.8, 'lo', 0.4), cyl(x, y, 6, -BENCH_H - FOOT_H + 1.8, FOOT_H - 1.8, 'mid', 0.3));
		out.push(S(k.slabOf(BENCH, -BENCH_H, BENCH_H, P, 8, 1.6), { tone: 'mid', inner: L(k.sideSeam(BENCH, -BENCH_H / 2, P), { tone: 'faint' }) }));
		out.push(L(k.planOutline(k.insetPlan(BENCH, 5), 0, P), { tone: 'lo' }));
		const screws = k.corners(BENCH, 11);
		out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(''), { tone: 'lo' }), dots(screws.map(([x, y]) => [x, y, 0] as Point3), 0.5));
		for (const [x, y] of screws) out.push(flat([x - 1.3, y], [x + 1.3, y], 0, 'faint'));
		const fy = BENCH.y + BENCH.d;
		for (let x = -120; x <= 60; x += 30) out.push(box(fy, x - 7, x + 7, -4.8, -2.6));
		const strip: Plan = { x: -108, y: fy - 7, w: 110, d: 5, r: 1 };
		out.push(slab(strip.x, strip.y, strip.w, strip.d, 0, 0.6, 'lo', { thin: true, steps: 3 }));
		const tk = k.topTicks(strip.x + 4, strip.x + strip.w - 4, 4, 5, strip.y + 0.6, 0.6, [1.6, 3], P);
		out.push(L(tk.minor, { tone: 'lo' }), L(tk.major, { tone: 'mid' }));
		const label: Plan = { x: 10, y: fy - 11, w: 44, d: 8, r: 1.5 };
		out.push(slab(label.x, label.y, label.w, label.d, 0, 0.8, 'lo', { steps: 3 }));
		for (const dy of [2.5, 5.2]) out.push(flat([label.x + 5, label.y + dy], [label.x + label.w - (dy > 5 ? 16 : 5), label.y + dy], 0.8));
		out.push(dots([[label.x + 2, label.y + 2, 0.8], [label.x + label.w - 2, label.y + label.d - 2, 0.8]], 0.4));
		return out.join('');
	}

	function deck() {
		const out = [halo(DECK, 0, DZ, 2)];
		out.push(S(k.slabOf(DECK, 0, DZ, P, 4, 0.4), { tone: 'lo', inner: L(k.sideSeam(DECK, 1, P, 4), { tone: 'faint' }) }));
		for (const y of [2, 8, 14, 20, 26]) out.push(flat([HOPPER_R + 4, y], [DECK.x + DECK.w - 3, y], DZ, 'faint'));
		out.push(slab(-104, DECK.y + DECK.d, 126, 1.6, 0, DZ + 2.4, 'mid', { r: 0.4 }));
		out.push(slab(DECK.x + DECK.w, DECK.y, 1.6, DECK.d + 1.6, 0, DZ + 2.4, 'mid', { r: 0.4 }));
		out.push(frontText(-100, DECK.y + DECK.d + 1.6, 1.4, 'FED IN', 2.2));
		out.push(dots([[-96, DECK.y + DECK.d + 1.6, 3.4], [16, DECK.y + DECK.d + 1.6, 3.4]], 0.4));
		return out.join('');
	}

	function hopperBack() {
		const out: string[] = [];
		out.push(slab(DECK.x, DECK.y, 2, DECK.d, DZ, 17, 'mid', { r: 0.4, seam: 10 }));
		out.push(slab(DECK.x, DECK.y, HOPPER_R - DECK.x, 2, DZ, 17, 'mid', { r: 0.4, seam: 10 }));
		out.push(flat([DECK.x + 3, DECK.y + 2], [HOPPER_R - 2, DECK.y + 2], DZ + 17, 'lo'));
		out.push(dots([[DECK.x + 1, DECK.y + 8, DZ + 17], [DECK.x + 1, DECK.y + DECK.d - 8, DZ + 17], [DECK.x + 8, DECK.y + 1, DZ + 17], [HOPPER_R - 8, DECK.y + 1, DZ + 17]], 0.4));
		out.push(slab(DECK.x + 2, DECK.y + 2, 4, 4, DZ, 17, 'lo', { r: 0.3, thin: true }));
		return out.join('');
	}
	function hopperFront() {
		const y = DECK.y + DECK.d - 2;
		const out = [slab(DECK.x, y, HOPPER_R - DECK.x, 2, DZ, 5, 'mid', { r: 0.4, seam: 3 })];
		out.push(slab(HOPPER_R - 12, y, 12, 2, DZ, 5, 'mid', { r: 0.3, thin: true }));
		out.push(dots([[DECK.x + 6, y + 2, DZ + 3], [(DECK.x + HOPPER_R) / 2, y + 2, DZ + 3], [HOPPER_R - 6, y + 2, DZ + 3]], 0.4));
		out.push(flat([DECK.x + 2, y], [HOPPER_R - 2, y], DZ + 5, 'lo'));
		return out.join('');
	}

	function portal() {
		const x = -108;
		const out: string[] = [];
		const top = DZ + 11;
		for (const y of [DECK.y - 4, DECK.y + DECK.d + 2]) out.push(slab(x - 1, y, 7, 2.6, 0, top, 'mid', { r: 0.5, seam: 6 }), cyl(x + 2.5, y + 1.3, 1.1, top, 0.8, 'hi', 0.15));
		const lin: Plan = { x, y: DECK.y - 4, w: 5, d: DECK.d + 10.6, r: 0.8 };
		out.push(halo(lin, top, 5, 2), S(k.slabOf(lin, top, 5, P, 4, 0.5), { tone: 'hi', inner: L(k.sideSeam(lin, top + 2.5, P, 4), { tone: 'faint' }) }));
		for (const y of [DECK.y + 8, DECK.y + 22, DECK.y + 36]) out.push(flat([x + 0.8, y], [x + 4.2, y], top + 5, 'lo'));
		out.push(dots([[x + 2.5, lin.y + 3, top + 5], [x + 2.5, lin.y + lin.d - 3, top + 5]], 0.4));
		return out.join('');
	}

	function rackBack() {
		const base: Plan = { x: RX, y: RY, w: RACK_W, d: FRONT - RY, r: 1 };
		const out = [halo(base, 0, TOP, 3)];
		out.push(S(k.slabOf(base, 0, DZ, P, 4, 0.4), { tone: 'lo' }));
		out.push(slab(RX, RY, RACK_W, 2, 0, TOP, 'mid', { r: 0.4, seam: R1 + 4 }));
		for (let c = 0; c <= COLS; c++) {
			out.push(slab(RX + c * PITCH, RY + 2, DIV, FRONT - RY - 2, R0, CELL_H, 'mid', { r: 0.3, thin: true }));
			out.push(slab(RX + c * PITCH, RY + 2, DIV, FRONT - RY - 2, R1, CELL_H, 'mid', { r: 0.3, thin: true }));
		}
		for (let c = 0; c < COLS; c++) {
			const x0 = RX + c * PITCH + DIV + 3;
			for (let i = 0; i < 5; i++) {
				const h = 9 + ((i + c) % 3);
				out.push(slab(x0 + i * 5.2, RY + 4, 1.2, 22, R1, h, (i + c) % 2 ? 'hi' : 'mid', { r: 0.2, thin: true }));
				out.push(slab(x0 + i * 5.2, RY + 4, 1.2, 6, R1 + h, 2, 'mid', { r: 0.2, thin: true }));
			}
		}
		for (let c = 0; c < COLS; c++) out.push(slab(cellX(c) - 12, RY + 2, 24, 1.6, R0, 2.4, 'lo', { r: 0.3, thin: true }));
		return out.join('');
	}

	function rackFront() {
		const out: string[] = [];
		out.push(slab(RX, RY, RACK_W, FRONT - RY, R0 + CELL_H, SHELF, 'mid', { r: 0.4, bevel: 0.3 }));
		out.push(slab(RX, RY, RACK_W, FRONT - RY, CAP, SHELF, 'mid', { r: 0.4, bevel: 0.3 }));
		const labels0 = ['LETTERS', 'SHEETS', 'LEDGERS'];
		const labels1 = ['PEOPLE', 'ORDERS', 'STOCK'];
		for (let c = 0; c < COLS; c++) {
			const cx = cellX(c);
			out.push(slab(cx - 11, FRONT, 22, 0.6, R0 + CELL_H + 0.4, SHELF - 0.8, 'hi', { r: 0.2, thin: true }), frontText(cx, FRONT + 0.6, R0 + CELL_H + 1.1, labels0[c], 2.2, 'middle'));
			out.push(slab(cx - 11, FRONT, 22, 0.6, CAP + 0.4, SHELF - 0.8, 'hi', { r: 0.2, thin: true }), frontText(cx, FRONT + 0.6, CAP + 1.1, labels1[c], 2.2, 'middle'));
		}
		out.push(L(k.planOutline(k.insetPlan({ x: RX, y: RY, w: RACK_W, d: FRONT - RY, r: 1 }, 2.4), TOP, P), { tone: 'faint' }));
		out.push(dots([[RX + 3, FRONT - 3, TOP], [RX + RACK_W - 3, FRONT - 3, TOP], [RX + 3, RY + 5, TOP], [RX + RACK_W - 3, RY + 5, TOP]], 0.45));
		const sign: Plan = { x: RX + 6, y: RY + 3, w: RACK_W - 12, d: 2.6, r: 0.8 };
		for (const x of [sign.x + 4, sign.x + sign.w - 8]) out.push(cyl(x + 2, sign.y + 1.3, 1.2, TOP, 8, 'mid', 0.2));
		out.push(slab(sign.x, sign.y, sign.w, sign.d, TOP + 8, 10, 'hi', { r: 0.8 }));
		const sf = sign.y + sign.d;
		out.push(frontText(sign.x + 6, sf, TOP + 12, 'YOUR APP', 5), flat([sign.x + 6, sf], [sign.x + 40, sf], TOP + 10, 'faint'));
		out.push(dots([[sign.x + 3, sf, TOP + 16], [sign.x + sign.w - 3, sf, TOP + 16]], 0.4));
		return out.join('');
	}

	function tally(x: number, y: number, tag: string, lamp: boolean, a: string, b: string, at_: number) {
		const W = 30;
		const Dp = 22;
		const H = 16;
		const f = y + Dp;
		const plan: Plan = { x, y, w: W, d: Dp, r: 2 };
		const out = [halo(plan, 0, H, 2)];
		for (const dx of [2, W - 8]) out.push(slab(x + dx, y + 2, 6, Dp - 4, 0, 1.6, 'lo', { r: 0.4, thin: true }));
		out.push(S(k.slabOf(plan, 1.6, H, P, 4, 0.6), { tone: 'mid', inner: L(k.sideSeam(plan, 8, P, 4), { tone: 'faint' }) }));
		out.push(slab(x + 2, y + 2, W - 4, Dp - 4, 1.6 + H, 1.2, 'lo', { r: 1, thin: true }));
		out.push(slab(x + 3, f, W - 6, 0.6, 7.6, 7.6, 'lo', { r: 0.6, thin: true }));
		out.push(slab(x + 4, f + 0.6, W - 8, 0.5, 8.6, 5.6, 'hi', { r: 0.4, thin: true }));
		for (const dx of [0.33, 0.66]) out.push(seg([x + 4 + (W - 8) * dx, f + 1.1, 8.8], [x + 4 + (W - 8) * dx, f + 1.1, 13.8], 'faint'));
		out.push(stepSvg('dim-from', at_, frontText(x + W / 2, f + 1.1, 9.8, a, 4.2, 'middle')));
		out.push(stepSvg('show-from', at_, frontText(x + W / 2, f + 1.1, 9.8, b, 4.2, 'middle')));
		out.push(slab(x + 8, f, W - 16, 0.6, 2.4, 3.4, 'hi', { r: 0.2, thin: true }), frontText(x + W / 2, f + 0.6, 3.3, tag, 2.4, 'middle'));
		const top = 1.6 + H + 1.2;
		out.push(cyl(x + W - 7, y + 8, 3.4, top, 2.4, 'mid', 0.3), cyl(x + W - 7, y + 8, 1.5, top + 2.4, 8, 'mid', 0.2), cyl(x + W - 7, y + 8, 3, top + 10.4, 3.2, 'hi', 0.5));
		out.push(L(k.knurl(x + W - 7, y + 8, 3.4, top, top + 2.4, 12, P, 0.3), { tone: 'lo' }));
		out.push(cyl(x + 7, y + 7, 2.6, top, 2, 'lo', 0.3), cyl(x + 7, y + 7, 1.8, top + 2, 1.4, 'hi', 0.3));
		const lx = x + 9;
		const ly = y + 14;
		out.push(cyl(lx, ly, 2.4, top, 1.8, 'mid', 0.2));
		out.push(lamp ? stepSvg('lit-at', at_, cyl(lx, ly, 1.8, top + 1.8, 1.6, 'hi', 0.2, true)) : cyl(lx, ly, 1.8, top + 1.8, 1.6, 'lo', 0.2));
		out.push(dots([[x + 2, f, 5], [x + W - 2, f, 5], [x + 2, f, H - 1], [x + W - 2, f, H - 1]], 0.4));
		return out.join('');
	}

	function pageStack(cx: number, cy: number, z: number, n: number) {
		const out: string[] = [];
		for (let i = 0; i < n; i++) out.push(slab(cx - PW / 2 + i * 0.5, cy - PD / 2 + i * 0.4, PW, PD, z + i * 0.6, 0.6, 'hi', { r: 0.3, thin: true, steps: 2 }));
		return out;
	}
	function paper([cx, cy, z]: Point3) {
		const out = pageStack(cx, cy, z, 2);
		const t = z + 1.2;
		const x0 = cx - PW / 2 + 1;
		const y0 = cy - PD / 2 + 0.8;
		for (const dy of [2.4, 4.6, 6.8, 9]) out.push(L(k.lineOnTop([x0 + 3, y0 + dy], [x0 + PW - 4 - (dy === 9 ? 9 : 0), y0 + dy], t, P), { tone: 'faint', free: true }));
		out.push(L(k.lineOnTop([x0 + 3, y0 + 0.6], [x0 + 9, y0 + 0.6], t, P), { tone: 'mid', free: true }));
		return out.join('');
	}
	function sheet([cx, cy, z]: Point3) {
		const out = pageStack(cx, cy, z, 2);
		const t = z + 1.2;
		const x0 = cx - PW / 2 + 1;
		const y0 = cy - PD / 2 + 0.8;
		for (const dy of [2.5, 5, 7.5]) out.push(L(k.lineOnTop([x0 + 3, y0 + dy], [x0 + PW - 2, y0 + dy], t, P), { tone: 'mid', free: true }));
		for (const dx of [8, 13, 18]) out.push(L(k.lineOnTop([x0 + dx, y0 + 0.6], [x0 + dx, y0 + PD - 2], t, P), { tone: 'mid', free: true }));
		out.push(dots([0, 1, 2, 3].map((i) => [x0 + 0.6, y0 + 1.2 + i * 2.6, t] as Point3), 0.35, 'lo'));
		return out.join('');
	}
	function ledger([cx, cy, z]: Point3) {
		const x0 = cx - PW / 2;
		const y0 = cy - PD / 2;
		const out = [slab(x0, y0, PW, PD, z, 3.2, 'hi', { r: 0.8, steps: 3, bevel: 0.4 }), slab(x0, y0, 3.6, PD, z, 3.4, 'mid', { r: 0.6, thin: true })];
		const t = z + 3.2;
		for (const dy of [3, 5.5, 8]) out.push(L(k.lineOnTop([x0 + 6, y0 + dy], [x0 + PW - 2.5, y0 + dy], t, P), { tone: 'faint', free: true }));
		out.push(L(k.lineOnTop([x0 + 12, y0 + 1], [x0 + 12, y0 + PD - 1], t, P), { tone: 'faint', free: true }));
		out.push(seg([x0 + 1.8, y0 + PD, z + 0.6], [x0 + 1.8, y0 + PD, z + 2.8], 'lo'), dots([[x0 + PW - 1.2, y0 + PD, z + 1.6]], 0.4));
		return out.join('');
	}
	const draw: Record<Name, (p: Point3) => string> = { paper, sheet, ledger };

	const transforms = transformsFrom(P, Object.fromEntries(MOVERS.map((m) => [m.name, offsets(m)])));
	const mover = (m: Mover) => moverSvg(m.name, transforms[m.name][3], draw[m.name](m.from));

	const svg = k.figureSvg({
		width,
		height,
		label:
			'A post-office sorting frame on a base: a hopper of mixed paper (a page, a spreadsheet printout and a ledger book) feeds along a deck under a slot gate into a pigeonhole frame with labelled cells. An in-counter and an out-counter tally the papers, and the out-counter lamp lights when the numbers match, so nothing is lost.',
		body: [bench(), deck(), hopperBack(), rackBack(), ...MOVERS.map(mover), hopperFront(), tally(-150, 38, 'IN', false, '000', '003', 2), rackFront(), portal(), tally(34, -2, 'OUT', true, '000', '003', 4)],
	});
	return { svg, labels: LABELS, transforms };
}
