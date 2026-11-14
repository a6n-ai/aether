// Ink sheets that replace a plate's isometric machine (drawn by scripts/sheets.ts from src/drawings/). A plate whose name is here draws the sheet;
// the step labels and caption still come from the plate's machine module, verbatim.
import type { ImageMetadata } from 'astro';
import system from '../assets/art/sheet-system.jpg';

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
	// Measured from the plan (src/drawings/system.ts): u = (x - 40) / 1320, v = (y - 330) / 750.
	system: {
		image: system,
		alt: 'A pen-and-ink plan in the manner of Leonardo: a phone, a laptop, a till and a card terminal stand on one workbench, each cabled to a single hub with a flywheel on its face, under a compass-drawn arch with a sales chart hanging from it.',
		steps: [
			[0.227, 0.467, 0.2], // your tools today: the phone and laptop, each on its own
			[0.5, 0.487, 0.11], // joined into one: every cable runs into the hub
			[0.5, 0.2, 0.42], // shaped around you: the arch drawn around the whole bench
			[0.5, 0.467, 0.06], // running every day: the flywheel on the hub
		],
		// Clear paper under the bench and above the arch.
		notes: [
			[0.14, 0.73],
			[0.56, 0.73],
			[0.53, 0.05],
			[0.56, 0.85],
		],
		// Website, customer app, payments, messages, staff screen, reports (WhoWeAre's legend order).
		keys: [
			[0.307, 0.464],
			[0.145, 0.465],
			[0.864, 0.412],
			[0.598, 0.557],
			[0.716, 0.341],
			[0.5, 0.227],
		],
	},
};
