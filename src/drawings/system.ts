// Plate II as a flat plan (front elevation), in hairline style: single strokes, rounded parts, no words.
// The tools a business already has stand on one bench, each cabled to one hub, under a compass-drawn arch.
// scripts/sheets.ts inks it into a Leonardo-style sheet; data/drawings.ts measures against that sheet.
import { arc, box, circle, line, path, type Plan } from './plan.ts';

const W = 1400;
const H = 1120;
const BENCH = 780;

const bench = [
	box(120, BENCH, 1160, 30, 6, 'shade'),
	box(165, BENCH + 30, 34, 230, 4, 'shade'),
	box(1201, BENCH + 30, 34, 230, 4, 'shade'),
	line(199, 1000, 1201, 1000),
	line(199, 1012, 1201, 1012),
	// Measuring ticks along the bench front, every hand's width.
	...Array.from({ length: 23 }, (_, i) => line(150 + i * 50, BENCH + 30, 150 + i * 50, BENCH + (i % 2 ? 38 : 46), 'fine')),
];

// Customer app: a phone upright on a little stand.
const phone = [
	path('M168 780 L206 700 L222 700 L198 780', 'shade'),
	box(186, 588, 90, 182, 16),
	box(196, 606, 70, 144, 6),
	line(220, 597, 242, 597),
	circle(231, 759, 5),
];

// Website: a laptop, open, seen from the front.
const laptop = [
	box(345, 598, 200, 160, 9),
	box(357, 610, 176, 136, 4),
	path('M326 780 L338 760 L552 760 L564 780 Z', 'shade'),
	line(420, 770, 470, 770, 'fine'),
];

// The hub every cable runs to, with a flywheel on its face.
const hub = [
	box(610, 610, 180, 170, 14, 'shade'),
	circle(700, 680, 48),
	circle(700, 680, 11),
	...Array.from({ length: 6 }, (_, i) => {
		const a = (i * Math.PI) / 3;
		return line(700 + Math.cos(a) * 11, 680 + Math.sin(a) * 11, 700 + Math.cos(a) * 46, 680 + Math.sin(a) * 46);
	}),
	...[628, 648, 752, 772].map((x) => circle(x, 756, 6)),
];

// Messages: a sealed letter leaning on the hub.
const letter = [path('M792 780 L806 716 L866 728 L852 780 Z'), path('M806 716 L832 754 L866 728', 'fine')];

// Staff screen: a till with its drawer, pole and screen.
const till = [
	box(880, 700, 210, 80, 8, 'shade'),
	line(892, 738, 1078, 738),
	box(962, 752, 46, 10, 4),
	box(975, 628, 20, 72, 4),
	box(905, 540, 160, 92, 9),
	box(916, 551, 138, 70, 4),
];

// Payments: a card terminal with its keypad and a card half in the slot.
const terminal = [
	box(1140, 600, 82, 180, 18),
	box(1152, 614, 58, 50, 4),
	...Array.from({ length: 12 }, (_, i) => box(1154 + (i % 3) * 19, 680 + Math.floor(i / 3) * 21, 14, 14, 3, 'fine')),
	box(1158, 566, 46, 40, 4),
];

// Reports: a chart hung from the arch on two cords.
const report = [
	line(652, 446, 652, 476, 'fine'),
	line(748, 446, 748, 476, 'fine'),
	box(630, 476, 140, 96, 6),
	...[
		[648, 34],
		[676, 52],
		[704, 44],
		[732, 70],
	].map(([x, h]) => box(x, 560 - h, 18, h, 2, 'shade')),
	path('M646 520 L684 506 L712 512 L752 488', 'fine'),
];

// Every tool cabled into the hub, the cords sagging in front of the bench.
const cables = [
	path('M231 770 C 300 812, 540 812, 628 762'),
	path('M470 776 C 540 806, 600 806, 648 762'),
	path('M900 780 C 830 806, 790 806, 752 762'),
	path('M1180 780 C 1080 818, 860 818, 772 762'),
];

// Shaped around you: one compass arch over all of it, with its construction left in.
const arch = [
	arc(700, 1300, 860, 150, 1250),
	arc(700, 1300, 880, 136, 1264, 'fine'),
	circle(700, 1300, 6, 'guide'),
	line(700, 380, 700, 1060, 'guide'),
	circle(700, 680, 150, 'guide'),
	line(80, BENCH, 1320, BENCH, 'guide'),
];

export const plan: Plan = {
	width: W,
	height: H,
	view: [40, 330, 1320, 750],
	parts: [...arch, ...bench, ...cables, ...phone, ...laptop, ...hub, ...letter, ...till, ...terminal, ...report],
};
