import * as k from '../../lib/anatomy/iso-kit';
import type { Plan, Plane, Point3 } from '../../lib/anatomy/iso-kit';
import { moverSvg, stepSvg, transformsFrom, type Machine } from '../../lib/plate';

export const LABELS = ['classes on the board', 'family picks a seat', 'pays', 'seat booked'] as const;
export const CAPTION = "Parents see what's on, pick seats for their kids and pay. Staff see every booking in one place.";

const BENCH: Plan = { x: -175, y: -82, w: 350, d: 164, r: 8 };
const BENCH_H = 12;
const FOOT_H = 6;
const DECK: Plan = { x: -150, y: -34, w: 300, d: 114, r: 4 };
const DECK_H = 3;
const BOARD: Plan = { x: -150, y: -78, w: 300, d: 10, r: 1.5 };
const BOARD_TOP = 70;
const SEAT_H = 8;
const SEAT_TOP = DECK_H + SEAT_H + 2;
const ROWS = [-12, 14, 40];
const COLS = [-125, -75, -25, 25, 75, 125];
const LIT: Plane = [-25, 40];
const BOX: Plan = { x: 104, y: 52, w: 42, d: 26, r: 2 };
const BOX_H = 32;
const DISH: Point3 = [58, 70, DECK_H];
const DISH_H = BOX_H - DECK_H - 2.6;
const TOKEN_FROM: Point3 = [-25, 68, DECK_H];
const COIN_TO: Point3 = [125, 62, BOX_H];

export function xplorers(width = 720, height = 480): Machine {
	const P = k.fitProjection(
		[...k.boxCorners(BENCH, -BENCH_H - FOOT_H, 0), [BOARD.x, BOARD.y, BOARD_TOP + 10], [BOARD.x + BOARD.w, BOARD.y, BOARD_TOP + 10]],
		width,
		height,
		{ pad: 22, azimuth: 40 },
	);
	const at = (p: Point3) => k.iso(p, P);
	const S = k.solidSvg;
	const L = k.lineSvg;
	const D = k.dotsSvg;
	const byDepth = (points: Plane[]) => [...points].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));

	function bench() {
		const out = [`<path class="iso-halo" d="${k.haloOf(BENCH, -BENCH_H - FOOT_H, BENCH_H, P)}"/>`];
		for (const [x, y] of byDepth(k.corners(BENCH, 24))) {
			out.push(S(k.cylinder(x, y, 8, -BENCH_H - FOOT_H, 1.8, P, 28), { tone: 'lo' }));
			out.push(S(k.cylinder(x, y, 6, -BENCH_H - FOOT_H + 1.8, FOOT_H - 1.8, P, 28), { tone: 'mid' }));
		}
		out.push(S(k.slabOf(BENCH, -BENCH_H, BENCH_H, P, 8, 1.6), { tone: 'mid', inner: L(k.sideSeam(BENCH, -BENCH_H / 2, P), { tone: 'faint' }) }));
		out.push(L(k.planOutline(k.insetPlan(BENCH, 5), 0, P), { tone: 'lo' }));
		const screws = k.corners(BENCH, 11);
		out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(''), { tone: 'lo' }));
		out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
		const strip: Plan = { x: -150, y: BENCH.y + BENCH.d - 7, w: 190, d: 5, r: 1 };
		out.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: 'lo', crease: 'none' }));
		const ticks = k.topTicks(strip.x + 4, strip.x + strip.w - 4, 4, 5, strip.y + 0.6, 0.6, [1.6, 3], P);
		out.push(L(ticks.minor, { tone: 'lo' }), L(ticks.major, { tone: 'mid' }));
		const label: Plan = { x: 62, y: BENCH.y + BENCH.d - 11, w: 40, d: 8, r: 1.5 };
		out.push(S(k.slabOf(label, 0, 0.8, P, 3), { tone: 'lo' }));
		for (const dy of [2.5, 5.2]) out.push(L(k.lineOnTop([label.x + 5, label.y + dy], [label.x + label.w - (dy > 5 ? 16 : 5), label.y + dy], 0.8, P), { tone: 'faint', free: true }));
		for (const x of [-96, 64]) {
			out.push(S(k.slabOf({ x, y: BENCH.y + BENCH.d, w: 32, d: 2.4, r: 1 }, -9, 3.6, P, 3, 0.4), { tone: 'lo' }));
			out.push(L(k.segment([x + 4, BENCH.y + BENCH.d + 2.4, -7.2], [x + 28, BENCH.y + BENCH.d + 2.4, -7.2], P), { tone: 'faint' }));
		}
		out.push(L([-30, -18, -6, 6, 18, 30].map((y) => k.segment([BENCH.x + BENCH.w, y, -9], [BENCH.x + BENCH.w, y, -3], P)).join(''), { tone: 'lo' }));
		out.push(S(k.slabOf({ x: BENCH.x + BENCH.w, y: -38, w: 0.8, d: 76, r: 0.4 }, -10, 8, P, 2), { tone: 'lo', crease: 'none' }));
		out.push(D([at([BENCH.x + BENCH.w, -42, -6]), at([BENCH.x + BENCH.w, 42, -6])], { size: 0.45 }));
		const spare: Plane = [-162, 28];
		out.push(`<path class="iso-halo" d="${k.haloOf({ x: spare[0] - 8, y: spare[1] - 8, w: 16, d: 16, r: 8 }, 0, 0.1, P)}" style="filter:blur(2px)"/>`);
		for (let i = 0; i < 3; i++) out.push(S(k.cylinder(spare[0], spare[1], 6.4, i * 2.6, 2.6, P, 28, 0.4), { tone: 'hi' }), L(k.ring(spare[0], spare[1], 4, i * 2.6 + 2.6, P, 24), { tone: 'mid' }));
		return out.join('');
	}

	function props() {
		const out: string[] = [];
		const ledge: Plan = { x: BOARD.x + 10, y: BOARD.y + BOARD.d - 2, w: BOARD.w - 20, d: 6, r: 1 };
		out.push(S(k.slabOf(ledge, 0, 5, P, 3, 0.5), { tone: 'mid', inner: L(k.sideSeam(ledge, 2.5, P), { tone: 'faint' }) }));
		out.push(L(k.lineOnTop([ledge.x + 4, ledge.y + 3], [ledge.x + ledge.w - 4, ledge.y + 3], 5, P), { tone: 'faint' }));
		out.push(D([at([ledge.x + 3, ledge.y + 1.5, 5]), at([ledge.x + ledge.w - 3, ledge.y + 1.5, 5])], { size: 0.4 }));
		const lamp: Plane = [-118, -50];
		out.push(`<path class="iso-halo" d="${k.haloOf({ x: lamp[0] - 8, y: lamp[1] - 8, w: 16, d: 16, r: 8 }, 0, 0.1, P)}" style="filter:blur(2px)"/>`);
		out.push(S(k.cylinder(lamp[0], lamp[1], 7, 0, 2, P, 28, 0.5), { tone: 'mid' }));
		out.push(S(k.cylinder(lamp[0], lamp[1], 1.2, 2, 18, P, 12), { tone: 'mid' }));
		out.push(L(k.segment([lamp[0], lamp[1], 20], [lamp[0] + 9, lamp[1], 23], P), { tone: 'mid' }));
		out.push(S(k.cylinder(lamp[0] + 10, lamp[1], 5, 20, 5, P, 28, 0.5), { tone: 'hi' }));
		out.push(L(k.ring(lamp[0] + 10, lamp[1], 3, 25, P, 20), { tone: 'mid' }));
		const cup: Plane = [-62, -52];
		out.push(`<path class="iso-halo" d="${k.haloOf({ x: cup[0] - 8, y: cup[1] - 8, w: 16, d: 16, r: 8 }, 0, 0.1, P)}" style="filter:blur(2px)"/>`);
		out.push(S(k.cylinder(cup[0], cup[1], 5.4, 0, 10, P, 28, 0.5), { tone: 'mid' }));
		out.push(L(k.ring(cup[0], cup[1], 5.4, 6, P, 28), { tone: 'faint' }));
		for (const [dx, dy, h] of [[-1.8, -1, 18], [1.6, 0.6, 16], [0, 2, 14.5]] as const) out.push(S(k.cylinder(cup[0] + dx, cup[1] + dy, 0.9, 6, h - 6, P, 8), { tone: 'hi' }));
		const clock: Plane = [20, -52];
		out.push(`<path class="iso-halo" d="${k.haloOf({ x: clock[0] - 12, y: clock[1] - 12, w: 24, d: 24, r: 12 }, 0, 0.1, P)}" style="filter:blur(3px)"/>`);
		out.push(S(k.cylinder(clock[0], clock[1], 10, 0, 3, P, 40, 0.6), { tone: 'mid' }));
		out.push(S(k.cylinder(clock[0], clock[1], 8, 3, 0.8, P, 40), { tone: 'hi' }));
		const tk = k.radialTicks(clock[0], clock[1], 7.2, 36, 3, 3.8, [0.8, 1.6], P);
		out.push(L(tk.minor, { tone: 'lo' }), L(tk.major, { tone: 'mid' }));
		out.push(L(k.lineOnTop([clock[0], clock[1]], [clock[0] + 1.5, clock[1] - 4.6], 3.8, P) + k.lineOnTop([clock[0], clock[1]], [clock[0] + 5, clock[1] + 1], 3.8, P), { tone: 'lo', free: true }));
		out.push(D([at([clock[0], clock[1], 3.8])], { size: 0.5 }));
		const bell: Plane = [92, -52];
		out.push(`<path class="iso-halo" d="${k.haloOf({ x: bell[0] - 9, y: bell[1] - 9, w: 18, d: 18, r: 9 }, 0, 0.1, P)}" style="filter:blur(2px)"/>`);
		out.push(S(k.cylinder(bell[0], bell[1], 8, 0, 2, P, 32, 0.5), { tone: 'mid' }));
		out.push(S(k.cylinder(bell[0], bell[1], 6, 2, 3.5, P, 32, 0.8), { tone: 'hi' }));
		out.push(S(k.cylinder(bell[0], bell[1], 1.6, 5.5, 2.6, P, 16, 0.4), { tone: 'mid' }));
		out.push(L(k.knurl(bell[0], bell[1], 6, 2, 5.5, 32, P, 0.5), { tone: 'lo' }));
		return out.join('');
	}

	function board() {
		const out = [`<path class="iso-halo" d="${k.haloOf(BOARD, 0, BOARD_TOP, P)}"/>`];
		const panel: Plan = { x: BOARD.x + 10, y: BOARD.y + 2, w: BOARD.w - 20, d: 6, r: 1 };
		out.push(S(k.slabOf(panel, 4, BOARD_TOP - 4, P, 3, 0.5), { tone: 'lo' }));
		for (const x of [BOARD.x, BOARD.x + BOARD.w - 14]) out.push(S(k.slabOf({ x, y: BOARD.y, w: 14, d: BOARD.d, r: 1.5 }, 0, BOARD_TOP, P, 3, 0.6), { tone: 'mid' }));
		const rail: Plan = { x: BOARD.x, y: BOARD.y - 2, w: BOARD.w, d: 14, r: 2 };
		out.push(S(k.slabOf(rail, BOARD_TOP, 8, P, 3, 0.8), { tone: 'mid' }));
		const fy = panel.y + panel.d;
		const tabs = [-108, -52, 4, 60, 116];
		tabs.forEach((x, i) => {
			const h = [30, 36, 26, 34, 30][i];
			const tab: Plan = { x: x - 18, y: fy, w: 36, d: 2.4, r: 0.6 };
			out.push(L(k.segment([x - 4, fy, BOARD_TOP], [x - 4, fy, BOARD_TOP - 8], P) + k.segment([x + 4, fy, BOARD_TOP], [x + 4, fy, BOARD_TOP - 8], P), { tone: 'mid' }));
			out.push(S(k.slabOf(tab, BOARD_TOP - 8 - h, h, P, 2, 0.4), { tone: 'hi' }));
			const tf = fy + tab.d;
			for (let j = 0; j < 3; j++) out.push(L(k.segment([tab.x + 5, tf, BOARD_TOP - 8 - 8 - j * 7], [tab.x + tab.w - 5 - (j === 2 ? 12 : 0), tf, BOARD_TOP - 8 - 8 - j * 7], P), { tone: 'faint' }));
			out.push(D([at([tab.x + 3, tf, BOARD_TOP - 8 - 3])], { size: 0.4 }));
			out.push(S(k.slabOf({ x: tab.x + tab.w - 11, y: tf, w: 8, d: 0.8, r: 0.3 }, BOARD_TOP - 8 - h + 3, 5, P, 2), { tone: 'lo', crease: 'none' }));
		});
		out.push(D([at([panel.x + 4, fy, 9]), at([panel.x + panel.w - 4, fy, 9])], { size: 0.45 }));
		out.push(L(k.segment([panel.x, fy, 12], [panel.x + panel.w, fy, 12], P), { tone: 'faint' }));
		out.push(L(k.segment([panel.x, fy, 19], [panel.x + panel.w, fy, 19], P), { tone: 'faint' }));
		out.push(L([-80, -24, 32, 88].map((x) => k.segment([x, fy, 12], [x, fy, 19], P)).join(''), { tone: 'faint' }));
		for (const x of [BOARD.x, BOARD.x + BOARD.w - 20]) {
			out.push(S(k.slabOf({ x: x - 2, y: BOARD.y + BOARD.d, w: 22, d: 10, r: 1.5 }, 0, 5, P, 3, 0.6), { tone: 'mid' }));
			out.push(D([at([x + 9, BOARD.y + BOARD.d + 6, 5])], { size: 0.45 }));
			out.push(D([at([x + 7, BOARD.y + BOARD.d, 40]), at([x + 7, BOARD.y + BOARD.d, 22])], { size: 0.45 }));
		}
		const rt = k.topTicks(BOARD.x + 6, BOARD.x + BOARD.w - 6, 4, 5, rail.y + 5, BOARD_TOP + 8, [1.2, 2.4], P);
		out.push(L(rt.minor, { tone: 'lo' }), L(rt.major, { tone: 'mid' }));
		out.push(L(k.lineOnTop([rail.x + 4, rail.y + 11], [rail.x + rail.w - 4, rail.y + 11], BOARD_TOP + 8, P), { tone: 'faint' }));
		out.push(D([at([rail.x + 4, rail.y + 11, BOARD_TOP + 8]), at([rail.x + rail.w - 4, rail.y + 11, BOARD_TOP + 8])], { size: 0.45 }));
		return out.join('');
	}

	function deck() {
		const out = [`<path class="iso-halo" d="${k.haloOf(DECK, 0, DECK_H, P)}" style="filter:blur(5px)"/>`];
		out.push(S(k.slabOf(DECK, 0, DECK_H, P, 5, 0.6), { tone: 'mid' }));
		for (const y of ROWS) {
			const rail: Plan = { x: DECK.x + 7, y: y - 4.5, w: DECK.w - 14, d: 9, r: 1.5 };
			out.push(S(k.slabOf(rail, DECK_H, 1.2, P, 3, 0.3), { tone: 'lo', inner: L(k.sideSeam(rail, DECK_H + 0.6, P), { tone: 'faint' }) }));
			const tag: Plan = { x: DECK.x + 1, y: y - 3, w: 5, d: 6, r: 0.8 };
			out.push(S(k.slabOf(tag, DECK_H, 0.8, P, 2), { tone: 'hi', crease: 'none' }));
		}
		out.push(L(k.planOutline(k.insetPlan(DECK, 4), DECK_H, P), { tone: 'faint' }));
		const ds = k.corners(DECK, 2.6);
		out.push(L(ds.map(([x, y]) => k.ring(x, y, 1.5, DECK_H, P, 12)).join(''), { tone: 'lo' }));
		out.push(D(ds.map(([x, y]) => at([x, y, DECK_H])), { size: 0.45 }));
		const lip = k.topTicks(DECK.x + 10, 30, 4, 5, DECK.y + DECK.d - 6, DECK_H, [1.4, 2.8], P);
		out.push(L(lip.minor, { tone: 'lo' }), L(lip.major, { tone: 'mid' }));
		const cable = [[152, -10], [152, 38], [146, 38]] as Plane[];
		out.push(L(k.onTop(cable, DECK_H + 0.4, P), { tone: 'mid' }));
		out.push(D([at([152, -10, DECK_H + 0.4]), at([146, 38, DECK_H + 0.4])], { size: 0.7, tone: 'hi' }));
		return out.join('');
	}

	function seat([cx, cy]: Plane, lit = false) {
		const out: string[] = [];
		out.push(`<path class="iso-halo" d="${k.haloOf({ x: cx - 9, y: cy - 9, w: 18, d: 18, r: 9 }, DECK_H, 0.1, P)}" style="filter:blur(2px)"/>`);
		out.push(S(k.cylinder(cx, cy, 7.2, DECK_H + 1.2, 1.2, P, 28, 0.3), { tone: 'lo', lit }));
		out.push(S(k.cylinder(cx, cy, 5, DECK_H, SEAT_H, P, 24, 0.5), { tone: 'mid', lit }));
		out.push(S(k.cylinder(cx, cy, 9, DECK_H + SEAT_H, 2, P, 32, 0.5), { tone: 'hi', lit }));
		out.push(L(k.ring(cx, cy, 6, SEAT_TOP, P, 24), { tone: lit ? 'lit' : 'mid' }));
		out.push(L(k.knurl(cx, cy, 9, DECK_H + SEAT_H, SEAT_TOP, 36, P, 0.3), { tone: lit ? 'lit' : 'lo' }));
		out.push(L(k.ring(cx, cy, 2.4, SEAT_TOP, P, 16), { tone: lit ? 'lit' : 'faint' }));
		return out.join('');
	}
	function seats() {
		const all: Plane[] = [];
		for (const y of ROWS) for (const x of COLS) if (!(x === LIT[0] && y === LIT[1])) all.push([x, y]);
		return byDepth(all).map((p) => seat(p)).join('') + stepSvg('lit-at', 4, seat(LIT, true));
	}

	function dish() {
		const [cx, cy] = DISH;
		return (
			`<path class="iso-halo" d="${k.haloOf({ x: cx - 14, y: cy - 14, w: 28, d: 28, r: 14 }, DECK_H, 0.1, P)}" style="filter:blur(3px)"/>` +
			S(k.cylinder(cx, cy, 11, DECK_H, 2.2, P, 32, 0.5), { tone: 'lo' }) +
			S(k.cylinder(cx, cy, 8, DECK_H + 2.2, DISH_H - 2.2, P, 28, 0.6), { tone: 'mid' }) +
			L(k.knurl(cx, cy, 8, DECK_H + 2.2, DECK_H + DISH_H - 2, 24, P, 0.6), { tone: 'lo' }) +
			L(k.ring(cx, cy, 8, 16, P, 28), { tone: 'faint' }) +
			S(k.cylinder(cx, cy, 13, DECK_H + DISH_H, 2.6, P, 36, 0.8), { tone: 'mid' }) +
			L(k.ring(cx, cy, 10, BOX_H, P, 32), { tone: 'faint' }) +
			L(k.ring(cx, cy, 12, BOX_H - 1.5, P, 36), { tone: 'lo' })
		);
	}

	function box() {
		const out = [`<path class="iso-halo" d="${k.haloOf(BOX, DECK_H, BOX_H - DECK_H, P)}"/>`];
		out.push(S(k.slabOf(BOX, DECK_H, BOX_H - DECK_H, P, 3, 0.8), { tone: 'mid', inner: L(k.sideSeam(BOX, 14, P), { tone: 'faint' }) }));
		const slot: Plan = { x: COIN_TO[0] - 8, y: COIN_TO[1] - 1.6, w: 16, d: 3.2, r: 1.4 };
		out.push(S(k.slabOf(slot, BOX_H, 0.5, P, 2), { tone: 'lo', crease: 'none' }));
		const fy = BOX.y + BOX.d;
		out.push(L(k.segment([BOX.x + 6, fy, 12], [BOX.x + BOX.w - 6, fy, 12], P), { tone: 'faint' }));
		const flap: Plan = { x: BOX.x + 8, y: fy, w: 18, d: 1.4, r: 0.5 };
		out.push(S(k.slabOf(flap, 16, 8, P, 2), { tone: 'lo' }));
		out.push(S(k.cylinder(BOX.x + BOX.w - 9, fy + 1, 3, 17, 1.4, P, 16), { tone: 'hi' }));
		out.push(D([at([BOX.x + 4, fy, 8]), at([BOX.x + BOX.w - 4, fy, 8]), at([BOX.x + 4, BOX.y + 3, BOX_H]), at([BOX.x + BOX.w - 4, BOX.y + 3, BOX_H])], { size: 0.45 }));
		out.push(S(k.slabOf({ x: BOX.x + BOX.w, y: BOX.y + 5, w: 6, d: 16, r: 1 }, DECK_H, 4, P, 3, 0.4), { tone: 'lo' }));
		out.push(L(k.lineOnTop([BOX.x + BOX.w + 1.5, BOX.y + 9], [BOX.x + BOX.w + 4.5, BOX.y + 9], DECK_H + 4, P) + k.lineOnTop([BOX.x + BOX.w + 1.5, BOX.y + 12.5], [BOX.x + BOX.w + 4.5, BOX.y + 12.5], DECK_H + 4, P), { tone: 'faint', free: true }));
		const tag: Plan = { x: BOX.x + 30, y: fy, w: 9, d: 0.9, r: 0.3 };
		out.push(S(k.slabOf(tag, 18, 8, P, 2), { tone: 'hi', crease: 'none' }));
		out.push(L(k.segment([tag.x + 2, fy + 0.9, 24], [tag.x + 7, fy + 0.9, 24], P) + k.segment([tag.x + 2, fy + 0.9, 21], [tag.x + 5, fy + 0.9, 21], P), { tone: 'mid' }));
		for (const x of [BOX.x + 6, BOX.x + BOX.w - 11]) out.push(S(k.slabOf({ x, y: BOX.y - 1.4, w: 5, d: 1.4, r: 0.4 }, 22, 5, P, 2), { tone: 'lo' }));
		out.push(L(k.planOutline(k.insetPlan(BOX, 3), BOX_H, P), { tone: 'faint' }));
		out.push(S(k.cylinder(BOX.x + 5, BOX.y + BOX.d - 5, 2.2, DECK_H - 2, 2, P, 12), { tone: 'lo' }));
		return out.join('');
	}

	function tablet() {
		const base: Plan = { x: 138, y: -30, w: 28, d: 20, r: 2 };
		const out = [`<path class="iso-halo" d="${k.haloOf(base, DECK_H, 3, P)}"/>`];
		out.push(S(k.slabOf(base, DECK_H, 3, P, 2, 0.5), { tone: 'mid' }));
		const body: Plan = { x: 142, y: -26, w: 20, d: 3, r: 1 };
		out.push(S(k.slabOf(body, DECK_H + 3, 34, P, 2, 0.5), { tone: 'mid' }));
		const f = body.y + body.d;
		for (const z in [0, 1, 2, 3]) out.push(L(k.segment([145, f, 14 + Number(z) * 6], [159 - (Number(z) % 2 ? 6 : 0), f, 14 + Number(z) * 6], P), { tone: 'faint' }));
		out.push(D([at([144, f, 36]), at([160, f, 36])], { size: 0.4 }));
		out.push(S(k.slabOf({ x: 147, y: body.y - 5, w: 10, d: 5, r: 0.8 }, DECK_H + 3, 24, P, 2, 0.3), { tone: 'lo' }));
		out.push(L(k.planOutline({ x: 143.5, y: body.y, w: 17, d: 3, r: 0.5 }, DECK_H + 3 + 34, P), { tone: 'faint' }));
		out.push(S(k.slabOf({ x: 148.5, y: f, w: 7, d: 0.9, r: 0.4 }, 8, 1.6, P, 2), { tone: 'hi', crease: 'none' }));
		out.push(S(k.slabOf({ x: base.x + 2, y: base.y + base.d, w: 6, d: 1, r: 0.3 }, DECK_H, 1.6, P, 2), { tone: 'lo' }));
		out.push(S(k.slabOf({ x: base.x + base.w - 8, y: base.y + base.d, w: 6, d: 1, r: 0.3 }, DECK_H, 1.6, P, 2), { tone: 'lo' }));
		return out.join('');
	}

	function token([cx, cy, z]: Point3) {
		return (
			`<path class="iso-halo" d="${k.haloOf({ x: cx - 9, y: cy - 9, w: 18, d: 18, r: 9 }, z, 0.1, P)}" style="filter:blur(3px)"/>` +
			S(k.cylinder(cx, cy, 7.5, z, 3, P, 32, 0.6), { tone: 'hi' }) +
			L(k.ring(cx, cy, 4.6, z + 3, P, 28), { tone: 'mid' }) +
			D([at([cx, cy, z + 3])], { size: 0.55, tone: 'hi' })
		);
	}
	function coin([cx, cy, z]: Point3) {
		return (
			`<path class="iso-halo" d="${k.haloOf({ x: cx - 10, y: cy - 10, w: 20, d: 20, r: 10 }, z, 0.1, P)}" style="filter:blur(3px)"/>` +
			S(k.cylinder(cx, cy, 9, z, 2.6, P, 48, 0.6), { tone: 'hi' }) +
			L(k.knurl(cx, cy, 9, z, z + 2.6, 48, P, 0.3), { tone: 'lo' }) +
			L(k.ring(cx, cy, 6.4, z + 2.6, P, 40), { tone: 'mid' })
		);
	}

	const tokenTo: Point3 = [LIT[0] - TOKEN_FROM[0], LIT[1] - TOKEN_FROM[1], SEAT_TOP - TOKEN_FROM[2]];
	const coinFrom: Point3 = [DISH[0], DISH[1], BOX_H];
	const coinTravel: Point3 = [COIN_TO[0] - coinFrom[0], COIN_TO[1] - coinFrom[1], 0];
	const zero: Point3 = [0, 0, 0];
	const transforms = transformsFrom(P, {
		token: [zero, tokenTo, tokenTo, tokenTo],
		coin: [zero, zero, coinTravel, coinTravel],
	});

	const svg = k.figureSvg({
		width,
		height,
		label:
			'A seat board with a rail of class cards above rows of little round seats. A token is set down on one seat and a coin goes into the pay box beside it, and then that seat lights up: the family has picked a seat, paid, and the seat is booked.',
		body: [
			bench(),
			board(),
			props(),
			deck(),
			tablet(),
			seats(),
			box(),
			dish(),
			moverSvg('coin', transforms.coin[3], coin(coinFrom)),
			moverSvg('token', transforms.token[3], token(TOKEN_FROM)),
		],
	});
	return { svg, labels: LABELS, transforms };
}
