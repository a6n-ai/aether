import * as k from '../../lib/anatomy/iso-kit';
import type { Plan, Plane, Point3 } from '../../lib/anatomy/iso-kit';
import { moverSvg, stepSvg, transformsFrom, type Machine } from '../../lib/plate';
import { kioskKit, LZ, SIGN, FLAP, RZ, RT } from '../kiosk/parts';

export const LABELS = ['your app running', 'checked every day', 'fixed and improved', 'grows with you'] as const;
export const CAPTION = "Once you're live, we keep watch every day, fix what breaks and add what you need next.";

const BASE: Plan = { x: -270, y: -62, w: 346, d: 126, r: 8 };
const BASE_H = 10;
const FOOT_H = 5;
// the paved lot under the kiosk and the second module's run
const LOT: Plan = { x: -262, y: -56, w: 238, d: 108, r: 3 };

// slip rail under the counter's lip: along the front, then back down the right side into the kitchen hatch
const RAIL_Z = 31;
const RAIL_H = 3;
const ROLL_Z = RAIL_Z + RAIL_H;
const ROLL_R = 2.8;
const FRONT_Y = 4.5;
const SIDE_X = -35.5;
const HATCH = { y: -44, d: 14, z: 13, h: 25 };
// slips hang in front of the rail
const SLIP_W = 12;
const SLIP_Z = 15;
const SLIP_H = 16;
const TEST_X = -85;
const TEST_RUN = 38;
const SEAT: Point3 = [SIDE_X, -6, ROLL_Z];

// second counter module: drawn as the kiosk, shifted along x, waiting at the lot's front edge
const M2_DX = -100;
const M2_FROM: Point3 = [-24, 40, 0];

// service cart, parked beside the kiosk's right side
const CART: Plan = { x: -12, y: -40, w: 48, d: 36, r: 1.5 };
const DECK_Z = 9;
const DECK = 14;
const CART_FROM = 30;
const SHELF: Point3 = [3, -34, 49.5];
const TRAY: Point3 = [2, -8, DECK + 2.5];
const DIAL: Point3 = [23, -3.4, 33];
const DIAL_R = 7;
const OK_DEG = 48;
const REST_DEG = -56;

// menu board standing on the counter's right end, carried on a stand at the cart's left edge
const BOARD = { x: -38, y: -38, w: 1.4, d: 24, z: 43, h: 24 };
const BOARD_DX = CART.x - BOARD.x;

export function runGrow(width = 720, height = 480): Machine {
	const P = k.fitProjection(
		[...k.boxCorners(BASE, -BASE_H - FOOT_H, 0), [-82, -30, SIGN.z + SIGN.h + 6], [-82, 8, FLAP.z + FLAP.h], [-82 + M2_DX + M2_FROM[0], -12 + M2_FROM[1], RZ + RT + 12]],
		width,
		height,
		{ pad: 22, azimuth: 55 },
	);
	const { dots, halo, slab, cyl, S, L, byDepth, affine, counter, frame, roof, awning, awningDown } = kioskKit(P);
	const seg = (a: Point3, b: Point3) => k.segment(a, b, P);
	const flat = (a: Plane, b: Plane, z: number) => k.lineOnTop(a, b, z, P);
	/** One path per tone for a batch of free lines. */
	const lines = (d: string[], tone: 'hi' | 'mid' | 'lo' | 'faint' = 'faint') => L(d.join(''), { tone, free: true });

	function base() {
		const out = [halo(BASE, -BASE_H - FOOT_H, BASE_H)];
		const foot = (x: number, y: number, r: number, z: number, h: number, tone: 'lo' | 'mid', bevel: number) => S(k.cylinder(x, y, r, z, h, P, 20, bevel), { tone });
		for (const [x, y] of byDepth(k.corners(BASE, 24))) out.push(foot(x, y, 8, -BASE_H - FOOT_H, 1.8, 'lo', 0.4), foot(x, y, 6, -BASE_H - FOOT_H + 1.8, FOOT_H - 1.8, 'mid', 0.3));
		out.push(S(k.slabOf(BASE, -BASE_H, BASE_H, P, 8, 1.6), { tone: 'mid', inner: L(k.sideSeam(BASE, -BASE_H / 2, P), { tone: 'faint' }) }));
		out.push(L(k.planOutline(k.insetPlan(BASE, 5), 0, P), { tone: 'lo' }));
		const screws = k.corners(BASE, 10);
		out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(''), { tone: 'lo' }), dots(screws.map(([x, y]) => [x, y, 0] as Point3), 0.5));
		out.push(lines(screws.map(([x, y]) => flat([x - 1.3, y], [x + 1.3, y], 0))));
		// ruler strip along the front, right of the lot
		const strip: Plan = { x: -16, y: 52, w: 88, d: 5, r: 1 };
		out.push(slab(strip.x, strip.y, strip.w, strip.d, 0, 0.6, 'lo', { thin: true, steps: 3 }));
		const tk = k.topTicks(strip.x + 4, strip.x + strip.w - 4, 4, 5, strip.y + 0.6, 0.6, [1.6, 3], P);
		out.push(L(tk.minor, { tone: 'lo' }), L(tk.major, { tone: 'mid' }));
		// label plate with three rule lines
		const label: Plan = { x: 10, y: 28, w: 56, d: 12, r: 1.5 };
		out.push(slab(label.x, label.y, label.w, label.d, 0, 0.8, 'lo', { steps: 3 }));
		out.push(lines([[2.6, 50], [5.6, 40], [8.6, 30]].map(([dy, w]) => flat([label.x + 5, label.y + dy], [label.x + w, label.y + dy], 0.8))));
		out.push(dots([[label.x + 2.4, label.y + 6, 0.8], [label.x + label.w - 2.4, label.y + 6, 0.8]]));
		return out.join('');
	}

	function lot() {
		const out = [halo(LOT, 0, LZ)];
		out.push(S(k.slabOf(LOT, 0, LZ, P, 4, 0.8), { tone: 'lo', inner: L(k.sideSeam(LOT, LZ / 2, P, 4), { tone: 'faint' }) }));
		out.push(L(k.planOutline(k.insetPlan(LOT, 3), LZ, P), { tone: 'faint' }));
		const joints: string[] = [];
		for (let x = LOT.x + 3 + 30.6; x < LOT.x + LOT.w - 6; x += 30.6) joints.push(flat([x, LOT.y + 3], [x, LOT.y + LOT.d - 3], LZ));
		for (let y = LOT.y + 3 + 36.7; y < LOT.y + LOT.d - 6; y += 36.7) joints.push(flat([LOT.x + 3, y], [LOT.x + LOT.w - 3, y], LZ));
		out.push(lines(joints));
		// boundary pins at the lot's corners
		const pins = k.corners(LOT, 7);
		out.push(L(pins.map(([x, y]) => k.ring(x, y, 1.8, LZ, P, 12)).join(''), { tone: 'mid' }), dots(pins.map(([x, y]) => [x, y, LZ] as Point3), 0.6, 'mid'));
		return out.join('');
	}

	/** Kitchen hatch at the back of the cabinet's right side, where the side rail ends. */
	function hatch() {
		const { y, d, z, h } = HATCH;
		const x = -38;
		const out = [slab(x, y, 0.8, d, z, h, 'mid', { r: 0.3, thin: true })];
		out.push(slab(x + 0.8, y + 2.2, 0.3, d - 4.4, z + 3, h - 5.4, 'lo', { r: 0.2, thin: true, bevel: 0 }));
		out.push(slab(x, y - 0.6, 3.4, d + 1.2, z, 1.8, 'hi', { r: 0.4 }));
		out.push(dots([[x + 0.8, y + 1.1, z + h - 1.2], [x + 0.8, y + d - 1.1, z + h - 1.2], [x + 0.8, y + 1.1, z + 3], [x + 0.8, y + d - 1.1, z + 3]], 0.4));
		return out.join('');
	}

	const roller = (x: number, y: number, z = ROLL_Z) => cyl(x, y, ROLL_R, z, 3, 'hi', 0.5) + dots([[x, y, z + 3]], 0.55, 'lo');

	/** The front stretch of rail under the counter's lip, from x0 to x1, on brackets, with rollers. */
	function frontRail(x0: number, x1: number, rollers: number[], brackets: number[]) {
		const out = brackets.map((x) => slab(x, 2, 3, 1.6, RAIL_Z - 2, RAIL_H + 2, 'lo', { r: 0.3 }));
		out.push(slab(x0, FRONT_Y - 1.5, x1 - x0, 3, RAIL_Z, RAIL_H, 'mid', { r: 0.4, seam: RAIL_Z + 1.2 }));
		for (const x of rollers) out.push(roller(x, FRONT_Y));
		return out.join('');
	}

	function sideRail() {
		const out = [-20, -2].map((y) => slab(-38, y, 1.6, 3, RAIL_Z - 2, RAIL_H + 2, 'lo', { r: 0.3 }));
		out.push(slab(SIDE_X - 1.5, HATCH.y + HATCH.d - 2, 3, FRONT_Y - 1.5 - (HATCH.y + HATCH.d - 2), RAIL_Z, RAIL_H, 'mid', { r: 0.4, seam: RAIL_Z + 1.2 }));
		out.push(roller(SIDE_X, -22));
		return out.join('');
	}

	/** An order slip on the front rail (faces +y) or the side rail (faces +x), with a clip and pencilled lines. */
	function slip(along: number, face: 'front' | 'side', tone: 'hi' | 'mid' = 'hi') {
		const out: string[] = [];
		const ink: string[] = [];
		const rows = [0.78, 0.58, 0.4, 0.22];
		if (face === 'front') {
			const y = FRONT_Y + 1.7;
			out.push(slab(along, y, SLIP_W, 0.5, SLIP_Z, SLIP_H, tone, { r: 0.1, thin: true, bevel: 0 }));
			out.push(slab(along + 3, y - 0.6, 3.5, 1.4, RAIL_Z - 2, RAIL_H + 2.6, 'lo', { r: 0.3, thin: true }));
			for (const [i, f] of rows.entries()) ink.push(seg([along + 1.6, y + 0.5, SLIP_Z + SLIP_H * f], [along + SLIP_W - (i % 2 ? 3.6 : 1.6), y + 0.5, SLIP_Z + SLIP_H * f]));
		} else {
			const x = SIDE_X + 1.7;
			out.push(slab(x, along, 0.5, SLIP_W, SLIP_Z, SLIP_H, tone, { r: 0.1, thin: true, bevel: 0 }));
			out.push(slab(x - 0.6, along + 3, 1.4, 3.5, RAIL_Z - 2, RAIL_H + 2.6, 'lo', { r: 0.3, thin: true }));
			for (const [i, f] of rows.entries()) ink.push(seg([x + 0.5, along + 1.6, SLIP_Z + SLIP_H * f], [x + 0.5, along + SLIP_W - (i % 2 ? 3.6 : 1.6), SLIP_Z + SLIP_H * f]));
		}
		return out.join('') + lines(ink, 'mid');
	}

	function module2() {
		const lampAt: Plane = [-82, -12];
		const top = RZ + RT;
		const lamp = cyl(lampAt[0], lampAt[1], 4.6, top + 3.6, 5, 'hi', 0.8, true);
		return [
			counter({ goods: false }),
			frame(),
			frontRail(-128, -28, [-110, -82, -54], [-118, -82, -46]),
			roof({ sign: false }),
			cyl(lampAt[0], lampAt[1], 5.4, top, 1.4, 'lo', 0.3),
			cyl(lampAt[0], lampAt[1], 1.4, top + 1.4, 2.2, 'mid', 0.2),
			stepSvg('lit-at', 4, lamp),
		].join('');
	}

	function board() {
		const { x, y, w, d, z, h } = BOARD;
		const fx = x + w;
		const out = [slab(x, y, w, d, z, h, 'hi', { r: 0.4, thin: true })];
		out.push(slab(x, y - 0.6, w + 0.6, d + 1.2, z + h - 2.6, 2.6, 'mid', { r: 0.4 }), slab(x, y - 0.6, w + 0.6, d + 1.2, z, 1.6, 'mid', { r: 0.4 }));
		out.push(k.faceTextSvg(k.sideMatrix([fx, y + d / 2], z + h - 7.6, P, 'right'), 'MENU', { size: 4.2, tone: 'mid', anchor: 'middle' }));
		const rules: string[] = [];
		for (let i = 0; i < 5; i++) {
			const zz = z + 3 + i * 2.6;
			rules.push(seg([fx, y + 2.4, zz], [fx, y + d - 7, zz]), seg([fx, y + d - 5, zz], [fx, y + d - 2.4, zz]));
		}
		out.push(lines(rules, 'lo'));
		out.push(dots([[fx, y + 1.4, z + 1.4], [fx, y + d - 1.4, z + 1.4]], 0.4));
		return out.join('');
	}

	function cart() {
		const out = [halo(CART, DECK_Z, DECK - DECK_Z)];
		// castors: knurled wheels under swivel forks
		for (const [x, y] of byDepth(k.corners(CART, 4.5))) {
			out.push(cyl(x, y, 3.6, 0.4, 5.2, 'lo', 0.4), L(k.knurl(x, y, 3.6, 1.2, 4.8, 10, P), { tone: 'faint' }));
			out.push(slab(x - 2.6, y - 2.6, 5.2, 5.2, 5.6, DECK_Z - 5.6, 'mid', { r: 0.8 }));
		}
		out.push(S(k.slabOf(CART, DECK_Z, DECK - DECK_Z, P, 3, 0.6), { tone: 'mid', inner: L(k.sideSeam(CART, DECK_Z + 2.4, P, 3), { tone: 'faint' }) }));
		out.push(dots(k.corners(CART, 2.4).map(([x, y]) => [x, y, DECK] as Point3), 0.45));
		// stand that carries the menu board at counter height
		for (const sy of [BOARD.y + 2, BOARD.y + BOARD.d - 4.4]) out.push(slab(CART.x, sy, 2.4, 2.4, DECK, BOARD.z - 1.6 - DECK, 'lo', { r: 0.5, seam: DECK + 10 }));
		out.push(slab(CART.x - 0.2, BOARD.y - 1, 3, BOARD.d + 2, BOARD.z - 1.6, 1.6, 'mid', { r: 0.5 }));
		// pegboard with a spanner and a screwdriver, and a parts shelf carrying the new roller
		const pb = { x: -4, y: CART.y, w: 34, d: 2, z: DECK, h: 48 };
		out.push(slab(pb.x, pb.y, pb.w, pb.d, pb.z, pb.h, 'mid', { r: 0.4, seam: pb.z + 4 }));
		const holes: Point3[] = [];
		for (let i = 0; i < 6; i++) for (let j = 0; j < 7; j++) holes.push([pb.x + 4 + i * 5.4, pb.y + pb.d, pb.z + 8 + j * 5.6]);
		out.push(dots(holes.filter(([x, , z]) => !(x > 12 && z > 34) && !(x < 12 && z > 42)), 0.3, 'lo'));
		const fy = pb.y + pb.d;
		out.push(slab(17, fy, 2, 0.6, 38, 18, 'hi', { r: 0.4, thin: true }), slab(15.6, fy, 4.8, 0.6, 52, 5, 'hi', { r: 1, thin: true }));
		out.push(slab(25, fy, 1.4, 0.6, 37, 12, 'lo', { r: 0.3, thin: true }), slab(24, fy, 3.4, 0.7, 49, 7, 'hi', { r: 0.6, thin: true }));
		out.push(slab(0.4, fy, 1.8, 6, SHELF[2] - 5, 5, 'lo', { r: 0.3 }), slab(SHELF[0] - 7, fy, 14, 8, SHELF[2] - 1.5, 1.5, 'hi', { r: 0.4 }));
		// toolbox with two latches and a carry handle
		out.push(slab(2, -27, 22, 13, DECK, 10, 'mid', { r: 0.8, seam: DECK + 7 }));
		out.push(slab(1.6, -27.4, 22.8, 13.8, DECK + 10, 2, 'hi', { r: 0.9 }));
		for (const lx of [6, 17]) out.push(slab(lx, -13.6, 3, 0.7, DECK + 6.4, 4.6, 'lo', { r: 0.3, thin: true }));
		out.push(slab(8, -21.2, 10, 1.8, DECK + 12, 4.2, 'mid', { r: 0.6, seam: DECK + 14.6 }));
		// parts tray for the old roller
		out.push(slab(-6, -11, 16, 6, DECK, 2.5, 'lo', { r: 0.6, seam: DECK + 1.2 }), L(k.ring(TRAY[0], TRAY[1], ROLL_R + 0.6, TRAY[2], P, 16), { tone: 'mid' }));
		// gauge on its housing, face to the front
		out.push(slab(14, -9, 18, 5, DECK, 32, 'mid', { r: 0.8, seam: DECK + 8 }));
		const [cx, fy2, cz] = DIAL;
		out.push(slab(15, fy2 - 0.6, 16, 0.6, cz - 8.6, 17.2, 'hi', { r: 0.6, thin: true }));
		const face: string[] = [k.sideRing([cx, fy2, cz], DIAL_R, 'y', P, 40)];
		const major: string[] = [];
		for (let i = 0; i <= 10; i++) {
			const a = ((-60 + i * 12) * Math.PI) / 180;
			const [s, c] = [Math.sin(a), Math.cos(a)];
			const r0 = i % 5 ? DIAL_R - 1.6 : DIAL_R - 2.8;
			(i % 5 ? face : major).push(seg([cx + s * r0, fy2, cz + c * r0], [cx + s * (DIAL_R - 0.6), fy2, cz + c * (DIAL_R - 0.6)]));
		}
		out.push(L(face.join(''), { tone: 'lo' }), L(major.join(''), { tone: 'mid' }));
		out.push(k.faceTextSvg(k.sideMatrix([cx + 3.4, fy2], cz - 4.4, P, 'left'), 'OK', { size: 2.6, tone: 'mid', anchor: 'middle' }));
		out.push(dots([[cx, fy2, cz], [15.8, fy2, cz - 7.8], [30.2, fy2, cz - 7.8]], 0.4));
		// push handle at the right end
		for (const hy of [-36, -10]) out.push(slab(33, hy, 2, 2, DECK, 30, 'lo', { r: 0.5 }));
		out.push(slab(32.6, -37.4, 2.8, 30, DECK + 30, 2.4, 'mid', { r: 0.9 }));
		return out.join('');
	}

	function needle() {
		const [cx, fy, cz] = DIAL;
		const a = (OK_DEG * Math.PI) / 180;
		const dir: [number, number] = [Math.sin(a), Math.cos(a)];
		const side: [number, number] = [dir[1], -dir[0]];
		const pt = (along: number, across: number) => k.iso([cx + dir[0] * along + side[0] * across, fy + 0.1, cz + dir[1] * along + side[1] * across], P);
		const d = k.pathOf([pt(DIAL_R - 1, 0), pt(0, 0.7), pt(-1.8, 0), pt(0, -0.7)], true);
		return S({ fill: d, outline: d, crease: '', top: d, shades: [] }, { tone: 'mid' });
	}

	// moves: every offset is where the part is at that step, relative to where it is drawn
	const zero: Point3 = [0, 0, 0];
	const add = (a: Point3, b: Point3): Point3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
	const sub = (a: Point3, b: Point3): Point3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
	const away: Point3 = [CART_FROM, 0, 0];
	const onRail = sub(SEAT, TRAY);
	const onShelf = sub(SHELF, SEAT);
	const transforms = transformsFrom(P, {
		module2: [M2_FROM, M2_FROM, M2_FROM, zero],
		testSlip: [[-TEST_RUN, 0, 0], zero, zero, zero],
		board: [[BOARD_DX + CART_FROM, 0, 0], [BOARD_DX, 0, 0], zero, zero],
		cart: [away, zero, zero, zero],
		oldRoller: [onRail, onRail, zero, zero],
		newRoller: [add(onShelf, away), onShelf, zero, zero],
	});
	// the needle turns about the dial's centre in the face's plane, riding with the cart
	const [cx, fy, cz] = DIAL;
	const swing = (deg: number, shift: Point3) => {
		const t = (deg * Math.PI) / 180;
		const [c, s] = [Math.cos(t), Math.sin(t)];
		return affine([cx, fy, cz], [1, 0, 0], [0, 0, 1], ([x, y, z]) => [cx + (x - cx) * c + (z - cz) * s + shift[0], y + shift[1], cz - (x - cx) * s + (z - cz) * c + shift[2]]);
	};
	transforms.needle = [swing(REST_DEG - OK_DEG, away), swing(0, zero), swing(0, zero), swing(0, zero)];
	const last = (n: string) => transforms[n][3];
	const m2Shift = k.translateAlong(P, [M2_DX, 0, 0]);

	const svg = k.figureSvg({
		width,
		height,
		label:
			'The market kiosk from Plate V a year on, open and trading, with an order-slip rail running from its counter along the front and back to a kitchen hatch. Our service cart rolls up beside it and a test slip runs along the rail while the gauge needle swings to OK; a jammed roller lifts out of the rail onto the cart, a new one drops in from the cart, and a menu board slides onto the kiosk side. Then a second counter module slides in from the edge of the lot beside the first, the rail runs on into it, and its lamp lights.',
		body: [
			base(),
			lot(),
			`<g transform="${m2Shift}">${moverSvg('module2', last('module2'), module2())}</g>`,
			counter({ jars: false }),
			hatch(),
			frame(),
			roof({ lit: false }),
			`<g transform="${awningDown()}">${awning()}</g>`,
			moverSvg('board', last('board'), board()),
			sideRail(),
			slip(-29, 'side'),
			frontRail(-128, -34, [-112, -88, -64, -40], [-118, -82, -46]),
			slip(-70, 'front'),
			slip(-55, 'front'),
			moverSvg('testSlip', last('testSlip'), slip(TEST_X, 'front')),
			moverSvg('cart', last('cart'), cart()),
			moverSvg('needle', last('needle'), needle()),
			moverSvg('oldRoller', last('oldRoller'), roller(TRAY[0], TRAY[1], TRAY[2])),
			moverSvg('newRoller', last('newRoller'), roller(SEAT[0], SEAT[1])),
		],
	});
	return { svg, labels: LABELS, transforms };
}
