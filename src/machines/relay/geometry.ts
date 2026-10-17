import * as k from '../../lib/anatomy/iso-kit';
import type { Plan, Plane, Point3 } from '../../lib/anatomy/iso-kit';
import { moverSvg, stepSvg, transformsFrom, type Machine } from '../../lib/plate';

export const LABELS = ['you send a message', 'kept safe', 'tried again if needed', 'it arrives'] as const;
export const CAPTION = 'Receipts, reminders and offers reach your customers. If a message fails to send, it is tried again automatically.';

const BASE: Plan = { x: -175, y: -90, w: 350, d: 180, r: 8 };
const BASE_H = 12;
const FOOT_H = 6;

const TOP = 16;
const LINE_Y = -10;
const SEND: Plane = [-140, LINE_Y];
const SAFE: Plan = { x: -80, y: LINE_Y - 17, w: 40, d: 34, r: 2 };
const SAFE_C: Plane = [-60, LINE_Y];
const LOOP: Plane = [30, LINE_Y];
const LOOP_R = 28;
const LOOP_SPOT: Plane = [30, LINE_Y - 22];
const RECV: Plane = [125, LINE_Y];
const PHONE_Y = -56;
const BYPASS_X = 78;
const BYPASS_Y = -52;

const ZERO: Point3 = [0, 0, 0];

export function relay(width = 720, height = 480): Machine {
	const P = k.fitProjection(
		[...k.boxCorners(BASE, -BASE_H - FOOT_H, 0), [SEND[0], PHONE_Y, 52], [RECV[0], PHONE_Y, 52], [RECV[0] + 16, LINE_Y + 16, 30]],
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
	const discHalo = ([cx, cy]: Plane, r: number, z: number, h: number) => halo({ x: cx - r, y: cy - r, w: r * 2, d: r * 2, r }, z, h);

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

	function phone([cx, cy]: Plane, lit: boolean) {
		const foot: Plan = { x: cx - 16, y: cy - 9, w: 32, d: 18, r: 2 };
		const out = [halo(foot, 0, 3)];
		out.push(S(k.slabOf(foot, 0, 3, P, 3, 0.5), { tone: 'mid' }));
		const body: Plan = { x: cx - 13, y: cy - 2.5, w: 26, d: 5, r: 2 };
		out.push(S(k.slabOf(body, 3, 46, P, 4, 0.6), { tone: 'mid' }));
		const front = body.y + body.d;
		const screen: Plan = { x: cx - 10, y: front, w: 20, d: 0.8, r: 0.5 };
		const glass = S(k.slabOf(screen, 12, 30, P, 2), { tone: 'hi', lit });
		out.push(lit ? stepSvg('lit-at', 4, glass) : glass);
		out.push(L(k.sideRing([cx, front, 7.4], 1.8, 'y', P, 14), { tone: 'lo' }));
		out.push(L(k.segment([cx - 3, front, 45.6], [cx + 3, front, 45.6], P), { tone: 'lo' }));
		out.push(D([at([cx - 6, front, 47.2]), at([cx + 6, front, 47.2])], { size: 0.4 }));
		return out.join('');
	}

	const WIDTHS = [6.6, 10.4, 11.8, 11.8, 10.4, 6.6];
	function pipeX(x0: number, x1: number, y = LINE_Y) {
		const out = WIDTHS.map((w, i) => S(k.slabOf({ x: x0, y: y - w / 2, w: x1 - x0, d: w, r: 0.4 }, i * 2, 2, P, 2, i === 5 ? 0.3 : 0), { tone: 'mid', crease: 'none' }));
		const band = (x: number) => S(k.slabOf({ x: x - 1.4, y: y - 6.8, w: 2.8, d: 13.6, r: 1 }, 0, 12.8, P, 2, 0.3), { tone: 'lo' });
		out.push(band(x0 + 1.4), band(x1 - 1.4));
		if (x1 - x0 > 50) out.push(band((x0 + x1) / 2));
		return out.join('');
	}
	function pipeY(y0: number, y1: number, x: number) {
		const out = WIDTHS.map((w, i) => S(k.slabOf({ x: x - w / 2, y: y0, w, d: y1 - y0, r: 0.4 }, i * 2, 2, P, 2, i === 5 ? 0.3 : 0), { tone: 'mid', crease: 'none' }));
		const band = (y: number) => S(k.slabOf({ x: x - 6.8, y: y - 1.4, w: 13.6, d: 2.8, r: 1 }, 0, 12.8, P, 2, 0.3), { tone: 'lo' });
		out.push(band(y0 + 1.4), band(y1 - 1.4));
		return out.join('');
	}
	function elbow([cx, cy]: Plane) {
		return S(k.cylinder(cx, cy, 8, 0, 12, P, 28, 0.5), { tone: 'mid' }) + L(k.sideArc(cx, cy, 8, 6, P, 20), { tone: 'faint' }) + L(k.ring(cx, cy, 5, 12, P, 20), { tone: 'lo' }) + D([at([cx, cy, 12])], { size: 0.45 });
	}

	function pedestal([cx, cy]: Plane) {
		const out = [discHalo([cx, cy], 16, 0, TOP)];
		out.push(S(k.cylinder(cx, cy, 16, 0, 3, P, 40), { tone: 'lo' }));
		out.push(S(k.cylinder(cx, cy, 14, 3, TOP - 3, P, 40, 0.6), { tone: 'mid' }));
		out.push(L(k.sideArc(cx, cy, 14, 9, P, 24), { tone: 'faint' }));
		out.push(L(k.ring(cx, cy, 11, TOP, P, 32), { tone: 'lo' }));
		out.push(L(k.ring(cx, cy, 8.6, TOP, P, 28), { tone: 'faint' }));
		out.push(D([at([cx - 12.6, cy, TOP]), at([cx + 12.6, cy, TOP]), at([cx, cy - 12.6, TOP]), at([cx, cy + 12.6, TOP])], { size: 0.4 }));
		return out.join('');
	}

	function safe() {
		const out = [halo(SAFE, 0, TOP)];
		out.push(S(k.slabOf(SAFE, 0, TOP, P, 3, 0.8), { tone: 'mid', inner: L(k.sideSeam(SAFE, 11, P, 3), { tone: 'faint' }) + L(k.sideSeam(SAFE, 3, P, 3), { tone: 'faint' }) }));
		out.push(L(k.ring(SAFE_C[0], SAFE_C[1], 9.6, TOP, P, 32), { tone: 'lo' }));
		out.push(L(k.ring(SAFE_C[0], SAFE_C[1], 7.4, TOP, P, 28), { tone: 'faint' }));
		for (const x of [-72, -48]) {
			out.push(S(k.cylinder(x, SAFE_C[1] - 11, 2, TOP, 1.4, P, 12), { tone: 'hi' }));
			out.push(S(k.cylinder(x, SAFE_C[1] + 11, 2, TOP, 1.4, P, 12), { tone: 'hi' }));
		}
		const front = SAFE.y + SAFE.d;
		const lock: Plan = { x: SAFE_C[0] - 6, y: front, w: 12, d: 3, r: 1 };
		out.push(S(k.slabOf(lock, 3, 7, P, 2, 0.3), { tone: 'hi' }));
		out.push(L(k.sideRing([SAFE_C[0], front + 3, 10], 3.4, 'y', P, 18), { tone: 'mid' }));
		out.push(D([at([SAFE_C[0], front + 3, 6.5])], { size: 0.5 }));
		const right = SAFE.x + SAFE.w;
		out.push(L(k.sideRing([right, LINE_Y, 8], 5, 'x', P, 24), { tone: 'lo' }));
		out.push(L(k.sideRing([right, LINE_Y, 8], 2.6, 'x', P, 18), { tone: 'mid' }));
		out.push(D([at([right, LINE_Y, 8])], { size: 0.5 }));
		return out.join('');
	}

	function loop() {
		const [cx, cy] = LOOP;
		const out = [discHalo(LOOP, LOOP_R + 1, 0, TOP)];
		out.push(S(k.cylinder(cx, cy, LOOP_R + 2, 0, 3, P, 72), { tone: 'lo' }));
		out.push(S(k.cylinder(cx, cy, LOOP_R, 3, TOP - 3, P, 72, 0.8), { tone: 'mid' }));
		out.push(L(k.sideArc(cx, cy, LOOP_R, 9, P, 40), { tone: 'faint' }));
		out.push(L(k.ring(cx, cy, 26.4, TOP, P, 64), { tone: 'lo' }));
		out.push(L(k.ring(cx, cy, 22, TOP, P, 56), { tone: 'faint' }));
		out.push(S(k.cylinder(cx, cy, 15, TOP, 5, P, 40, 0.6), { tone: 'hi' }));
		out.push(L(k.knurl(cx, cy, 15, TOP, TOP + 5, 32, P, 0.3), { tone: 'lo' }));
		out.push(L(k.ring(cx, cy, 10, TOP + 5, P, 32), { tone: 'mid' }));
		out.push(S(k.cylinder(cx, cy, 3.4, TOP + 5, 2, P, 16), { tone: 'mid' }));
		out.push(D([at([cx, cy, TOP + 7])], { size: 0.55, tone: 'hi' }));
		for (const a of [0.3, 1.2, 2.1, 3.0, 3.9, 4.8, 5.7]) out.push(D([at([cx + Math.cos(a) * 18.6, cy + Math.sin(a) * 18.6, TOP])], { size: 0.35 }));
		return out.join('');
	}

	function capsule([cx, cy]: Plane, TOP = 16) {
		const out = [discHalo([cx, cy], 8, TOP, 0.1)];
		out.push(S(k.cylinder(cx, cy, 5.8, TOP, 11, P, 28, 0.4), { tone: 'hi' }));
		out.push(L(k.sideArc(cx, cy, 5.8, TOP + 3, P, 20), { tone: 'mid' }));
		out.push(L(k.sideArc(cx, cy, 5.8, TOP + 8, P, 20), { tone: 'mid' }));
		out.push(S(k.cylinder(cx, cy, 4.6, TOP + 11, 2.4, P, 24), { tone: 'hi' }));
		out.push(S(k.cylinder(cx, cy, 2.8, TOP + 13.4, 1.6, P, 18), { tone: 'hi' }));
		out.push(D([at([cx, cy, TOP + 15])], { size: 0.5, tone: 'mid' }));
		return out.join('');
	}

	function letters() {
		const tray: Plan = { x: -150, y: 24, w: 56, d: 36, r: 2 };
		const out = [halo(tray, 0, 5)];
		out.push(S(k.slabOf(tray, 0, 5, P, 3, 0.6), { tone: 'mid', inner: L(k.sideSeam(tray, 2, P, 3), { tone: 'faint' }) }));
		[[-146, 28, 0], [-142, 30, 1.4], [-146, 32, 2.8]].forEach(([x, y, z]) => {
			const env: Plan = { x, y, w: 36, d: 24, r: 1 };
			out.push(S(k.slabOf(env, 5 + z, 1.4, P, 2, 0.3), { tone: 'hi' }));
		});
		const top = 5 + 4.2;
		out.push(L(k.lineOnTop([-146 + 1, 32 + 1], [-146 + 18, 32 + 12], top, P) + k.lineOnTop([-146 + 18, 32 + 12], [-146 + 35, 32 + 1], top, P), { tone: 'mid' }));
		out.push(D([at([tray.x + 3, tray.y + 3, 5]), at([tray.x + tray.w - 3, tray.y + tray.d - 3, 5])], { size: 0.4 }));
		return out.join('');
	}
	function spares() {
		const rack: Plan = { x: -26, y: 34, w: 52, d: 22, r: 2 };
		const out = [halo(rack, 0, 6)];
		out.push(S(k.slabOf(rack, 0, 6, P, 3, 0.6), { tone: 'mid' }));
		for (const x of [-14, 0, 14]) {
			out.push(L(k.ring(x, 45, 7.4, 6, P, 24), { tone: 'faint' }));
			out.push(capsule([x, 45], 6));
		}
		return out.join('');
	}

	const transforms = transformsFrom(P, {
		capsule: [ZERO, [SAFE_C[0] - SEND[0], 0, 0], [LOOP_SPOT[0] - SEND[0], LOOP_SPOT[1] - SEND[1], 0], [RECV[0] - SEND[0], 0, 0]],
	});

	const svg = k.figureSvg({
		width,
		height,
		label:
			'A tube post set on a workbench: a phone on the left, a capsule standing on its sending station, a lock box where it rests safely, a round loop where it can go round again, and a receiving station beside a second phone whose screen lights when the capsule arrives. A message sent from one phone reaches the other, and if it fails it simply goes round again.',
		body: [
			base(),
			letters(),
			spares(),
			phone([SEND[0], PHONE_Y], false),
			pedestal(SEND),
			pipeX(SEND[0] + 16, SAFE.x),
			safe(),
			pipeX(SAFE.x + SAFE.w, LOOP[0] - LOOP_R),
			pipeY(BYPASS_Y, LINE_Y, BYPASS_X),
			elbow([BYPASS_X, BYPASS_Y]),
			pipeX(LOOP[0], BYPASS_X, BYPASS_Y),
			pipeY(BYPASS_Y, LINE_Y - LOOP_R + 2, LOOP[0]),
			elbow([LOOP[0], BYPASS_Y]),
			loop(),
			pipeX(LOOP[0] + LOOP_R, RECV[0] - 16),
			elbow([BYPASS_X, LINE_Y]),
			phone([RECV[0], PHONE_Y], true),
			pedestal(RECV),
			moverSvg('capsule', transforms.capsule[3], capsule(SEND)),
		],
	});
	return { svg, labels: LABELS, transforms };
}
