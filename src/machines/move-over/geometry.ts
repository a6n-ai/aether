import * as k from '../../lib/anatomy/iso-kit';
import type { Plan, Plane, Point3 } from '../../lib/anatomy/iso-kit';
import { moverSvg, stepSvg, transformsFrom, type Machine } from '../../lib/plate';

export const LABELS = ['paper and spreadsheets', 'fed in', 'sorted into your app', 'nothing lost'] as const;
export const CAPTION = 'Already running on paper, spreadsheets or an old system? We move everything across so nothing is lost.';

const BASE: Plan = { x: -192, y: -66, w: 340, d: 124, r: 8 };
const BASE_H = 10;
const FOOT_H = 5;

// The conveyor runs downhill from the old scale's deck (TOP) to the trays: z(x) is its rolling line.
const TOP = 36;
const X0 = -76;
const X1 = 58;
const SLOPE = 0.12;
const HALF = 42;
const zAt = (x: number) => TOP - SLOPE * (x - X0);

// Old wooden scale (left) and new scale (right).
const OLD = { x: -176, y: -52, w: 98, d: 96 };
const NEW = { x: 62, y: -52, w: 74, d: 96 };
const NEW_DECK = 15.3;

// Papers keep their lane; they travel only along x and z, so they never cross a neighbour.
// Their left edge rides the rolling line, so the slide from the throat to the tray clears every roller and the tray lip.
const PW = 34;
const PD = 20;
const LEN_IN = -164;
const LEN_OUT = 84;
const FLOOR = zAt(LEN_OUT);
const LANES = { ledger: -28, printout: 0, receipts: 28 } as const;
type Name = keyof typeof LANES;
const NAMES = Object.keys(LANES) as Name[];
const TRAY_LABEL: Record<Name, string> = { ledger: 'CUSTOMERS', printout: 'ORDERS', receipts: 'MONEY' };
const TRAY = { x0: 66, x1: 128, half: 13, wall: 6 };

// Dial readings, in degrees clockwise from twelve o'clock: zero sits at -135, the load reads READ.
const ZERO = -135;
const READ = 45;

export function moveOver(width = 720, height = 480): Machine {
	const P = k.fitProjection(
		[...k.boxCorners(BASE, -BASE_H - FOOT_H, 0), [-150, -54, 112], [-106, -42, 112], [82, -54, 84], [-10, -56, 76], [-76, 52, 52]],
		width,
		height,
		{ pad: 20, azimuth: 55, elevation: 30 },
	);
	const at = (p: Point3) => k.iso(p, P);
	const S = k.solidSvg;
	const L = k.lineSvg;
	const dots = (pts: Point3[], size = 0.45, tone: 'hi' | 'mid' | 'lo' | 'faint' = 'mid') => k.dotsSvg(pts.map(at), { size, tone });
	const halo = (plan: Plan, z: number, h: number, blur = 0) => `<path class="iso-halo" d="${k.haloOf(plan, z, h, P)}"${blur ? ` style="filter:blur(${blur}px)"` : ''}/>`;
	type SlabOpts = { r?: number; steps?: number; bevel?: number; thin?: boolean; lit?: boolean; seam?: number | number[] };
	const slab = (x: number, y: number, w: number, d: number, z: number, h: number, tone: 'hi' | 'mid' | 'lo' = 'mid', o: SlabOpts = {}) => {
		const plan: Plan = { x, y, w, d, r: o.r ?? 0.5 };
		const seams = o.seam === undefined ? [] : Array.isArray(o.seam) ? o.seam : [o.seam];
		const inner = seams.map((s) => L(k.sideSeam(plan, s, P, o.steps ?? 3), { tone: 'faint' })).join('');
		return S(k.slabOf(plan, z, h, P, o.steps ?? 2, o.bevel ?? 0.2), { tone, crease: o.thin ? 'none' : 'faint', lit: o.lit, inner });
	};
	const cyl = (cx: number, cy: number, r: number, z: number, h: number, tone: 'hi' | 'mid' | 'lo' = 'mid', bevel = 0.3, lit = false) => S(k.cylinder(cx, cy, r, z, h, P, r > 5 ? 28 : 16, bevel), { tone, lit });
	const flat = (a: Plane, b: Plane, z: number, tone: 'mid' | 'lo' | 'faint' = 'faint') => L(k.lineOnTop(a, b, z, P), { tone, free: true });
	const seg = (a: Point3, b: Point3, tone: 'mid' | 'lo' | 'faint' = 'lo') => L(k.segment(a, b, P), { tone, free: true });
	const frontText = (x: number, y: number, z: number, text: string, size: number) => k.faceTextSvg(k.sideMatrix([x, y], z, P, 'left'), text, { size, tone: 'lo', anchor: 'middle' });
	const sideText = (x: number, y: number, z: number, text: string, size: number) => k.faceTextSvg(k.sideMatrix([x, y], z, P, 'right'), text, { size, tone: 'lo', anchor: 'middle' });
	const r2 = (v: number) => Math.round(v * 100) / 100;
	const byDepth = (points: Plane[]) => [...points].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));

	// A bar whose top follows the rolling line: the kit only extrudes straight up, so its faces are built here.
	function sloped(x0: number, x1: number, y0: number, y1: number, lift: number, h: number, tone: 'mid' | 'lo' = 'mid') {
		const t0 = zAt(x0) + lift;
		const t1 = zAt(x1) + lift;
		const [A, B, C, D] = [at([x0, y0, t0]), at([x1, y0, t1]), at([x1, y1, t1]), at([x0, y1, t0])];
		const [Bb, Cb, Db] = [at([x1, y0, t1 - h]), at([x1, y1, t1 - h]), at([x0, y1, t0 - h])];
		const hull = k.pathOf([A, B, Bb, Cb, Db, D], true);
		return S(
			{ fill: hull, outline: hull, crease: k.pathOf([D, C, B]) + k.pathOf([C, Cb]), top: k.pathOf([A, B, C, D], true), shades: [k.pathOf([B, C, Cb, Bb], true), '', '', k.pathOf([D, C, Cb, Db], true)] },
			{ tone },
		);
	}

	function base() {
		const out = [halo(BASE, -BASE_H - FOOT_H, BASE_H)];
		for (const [x, y] of byDepth(k.corners(BASE, 22))) out.push(cyl(x, y, 8, -BASE_H - FOOT_H, 1.8, 'lo', 0.4), cyl(x, y, 6, -BASE_H - FOOT_H + 1.8, FOOT_H - 1.8, 'mid', 0.3));
		out.push(S(k.slabOf(BASE, -BASE_H, BASE_H, P, 8, 1.6), { tone: 'mid', inner: L(k.sideSeam(BASE, -BASE_H / 2, P), { tone: 'faint' }) }));
		out.push(L(k.planOutline(k.insetPlan(BASE, 5), 0, P), { tone: 'lo' }));
		const screws = k.corners(BASE, 10);
		out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(''), { tone: 'lo' }), dots(screws.map(([x, y]) => [x, y, 0] as Point3), 0.5));
		const fy = BASE.y + BASE.d;
		const strip: Plan = { x: -150, y: fy - 7, w: 150, d: 4, r: 1 };
		out.push(slab(strip.x, strip.y, strip.w, strip.d, 0, 0.6, 'lo', { thin: true, steps: 3 }));
		const tk = k.topTicks(strip.x + 4, strip.x + strip.w - 4, 4, 5, strip.y + 0.6, 0.6, [1.6, 3], P);
		out.push(L(tk.minor, { tone: 'lo' }), L(tk.major, { tone: 'mid' }));
		const label: Plan = { x: 30, y: fy - 9, w: 46, d: 6.5, r: 1.5 };
		out.push(slab(label.x, label.y, label.w, label.d, 0, 0.8, 'lo', { steps: 3 }));
		for (const dy of [2.2, 4.4]) out.push(flat([label.x + 5, label.y + dy], [label.x + label.w - (dy > 4 ? 16 : 5), label.y + dy], 0.8));
		out.push(dots([[label.x + 2, label.y + 2, 0.8], [label.x + label.w - 2, label.y + label.d - 2, 0.8]], 0.4));
		return out.join('');
	}

	// The match lamp stands between the two dials and lights when the readings agree.
	function lampPost() {
		const x = -10;
		const y = -57;
		const out = [slab(x - 3, y - 3, 6, 6, 0, 58, 'mid', { r: 1, seam: [20, 40] })];
		out.push(slab(x - 8, y - 6, 16, 12, 58, 6, 'mid', { r: 1.5, seam: 61 }));
		out.push(cyl(x, y, 6.4, 64, 1.6, 'lo', 0.3));
		out.push(stepSvg('lit-at', 4, cyl(x, y, 5.2, 65.6, 6, 'hi', 0.8, true)));
		out.push(dots([[x - 6.5, y + 6, 61], [x + 6.5, y + 6, 61]], 0.45));
		return out.join('');
	}

	// A round dial drawn in the plane of a housing's front face, with a needle that turns in that plane.
	function dial(cx: number, yF: number, cz: number, R: number, part: string, angle: number, markFrom: number) {
		const pt = (deg: number, r: number) => [r2(Math.sin((deg * Math.PI) / 180) * r), r2(-Math.cos((deg * Math.PI) / 180) * r)];
		const line = (deg: number, a: number, b: number) => {
			const [x0, y0] = pt(deg, a);
			const [x1, y1] = pt(deg, b);
			return `M${x0} ${y0}L${x1} ${y1}`;
		};
		const out: string[] = [];
		out.push(`<circle class="iso-shade" data-shade="2" r="${R}"/>`, `<circle class="iso-line" data-tone="lo" r="${R}"/>`);
		out.push(`<circle class="iso-fill" r="${R - 2.4}"/>`, `<circle class="iso-line" data-tone="mid" r="${R - 2.4}"/>`);
		const minor: string[] = [];
		const major: string[] = [];
		for (let i = 0; i <= 20; i++) (i % 5 ? minor : major).push(line(ZERO + i * 13.5, R - 3.2, R - (i % 5 ? 5 : 7)));
		out.push(L(minor.join(''), { tone: 'lo', free: true }), L(major.join(''), { tone: 'mid', free: true }));
		// The clerk's pencil mark at the reading: on the old dial once the load leaves, on the new one when it matches.
		out.push(stepSvg('show-from', markFrom, `<path class="iso-line" data-tone="hi" style="stroke-width:3" d="${line(READ, R - 3.2, R - 8.5)}"/>`));
		const tail = r2(R * 0.22);
		const needle = `<path class="iso-line" data-tone="hi" style="stroke-width:2.4" d="M0 ${tail}L0 ${r2(-(R - 4))}"/><circle class="iso-top" cy="${tail}" r="1.5"/><circle class="iso-line" data-tone="lo" cy="${tail}" r="1.5"/>`;
		out.push(`<g class="mover plain" data-part="${part}" transform="rotate(${angle})">${needle}</g>`);
		out.push(`<circle class="iso-top" r="2.3"/><circle class="iso-line" data-tone="lo" r="2.3"/><circle class="iso-line" data-tone="mid" r="0.6"/>`);
		return `<g transform="${k.sideMatrix([cx, yF], cz, P, 'left')}">${out.join('')}</g>`;
	}

	function housing(x: number, y: number, w: number, d: number, z: number, h: number, R: number, part: string, angle: number, markFrom: number) {
		const out = [halo({ x, y, w, d, r: 3 }, z, h, 3), slab(x, y, w, d, z, h, 'mid', { r: 3, steps: 4, bevel: 0.5, seam: z + h - 5 })];
		out.push(slab(x + 2, y + 1, w - 4, d - 2, z + h, 2.4, 'mid', { r: 2, steps: 3, bevel: 0.3 }));
		out.push(cyl(x + w / 2, y + d / 2, 3, z + h + 2.4, 2.6, 'mid', 0.3), cyl(x + w / 2, y + d / 2, 2, z + h + 5, 3, 'hi', 0.5));
		out.push(dots([[x + 3, y + d, z + 3], [x + w - 3, y + d, z + 3], [x + 3, y + d, z + h - 8], [x + w - 3, y + d, z + h - 8]], 0.45));
		out.push(dial(x + w / 2, y + d, z + (h - 5) / 2, R, part, angle, markFrom));
		return out.join('');
	}

	function oldScale() {
		const { x, y, w, d } = OLD;
		const body: Plan = { x: x + 1.5, y: y + 1.5, w: w - 3, d: d - 3, r: 0.5 };
		const out = [halo({ x, y, w, d, r: 2 }, 0, TOP, 3)];
		out.push(S(k.slabOf(body, 0, TOP - 4, P, 2, 0.2), { tone: 'mid', inner: [8, 16, 24].map((s) => L(k.sideSeam(body, s, P, 2), { tone: 'faint' })).join('') }));
		for (const [cx, cy] of byDepth(k.corners({ x, y, w, d, r: 0 }, 2.5))) out.push(slab(cx - 2.5, cy - 2.5, 5, 5, 0, TOP - 4, 'mid', { r: 0.6 }));
		const fy = y + d;
		out.push(slab(x + 30, fy, 34, 0.8, 11, 9, 'lo', { r: 0.3, thin: true }), frontText(x + 47, fy + 0.8, 17.6, 'No. 1', 3.2));
		out.push(dots([[x + 32, fy + 0.8, 13], [x + 62, fy + 0.8, 13]], 0.4));
		// column, dial and steelyard beam at the back
		out.push(slab(-134, y, 12, 10, TOP - 4, 30, 'mid', { r: 1, seam: [44, 52] }));
		out.push(housing(-150, y - 2, 44, 12, 60, 46, 19, 'needle-old', ZERO, 2));
		out.push(slab(-162, y + 10, 70, 2.4, 48, 3, 'mid', { r: 0.6, thin: true }), slab(-150, y + 10, 7, 3.2, 47, 5, 'hi', { r: 0.8 }));
		// the deck: planks edge to edge
		const deck: Plan = { x, y: y + 10, w, d: d - 10, r: 1 };
		out.push(S(k.slabOf(deck, TOP - 4, 4, P, 3, 0.4), { tone: 'hi', crease: 'lo', inner: L(k.sideSeam(deck, TOP - 2, P, 3), { tone: 'faint' }) }));
		for (let px = x + 14; px < x + w; px += 14) out.push(flat([px, deck.y + 0.4], [px, deck.y + deck.d - 0.4], TOP, 'lo'));
		out.push(dots(k.corners(deck, 3).map(([a, b]) => [a, b, TOP] as Point3), 0.45));
		return out.join('');
	}

	function newScale() {
		const { x, y, w, d } = NEW;
		const out = [halo({ x, y, w, d, r: 4 }, 0, NEW_DECK, 3)];
		for (const [cx, cy] of byDepth(k.corners({ x, y, w, d, r: 0 }, 6))) out.push(cyl(cx, cy, 3, 0, 2, 'lo', 0.3));
		out.push(slab(x, y, w, d, 2, 10, 'mid', { r: 4, steps: 4, bevel: 0.6, seam: 7 }));
		out.push(slab(x + 20, y + d, 34, 0.8, 4, 6, 'lo', { r: 0.3, thin: true }), dots([[x + 22, y + d + 0.8, 7], [x + 52, y + d + 0.8, 7]], 0.4));
		out.push(slab(98, y, 10, 8, 12, 28, 'mid', { r: 1.5, seam: 30 }));
		out.push(housing(82, y - 2, 42, 10, 38, 42, 17, 'needle-new', READ, 4));
		out.push(slab(x + 1, y + 8, w - 2, d - 8, 12, NEW_DECK - 12, 'hi', { r: 2, steps: 3, bevel: 0.4 }));
		out.push(L(k.planOutline(k.insetPlan({ x: x + 1, y: y + 8, w: w - 2, d: d - 8, r: 2 }, 2.4), NEW_DECK, P), { tone: 'faint' }));
		return out.join('');
	}

	// Each tray is drawn in two halves around its paper: floor, back wall and entry lip, then end wall and front wall.
	function trayBack(name: Name) {
		const c = LANES[name];
		const { x0, x1, half, wall } = TRAY;
		const out = [slab(x0, c - half, x1 - x0, half * 2, NEW_DECK, FLOOR - NEW_DECK, 'mid', { r: 1, steps: 3 })];
		out.push(slab(x0, c - half, x1 - x0, 1.2, FLOOR, wall, 'mid', { r: 0.3 }));
		out.push(slab(x0, c - half + 1.2, 1.4, half * 2 - 2.4, FLOOR, 1.6, 'mid', { r: 0.3 }));
		return out.join('');
	}
	function trayFront(name: Name) {
		const c = LANES[name];
		const { x0, x1, half, wall } = TRAY;
		const out = [slab(x1 - 1.2, c - half + 1.2, 1.2, half * 2 - 2.4, FLOOR, wall, 'mid', { r: 0.3 })];
		out.push(slab(x0, c + half - 1.2, x1 - x0, 1.2, FLOOR, wall, 'mid', { r: 0.3 }));
		out.push(sideText(x1, c, FLOOR + 1.8, TRAY_LABEL[name], 2.8));
		return out.join('');
	}

	// Papers are drawn where they end (in their trays); transforms carry them back to the old scale.
	function ledger(c: number) {
		const x = LEN_OUT;
		const y = c - PD / 2;
		const z = FLOOR;
		const out = [slab(x, y, PW, PD, z, 7, 'hi', { r: 0.8, steps: 3, bevel: 0.4, seam: [z + 2.5, z + 4.5] })];
		out.push(slab(x, y, 5, PD, z, 7.3, 'mid', { r: 0.6, thin: true }));
		for (const dy of [4, 8, 12, 16]) out.push(flat([x + 9, y + dy], [x + PW - 3, y + dy], z + 7));
		out.push(flat([x + 19, y + 1.5], [x + 19, y + PD - 1.5], z + 7), seg([x + 2.5, y + PD, z + 1], [x + 2.5, y + PD, z + 6.3]));
		return out.join('');
	}
	function printout(c: number) {
		const x = LEN_OUT;
		const y = c - PD / 2;
		const out: string[] = [];
		for (let i = 0; i < 7; i++) out.push(slab(x + (i % 2 ? 1.4 : 0), y, PW - 1.4, PD, FLOOR + i * 0.8, 0.8, 'hi', { r: 0.3, thin: true }));
		const t = FLOOR + 5.6;
		const x1 = x + 1.4;
		for (const dy of [5, 10, 15]) out.push(flat([x1 + 4, y + dy], [x1 + PW - 5, y + dy], t, 'lo'));
		for (const dx of [12, 22]) out.push(flat([x1 + dx, y + 3], [x1 + dx, y + PD - 3], t));
		const holes = (yy: number) => dots([0, 1, 2, 3, 4, 5, 6].map((i) => [x1 + 3 + i * 4.6, yy, t] as Point3), 0.35, 'lo');
		out.push(holes(y + 1.2), holes(y + PD - 1.2));
		return out.join('');
	}
	function receipts(c: number) {
		const y = c - PD / 2;
		const slips: [number, number, number, number][] = [
			[0, 0, 16, 10],
			[17, 1, 16, 9],
			[2, 10, 15, 10],
			[18, 10.5, 15, 9.5],
			[9, 4.5, 15, 10],
		];
		return slips
			.map(([dx, dy, w, d], i) => {
				const x = LEN_OUT + dx;
				const z = FLOOR + i * 0.7 + (i === 4 ? 0.7 : 0);
				const t = z + 0.7;
				return slab(x, y + dy, w, d, z, 0.7, 'hi', { r: 0.3, thin: true }) + flat([x + 2, y + dy + 2.4], [x + w - 2, y + dy + 2.4], t, 'lo') + flat([x + 2, y + dy + 5.4], [x + w - 5, y + dy + 5.4], t);
			})
			.join('');
	}
	const draw: Record<Name, (c: number) => string> = { ledger, printout, receipts };

	const lift = TOP - FLOOR;
	const transforms = transformsFrom(P, Object.fromEntries(NAMES.map((n) => [n, [[LEN_IN - LEN_OUT, 0, lift], [X0 - LEN_OUT, 0, lift], [0, 0, 0], [0, 0, 0]]])));
	transforms['needle-old'] = [READ, ZERO, ZERO, ZERO].map((a) => `rotate(${a})`);
	transforms['needle-new'] = [ZERO, ZERO, READ + 17, READ].map((a) => `rotate(${a})`);

	const ROLLERS = Array.from({ length: 15 }, (_, i) => X0 + 5 + i * 9);
	const LEGS = [-66, 48];
	function conveyorBack() {
		const out: string[] = [];
		for (const lx of LEGS) out.push(slab(lx - 2, -HALF - 4, 4, 4, 0, zAt(lx + 2) - 4, 'mid', { r: 0.5 }));
		for (const lx of LEGS) out.push(slab(lx - 2, -HALF, 4, HALF * 2, 6, 3, 'lo', { r: 0.4 }));
		out.push(slab(-76, -HALF - 9, 5, 4, 0, 46, 'mid', { r: 0.6, seam: 20 }));
		out.push(sloped(X0, X1, -HALF - 4, -HALF, 2, 6));
		for (const rx of ROLLERS) out.push(slab(rx - 2.4, -HALF, 4.8, HALF * 2, zAt(rx) - 3.3, 3, 'mid', { r: 2.4, steps: 4 }));
		return out.join('');
	}
	function conveyorFront() {
		const out: string[] = [];
		for (const lx of LEGS) out.push(slab(lx - 2, HALF, 4, 4, 0, zAt(lx + 2) - 4, 'mid', { r: 0.5 }));
		out.push(sloped(X0, X1, HALF, HALF + 4, 2, 6));
		for (const rx of ROLLERS) out.push(slab(rx - 1.2, HALF + 4, 2.4, 0.8, zAt(rx) - 2.6, 2.4, 'hi', { r: 0.4, thin: true }));
		out.push(slab(-76, HALF + 5, 5, 4, 0, 46, 'mid', { r: 0.6, seam: 20 }));
		const lintel: Plan = { x: -77, y: -HALF - 10, w: 7, d: HALF * 2 + 20, r: 1 };
		out.push(halo(lintel, 46, 6, 2), slab(lintel.x, lintel.y, lintel.w, lintel.d, 46, 6, 'mid', { r: 1, steps: 3, bevel: 0.4, seam: 49 }));
		out.push(dots([[-73.5, -HALF - 7, 52], [-73.5, HALF + 7, 52]], 0.45));
		for (const y of [-28, 0, 28]) out.push(flat([-76.4, y], [-70.6, y], 52, 'lo'));
		return out.join('');
	}

	const paperSvg = (n: Name) => moverSvg(n, transforms[n][3], draw[n](LANES[n]));
	const svg = k.figureSvg({
		width,
		height,
		label:
			'Two weighing scales on one base joined by a sloping roller conveyor. An old wooden scale heaped with a ledger, a fan of printouts and loose receipts feeds them under a throat bar and down the rollers into three trays on a new scale marked customers, orders and money. Its dial needle swings to the same reading the old dial showed, and a match lamp between the dials lights: nothing lost.',
		body: [base(), lampPost(), oldScale(), conveyorBack(), newScale(), ...NAMES.map((n) => trayBack(n) + paperSvg(n) + trayFront(n)), conveyorFront()],
	});
	return { svg, labels: LABELS, transforms };
}
