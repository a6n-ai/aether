// Renders each built plate (dist/plates/*.svg) to a small webp poster in public/plates/posters/.
// The page shows the poster at once; the live SVG (200-400 KB) arrives as the plate nears the screen.
// librsvg can't resolve the plates' CSS variables, so Chrome draws them. Run after `npm run build`:
//   npm run build && npm run posters && npm run build
// check-site fails when a poster no longer matches its plate.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import sharp from 'sharp';

const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const SRC = 'dist/plates';
const OUT = 'public/plates/posters';
rmSync(OUT, { recursive: true, force: true }); // drop posters of plates that no longer exist
mkdirSync(OUT, { recursive: true });

const manifest: Record<string, string> = {};
for (const file of readdirSync(SRC).filter((f) => f.endsWith('.svg'))) {
	const name = file.replace(/\.svg$/, '');
	const svg = readFileSync(`${SRC}/${file}`, 'utf8');
	const [, , w, h] = svg.match(/viewBox="([^"]*)"/)![1].split(' ').map(Number);
	const png = resolve(`${OUT}/${name}.png`);
	execFileSync(CHROME, [
		'--headless',
		'--disable-gpu',
		'--hide-scrollbars',
		'--default-background-color=00000000',
		'--force-device-scale-factor=1',
		`--window-size=${w},${h}`,
		`--screenshot=${png}`,
		`file://${resolve(SRC, file)}`,
	], { stdio: 'ignore' });
	await sharp(png).webp({ quality: 60, alphaQuality: 60 }).toFile(`${OUT}/${name}.webp`);
	rmSync(png);
	manifest[name] = createHash('sha1').update(svg).digest('hex');
	console.log(name);
}
writeFileSync(`${OUT}/manifest.json`, JSON.stringify(manifest, null, '\t') + '\n');
