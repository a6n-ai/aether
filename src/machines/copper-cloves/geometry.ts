import * as k from '../../lib/anatomy/iso-kit';
import type { Plan, Plane, Point3 } from '../../lib/anatomy/iso-kit';
import { moverSvg, stepSvg, transformsFrom, type Machine } from '../../lib/plate';

export const LABELS = ['member buys a pass', 'books a class', 'scans at the door', 'class, cafe and shop'] as const;
export const CAPTION = 'Members buy a pass, book a class and scan in at the door. The cafe and shop live in the same app.';

const BENCH: Plan = { x: -150, y: -72, w: 300, d: 132, r: 8 };
const BENCH_H = 12;
const FOOT_H = 6;

// card rack: a comb on a stand, open at the +x end so a card can leave sideways
const RX = -138;
const RY = -62;
const RD = 20;
const STAND_H = 11;
const CARD_Z = STAND_H + 2;
const PITCH = 14;
const SLOTS = 4;
const CARD_W = 12;
const CARD_D = 0.8;
const CARD_H = 22;
const CARD_Y = RY + 10;
const cardX = (i: number) => RX + 1.4 + i * PITCH + (PITCH - 1.4 - CARD_W) / 2;

// time clock
const CLOCK: Plan = { x: 40, y: -62, w: 44, d: 24, r: 2 };
const CLOCK_F = CLOCK.y + CLOCK.d;
const BODY_TOP = 40;
const CARD_AT_CLOCK: Plane = [CLOCK.x + CLOCK.w / 2 - CARD_W / 2, CLOCK_F + 2];

// class board with its booking desk
const DESK: Plan = { x: -128, y: -8, w: 160, d: 22, r: 2 };
const DESK_H = 6;
const SLOT_XS = [-66, -40, -14, 12];
const SLOT_Y = 4;
const PEG_FROM: Plane = [-108, SLOT_Y];
const TRAY: Plan = { x: -128, y: -8, w: 40, d: 22, r: 2 };

// turnstile and the three doors
const HINGE: Plane = [92, -14];
const ARM_Z = 22;
const ARM_LEN = 24;
const DOOR_X = 136;
const DOORS: { name: string; y: number }[] = [
	{ name: 'class', y: -44 },
	{ name: 'cafe', y: -12 },
	{ name: 'shop', y: 20 },
];

export function copperCloves(width = 720, height = 480): Machine {
	const P = k.fitProjection(
		[...k.boxCorners(BENCH, -BENCH_H - FOOT_H, 0), [CLOCK.x, CLOCK.y, 78], [-140, -62, 36], [DOOR_X + 12, 20, 46]],
		width,
		height,
		{ pad: 22, azimuth: 40 },
	);
	const at = (p: Point3) => k.iso(p, P);
	const S = k.solidSvg;
	const L = k.lineSvg;
	const D = k.dotsSvg;
	const depth = (x: number, y: number) => k.depthOf([x, y, 0], P);
	const byDepth = (points: Plane[]) => [...points].sort((a, b) => depth(a[0], a[1]) - depth(b[0], b[1]));
	const dots = (pts: Point3[], size = 0.45, tone: 'hi' | 'mid' | 'lo' | 'faint' = 'mid') => D(pts.map(at), { size, tone });
	const halo = (plan: Plan, z: number, h: number, blur = 0) => `<path class="iso-halo" d="${k.haloOf(plan, z, h, P)}"${blur ? ` style="filter:blur(${blur}px)"` : ''}/>`;
	const slab = (x: number, y: number, w: number, d: number, z: number, h: number, tone: 'hi' | 'mid' | 'lo' = 'mid', o: { r?: number; steps?: number; bevel?: number; thin?: boolean; seam?: number; lit?: boolean } = {}) => {
		const plan: Plan = { x, y, w, d, r: o.r ?? 0.5 };
		const inner = o.seam ? L(k.sideSeam(plan, o.seam, P, o.steps ?? 3), { tone: 'faint' }) : '';
		return S(k.slabOf(plan, z, h, P, o.steps ?? 2, o.bevel ?? 0.2), { tone, crease: o.thin ? 'none' : 'faint', inner, lit: o.lit });
	};
	const cyl = (cx: number, cy: number, r: number, z: number, h: number, tone: 'hi' | 'mid' | 'lo' = 'mid', bevel = 0.3, lit = false) => S(k.cylinder(cx, cy, r, z, h, P, r > 5 ? 28 : 16, bevel), { tone, lit });
	const seg = (a: Point3, b: Point3, tone: 'mid' | 'lo' | 'faint' = 'mid') => L(k.segment(a, b, P), { tone, free: true });
	const flat = (a: Plane, b: Plane, z: number, tone: 'mid' | 'lo' | 'faint' = 'faint') => L(k.lineOnTop(a, b, z, P), { tone, free: true });

	function bench() {
		const out = [halo(BENCH, -BENCH_H - FOOT_H, BENCH_H)];
		for (const [x, y] of byDepth(k.corners(BENCH, 24))) out.push(cyl(x, y, 8, -BENCH_H - FOOT_H, 1.8, 'lo', 0.4), cyl(x, y, 6, -BENCH_H - FOOT_H + 1.8, FOOT_H - 1.8, 'mid', 0.3));
		out.push(S(k.slabOf(BENCH, -BENCH_H, BENCH_H, P, 8, 1.6), { tone: 'mid', inner: L(k.sideSeam(BENCH, -BENCH_H / 2, P), { tone: 'faint' }) }));
		out.push(L(k.planOutline(k.insetPlan(BENCH, 5), 0, P), { tone: 'lo' }));
		const screws = k.corners(BENCH, 11);
		out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(''), { tone: 'lo' }), dots(screws.map(([x, y]) => [x, y, 0] as Point3), 0.5));
		for (const [x, y] of screws) out.push(flat([x - 1.3, y], [x + 1.3, y], 0));
		const strip: Plan = { x: -126, y: BENCH.y + BENCH.d - 7, w: 170, d: 5, r: 1 };
		out.push(slab(strip.x, strip.y, strip.w, strip.d, 0, 0.6, 'lo', { thin: true, steps: 3 }));
		const tk = k.topTicks(strip.x + 4, strip.x + strip.w - 4, 4, 5, strip.y + 0.6, 0.6, [1.6, 3], P);
		out.push(L(tk.minor, { tone: 'lo' }), L(tk.major, { tone: 'mid' }));
		const label: Plan = { x: 56, y: BENCH.y + BENCH.d - 11, w: 40, d: 8, r: 1.5 };
		out.push(slab(label.x, label.y, label.w, label.d, 0, 0.8, 'lo', { steps: 3 }));
		for (const dy of [2.5, 5.2]) out.push(flat([label.x + 5, label.y + dy], [label.x + label.w - (dy > 5 ? 16 : 5), label.y + dy], 0.8));
		return out.join('');
	}

	function card(x: number, y: number, z: number, tone: 'hi' | 'mid', n: number) {
		const f = y + CARD_D;
		const out = [slab(x, y, CARD_W, CARD_D, z, CARD_H, tone, { r: 0.5, thin: true })];
		out.push(seg([x + 1.4, f, z + CARD_H - 4], [x + CARD_W - 1.4, f, z + CARD_H - 4], 'mid'), seg([x + 1.4, f, z + CARD_H - 6.6], [x + 6 + (n % 3) * 1.6, f, z + CARD_H - 6.6], 'faint'));
		out.push(dots([[x + 3, f, z + 8], [x + 6, f, z + 8], [x + 9, f, z + 8], [x + 3, f, z + 5], [x + 9, f, z + 5], [x + 6, f, z + 2.4]], 0.4, 'lo'));
		out.push(seg([x + 1, f, z + CARD_H - 9], [x + CARD_W - 1, f, z + CARD_H - 9], 'faint'));
		return out.join('');
	}

	function rack() {
		const W = SLOTS * PITCH + 1.4;
		const stand: Plan = { x: RX - 2, y: RY, w: W + 2, d: RD, r: 2 };
		const out = [halo(stand, 0, STAND_H, 3)];
		out.push(S(k.slabOf(stand, 0, STAND_H, P, 4, 0.8), { tone: 'mid', inner: L(k.sideSeam(stand, 4, P, 4), { tone: 'faint' }) }));
		out.push(slab(RX - 2, RY - 1, W + 2, RD + 3, STAND_H - 1, 3, 'lo', { r: 2, steps: 4 }));
		out.push(L(k.planOutline(k.insetPlan(stand, 3), STAND_H + 2, P), { tone: 'faint' }));
		out.push(slab(RX, RY, W, 2, CARD_Z, 14, 'lo', { r: 0.3, thin: true }));
		const f = RY + RD;
		for (let i = 0; i < SLOTS; i++) {
			out.push(slab(RX + i * PITCH, RY + 2, 1.4, RD - 2, CARD_Z, 12, 'mid', { r: 0.3, thin: true }));
			out.push(...(i < SLOTS - 1 ? [card(cardX(i), CARD_Y, CARD_Z, 'mid', i)] : []));
			out.push(seg([RX + 1.4 + i * PITCH + 2, f, CARD_Z - 1], [RX + 1.4 + i * PITCH + PITCH - 3.4, f, CARD_Z - 1], 'faint'));
		}
		out.push(...[0, 1, 2, 3].map((i) => dots([[cardX(i) + 6, f, STAND_H - 4]], 0.5, 'hi')));
		const lab = slab(RX + 4, f, W - 10, 0.8, 2, 6, 'hi', { r: 0.4, thin: true });
		out.push(lab, seg([RX + 8, f + 0.8, 5.6], [RX + 34, f + 0.8, 5.6], 'mid'), seg([RX + 8, f + 0.8, 3.4], [RX + 24, f + 0.8, 3.4], 'faint'));
		out.push(dots([[RX + 2, f, 2], [RX + W - 4, f, 2], [RX + 2, f, STAND_H - 3], [RX + W - 4, f, STAND_H - 3]], 0.45));
		return out.join('');
	}

	function peg(x: number, y: number, tone: 'hi' | 'mid') {
		return cyl(x, y, 2, DESK_H, 9, tone, 0.3) + cyl(x, y, 3.2, DESK_H + 9, 2.2, tone, 0.5) + L(k.ring(x, y, 1.6, DESK_H + 11.2, P, 12), { tone: 'faint' });
	}

	function desk() {
		const out = [halo(DESK, 0, DESK_H, 3)];
		out.push(S(k.slabOf(DESK, 0, DESK_H, P, 4, 0.8), { tone: 'mid', inner: L(k.sideSeam(DESK, 3, P, 4), { tone: 'faint' }) }));
		out.push(L(k.planOutline(k.insetPlan(DESK, 3), DESK_H, P), { tone: 'faint' }));
		// tray: lips on three sides, open towards the board's slots
		out.push(slab(TRAY.x, TRAY.y, TRAY.w, 1.6, DESK_H, 2.2, 'lo', { r: 0.3, thin: true }), slab(TRAY.x, TRAY.y, 1.6, TRAY.d, DESK_H, 2.2, 'lo', { r: 0.3, thin: true }), slab(TRAY.x, TRAY.y + TRAY.d - 1.6, TRAY.w, 1.6, DESK_H, 2.2, 'lo', { r: 0.3, thin: true }));
		const ps: Plane[] = [PEG_FROM, [-120, SLOT_Y], [-114, SLOT_Y - 4]];
		for (const [x, y] of ps) out.push(L(k.ring(x, y, 3.6, DESK_H, P, 16), { tone: 'lo' }));
		// board
		const board: Plan = { x: -84, y: -10, w: 112, d: 3, r: 1 };
		out.push(halo(board, DESK_H, 36, 2), slab(board.x, board.y, board.w, board.d, DESK_H, 36, 'lo', { r: 1 }));
		out.push(slab(board.x - 3, board.y - 1, 5, 6, DESK_H, 40, 'mid', { r: 1 }), slab(board.x + board.w - 2, board.y - 1, 5, 6, DESK_H, 40, 'mid', { r: 1 }));
		out.push(slab(board.x - 3, board.y - 1, board.w + 6, 5, DESK_H + 36, 4, 'mid', { r: 1 }));
		const bf = board.y + board.d;
		out.push(L(k.planOutline(k.insetPlan({ x: board.x - 3, y: board.y - 1, w: board.w + 6, d: 5, r: 1 }, 1), DESK_H + 40, P), { tone: 'faint' }));
		SLOT_XS.forEach((sx, i) => {
			out.push(slab(sx - 11, bf, 22, 1, DESK_H + 17, 16, 'hi', { r: 0.4, thin: true }));
			out.push(seg([sx - 8, bf + 1, DESK_H + 29.6], [sx + 8, bf + 1, DESK_H + 29.6], 'mid'), seg([sx - 8, bf + 1, DESK_H + 26.6], [sx + 3 - (i % 2) * 4, bf + 1, DESK_H + 26.6], 'faint'));
			out.push(...[0, 1, 2].map((j) => dots([[sx - 6 + j * 6, bf + 1, DESK_H + 21.4]], 0.5, i === 0 ? 'hi' : 'lo')));
			out.push(slab(sx - 3, bf, 6, 0.8, DESK_H + 10, 5, 'lo', { r: 0.3, thin: true }));
			out.push(L(k.ring(sx, SLOT_Y, 3.6, DESK_H, P, 16), { tone: 'lo' }), cyl(sx, SLOT_Y, 2.6, DESK_H, 0.5, 'lo', 0.1));
		});
		out.push(dots([[board.x + 2, bf, DESK_H + 33], [board.x + board.w - 2, bf, DESK_H + 33], [board.x + 2, bf, DESK_H + 4], [board.x + board.w - 2, bf, DESK_H + 4]], 0.45));
		const rx = DESK.x + DESK.w;
		for (const dy of [3, 8, 13, 18]) out.push(seg([rx, DESK.y + dy, 1.2], [rx, DESK.y + dy, DESK_H - 1.2], 'faint'));
		// static pegs: classes already booked
		out.push(peg(SLOT_XS[1], SLOT_Y, 'mid'), peg(SLOT_XS[2], SLOT_Y, 'mid'));
		out.push(peg(-120, SLOT_Y, 'mid'), peg(-114, SLOT_Y - 4, 'mid'));
		return out.join('');
	}

	function clock() {
		const out = [halo(CLOCK, 0, BODY_TOP, 3)];
		out.push(S(k.slabOf({ x: CLOCK.x - 3, y: CLOCK.y - 2, w: CLOCK.w + 6, d: CLOCK.d + 5, r: 2 }, 0, 4, P, 4, 0.5), { tone: 'lo' }));
		out.push(S(k.slabOf(CLOCK, 4, BODY_TOP - 4, P, 4, 0.7), { tone: 'mid', inner: L(k.sideSeam(CLOCK, 14, P, 4), { tone: 'faint' }) + L(k.sideSeam(CLOCK, 38, P, 4), { tone: 'faint' }) }));
		const f = CLOCK_F;
		const cx = CLOCK.x + CLOCK.w / 2;
		// card pocket
		out.push(slab(cx - 12, f, 24, 0.6, 9, 29, 'lo', { r: 0.6, thin: true }));
		out.push(slab(cx - 10, f + 0.6, 1.2, 0.8, 11, 25, 'hi', { r: 0.2, thin: true }), slab(cx + 8.8, f + 0.6, 1.2, 0.8, 11, 25, 'hi', { r: 0.2, thin: true }));
		out.push(slab(cx - 10, f, 20, 6, CARD_Z - 2, 2, 'hi', { r: 0.6 }));
		out.push(slab(cx - 10, f + 4.4, 20, 1.6, CARD_Z, 1.6, 'hi', { r: 0.3, thin: true }));
		out.push(seg([cx - 9, f + 0.6, 36.4], [cx + 9, f + 0.6, 36.4], 'mid'), dots([[cx - 11, f, 8], [cx + 11, f, 8], [cx - 11, f, 36], [cx + 11, f, 36]], 0.45));
		for (const z of [6, 38.4]) out.push(seg([CLOCK.x + 1, f, z], [CLOCK.x + CLOCK.w - 1, f, z], 'faint'));
		// side face: ribs and a brass plate
		const rx = CLOCK.x + CLOCK.w;
		for (const dy of [4, 8, 12, 16, 20]) out.push(seg([rx, CLOCK.y + dy, 8], [rx, CLOCK.y + dy, 34], 'faint'));
		out.push(slab(rx, CLOCK.y + 5, 0.9, 14, 20, 8, 'hi', { r: 0.3, thin: true }), seg([rx + 0.9, CLOCK.y + 8, 24.6], [rx + 0.9, CLOCK.y + 16, 24.6], 'mid'), seg([rx + 0.9, CLOCK.y + 8, 22.4], [rx + 0.9, CLOCK.y + 13, 22.4], 'faint'));
		// dial housing
		const head: Plan = { x: CLOCK.x + 2, y: CLOCK.y + 2, w: CLOCK.w - 4, d: CLOCK.d - 4, r: 3 };
		out.push(halo(head, BODY_TOP, 32));
		out.push(S(k.slabOf(head, BODY_TOP, 32, P, 4, 0.8), { tone: 'mid', inner: L(k.sideSeam(head, BODY_TOP + 3, P, 4), { tone: 'faint' }) }));
		const hf = head.y + head.d;
		const dial: Point3 = [cx, hf, BODY_TOP + 16];
		out.push(slab(cx - 17, hf, 34, 0.8, BODY_TOP + 1.6, 28.8, 'lo', { r: 1.2, thin: true }));
		const ringAt = (r: number, extra = 0) => k.pathOf(Array.from({ length: 41 }, (_, i) => at([dial[0] + r * Math.cos((i / 40) * Math.PI * 2), hf + 0.8 + extra, dial[2] + r * Math.sin((i / 40) * Math.PI * 2)])), true);
		out.push(L(ringAt(13.4), { tone: 'mid' }), L(ringAt(12), { tone: 'faint' }));
		const minor: string[] = [];
		const major: string[] = [];
		for (let i = 0; i < 24; i++) {
			const a = (i / 24) * Math.PI * 2;
			const r0 = i % 2 ? 10.8 : 9.4;
			(i % 2 ? minor : major).push(k.segment([dial[0] + r0 * Math.cos(a), hf + 0.8, dial[2] + r0 * Math.sin(a)], [dial[0] + 11.8 * Math.cos(a), hf + 0.8, dial[2] + 11.8 * Math.sin(a)], P));
		}
		out.push(L(minor.join(''), { tone: 'lo' }), L(major.join(''), { tone: 'mid' }));
		out.push(seg([dial[0], hf + 0.8, dial[2]], [dial[0] + 3, hf + 0.8, dial[2] + 7.6], 'mid'), seg([dial[0], hf + 0.8, dial[2]], [dial[0] + 6.4, hf + 0.8, dial[2] - 2.6], 'mid'));
		out.push(dots([[dial[0], hf + 0.8, dial[2]]], 0.8, 'hi'), dots([[cx - 15, hf, BODY_TOP + 29], [cx + 15, hf, BODY_TOP + 29], [cx - 15, hf, BODY_TOP + 4], [cx + 15, hf, BODY_TOP + 4]], 0.45));
		const top = BODY_TOP + 32;
		out.push(L(k.planOutline(k.insetPlan(head, 2.4), top, P), { tone: 'faint' }));
		out.push(cyl(cx - 8, CLOCK.y + 12, 4.4, top, 3, 'mid', 0.6), cyl(cx - 8, CLOCK.y + 12, 2, top + 3, 3.4, 'hi', 0.4), L(k.knurl(cx - 8, CLOCK.y + 12, 4.4, top, top + 3, 16, P, 0.3), { tone: 'lo' }));
		out.push(cyl(cx + 9, CLOCK.y + 12, 2.2, top, 1.8, 'mid', 0.2), cyl(cx + 9, CLOCK.y + 12, 1.2, top + 1.8, 7, 'lo', 0.2));
		return out.join('');
	}

	function turnstile() {
		const [hx, hy] = HINGE;
		const out: string[] = [];
		const plate: Plan = { x: hx - 10, y: hy - 8, w: 20, d: 52, r: 2 };
		out.push(halo(plate, 0, 2, 2), S(k.slabOf(plate, 0, 2, P, 4, 0.4), { tone: 'lo' }), L(k.planOutline(k.insetPlan(plate, 2), 2, P), { tone: 'faint' }));
		out.push(dots(k.corners(plate, 2.6).map(([x, y]) => [x, y, 2] as Point3), 0.45));
		for (let i = 0; i < 6; i++) out.push(flat([hx - 7, hy + 4 + i * 6], [hx + 7, hy + 4 + i * 6], 2, 'faint'));
		const catchY = hy + ARM_LEN + 6;
		out.push(slab(hx - 3.5, catchY - 3.5, 7, 7, 2, 28, 'mid', { r: 0.8 }), slab(hx - 4.5, catchY - 3.5, 1.6, 7, ARM_Z - 1, 6, 'hi', { r: 0.3, thin: true }), slab(hx + 2.9, catchY - 3.5, 1.6, 7, ARM_Z - 1, 6, 'hi', { r: 0.3, thin: true }));
		out.push(cyl(hx, hy, 4.4, 2, 2.4, 'lo', 0.5), cyl(hx, hy, 3.2, 4.4, 27.6, 'mid', 0.4), L(k.knurl(hx, hy, 3.2, 4.4, 32, 14, P, 0.4), { tone: 'lo' }), cyl(hx, hy, 4, 32, 2.4, 'hi', 0.6));
		out.push(slab(hx - 9, hy - 3, 5.6, 6, 22, 12, 'hi', { r: 0.8 }), L(k.lineOnTop([hx - 8, hy], [hx - 5, hy], 34, P), { tone: 'lit', free: true }));
		out.push(slab(hx - 9.4, hy - 2, 0.8, 4, 29, 2.4, 'lo', { r: 0.2, thin: true }));
		return out.join('');
	}

	function arm() {
		const [hx, hy] = HINGE;
		return (
			cyl(hx, hy, 4.6, ARM_Z - 1, 4.4, 'mid', 0.6) +
			slab(hx - 1.8, hy, 3.6, ARM_LEN, ARM_Z, 3, 'mid', { r: 1, steps: 3 }) +
			slab(hx - 2.2, hy + ARM_LEN - 5, 4.4, 5, ARM_Z - 0.5, 4, 'hi', { r: 0.8 }) +
			L(k.lineOnTop([hx, hy + 6], [hx, hy + ARM_LEN - 6], ARM_Z + 3, P), { tone: 'faint', free: true }) +
			dots([[hx, hy, ARM_Z + 5.4]], 0.5, 'hi')
		);
	}

	function door(name: string, y: number) {
		const out: string[] = [];
		const body: Plan = { x: DOOR_X, y: y - 11, w: 10, d: 22, r: 1.5 };
		out.push(halo(body, 0, 36, 2), S(k.slabOf(body, 0, 36, P, 4, 0.6), { tone: 'mid', inner: L(k.sideSeam(body, 28, P, 4), { tone: 'faint' }) }));
		const f = DOOR_X + 10;
		out.push(slab(f, y - 8, 0.8, 16, 2, 25, 'lo', { r: 0.8, thin: true }), slab(f + 0.8, y - 6.4, 0.6, 12.8, 3.6, 22, 'hi', { r: 0.6, thin: true }));
		out.push(cyl(f + 1.8, y + 4.4, 0.9, 12, 0.01 + 1.2, 'hi', 0.1));
		out.push(seg([f + 1.4, y - 3, 22], [f + 1.4, y + 3, 22], 'faint'), seg([f + 1.4, y - 3, 8], [f + 1.4, y + 3, 8], 'faint'));
		out.push(dots([[f + 0.8, y - 9.4, 4], [f + 0.8, y + 9.4, 4]], 0.4));
		out.push(slab(f, y - 11, 0.8, 22, 29, 7, 'hi', { r: 0.6, thin: true }));
		out.push(slab(f + 0.8, y - 4.4, 1.2, 8.8, 30.6, 3.8, 'mid', { r: 0.6, thin: true }), stepSvg('lit-at', 4, slab(f + 1.2, y - 3.4, 1.2, 6.8, 31.2, 2.6, 'hi', { r: 0.5, thin: true, lit: true })));
		// the sign on the roof says what is behind the door
		if (name === 'class') out.push(slab(DOOR_X + 1, y - 9, 8, 4, 36, 2, 'hi', { r: 0.8, thin: true }), cyl(DOOR_X + 5, y + 6, 2.2, 36, 6, 'hi', 0.5), L(k.ring(DOOR_X + 5, y + 6, 1.4, 42, P, 12), { tone: 'faint' }));
		if (name === 'cafe') out.push(cyl(DOOR_X + 5, y - 5, 3, 36, 5, 'hi', 0.5), slab(DOOR_X + 7.6, y - 5.8, 2, 1.6, 38, 2, 'hi', { r: 0.3, thin: true }), L(k.ring(DOOR_X + 5, y - 5, 2, 41, P, 12), { tone: 'faint' }), cyl(DOOR_X + 5, y + 6, 3.4, 36, 0.8, 'lo', 0.2));
		if (name === 'shop') out.push(slab(DOOR_X + 1.4, y - 9, 7, 8, 36, 7, 'hi', { r: 0.6 }), seg([DOOR_X + 3, y - 5, 43], [DOOR_X + 5, y - 5, 45], 'mid'), seg([DOOR_X + 7, y - 5, 43], [DOOR_X + 5, y - 5, 45], 'mid'));
		return out.join('');
	}

	function wires() {
		const run = k.onTop([[CLOCK.x + 14, CLOCK_F + 1], [CLOCK.x + 14, 4], [HINGE[0] - 12, 4], [HINGE[0] - 12, HINGE[1] + 10]], 0.4, P);
		const doorsRun = k.onTop([[HINGE[0] + 9, HINGE[1] + 10], [DOOR_X - 8, HINGE[1] + 10], [DOOR_X - 8, -44], [DOOR_X + 2, -44]], 0.4, P);
		return L(run, { tone: 'mid' }) + L(doorsRun, { tone: 'mid' }) + dots([[CLOCK.x + 14, CLOCK_F + 1, 0.4], [HINGE[0] - 12, HINGE[1] + 10, 0.4], [DOOR_X + 2, -44, 0.4]], 0.9, 'hi');
	}

	const z3: Point3 = [0, 0, 0];
	const cardTo: Point3 = [CARD_AT_CLOCK[0] - cardX(SLOTS - 1), CARD_AT_CLOCK[1] - CARD_Y, 0];
	const pegTo: Point3 = [SLOT_XS[0] - PEG_FROM[0], SLOT_Y - PEG_FROM[1], 0];

	const swing = (deg: number) => {
		const ax = k.axisVector(P, [1, 0, 0]);
		const ay = k.axisVector(P, [0, 1, 0]);
		const det = ax[0] * ay[1] - ay[0] * ax[1];
		const th = (deg * Math.PI) / 180;
		const R = [Math.cos(th), -Math.sin(th), Math.sin(th), Math.cos(th)];
		const Ai = [ay[1] / det, -ay[0] / det, -ax[1] / det, ax[0] / det];
		const mul = (a: number[], b: number[]) => [a[0] * b[0] + a[1] * b[2], a[0] * b[1] + a[1] * b[3], a[2] * b[0] + a[3] * b[2], a[2] * b[1] + a[3] * b[3]];
		const M = mul([ax[0], ay[0], ax[1], ay[1]], mul(R, Ai));
		const [px, py] = at([HINGE[0], HINGE[1], ARM_Z + 1.5]);
		const f = (v: number) => Math.round(v * 10000) / 10000;
		return `matrix(${f(M[0])} ${f(M[2])} ${f(M[1])} ${f(M[3])} ${f(px - M[0] * px - M[1] * py)} ${f(py - M[2] * px - M[3] * py)})`;
	};

	const transforms = {
		...transformsFrom(P, {
			card: [[0, 0, 9], z3, cardTo, cardTo],
			peg: [z3, pegTo, pegTo, pegTo],
		}),
		arm: [swing(0), swing(0), swing(0), swing(-90)],
	};

	const cx = cardX(SLOTS - 1);
	const stamp = stepSvg(
		'show-from',
		3,
		L(k.ring(cx + 6, CARD_Y + CARD_D, 0.01, CARD_Z, P, 4), { tone: 'lit' }) +
			(() => {
				const ring = (r: number) => k.pathOf(Array.from({ length: 25 }, (_, i) => at([cx + 6 + r * Math.cos((i / 24) * Math.PI * 2), CARD_Y + CARD_D + 0.1, CARD_Z + 14.5 + r * Math.sin((i / 24) * Math.PI * 2)])), true);
				return L(ring(3.8), { tone: 'lit' }) + L(ring(2.4), { tone: 'lit' }) + seg([cx + 3, CARD_Y + CARD_D + 0.1, CARD_Z + 14.5], [cx + 9, CARD_Y + CARD_D + 0.1, CARD_Z + 14.5], 'mid').replace('data-tone="mid"', 'data-tone="lit"');
			})(),
	);

	const statics: [Plane, () => string][] = [
		[[RX + 28, RY + 10], rack],
		[[-48, 3], desk],
		[[CLOCK.x + 22, CLOCK.y + 12], clock],
		[[HINGE[0], HINGE[1] + 20], turnstile],
		...DOORS.map((d) => [[DOOR_X + 5, d.y], () => door(d.name, d.y)] as [Plane, () => string]),
	];
	const scene = statics.sort((a, b) => depth(a[0][0], a[0][1]) - depth(b[0][0], b[0][1]));

	const svg = k.figureSvg({
		width,
		height,
		label:
			'A punch-card time clock beside a card rack and a class board with peg slots, and a swing-arm turnstile leading to three small doors for the class, the cafe and the shop. A pass card is slid into the rack, a peg is set in a class slot, the card is stamped in the clock, and the turnstile arm swings open as the three door lamps light.',
		body: [
			bench(),
			wires(),
			...scene.map(([, draw]) => draw()),
			moverSvg('peg', transforms.peg[3], peg(PEG_FROM[0], PEG_FROM[1], 'hi')),
			moverSvg('card', transforms.card[3], card(cx, CARD_Y, CARD_Z, 'hi', 7) + stamp),
			moverSvg('arm', transforms.arm[3], arm()),
		],
	});
	return { svg, labels: LABELS, transforms };
}
