// The stills each world place shows once it has drawn itself (src/assets/world, rendered by art/anidoodle).
import type { ImageMetadata } from 'astro';
const files = import.meta.glob<{ default: ImageMetadata }>('../assets/world/*.jpg', { eager: true });
export const STILLS: Record<string, ImageMetadata> = Object.fromEntries(
	Object.entries(files).map(([path, m]) => [path.split('/').pop()!.replace(/\.jpg$/, ''), m.default]),
);
