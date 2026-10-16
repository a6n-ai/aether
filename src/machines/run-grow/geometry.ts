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

	function gearCase() {
		const out = [halo(CASE, 0, CASE_H)];
		out.push(S(k.slabOf(CASE, 0, CASE_H, P, 3, 0.8), { tone: 'mid', inner: L(k.sideSeam(CASE, 22, P, 3), { tone: 'faint' }) + L(k.sideSeam(CASE, 4, P, 3), { tone: 'faint' }) }));
		const frontY = CASE.y + CASE.d;
		for (const x of [-132, -114, -96]) out.push(L(k.sideRing([x, frontY, 12], 3.4, 'y', P, 18), { tone: 'lo' }));
		const plate: Plan = { x: -80, y: frontY, w: 22, d: 1.2, r: 0.4 };
		out.push(S(k.slabOf(plate, 8, 9, P, 2), { tone: 'lo' }));
		out.push(D([at([-77, frontY + 1.2, 10]), at([-61, frontY + 1.2, 15])], { size: 0.45 }));
		out.push(L(k.planOutline(k.insetPlan(CASE, 3), CASE_H, P), { tone: 'faint' }));
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
		return out.join('');
	}
	function trayFront() {
		const front: Plan = { x: TRAY.x, y: TRAY.y + TRAY.d - 4, w: TRAY.w, d: 4, r: 1 };
		return S(k.slabOf(front, TRAY_FLOOR, 6, P, 2, 0.4), { tone: 'mid' }) + D([at([TRAY.x + 5, front.y + 4, TRAY_FLOOR + 6]), at([TRAY.x + TRAY.w - 5, front.y + 4, TRAY_FLOOR + 6])], { size: 0.4 });
	}

	function rack() {
		const out = [halo(RACK, 0, RACK_H)];
		out.push(S(k.slabOf(RACK, 0, RACK_H, P, 3, 0.6), { tone: 'mid' }));
		out.push(L(k.ring(TOOL_AT[0], TOOL_AT[1], 4.4, RACK_H, P, 20), { tone: 'lo' }));
		const [bx, by] = [RACK.x + 19, RACK.y + 14];
		out.push(L(k.ring(bx, by, 2.6, RACK_H, P, 16), { tone: 'lo' }));
		out.push(S(k.cylinder(bx, by, 2, RACK_H, 7, P, 12), { tone: 'mid' }));
		out.push(D([at([RACK.x + 4, RACK.y + 4, RACK_H]), at([RACK.x + RACK.w - 4, RACK.y + RACK.d - 4, RACK_H])], { size: 0.4 }));
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
			gearCase(),
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
		],
	});
	return { svg, labels: LABELS, transforms };
}
