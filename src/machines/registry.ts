import type { Machine } from '../lib/plate';
import { system } from './system/geometry';
import { team } from './team/geometry';
import { workbench } from './workbench/geometry';
import { buildNew } from './build-new/geometry';
import { moveOver } from './move-over/geometry';
import { runGrow } from './run-grow/geometry';
import { relay } from './relay/geometry';
import { buildProcess } from './build-process/geometry';
import { tiffingrab } from './tiffingrab/geometry';
import { puchkaman } from './puchkaman/geometry';
import { xplorers } from './xplorers/geometry';
import { copperCloves } from './copper-cloves/geometry';

/** Every plate on the site: how to draw it and its pigment. The page and /plates/<name>.svg both read this. */
export const PLATES = {
	system: { build: system, pigment: 'var(--stone)', tinted: true },
	team: { build: team, pigment: 'var(--umber)' },
	workbench: { build: workbench, pigment: 'var(--umber)' },
	'build-new': { build: buildNew, pigment: 'var(--umber)' },
	'move-over': { build: moveOver, pigment: 'var(--umber)' },
	'run-grow': { build: runGrow, pigment: 'var(--umber)' },
	relay: { build: relay, pigment: 'var(--violet)' },
	'build-process': { build: buildProcess, pigment: 'var(--umber)' },
	tiffingrab: { build: tiffingrab, pigment: 'var(--ochre)' },
	puchkaman: { build: puchkaman, pigment: 'var(--verdigris)' },
	xplorers: { build: xplorers, pigment: 'var(--lapis)' },
	'copper-cloves': { build: copperCloves, pigment: 'var(--sanguine)' },
} satisfies Record<string, { build: () => Machine; pigment: string; tinted?: boolean }>;

export type PlateName = keyof typeof PLATES;

const PALETTE = ['var(--lapis)', 'var(--ochre)', 'var(--verdigris)', 'var(--violet)', 'var(--sanguine)', 'var(--umber)'];

/** Each moving ingredient takes its own fresco pigment, so the parts of a story read apart. Plates that colour their own parts opt out. */
function tint(name: PlateName, svg: string) {
	const plate: { pigment: string; tinted?: boolean } = PLATES[name];
	if (plate.tinted) return svg;
	const accents = PALETTE.filter((c) => c !== plate.pigment);
	const order: string[] = [];
	return svg.replace(/<g class="mover" data-part="([^"]+)"/g, (_, part: string) => {
		if (!order.includes(part)) order.push(part);
		return `<g class="mover tint" style="--pigment:${accents[order.indexOf(part) % accents.length]}" data-part="${part}"`;
	});
}

const built = new Map<PlateName, Machine>();
/** Geometry is pure and costly: build each plate once per build. */
export function machineOf(name: PlateName): Machine {
	if (!built.has(name)) {
		const m = PLATES[name].build();
		built.set(name, { ...m, svg: tint(name, m.svg) });
	}
	return built.get(name)!;
}
