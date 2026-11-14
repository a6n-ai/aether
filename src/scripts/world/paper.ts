// The world paper's foxing: the same scattered spots on every visit (a seeded scatter, no Math.random).
const frac = (v: number) => v - Math.floor(v);
export const foxing = (n: number, w: number, h: number): [number, number, number][] =>
	Array.from({ length: n }, (_, i) => {
		const s = Math.sin(i * 12.9898) * 43758.5453, t = Math.sin(i * 78.233) * 12345.678;
		return [frac(s) * w, frac(t) * h, 8 + frac(s * 7) * 40];
	});
