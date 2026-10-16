import { translateAlong } from './anatomy/iso-kit';
import type { Point3, Projection } from './anatomy/iso-kit';

/**
 * A plate: one Anatomy machine that tells a story in steps.
 * - `svg` is drawn at the LAST step, so no-JS and reduced-motion readers see the finished story.
 * - Movers are `<g class="mover" data-part="name">`; `transforms[name][i]` is their transform at step i+1.
 * - Parts with `data-at="N"` and class `lit-at`, `show-from` or `dim-from` get `.on` from step N.
 */
export interface Machine {
	svg: string;
	labels: readonly string[];
	transforms: Record<string, string[]>;
}

/** Transforms for each mover at each step, from world-space offsets (relative to where the part was drawn). */
export function transformsFrom(P: Projection, offsets: Record<string, Point3[]>): Record<string, string[]> {
	return Object.fromEntries(Object.entries(offsets).map(([name, steps]) => [name, steps.map((o) => translateAlong(P, o))]));
}

/** `<g>` for a moving ingredient, drawn at its rest position and placed at its final step. */
export function moverSvg(name: string, finalTransform: string, body: string) {
	return `<g class="mover" data-part="${name}" transform="${finalTransform}">${body}</g>`;
}

/** `<g>` that switches state at step `at`: `kind` is lit-at, show-from or dim-from. Drawn in its final (on) state. */
export function stepSvg(kind: 'lit-at' | 'show-from' | 'dim-from', at: number, body: string) {
	return `<g class="${kind} on" data-at="${at}">${body}</g>`;
}
