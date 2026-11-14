// The one world of the site: created once, kept across page swaps (World.astro persists its canvas).
import type { World } from './render.ts';

let world: World | null = null;
export const getWorld = (): World | null => world;
export const setWorld = (w: World | null) => { world = w; };
