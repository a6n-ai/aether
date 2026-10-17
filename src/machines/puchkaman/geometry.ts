import * as k from '../../lib/anatomy/iso-kit';
import type { Plan, Point3 } from '../../lib/anatomy/iso-kit';
import { moverSvg, stepSvg, transformsFrom, type Machine } from '../../lib/plate';

export const LABELS = ['menu on your till', 'same menu online', 'customer orders and pays', 'order lands on the till'] as const;
export const CAPTION = "The menu lives on the restaurant's till. The website shows the same menu, takes the order and payment, and sends it back to the till.";

const BASE: Plan = { x: -208, y: -82, w: 366, d: 176, r: 8 };
const BASE_H = 10;
const FOOT_H = 5;
const TILL: Plan = { x: -192, y: -50, w: 82, d: 74, r: 3 };
const TILL_H = 26;
const BELT_Z = 4;
const LANE_A = -24;
const LANE_B = 8;
const BELT_X0 = -110;
const BELT_X1 = 62;
const CARD_X = -98;
const TICKET_X = 50;
const STAND: Plan = { x: 64, y: -48, w: 78, d: 60, r: 3 };
const TAB_TOP = 70;
const TERM: Plan = { x: 92, y: 36, w: 28, d: 18, r: 3 };
const TERM_H = 22;
const FALL = 40;

export function puchkaman(width = 720, height = 480): Machine {
	const P = k.fitProjection(
		[...k.boxCorners(BASE, -BASE_H - FOOT_H, 0), [TILL.x, TILL.y, 70], [STAND.x + STAND.w, STAND.y, TAB_TOP + 4], [106, 44, TERM_H + FALL + 6]],
		width,
		height,
		{ pad: 18, azimuth: 40, elevation: 38 },
	);
	const at = (p: Point3) => k.iso(p, P);
	const S = k.solidSvg;
	const L = k.lineSvg;
	const D = k.dotsSvg;
	const halo = (plan: Plan, z: number, h: number) => `<path class="iso-halo" d="${k.haloOf(plan, z, h, P)}"/>`;
	const box = (plan: Plan, z: number, h: number, tone: 'hi' | 'mid' | 'lo' = 'mid', steps = 3, bevel = 0.5) => S(k.slabOf(plan, z, h, P, steps, bevel), { tone });

	function base() {
		const out = [halo(BASE, -BASE_H - FOOT_H, BASE_H)];
		for (const [x, y] of [...k.corners(BASE, 24)].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P))) {
			out.push(S(k.cylinder(x, y, 8, -BASE_H - FOOT_H, 1.8, P, 28), { tone: 'lo' }));
			out.push(S(k.cylinder(x, y, 6, -BASE_H - FOOT_H + 1.8, FOOT_H - 1.8, P, 28), { tone: 'mid' }));
		}
		out.push(S(k.slabOf(BASE, -BASE_H, BASE_H, P, 8, 1.6), { tone: 'mid', inner: L(k.sideSeam(BASE, -BASE_H / 2, P, 8), { tone: 'faint' }) }));
		out.push(L(k.planOutline(k.insetPlan(BASE, 5), 0, P), { tone: 'lo' }));
		const screws = k.corners(BASE, 11);
		out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(''), { tone: 'lo' }));
		out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
		const strip: Plan = { x: -60, y: BASE.y + BASE.d - 16, w: 190, d: 7, r: 1 };
		out.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: 'lo', crease: 'none' }));
		const ticks = k.topTicks(strip.x + 4, strip.x + strip.w - 4, 4, 5, strip.y + 0.8, 0.6, [2, 3.6], P);
		out.push(L(ticks.minor, { tone: 'lo' }), L(ticks.major, { tone: 'mid' }));
		out.push(D([at([strip.x + 2, strip.y + 3.5, 0.6]), at([strip.x + strip.w - 2, strip.y + 3.5, 0.6])], { size: 0.45 }));
		const lab: Plan = { x: -190, y: BASE.y + BASE.d - 14, w: 44, d: 9, r: 1.5 };
		out.push(S(k.slabOf(lab, 0, 0.8, P, 3), { tone: 'lo' }));
		for (const dy of [2.6, 5.4]) out.push(L(k.lineOnTop([lab.x + 5, lab.y + dy], [lab.x + lab.w - (dy > 5 ? 16 : 5), lab.y + dy], 0.8, P), { tone: 'faint', free: true }));
		out.push(D([at([lab.x + 2, lab.y + 2, 0.8]), at([lab.x + lab.w - 2, lab.y + lab.d - 2, 0.8])], { size: 0.4 }));
		const rail: Plan = { x: 146, y: -60, w: 7, d: 100, r: 1 };
		out.push(S(k.slabOf(rail, 0, 0.6, P, 3), { tone: 'lo', crease: 'none' }));
		const rt = k.topTicks(rail.y + 4, rail.y + rail.d - 4, 4, 5, rail.x + 0.8, 0.6, [2, 3.2], P, 'y');
		out.push(L(rt.minor, { tone: 'lo' }), L(rt.major, { tone: 'mid' }));
		const lr: Plan = { x: -203, y: -40, w: 7, d: 80, r: 1 };
		out.push(S(k.slabOf(lr, 0, 0.6, P, 3), { tone: 'lo', crease: 'none' }));
		const lt = k.topTicks(lr.y + 4, lr.y + lr.d - 4, 4, 5, lr.x + 0.8, 0.6, [2, 3.2], P, 'y');
		out.push(L(lt.minor, { tone: 'lo' }), L(lt.major, { tone: 'mid' }));
		return out.join('');
	}

	const wire = (pts: [number, number][], z = 0.4) => L(k.onTop(pts, z, P), { tone: 'lo' });
	function backStuff() {
		const out: string[] = [];
		const box: Plan = { x: -86, y: -76, w: 30, d: 14, r: 2 };
		out.push(halo(box, 0, 10));
		out.push(S(k.slabOf(box, 0, 10, P, 3, 0.6), { tone: 'mid', inner: L(k.sideSeam(box, 6, P, 3), { tone: 'faint' }) }));
		const f = box.y + box.d;
		out.push(L(k.planOutline(k.insetPlan(box, 2), 10, P), { tone: 'faint' }));
		for (const dx of [6, 12, 18]) out.push(S(k.cylinder(box.x + dx, box.y + 7, 2.2, 10, 1.2, P, 12, 0.2), { tone: 'hi' }));
		out.push(S(k.cylinder(box.x + 25, box.y + 7, 2.8, 10, 2, P, 14, 0.3), { tone: 'hi' }));
		out.push(L(k.knurl(box.x + 25, box.y + 7, 2.8, 10, 12, 12, P, 0.2), { tone: 'lo' }));
		for (const dx of [5, 10, 15, 20]) out.push(L(k.segment([box.x + dx, f, 3], [box.x + dx, f, 7], P), { tone: 'faint', free: true }));
		out.push(D(k.corners(box, 2.6).map(([x, y]) => at([x, y, 10])), { size: 0.4 }));
		out.push(wire([[box.x + box.w, -68], [147, -68], [147, -30], [142, -30]]));
		out.push(D([at([box.x + box.w + 0.4, -68, 3]), at([142, -30, 2])], { size: 0.8, tone: 'hi' }));
		return out.join('');
	}

	function belt(cy: number) {
		const lane: Plan = { x: BELT_X0, y: cy - 13, w: BELT_X1 - BELT_X0, d: 26, r: 2 };
		const out = [halo(lane, 0, BELT_Z)];
		out.push(S(k.slabOf(lane, 0, BELT_Z, P, 3, 0.4), { tone: 'lo', inner: L(k.sideSeam(lane, 2, P, 3), { tone: 'faint' }) }));
		for (const y of [lane.y, lane.y + lane.d - 3]) out.push(box({ x: lane.x, y, w: lane.w, d: 3, r: 1 }, BELT_Z, 3, 'mid', 2, 0.2));
		for (let x = lane.x + 8; x < lane.x + lane.w - 4; x += 8) out.push(L(k.lineOnTop([x, lane.y + 3], [x, lane.y + lane.d - 3], BELT_Z, P), { tone: 'faint' }));
		for (const x of [lane.x + 4, lane.x + lane.w - 6]) out.push(box({ x: x - 1, y: lane.y + 3, w: 4, d: lane.d - 6, r: 2 }, BELT_Z, 1.6, 'hi', 3, 0));
		out.push(D([at([lane.x + 3, lane.y + 1.5, BELT_Z + 3]), at([lane.x + lane.w - 4, lane.y + 1.5, BELT_Z + 3])], { size: 0.5, tone: 'hi' }));
		const dir = cy === LANE_A ? 1 : -1;
		for (let x = lane.x + 30; x < lane.x + lane.w - 14; x += 32) out.push(L(k.onTop([[x - 2 * dir, cy - 3], [x + 1.6 * dir, cy], [x - 2 * dir, cy + 3]], BELT_Z, P), { tone: 'lo' }));
		out.push(D(k.corners(lane, 1.6).map(([x, y]) => at([x, y, BELT_Z + 3])), { size: 0.4 }));
		for (const x of [lane.x + 12, lane.x + lane.w / 2, lane.x + lane.w - 14]) out.push(S(k.slabOf({ x: x - 3, y: lane.y + lane.d, w: 6, d: 1.4, r: 0.4 }, 0, 3.4, P, 2), { tone: 'lo', crease: 'none' }));
		return out.join('');
	}

	function till() {
		const out = [halo(TILL, 0, TILL_H)];
		out.push(S(k.slabOf(TILL, 0, TILL_H, P, 4, 0.8), { tone: 'mid', inner: L(k.sideSeam(TILL, 8, P, 4), { tone: 'faint' }) }));
		const front = TILL.y + TILL.d;
		out.push(box({ x: TILL.x + 8, y: front, w: 66, d: 1.6, r: 0.6 }, 9, 12, 'lo', 2, 0.2));
		out.push(box({ x: TILL.x + 30, y: front + 1.6, w: 22, d: 2, r: 0.8 }, 12, 3, 'hi', 2, 0.2));
		out.push(L(k.rise([TILL.x + 41, front + 3.6], 1, 7, P), { tone: 'faint', free: true }));
		out.push(L(k.planOutline(k.insetPlan(TILL, 3), TILL_H, P), { tone: 'faint' }));
		for (let i = 0; i < 6; i++) for (const z of [18, 21, 24]) out.push(D([at([TILL.x + 8 + i * 3.4, front, z])], { size: 0.3, tone: 'mid' }));
		out.push(S(k.slabOf({ x: TILL.x + 60, y: front, w: 14, d: 0.8, r: 0.3 }, 14, 6, P, 2), { tone: 'lo', crease: 'none' }));
		out.push(L(k.segment([TILL.x + 62, front + 0.8, 17], [TILL.x + 72, front + 0.8, 17], P), { tone: 'mid', free: true }));
		for (const x of [TILL.x + 6, TILL.x + TILL.w - 6]) out.push(S(k.slabOf({ x: x - 3, y: front - 0.4, w: 6, d: 0.8, r: 0.3 }, 0, 2.4, P, 2), { tone: 'lo', crease: 'none' }));
		out.push(D(k.corners(TILL, 3).map(([x, y]) => at([x, y, TILL_H])), { size: 0.4 }));
		const keys: Plan = { x: TILL.x + 8, y: TILL.y + 26, w: 50, d: 38, r: 2 };
		out.push(S(k.slabOf(keys, TILL_H, 1, P, 3), { tone: 'lo', crease: 'none' }));
		for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) out.push(box({ x: keys.x + 4 + i * 11.5, y: keys.y + 4 + j * 11, w: 8.5, d: 8, r: 1.4 }, TILL_H + 1, 2, 'hi', 2, 0.3));
		const pr: Plan = { x: TILL.x + 56, y: TILL.y + 6, w: 22, d: 16, r: 2 };
		out.push(box(pr, TILL_H, 10, 'mid', 3, 0.5));
		out.push(S(k.slabOf({ x: pr.x + 4, y: pr.y + pr.d - 5, w: 14, d: 2.4, r: 0.6 }, TILL_H + 10, 0.6, P, 2), { tone: 'lo', crease: 'none' }));
		out.push(S(k.slabOf({ x: pr.x + 5, y: pr.y + pr.d - 4.5, w: 12, d: 0.8, r: 0.3 }, TILL_H + 10, 15, P, 2), { tone: 'hi', crease: 'none' }));
		for (const z of [TILL_H + 14, TILL_H + 18, TILL_H + 22]) out.push(L(k.segment([pr.x + 7, pr.y + pr.d - 3.7, z], [pr.x + 15, pr.y + pr.d - 3.7, z], P), { tone: 'mid', free: true }));
		const post: Plan = { x: TILL.x + 8, y: TILL.y + 6, w: 8, d: 8, r: 1.5 };
		out.push(box(post, TILL_H, 12, 'mid', 3, 0.4));
		const scr: Plan = { x: TILL.x + 6, y: TILL.y + 4, w: 48, d: 4, r: 1.4 };
		out.push(box(scr, TILL_H + 10, 34, 'mid', 3, 0.5));
		const sf = scr.y + scr.d;
		const face: Plan = { x: scr.x + 3, y: sf, w: scr.w - 6, d: 0.6, r: 0.4 };
		out.push(stepSvg('lit-at', 4, S(k.slabOf(face, TILL_H + 14, 26, P, 2), { tone: 'hi', lit: true })));
		for (const z of [TILL_H + 34, TILL_H + 29, TILL_H + 24, TILL_H + 19]) {
			out.push(L(k.segment([face.x + 9, sf + 0.6, z], [face.x + face.w - 8, sf + 0.6, z], P), { tone: 'mid', free: true }));
			out.push(L(k.ring(face.x + 4.5, sf + 0.6, 1.1, z, P, 10), { tone: 'mid', free: true }));
		}
		return out.join('');
	}

	function card([cx, cy, z]: Point3) {
		const plan: Plan = { x: cx - 8, y: cy - 11, w: 16, d: 22, r: 1.2 };
		const top = z + 1.4;
		return (
			S(k.slabOf(plan, z, 1.4, P, 2, 0.3), { tone: 'hi' }) +
			L(k.planOutline(k.insetPlan(plan, 2), top, P), { tone: 'faint' }) +
			L(k.lineOnTop([cx - 4, cy - 5], [cx + 4, cy - 5], top, P) + k.lineOnTop([cx - 4, cy - 1], [cx + 4, cy - 1], top, P) + k.lineOnTop([cx - 4, cy + 3], [cx + 1, cy + 3], top, P), { tone: 'mid', free: true }) +
			D([at([cx + 4, cy + 7, top])], { size: 0.8, tone: 'mid' })
		);
	}
	function ticket([cx, cy, z]: Point3) {
		const plan: Plan = { x: cx - 6, y: cy - 11, w: 12, d: 22, r: 0.6 };
		const top = z + 0.9;
		const out = [S(k.slabOf(plan, z, 0.9, P, 2, 0.2), { tone: 'hi' })];
		for (const dy of [-6, -2, 2]) out.push(L(k.lineOnTop([cx - 3, cy + dy], [cx + 3, cy + dy], top, P), { tone: 'mid', free: true }));
		out.push(D([at([cx - 4, cy + 8, top]), at([cx - 1.3, cy + 8, top]), at([cx + 1.4, cy + 8, top]), at([cx + 4, cy + 8, top])], { size: 0.5, tone: 'mid' }));
		return out.join('');
	}

	function stand() {
		const out = [halo(STAND, 0, 4)];
		out.push(S(k.slabOf(STAND, 0, 4, P, 3, 0.7), { tone: 'mid', inner: L(k.sideSeam(STAND, 2, P, 3), { tone: 'faint' }) }));
		out.push(L(k.planOutline(k.insetPlan(STAND, 4), 4, P), { tone: 'faint' }));
		const foot = k.corners(STAND, 8);
		out.push(L(foot.map(([x, y]) => k.ring(x, y, 1.8, 4, P, 14)).join(''), { tone: 'lo' }));
		out.push(box({ x: 84, y: -34, w: 38, d: 8, r: 1.5 }, 4, 40, 'lo', 3, 0.3));
		const tab: Plan = { x: 70, y: -22, w: 66, d: 5, r: 2 };
		out.push(box(tab, 14, TAB_TOP - 14, 'mid', 4, 0.7));
		const f = tab.y + tab.d;
		const scr: Plan = { x: tab.x + 4, y: f, w: tab.w - 8, d: 0.6, r: 0.8 };
		out.push(S(k.slabOf(scr, 24, 42, P, 2), { tone: 'hi' }));
		for (const [i, z] of [58, 49, 40, 31].entries()) {
			out.push(L(k.segment([scr.x + 14, f + 0.6, z], [scr.x + scr.w - 12, f + 0.6, z], P), { tone: 'mid', free: true }));
			out.push(L(k.ring(scr.x + 6, f + 0.6, 2, z, P, 12), { tone: 'mid', free: true }));
			out.push(D([at([scr.x + scr.w - 5, f + 0.6, z])], { size: 0.9 - i * 0.05, tone: 'mid' }));
		}
		out.push(D([at([tab.x + tab.w / 2, f, 19])], { size: 0.8, tone: 'mid' }));
		out.push(D([at([tab.x + tab.w / 2, f, 67])], { size: 0.5, tone: 'mid' }));
		out.push(S(k.slabOf({ x: STAND.x + STAND.w - 12, y: STAND.y + 14, w: 8, d: 12, r: 1.4 }, 4, 6, P, 2, 0.3), { tone: 'hi' }));
		out.push(L(k.lineOnTop([STAND.x + STAND.w - 10, STAND.y + 17], [STAND.x + STAND.w - 6, STAND.y + 17], 10, P) + k.lineOnTop([STAND.x + STAND.w - 10, STAND.y + 21], [STAND.x + STAND.w - 6, STAND.y + 21], 10, P), { tone: 'mid', free: true }));
		out.push(S(k.slabOf({ x: STAND.x + 6, y: STAND.y + STAND.d - 8, w: 16, d: 3, r: 1 }, 4, 0.8, P, 2), { tone: 'lo', crease: 'none' }));
		out.push(L(k.sideSeam(STAND, 3, P, 3), { tone: 'faint' }));
		out.push(wire([[106, 12], [106, TERM.y]]));
		out.push(D([at([106, 12, 0.4]), at([106, TERM.y, 0.4])], { size: 0.8, tone: 'hi' }));
		return out.join('');
	}

	function terminal() {
		const out = [halo(TERM, 0, TERM_H)];
		out.push(S(k.slabOf(TERM, 0, TERM_H, P, 3, 0.7), { tone: 'mid', inner: L(k.sideSeam(TERM, 8, P, 3), { tone: 'faint' }) }));
		const f = TERM.y + TERM.d;
		out.push(box({ x: TERM.x + 5, y: f, w: 18, d: 0.8, r: 0.4 }, 12, 7, 'lo', 2, 0));
		out.push(L(k.planOutline(k.insetPlan(TERM, 3), TERM_H, P), { tone: 'faint' }));
		out.push(S(k.slabOf({ x: TERM.x + 6, y: TERM.y + 7, w: 16, d: 3, r: 1.2 }, TERM_H, 0.6, P, 3), { tone: 'lo', crease: 'none' }));
		out.push(D([at([TERM.x + 6, f - 3, TERM_H]), at([TERM.x + 22, f - 3, TERM_H])], { size: 0.5 }));
		for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) out.push(S(k.slabOf({ x: TERM.x + 4 + i * 6, y: TERM.y + 12 + j * 3, w: 4.4, d: 2.2, r: 0.5 }, TERM_H, 0.8, P, 2), { tone: 'hi', crease: 'none' }));
		out.push(S(k.slabOf({ x: TERM.x + TERM.w, y: TERM.y + 6, w: 0.8, d: 8, r: 0.3 }, 10, 2, P, 2), { tone: 'lo', crease: 'none' }));
		for (const z of [4, 7]) out.push(L(k.segment([TERM.x + 5, f, z], [TERM.x + 23, f, z], P), { tone: 'faint', free: true }));
		for (const x of [TERM.x + 4, TERM.x + TERM.w - 4]) out.push(S(k.slabOf({ x: x - 3, y: f - 0.4, w: 6, d: 0.8, r: 0.3 }, 0, 2, P, 2), { tone: 'lo', crease: 'none' }));
		return out.join('');
	}

	function coin([cx, cy, z]: Point3) {
		return (
			`<path class="iso-halo" d="${k.haloOf({ x: cx - 8, y: cy - 8, w: 16, d: 16, r: 8 }, z, 0.1, P)}" style="filter:blur(3px)"/>` +
			S(k.cylinder(cx, cy, 8, z, 2.4, P, 40, 0.6), { tone: 'hi' }) +
			L(k.knurl(cx, cy, 8, z, z + 2.4, 40, P, 0.3), { tone: 'lo' }) +
			L(k.ring(cx, cy, 5.4, z + 2.4, P, 32), { tone: 'mid' }) +
			D([at([cx, cy, z + 2.4])], { size: 0.6, tone: 'hi' })
		);
	}

	function plate() {
		const cx = -150;
		const cy = 58;
		const out = [`<path class="iso-halo" d="${k.haloOf({ x: cx - 18, y: cy - 18, w: 36, d: 36, r: 18 }, 0, 2, P)}"/>`];
		out.push(S(k.cylinder(cx, cy, 18, 0, 2, P, 40, 0.5), { tone: 'mid' }));
		out.push(L(k.ring(cx, cy, 14, 2, P, 32), { tone: 'faint' }));
		out.push(L(k.ring(cx, cy, 17, 2, P, 36), { tone: 'faint' }));
		out.push(L(k.knurl(cx, cy, 18, 0, 2, 36, P, 0.3), { tone: 'faint' }));
		out.push(S(k.cylinder(-122, 66, 6, 0, 4, P, 20, 0.4), { tone: 'mid' }) + L(k.ring(-122, 66, 4.4, 4, P, 16), { tone: 'lo' }) + S(k.cylinder(-122, 66, 3.6, 3.6, 0.6, P, 14), { tone: 'hi' }));
		out.push(S(k.slabOf({ x: -186, y: 56, w: 1.8, d: 14, r: 0.5 }, 0, 0.8, P, 2), { tone: 'hi' }));
		out.push(S(k.slabOf({ x: -183, y: 56, w: 1.8, d: 14, r: 0.5 }, 0, 0.8, P, 2), { tone: 'hi' }));
		for (const [dx, dy] of [[-7, -5], [5, -7], [0, 0], [-8, 5], [7, 4], [0, 9]] as const) out.push(S(k.cylinder(cx + dx, cy + dy, 4.6, 2, 5.4, P, 16, 0.9), { tone: 'hi' }));
		return out.join('');
	}

	function stool([cx, cy]: [number, number]) {
		const out = [`<path class="iso-halo" d="${k.haloOf({ x: cx - 9, y: cy - 9, w: 18, d: 18, r: 9 }, 0, 14, P)}"/>`];
		out.push(S(k.cylinder(cx, cy, 8, 0, 1.6, P, 28, 0.3), { tone: 'lo' }));
		out.push(S(k.cylinder(cx, cy, 1.8, 1.6, 9, P, 12), { tone: 'mid' }));
		out.push(L(k.ring(cx, cy, 5, 1.6, P, 20), { tone: 'faint' }));
		out.push(S(k.cylinder(cx, cy, 8.4, 10.6, 3.4, P, 32, 0.8), { tone: 'hi' }));
		out.push(L(k.ring(cx, cy, 6.4, 14, P, 28), { tone: 'faint' }));
		out.push(L(k.sideArc(cx, cy, 8.4, 12.4, P, 20), { tone: 'faint' }));
		out.push(D([at([cx, cy, 14])], { size: 0.4 }));
		return out.join('');
	}
	function props() {
		const out: string[] = [];
		out.push(stool([-44, 46]), stool([-8, 46]));
		out.push(S(k.cylinder(-186, 38, 6, 0, 9, P, 20, 0.4), { tone: 'mid' }));
		out.push(L(k.sideArc(-186, 38, 6, 5, P, 14), { tone: 'faint' }) + L(k.ring(-186, 38, 4.4, 9, P, 14), { tone: 'lo' }));
		for (const [dz, r] of [[9, 5], [12, 4], [15, 2.8]] as const) out.push(S(k.cylinder(-186, 38, r, dz, 3, P, 14, 0.4), { tone: 'hi' }));

		const jar = [-96, 42] as const;
		out.push(S(k.cylinder(jar[0], jar[1], 6, 0, 12, P, 24, 0.5), { tone: 'mid' }) + L(k.sideArc(jar[0], jar[1], 6, 6, P, 16), { tone: 'faint' }) + L(k.ring(jar[0], jar[1], 4.4, 12, P, 16), { tone: 'lo' }) + S(k.cylinder(jar[0], jar[1], 6.4, 12, 1.4, P, 24, 0.3), { tone: 'hi' }));
		out.push(S(k.slabOf({ x: jar[0] - 2.5, y: jar[1] - 0.6, w: 5, d: 1.2, r: 0.4 }, 12.6, 0.8, P, 2), { tone: 'lo', crease: 'none' }));
		const bell = [-76, 36] as const;
		out.push(S(k.cylinder(bell[0], bell[1], 5, 0, 1.4, P, 20, 0.3), { tone: 'lo' }) + S(k.cylinder(bell[0], bell[1], 3.8, 1.4, 3, P, 18, 0.6), { tone: 'hi' }) + S(k.cylinder(bell[0], bell[1], 1, 4.4, 1.6, P, 10), { tone: 'mid' }) + L(k.sideArc(bell[0], bell[1], 3.8, 3, P, 14), { tone: 'faint' }));
		const tent = [-60, 30] as const;
		out.push(S(k.slabOf({ x: tent[0], y: tent[1], w: 14, d: 1.2, r: 0.4 }, 0, 12, P, 2, 0.3), { tone: 'hi' }));
		out.push(L(k.lineOnTop([tent[0] + 3, tent[1] + 0.6], [tent[0] + 11, tent[1] + 0.6], 12, P), { tone: 'mid', free: true }));
		for (const z of [4, 6.6, 9.2]) out.push(L(k.segment([tent[0] + 3, tent[1] + 1.2, z], [tent[0] + 11 - (z === 4 ? 4 : 0), tent[1] + 1.2, z], P), { tone: 'mid', free: true }));
		out.push(S(k.slabOf({ x: tent[0] + 3, y: tent[1] - 3, w: 8, d: 3, r: 0.6 }, 0, 1.6, P, 2), { tone: 'lo' }));
		return out.join('');
	}

	const A = [CARD_X, LANE_A, BELT_Z] as Point3;
	const T = [TICKET_X, LANE_B, BELT_Z] as Point3;
	const C = [TERM.x + TERM.w / 2, TERM.y + 9, TERM_H] as Point3;
	const span = TICKET_X - CARD_X;
	const transforms = transformsFrom(P, {
		card: [[0, 0, 0], [span, 0, 0], [span, 0, 0], [span, 0, 0]],
		coin: [[0, 0, FALL], [0, 0, FALL], [0, 0, 0], [0, 0, 0]],
		ticket: [[0, 0, 0], [0, 0, 0], [0, 0, 0], [-span, 0, 0]],
	});

	const svg = k.figureSvg({
		width,
		height,
		label:
			'A shop till with a screen and receipt printer joined by two belts to a tablet on a stand. A menu card rides one belt from the till to the tablet, a coin drops into the payment reader, and an order ticket rides the other belt back to the till, whose screen lights up.',
		body: [
			base(),
			backStuff(),
			belt(LANE_A),
			belt(LANE_B),
			till(),
			moverSvg('card', transforms.card[3], card(A)),
			stand(),
			stepSvg('show-from', 3, moverSvg('ticket', transforms.ticket[3], ticket(T))),
			props(),
			terminal(),
			stepSvg('show-from', 3, moverSvg('coin', transforms.coin[3], coin(C))),
			plate(),
		],
	});
	return { svg, labels: LABELS, transforms };
}
