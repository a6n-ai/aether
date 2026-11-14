// Old-master sheets that replace a plate's isometric machine. A plate whose name is here draws the sheet;
// the step labels and caption still come from the plate's machine module, verbatim.
import type { ImageMetadata } from 'astro';
import volano from '../assets/art/volano.jpg';

/** A point on the sheet as image uv (0-1, y down); r is the light's radius as a fraction of the sheet width. */
export type Spot = [x: number, y: number, r: number];

export type Drawing = {
	image: ImageMetadata;
	alt: string;
	/** Where the light rests at each step, in step order. */
	steps: Spot[];
	/** Where each step's margin note sits (uv, its left or right edge); defaults to beside the spot. */
	notes?: [x: number, y: number][];
	/** Numbered tags pinned to parts of the sheet, matched by data-key to a legend beside the plate. */
	keys?: [x: number, y: number][];
};

export const DRAWINGS: Partial<Record<string, Drawing>> = {
	// Measured on src/assets/art/volano.jpg (Volano (meccanica), 1920 px thumb resized to 1400x1314).
	system: {
		image: volano,
		alt: "Leonardo da Vinci's study of a flywheel: weights hang from many arms that all meet at one hub on a single shaft, which turns a great curved frame through a rope screw and gear.",
		steps: [
			[0.86, 0.53, 0.17], // your tools today: the separate weights, each on its own arm
			[0.45, 0.31, 0.13], // joined into one: every arm meets at the hub
			[0.46, 0.57, 0.3], // shaped around you: the curved frame built around the shaft
			[0.46, 0.68, 0.13], // running every day: the rope screw and gear that keep it turning
		],
		// Clear paper for each note: top right, above the hub, the left margin, under the gear.
		notes: [
			[0.97, 0.16],
			[0.55, 0.06],
			[0.03, 0.88],
			[0.62, 0.8],
		],
		keys: [
			[0.05, 0.58],
			[0.4, 0.4],
			[0.48, 0.585],
			[0.78, 0.47],
			[0.82, 0.6],
			[0.97, 0.55],
		],
	},
};
