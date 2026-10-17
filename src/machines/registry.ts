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
	system: { build: system, pigment: 'var(--umber)' },
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
} satisfies Record<string, { build: () => Machine; pigment: string }>;

export type PlateName = keyof typeof PLATES;

const built = new Map<PlateName, Machine>();
/** Geometry is pure and costly: build each plate once per build. */
export function machineOf(name: PlateName): Machine {
	if (!built.has(name)) built.set(name, PLATES[name].build());
	return built.get(name)!;
}
