import * as k from '../../lib/anatomy/iso-kit';
import type { Plan, Plane, Point3 } from '../../lib/anatomy/iso-kit';
import { moverSvg, stepSvg, transformsFrom, type Machine } from '../../lib/plate';

export const LABELS = ['your idea', 'drawn up', 'built from parts', 'open for customers'] as const;
export const CAPTION = 'Have an idea? We draw it up with you, build it from parts that already work, and open it to your customers.';

const BENCH: Plan = { x: -175, y: -82, w: 350, d: 164, r: 8 };
const BENCH_H = 12;
const FOOT_H = 6;

const TRAY: Plan = { x: -96, y: 10, w: 90, d: 52, r: 4 };
const TRAY_Z = 2;
const WALL = 4;
const WALL_TOP = 11;

const SILL: Plan = { x: 56, y: -60, w: 88, d: 30, r: 2 };
const SILL_H = 6;
const SHOP_TOP = 60;
const DOOR_H = 38;
const CANOPY_Z = SILL_H + DOOR_H + 3;
const PANE: Plan = { x: 110, y: -50, w: 24, d: 2, r: 0.4 };

const LIFT = 40;

interface Mover {
	name: 'door' | 'canopy' | 'planter';
	from: Point3;
	to: Point3;
}
export const MOVERS: Mover[] = [
	{ name: 'door', from: [-80, 50, TRAY_Z], to: [92, -49, SILL_H] },
	{ name: 'canopy', from: [-52, 28, TRAY_Z], to: [92, -50, CANOPY_Z] },
	{ name: 'planter', from: [-24, 46, TRAY_Z], to: [122, -40, SILL_H] },
];

function poseAt(step: number): Record<Mover['name'], Point3> {
	const pose = {} as Record<Mover['name'], Point3>;
	for (const m of MOVERS) {
		const travel: Point3 = [m.to[0] - m.from[0], m.to[1] - m.from[1], m.to[2] - m.from[2]];
		pose[m.name] = step <= 1 ? [0, 0, 0] : step === 2 ? [0, 0, LIFT] : travel;
	}
	return pose;
}

export function buildNew(width = 720, height = 480): Machine {
	const P = k.fitProjection(
		[...k.boxCorners(BENCH, -BENCH_H - FOOT_H, 0), [SILL.x, SILL.y, SHOP_TOP + 6], [-130, -10, 76], [-80, 50, TRAY_Z + LIFT + DOOR_H + 4]],
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

	function easel() {
		const out: string[] = [];
		const ledge: Plan = { x: -152, y: -14, w: 50, d: 12, r: 1.5 };
		const card: Plan = { x: -146, y: -10, w: 38, d: 1.6, r: 0.5 };
		const front = card.y + card.d;
		out.push(halo(ledge, 0, 14, 3));
		for (const x of [-150, -108]) out.push(S(k.slabOf({ x, y: -12, w: 5, d: 5, r: 1 }, 0, 80, P, 3, 0.4), { tone: 'mid' }));
		out.push(S(k.slabOf({ x: -152, y: -12.5, w: 50, d: 3, r: 0.8 }, 62, 3, P, 3, 0.4), { tone: 'mid' }));
		out.push(S(k.slabOf(ledge, 12, 3, P, 3, 0.5), { tone: 'mid' }));
		out.push(S(k.slabOf(card, 15, 44, P, 2, 0.3), { tone: 'hi' }));
		const cx = card.x + card.w / 2;
		out.push(L(k.sideRing([cx, front, 46], 8, 'y', P, 28), { tone: 'mid' }));
		out.push(L(k.segment([cx - 3, front, 37], [cx + 3, front, 37], P) + k.segment([cx - 2.5, front, 34], [cx + 2.5, front, 34], P), { tone: 'mid' }));
		out.push(L(k.segment([cx - 3, front, 41], [cx - 1.5, front, 45], P) + k.segment([cx + 3, front, 41], [cx + 1.5, front, 45], P) + k.segment([cx - 1.5, front, 45], [cx + 1.5, front, 45], P), { tone: 'lo' }));
		for (const [dx, dz] of [[-12, 0], [12, 0], [0, 12], [-9, 9], [9, 9]] as const) {
			const sx = dx === 0 ? 0 : Math.sign(dx);
			const sz = dz === 0 ? 0 : dz === 12 ? 1 : 0.7;
			out.push(L(k.segment([cx + dx * 0.8, front, 46 + dz * 0.75], [cx + dx * 0.8 + sx * 3, front, 46 + dz * 0.75 + sz * 3], P), { tone: 'lo' }));
		}
		out.push(L(k.segment([card.x + 3, front, 21], [card.x + 22, front, 21], P) + k.segment([card.x + 3, front, 24], [card.x + 14, front, 24], P), { tone: 'faint' }));
		out.push(D([at([card.x + 3, front, 56]), at([card.x + card.w - 3, front, 56]), at([card.x + 3, front, 18]), at([card.x + card.w - 3, front, 18])], { size: 0.4 }));
		out.push(S(k.slabOf({ x: -128, y: -1, w: 16, d: 2.4, r: 1 }, 15, 2.4, P, 3), { tone: 'hi', crease: 'none' }));
		return out.join('');
	}

	function sheet() {
		const sh: Plan = { x: -84, y: -64, w: 74, d: 46, r: 1.5 };
		const t = 0.8;
		const out = [halo(sh, 0, t, 2), S(k.slabOf(sh, 0, t, P, 3, 0.2), { tone: 'hi' })];
		out.push(L(k.planOutline(k.insetPlan(sh, 4), t, P), { tone: 'faint' }));
		out.push(L(k.planOutline({ x: -66, y: -52, w: 40, d: 18, r: 0 }, t, P, 1), { tone: 'mid' }));
		out.push(L(k.planOutline({ x: -60, y: -48, w: 10, d: 10, r: 0 }, t, P, 1) + k.planOutline({ x: -42, y: -48, w: 12, d: 10, r: 0 }, t, P, 1), { tone: 'lo' }));
		out.push(L(k.lineOnTop([-66, -28], [-26, -28], t, P) + k.lineOnTop([-66, -30.5], [-66, -25.5], t, P) + k.lineOnTop([-26, -30.5], [-26, -25.5], t, P), { tone: 'lo' }));
		out.push(L(k.lineOnTop([-18, -52], [-18, -34], t, P) + k.lineOnTop([-20.5, -52], [-15.5, -52], t, P) + k.lineOnTop([-20.5, -34], [-15.5, -34], t, P), { tone: 'lo' }));
		out.push(D([at([-80, -60, t]), at([-14, -60, t]), at([-80, -22, t]), at([-14, -22, t])], { size: 0.45 }));
		return stepSvg('show-from', 2, out.join(''));
	}

	function rulerAndPencil() {
		const ruler: Plan = { x: -86, y: -14, w: 78, d: 7, r: 0.8 };
		const out = [halo(ruler, 0, 1.6, 2), S(k.slabOf(ruler, 0, 1.6, P, 3, 0.3), { tone: 'hi' })];
		const ticks = k.topTicks(ruler.x + 3, ruler.x + ruler.w - 3, 3, 5, ruler.y + 0.8, 1.6, [1.6, 3], P);
		out.push(L(ticks.minor, { tone: 'lo' }), L(ticks.major, { tone: 'mid' }));
		out.push(halo({ x: -44, y: -3, w: 34, d: 4, r: 1.5 }, 0, 3, 2));
		out.push(S(k.slabOf({ x: -44, y: -3, w: 26, d: 4, r: 1.2 }, 0, 3, P, 3, 0.4), { tone: 'hi' }));
		out.push(S(k.slabOf({ x: -18, y: -2.4, w: 7, d: 2.8, r: 1 }, 0, 2.4, P, 3), { tone: 'mid', crease: 'none' }));
		out.push(L(k.lineOnTop([-40, -1], [-22, -1], 3, P), { tone: 'faint' }));
		return out.join('');
	}

	const tw = {
		back: { x: TRAY.x, y: TRAY.y, w: TRAY.w, d: WALL, r: 1 },
		left: { x: TRAY.x, y: TRAY.y + WALL, w: WALL, d: TRAY.d - WALL * 2, r: 1 },
		right: { x: TRAY.x + TRAY.w - WALL, y: TRAY.y + WALL, w: WALL, d: TRAY.d - WALL * 2, r: 1 },
		front: { x: TRAY.x, y: TRAY.y + TRAY.d - WALL, w: TRAY.w, d: WALL, r: 1 },
	} satisfies Record<string, Plan>;
	const wall = (plan: Plan) => S(k.slabOf(plan, TRAY_Z, WALL_TOP - TRAY_Z, P, 3, 0.5), { tone: 'mid' });

	function trayBack() {
		const out = [halo(TRAY, 0, 2, 5), S(k.slabOf(TRAY, 0, TRAY_Z, P, 6, 0.6), { tone: 'mid' })];
		out.push(wall(tw.back), wall(tw.left), wall(tw.right));
		out.push(D([at([TRAY.x + 6, TRAY.y + 2, WALL_TOP]), at([TRAY.x + TRAY.w - 6, TRAY.y + 2, WALL_TOP])], { size: 0.45 }));
		return out.join('');
	}
	function trayFront() {
		const pull: Plan = { x: TRAY.x + TRAY.w / 2 - 12, y: tw.front.y + WALL, w: 24, d: 3, r: 1.2 };
		return wall(tw.front) + S(k.slabOf(pull, 4, 4, P, 3, 0.4), { tone: 'mid' }) + D([at([pull.x + 3, pull.y + 3, 6]), at([pull.x + pull.w - 3, pull.y + 3, 6])], { size: 0.4 });
	}

	function leftovers() {
		const out: string[] = [];
		for (const [x, y] of [[-14, 20], [-14, 32]] as const) {
			out.push(S(k.cylinder(x, y, 3.2, TRAY_Z, 2.4, P, 6), { tone: 'hi' }));
			out.push(S(k.cylinder(x, y, 1.1, TRAY_Z + 2.4, 3, P, 12), { tone: 'mid' }));
		}
		for (const y of [16, 22]) out.push(S(k.slabOf({ x: -88, y, w: 22, d: 3.4, r: 0.6 }, TRAY_Z, 2, P, 2), { tone: 'hi' }));
		return stepSvg('dim-from', 3, out.join(''));
	}

	function props() {
		const out = [halo({ x: 100, y: 14, w: 22, d: 22, r: 11 }, 0, 18, 3)];
		out.push(S(k.cylinder(111, 25, 10, 0, 18, P, 36, 0.8), { tone: 'mid' }));
		out.push(L(k.ring(111, 25, 7, 18, P, 28), { tone: 'lo' }));
		out.push(L(k.knurl(111, 25, 10, 2, 16, 36, P, 0.3), { tone: 'faint' }));
		out.push(S(k.cylinder(111, 25, 2.4, 18, 3, P, 14), { tone: 'hi' }));
		for (let i = 0; i < 3; i++) out.push(S(k.slabOf({ x: 128 - i * 1.5, y: 8 + i * 0.6, w: 34, d: 11, r: 0.8 }, i * 3.2, 3.2, P, 2, 0.3), { tone: i % 2 ? 'hi' : 'mid' }));
		out.push(D([at([111, 25, 21])], { size: 0.4, tone: 'hi' }));
		return out.join('');
	}

	function shop() {
		const out = [halo(SILL, 0, SILL_H)];
		out.push(S(k.slabOf(SILL, 0, SILL_H, P, 3, 0.6), { tone: 'mid' }));
		out.push(S(k.slabOf({ x: SILL.x + 6, y: SILL.y + 2, w: SILL.w - 12, d: 4, r: 0.6 }, SILL_H, SHOP_TOP - SILL_H, P, 2), { tone: 'lo', crease: 'none' }));
		const bay: Plan = { x: SILL.x + 10, y: PANE.y, w: 26, d: 2, r: 0.4 };
		out.push(S(k.slabOf(bay, SILL_H, 44, P, 2), { tone: 'mid' }));
		const bf = bay.y + bay.d;
		for (let z = SILL_H + 6; z < SILL_H + 44; z += 6) out.push(L(k.segment([bay.x + 1, bf, z], [bay.x + bay.w - 1, bf, z], P), { tone: 'faint' }));
		out.push(stepSvg('lit-at', 4, S(k.slabOf(PANE, 18, 28, P, 2), { tone: 'hi', lit: true })));
		const mid = PANE.x + PANE.w / 2;
		out.push(L(k.segment([mid, PANE.y + 2, 18], [mid, PANE.y + 2, 46], P) + k.segment([PANE.x, PANE.y + 2, 32], [PANE.x + PANE.w, PANE.y + 2, 32], P), { tone: 'mid' }));
		for (const x of [SILL.x + 2, SILL.x + SILL.w - 10]) out.push(S(k.slabOf({ x, y: SILL.y + 4, w: 8, d: 8, r: 1 }, SILL_H, SHOP_TOP - SILL_H, P, 3, 0.4), { tone: 'mid' }));
		out.push(S(k.slabOf({ x: SILL.x, y: SILL.y + 2, w: SILL.w, d: 12, r: 1 }, SHOP_TOP - 10, 10, P, 3, 0.5), { tone: 'mid' }));
		return out.join('');
	}

	function door([cx, cy, z]: Point3) {
		const f = cy + 1.5;
		const out = [halo({ x: cx - 12, y: cy - 6, w: 24, d: 12, r: 4 }, z, 0.1, 3)];
		out.push(S(k.slabOf({ x: cx - 8, y: cy - 1.5, w: 16, d: 3, r: 0.5 }, z, DOOR_H, P, 2, 0.4), { tone: 'hi' }));
		const top = z + DOOR_H - 4;
		out.push(L(k.segment([cx - 5, f, z + 4], [cx - 5, f, top], P) + k.segment([cx + 5, f, z + 4], [cx + 5, f, top], P) + k.segment([cx - 5, f, top], [cx + 5, f, top], P) + k.segment([cx - 5, f, z + 4], [cx + 5, f, z + 4], P), { tone: 'mid' }));
		out.push(L(k.segment([cx - 5, f, z + 20], [cx + 5, f, z + 20], P), { tone: 'faint' }));
		out.push(S(k.cylinder(cx + 5.5, f + 0.5, 1.3, z + 18, 0.8, P, 10), { tone: 'mid' }));
		return out.join('');
	}
	function canopy([cx, cy, z]: Point3) {
		const plan: Plan = { x: cx - 18, y: cy - 8, w: 36, d: 16, r: 1.5 };
		const out = [halo(plan, z, 0.1, 3), S(k.slabOf(plan, z, 4, P, 3, 0.6), { tone: 'hi' })];
		for (let x = plan.x + 6; x < plan.x + plan.w - 3; x += 6) out.push(L(k.lineOnTop([x, plan.y + 1], [x, plan.y + plan.d - 1], z + 4, P), { tone: 'faint' }));
		return out.join('');
	}
	function planter([cx, cy, z]: Point3) {
		const plan: Plan = { x: cx - 10, y: cy - 4.5, w: 20, d: 9, r: 1.2 };
		const out = [halo(plan, z, 0.1, 3), S(k.slabOf(plan, z, 7, P, 3, 0.5), { tone: 'hi' })];
		out.push(L(k.sideSeam(plan, z + 3.5, P), { tone: 'faint' }));
		for (const dx of [-5, 0, 5]) {
			const h = dx === 0 ? 16 : 13;
			out.push(L(k.segment([cx + dx, cy, z + 7], [cx + dx, cy, z + h], P), { tone: 'mid' }));
			out.push(S(k.cylinder(cx + dx, cy, 2.6, z + h - 1, 1, P, 10), { tone: 'hi' }));
		}
		return out.join('');
	}
	const draw = { door, canopy, planter };

	const transforms = transformsFrom(P, Object.fromEntries(MOVERS.map((m) => [m.name, [1, 2, 3, 4].map((s) => poseAt(s)[m.name])])));
	const mover = (m: Mover) => moverSvg(m.name, transforms[m.name][3], draw[m.name](m.from));

	const svg = k.figureSvg({
		width,
		height,
		label:
			'A workbench tells the story of a new idea. A sketch of a lightbulb sits on an easel, a plan of a shop is drawn on a sheet beside a ruler, and a door, a canopy and a planter lift out of a tray of ready-made parts and are fitted onto a small shop front, whose window then lights up: open for customers.',
		body: [bench(), easel(), sheet(), rulerAndPencil(), props(), shop(), trayBack(), leftovers(), ...MOVERS.map(mover), trayFront()],
	});
	return { svg, labels: LABELS, transforms };
}
