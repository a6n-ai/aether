// Drawn sheets that replace a plate's isometric machine: anidoodle films in Leonardo's manner, sepia
// drafting with washes (ink) or red, black and white chalk on toned paper (chalk), from art/anidoodle/.
// The step labels and caption still come from the plate's machine module, verbatim.
import type { ImageMetadata } from 'astro';
import system from '../assets/art/sheet-system.jpg';
import team from '../assets/art/sheet-team.jpg';
import buildNew from '../assets/art/sheet-build-new.jpg';
import moveOver from '../assets/art/sheet-move-over.jpg';
import runGrow from '../assets/art/sheet-run-grow.jpg';

/** A point on the sheet as image uv (0-1, y down); r is the light's radius as a fraction of the sheet width. */
export type Spot = [x: number, y: number, r: number];

export type Drawing = {
	image: ImageMetadata;
	/** The hand the sheet is drawn in; sets the colours of the tour drawn over it. */
	medium: 'ink' | 'chalk';
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
	// Drawn by anidoodle (art/anidoodle/plateSystem.ts on leoKit, 1400x900); u = x / 1400, v = y / 900.
	system: {
		image: system,
		medium: 'ink',
		film: 'system',
		alt: 'A sepia drafting sheet in the manner of Leonardo, front elevation, washed in ochre, verdigris and red chalk: a phone, a laptop, a till and a card terminal stand on one workbench, each cabled to a single hub drawn in section with a flywheel on its face, under a compass-struck arch with a sales chart hung from it. Balloons number the six parts.',
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
	// Red, black and white chalk on toned paper (art/anidoodle/chalkTeam.ts, 1200x800); u = x / 1200, v = y / 800.
	// The sheet writes each step's label and arrow itself, so only the light tours it.
	team: {
		image: team,
		medium: 'chalk',
		film: 'team',
		alt: "A chalk drawing on toned paper titled Your own team: a shop with a striped awning, and inside its window our bench with one of us at a laptop, ringed in green; an arrow out to a spanner, sparks and a tick, fixed on the spot; an arrow down to two people side by side, hand in hand, ringed in black chalk: one team, yours.",
		steps: [
			[0.329, 0.5625, 0.22], // your shop
			[0.2625, 0.55, 0.13], // our bench inside it
			[0.733, 0.4125, 0.15], // fixed on the spot
			[0.758, 0.7625, 0.12], // one team, yours
		],
	},
	// "Start where you are": three chalk sheets in one 2x2 layout (art/anidoodle/chalkTracks.ts, 1200x800),
	// a scene per step read left to right then down; the light visits the four quarters in turn.
	'build-new': {
		image: buildNew,
		medium: 'chalk',
		film: 'build-new',
		alt: 'A chalk drawing in four scenes: a lit bulb, your idea; the kiosk sketched on a sheet with a pencil, drawn up; boxes and a gear, built from parts; the finished kiosk with its striped awning and OPEN sign, a customer at the counter, open for customers.',
		steps: [
			[0.25, 0.3375, 0.2],
			[0.75, 0.3375, 0.2],
			[0.25, 0.75, 0.2],
			[0.75, 0.75, 0.2],
		],
	},
	'move-over': {
		image: moveOver,
		medium: 'chalk',
		film: 'move-over',
		alt: 'A chalk drawing in four scenes: a pile of papers and a spreadsheet grid; papers dropping into a hopper, fed in; a phone with neat rows, sorted into your app; a balance standing level, the papers on one pan and the phone on the other, nothing lost.',
		steps: [
			[0.25, 0.3375, 0.2],
			[0.75, 0.3375, 0.2],
			[0.25, 0.75, 0.2],
			[0.75, 0.75, 0.2],
		],
	},
	'run-grow': {
		image: runGrow,
		medium: 'chalk',
		film: 'run-grow',
		alt: 'A chalk drawing in four scenes: the kiosk open, your app running; a month with every day ticked, checked every day; a spanner, an arrow up and a star, fixed and improved; the kiosk with a new wing beside it and a plant growing, grows with you.',
		steps: [
			[0.25, 0.3375, 0.2],
			[0.75, 0.3375, 0.2],
			[0.25, 0.75, 0.2],
			[0.75, 0.75, 0.2],
		],
	},
};
