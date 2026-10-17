import * as k from '../../lib/anatomy/iso-kit';
import type { Plan, Plane, Point3 } from '../../lib/anatomy/iso-kit';
import { moverSvg, stepSvg, transformsFrom, type Machine } from '../../lib/plate';

export const LABELS = ['member buys a pass', 'books a class', 'scans at the door', 'class, cafe and shop'] as const;
export const CAPTION = 'Members buy a pass, book a class and scan in at the door. The cafe and shop live in the same app.';

const BENCH: Plan = { x: -175, y: -82, w: 350, d: 164, r: 8 };
const BENCH_H = 12;
const FOOT_H = 6;

const TABLE: Plan = { x: -160, y: -66, w: 70, d: 52, r: 2 };
const TABLE_H = 14;
const PAD: Plan = { x: -160, y: -8, w: 28, d: 20, r: 2 };
const PEG_FROM: Point3 = [-146, 2, TABLE_H];
const CELL: Plane = [-115, -38];

const KIOSK: Plan = { x: -160, y: 34, w: 60, d: 40, r: 2 };
const KIOSK_H = 33;
const CARD_FROM: Point3 = [-118, 62, KIOSK_H];

const POST_H = 30;
const POST1: Plan = { x: -80, y: 8, w: 36, d: 22, r: 2 };
const POST2: Plan = { x: 44, y: 8, w: 36, d: 22, r: 2 };
const TRACK: Plan = { x: -44, y: 12, w: 88, d: 14, r: 1.5 };
const PANEL_Z: [number, number] = [3, 27];
const SLIDE = 36;
const CARD_TO: Point3 = [-62, 19, POST_H + 3];

export function copperCloves(width = 720, height = 480): Machine {
	const P = k.fitProjection(
		[...k.boxCorners(BENCH, -BENCH_H - FOOT_H, 0), [100, -78, 82], [166, -78, 82], [62, 19, 58]],
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
	const halo = (plan: Plan, z: number, h: number, blur = 0) => `<path class="iso-halo" d="${k.haloOf(plan, z, h, P)}"${blur ? ` style="filter:blur(${blur}px)"` : ''}/>`;
	const roundHalo = (cx: number, cy: number, r: number, z: number) => halo({ x: cx - r, y: cy - r, w: r * 2, d: r * 2, r }, z, 0.1, 3);
	const mid = (p: Plan): Plane => [p.x + p.w / 2, p.y + p.d / 2];

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
		const strip: Plan = { x: -60, y: BENCH.y + BENCH.d - 7, w: 150, d: 5, r: 1 };
		out.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: 'lo', crease: 'none' }));
		const ticks = k.topTicks(strip.x + 4, strip.x + strip.w - 4, 4, 5, strip.y + 0.6, 0.6, [1.6, 3], P);
		out.push(L(ticks.minor, { tone: 'lo' }), L(ticks.major, { tone: 'mid' }));
		const label: Plan = { x: 110, y: BENCH.y + BENCH.d - 11, w: 40, d: 8, r: 1.5 };
		out.push(S(k.slabOf(label, 0, 0.8, P, 3), { tone: 'lo' }));
		for (const dy of [2.5, 5.2]) out.push(L(k.lineOnTop([label.x + 5, label.y + dy], [label.x + label.w - (dy > 5 ? 16 : 5), label.y + dy], 0.8, P), { tone: 'faint', free: true }));
		const fy = BENCH.y + BENCH.d;
		for (const x of [-120, 70]) {
			out.push(S(k.slabOf({ x, y: fy, w: 32, d: 2.4, r: 1 }, -9, 3.6, P, 3, 0.4), { tone: 'lo' }));
			out.push(L(k.segment([x + 4, fy + 2.4, -7.2], [x + 28, fy + 2.4, -7.2], P), { tone: 'faint' }));
		}
		out.push(L([-30, -18, -6, 6, 18, 30].map((y) => k.segment([BENCH.x + BENCH.w, y, -9], [BENCH.x + BENCH.w, y, -3], P)).join(''), { tone: 'lo' }));
		out.push(S(k.slabOf({ x: BENCH.x + BENCH.w, y: -38, w: 0.8, d: 76, r: 0.4 }, -10, 8, P, 2), { tone: 'lo', crease: 'none' }));
		out.push(D([at([BENCH.x + BENCH.w, -42, -6]), at([BENCH.x + BENCH.w, 42, -6])], { size: 0.45 }));
		return out.join('');
	}

	function wires() {
		const flat = (pts: Plane[]) => L(k.onTop(pts, 0.4, P), { tone: 'mid' });
		return flat([[-100, 52], [-70, 52], [-70, 30]]) + flat([[62, 30], [62, 44], [96, 44]]) + D([at([-100, 52, 0.4]), at([-70, 30, 0.4]), at([62, 30, 0.4])], { size: 0.7, tone: 'hi' });
	}
	function junction() {
		const j: Plan = { x: 96, y: 40, w: 9, d: 9, r: 1.4 };
		return halo(j, 0, 4) + S(k.slabOf(j, 0, 4, P, 2, 0.5), { tone: 'mid' }) + D([at([j.x + 4.5, j.y + 4.5, 4])], { size: 0.5 });
	}

	function table() {
		const out = [halo(TABLE, 0, TABLE_H)];
		out.push(S(k.slabOf({ x: TABLE.x - 1.5, y: TABLE.y - 1.5, w: TABLE.w + 3, d: TABLE.d + 3, r: 2.5 }, 0, 2.5, P, 3, 0.4), { tone: 'lo' }));
		out.push(S(k.slabOf(TABLE, 0, TABLE_H, P, 3, 0.8), { tone: 'mid', inner: L(k.sideSeam(TABLE, 5, P), { tone: 'faint' }) }));
		for (let i = 0; i < 4; i++)
			for (let j = 0; j < 3; j++) {
				const cell: Plan = { x: TABLE.x + 6 + i * 16.5, y: TABLE.y + 6 + j * 14.5, w: 13, d: 11.5, r: 1.4 };
				out.push(L(k.planOutline(cell, TABLE_H, P), { tone: 'lo' }));
				out.push(D([at([cell.x + cell.w / 2, cell.y + cell.d / 2, TABLE_H])], { size: 0.4, tone: 'faint' }));
			}
		const tt = k.topTicks(TABLE.x + 6, TABLE.x + TABLE.w - 6, 3, 5, TABLE.y + 1.6, TABLE_H, [1, 2], P);
		out.push(L(tt.minor, { tone: 'lo' }), L(tt.major, { tone: 'mid' }));
		const ty = TABLE.y + TABLE.d;
		out.push(L(k.segment([TABLE.x + 5, ty, 8.5], [TABLE.x + TABLE.w - 5, ty, 8.5], P), { tone: 'faint' }));
		out.push(S(k.slabOf({ x: TABLE.x + 24, y: ty, w: 22, d: 1.4, r: 0.5 }, 3.4, 2.2, P, 2), { tone: 'hi' }));
		out.push(S(k.slabOf({ x: TABLE.x + TABLE.w, y: TABLE.y + 18, w: 0.8, d: 16, r: 0.4 }, 4, 7, P, 2), { tone: 'lo', crease: 'none' }));
		out.push(L(k.segment([TABLE.x + TABLE.w + 0.8, TABLE.y + 22, 8], [TABLE.x + TABLE.w + 0.8, TABLE.y + 30, 8], P) + k.segment([TABLE.x + TABLE.w + 0.8, TABLE.y + 22, 10], [TABLE.x + TABLE.w + 0.8, TABLE.y + 27, 10], P), { tone: 'faint' }));
		out.push(D([at([TABLE.x + 3, TABLE.y + 3, TABLE_H]), at([TABLE.x + TABLE.w - 3, TABLE.y + 3, TABLE_H]), at([TABLE.x + 3, TABLE.y + TABLE.d - 3, TABLE_H]), at([TABLE.x + TABLE.w - 3, TABLE.y + TABLE.d - 3, TABLE_H])], { size: 0.45 }));
		return out.join('');
	}
	function pad() {
		const spares = [[-154, 2], [-154, 8.5]] as const;
		return (
			halo(PAD, 0, TABLE_H) +
			S(k.slabOf(PAD, 0, TABLE_H, P, 3, 0.6), { tone: 'mid' }) +
			L(k.planOutline(k.insetPlan(PAD, 3), TABLE_H, P), { tone: 'faint' }) +
			D([at([-139, -4.5, TABLE_H]), at([-146, -4.5, TABLE_H]), at([-154, -4.5, TABLE_H]), at([-139, 8.5, TABLE_H]), at([-146, 8.5, TABLE_H])], { size: 0.4 }) +
			spares.map(([x, y]) => S(k.cylinder(x, y, 2.8, TABLE_H, 6, P, 16, 0.4), { tone: 'mid' }) + D([at([x, y, TABLE_H + 6])], { size: 0.4 })).join('') +
			D([at([PAD.x + 2, PAD.y + PAD.d - 2, TABLE_H]), at([PAD.x + PAD.w - 2, PAD.y + PAD.d - 2, TABLE_H])], { size: 0.45 })
		);
	}
	function peg([cx, cy, z]: Point3) {
		return (
			roundHalo(cx, cy, 8, z) +
			S(k.cylinder(cx, cy, 4.4, z, 9, P, 24, 0.5), { tone: 'hi' }) +
			S(k.slabOf({ x: cx - 1, y: cy - 1, w: 9, d: 2, r: 0.6 }, z + 9, 5, P, 2), { tone: 'hi' }) +
			D([at([cx, cy, z + 9])], { size: 0.45, tone: 'mid' })
		);
	}

	function kiosk() {
		const out = [halo(KIOSK, 0, KIOSK_H)];
		out.push(S(k.slabOf(KIOSK, 0, KIOSK_H, P, 3, 0.8), { tone: 'mid', inner: L(k.sideSeam(KIOSK, 7, P), { tone: 'faint' }) }));
		const screen: Plan = { x: KIOSK.x + 6, y: KIOSK.y + 3, w: 40, d: 4, r: 1 };
		out.push(S(k.slabOf(screen, KIOSK_H, 16, P, 2, 0.5), { tone: 'lo' }));
		const sf = screen.y + screen.d;
		for (const z of [KIOSK_H + 4, KIOSK_H + 8, KIOSK_H + 12]) out.push(L(k.segment([screen.x + 5, sf, z], [screen.x + screen.w - 5 - (z === KIOSK_H + 12 ? 14 : 0), sf, z], P), { tone: 'faint' }));
		out.push(L(k.ring(CARD_FROM[0], CARD_FROM[1], 15, KIOSK_H, P, 28), { tone: 'faint' }));
		const holder: Plan = { x: KIOSK.x + 3, y: KIOSK.y + 14, w: 16, d: 6, r: 1.2 };
		out.push(S(k.slabOf(holder, KIOSK_H, 3, P, 3, 0.4), { tone: 'lo' }));
		for (const [i, h] of [7, 9, 8].entries()) out.push(S(k.slabOf({ x: holder.x + 2 + i * 4.6, y: holder.y + 1.6, w: 3.6, d: 0.8, r: 0.3 }, KIOSK_H + 3, h, P, 2), { tone: 'hi', crease: 'none' }));
		out.push(S(k.cylinder(KIOSK.x + 10, KIOSK.y + 30, 3, KIOSK_H, 8, P, 20, 0.5), { tone: 'mid' }), L(k.ring(KIOSK.x + 10, KIOSK.y + 30, 3, KIOSK_H + 5, P, 20), { tone: 'faint' }));
		out.push(S(k.cylinder(KIOSK.x + KIOSK.w - 8, KIOSK.y + 6, 2.4, KIOSK_H, 3, P, 16, 0.4), { tone: 'mid' }));
		out.push(L(k.planOutline({ x: screen.x + 2, y: screen.y, w: screen.w - 4, d: screen.d, r: 0.5 }, KIOSK_H + 15, P), { tone: 'faint' }));
		const fy = KIOSK.y + KIOSK.d;
		out.push(L(k.segment([KIOSK.x + 8, fy, 11], [KIOSK.x + 30, fy, 11], P), { tone: 'faint' }));
		out.push(S(k.slabOf({ x: KIOSK.x + KIOSK.w - 14, y: fy, w: 8, d: 1.2, r: 0.4 }, 14, 6, P, 2), { tone: 'lo' }));
		out.push(D([at([KIOSK.x + 4, fy, 16]), at([KIOSK.x + KIOSK.w - 4, fy, 16])], { size: 0.45 }));
		for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) out.push(S(k.slabOf({ x: KIOSK.x + 8 + c * 6, y: fy, w: 4.4, d: 0.8, r: 0.4 }, 21 + r * 5, 3.4, P, 2), { tone: 'hi', crease: 'none' }));
		out.push(S(k.slabOf({ x: KIOSK.x + KIOSK.w - 14, y: fy, w: 8, d: 1.2, r: 0.4 }, 24, 3, P, 2), { tone: 'lo' }));
		const kx = KIOSK.x + KIOSK.w;
		out.push(L([-26, -14, -2].map((dy) => k.segment([kx, KIOSK.y + 20 + dy, 6], [kx, KIOSK.y + 20 + dy, 20], P)).join(''), { tone: 'lo' }));
		return out.join('');
	}
	function card([cx, cy, z]: Point3) {
		const plan: Plan = { x: cx - 11, y: cy - 7, w: 22, d: 14, r: 1.6 };
		return (
			roundHalo(cx, cy, 12, z) +
			S(k.slabOf(plan, z, 1.4, P, 3, 0.3), { tone: 'hi' }) +
			L(k.lineOnTop([plan.x + 3, plan.y + 4], [plan.x + 15, plan.y + 4], z + 1.4, P), { tone: 'mid', free: true }) +
			L(k.lineOnTop([plan.x + 3, plan.y + 7.5], [plan.x + 10, plan.y + 7.5], z + 1.4, P), { tone: 'faint', free: true }) +
			S(k.slabOf({ x: plan.x + plan.w - 6, y: plan.y + plan.d - 5, w: 3.6, d: 3, r: 0.5 }, z + 1.4, 0.4, P, 1), { tone: 'mid', crease: 'none' })
		);
	}

	function gate() {
		const out: string[] = [];
		out.push(halo({ x: POST1.x, y: POST1.y, w: POST2.x + POST2.w - POST1.x, d: POST1.d, r: 2 }, 0, POST_H));
		out.push(S(k.slabOf(TRACK, 0, 3, P, 2, 0.5), { tone: 'lo' }));
		for (const y of [9, 26.5]) {
			const plate: Plan = { x: -42, y, w: 84, d: 3.6, r: 1 };
			out.push(S(k.slabOf(plate, 0, 1.2, P, 2, 0.3), { tone: 'lo' }));
			out.push(L(k.lineOnTop([-38, y + 1.8], [38, y + 1.8], 1.2, P), { tone: 'faint', free: true }));
		}
		const tr = k.topTicks(-40, 40, 4, 5, TRACK.y + 1, 3, [1.2, 2.4], P);
		out.push(L(tr.minor, { tone: 'lo' }), L(tr.major, { tone: 'mid' }));
		for (const [name, x] of [['a', -44], ['b', 0]] as const) {
			void name;
			const panel: Plan = { x, y: 17, w: 44, d: 3, r: 0.8 };
			const hh = PANEL_Z[1] - PANEL_Z[0];
			const sx = name === 'a' ? -SLIDE : SLIDE;
			const body =
				S(k.slabOf(panel, PANEL_Z[0], hh, P, 2, 0.4), { tone: 'hi' }) +
				L(k.segment([x + 4, 20, PANEL_Z[0] + 4], [x + 4, 20, PANEL_Z[1] - 4], P) + k.segment([x + 40, 20, PANEL_Z[0] + 4], [x + 40, 20, PANEL_Z[1] - 4], P), { tone: 'faint' }) +
				L(k.segment([x + 4, 20, 18], [x + 40, 20, 18], P), { tone: 'mid' }) +
				S(k.slabOf({ x: x + 6, y: 20, w: 32, d: 0.4, r: 0.3 }, PANEL_Z[0] + 3, hh - 6, P, 2), { tone: 'mid', crease: 'none' }) +
				D([at([x + 4, 20, PANEL_Z[1] - 2]), at([x + 40, 20, PANEL_Z[1] - 2])], { size: 0.45 });
			out.push(moverSvg(`gate-${name}`, transforms[`gate-${name}`][3], body));
			void sx;
		}
		for (const post of [POST1, POST2]) {
			out.push(S(k.slabOf({ x: post.x - 1.5, y: post.y - 1.5, w: post.w + 3, d: post.d + 3, r: 2.5 }, 0, 2.5, P, 3, 0.4), { tone: 'lo' }));
			out.push(S(k.slabOf(post, 0, POST_H, P, 3, 0.8), { tone: 'mid', inner: L(k.sideSeam(post, 6, P), { tone: 'faint' }) }));
			out.push(S(k.slabOf(k.insetPlan(post, 2), POST_H, 3, P, 2, 0.5), { tone: 'hi' }));
		}
		const qrx = POST1.x + 8;
		const qry = POST1.y + POST1.d;
		out.push(S(k.slabOf({ x: qrx - 1, y: qry, w: 22, d: 0.8, r: 0.4 }, 7, 18, P, 2), { tone: 'lo', crease: 'none' }));
		for (let i = 0; i < 4; i++)
			for (let j = 0; j < 3; j++) if ((i * 3 + j * 5) % 3 !== 0) out.push(L(k.segment([qrx + 1 + i * 5, qry + 0.8, 11 + j * 5], [qrx + 3.4 + i * 5, qry + 0.8, 11 + j * 5], P), { tone: 'hi', free: true }));
		out.push(L(k.ring(...mid(POST1), 8, POST_H + 3, P, 24), { tone: 'mid' }));
		out.push(S(k.slabOf({ x: POST1.x + POST1.w, y: 16, w: 0.8, d: 6, r: 0.3 }, 17, 5, P, 2), { tone: 'hi', crease: 'none' }));
		out.push(D([at([POST1.x + POST1.w, 19, 19.5])], { size: 0.55, tone: 'mid' }));
		out.push(L([4, 8, 12, 16].map((dy) => k.segment([POST1.x + POST1.w, POST1.y + dy, 5], [POST1.x + POST1.w, POST1.y + dy, 9], P)).join(''), { tone: 'lo' }));
		const [lx, ly] = mid(POST2);
		out.push(S(k.cylinder(lx, ly, 6, POST_H + 3, 3, P, 28, 0.6), { tone: 'mid' }));
		out.push(stepSvg('lit-at', 3, S(k.cylinder(lx, ly, 5, POST_H + 6, 10, P, 28, 1), { tone: 'hi', lit: true }) + L(k.ring(lx, ly, 8.5, POST_H + 16, P, 28), { tone: 'lit' })));
		out.push(S(k.slabOf({ x: POST2.x + 4, y: POST2.y + POST2.d, w: 28, d: 0.8, r: 0.4 }, 12, 14, P, 2), { tone: 'lo', crease: 'none' }));
		out.push(L(k.segment([POST2.x + 8, POST2.y + POST2.d + 0.8, 19], [POST2.x + 28, POST2.y + POST2.d + 0.8, 19], P), { tone: 'faint' }));
		return out.join('');
	}

	function floorMat(plan: Plan, z0 = 0) {
		const out = [S(k.slabOf(plan, z0, 1.6, P, 2, 0.4), { tone: 'lo' })];
		for (let i = 1; i < 4; i++) out.push(L(k.lineOnTop([plan.x + 4, plan.y + (plan.d * i) / 4], [plan.x + plan.w - 4, plan.y + (plan.d * i) / 4], z0 + 1.6, P), { tone: 'faint' }));
		return out.join('');
	}
	function studio() {
		const plan: Plan = { x: -34, y: -66, w: 66, d: 34, r: 3 };
		const out = [halo(plan, 0, 2, 4), floorMat(plan)];
		out.push(S(k.slabOf({ x: -30, y: -62, w: 14, d: 26, r: 3 }, 1.6, 7, P, 3, 0.6), { tone: 'hi' }));
		out.push(L(k.lineOnTop([-26, -58], [-26, -40], 8.6, P), { tone: 'mid', free: true }));
		for (const y of [-57, -44]) out.push(S(k.slabOf({ x: -30.5, y, w: 15, d: 2, r: 0.5 }, 1.6, 7.4, P, 2, 0.3), { tone: 'lo' }));
		out.push(L([3.2, 2, 0.9].map((r) => k.sideRing([-23, -36, 5.1], r, 'y', P, 20)).join(''), { tone: 'mid' }));
		out.push(S(k.cylinder(2, -52, 4.2, 1.6, 4.6, P, 24, 0.8), { tone: 'hi' }));
		out.push(S(k.cylinder(2, -52, 1.6, 6.2, 2.6, P, 14), { tone: 'mid' }));
		out.push(L(k.sideRing([2, -52, 11], 2.6, 'y', P, 20), { tone: 'hi' }));
		out.push(S(k.slabOf({ x: -12, y: -48, w: 10, d: 7, r: 1 }, 1.6, 1.4, P, 3, 0.3), { tone: 'hi' }));
		out.push(S(k.slabOf({ x: -11, y: -47, w: 10, d: 7, r: 1 }, 3, 1.4, P, 3, 0.3), { tone: 'hi' }));
		out.push(L(k.lineOnTop([-9, -44], [-3, -44], 4.4, P), { tone: 'faint', free: true }));
		out.push(S(k.slabOf({ x: 14, y: -58, w: 12, d: 8, r: 1.4 }, 1.6, 6, P, 2, 0.5), { tone: 'mid' }));
		out.push(S(k.cylinder(18, -42, 3.6, 1.6, 12, P, 20, 0.6), { tone: 'hi' }));
		out.push(S(k.cylinder(18, -42, 2, 13.6, 2.6, P, 16), { tone: 'mid' }));
		out.push(D([at([plan.x + 4, plan.y + 4, 1.6]), at([plan.x + plan.w - 4, plan.y + plan.d - 4, 1.6])], { size: 0.45 }));
		return out.join('');
	}
	function welcome() {
		const plan: Plan = { x: -26, y: 40, w: 52, d: 22, r: 3 };
		const sign: Plan = { x: 34, y: 54, w: 12, d: 8, r: 1.5 };
		return (
			halo(plan, 0, 2, 4) +
			floorMat(plan) +
			L(k.planOutline(k.insetPlan(plan, 4), 1.6, P), { tone: 'mid' }) +
			L([46, 50, 54, 58].map((y) => k.lineOnTop([plan.x + plan.w, y - 0], [plan.x + plan.w + 3, y], 0.4, P)).join(''), { tone: 'faint', free: true }) +
			halo(sign, 0, 1.2, 2) +
			S(k.slabOf(sign, 0, 1.2, P, 3, 0.3), { tone: 'lo' }) +
			S(k.slabOf({ x: 35, y: 57, w: 10, d: 1.6, r: 0.5 }, 1.2, 16, P, 2, 0.4), { tone: 'hi' }) +
			L([6, 9.5, 13].map((z, i) => k.segment([37, 58.6, z + 1.2], [43 - i * 2, 58.6, z + 1.2], P)).join(''), { tone: 'mid' }) +
			D([at([36.5, 58.6, 15]), at([43.5, 58.6, 15])], { size: 0.4 })
		);
	}

	function cafe() {
		const cx = 118;
		const cy = -30;
		const out = [roundHalo(cx, cy, 24, 0)];
		out.push(S(k.cylinder(cx, cy, 13, 0, 2.4, P, 40, 0.6), { tone: 'mid' }));
		out.push(S(k.cylinder(cx, cy, 4, 2.4, 17, P, 20, 0.5), { tone: 'mid' }));
		out.push(S(k.cylinder(cx, cy, 21, 19.4, 2.4, P, 56, 0.8), { tone: 'mid' }));
		out.push(L(k.ring(cx, cy, 17, 21.8, P, 44), { tone: 'faint' }));
		out.push(S(k.cylinder(cx, cy, 8, 21.8, 1, P, 36, 0.3), { tone: 'hi' }));
		out.push(S(k.cylinder(cx, cy, 5.4, 22.8, 8, P, 32, 0.8), { tone: 'hi' }));
		out.push(L(k.ring(cx, cy, 4, 30.8, P, 28), { tone: 'mid' }));
		out.push(L(k.sideRing([cx + 5.6, cy + 1, 27], 2.4, 'y', P, 16), { tone: 'hi' }));
		out.push(stepSvg('show-from', 4, [-2, 0, 2].map((dx) => L(k.segment([cx + dx * 1.8, cy, 32], [cx + dx * 1.8 + 1.2, cy, 40], P), { tone: 'mid' })).join('')));
		out.push(D([at([cx - 15, cy + 5, 21.8]), at([cx + 15, cy - 5, 21.8])], { size: 0.45 }));
		out.push(S(k.cylinder(cx + 12, cy - 5, 2.4, 21.8, 3, P, 16, 0.4), { tone: 'hi' }), S(k.cylinder(cx + 12, cy - 5, 2.7, 24.8, 0.9, P, 16), { tone: 'mid' }));
		out.push(S(k.slabOf({ x: cx - 15, y: cy + 8, w: 6, d: 1, r: 0.3 }, 21.8, 6, P, 2), { tone: 'hi' }));
		out.push(L(k.segment([cx - 14, cy + 9, 25], [cx - 10, cy + 9, 25], P) + k.segment([cx - 14, cy + 9, 27], [cx - 11.5, cy + 9, 27], P), { tone: 'mid' }));
		for (const [sx, sy] of byDepth([[86, 4], [146, 8]])) {
			out.push(roundHalo(sx, sy, 8, 0));
			out.push(S(k.cylinder(sx, sy, 6.4, 0, 1.2, P, 28, 0.3), { tone: 'lo' }));
			out.push(S(k.cylinder(sx, sy, 5, 0, 12, P, 24, 0.5), { tone: 'mid' }));
			out.push(S(k.cylinder(sx, sy, 6.2, 5, 0.8, P, 24), { tone: 'lo' }));
			out.push(S(k.cylinder(sx, sy, 8, 12, 2.4, P, 28, 0.6), { tone: 'mid' }));
			out.push(L(k.knurl(sx, sy, 8, 12, 14.4, 28, P, 0.5), { tone: 'lo' }));
			out.push(L(k.ring(sx, sy, 5.4, 14.4, P, 24), { tone: 'faint' }));
		}
		return out.join('');
	}

	function shelf() {
		const sh: Plan = { x: 96, y: -78, w: 72, d: 12, r: 1.4 };
		const top = 66;
		const out = [halo(sh, 0, top)];
		out.push(S(k.slabOf({ x: sh.x + 4, y: sh.y + 1, w: sh.w - 8, d: 3, r: 0.6 }, 4, top - 8, P, 2), { tone: 'lo', crease: 'none' }));
		for (const x of [sh.x, sh.x + sh.w - 6]) out.push(S(k.slabOf({ x, y: sh.y, w: 6, d: sh.d, r: 1 }, 0, top, P, 2, 0.5), { tone: 'mid' }));
		for (const z of [14, 34, 54]) out.push(S(k.slabOf({ x: sh.x, y: sh.y, w: sh.w, d: sh.d, r: 1 }, z, 3, P, 2, 0.5), { tone: 'mid' }));
		out.push(S(k.slabOf({ x: sh.x - 3, y: sh.y - 1, w: sh.w + 6, d: sh.d + 2, r: 1.5 }, top, 4, P, 2, 0.6), { tone: 'mid' }));
		const items: string[] = [];
		const front = sh.y + 7;
		for (const [i, z] of [17, 37, 57].entries()) {
			for (let n = 0; n < 3; n++) {
				const x = sh.x + 14 + n * 18;
				if ((i + n) % 2) items.push(S(k.cylinder(x, front, 4.4, z, 9 - i, P, 24, 0.6), { tone: 'hi' }) + S(k.cylinder(x, front, 2.6, z + 9 - i, 2, P, 16), { tone: 'mid' }));
				else items.push(S(k.slabOf({ x: x - 5, y: front - 3, w: 10, d: 6, r: 0.8 }, z, 7 + (n % 2) * 2, P, 2, 0.4), { tone: 'hi' }) + L(k.lineOnTop([x - 3, front], [x + 3, front], z + 7 + (n % 2) * 2, P), { tone: 'faint', free: true }));
			}
		}
		for (const z of [14, 34, 54]) {
			out.push(S(k.slabOf({ x: sh.x + 4, y: sh.y + sh.d, w: sh.w - 8, d: 0.6, r: 0.3 }, z + 0.4, 2.2, P, 2), { tone: 'hi', crease: 'none' }));
			out.push(L(k.segment([sh.x + 7, sh.y + sh.d + 0.6, z + 1.5], [sh.x + 20, sh.y + sh.d + 0.6, z + 1.5], P), { tone: 'faint' }));
		}
		out.push(L([20, 40, 60].map((x) => k.segment([sh.x + x, sh.y + 1, 6], [sh.x + x, sh.y + 1, top - 6], P)).join(''), { tone: 'faint' }));
		out.push(S(k.slabOf({ x: sh.x + 10, y: sh.y + 2, w: 52, d: 4, r: 1 }, top + 4, 9, P, 3, 0.5), { tone: 'hi', inner: L(k.sideSeam({ x: sh.x + 10, y: sh.y + 2, w: 52, d: 4, r: 1 }, top + 8, P, 3), { tone: 'faint' }) }));
		out.push(L(k.segment([sh.x + 16, sh.y + 6, top + 9], [sh.x + 44, sh.y + 6, top + 9], P), { tone: 'mid' }));
		out.push(D([at([sh.x + 14, sh.y + 6, top + 11]), at([sh.x + 58, sh.y + 6, top + 11])], { size: 0.45 }));
		out.push(stepSvg('show-from', 4, items.join('')));
		return out.join('');
	}

	function plant() {
		const cx = 146;
		const cy = 56;
		const out = [roundHalo(cx, cy, 11, 0)];
		out.push(S(k.cylinder(cx, cy, 9, 0, 3, P, 28, 0.6), { tone: 'mid' }));
		out.push(S(k.cylinder(cx, cy, 7, 3, 9, P, 28, 0.6), { tone: 'mid' }));
		out.push(S(k.cylinder(cx, cy, 7.8, 11, 1.4, P, 28, 0.4), { tone: 'hi' }));
		out.push(L(k.knurl(cx, cy, 7, 3, 11, 24, P, 1), { tone: 'lo' }));
		for (const [i, h] of [20, 15, 11].entries()) {
			const ring: Plane[] = [];
			for (let n = 0; n < 12; n++) {
				const a = (n / 12) * Math.PI * 2 + i;
				const r = n % 2 ? 4 : 11 - i * 2;
				ring.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
			}
			out.push(S(k.extrude(ring, 12 + i * 2, 1.6, P, { convex: false }), { tone: 'hi' }));
			void h;
		}
		return out.join('');
	}

	function espresso() {
		const c: Plan = { x: 44, y: -64, w: 40, d: 18, r: 2 };
		const out = [halo(c, 0, 14)];
		out.push(S(k.slabOf({ x: c.x - 1.5, y: c.y - 1.5, w: c.w + 3, d: c.d + 3, r: 2.5 }, 0, 2.5, P, 3, 0.4), { tone: 'lo' }));
		out.push(S(k.slabOf(c, 0, 14, P, 3, 0.8), { tone: 'mid', inner: L(k.sideSeam(c, 7, P), { tone: 'faint' }) }));
		const fy = c.y + c.d;
		out.push(L(k.segment([c.x + 4, fy, 8], [c.x + c.w - 4, fy, 8], P) + k.segment([c.x + 20, fy, 2], [c.x + 20, fy, 14], P), { tone: 'faint' }));
		out.push(S(k.slabOf({ x: c.x + 14, y: fy, w: 4, d: 1.2, r: 0.4 }, 7, 1.6, P, 2), { tone: 'hi' }), S(k.slabOf({ x: c.x + 22, y: fy, w: 4, d: 1.2, r: 0.4 }, 7, 1.6, P, 2), { tone: 'hi' }));
		const m: Plan = { x: c.x + 5, y: c.y + 2, w: 20, d: 12, r: 1.4 };
		out.push(S(k.slabOf(m, 14, 12, P, 3, 0.6), { tone: 'hi' }));
		out.push(S(k.slabOf({ x: m.x - 1, y: m.y - 1, w: m.w + 2, d: m.d + 2, r: 1.4 }, 26, 1.6, P, 3, 0.4), { tone: 'mid' }));
		const mf = m.y + m.d;
		out.push(L(k.segment([m.x + 3, mf, 18], [m.x + m.w - 3, mf, 18], P), { tone: 'faint' }));
		for (const x of [m.x + 5, m.x + 15]) out.push(S(k.cylinder(x, mf - 1.5, 1.8, 18.2, 4, P, 14, 0.3), { tone: 'mid' }), S(k.slabOf({ x: x - 0.8, y: mf - 0.4, w: 1.6, d: 4, r: 0.3 }, 18.2, 1.2, P, 2), { tone: 'lo' }));
		out.push(S(k.slabOf({ x: m.x + 2, y: mf, w: 16, d: 3, r: 0.6 }, 14, 1.2, P, 2), { tone: 'lo' }));
		out.push(S(k.cylinder(m.x + 8, mf + 1.4, 2.2, 15.2, 2.4, P, 16, 0.3), { tone: 'hi' }));
		out.push(D([at([m.x + 3, mf, 23]), at([m.x + 7, mf, 23]), at([m.x + m.w - 3, mf, 23])], { size: 0.5 }));
		out.push(L(k.sideRing([m.x + m.w, m.y + 6, 20], 2.2, 'x', P, 16), { tone: 'mid' }));
		out.push(S(k.cylinder(c.x + 31, c.y + 11, 4, 14, 9, P, 24, 0.6), { tone: 'mid' }), S(k.cylinder(c.x + 31, c.y + 11, 5, 23, 5, P, 24, 0.8), { tone: 'hi' }), S(k.cylinder(c.x + 31, c.y + 11, 2.4, 28, 1.2, P, 16), { tone: 'mid' }));
		out.push(S(k.cylinder(c.x + 34, c.y + 3, 2.2, 14, 2.4, P, 16, 0.3), { tone: 'hi' }));
		return out.join('');
	}
	function cooler() {
		const [cx, cy] = [-62, -48];
		const out = [roundHalo(cx, cy, 10, 0)];
		out.push(S(k.cylinder(cx, cy, 8, 0, 2, P, 28, 0.4), { tone: 'lo' }));
		out.push(S(k.cylinder(cx, cy, 6.8, 2, 16, P, 28, 0.6), { tone: 'mid' }));
		out.push(L(k.knurl(cx, cy, 6.8, 2, 18, 24, P, 1), { tone: 'lo' }));
		out.push(S(k.cylinder(cx, cy + 7.2, 1.4, 11, 2.4, P, 12), { tone: 'hi' }));
		out.push(S(k.cylinder(cx, cy, 7.4, 18, 1.4, P, 28, 0.4), { tone: 'hi' }));
		out.push(S(k.cylinder(cx, cy, 5.6, 19.4, 12, P, 28, 1), { tone: 'hi' }));
		out.push(S(k.cylinder(cx, cy, 2.6, 31.4, 2, P, 16, 0.4), { tone: 'mid' }));
		out.push(L(k.ring(cx, cy, 5.6, 25, P, 24), { tone: 'faint' }));
		out.push(D([at([cx - 3, cy + 6.8, 6]), at([cx + 3, cy + 6.8, 6])], { size: 0.4 }));
		return out.join('');
	}
	function locker() {
		const b: Plan = { x: 54, y: 62, w: 52, d: 14, r: 2 };
		const out = [halo(b, 0, 12)];
		out.push(S(k.slabOf(b, 0, 12, P, 3, 0.8), { tone: 'mid', inner: L(k.sideSeam(b, 6, P), { tone: 'faint' }) }));
		const fy = b.y + b.d;
		for (let i = 0; i < 4; i++) out.push(S(k.slabOf({ x: b.x + 4 + i * 12, y: fy, w: 9, d: 0.8, r: 0.4 }, 2.5, 7, P, 2), { tone: 'lo', crease: 'none' }));
		out.push(L(k.planOutline(k.insetPlan(b, 3), 12, P), { tone: 'faint' }));
		out.push(S(k.slabOf({ x: b.x + 6, y: b.y + 3, w: 14, d: 8, r: 2.4 }, 12, 6, P, 4, 1.2), { tone: 'hi' }));
		out.push(L(k.lineOnTop([b.x + 8, b.y + 7], [b.x + 18, b.y + 7], 18, P), { tone: 'mid', free: true }));
		out.push(S(k.slabOf({ x: b.x + 26, y: b.y + 3, w: 12, d: 8, r: 1.4 }, 12, 1.6, P, 3, 0.3), { tone: 'hi' }), S(k.slabOf({ x: b.x + 27, y: b.y + 4, w: 12, d: 8, r: 1.4 }, 13.6, 1.6, P, 3, 0.3), { tone: 'hi' }));
		out.push(S(k.cylinder(b.x + 45, b.y + 7, 2.6, 12, 9, P, 18, 0.6), { tone: 'hi' }));
		out.push(D([at([b.x + 3, b.y + 3, 12]), at([b.x + b.w - 3, b.y + 3, 12])], { size: 0.45 }));
		return out.join('');
	}

	const zero: Point3 = [0, 0, 0];
	const pegTravel: Point3 = [CELL[0] - PEG_FROM[0], CELL[1] - PEG_FROM[1], 0];
	const cardTravel: Point3 = [CARD_TO[0] - CARD_FROM[0], CARD_TO[1] - CARD_FROM[1], CARD_TO[2] - CARD_FROM[2]];
	const transforms = transformsFrom(P, {
		peg: [zero, pegTravel, pegTravel, pegTravel],
		card: [zero, zero, cardTravel, cardTravel],
		'gate-a': [zero, zero, [-SLIDE, 0, 0], [-SLIDE, 0, 0]],
		'gate-b': [zero, zero, [SLIDE, 0, 0], [SLIDE, 0, 0]],
	});

	const blocks: [number, number, () => string][] = [
		[-125, -40, table],
		[-146, 2, pad],
		[-130, 54, kiosk],
		[0, -50, studio],
		[0, 50, welcome],
		[0, 19, gate],
		[118, -30, cafe],
		[132, -72, shelf],
		[146, 56, plant],
		[64, -55, espresso],
		[-62, -48, cooler],
		[80, 69, locker],
		[100, 44, junction],
	];
	const scene = blocks.sort((a, b) => depth(a[0], a[1]) - depth(b[0], b[1])).map(([, , draw]) => draw());

	const svg = k.figureSvg({
		width,
		height,
		label:
			'A studio entrance: a pass card on a desk, a booking board where a marker is pegged into a class slot, and a turnstile gate with a reader. The card is held to the reader, the two glass gate panels slide open and the gate lamp lights, with a mat, a coffee cup and a shop shelf waiting inside.',
		body: [
			bench(),
			wires(),
			...scene,
			moverSvg('peg', transforms.peg[3], peg(PEG_FROM)),
			moverSvg('card', transforms.card[3], card(CARD_FROM)),
		],
	});
	return { svg, labels: LABELS, transforms };
}
