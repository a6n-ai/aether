// Drawn sheets that replace a plate's isometric machine: anidoodle blueprints and chalkboards
// (aether-art/), or ink sheets from scripts/sheets.ts. A plate whose name is here draws the sheet;
// the step labels and caption still come from the plate's machine module, verbatim.
import type { ImageMetadata } from 'astro';
import system from '../assets/art/sheet-system.jpg';
import team from '../assets/art/sheet-team.jpg';

/** A point on the sheet as image uv (0-1, y down); r is the light's radius as a fraction of the sheet width. */
export type Spot = [x: number, y: number, r: number];

export type Drawing = {
	image: ImageMetadata;
	/** The hand the sheet is drawn in; sets the colours of the tour drawn over it. */
	medium: 'ink' | 'blueprint' | 'chalk';
	/** A film of the sheet being drawn (public/plates/films/<film>.mp4), whose last frame is `image`. */
	film?: string;
	alt: string;
	/** Where the light rests at each step, in step order. */
	steps: Spot[];
	/** Where each step's margin note sits (uv, its left or right edge); defaults to beside the spot. */
	notes?: [x: number, y: number][];
	/** Numbered tags pinned to parts of the sheet, matched by data-key to a legend beside the plate. */
	keys?: [x: number, y: number][];
};

export const DRAWINGS: Partial<Record<string, Drawing>> = {
	// Drawn by anidoodle (aether-art/src/canvas-core/plateSystem.ts, 1400x900); u = x / 1400, v = y / 900.
	system: {
		image: system,
		medium: 'blueprint',
		film: 'system',
		alt: 'A cyanotype blueprint, front elevation: a phone, a laptop, a till and a card terminal stand on one workbench, each cabled to a single hub drawn in section with a flywheel on its face, under a compass-struck arch with a sales chart hung from it. Balloons number the six parts.',
		steps: [
			[0.243, 0.422, 0.17], // your tools today: the phone and laptop, each on its own
			[0.5, 0.439, 0.1], // joined into one: every cable runs into the hub
			[0.5, 0.2, 0.4], // shaped around you: the arch struck round the whole bench
			[0.5, 0.422, 0.05], // running every day: the flywheel on the hub
		],
		// A margin list in the clear sheet between the bench legs.
		notes: [
			[0.2, 0.6],
			[0.2, 0.66],
			[0.2, 0.72],
			[0.2, 0.78],
		],
		// On the sheet's own balloons, in WhoWeAre's legend order.
		keys: [
			[0.318, 0.289],
			[0.107, 0.289],
			[0.901, 0.289],
			[0.636, 0.433],
			[0.704, 0.228],
			[0.421, 0.167],
		],
	},
	// Chalkboard (aether-art/src/canvas-core/chalkTeam.ts, 1200x800); u = x / 1200, v = y / 800.
	// The board writes each step's label and arrow itself, so only the light tours it.
	team: {
		image: team,
		medium: 'chalk',
		film: 'team',
		alt: "A chalkboard lesson titled Your own team: a shop with a striped awning, and inside its window our bench with one of us at a laptop, ringed in blue; an arrow out to a spanner, sparks and a tick, fixed on the spot; an arrow down to two people side by side, hand in hand, ringed in pink: one team, yours.",
		steps: [
			[0.329, 0.5625, 0.22], // your shop
			[0.2625, 0.55, 0.13], // our bench inside it
			[0.733, 0.4125, 0.15], // fixed on the spot
			[0.758, 0.7625, 0.12], // one team, yours
		],
	},
};
