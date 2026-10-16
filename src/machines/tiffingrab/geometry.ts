import * as k from '../../lib/anatomy/iso-kit';
import type { Plan, Plane, Point3 } from '../../lib/anatomy/iso-kit';
import { moverSvg, stepSvg, transformsFrom, type Machine } from '../../lib/plate';

export const LABELS = ['customer picks meals', 'kitchen packs', 'labelled tins', 'driver delivers'] as const;
export const CAPTION = 'Customers choose their meals for the week. The kitchen gets the packing sheet and labels, and drivers get their routes.';

const BASE: Plan = { x: -205, y: -92, w: 410, d: 184, r: 8 };
const BASE_H = 10;
const FOOT_H = 5;
const COUNTER: Plan = { x: -192, y: -76, w: 224, d: 62, r: 3 };
const COUNTER_H = 18;
const PREP: Plan = { x: -182, y: -66, w: 56, d: 42, r: 2 };
const PREP_TOP = 46;
const TIN_R = 21;
const TIN_H = 14;
const STACK: [number, number] = [-80, -45];
const PRINTER: Plan = { x: -24, y: -64, w: 48, d: 36, r: 3 };
const PRINTER_TOP = 62;
const LID_TOP = 62;
const HOUSE: Plan = { x: 134, y: -66, w: 56, d: 44, r: 2 };
const ROAD: Plan = { x: -196, y: 28, w: 392, d: 54, r: 3 };
const VAN_Y = 55;
const DRIVE = 130;

export function tiffingrab(width = 720, height = 480): Machine {
	const P = k.fitProjection(
		[...k.boxCorners(BASE, -BASE_H - FOOT_H, 0), [STACK[0], STACK[1], LID_TOP + 12], [PRINTER.x, PRINTER.y, PRINTER_TOP + 14], [HOUSE.x + HOUSE.w, HOUSE.y, 56], [-182, 70, 62]],
		width,
		height,
		{ pad: 18, azimuth: 40, elevation: 38 },
	);
	const at = (p: Point3) => k.iso(p, P);
	const S = k.solidSvg;
	const L = k.lineSvg;
	const D = k.dotsSvg;
	const halo = (plan: Plan, z: number, h: number, blur = 0) => `<path class="iso-halo" d="${k.haloOf(plan, z, h, P)}"${blur ? ` style="filter:blur(${blur}px)"` : ''}/>`;
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
		const strip: Plan = { x: -60, y: BASE.y + BASE.d - 16, w: 200, d: 7, r: 1 };
		out.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: 'lo', crease: 'none' }));
		const ticks = k.topTicks(strip.x + 4, strip.x + strip.w - 4, 4, 5, strip.y + 0.8, 0.6, [2, 3.6], P);
		out.push(L(ticks.minor, { tone: 'lo' }), L(ticks.major, { tone: 'mid' }));
		return out.join('');
	}

	function road() {
		const out = [box(ROAD, 0, 1.2, 'lo', 3, 0.3)];
		out.push(L(k.lineOnTop([ROAD.x + 8, VAN_Y + 12], [ROAD.x + ROAD.w - 8, VAN_Y + 12], 1.2, P), { tone: 'faint' }));
		for (let x = ROAD.x + 14; x < ROAD.x + ROAD.w - 20; x += 22) out.push(L(k.lineOnTop([x, VAN_Y - 14], [x + 10, VAN_Y - 14], 1.2, P), { tone: 'mid' }));
		return out.join('');
	}

	function counter() {
		const out = [halo(COUNTER, 0, COUNTER_H)];
		out.push(S(k.slabOf(COUNTER, 0, COUNTER_H, P, 3, 0.8), { tone: 'mid', inner: L(k.sideSeam(COUNTER, COUNTER_H - 4, P, 3), { tone: 'faint' }) }));
		const front = COUNTER.y + COUNTER.d;
		for (const x of [-150, -90, -30, 10]) out.push(L(k.rise([x, front], 1, COUNTER_H - 5, P), { tone: 'faint' }));
		for (const x of [-170, -110, -50]) {
			out.push(box({ x: x - 7, y: front, w: 14, d: 2, r: 0.8 }, 9, 2.4, 'lo', 2, 0.2));
		}
		out.push(L(k.planOutline(k.insetPlan(COUNTER, 4), COUNTER_H, P), { tone: 'faint' }));
		return out.join('');
	}

	function prep() {
		const out = [halo(PREP, COUNTER_H, 2)];
		out.push(S(k.slabOf(PREP, COUNTER_H, PREP_TOP - COUNTER_H, P, 3, 0.6), { tone: 'mid', inner: L(k.sideSeam(PREP, 32, P, 3), { tone: 'faint' }) }));
		out.push(L(k.ring(-154, -45, TIN_R + 3, PREP_TOP, P, 40), { tone: 'faint' }));
		for (const z of [26, 38]) out.push(L(k.lineOnTop([PREP.x + 4, PREP.y + PREP.d], [PREP.x + PREP.w - 4, PREP.y + PREP.d], z, P), { tone: 'faint', free: true }));
		return out.join('');
	}

	function tin([cx, cy, z]: Point3, opts: { lid?: boolean } = {}) {
		const out = [S(k.cylinder(cx, cy, TIN_R, z, TIN_H, P, 44, 0.5), { tone: 'mid' })];
		out.push(L(k.sideArc(cx, cy, TIN_R, z + 3, P, 30), { tone: 'faint' }));
		out.push(L(k.sideArc(cx, cy, TIN_R, z + TIN_H - 3, P, 30), { tone: 'faint' }));
		out.push(L(k.ring(cx, cy, TIN_R - 2.5, z + TIN_H, P, 40), { tone: 'lo' }));
		if (opts.lid) {
			out.push(S(k.cylinder(cx, cy, TIN_R - 2, z + TIN_H, 2, P, 40, 0.3), { tone: 'hi' }));
			out.push(S(k.cylinder(cx, cy, 3, z + TIN_H + 2, 3, P, 18, 0.3), { tone: 'hi' }));
		}
		return out.join('');
	}
	function clip([cx, cy]: [number, number], z0: number, z1: number) {
		const bar: Plan = { x: cx - 3, y: cy + TIN_R - 0.5, w: 6, d: 2.4, r: 0.6 };
		return box(bar, z0, z1 - z0, 'hi', 2, 0.2) + D([at([cx, cy + TIN_R + 1.9, z0 + 3]), at([cx, cy + TIN_R + 1.9, z1 - 3])], { size: 0.4, tone: 'hi' });
	}

	function stackBase() {
		const [cx, cy] = STACK;
		return tin([cx, cy, COUNTER_H]) + tin([cx, cy, COUNTER_H + TIN_H]) + `<path class="iso-halo" d="${k.haloOf({ x: cx - 6, y: cy - 6, w: 12, d: 12, r: 6 }, COUNTER_H, 0.1, P)}" style="opacity:0"/>`;
	}
	const stackTin3 = (c: [number, number, number]) => tin(c, { lid: true });
	const clips = () => clip(STACK, COUNTER_H + 2, LID_TOP - 6);

	function pot() {
		const cx = -42;
		const cy = -22;
		const z = COUNTER_H;
		const out = [S(k.cylinder(cx, cy, 10, z, 14, P, 32, 0.4), { tone: 'mid' })];
		out.push(L(k.sideArc(cx, cy, 10, z + 10, P, 24), { tone: 'faint' }));
		out.push(S(k.cylinder(cx, cy, 10.6, z + 14, 2, P, 32, 0.3), { tone: 'hi' }));
		out.push(S(k.cylinder(cx, cy, 2, z + 16, 3, P, 14), { tone: 'hi' }));
		for (const sx of [-1, 1]) out.push(box({ x: cx + sx * 12 - 2, y: cy - 1.5, w: 4, d: 3, r: 1 }, z + 9, 2.4, 'lo', 2, 0));
		return out.join('');
	}

	function printer() {
		const out = [halo(PRINTER, COUNTER_H, 2)];
		out.push(S(k.slabOf(PRINTER, COUNTER_H, PRINTER_TOP - COUNTER_H, P, 4, 0.8), { tone: 'mid', inner: L(k.sideSeam(PRINTER, 40, P, 4), { tone: 'faint' }) }));
		const front = PRINTER.y + PRINTER.d;
		out.push(S(k.slabOf({ x: PRINTER.x + 8, y: front - 1.5, w: PRINTER.w - 16, d: 2, r: 0.6 }, 28, 4, P, 2), { tone: 'lo', crease: 'none' }));
		for (const dx of [10, 18, 26]) out.push(D([at([PRINTER.x + dx, front + 0.2, 46])], { size: 0.7, tone: 'mid' }));
		out.push(L(k.ring(PRINTER.x + 36, PRINTER.y + 10, 8.5, PRINTER_TOP, P, 26), { tone: 'lo' }));
		out.push(S(k.cylinder(PRINTER.x + 36, PRINTER.y + 10, 7, PRINTER_TOP, 6, P, 26, 0.3), { tone: 'hi' }));
		out.push(L(k.ring(PRINTER.x + 36, PRINTER.y + 10, 2.4, PRINTER_TOP + 6, P, 14), { tone: 'mid' }));
		out.push(L(k.planOutline(k.insetPlan(PRINTER, 4), PRINTER_TOP, P), { tone: 'faint' }));
		out.push(stepSvg('lit-at', 3, S(k.slabOf({ x: PRINTER.x + 4, y: front - 8, w: 6, d: 4, r: 1 }, PRINTER_TOP, 1.2, P, 2), { tone: 'hi', lit: true })));
		return out.join('');
	}

	function label([cx, cy, z]: Point3) {
		const plan: Plan = { x: cx - 11, y: cy - 7, w: 22, d: 14, r: 1 };
		const top = z + 1.2;
		return (
			S(k.slabOf(plan, z, 1.2, P, 2, 0.2), { tone: 'hi' }) +
			L(k.lineOnTop([cx - 8, cy - 3], [cx + 6, cy - 3], top, P) + k.lineOnTop([cx - 8, cy + 1], [cx + 8, cy + 1], top, P) + k.lineOnTop([cx - 8, cy + 4.5], [cx - 1, cy + 4.5], top, P), { tone: 'mid', free: true })
		);
	}

	function house() {
		const out = [halo(HOUSE, 0, 30)];
		out.push(S(k.slabOf(HOUSE, 0, 34, P, 3, 0.6), { tone: 'mid', inner: L(k.sideSeam(HOUSE, 6, P, 3), { tone: 'faint' }) }));
		const front = HOUSE.y + HOUSE.d;
		out.push(S(k.slabOf({ x: HOUSE.x - 4, y: HOUSE.y - 4, w: HOUSE.w + 8, d: HOUSE.d + 8, r: 2 }, 34, 4, P, 3, 0.7), { tone: 'mid' }));
		out.push(box({ x: HOUSE.x + HOUSE.w - 14, y: HOUSE.y + 6, w: 8, d: 8, r: 1 }, 38, 12, 'lo', 2, 0));
		out.push(S(k.slabOf({ x: HOUSE.x + 8, y: front - 1, w: 14, d: 2, r: 0.5 }, 0.6, 24, P, 2), { tone: 'lo' }));
		out.push(D([at([HOUSE.x + 19, front + 1.2, 12])], { size: 0.8, tone: 'hi' }));
		out.push(L(k.sideRing([HOUSE.x + 40, front + 0.2, 20], 5, 'y', P, 20) + k.segment([HOUSE.x + 40, front + 0.2, 15], [HOUSE.x + 40, front + 0.2, 25], P) + k.segment([HOUSE.x + 35, front + 0.2, 20], [HOUSE.x + 45, front + 0.2, 20], P), { tone: 'mid' }));
		const mail: Plan = { x: HOUSE.x - 18, y: front - 6, w: 10, d: 7, r: 2 };
		out.push(box({ x: mail.x + 3, y: mail.y + 2, w: 3, d: 3, r: 0.6 }, 0, 12, 'lo', 2, 0));
		out.push(box(mail, 12, 8, 'hi', 3, 0.4));
		return out.join('');
	}

	function phone() {
		const stand: Plan = { x: -178, y: 34, w: 40, d: 18, r: 2 };
		const out = [halo(stand, 0, 3)];
		out.push(S(k.slabOf(stand, 0, 3, P, 3, 0.5), { tone: 'mid' }));
		const body: Plan = { x: stand.x + 5, y: stand.y + 6, w: 30, d: 4, r: 1.6 };
		out.push(S(k.slabOf(body, 3, 54, P, 3, 0.5), { tone: 'mid' }));
		const scr: Plan = { x: body.x + 2.5, y: body.y + body.d, w: body.w - 5, d: 0.6, r: 0.4 };
		out.push(stepSvg('lit-at', 1, S(k.slabOf(scr, 9, 44, P, 2), { tone: 'hi', lit: true })));
		const f = body.y + body.d + 0.6;
		for (const z of [50, 40, 30, 20]) {
			out.push(L(k.segment([scr.x + 8, f, z], [scr.x + scr.w - 2, f, z], P), { tone: 'mid', free: true }));
			out.push(L(k.ring(scr.x + 3.5, f, 1.2, z, P, 10), { tone: 'mid', free: true }));
		}
		out.push(D([at([body.x + body.w / 2, f, 5.5])], { size: 0.5, tone: 'mid' }));
		return out.join('');
	}

	function van([cx, cy, z]: Point3) {
		const out = [halo({ x: cx - 22, y: cy - 12, w: 46, d: 24, r: 4 }, z, 0.1, 3)];
		const body: Plan = { x: cx - 20, y: cy - 11, w: 28, d: 22, r: 2 };
		const cab: Plan = { x: cx + 8, y: cy - 11, w: 14, d: 22, r: 2 };
		out.push(box(cab, z + 3, 12, 'hi', 3, 0.4));
		out.push(box(body, z + 3, 18, 'hi', 3, 0.5));
		out.push(L(k.segment([cab.x + 2, cab.y + cab.d, z + 11], [cab.x + cab.w - 1, cab.y + cab.d, z + 11], P) + k.segment([cab.x + 2, cab.y + cab.d, z + 13.5], [cab.x + cab.w - 1, cab.y + cab.d, z + 13.5], P), { tone: 'mid' }));
		out.push(L(k.sideSeam(body, z + 9, P, 3), { tone: 'faint' }));
		out.push(L(k.rise([cx - 4, body.y + body.d], z + 5, z + 19, P), { tone: 'mid' }));
		for (const wx of [cx - 11, cx + 14]) {
			out.push(L(k.sideRing([wx, cy + 11.1, z + 4.5], 4.6, 'y', P, 22) + k.sideRing([wx, cy + 11.1, z + 4.5], 2, 'y', P, 14), { tone: 'hi' }));
			out.push(D([at([wx, cy + 11.1, z + 4.5])], { size: 0.5, tone: 'hi' }));
		}
		out.push(D([at([cx + 22, cy + 6, z + 7])], { size: 0.8, tone: 'hi' }));
		for (const dx of [-12, -2]) out.push(S(k.cylinder(cx + dx, cy, 5, z + 21, 4, P, 20, 0.3), { tone: 'hi' }));
		return out.join('');
	}

	const movers = {
		tin3: { draw: stackTin3, home: [STACK[0], STACK[1], COUNTER_H + 2 * TIN_H] as Point3, steps: [[-74, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]] as Point3[] },
		label: { draw: label, home: [STACK[0], STACK[1], LID_TOP + 0.01] as Point3, steps: [[80, 6, 0], [80, 6, 0], [0, 0, 0], [0, 0, 0]] as Point3[] },
		van: { draw: van, home: [-45, VAN_Y, 0.01] as Point3, steps: [[0, 0, 0], [0, 0, 0], [0, 0, 0], [DRIVE, 0, 0]] as Point3[] },
	};
	const transforms = transformsFrom(P, Object.fromEntries(Object.entries(movers).map(([n, m]) => [n, m.steps])));
	const mover = (n: keyof typeof movers) => moverSvg(n, transforms[n][3], movers[n].draw(movers[n].home));

	const svg = k.figureSvg({
		width,
		height,
		label:
			'A kitchen counter with a stack of round tiffin tins, a label printer and a phone showing a meal menu. A tin is packed onto the stack, a printed label is fixed to it, and a small delivery van drives off along the road toward a customer’s door.',
		body: [base(), road(), house(), counter(), prep(), stackBase(), mover('tin3'), clips(), pot(), printer(), mover('label'), phone(), mover('van')],
	});
	return { svg, labels: LABELS, transforms };
}
