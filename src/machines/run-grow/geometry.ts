import * as k from '../../lib/anatomy/iso-kit';
import type { Plan, Plane, Point3 } from '../../lib/anatomy/iso-kit';
import { moverSvg, stepSvg, transformsFrom, type Machine } from '../../lib/plate';

export const LABELS = ['your app running', 'checked every day', 'fixed and improved', 'grows with you'] as const;
export const CAPTION = "Once you're live, we keep watch every day, fix what breaks and add what you need next.";

const BASE: Plan = { x: -175, y: -90, w: 350, d: 180, r: 8 };
const BASE_H = 12;
const FOOT_H = 6;

const CASE: Plan = { x: -150, y: -80, w: 100, d: 80, r: 3 };
const CASE_H = 34;

const BAY: Plan = { x: -30, y: -60, w: 60, d: 50, r: 3 };
const BAY_H = 12;
const BAY_C: Plane = [0, -35];
const SCREW: Plane = [22, -16];

const TRAY: Plan = { x: -30, y: 22, w: 60, d: 44, r: 3 };
const TRAY_FLOOR = BAY_H;
const SPARE_AT: Plane = [0, 44];

const RACK: Plan = { x: 46, y: 46, w: 26, d: 22, r: 2 };
const RACK_H = 14;
const TOOL_AT: Plane = [58, 54];

const PLINTH: Plan = { x: 85, y: -84, w: 60, d: 55, r: 3 };
const PLINTH_H = 6;
const MODULE: Plan = { x: 91, y: -78, w: 48, d: 43, r: 3 };
const MODULE_TOP = 66;
const DROP = 46;

const DIAL: Plane = [118, 38];
const DIAL_Z = 30;

const GEAR_Z = 36;
const GEAR_H = 5;
const BIG: Plane = [-112, -45];
const SMALL: Plane = [-77, -45];
const THIRD: Plane = [-77, -21];

const TO_BAY: Point3 = [BAY_C[0] - SPARE_AT[0], BAY_C[1] - SPARE_AT[1], BAY_H - TRAY_FLOOR];
const TO_SCREW: Point3 = [SCREW[0] - TOOL_AT[0], SCREW[1] - TOOL_AT[1], 0];
const ZERO: Point3 = [0, 0, 0];

export function runGrow(width = 720, height = 480): Machine {
	const P = k.fitProjection(
		[...k.boxCorners(BASE, -BASE_H - FOOT_H, 0), ...k.boxCorners(MODULE, 0, MODULE_TOP + 14), [TOOL_AT[0], TOOL_AT[1], 72]],
		width,
		height,
		{ pad: 20, azimuth: 40 },
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
	const slots = (face: 'x' | 'y', at0: number, from: number, to: number, step: number, z0: number, z1: number, half: number) => {
		let d = '';
		for (let v = from; v <= to; v += step) d += face === 'x' ? rectX(at0, v - half, v + half, z0, z1) : rectY(at0, v - half, v + half, z0, z1);
		return d;
	};

	function base() {
		const out = [halo(BASE, -BASE_H - FOOT_H, BASE_H)];
		for (const [x, y] of byDepth(k.corners(BASE, 24))) {
			out.push(S(k.cylinder(x, y, 8, -BASE_H - FOOT_H, 1.8, P, 28), { tone: 'lo' }));
			out.push(S(k.cylinder(x, y, 6, -BASE_H - FOOT_H + 1.8, FOOT_H - 1.8, P, 28), { tone: 'mid' }));
		}
		out.push(S(k.slabOf(BASE, -BASE_H, BASE_H, P, 8, 1.6), { tone: 'mid', inner: L(k.sideSeam(BASE, -BASE_H / 2, P), { tone: 'faint' }) }));
		out.push(L(k.planOutline(k.insetPlan(BASE, 5), 0, P), { tone: 'lo' }));
		const screws = k.corners(BASE, 11);
		out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(''), { tone: 'lo' }));
		out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
		const strip: Plan = { x: -150, y: BASE.y + BASE.d - 16, w: 190, d: 7, r: 1 };
		out.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: 'lo', crease: 'none' }));
		const ticks = k.topTicks(strip.x + 4, strip.x + strip.w - 4, 4, 5, strip.y + 0.8, 0.6, [2, 3.6], P);
		out.push(L(ticks.minor, { tone: 'lo' }), L(ticks.major, { tone: 'mid' }));
		out.push(D([at([strip.x + 2, strip.y + 3.5, 0.6]), at([strip.x + strip.w - 2, strip.y + 3.5, 0.6])], { size: 0.45 }));
		const label: Plan = { x: 96, y: BASE.y + BASE.d - 24, w: 44, d: 13, r: 1.5 };
		out.push(S(k.slabOf(label, 0, 0.8, P, 3), { tone: 'lo' }));
		for (const dy of [3.5, 6.5, 9.5]) out.push(L(k.lineOnTop([label.x + 5, label.y + dy], [label.x + label.w - (dy === 9.5 ? 16 : 5), label.y + dy], 0.8, P), { tone: 'faint', free: true }));
		out.push(D([at([label.x + 2, label.y + 2, 0.8]), at([label.x + label.w - 2, label.y + label.d - 2, 0.8])], { size: 0.4 }));
		const fx = BASE.x + BASE.w;
		const fy = BASE.y + BASE.d;
		out.push(L(slots('x', fx, -56, 56, 16, -4.8, -2.6, 5) + slots('y', fy, -120, 120, 30, -4.8, -2.6, 7), { tone: 'lo' }));
		out.push(dotsAt([-150, -90, -30, 30, 90, 150].map((x) => [x, fy, -9] as Point3), 0.45), dotsAt([-60, -20, 20, 60].map((y) => [fx, y, -9] as Point3), 0.45));
		out.push(L([-120, 0, 120].map((x) => k.ring(x, 83, 1.6, 0, P, 12)).join('') + [-60, 0, 60].map((y) => k.ring(166, y, 1.6, 0, P, 12)).join(''), { tone: 'lo' }), dotsAt([...[-120, 0, 120].map((x) => [x, 83, 0] as Point3), ...[-60, 0, 60].map((y) => [166, y, 0] as Point3)], 0.4));
		out.push(L(k.planOutline(k.insetPlan(BASE, 9), 0, P), { tone: 'faint' }));
		return out.join('');
	}

	function gearRing([cx, cy]: Plane, outer: number, root: number, teeth: number, phase: number): Plane[] {
		const pitch = (Math.PI * 2) / teeth;
		const ring: Plane[] = [];
		const at = (r: number, a: number): Plane => [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
		for (let i = 0; i < teeth; i++) {
			const a = phase + i * pitch;
			ring.push(at(root, a - 0.5 * pitch), at(root, a - 0.3 * pitch), at(outer, a - 0.17 * pitch), at(outer, a + 0.17 * pitch), at(root, a + 0.3 * pitch));
		}
		return ring;
	}
	function gear(c: Plane, outer: number, root: number, teeth: number, phase: number, hub: number) {
		const out = [halo({ x: c[0] - outer, y: c[1] - outer, w: outer * 2, d: outer * 2, r: outer }, GEAR_Z, 0.1, 3)];
		out.push(S(k.cylinder(c[0], c[1], hub + 2, CASE_H, GEAR_Z - CASE_H, P, 24), { tone: 'lo' }));
		out.push(S(k.extrude(gearRing(c, outer, root, teeth, phase), GEAR_Z, GEAR_H, P, { convex: false }), { tone: 'hi' }));
		const top = GEAR_Z + GEAR_H;
		out.push(L(k.ring(c[0], c[1], root - 2.5, top, P, 40), { tone: 'mid' }));
		for (let i = 0; i < 4; i++) {
			const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
			out.push(L(k.ring(c[0] + Math.cos(a) * root * 0.58, c[1] + Math.sin(a) * root * 0.58, root * 0.2, top, P, 16), { tone: 'lo' }));
		}
		out.push(S(k.cylinder(c[0], c[1], hub, top, 3, P, 24, 0.4), { tone: 'mid' }));
		out.push(D([at([c[0], c[1], top + 3])], { size: 0.55, tone: 'hi' }));
		return out.join('');
	}

	function backProps() {
		const out: string[] = [];
		const b: Plan = { x: -12, y: -86, w: 18, d: 7, r: 2 };
		out.push(halo({ ...b, x: b.x - 2, w: b.w + 4 }, 0, 20, 2), S(k.slabOf({ x: b.x - 2, y: b.y - 1, w: b.w + 4, d: b.d + 2, r: 1.5 }, 0, 1.6, P, 3, 0.4), { tone: 'lo' }), S(k.slabOf(b, 1.6, 19, P, 4, 0.8), { tone: 'hi' }));
		const [cx, f, cz] = [b.x + b.w / 2, b.y + b.d, 11];
		out.push(L(k.sideRing([cx, f, cz], 6.6, 'y', P, 32), { tone: 'mid' }));
		for (let i = 0; i < 12; i++) {
			const a = (i / 12) * Math.PI * 2;
			out.push(L(seg([cx + Math.sin(a) * 5.2, f, cz + Math.cos(a) * 5.2], [cx + Math.sin(a) * 6.2, f, cz + Math.cos(a) * 6.2]), { tone: i % 3 ? 'lo' : 'mid' }));
		}
		out.push(L(seg([cx, f, cz], [cx, f, cz + 4.4]) + seg([cx, f, cz], [cx + 3.4, f, cz - 1.4]), { tone: 'hi' }), D([at([cx, f, cz]), at([b.x + 3, f, 4]), at([b.x + b.w - 3, f, 4])], { size: 0.5, tone: 'hi' }));
		out.push(S(k.slabOf({ x: b.x + 4, y: b.y + 2, w: b.w - 8, d: 3, r: 1 }, 20.6, 2, P, 3, 0.3), { tone: 'mid' }));
		const [lx, ly] = [50, -42];
		out.push(halo({ x: lx - 8, y: ly - 8, w: 16, d: 16, r: 8 }, 0, 3, 2));
		out.push(S(k.cylinder(lx, ly, 8, 0, 2.4, P, 28, 0.6), { tone: 'mid' }), L(k.ring(lx, ly, 5.6, 2.4, P, 20), { tone: 'lo' }));
		out.push(S(k.cylinder(lx, ly, 1.3, 2.4, 40, P, 12), { tone: 'hi', crease: 'none' }), S(k.cylinder(lx, ly, 2.6, 22, 2, P, 14), { tone: 'mid' }));
		out.push(S(k.cylinder(lx, ly, 8, 42, 9, P, 28, 0.8), { tone: 'hi' }), L(k.sideArc(lx, ly, 8, 46, P, 24), { tone: 'mid' }), L(k.ring(lx, ly, 5, 51, P, 20), { tone: 'lo' }));
		out.push(S(k.cylinder(lx, ly, 2.2, 51, 2.4, P, 12), { tone: 'mid' }), D([at([lx, ly, 53.4]), at([lx, ly, 24])], { size: 0.45, tone: 'hi' }));
		out.push(k.wireSvg(at([lx + 7.6, ly + 1, 0.6]), at([90, PLINTH.y + PLINTH.d, 3]), { via: [at([76, -41, 0.6]), at([76, -24, 0.6]), at([90, -24, 0.6]), at([90, PLINTH.y + PLINTH.d, 0.6])], size: 1 }));
		out.push(k.wireSvg(at([-50, -20, 8]), at([-20, BAY.y + BAY.d, 4]), { via: [at([-46, -20, 0.6]), at([-46, -6, 0.6]), at([-20, -6, 0.6])], size: 1 }));
		out.push(k.wireSvg(at([DIAL[0] + 11, DIAL[1] - 17, 2]), at([128, PLINTH.y + PLINTH.d, 3]), { via: [at([128, 17, 0.6]), at([128, PLINTH.y + PLINTH.d, 0.6])], size: 1 }));
		out.push(S(k.slabOf({ x: 88, y: PLINTH.y + PLINTH.d, w: 5, d: 1.4, r: 0.4 }, 1.4, 3.4, P, 2), { tone: 'lo', crease: 'none' }), S(k.slabOf({ x: 126, y: PLINTH.y + PLINTH.d, w: 5, d: 1.4, r: 0.4 }, 1.4, 3.4, P, 2), { tone: 'lo', crease: 'none' }));
		return out.join('');
	}

	function frontProps() {
		const out: string[] = [];
		const [ox, oy] = [-110, 28];
		out.push(halo({ x: ox - 8, y: oy - 8, w: 16, d: 16, r: 8 }, 0, 12, 2), S(k.cylinder(ox, oy, 7, 0, 12, P, 24, 0.6), { tone: 'mid' }), L(k.ring(ox, oy, 7, 3, P, 24) + k.ring(ox, oy, 7, 9, P, 24), { tone: 'lo' }), L(k.knurl(ox, oy, 7, 3.4, 8.6, 20, P, 0.3), { tone: 'faint' }));
		out.push(S(k.cylinder(ox, oy, 5, 12, 1.6, P, 20), { tone: 'hi' }), S(k.cylinder(ox + 3, oy, 1.1, 13.6, 9, P, 10), { tone: 'hi', crease: 'none' }), S(k.cylinder(ox + 3, oy, 1.8, 22.6, 1.4, P, 12), { tone: 'mid' }), L(k.sideRing([ox - 2, oy, 18], 5, 'x', P, 20), { tone: 'mid' }), D([at([ox - 2, oy, 23]), at([ox, oy, 14])], { size: 0.4, tone: 'hi' }));
		const cl: Plan = { x: -84, y: 12, w: 26, d: 34, r: 1.5 };
		out.push(halo(cl, 0, 1.6, 2), S(k.slabOf(cl, 0, 1.6, P, 3, 0.4), { tone: 'mid' }), S(k.slabOf({ x: cl.x + 6, y: cl.y + 1, w: 14, d: 4, r: 1 }, 1.6, 1.4, P, 3, 0.3), { tone: 'lo' }));
		const sheet: Plan = { x: cl.x + 2.4, y: cl.y + 6, w: cl.w - 4.8, d: cl.d - 8.6, r: 0.4 };
		out.push(S(k.slabOf(sheet, 1.6, 0.4, P, 2), { tone: 'hi', crease: 'none' }));
		for (let i = 0; i < 4; i++) {
			const y = sheet.y + 3.2 + i * 6.2;
			out.push(L(k.planOutline({ x: sheet.x + 2, y: y - 1.4, w: 2.8, d: 2.8, r: 0 }, 2, P, 1), { tone: 'lo' }), L(k.lineOnTop([sheet.x + 7, y], [sheet.x + sheet.w - 2, y], 2, P), { tone: 'faint', free: true }));
		}
		out.push(L(k.lineOnTop([sheet.x + 2.4, sheet.y + 3.4], [sheet.x + 3.6, sheet.y + 4.8], 2, P) + k.lineOnTop([sheet.x + 3.6, sheet.y + 4.8], [sheet.x + 4.8, sheet.y + 2.2], 2, P) + k.lineOnTop([sheet.x + 2.4, sheet.y + 9.6], [sheet.x + 3.6, sheet.y + 11], 2, P) + k.lineOnTop([sheet.x + 3.6, sheet.y + 11], [sheet.x + 4.8, sheet.y + 8.4], 2, P), { tone: 'hi' }));
		out.push(D([at([cl.x + 1.6, cl.y + 1.6, 1.6]), at([cl.x + cl.w - 1.6, cl.y + 1.6, 1.6]), at([cl.x + 1.6, cl.y + cl.d - 1.6, 1.6]), at([cl.x + cl.w - 1.6, cl.y + cl.d - 1.6, 1.6])], { size: 0.4 }));
		const w: Plane[] = [[-150, 54], [-118, 54], [-114, 57], [-118, 60], [-150, 60], [-154, 57]];
		out.push(halo({ x: -156, y: 52, w: 44, d: 10, r: 4 }, 0, 2.4, 2), S(k.extrude(w, 0, 2.4, P, { convex: false }), { tone: 'hi' }));
		out.push(L(k.ring(-116, 57, 1.2, 2.4, P, 10) + k.ring(-153, 57, 1.8, 2.4, P, 12), { tone: 'lo' }), L(k.lineOnTop([-146, 57], [-122, 57], 2.4, P), { tone: 'faint', free: true }));
		for (const [x, y] of [[-140, 42], [-132, 44], [-124, 41]] as const) out.push(S(k.cylinder(x, y, 2.6, 0, 2.2, P, 6), { tone: 'hi' }), L(k.ring(x, y, 1.1, 2.2, P, 10), { tone: 'lo' }));
		const [jx, jy] = [-90, 52];
		out.push(halo({ x: jx - 6, y: jy - 6, w: 12, d: 12, r: 6 }, 0, 9, 2), S(k.cylinder(jx, jy, 5.4, 0, 9, P, 20, 0.5), { tone: 'hi' }), L(k.ring(jx, jy, 5.4, 6, P, 20), { tone: 'faint' }), S(k.cylinder(jx, jy, 4.4, 9, 1.6, P, 16), { tone: 'mid' }), D([at([jx, jy, 10.6])], { size: 0.4, tone: 'hi' }));
		return out.join('');
	}

	function plant() {
		const out: string[] = [];
		const [px, py] = [160, 62];
		out.push(halo({ x: px - 7, y: py - 7, w: 14, d: 14, r: 7 }, 0, 8, 2), S(k.cylinder(px, py, 6.4, 0, 8, P, 28, 0.6), { tone: 'mid' }), L(k.ring(px, py, 5, 8, P, 22), { tone: 'lo' }), L(k.knurl(px, py, 6.4, 1, 5, 20, P, 0.3), { tone: 'faint' }), S(k.cylinder(px, py, 4.4, 8, 0.8, P, 20), { tone: 'lo', crease: 'none' }));
		for (const [dx, dy, h] of [[0, 0, 24], [-2.6, 1.2, 17], [2.6, -1, 19], [0.8, 2.6, 13]] as const) {
			out.push(L(seg([px, py, 8.8], [px + dx, py + dy, 8.8 + h]), { tone: 'mid' }));
			out.push(S(k.extrude([[px + dx - 3.4, py + dy], [px + dx, py + dy - 1.8], [px + dx + 3.4, py + dy], [px + dx, py + dy + 1.8]], 8.8 + h, 0.6, P), { tone: 'hi' }), L(k.lineOnTop([px + dx - 2.6, py + dy], [px + dx + 2.6, py + dy], 9.4 + h, P), { tone: 'faint' }));
		}
		return out.join('');
	}

	function gearCase() {
		const out = [halo(CASE, 0, CASE_H)];
		out.push(S(k.slabOf(CASE, 0, CASE_H, P, 3, 0.8), { tone: 'mid', inner: L(k.sideSeam(CASE, 22, P, 3), { tone: 'faint' }) + L(k.sideSeam(CASE, 4, P, 3), { tone: 'faint' }) }));
		const frontY = CASE.y + CASE.d;
		for (const x of [-132, -114, -96]) out.push(L(k.sideRing([x, frontY, 12], 3.4, 'y', P, 18), { tone: 'lo' }));
		const plate: Plan = { x: -80, y: frontY, w: 22, d: 1.2, r: 0.4 };
		out.push(S(k.slabOf(plate, 8, 9, P, 2), { tone: 'lo' }));
		out.push(D([at([-77, frontY + 1.2, 10]), at([-61, frontY + 1.2, 15])], { size: 0.45 }));
		out.push(L(k.planOutline(k.insetPlan(CASE, 3), CASE_H, P), { tone: 'faint' }));
		out.push(L(slots('y', frontY, -140, -60, 14, 24.4, 28.4, 4) + rectY(frontY, -138, -90, 6, 19) + slots('x', CASE.x + CASE.w, -70, -10, 12, 25, 29, 4), { tone: 'lo' }));
		for (const z of [8, 16]) out.push(S(k.slabOf({ x: -139.6, y: frontY, w: 3, d: 1.2, r: 0.3 }, z, 2.4, P, 2), { tone: 'lo', crease: 'none' }));
		out.push(S(k.slabOf({ x: -118, y: frontY, w: 18, d: 1.2, r: 0.4 }, 19.4, 1.6, P, 2), { tone: 'mid', crease: 'none' }), dotsAt([[-146, frontY, 2], [-146, frontY, 31], [-54, frontY, 2], [-54, frontY, 31]], 0.45));
		const cr = CASE.x + CASE.w;
		out.push(S(k.slabOf({ x: cr, y: -50, w: 2.4, d: 20, r: 0.8 }, 14, 3.2, P, 2, 0.3), { tone: 'hi' }), S(k.slabOf({ x: cr, y: -49, w: 1.2, d: 2, r: 0.4 }, 10, 4.2, P, 2), { tone: 'lo', crease: 'none' }), S(k.slabOf({ x: cr, y: -31, w: 1.2, d: 2, r: 0.4 }, 10, 4.2, P, 2), { tone: 'lo', crease: 'none' }));
		out.push(S(k.slabOf({ x: cr, y: -26, w: 1.4, d: 8, r: 0.6 }, 4.4, 6.4, P, 2), { tone: 'lo', crease: 'none' }), dotsAt([[cr, -76, 2], [cr, -76, 31], [cr, -4, 2], [cr, -4, 31]], 0.45), L(rectX(cr, -74, -52, 5, 19), { tone: 'faint' }));
		for (const [x, y] of [[-146, -76], [-54, -76], [-146, -4], [-54, -4]] as const) out.push(S(k.cylinder(x, y, 2.4, CASE_H, 2.4, P, 12, 0.3), { tone: 'hi' }), L(k.knurl(x, y, 2.4, CASE_H, CASE_H + 2.4, 8, P, 0.2), { tone: 'lo' }), L(k.ring(x, y, 3.8, CASE_H, P, 12), { tone: 'faint' }));
		out.push(gear(BIG, 25, 19, 12, 0, 5), gear(SMALL, 17, 11.5, 8, Math.PI + Math.PI / 8, 4), gear(THIRD, 12, 8, 6, -Math.PI / 2, 3));
		return out.join('');
	}

	function gauge() {
		const [cx, cy] = DIAL;
		const out = [halo({ x: cx - 21, y: cy - 21, w: 42, d: 42, r: 21 }, 0, 4)];
		out.push(S(k.cylinder(cx, cy, 20, 0, 4, P, 40, 0.6), { tone: 'lo' }));
		out.push(S(k.cylinder(cx, cy, 5, 4, DIAL_Z - 10 - 4, P, 20), { tone: 'mid', crease: 'none' }));
		out.push(L(k.sideArc(cx, cy, 5, 12, P, 16), { tone: 'faint' }));
		out.push(S(k.cylinder(cx, cy, 10, DIAL_Z - 10, 3, P, 28), { tone: 'mid' }));
		out.push(S(k.cylinder(cx, cy, 18, DIAL_Z - 7, 7, P, 56, 0.8), { tone: 'hi' }));
		out.push(L(k.knurl(cx, cy, 18, DIAL_Z - 7, DIAL_Z, 40, P, 0.3), { tone: 'lo' }));
		out.push(L(k.ring(cx, cy, 15.5, DIAL_Z, P, 48), { tone: 'mid' }));
		out.push(L(k.ring(cx, cy, 11, DIAL_Z, P, 40), { tone: 'faint' }));
		const t = k.radialTicks(cx, cy, 15.5, 17, 4, DIAL_Z, [2, 3.6], P, -2.1, 4.2);
		out.push(L(t.minor, { tone: 'lo' }), L(t.major, { tone: 'mid' }));
		const tip = (a: number, r = 12.5) => [cx + Math.sin(a) * r, cy - Math.cos(a) * r] as Plane;
		const needle = (a: number) => {
			const [tx, ty] = tip(a, 13.5);
			const [sx, sy] = [Math.cos(a) * 1.5, Math.sin(a) * 1.5];
			const [bx, by] = tip(a + Math.PI, 4);
			return S(k.extrude([[tx, ty], [cx + sx, cy + sy], [bx, by], [cx - sx, cy - sy]], DIAL_Z + 2.4, 0.8, P), { tone: 'lo' });
		};
		out.push(S(k.cylinder(cx, cy, 2.6, DIAL_Z, 2.4, P, 16), { tone: 'mid' }));
		out.push(stepSvg('dim-from', 2, needle(-1.5)));
		out.push(stepSvg('show-from', 2, needle(0.55)));
		out.push(D([at([cx, cy, DIAL_Z + 2.4])], { size: 0.5, tone: 'hi' }));
		out.push(L(k.ring(cx, cy, 17, 4, P, 36) + k.ring(cx, cy, 20, 2, P, 40), { tone: 'lo' }), L(k.knurl(cx, cy, 20, 0.6, 3.4, 30, P, 0.3), { tone: 'faint' }));
		const bolts: Point3[] = [0, 1, 2, 3, 4, 5].map((i) => [cx + Math.cos(i * 1.047 + 0.5) * 16.6, cy + Math.sin(i * 1.047 + 0.5) * 16.6, 4]);
		out.push(L(bolts.map(([x, y]) => k.ring(x, y, 1.5, 4, P, 10)).join(''), { tone: 'lo' }), dotsAt(bolts, 0.4, 'hi'));
		out.push(L(k.ring(cx, cy, 5, 10, P, 18) + k.ring(cx, cy, 5, 14, P, 18), { tone: 'lo' }), L(k.ring(cx, cy, 10, DIAL_Z - 10 + 1.5, P, 24), { tone: 'faint' }));
		out.push(S(k.slabOf({ x: cx - 6, y: cy + 17.8, w: 12, d: 1.2, r: 0.4 }, 0.6, 3, P, 2), { tone: 'lo', crease: 'none' }), L(seg([cx - 4, cy + 19, 2.6], [cx + 4, cy + 19, 2.6]) + seg([cx - 4, cy + 19, 1.6], [cx + 1, cy + 19, 1.6]), { tone: 'faint', free: true }));
		out.push(L(k.sideArc(cx, cy, 18, DIAL_Z - 3.5, P, 40), { tone: 'lo' }), S(k.cylinder(cx + 16, cy + 8, 1.4, DIAL_Z - 5, 3, P, 8), { tone: 'mid', crease: 'none' }));
		return out.join('');
	}

	function bay() {
		const [cx, cy] = BAY_C;
		const out = [halo(BAY, 0, BAY_H)];
		out.push(S(k.slabOf(BAY, 0, BAY_H, P, 3, 0.8), { tone: 'mid', inner: L(k.sideSeam(BAY, 4, P, 3), { tone: 'faint' }) }));
		out.push(L(k.ring(cx, cy, 17.5, BAY_H, P, 40), { tone: 'lo' }));
		out.push(L(k.ring(cx, cy, 15, BAY_H, P, 40), { tone: 'faint' }));
		for (const x of [-22, 22]) {
			out.push(S(k.cylinder(x, SCREW[1], 2.8, BAY_H, 1.6, P, 16), { tone: 'hi' }));
			out.push(L(k.lineOnTop([x - 1.8, SCREW[1]], [x + 1.8, SCREW[1]], BAY_H + 1.6, P), { tone: 'lo', free: true }));
		}
		for (const x of [-22, 22]) out.push(S(k.cylinder(x, -54, 2.8, BAY_H, 1.6, P, 16), { tone: 'hi' }), L(k.lineOnTop([x - 1.8, -54], [x + 1.8, -54], BAY_H + 1.6, P), { tone: 'lo', free: true }));
		for (const a of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) out.push(S(k.cylinder(cx + Math.cos(a) * 19.2, cy + Math.sin(a) * 19.2, 1.2, BAY_H, 1.2, P, 10), { tone: 'mid', crease: 'none' }));
		const bf = BAY.y + BAY.d;
		out.push(L(slots('y', bf, -18, 18, 12, 4.4, 8, 4) + rectX(BAY.x + BAY.w, -50, -18, 3, 9), { tone: 'lo' }));
		out.push(S(k.slabOf({ x: BAY.x + BAY.w, y: -46, w: 0.8, d: 12, r: 0.4 }, 3.4, 5, P, 2), { tone: 'lo', crease: 'none' }), L(seg([BAY.x + BAY.w + 0.8, -44, 6.8], [BAY.x + BAY.w + 0.8, -35, 6.8]) + seg([BAY.x + BAY.w + 0.8, -44, 5], [BAY.x + BAY.w + 0.8, -38, 5]), { tone: 'faint', free: true }));
		out.push(dotsAt([[BAY.x + 4, bf, 2.4], [BAY.x + BAY.w - 4, bf, 2.4], [BAY.x + BAY.w, BAY.y + 4, 2.4], [BAY.x + BAY.w, bf - 4, 2.4]], 0.4));
		out.push(S(k.slabOf({ x: -23, y: bf, w: 6, d: 2.6, r: 0.6 }, 2, 4.4, P, 2, 0.3), { tone: 'hi' }));
		return out.join('');
	}
	function cartridge([cx, cy]: Plane, z: number) {
		const out = [halo({ x: cx - 14, y: cy - 14, w: 28, d: 28, r: 14 }, z, 0.1, 3)];
		out.push(S(k.cylinder(cx, cy, 12.5, z, 12, P, 36, 0.6), { tone: 'hi' }));
		out.push(L(k.knurl(cx, cy, 12.5, z, z + 12, 28, P, 0.3), { tone: 'lo' }));
		out.push(L(k.sideArc(cx, cy, 12.5, z + 4, P, 24), { tone: 'mid' }));
		out.push(L(k.ring(cx, cy, 8.5, z + 12, P, 28), { tone: 'mid' }));
		out.push(S(k.cylinder(cx, cy, 3, z + 12, 2, P, 16), { tone: 'mid' }));
		out.push(D([at([cx, cy, z + 14])], { size: 0.5, tone: 'hi' }));
		return out.join('');
	}

	function trayBack() {
		const out = [halo(TRAY, 0, TRAY_FLOOR, 4)];
		out.push(S(k.slabOf(TRAY, 0, TRAY_FLOOR, P, 3, 0.6), { tone: 'mid', inner: L(k.sideSeam(TRAY, 4, P, 3), { tone: 'faint' }) }));
		out.push(L(k.ring(SPARE_AT[0], SPARE_AT[1], 15, TRAY_FLOOR, P, 40), { tone: 'faint' }));
		const side = (x: number): Plan => ({ x, y: TRAY.y, w: 4, d: TRAY.d - 4, r: 1 });
		for (const x of [TRAY.x, TRAY.x + TRAY.w - 4]) out.push(S(k.slabOf(side(x), TRAY_FLOOR, 6, P, 2, 0.4), { tone: 'mid' }));
		out.push(L(k.planOutline(k.insetPlan(TRAY, 7), TRAY_FLOOR, P), { tone: 'faint' }));
		const tr = TRAY.x + TRAY.w;
		out.push(L(rectX(tr, 30, 48, 14.4, 17) + rectX(tr, 52, 60, 3, 9), { tone: 'lo' }), D([at([tr, 26, 7]), at([tr, 62, 7]), at([tr, 36, 5.5]), at([tr, 50, 5.5])], { size: 0.4 }));
		out.push(L(k.sideSeam(TRAY, 8, P, 3), { tone: 'faint' }), D([at([TRAY.x + 2, TRAY.y + 4, TRAY_FLOOR + 6]), at([TRAY.x + 2, TRAY.y + TRAY.d - 8, TRAY_FLOOR + 6]), at([TRAY.x + TRAY.w - 2, TRAY.y + 4, TRAY_FLOOR + 6]), at([TRAY.x + TRAY.w - 2, TRAY.y + TRAY.d - 8, TRAY_FLOOR + 6])], { size: 0.4 }));
		return out.join('');
	}
	function trayFront() {
		const front: Plan = { x: TRAY.x, y: TRAY.y + TRAY.d - 4, w: TRAY.w, d: 4, r: 1 };
		const ff = front.y + front.d;
		return S(k.slabOf(front, TRAY_FLOOR, 6, P, 2, 0.4), { tone: 'mid' }) + L(rectY(ff, TRAY.x + 18, TRAY.x + 42, TRAY_FLOOR + 2, TRAY_FLOOR + 4.6), { tone: 'lo' }) + L(seg([TRAY.x + 22, ff, TRAY_FLOOR + 3.3], [TRAY.x + 38, ff, TRAY_FLOOR + 3.3]), { tone: 'faint', free: true }) + D([at([TRAY.x + 5, front.y + 4, TRAY_FLOOR + 6]), at([TRAY.x + TRAY.w - 5, front.y + 4, TRAY_FLOOR + 6])], { size: 0.4 });
	}

	function rack() {
		const out = [halo(RACK, 0, RACK_H)];
		out.push(S(k.slabOf(RACK, 0, RACK_H, P, 3, 0.6), { tone: 'mid' }));
		out.push(L(k.ring(TOOL_AT[0], TOOL_AT[1], 4.4, RACK_H, P, 20), { tone: 'lo' }));
		const [bx, by] = [RACK.x + 19, RACK.y + 14];
		out.push(L(k.ring(bx, by, 2.6, RACK_H, P, 16), { tone: 'lo' }));
		out.push(S(k.cylinder(bx, by, 2, RACK_H, 7, P, 12), { tone: 'mid' }));
		out.push(D([at([RACK.x + 4, RACK.y + 4, RACK_H]), at([RACK.x + RACK.w - 4, RACK.y + RACK.d - 4, RACK_H])], { size: 0.4 }));
		out.push(L(k.sideSeam(RACK, 7, P, 3), { tone: 'faint' }), L(k.planOutline(k.insetPlan(RACK, 2), RACK_H, P), { tone: 'faint' }));
		const rf = RACK.y + RACK.d;
		out.push(S(k.slabOf({ x: RACK.x + 4, y: rf, w: 14, d: 0.8, r: 0.3 }, 3, 6, P, 2), { tone: 'lo', crease: 'none' }), L(seg([RACK.x + 6, rf + 0.8, 7.6], [RACK.x + 16, rf + 0.8, 7.6]) + seg([RACK.x + 6, rf + 0.8, 5.6], [RACK.x + 13, rf + 0.8, 5.6]), { tone: 'faint', free: true }));
		out.push(dotsAt([[RACK.x + 2, rf, 2], [RACK.x + RACK.w - 2, rf, 2], [RACK.x + 2, rf, RACK_H - 2], [RACK.x + RACK.w - 2, rf, RACK_H - 2]], 0.4));
		const rr = RACK.x + RACK.w;
		out.push(L(slots('x', rr, RACK.y + 5, RACK.y + 17, 6, 4, 10, 1.4), { tone: 'lo' }));
		for (const [hx, hy, h] of [[RACK.x + 7, RACK.y + 14, 5], [RACK.x + 13, RACK.y + 14, 8]] as const) out.push(L(k.ring(hx, hy, 2.6, RACK_H, P, 16), { tone: 'lo' }), S(k.cylinder(hx, hy, 1.6, RACK_H, h, P, 10), { tone: 'hi' }), L(k.lineOnTop([hx - 1.1, hy], [hx + 1.1, hy], RACK_H + h, P), { tone: 'lo', free: true }));
		return out.join('');
	}
	function screwdriver([cx, cy]: Plane) {
		const out = [halo({ x: cx - 6, y: cy - 6, w: 12, d: 12, r: 6 }, RACK_H, 0.1, 2)];
		out.push(S(k.cylinder(cx, cy, 1.4, RACK_H, 28, P, 12), { tone: 'hi', crease: 'none' }));
		out.push(S(k.cylinder(cx, cy, 3.4, RACK_H + 26, 4, P, 20), { tone: 'mid' }));
		out.push(S(k.cylinder(cx, cy, 4.6, RACK_H + 30, 22, P, 24, 0.5), { tone: 'hi' }));
		out.push(L(k.knurl(cx, cy, 4.6, RACK_H + 32, RACK_H + 50, 18, P, 0.3), { tone: 'lo' }));
		out.push(L(k.sideArc(cx, cy, 4.6, RACK_H + 40, P, 16), { tone: 'mid' }));
		out.push(S(k.cylinder(cx, cy, 3.4, RACK_H + 52, 1.5, P, 20), { tone: 'mid' }));
		return out.join('');
	}

	function tower() {
		const out = [halo(PLINTH, 0, PLINTH_H)];
		out.push(S(k.slabOf(PLINTH, 0, PLINTH_H, P, 3, 0.8), { tone: 'mid' }));
		out.push(L(k.planOutline(k.insetPlan(PLINTH, 3), PLINTH_H, P), { tone: 'faint' }));
		out.push(D(k.corners(PLINTH, 3).map(([x, y]) => at([x, y, PLINTH_H])), { size: 0.45 }));
		return out.join('');
	}
	function tallModule() {
		const out: string[] = [];
		const seams = [24, 58].map((z) => L(k.sideSeam(MODULE, z, P, 3), { tone: 'faint' })).join('');
		out.push(S(k.slabOf(MODULE, PLINTH_H, MODULE_TOP - PLINTH_H, P, 3, 0.8), { tone: 'hi', inner: seams }));
		const front = MODULE.y + MODULE.d;
		const win: Plan = { x: MODULE.x + 8, y: front, w: MODULE.w - 16, d: 1.4, r: 0.6 };
		out.push(S(k.slabOf(win, 28, 24, P, 2), { tone: 'lo' }));
		out.push(stepSvg('lit-at', 4, S(k.slabOf(k.insetPlan(win, 1.6), 30, 20, P, 2), { tone: 'hi', lit: true })));
		out.push(L(k.segment([win.x + win.w / 2, front + 1.4, 30], [win.x + win.w / 2, front + 1.4, 50], P), { tone: 'mid' }));
		const cap: Plan = { x: MODULE.x - 3, y: MODULE.y - 3, w: MODULE.w + 6, d: MODULE.d + 6, r: 3 };
		out.push(S(k.slabOf(cap, MODULE_TOP, 5, P, 3, 0.8), { tone: 'mid' }));
		out.push(L(k.planOutline(k.insetPlan(cap, 4), MODULE_TOP + 5, P), { tone: 'faint' }));
		for (const [x, y] of [[MODULE.x + 12, MODULE.y + 12], [MODULE.x + 28, MODULE.y + 12]]) {
			out.push(S(k.cylinder(x, y, 4, MODULE_TOP + 5, 4, P, 20, 0.4), { tone: 'hi' }));
			out.push(L(k.knurl(x, y, 4, MODULE_TOP + 5, MODULE_TOP + 9, 14, P, 0.3), { tone: 'lo' }));
		}
		const vent: Plan = { x: MODULE.x + 12, y: MODULE.y + 26, w: 24, d: 5, r: 2 };
		out.push(L(k.planOutline(vent, MODULE_TOP + 5, P), { tone: 'lo' }));
		const dots = [0, 1, 2].map((i) => at([MODULE.x + 6, front, 10 + i * 5]));
		const mr = MODULE.x + MODULE.w;
		out.push(L(slots('y', front, MODULE.x + 14, MODULE.x + 34, 10, 9, 21, 3.4) + slots('x', mr, MODULE.y + 8, MODULE.y + 34, 9, 9, 21, 3) + rectX(mr, MODULE.y + 6, MODULE.y + 20, 30, 52), { tone: 'lo' }));
		out.push(L(seg([mr, MODULE.y + 8, 40], [mr, MODULE.y + 18, 40]) + seg([mr, MODULE.y + 8, 34], [mr, MODULE.y + 15, 34]), { tone: 'faint', free: true }));
		for (const z of [14, 40]) out.push(S(k.slabOf({ x: mr, y: MODULE.y + MODULE.d - 8, w: 1.4, d: 5, r: 0.5 }, z, 3, P, 2), { tone: 'lo', crease: 'none' }));
		out.push(dotsAt([[MODULE.x + 6, front, 56], [MODULE.x + MODULE.w - 6, front, 56], [mr, MODULE.y + 6, 56], [mr, MODULE.y + MODULE.d - 6, 56], [mr, MODULE.y + 6, 10], [mr, MODULE.y + MODULE.d - 6, 10]], 0.4));
		out.push(D([at([MODULE.x + 6, front, 12]), at([MODULE.x + 6, front, 17]), at([MODULE.x + MODULE.w - 6, front, 12]), at([MODULE.x + MODULE.w - 6, front, 17]), ...dots.slice(0, 0)], { size: 0.45 }));
		return out.join('');
	}

	const transforms = transformsFrom(P, {
		spare: [ZERO, ZERO, TO_BAY, TO_BAY],
		tool: [ZERO, ZERO, TO_SCREW, ZERO],
		module: [[0, 0, DROP], [0, 0, DROP], [0, 0, DROP], ZERO],
	});

	const svg = k.figureSvg({
		width,
		height,
		label:
			'A small running machine on a workbench: two meshing gears in a housing, a dial gauge whose needle reads healthy, a tray holding a spare cartridge and a screwdriver. The spare cartridge is fitted into the bay with the screwdriver, and a new tall module with a lit window is added beside it, so the machine grows.',
		body: [
			base(),
			backProps(),
			gearCase(),
			frontProps(),
			bay(),
			stepSvg('dim-from', 3, cartridge(BAY_C, BAY_H)),
			trayBack(),
			moverSvg('spare', transforms.spare[3], cartridge(SPARE_AT, TRAY_FLOOR)),
			trayFront(),
			tower(),
			stepSvg('show-from', 4, moverSvg('module', transforms.module[3], tallModule())),
			rack(),
			moverSvg('tool', transforms.tool[3], screwdriver(TOOL_AT)),
			gauge(),
			plant(),
		],
	});
	return { svg, labels: LABELS, transforms };
}
