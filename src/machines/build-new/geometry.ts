import * as k from '../../lib/anatomy/iso-kit';
import type { Plan, Plane, Point3 } from '../../lib/anatomy/iso-kit';
import { moverSvg, stepSvg, transformsFrom, type Machine } from '../../lib/plate';
import { kioskKit, LZ, CAB, POSTS, POST, TZ, SH, RISE, RZ, SIGN, FLAP, LINTEL_Z } from '../kiosk/parts';

export const LABELS = ['your idea', 'drawn up', 'built from parts', 'open for customers'] as const;
export const CAPTION = 'Have an idea? We draw it up with you, build it from parts that already work, and open it to your customers.';

const BASE: Plan = { x: -160, y: -70, w: 292, d: 140, r: 8 };
const BASE_H = 10;
const FOOT_H = 5;

// the lot: an empty plinth, and the kiosk's footprint on it
const LOT: Plan = { x: -148, y: -58, w: 130, d: 116, r: 3 };
// sketch card: two halves folded on y = FOLD
const CARD = { x: -101, w: 38, half: 17, z: LZ, t: 0.6 };
const FOLD = 34;

// delivery pallet beside the lot
const PALLET: Plan = { x: 0, y: -62, w: 112, d: 120, r: 1 };
const PZ = 9;
const COUNTER_AT: Point3 = [134, -14, PZ - LZ];
const FRAME_AT: Point3 = [134, -8, PZ - TZ];
const ROOF_AT: Point3 = [136, 48, PZ - (RZ - 7)];

export function buildNew(width = 720, height = 480): Machine {
	const P = k.fitProjection(
		[...k.boxCorners(BASE, -BASE_H - FOOT_H, 0), [-82, -30, SIGN.z + SIGN.h + 6], [-82, 8, FLAP.z + FLAP.h], [60, -58, PZ + 84]],
		width,
		height,
		{ pad: 22, azimuth: 55 },
	);
	const { at, S, L, D, dots, halo, slab, cyl, flat, byDepth, r1, affine, turnX, counter, frame, shutter, roof, awning, awningDown } = kioskKit(P);
	const still = 'matrix(1 0 0 1 0 0)';

	function base() {
		const out = [halo(BASE, -BASE_H - FOOT_H, BASE_H)];
		const feet = [...k.corners(BASE, 24), [-14, BASE.y + 24], [-14, BASE.y + BASE.d - 24]] as Plane[];
		for (const [x, y] of byDepth(feet)) out.push(cyl(x, y, 8, -BASE_H - FOOT_H, 1.8, 'lo', 0.4), cyl(x, y, 6, -BASE_H - FOOT_H + 1.8, FOOT_H - 1.8, 'mid', 0.3));
		out.push(S(k.slabOf(BASE, -BASE_H, BASE_H, P, 8, 1.6), { tone: 'mid', inner: L(k.sideSeam(BASE, -BASE_H / 2, P), { tone: 'faint' }) }));
		out.push(L(k.planOutline(k.insetPlan(BASE, 5), 0, P), { tone: 'lo' }));
		const screws = k.corners(BASE, 10);
		out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(''), { tone: 'lo' }), dots(screws.map(([x, y]) => [x, y, 0] as Point3), 0.5));
		for (const [x, y] of screws) out.push(flat([x - 1.3, y], [x + 1.3, y], 0));
		const strip: Plan = { x: -142, y: 61, w: 120, d: 5, r: 1 };
		out.push(slab(strip.x, strip.y, strip.w, strip.d, 0, 0.6, 'lo', { thin: true, steps: 3 }));
		const tk = k.topTicks(strip.x + 4, strip.x + strip.w - 4, 4, 5, strip.y + 0.6, 0.6, [1.6, 3], P);
		out.push(L(tk.minor, { tone: 'lo' }), L(tk.major, { tone: 'mid' }));
		const label: Plan = { x: 30, y: 60, w: 60, d: 8, r: 1.5 };
		out.push(slab(label.x, label.y, label.w, label.d, 0, 0.8, 'lo', { steps: 3 }));
		for (const [dy, w] of [[2.5, 50], [5.2, 34]] as const) out.push(flat([label.x + 5, label.y + dy], [label.x + w, label.y + dy], 0.8));
		out.push(dots([[label.x + 2.4, label.y + 4, 0.8], [label.x + label.w - 2.4, label.y + 4, 0.8]]));
		return out.join('');
	}

	function lot() {
		const out = [halo(LOT, 0, LZ)];
		out.push(S(k.slabOf(LOT, 0, LZ, P, 4, 0.8), { tone: 'lo', inner: L(k.sideSeam(LOT, LZ / 2, P, 4), { tone: 'faint' }) }));
		out.push(L(k.planOutline(k.insetPlan(LOT, 3), LZ, P), { tone: 'faint' }));
		// paving joints, edge to edge inside the kerb line
		for (let x = LOT.x + 3 + 31; x < LOT.x + LOT.w - 6; x += 31) out.push(flat([x, LOT.y + 3], [x, LOT.y + LOT.d - 3], LZ));
		for (let y = LOT.y + 3 + 37; y < LOT.y + LOT.d - 6; y += 37) out.push(flat([LOT.x + 3, y], [LOT.x + LOT.w - 3, y], LZ));
		// boundary pins at the lot's corners
		for (const [x, y] of byDepth(k.corners(LOT, 7))) out.push(cyl(x, y, 1.8, LZ, 1.6, 'mid', 0.3), dots([[x, y, LZ + 1.6]], 0.5, 'hi'));
		return out.join('');
	}

	function chalk() {
		const z = LZ + 0.05;
		const fp = k.insetPlan(CAB, -1);
		const out = [L(k.planOutline({ ...fp, r: 0 }, z, P, 2), { tone: 'hi', dashed: true, free: true })];
		// peg marks: a cross at each corner of the footprint, and the two post squares
		for (const [x, y] of k.corners(fp)) out.push(flat([x - 3, y - 3], [x + 3, y + 3], z, 'hi'), flat([x - 3, y + 3], [x + 3, y - 3], z, 'hi'));
		for (const x of POSTS) out.push(L(k.planOutline({ x: x - 1, y: -3, w: POST + 2, d: POST + 2, r: 0 }, z, P, 2), { tone: 'mid', free: true }));
		// centre line and the counter's front, measured off
		out.push(flat([-82, fp.y - 4], [-82, fp.y + fp.d + 6], z, 'mid'), flat([fp.x, fp.y + fp.d + 4], [fp.x + fp.w, fp.y + fp.d + 4], z, 'mid'));
		out.push(flat([fp.x, fp.y + fp.d + 2], [fp.x, fp.y + fp.d + 6], z, 'mid'), flat([fp.x + fp.w, fp.y + fp.d + 2], [fp.x + fp.w, fp.y + fp.d + 6], z, 'mid'));
		return stepSvg('show-from', 2, out.join(''));
	}

	function cardHalf(front: boolean) {
		const { x, w, half, z, t } = CARD;
		const y = front ? FOLD : FOLD - half;
		const top = z + t;
		const out = [slab(x, y, w, half, z, t, 'hi', { r: 0.4, thin: true, steps: 2, bevel: 0 })];
		if (front) {
			// the idea, in pencil: a little stall with an awning
			const L0 = x + 6;
			const R0 = x + w - 6;
			const yy = (f: number) => y + 2 + f * (half - 4);
			out.push(flat([L0, yy(0.1)], [R0, yy(0.1)], top, 'mid'), flat([L0 - 2, yy(0.32)], [R0 + 2, yy(0.32)], top, 'mid'), flat([L0 - 2, yy(0.32)], [L0, yy(0.1)], top, 'mid'), flat([R0 + 2, yy(0.32)], [R0, yy(0.1)], top, 'mid'));
			out.push(flat([L0, yy(0.32)], [L0, yy(1)], top, 'mid'), flat([R0, yy(0.32)], [R0, yy(1)], top, 'mid'), flat([L0, yy(0.64)], [R0, yy(0.64)], top, 'mid'), flat([L0 - 1, yy(1)], [R0 + 1, yy(1)], top, 'mid'));
			for (let i = 1; i < 4; i++) out.push(flat([L0 + ((R0 - L0) * i) / 4, yy(0.12)], [L0 - 2 + ((R0 - L0 + 4) * i) / 4, yy(0.3)], top));
		} else {
			for (const [dy, w2] of [[3, 16], [6, 12], [9, 15]] as const) out.push(flat([x + 4, y + dy], [x + 4 + w2, y + dy], top, 'lo'));
		}
		return out.join('');
	}

	function pallet() {
		const out = [halo(PALLET, 0, PZ)];
		const { x, y, w, d } = PALLET;
		for (const bx of [x + 2, x + w / 2 - 5, x + w - 12]) out.push(slab(bx, y, 10, d, 0, 2, 'lo', { r: 0.4 }));
		const blocks: Plane[] = [];
		for (const bx of [x + 2, x + w / 2 - 5, x + w - 12]) for (const by of [y + 1, y + d / 2 - 5, y + d - 11]) blocks.push([bx, by]);
		for (const [bx, by] of byDepth(blocks)) out.push(slab(bx, by, 10, 10, 2, 4, 'mid', { r: 0.6 }), dots([[bx + 5, by + 10, 4]], 0.4));
		const boards = 7;
		const bd = (d - (boards - 1) * 3) / boards;
		for (let i = 0; i < boards; i++) {
			const by = y + i * (bd + 3);
			out.push(slab(x, by, w, bd, 6, PZ - 6, 'lo', { r: 0.5, seam: 7.5 }));
			out.push(dots([[x + 7, by + bd / 2, PZ], [x + w / 2, by + bd / 2, PZ], [x + w - 7, by + bd / 2, PZ]], 0.4));
		}
		// dunnage block that props the roof's back edge
		out.push(slab(10, 0, 88, 8, PZ, 7, 'lo', { r: 0.6, seam: PZ + 3.5 }));
		return out.join('');
	}

	// moves
	const zero: Point3 = [0, 0, 0];
	const transforms = transformsFrom(P, {
		counter: [COUNTER_AT, COUNTER_AT, zero, zero],
		frame: [FRAME_AT, FRAME_AT, zero, zero],
		shutter: [FRAME_AT, FRAME_AT, zero, [0, 0, RISE]],
		roof: [ROOF_AT, ROOF_AT, zero, zero],
	});
	const fp0: Point3 = [FLAP.x, FLAP.y + FLAP.d, FLAP.z];
	const onPallet = affine(fp0, [1, 0, 0], [0, 0, 1], ([x, y, z]) => [x + ROOF_AT[0], y + ROOF_AT[1], z + ROOF_AT[2]]);
	transforms.awning = [onPallet, onPallet, still, awningDown()];
	const cp0: Point3 = [CARD.x, FOLD, CARD.z + CARD.t];
	const rise = CARD.half * Math.sin(Math.PI / 3);
	const tentBack = affine(cp0, [1, 0, 0], [0, 1, 0], turnX(FOLD, cp0[2], 60, [0, 0, rise]));
	const tentFront = affine(cp0, [1, 0, 0], [0, 1, 0], turnX(FOLD, cp0[2], -60, [0, 0, rise]));
	transforms.cardBack = [tentBack, still, still, still];
	transforms.cardFront = [tentFront, still, still, still];

	// the shutter rolls up into its box: a static window cut away above the box's floor
	const hole = [at([SH.x - 1, SH.y + SH.d + 0.5, LINTEL_Z]), at([SH.x + SH.w + 1, SH.y + SH.d + 0.5, LINTEL_Z]), at([SH.x + SH.w + 1, SH.y + SH.d + 0.5, 400]), at([SH.x - 1, SH.y + SH.d + 0.5, 400])];
	const clip = `<defs><clipPath id="build-new-shutter"><path clip-rule="evenodd" d="M-2000 -2000H3000V3000H-2000Z M${hole.map(([x, y]) => `${r1(x)} ${r1(y)}`).join('L')}Z"/></clipPath></defs>`;
	const plain = (name: string, body: string) => `<g class="mover plain" data-part="${name}" transform="${transforms[name][3]}">${body}</g>`;
	const last = (n: string) => transforms[n][3];

	const svg = k.figureSvg({
		width,
		height,
		label:
			'A market kiosk raised from a flat-pack kit. An empty paved plinth stands beside a delivery pallet loaded with a counter, a frame of two posts with a rolled-down shutter, and a roof carrying a folded awning and an OPEN sign. A folded sketch card stands on the plinth, then lies flat as chalk lines mark the footprint; the counter, posts and roof lift across onto the plinth, the awning swings down, the shutter rolls up and the sign lamp lights.',
		body: [
			clip,
			base(),
			lot(),
			pallet(),
			chalk(),
			plain('cardBack', cardHalf(false)),
			plain('cardFront', cardHalf(true)),
			moverSvg('counter', last('counter'), counter()),
			moverSvg('frame', last('frame'), frame()),
			`<g clip-path="url(#build-new-shutter)">${moverSvg('shutter', last('shutter'), shutter())}</g>`,
			moverSvg('roof', last('roof'), roof()),
			moverSvg('awning', last('awning'), awning()),
		],
	});
	return { svg, labels: LABELS, transforms };
}
