// A plan is flat geometry in one stroke weight. Each part carries a role the ink pass reads:
// 'line' is the drawing, 'shade' also gets hatching, 'fine' is a lighter line, 'guide' a faint construction line.
export type Role = 'line' | 'shade' | 'fine' | 'guide';
export type Part = { d: string; role: Role };
/** view: the crop the sheet keeps, [x, y, width, height]; the whole plan when absent. */
export type Plan = { width: number; height: number; view?: [number, number, number, number]; parts: Part[] };

export const path = (d: string, role: Role = 'line'): Part => ({ d, role });

export const line = (x1: number, y1: number, x2: number, y2: number, role: Role = 'line'): Part =>
	path(`M${x1} ${y1} L${x2} ${y2}`, role);

export const circle = (cx: number, cy: number, r: number, role: Role = 'line'): Part =>
	path(`M${cx - r} ${cy} a${r} ${r} 0 1 0 ${r * 2} 0 a${r} ${r} 0 1 0 ${-r * 2} 0`, role);

/** A rounded rectangle from its top-left corner. */
export const box = (x: number, y: number, w: number, h: number, r: number, role: Role = 'line'): Part =>
	path(
		`M${x + r} ${y} H${x + w - r} Q${x + w} ${y} ${x + w} ${y + r} V${y + h - r} Q${x + w} ${y + h} ${x + w - r} ${y + h} H${x + r} Q${x} ${y + h} ${x} ${y + h - r} V${y + r} Q${x} ${y} ${x + r} ${y} Z`,
		role,
	);

/** The upper arc of a circle centred at (cx, cy), between two x positions. */
export const arc = (cx: number, cy: number, r: number, x1: number, x2: number, role: Role = 'line'): Part => {
	const y = (x: number) => cy - Math.sqrt(r * r - (x - cx) ** 2);
	return path(`M${x1} ${y(x1)} A${r} ${r} 0 0 1 ${x2} ${y(x2)}`, role);
};
