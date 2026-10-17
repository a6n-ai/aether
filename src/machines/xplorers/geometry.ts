import * as k from '../../lib/anatomy/iso-kit';
import type { Plan, Plane, Point3 } from '../../lib/anatomy/iso-kit';
import { moverSvg, stepSvg, transformsFrom, type Machine } from '../../lib/plate';

export const LABELS = ['classes on the board', 'family picks a seat', 'pays', 'seat booked'] as const;
export const CAPTION = "Parents see what's on, pick seats for their kids and pay. Staff see every booking in one place.";

const BENCH: Plan = { x: -150, y: -76, w: 300, d: 142, r: 8 };
const BENCH_H = 12;
const FOOT_H = 6;

const C = 8; // counter top
const COUNTER: Plan = { x: -141, y: -68, w: 282, d: 100, r: 3 };

// pigeonhole rack: rows are classes, slots are seats
const RX = -134;
const RY = -60;
const RD = 26;
const FRONT = RY + RD;
const COLS = 6;
const ROWS = 3;
const PITCH = 21.1;
const DIV = 1.6;
const CELL_H = 14;
const SHELF = 2;
const ROW_P = CELL_H + SHELF;
const RACK_W = COLS * PITCH + DIV;
const RACK_H = ROWS * ROW_P;
const TK_W = 17;
const TK_D = 26;
const TK_T = 1.2;
const TAB_H = 8;
const TK_Y = FRONT - TK_D + 4;
const tkX = (col: number) => RX + DIV + col * PITCH + (PITCH - DIV - TK_W) / 2;
const PICK = { col: 3, row: 0 };
const SLIDE = 28;

// dating press
const PRESS: Plan = { x: 36, y: -56, w: 56, d: 28, r: 2 };
const PRESS_F = PRESS.y + PRESS.d;
const PRESS_H = 28;
const SLOT_X = PRESS.x + PRESS.w / 2 - TK_W / 2;
const SPINDLE: Plane = [PRESS.x + 16, PRESS.y + 12];
const LEVER_Z = C + 54;

// coin stack and tray
const STACK: Plane = [-112, 20];
const STACK_N = 4;
const COIN_R = 8;
const COIN_H = 2.6;
const TRAY: Plan = { x: -62, y: 6, w: 46, d: 30, r: 3 };
const TRAY_AT: Plane = [TRAY.x + 23, TRAY.y + 15];

export function xplorers(width = 720, height = 480): Machine {
	const P = k.fitProjection(
		[...k.boxCorners(BENCH, -BENCH_H - FOOT_H, 0), [RX, RY, C + RACK_H + 22], [RX + RACK_W, RY, C + RACK_H + 22], [PRESS.x + PRESS.w + 40, PRESS.y, C + 60]],
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

	function bench() {
		const out = [halo(BENCH, -BENCH_H - FOOT_H, BENCH_H)];
		for (const [x, y] of byDepth(k.corners(BENCH, 24))) out.push(cyl(x, y, 8, -BENCH_H - FOOT_H, 1.8, 'lo', 0.4), cyl(x, y, 6, -BENCH_H - FOOT_H + 1.8, FOOT_H - 1.8, 'mid', 0.3));
		out.push(S(k.slabOf(BENCH, -BENCH_H, BENCH_H, P, 8, 1.6), { tone: 'mid', inner: L(k.sideSeam(BENCH, -BENCH_H / 2, P), { tone: 'faint' }) }));
		out.push(L(k.planOutline(k.insetPlan(BENCH, 5), 0, P), { tone: 'lo' }));
		const screws = k.corners(BENCH, 11);
		out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(''), { tone: 'lo' }), dots(screws.map(([x, y]) => [x, y, 0] as Point3), 0.5));
		for (const [x, y] of screws) out.push(flat([x - 1.3, y], [x + 1.3, y], 0, 'faint'));
		const strip: Plan = { x: -128, y: BENCH.y + BENCH.d - 7, w: 170, d: 5, r: 1 };
		out.push(slab(strip.x, strip.y, strip.w, strip.d, 0, 0.6, 'lo', { thin: true, steps: 3 }));
		const tk = k.topTicks(strip.x + 4, strip.x + strip.w - 4, 4, 5, strip.y + 0.6, 0.6, [1.6, 3], P);
		out.push(L(tk.minor, { tone: 'lo' }), L(tk.major, { tone: 'mid' }));
		const label: Plan = { x: 56, y: BENCH.y + BENCH.d - 11, w: 40, d: 8, r: 1.5 };
		out.push(slab(label.x, label.y, label.w, label.d, 0, 0.8, 'lo', { steps: 3 }));
		for (const dy of [2.5, 5.2]) out.push(flat([label.x + 5, label.y + dy], [label.x + label.w - (dy > 5 ? 16 : 5), label.y + dy], 0.8));
		return out.join('');
	}

	function counter() {
		const out = [halo(COUNTER, 0, C, 4)];
		out.push(S(k.slabOf(COUNTER, 0, C, P, 8, 1), { tone: 'mid', inner: L(k.sideSeam(COUNTER, 2.2, P), { tone: 'faint' }) + L(k.sideSeam(COUNTER, C - 1.6, P), { tone: 'faint' }) }));
		out.push(L(k.planOutline(k.insetPlan(COUNTER, 4), C, P, 8), { tone: 'faint' }));
		const cs = k.corners(COUNTER, 7);
		out.push(L(cs.map(([x, y]) => k.ring(x, y, 1.6, C, P, 12)).join(''), { tone: 'lo' }), dots(cs.map(([x, y]) => [x, y, C] as Point3), 0.45));
		const fy = COUNTER.y + COUNTER.d;
		for (const x of [-120, -40, 40, 120]) {
			out.push(slab(x - 14, fy, 28, 0.8, 1.6, C - 3.6, 'lo', { r: 0.4, thin: true }));
			out.push(slab(x - 5, fy + 0.8, 10, 1, 4.2, 1.4, 'hi', { r: 0.4, thin: true }));
		}
		const rx = COUNTER.x + COUNTER.w;
		for (const y of [-52, -30, -8, 14]) out.push(slab(rx, y, 0.8, 16, 1.6, C - 3.6, 'lo', { r: 0.4, thin: true }));
		return out.join('');
	}

	const tkRowZ = (row: number) => C + row * ROW_P;
	function ticket(x: number, y: number, z: number, tone: 'hi' | 'mid', n: number) {
		const out = [slab(x, y, TK_W, TK_D, z, TK_T, tone, { r: 0.5, thin: true, steps: 2 })];
		const t = z + TK_T;
		out.push(flat([x + 3, y + 6], [x + TK_W - 3, y + 6], t), flat([x + 3, y + 10], [x + TK_W - 6, y + 10], t), L(k.lineOnTop([x + 1, y + TK_D - 7], [x + TK_W - 1, y + TK_D - 7], t, P), { tone: 'lo', dotted: true, free: true }));
		out.push(slab(x, y + TK_D - 1.4, TK_W, 1.4, z, TAB_H, tone, { r: 0.4, thin: true }));
		const f = y + TK_D;
		out.push(seg([x + 3, f, z + 5.4], [x + TK_W - 3, f, z + 5.4], 'mid'), seg([x + 3, f, z + 3.2], [x + 3 + 3 + (n % 3) * 3, f, z + 3.2], 'faint'));
		out.push(dots([[x + TK_W - 2.4, f, z + TAB_H - 1.6]], 0.4));
		return out.join('');
	}

	function rack() {
		const out = [halo({ x: RX, y: RY, w: RACK_W, d: RD, r: 1 }, C, RACK_H, 3)];
		out.push(slab(RX, RY, RACK_W, 2, C, RACK_H, 'lo', { r: 0.4, thin: true }));
		out.push(slab(RX, RY, DIV, RD, C, RACK_H, 'mid', { r: 0.4 }));
		for (let r = 0; r < ROWS; r++) {
			const z = tkRowZ(r);
			if (r > 0) out.push(slab(RX, RY, RACK_W, RD, z - SHELF, SHELF, 'mid', { r: 0.4, thin: true }), flat([RX + 2, FRONT], [RX + RACK_W - 2, FRONT], z - 1, 'faint'));
			for (let c = 0; c < COLS; c++) {
				out.push(slab(RX + c * PITCH + (c ? 0 : DIV), RY + 2, DIV, RD - 2, z, CELL_H, 'mid', { r: 0.3, thin: true }));
				if (r === PICK.row && c === PICK.col) continue;
				out.push(ticket(tkX(c), TK_Y, z, 'mid', c + r));
			}
		}
		out.push(slab(RX + COLS * PITCH, RY + 2, DIV, RD - 2, C, RACK_H - SHELF, 'mid', { r: 0.3, thin: true }));
		out.push(slab(RX, RY, RACK_W, RD, C + RACK_H - SHELF, SHELF, 'mid', { r: 0.4 }));
		out.push(L(k.planOutline(k.insetPlan({ x: RX, y: RY, w: RACK_W, d: RD, r: 1 }, 2.4), C + RACK_H, P), { tone: 'faint' }));
		out.push(dots([[RX + 3, FRONT - 3, C + RACK_H], [RX + RACK_W - 3, FRONT - 3, C + RACK_H], [RX + 3, RY + 3, C + RACK_H], [RX + RACK_W - 3, RY + 3, C + RACK_H]], 0.45));
		const rx = RX + RACK_W;
		for (let r = 0; r < ROWS; r++) {
			const z = tkRowZ(r);
			out.push(slab(rx, FRONT - 20, 0.9, 14, z + 4, 7, 'hi', { r: 0.3, thin: true }));
			out.push(seg([rx + 0.9, FRONT - 17, z + 8.6], [rx + 0.9, FRONT - 9, z + 8.6], 'mid'), seg([rx + 0.9, FRONT - 17, z + 6.2], [rx + 0.9, FRONT - 12, z + 6.2], 'faint'));
			out.push(dots([[rx + 0.9, FRONT - 7.4, z + 9.2]], 0.4));
		}
		out.push(slab(RX - 3, FRONT - 6, 3, 6, C, 3, 'lo', { r: 0.4, thin: true }), slab(rx, FRONT - 6, 3, 6, C, 3, 'lo', { r: 0.4, thin: true }));
		const top = C + RACK_H;
		for (const x of [RX + 14, RX + RACK_W - 18]) out.push(cyl(x + 2, RY + 5, 1.1, top, 22, 'mid', 0.2));
		const sign: Plan = { x: RX + 6, y: RY + 3, w: RACK_W - 12, d: 2.6, r: 0.8 };
		out.push(slab(sign.x, sign.y, sign.w, sign.d, top + 14, 11, 'hi', { r: 0.8 }));
		const sf = sign.y + sign.d;
		out.push(k.faceTextSvg(k.sideMatrix([sign.x + 6, sf], top + 18.2, P, 'left'), 'CLASSES', { size: 5, tone: 'lo' }), seg([sign.x + 6, sf, top + 16.2], [sign.x + 40, sf, top + 16.2], 'faint'));
		out.push(...[0, 1, 2].map((i) => slab(sign.x + sign.w - 30 + i * 9, sf, 7, 0.8, top + 16, 6, 'lo', { r: 0.3, thin: true })));
		out.push(dots([[sign.x + 3, sf, top + 23], [sign.x + sign.w - 3, sf, top + 23], [sign.x + 3, sf, top + 16], [sign.x + sign.w - 3, sf, top + 16]], 0.4));
		return out.join('');
	}

	function press() {
		const out = [halo(PRESS, C, PRESS_H, 2)];
		out.push(S(k.slabOf({ x: PRESS.x - 3, y: PRESS.y - 3, w: PRESS.w + 6, d: PRESS.d + 3, r: 2 }, C, 3, P, 4, 0.5), { tone: 'lo' }));
		out.push(S(k.slabOf(PRESS, C + 3, PRESS_H - 3, P, 4, 0.6), { tone: 'mid', inner: L(k.sideSeam(PRESS, C + 11, P, 4), { tone: 'faint' }) + L(k.sideSeam(PRESS, C + 19, P, 4), { tone: 'faint' }) }));
		const f = PRESS_F;
		// the feed slot the ticket slides into
		out.push(slab(SLOT_X - 2, f, TK_W + 4, 0.6, C, 4, 'lo', { r: 0.3, thin: true }));
		out.push(seg([SLOT_X - 2, f + 0.6, C + 4], [SLOT_X + TK_W + 2, f + 0.6, C + 4], 'mid'));
		out.push(slab(SLOT_X - 6, f, 3, 1.6, C + 3, 3, 'hi', { r: 0.3, thin: true }), slab(SLOT_X + TK_W + 3, f, 3, 1.6, C + 3, 3, 'hi', { r: 0.3, thin: true }));
		// date window with wheel digits
		out.push(slab(PRESS.x + 6, f, 32, 0.6, C + 12, 8, 'lo', { r: 0.6, thin: true }));
		out.push(slab(PRESS.x + 8, f + 0.6, 28, 0.5, C + 13.4, 5.2, 'hi', { r: 0.4, thin: true }));
		out.push(k.faceTextSvg(k.sideMatrix([PRESS.x + 22, f + 1.1], C + 14.6, P, 'left'), '12 · 07', { size: 3.4, tone: 'lo', anchor: 'middle' }));
		out.push(...[PRESS.x + 12, PRESS.x + 31].map((x) => cyl(x, f + 1.2, 1.5, C + 21, 1, 'hi', 0.15)));
		out.push(dots([[PRESS.x + 3, f, C + 6], [PRESS.x + PRESS.w - 3, f, C + 6], [PRESS.x + 3, f, C + PRESS_H - 3], [PRESS.x + PRESS.w - 3, f, C + PRESS_H - 3]], 0.45));
		for (const z of [C + 10, C + 22]) out.push(seg([PRESS.x + 1, f, z], [PRESS.x + PRESS.w - 1, f, z], 'faint'));
		// side face: cast ribs and a ticket bin
		const rx = PRESS.x + PRESS.w;
		for (const dy of [4, 9, 14, 19]) out.push(seg([rx, PRESS.y + dy, C + 5], [rx, PRESS.y + dy, C + PRESS_H - 3], 'faint'));
		out.push(slab(rx, PRESS.y + 3, 5, 18, C + 3, 5, 'lo', { r: 0.5, thin: true }));
		out.push(dots([[rx, PRESS.y + 5, C + 22], [rx, PRESS.y + 19, C + 22]], 0.45));
		// head: top housing and the die
		const top = C + PRESS_H;
		const head: Plan = { x: PRESS.x + 4, y: PRESS.y + 3, w: 34, d: 18, r: 3 };
		out.push(halo(head, top, 12));
		out.push(S(k.slabOf(head, top, 12, P, 4, 0.8), { tone: 'mid', inner: L(k.sideSeam(head, top + 6, P, 4), { tone: 'faint' }) }));
		out.push(L(k.planOutline(k.insetPlan(head, 2.4), top + 12, P), { tone: 'faint' }));
		out.push(...k.corners(head, 4).map(([x, y]) => cyl(x, y, 1.1, top + 12, 0.9, 'hi', 0.15)));
		out.push(L(k.knurl(SPINDLE[0], SPINDLE[1], 4.6, top + 12, top + 15, 18, P, 0.4), { tone: 'lo' }));
		out.push(cyl(SPINDLE[0], SPINDLE[1], 4.6, top + 12, 3, 'mid', 0.4), cyl(SPINDLE[0], SPINDLE[1], 2.2, top + 15, LEVER_Z - 3 - top - 15, 'mid', 0.2));
		out.push(slab(head.x + head.w - 8, head.y + 2.5, 5, 5, top + 12, 0.8, 'lo', { thin: true, r: 0.8 }), dots([[head.x + head.w - 5.5, head.y + 5, top + 12.8]], 0.4));
		const lamp: Plane = [head.x + head.w - 10, head.y + head.d - 5];
		out.push(cyl(lamp[0], lamp[1], 2.4, top + 12, 1.8, 'mid', 0.2), stepSvg('lit-at', 4, cyl(lamp[0], lamp[1], 1.8, top + 13.8, 1.6, 'hi', 0.2, true)));
		return out.join('');
	}

	function lever() {
		const [sx, sy] = SPINDLE;
		const z = LEVER_Z;
		return (
			cyl(sx, sy, 3.2, z - 3, 3, 'mid', 0.3) +
			slab(sx - 2, sy - 1.8, 38, 3.6, z - 0.4, 3, 'mid', { r: 1.2, steps: 3 }) +
			L(k.lineOnTop([sx + 4, sy], [sx + 32, sy], z + 2.6, P), { tone: 'faint', free: true }) +
			cyl(sx + 36, sy, 3.6, z - 3.4, 9, 'hi', 0.6) +
			L(k.ring(sx + 36, sy, 2.2, z + 5.6, P, 12), { tone: 'mid' }) +
			dots([[sx, sy, z + 2.6]], 0.5, 'hi')
		);
	}

	function coinAt(cx: number, cy: number, z: number, tone: 'hi' | 'mid' = 'hi') {
		return S(k.cylinder(cx, cy, COIN_R, z, COIN_H, P, 32, 0.5), { tone }) + L(k.knurl(cx, cy, COIN_R, z, z + COIN_H, 32, P, 0.3), { tone: 'lo' }) + L(k.ring(cx, cy, COIN_R - 2.6, z + COIN_H, P, 28), { tone: 'mid' });
	}
	function stack() {
		const [cx, cy] = STACK;
		const out = [halo({ x: cx - 11, y: cy - 11, w: 22, d: 22, r: 11 }, C, 1, 2), cyl(cx, cy, 11, C, 1.2, 'lo', 0.4)];
		for (let i = 0; i < STACK_N; i++) out.push(coinAt(cx, cy, C + 1.2 + i * COIN_H, 'mid'));
		return out.join('');
	}
	function tray() {
		const out = [halo(TRAY, C, 3, 2)];
		out.push(S(k.slabOf(TRAY, C, 1.6, P, 4, 0.4), { tone: 'lo', inner: L(k.sideSeam(TRAY, C + 0.8, P, 4), { tone: 'faint' }) }));
		out.push(slab(TRAY.x, TRAY.y, TRAY.w, 1.6, C + 1.6, 1.6, 'mid', { r: 0.3, thin: true }), slab(TRAY.x, TRAY.y, 1.6, TRAY.d, C + 1.6, 1.6, 'mid', { r: 0.3, thin: true }), slab(TRAY.x + TRAY.w - 1.6, TRAY.y, 1.6, TRAY.d, C + 1.6, 1.6, 'mid', { r: 0.3, thin: true }));
		out.push(L(k.planOutline(k.insetPlan(TRAY, 3.4), C + 1.6, P), { tone: 'faint' }));
		for (const dx of [-12, 12]) out.push(L(k.ring(TRAY_AT[0] + dx, TRAY_AT[1], 5, C + 1.6, P, 20), { tone: 'faint' }));
		out.push(L(k.ring(TRAY_AT[0], TRAY_AT[1], COIN_R - 1, C + 1.6, P, 28), { tone: 'lo' }));
		out.push(dots([[TRAY.x + 3, TRAY.y + 3, C + 3.2], [TRAY.x + TRAY.w - 3, TRAY.y + 3, C + 3.2]], 0.4));
		out.push(slab(TRAY.x + 6, TRAY.y + TRAY.d, 34, 0.8, C, 3, 'lo', { r: 0.3, thin: true }));
		out.push(k.faceTextSvg(k.topMatrix([TRAY.x + 40, TRAY.y + 8], C + 1.6, P, 'x'), '1', { size: 5, tone: 'lo', anchor: 'middle' }));
		return out.join('');
	}

	const z3: Point3 = [0, 0, 0];
	const tx = tkX(PICK.col);
	const pressDx = SLOT_X - tx;
	const pressDy = PRESS_F - 2 - (TK_Y + SLIDE);
	const ticketSlide: Point3 = [0, SLIDE, 0];
	const ticketPress: Point3 = [pressDx, SLIDE + pressDy, 0];
	const coinFrom: Point3 = [STACK[0], STACK[1], C + 1.2 + STACK_N * COIN_H];
	const coinTo: Point3 = [TRAY_AT[0] - STACK[0], TRAY_AT[1] - STACK[1], C + 1.6 + COIN_H - coinFrom[2]];

	const swing = (deg: number) => {
		const [ax, ay] = [k.axisVector(P, [1, 0, 0]), k.axisVector(P, [0, 1, 0])];
		const det = ax[0] * ay[1] - ay[0] * ax[1];
		const th = (deg * Math.PI) / 180;
		const R = [Math.cos(th), -Math.sin(th), Math.sin(th), Math.cos(th)];
		const Ai = [ay[1] / det, -ay[0] / det, -ax[1] / det, ax[0] / det];
		const mul = (a: number[], b: number[]) => [a[0] * b[0] + a[1] * b[2], a[0] * b[1] + a[1] * b[3], a[2] * b[0] + a[3] * b[2], a[2] * b[1] + a[3] * b[3]];
		const M = mul([ax[0], ay[0], ax[1], ay[1]], mul(R, Ai));
		const [px, py] = at([SPINDLE[0], SPINDLE[1], LEVER_Z]);
		const f = (v: number) => Math.round(v * 10000) / 10000;
		return `matrix(${f(M[0])} ${f(M[2])} ${f(M[1])} ${f(M[3])} ${f(px - M[0] * px - M[1] * py)} ${f(py - M[2] * px - M[3] * py)})`;
	};

	const transforms = {
		...transformsFrom(P, {
			ticket: [z3, ticketSlide, ticketSlide, ticketPress],
			coin: [z3, z3, coinTo, coinTo],
		}),
		lever: [swing(0), swing(0), swing(0), swing(-52)],
	};

	const ticketMover = ticket(tx, TK_Y, tkRowZ(PICK.row), 'hi', 4);
	const stampOnTicket = stepSvg(
		'show-from',
		4,
		(() => {
			const cx = tx + 8.5;
			const cy = TK_Y + 12;
			const z = tkRowZ(PICK.row) + TK_T;
			return L(k.ring(cx, cy, 5, z, P, 24), { tone: 'lit' }) + L(k.ring(cx, cy, 3.2, z, P, 20), { tone: 'lit' }) + L(k.lineOnTop([cx - 3, cy], [cx + 3, cy], z, P), { tone: 'lit', free: true });
		})(),
	);

	const order: [Plane, () => string][] = [
		[[0, 0], counter],
		[[RX + RACK_W / 2, RY + RD / 2], rack],
		[[STACK[0], STACK[1]], stack],
		[[TRAY_AT[0], TRAY_AT[1]], tray],
		[[PRESS.x + PRESS.w / 2, PRESS.y + PRESS.d / 2], press],
	];
	const scene = order.slice(1).sort((a, b) => k.depthOf([a[0][0], a[0][1], 0], P) - k.depthOf([b[0][0], b[0][1], 0], P));

	const svg = k.figureSvg({
		width,
		height,
		label:
			'A box-office counter: a pigeonhole rack of class tickets in rows and seat slots, a coin tray with a stack of coins, and a brass ticket dating press with a lever. One ticket is pulled from its slot, a coin is dropped in the tray, and the ticket is slid into the press, stamped with the date, and the seat lamp lights.',
		body: [
			bench(),
			counter(),
			...scene.map(([, draw]) => draw()),
			moverSvg('coin', transforms.coin[3], coinAt(coinFrom[0], coinFrom[1], coinFrom[2])),
			moverSvg('ticket', transforms.ticket[3], ticketMover + stampOnTicket),
			moverSvg('lever', transforms.lever[3], lever()),
		],
	});
	return { svg, labels: LABELS, transforms };
}
