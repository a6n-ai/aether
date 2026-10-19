import type { APIRoute } from 'astro';
import globalCss from '../../styles/global.css?raw';
import anatomyCss from '../../styles/anatomy.css?raw';
import plateCss from '../../styles/plate.css?raw';
import { PLATES, machineOf, plateStyle, type PlateName } from '../../machines/registry';

// Each plate as a standalone SVG: styles and tokens embedded, so it renders correctly as a plain <img>.
const tokens = globalCss.match(/:root\s*\{([^}]*)\}/)![1];
const STYLE = `<style>svg.machine{${tokens}}${anatomyCss}${plateCss}</style>`;

export function getStaticPaths() {
	return Object.keys(PLATES).map((name) => ({ params: { name } }));
}

export const GET: APIRoute = ({ params }) => {
	const name = params.name as PlateName;
	const svg = machineOf(name)
		.svg.replace('class="iso-svg', `style="${plateStyle(name)}" class="iso machine iso-svg`)
		.replace(/(<svg[^>]*>)/, `$1${STYLE}`);
	return new Response(svg, { headers: { 'Content-Type': 'image/svg+xml' } });
};
