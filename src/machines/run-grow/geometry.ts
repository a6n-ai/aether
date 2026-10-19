import * as k from '../../lib/anatomy/iso-kit';
import type { Flat, Plan, Point3 } from '../../lib/anatomy/iso-kit';
import { stepSvg, type Machine } from '../../lib/plate';

export const LABELS = ['your app running', 'checked every day', 'fixed and improved', 'grows with you'] as const;
export const CAPTION = "Once you're live, we keep watch every day, fix what breaks and add what you need next.";

const BASE: Plan = { x: -148, y: -54, w: 226, d: 104, r: 8 };
const BASE_H = 12;
const FOOT_H = 6;

// planter box on legs, soil level with its rim
const PL: Plan = { x: -80, y: -45, w: 100, d: 80, r: 3 };
const BOX_Z = 26;
const RIM_Z = 52;
const SOIL = 54.6;

// tree: a fixed lower trunk, an inner trunk that telescopes out, a crown of tiers and a nested top tier
const TX = -30;
const TY = -5;
const T1_TOP = 82;
const GROW = 24;
const NEST = 9;

// water: tank, valve, drip line along y = LINE_Y lying on the soil
const TANK: [number, number] = [-122, -22];
const TANK_R = 15;
const VALVE = -94;
const LINE_Y = -20;
const LINE_END = 14;
const EMITTERS = [-52, -12];
const FRESH_X = 6;

// tool rail at x = 75 with a probe lever on its front post
const RAIL_X = 58;
const POST_F = 23;
const POST_B = -45;
const BAR_Z = 80;
const PIVOT: Point3 = [RAIL_X, POST_F, 92];
const ARM = 50;
const ARM_UP = 72;
const ARM_DIP = -20;
const DIAL: Point3 = [RAIL_X, 28.2, 50];

// branch from the trunk, splint stake beside its tuft
const BR_Z = 72.5;
const BR_ROOT = TX + 4.5;
const BR_LEN = 25;
const DROOP = -22;
const STAKE_X = 10;

export function runGrow(width = 720, height = 480): Machine {
	const tipAt = (deg: number): Point3 => {
		const t = (deg * Math.PI) / 180;
		return [PIVOT[0] - ARM * Math.cos(t), PIVOT[1], PIVOT[2] + ARM * Math.sin(t)];
	};
	const P = k.fitProjection(
		[...k.boxCorners(BASE, -BASE_H - FOOT_H, 0), [TANK[0], TANK[1], 84], [TX, TY, 154], tipAt(ARM_UP), [tipAt(ARM_UP)[0], POST_F, tipAt(ARM_UP)[2] + 4]],
		width,
		height,
		{ pad: 18, azimuth: 50 },
	);
	const at = (p: Point3) => k.iso(p, P);
	const S = k.solidSvg;
	const L = k.lineSvg;
	const D = k.dotsSvg;
	type T = 'hi' | 'mid' | 'lo';
	const dots = (pts: Point3[], size = 0.45, tone: T | 'faint' = 'mid') => D(pts.map(at), { size, tone });
	const halo = (plan: Plan, z: number, h: number, blur = 0) => `<path class="iso-halo" d="${k.haloOf(plan, z, h, P)}"${blur ? ` style="filter:blur(${blur}px)"` : ''}/>`;
	const slab = (x: number, y: number, w: number, d: number, z: number, h: number, tone: T = 'mid', o: { r?: number; steps?: number; bevel?: number; thin?: boolean; lit?: boolean; seams?: number[] } = {}) => {
		const plan: Plan = { x, y, w, d, r: o.r ?? 0.5 };
		const inner = o.seams ? L(o.seams.map((z0) => k.sideSeam(plan, z0, P, o.steps ?? 2)).join(''), { tone: 'faint' }) : '';
		return S(k.slabOf(plan, z, h, P, o.steps ?? 2, o.bevel ?? 0.2), { tone, crease: o.thin ? 'none' : 'faint', lit: o.lit, inner });
	};
	const cyl = (cx: number, cy: number, r: number, z: number, h: number, tone: T = 'mid', bevel = 0.3, o: { lit?: boolean; arcs?: number[]; knurl?: number } = {}) => {
		const lines = (o.arcs ?? []).map((z0) => k.sideArc(cx, cy, r, z0, P, 24)).join('') + (o.knurl ? k.knurl(cx, cy, r, z, z + h, o.knurl, P, 0.3) : '');
		return S(k.cylinder(cx, cy, r, z, h, P, r > 6 ? 36 : 18, bevel), { tone, lit: o.lit, inner: lines ? L(lines, { tone: 'faint' }) : '' });
	};
	const seg = (a: Point3, b: Point3, tone: T | 'faint' = 'mid') => L(k.segment(a, b, P), { tone, free: true });
	const tint = (pigment: string, body: string) => `<g class="tint" style="--pigment:var(--${pigment})">${body}</g>`;
	const mover = (name: string, pigment: string | null, transform: string, body: string) =>
		pigment ? `<g class="mover tint" style="--pigment:var(--${pigment})" data-part="${name}" transform="${transform}">${body}</g>` : `<g class="mover plain" data-part="${name}" transform="${transform}">${body}</g>`;
	const shift = (by: Point3) => k.translateAlong(P, by);

	/** Screen matrix for a rotation by `deg` in the world plane spanned by axes u and v about `pivot`, then a world shift. */
	function turn(pivot: Point3, u: Point3, v: Point3, deg: number, by: Point3 = [0, 0, 0]) {
		const a = k.axisVector(P, u);
		const b = k.axisVector(P, v);
		const det = a[0] * b[1] - a[1] * b[0];
		const inv = [[b[1] / det, -b[0] / det], [-a[1] / det, a[0] / det]];
		const t = (deg * Math.PI) / 180;
		const R = [[Math.cos(t), -Math.sin(t)], [Math.sin(t), Math.cos(t)]];
		const A = [[a[0], b[0]], [a[1], b[1]]];
		const mul = (X: number[][], Y: number[][]) => X.map((row) => [0, 1].map((j) => row[0] * Y[0][j] + row[1] * Y[1][j]));
		const M = mul(mul(A, R), inv);
		const q = at(pivot);
		const s = k.axisVector(P, by);
		const tx = q[0] - (M[0][0] * q[0] + M[0][1] * q[1]) + s[0];
		const ty = q[1] - (M[1][0] * q[0] + M[1][1] * q[1]) + s[1];
		const f = (n: number) => Math.round(n * 1000) / 1000;
		return `matrix(${f(M[0][0])} ${f(M[1][0])} ${f(M[0][1])} ${f(M[1][1])} ${f(tx)} ${f(ty)})`;
	}
	const X: Point3 = [1, 0, 0];
	const Z: Point3 = [0, 0, 1];

	/** Screen outline of a round column's body below its top rim: what a part sliding out of it must stay hidden behind. */
	function sleeveHole(cx: number, cy: number, r: number, zTop: number, zBot: number) {
		const [vx, vy] = k.towardViewer(P);
		const face = Math.atan2(vy, vx);
		const arc = (z: number, from: number, to: number) =>
			Array.from({ length: 25 }, (_, i) => {
				const a = face + ((from + ((to - from) * i) / 24) * Math.PI) / 2;
				return at([cx + r * Math.cos(a), cy + r * Math.sin(a), z]);
			});
		const pts: Flat[] = [...arc(zTop, -1, 1), ...arc(zBot, 1, -1)];
		return `M-2000 -2000H3000V3000H-2000Z` + k.pathOf(pts, true);
	}
	const clipDef = (id: string, d: string) => `<clipPath id="${id}"><path clip-rule="evenodd" d="${d}"/></clipPath>`;

	function base() {
		const out = [halo(BASE, -BASE_H - FOOT_H, BASE_H)];
		const byDepth = [...k.corners(BASE, 22)].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
		for (const [x, y] of byDepth) out.push(S(k.cylinder(x, y, 8, -BASE_H - FOOT_H, 1.8, P, 28), { tone: 'lo' }), S(k.cylinder(x, y, 6, -BASE_H - FOOT_H + 1.8, FOOT_H - 1.8, P, 28), { tone: 'mid' }));
		out.push(S(k.slabOf(BASE, -BASE_H, BASE_H, P, 8, 1.6), { tone: 'mid', inner: L(k.sideSeam(BASE, -BASE_H / 2, P), { tone: 'faint' }) }));
		out.push(L(k.planOutline(k.insetPlan(BASE, 5), 0, P), { tone: 'lo' }));
		const screws = k.corners(BASE, 11);
		out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(''), { tone: 'lo' }), D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
		const strip: Plan = { x: -130, y: BASE.y + BASE.d - 13, w: 124, d: 7, r: 1 };
		out.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: 'lo', crease: 'none' }));
		const ticks = k.topTicks(strip.x + 4, strip.x + strip.w - 4, 4, 5, strip.y + 0.8, 0.6, [2, 3.6], P);
		out.push(L(ticks.minor, { tone: 'lo' }), L(ticks.major, { tone: 'mid' }));
		const label: Plan = { x: 20, y: BASE.y + BASE.d - 16, w: 40, d: 12, r: 1.5 };
		out.push(S(k.slabOf(label, 0, 0.8, P, 3), { tone: 'lo' }), L(k.planOutline(k.insetPlan(label, 1.6), 0.8, P, 3), { tone: 'faint' }));
		for (const dy of [3.5, 6.5, 9.5]) out.push(L(k.lineOnTop([label.x + 5, label.y + dy], [label.x + label.w - (dy === 9.5 ? 18 : 5), label.y + dy], 0.8, P), { tone: 'faint', free: true }));
		out.push(D([at([label.x + 2.4, label.y + 2.4, 0.8]), at([label.x + label.w - 2.4, label.y + label.d - 2.4, 0.8])], { size: 0.45 }));
		const fy = BASE.y + BASE.d;
		const fx = BASE.x + BASE.w;
		out.push(dots([-120, -60, 0, 50].map((x) => [x, fy, -6] as Point3), 0.45), dots([-40, 0, 40].map((y) => [fx, y, -6] as Point3), 0.45));
		return out.join('');
	}

	function tank() {
		const [cx, cy] = TANK;
		const R = TANK_R;
		const out = [halo({ x: cx - R - 3, y: cy - R - 3, w: 2 * R + 6, d: 2 * R + 6, r: R + 3 }, 0, 4, 2)];
		out.push(cyl(cx, cy, R + 3, 0, 5, 'lo', 0.6, { knurl: 30 }));
		out.push(cyl(cx, cy, R, 5, 70, 'mid', 0, { arcs: [24, 44, 64] }));
		out.push(cyl(cx, cy, R + 1, 75, 3, 'mid', 0.6), cyl(cx, cy, 5.5, 78, 3.4, 'hi', 0.4, { knurl: 14 }), cyl(cx, cy, 2, 81.4, 1.6, 'mid', 0.2));
		const [vx, vy] = k.towardViewer(P);
		const g: [number, number] = [cx + (R + 2) * vx, cy + (R + 2) * vy];
		out.push(cyl(g[0], g[1], 2.6, 12, 3, 'mid', 0.3), cyl(g[0], g[1], 1.8, 15, 52, 'lo', 0), cyl(g[0], g[1], 2.6, 67, 3, 'mid', 0.3));
		out.push(tint('lapis', cyl(g[0], g[1], 1.1, 15.4, 38, 'hi', 0)));
		out.push(dots([[cx + R * Math.cos(2.0), cy + R * Math.sin(2.0), 71], [cx + R * Math.cos(-0.6), cy + R * Math.sin(-0.6), 71]], 0.5));
		return out.join('');
	}

	function valveAndFeed() {
		const out: string[] = [];
		const fx = TANK[0] + Math.sqrt(TANK_R * TANK_R - (LINE_Y - TANK[1]) ** 2);
		out.push(cyl(VALVE, LINE_Y, 3, 0, 2, 'lo', 0.3), cyl(VALVE, LINE_Y, 1.8, 2, SOIL - 4.4, 'mid', 0, { arcs: [30] }));
		out.push(slab(fx - 1, LINE_Y - 3.5, 4, 7, SOIL - 3, 7.4, 'mid', { r: 0.8, bevel: 0.3 }), dots([[fx + 3, LINE_Y - 2, SOIL + 3.6], [fx + 3, LINE_Y + 2, SOIL + 3.6]], 0.4));
		out.push(slab(fx + 3, LINE_Y - 1.1, VALVE - 4.5 - fx - 3, 2.2, SOIL, 2.2, 'hi', { r: 0.6, thin: true }));
		out.push(slab(VALVE - 4.5, LINE_Y - 4, 9, 8, SOIL - 2.4, 7, 'mid', { r: 1, bevel: 0.4, seams: [SOIL + 1] }));
		out.push(cyl(VALVE, LINE_Y, 1.3, SOIL + 4.6, 3.4, 'mid', 0), cyl(VALVE, LINE_Y, 5, SOIL + 8, 1.8, 'hi', 0.4, { knurl: 18 }), cyl(VALVE, LINE_Y, 1.4, SOIL + 9.8, 1, 'mid', 0.2));
		return out.join('');
	}

	function planter() {
		const out = [halo(PL, 0, BOX_Z, 4)];
		const LEG = 7;
		const legs: [number, number][] = [[PL.x + 2, PL.y + 2], [PL.x + PL.w - 2 - LEG, PL.y + 2], [PL.x + 2, PL.y + PL.d - 2 - LEG], [PL.x + PL.w - 2 - LEG, PL.y + PL.d - 2 - LEG]];
		const leg = ([x, y]: [number, number]) => slab(x - 1, y - 1, LEG + 2, LEG + 2, 0, 2, 'lo', { r: 1 }) + slab(x, y, LEG, LEG, 2, BOX_Z - 2, 'mid', { r: 0.8, seams: [14] });
		const inX = PL.x + 2 + LEG;
		const inW = PL.w - 4 - LEG * 2;
		const inY = PL.y + 2 + LEG;
		const inD = PL.d - 4 - LEG * 2;
		const items: [number, string][] = [
			...legs.map((p): [number, string] => [k.depthOf([p[0] + LEG / 2, p[1] + LEG / 2, 0], P), leg(p)]),
			[k.depthOf([PL.x + PL.w / 2, PL.y + 5, 0], P), slab(inX, PL.y + 3, inW, 5, 12, 5, 'mid', { r: 0.6 })],
			[k.depthOf([PL.x + 5, PL.y + PL.d / 2, 0], P), slab(PL.x + 3, inY, 5, inD, 12, 5, 'mid', { r: 0.6 })],
			[k.depthOf([PL.x + PL.w / 2, PL.y + PL.d - 5, 0], P) - 8, slab(inX, PL.y + PL.d - 8, inW, 5, 12, 5, 'mid', { r: 0.6 }) + dots([[inX + 3, PL.y + PL.d - 3, 14.5], [inX + inW - 3, PL.y + PL.d - 3, 14.5]], 0.4)],
			[k.depthOf([PL.x + PL.w - 5, PL.y + PL.d / 2, 0], P) - 8, slab(PL.x + PL.w - 8, inY, 5, inD, 12, 5, 'mid', { r: 0.6 })],
		];
		items.sort((a, b) => a[0] - b[0]);
		out.push(...items.map(([, s]) => s));
		out.push(S(k.slabOf(PL, BOX_Z, RIM_Z - BOX_Z, P, 3, 0.6), { tone: 'mid', inner: L([BOX_Z + 6.5, BOX_Z + 13, BOX_Z + 19.5].map((z) => k.sideSeam(PL, z, P, 3)).join(''), { tone: 'faint' }) }));
		const fy = PL.y + PL.d;
		const fx = PL.x + PL.w;
		for (const x of [PL.x + 25, PL.x + 50, PL.x + 75]) out.push(seg([x, fy, BOX_Z], [x, fy, RIM_Z], 'faint'));
		for (const y of [PL.y + 27, PL.y + 54]) out.push(seg([fx, y, BOX_Z], [fx, y, RIM_Z], 'faint'));
		out.push(dots([[PL.x + 4, fy, BOX_Z + 3], [PL.x + 4, fy, RIM_Z - 3], [fx - 4, fy, BOX_Z + 3], [fx - 4, fy, RIM_Z - 3], [fx, PL.y + 4, BOX_Z + 3], [fx, PL.y + 4, RIM_Z - 3]], 0.45));
		const rim: Plan = { x: PL.x - 1.5, y: PL.y - 1.5, w: PL.w + 3, d: PL.d + 3, r: 4 };
		out.push(S(k.slabOf(rim, RIM_Z, 2, P, 3, 0.5), { tone: 'mid' }));
		const soil = k.insetPlan(PL, 4);
		out.push(S(k.slabOf(soil, RIM_Z + 2, SOIL - RIM_Z - 2, P, 3), { tone: 'lo', crease: 'none' }));
		const grains = k.dotGrid(soil.x + 4, soil.y + 4, 12, 9, 7.6, SOIL, P).filter((_, i) => i % 3 !== 1);
		out.push(D(grains, { size: 0.5, tone: 'lo' }));
		out.push(dots(k.corners(rim, 3).map(([x, y]) => [x, y, RIM_Z + 2] as Point3), 0.45));
		return out.join('');
	}

	function emitter(x: number) {
		return cyl(x, LINE_Y, 3.6, SOIL + 2.2, 3.4, 'hi', 0.5) + cyl(x, LINE_Y, 1.8, SOIL + 5.6, 1.8, 'mid', 0.3) + dots([[x, LINE_Y, SOIL + 7.4]], 0.5, 'hi');
	}
	const drops = (x: number) =>
		tint('lapis', L(k.ring(x, LINE_Y + 7.5, 3.2, SOIL, P, 18) + k.ring(x, LINE_Y + 7.5, 1.7, SOIL, P, 14), { tone: 'mid' }) + D([at([x, LINE_Y + 4.6, SOIL + 4.2]), at([x, LINE_Y + 6, SOIL + 2])], { size: 1.2, tone: 'hi' }));

	function line() {
		const out: string[] = [];
		out.push(slab(VALVE + 4.5, LINE_Y - 1.1, LINE_END - VALVE - 4.5, 2.2, SOIL, 2.2, 'hi', { r: 0.6, thin: true }));
		for (const x of [-68, -36, 0]) out.push(slab(x - 1.5, LINE_Y - 2.4, 3, 4.8, SOIL, 2.8, 'mid', { r: 0.6 }));
		out.push(slab(LINE_END, LINE_Y - 1.8, 2.6, 3.6, SOIL - 0.4, 3, 'mid', { r: 0.6 }));
		for (const x of EMITTERS) out.push(emitter(x), drops(x));
		return out.join('');
	}

	// trunk1: static; trunk2: telescopes out of trunk1, clipped to stay hidden inside it
	function trunk() {
		const out = [cyl(TX, TY, 7.5, SOIL, 1.6, 'lo', 0.4), cyl(TX, TY, 4.5, SOIL + 1.6, T1_TOP - SOIL - 4.6, 'mid', 0, { arcs: [T1_TOP - 18, T1_TOP - 8] })];
		out.push(cyl(TX, TY, 5.4, T1_TOP - 3, 3, 'mid', 0.4));
		return out.join('');
	}
	const trunk2 = () => cyl(TX, TY, 3.4, T1_TOP - 2, 28, 'mid', 0, { arcs: [T1_TOP + 8, T1_TOP + 16] }) + cyl(TX, TY, 3.9, T1_TOP, 2, 'mid', 0.2);

	// the crown, drawn at its grown height
	function crown() {
		const zA = T1_TOP + GROW;
		const tier = (r: number, z: number, h: number, ribs: number) =>
			cyl(TX, TY, r, z, h * 0.5, 'hi', 1, { knurl: ribs }) + cyl(TX, TY, r * 0.82, z + h * 0.5, h * 0.3, 'hi', 0.8) + cyl(TX, TY, r * 0.55, z + h * 0.8, h * 0.2, 'hi', 0.6) + dots(Array.from({ length: Math.round(r) }, (_, i): Point3 => [TX + r * 0.7 * Math.cos(i * 2.4), TY + r * 0.7 * Math.sin(i * 2.4), z + h * 0.8]), 0.45, 'mid');
		const out = [halo({ x: TX - 26, y: TY - 26, w: 52, d: 52, r: 26 }, zA, 0.1, 3)];
		out.push(tier(26, zA, 8, 40), cyl(TX, TY, 3, zA + 8, 4, 'mid', 0), tier(19, zA + 12, 7, 32), cyl(TX, TY, 3, zA + 19, 4, 'mid', 0), tier(12, zA + 23, 6, 24));
		const cTop = zA + 29;
		const nest = cyl(TX, TY, 2.4, cTop, NEST, 'mid', 0) + tier(7, cTop + NEST, 5, 16) + cyl(TX, TY, 1.6, cTop + NEST + 5, 1, 'mid', 0.2) + stepSvg('lit-at', 4, cyl(TX, TY, 3.4, cTop + NEST + 6, 2.2, 'hi', 0.6, { lit: true })) + dots([[TX, TY, cTop + NEST + 8.2]], 0.6, 'hi');
		out.push(clipDef('rg-nest', sleeveHole(TX, TY, 7, cTop, cTop - 10)));
		out.push(`<g clip-path="url(#rg-nest)">${mover('tier', 'verdigris', transforms.tier[3], nest)}</g>`);
		return out.join('');
	}

	function branch() {
		const limb = slab(BR_ROOT - 0.5, TY - 1.6, BR_LEN - 4, 3.2, BR_Z - 1.6, 3.2, 'mid', { r: 1, thin: true });
		const tx = BR_ROOT + BR_LEN;
		const bud = tint('verdigris', cyl(BR_ROOT + 10, TY, 3.2, BR_Z + 1.6, 3, 'hi', 0.6));
		const tuft = tint('verdigris', cyl(tx, TY, 7, BR_Z - 3, 4, 'hi', 0.8, { knurl: 18 }) + cyl(tx, TY, 5, BR_Z + 1, 2, 'hi', 0.6) + L(k.ring(tx, TY, 3, BR_Z + 3, P, 20), { tone: 'faint' }));
		return limb + bud + tuft;
	}

	function splint() {
		const z0 = SOIL;
		const out = [cyl(STAKE_X, TY, 3.4, z0, 1, 'mid', 0.3), cyl(STAKE_X, TY, 2.2, z0 + 1, BR_Z - 3 - z0 - 1, 'hi', 0, { arcs: [z0 + 6, z0 + 10] })];
		out.push(slab(STAKE_X - 4, TY - 3.5, 10, 7, BR_Z - 3, 5, 'hi', { r: 1.4, bevel: 0.5, seams: [BR_Z - 0.5] }), dots([[STAKE_X + 6, TY - 2, BR_Z - 0.5], [STAKE_X + 6, TY + 2, BR_Z - 0.5]], 0.45, 'hi'));
		return out.join('');
	}
	const splintMarks = () => stepSvg('show-from', 3, L(k.ring(STAKE_X, TY, 3.8, SOIL, P, 18), { tone: 'lo' }));

	function railBack() {
		const out: string[] = [];
		out.push(cyl(RAIL_X, POST_B, 5, 0, 3, 'lo', 0.4), cyl(RAIL_X, POST_B, 3, 3, BAR_Z - 3, 'mid', 0, { arcs: [40, 70] }));
		return out.join('');
	}
	function railFront() {
		const out: string[] = [];
		out.push(slab(RAIL_X - 3, POST_B - 3, 6, POST_F - POST_B, BAR_Z, 4, 'mid', { r: 1, bevel: 0.4, seams: [BAR_Z + 2] }));
		out.push(slab(RAIL_X - 9, LINE_Y - 3.5, 6, 7, BAR_Z - 5, 3, 'mid', { r: 0.6 }));
		out.push(slab(RAIL_X - 3.6, POST_B - 4.5, 7.2, 1.5, BAR_Z - 1, 6, 'mid', { r: 0.5 }), slab(RAIL_X - 1, TY + 4, 4, 2, BAR_Z + 4, 2.4, 'mid', { r: 0.5 }));
		const rt = k.topTicks(POST_B + 4, POST_F - 6, 4, 5, RAIL_X + 3, BAR_Z + 4, [1.4, 2.4], P, 'y');
		out.push(L(rt.minor, { tone: 'lo' }), L(rt.major, { tone: 'mid' }));
		return out.join('');
	}
	function postFront() {
		const out = [halo({ x: RAIL_X - 6, y: POST_F - 6, w: 12, d: 12, r: 6 }, 0, 3, 2)];
		out.push(cyl(RAIL_X, POST_F, 5, 0, 3, 'lo', 0.4), cyl(RAIL_X, POST_F, 3, 3, PIVOT[2] - 7, 'mid', 0, { arcs: [30, 66] }));
		out.push(slab(RAIL_X - 4, POST_F - 5, 8, 2.5, PIVOT[2] - 6, 10, 'mid', { r: 0.6 }));
		return out.join('');
	}
	const cheekFront = () => slab(RAIL_X - 4, POST_F + 2.5, 8, 2.5, PIVOT[2] - 6, 10, 'mid', { r: 0.6 }) + dots([[RAIL_X, POST_F + 5, PIVOT[2]]], 0.6, 'hi');

	function arm() {
		const [px, py, pz] = PIVOT;
		const out: string[] = [];
		out.push(slab(px - ARM - 2, py - 2.2, ARM + 9, 4.4, pz - 2, 4, 'hi', { r: 1.2, bevel: 0.4 }));
		out.push(slab(px + 4, py - 3, 8, 6, pz - 4, 8, 'mid', { r: 1.2, bevel: 0.5 }));
		out.push(L(k.lineOnTop([px - ARM + 6, py], [px - 8, py], pz + 2, P), { tone: 'faint' }), dots([[px - ARM, py, pz + 2], [px + 8, py, pz + 4]], 0.45, 'hi'));
		return out.join('');
	}
	const ROD_TOP = 0;
	function rod() {
		const [x, y, z] = tipAt(ARM_DIP);
		const out = [cyl(x, y, 3, z - 4, 5, 'hi', 0.5, { knurl: 12 }), cyl(x, y, 1.2, SOIL - 6, z - 4 - SOIL + 6 + ROD_TOP, 'hi', 0, { arcs: [SOIL + 4] })];
		return out.join('');
	}

	function dial() {
		const [cx, fy, cz] = DIAL;
		const plate: Plan = { x: cx - 14, y: POST_F + 3, w: 28, d: fy - POST_F - 3, r: 1 };
		const out = [slab(cx - 3, POST_F + 2.6, 6, 2.6, cz - 19, 5, 'mid', { r: 0.5 }), S(k.slabOf(plate, cz - 14, 28, P, 2, 0.4), { tone: 'mid' })];
		out.push(L(k.sideRing([cx, fy, cz], 12, 'y', P, 48) + k.sideRing([cx, fy, cz], 10.6, 'y', P, 44), { tone: 'mid' }));
		for (let i = 0; i <= 12; i++) {
			const a = ((-60 + i * 10) * Math.PI) / 180;
			const [s, c] = [Math.sin(a), Math.cos(a)];
			const r0 = i % 3 ? 8.6 : 7.4;
			out.push(L(k.segment([cx + s * r0, fy, cz + c * r0], [cx + s * 10.6, fy, cz + c * 10.6], P), { tone: i % 3 ? 'lo' : 'mid' }));
		}
		const band = (r: number) => Array.from({ length: 9 }, (_, i) => {
			const a = ((15 + i * 5) * Math.PI) / 180;
			return at([cx + Math.sin(a) * r, fy, cz + Math.cos(a) * r]);
		});
		out.push(tint('verdigris', L(k.pathOf(band(9.6)) + k.pathOf(band(10.2)), { tone: 'mid' })));
		out.push(dots([[cx - 12, fy, cz + 12], [cx + 12, fy, cz + 12], [cx - 12, fy, cz - 12], [cx + 12, fy, cz - 12]], 0.5));
		out.push(seg([cx - 6, fy, cz - 7], [cx + 6, fy, cz - 7], 'faint'));
		return out.join('');
	}
	function needle() {
		const [cx, fy, cz] = DIAL;
		const a = (35 * Math.PI) / 180;
		const dir: [number, number] = [Math.sin(a), Math.cos(a)];
		const side: [number, number] = [dir[1], -dir[0]];
		const pt = (along: number, across: number) => at([cx + dir[0] * along + side[0] * across, fy + 0.1, cz + dir[1] * along + side[1] * across]);
		const poly = [pt(9.4, 0), pt(0, 0.9), pt(-2.6, 0), pt(0, -0.9)];
		const d = k.pathOf(poly, true);
		const hub = k.pathOf(Array.from({ length: 16 }, (_, i) => at([cx + 1.5 * Math.cos((i / 16) * Math.PI * 2), fy + 0.15, cz + 1.5 * Math.sin((i / 16) * Math.PI * 2)])), true);
		return S({ fill: d, outline: d, crease: '', top: d, shades: [] }, { tone: 'hi' }) + S({ fill: hub, outline: hub, crease: '', top: hub, shades: [] }, { tone: 'mid' });
	}

	// motion
	const ZERO: Point3 = [0, 0, 0];
	const ID = 'matrix(1 0 0 1 0 0)';
	const tip0 = tipAt(ARM_DIP);
	const tipPark = tipAt(ARM_UP);
	const PARK: Point3 = [tipPark[0] - tip0[0], 0, tipPark[2] - tip0[2]];
	const SPLINT_REST: Point3 = [RAIL_X - 5.5 - STAKE_X, 0, BAR_Z + 4 - (BR_Z - 3)];
	const FRESH_REST: Point3 = [RAIL_X - 7 - FRESH_X, 0, BAR_Z - 2 - (SOIL + 2.2)];
	const brPivot: Point3 = [BR_ROOT, TY, BR_Z];
	const dialPivot: Point3 = [DIAL[0], DIAL[1], DIAL[2]];
	const transforms: Record<string, string[]> = {
		needle: [turn(dialPivot, X, Z, 90), ID, ID, ID],
		arm: [ARM_UP, ARM_DIP, ARM_DIP, ARM_DIP].map((d) => turn(PIVOT, X, Z, -d)),
		rod: [PARK, ZERO, ZERO, ZERO].map(shift),
		branch: [DROOP, DROOP, 0, 0].map((d) => turn(brPivot, X, Z, d)),
		splint: [SPLINT_REST, SPLINT_REST, ZERO, ZERO].map(shift),
		fresh: [FRESH_REST, FRESH_REST, ZERO, ZERO].map(shift),
		trunk: [[0, 0, -GROW], [0, 0, -GROW], [0, 0, -GROW], ZERO].map((p) => shift(p as Point3)),
		crown: [[0, 0, -GROW], [0, 0, -GROW], [0, 0, -GROW], ZERO].map((p) => shift(p as Point3)),
		tier: [[0, 0, -NEST], [0, 0, -NEST], [0, 0, -NEST], ZERO].map((p) => shift(p as Point3)),
	};
	const T4 = (name: string) => transforms[name][3];

	const svg = k.figureSvg({
		width,
		height,
		label:
			'A raised planter bench with a young tree, fed by a drip line from a water tank through a valve. A probe on a lever swings over and dips into the soil while its gauge needle reads, a splint slides off the tool rail to hold a bent branch level and a fresh drip emitter clips onto the line, then the tree grows taller with a new top tier and a bloom.',
		body: [
			base(),
			tank(),
			valveAndFeed(),
			railBack(),
			planter(),
			line(),
			trunk(),
			clipDef('rg-sleeve', sleeveHole(TX, TY, 5.4, T1_TOP, SOIL)),
			`<g clip-path="url(#rg-sleeve)">${mover('trunk', null, T4('trunk'), trunk2())}</g>`,
			mover('crown', 'verdigris', T4('crown'), crown()),
			mover('branch', null, T4('branch'), branch()),
			splintMarks(),
			mover('splint', 'ochre', T4('splint'), splint()),
			stepSvg('show-from', 4, drops(FRESH_X)),
			mover('fresh', 'lapis', T4('fresh'), emitter(FRESH_X)),
			railFront(),
			postFront(),
			mover('arm', 'ochre', T4('arm'), arm()),
			cheekFront(),
			stepSvg('show-from', 2, L(k.ring(tip0[0], tip0[1], 2.6, SOIL, P, 16), { tone: 'lo' })),
			clipDef('rg-soil', sleeveHole(tip0[0], tip0[1], 1.7, SOIL, SOIL - 20)),
			`<g clip-path="url(#rg-soil)">${mover('rod', 'ochre', T4('rod'), rod())}</g>`,
			dial(),
			mover('needle', null, T4('needle'), needle()),
		],
	});
	return { svg, labels: LABELS, transforms };
}
