// Inks each plan in src/drawings/ into a Leonardo-style sheet: iron-gall line with a hand's wobble and a faint
// second pass, hatched shade, construction lines, pseudo-script in the margins, aged paper. Chrome draws it
// (librsvg lacks the filters), sharp saves src/assets/art/sheet-<name>.jpg for the plate engine to ink in again.
//   node scripts/sheets.ts [name ...]
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import sharp from 'sharp';
import type { Plan } from '../src/drawings/plan.ts';

const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PAPER = '#efe4cb';
const INK = '#3a2312';

function rng(seed: number) {
	return () => {
		seed = (seed + 0x6d2b79f5) | 0;
		let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/** Lines of wavy marks that read as handwriting at a glance and say nothing. */
function script(x: number, y: number, width: number, rows: number, rand: () => number) {
	let d = '';
	for (let r = 0; r < rows; r++) {
		let cx = x + rand() * 20;
		const end = x + width * (0.6 + rand() * 0.4);
		const cy = y + r * 22;
		d += `M${cx} ${cy}`;
		while (cx < end) {
			const step = 4 + rand() * 6;
			const tall = rand() < 0.18 ? 16 + rand() * 8 : 3 + rand() * 6; // an ascender now and then
			d += ` q${step * 0.2} ${-tall} ${step * 0.5} ${-tall * 0.4} t${step * 0.5} ${tall * 0.4}`;
			cx += step;
			if (rand() < 0.12) {
				cx += 9;
				d += ` m9 0`;
			}
		}
	}
	return d;
}

function sheet(plan: Plan, seed: number) {
	const { width: W, height: H } = plan;
	const [vx, vy, vw, vh] = plan.view ?? [0, 0, W, H];
	const rand = rng(seed);
	const by = (role: string) => plan.parts.filter((p) => p.role === role).map((p) => p.d).join(' ');
	const strokes = by('line') + ' ' + by('shade');
	const notes = [
		script(vx + 40, vy + 50, 300, 4, rand),
		script(vx + vw - 340, vy + 60, 290, 3, rand),
	].join(' ');
	const stains = Array.from({ length: 5 }, () => {
		const cx = vx + rand() * vw;
		const cy = vy + rand() * vh;
		return `<ellipse cx="${cx}" cy="${cy}" rx="${60 + rand() * 160}" ry="${40 + rand() * 120}" fill="url(#stain)"/>`;
	}).join('');

	return `<svg xmlns="http://www.w3.org/2000/svg" width="${vw}" height="${vh}" viewBox="${vx} ${vy} ${vw} ${vh}">
<defs>
	<filter id="grain" x="0" y="0" width="1" height="1">
		<feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" seed="${seed}"/>
		<feColorMatrix values="0 0 0 0 0.35  0 0 0 0 0.25  0 0 0 0 0.12  0 0 0 0.22 0"/>
	</filter>
	<filter id="mottle" x="0" y="0" width="1" height="1">
		<feTurbulence type="fractalNoise" baseFrequency="0.004" numOctaves="4" seed="${seed + 1}"/>
		<feColorMatrix values="0 0 0 0 0.45  0 0 0 0 0.33  0 0 0 0 0.16  0 0 0 0.35 -0.08"/>
	</filter>
	<radialGradient id="stain"><stop offset="0" stop-color="#9c7440" stop-opacity="0.12"/><stop offset="1" stop-color="#9c7440" stop-opacity="0"/></radialGradient>
	<radialGradient id="age" cx="0.5" cy="0.5" r="0.75"><stop offset="0.55" stop-color="#7a5a30" stop-opacity="0"/><stop offset="1" stop-color="#7a5a30" stop-opacity="0.32"/></radialGradient>
	<filter id="hand" x="-5%" y="-5%" width="110%" height="110%">
		<feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="2" seed="${seed + 2}" result="w"/>
		<feDisplacementMap in="SourceGraphic" in2="w" scale="4.5"/>
		<feGaussianBlur stdDeviation="0.35"/>
	</filter>
	<filter id="sketch" x="-5%" y="-5%" width="110%" height="110%">
		<feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="${seed + 3}" result="w"/>
		<feDisplacementMap in="SourceGraphic" in2="w" scale="7"/>
	</filter>
	<!-- Ink starves and pools along a stroke. -->
	<filter id="starve" x="0" y="0" width="1" height="1">
		<feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="2" seed="${seed + 4}" result="n"/>
		<feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1.6 -0.25" result="a"/>
		<feComposite in="SourceGraphic" in2="a" operator="in"/>
	</filter>
	<pattern id="cross" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(48)">
		<line x1="0" y1="0" x2="0" y2="9" stroke="${INK}" stroke-width="0.9" stroke-opacity="0.6"/>
	</pattern>
	<pattern id="hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(-38)">
		<line x1="0" y1="0" x2="0" y2="7" stroke="${INK}" stroke-width="1.05" stroke-opacity="0.75"/>
	</pattern>
</defs>
<rect x="${vx}" y="${vy}" width="${vw}" height="${vh}" fill="${PAPER}"/>
<rect x="${vx}" y="${vy}" width="${vw}" height="${vh}" filter="url(#mottle)"/>
${stains}
<g fill="none" stroke="${INK}" stroke-linecap="round" stroke-linejoin="round">
	<g filter="url(#hand)" stroke-width="1" stroke-opacity="0.32"><path d="${by('guide')}"/></g>
	<g filter="url(#hand)" stroke="none" fill="url(#hatch)" opacity="0.7"><path d="${by('shade')}"/></g>
	<g filter="url(#sketch)" stroke="none" fill="url(#cross)" opacity="0.4"><path d="${by('shade')}"/></g>
	<g filter="url(#sketch)" stroke-width="1.2" stroke-opacity="0.35" transform="translate(1.8 1.4)"><path d="${strokes}"/></g>
	<g filter="url(#hand)"><g filter="url(#starve)" stroke-width="2.7"><path d="${strokes}"/></g></g>
	<g filter="url(#hand)" stroke-width="1.3" stroke-opacity="0.8"><path d="${by('fine')}"/></g>
	<g filter="url(#sketch)" stroke-width="1.1" stroke-opacity="0.38"><path d="${notes}"/></g>
</g>
<rect x="${vx}" y="${vy}" width="${vw}" height="${vh}" filter="url(#grain)"/>
<rect x="${vx}" y="${vy}" width="${vw}" height="${vh}" fill="url(#age)"/>
</svg>`;
}

const names = process.argv.slice(2).length
	? process.argv.slice(2)
	: readdirSync('src/drawings').filter((f) => f.endsWith('.ts') && f !== 'plan.ts').map((f) => f.replace(/\.ts$/, ''));
const tmp = mkdtempSync(join(tmpdir(), 'sheets-'));
for (const [i, name] of names.entries()) {
	const { plan } = (await import(resolve(`src/drawings/${name}.ts`))) as { plan: Plan };
	const svgFile = join(tmp, `${name}.svg`);
	const png = join(tmp, `${name}.png`);
	writeFileSync(svgFile, sheet(plan, 11 + i * 7));
	execFileSync(CHROME, ['--headless', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1', `--window-size=${(plan.view ?? [0, 0, plan.width])[2]},${(plan.view ?? [0, 0, 0, plan.height])[3]}`, `--screenshot=${png}`, `file://${svgFile}`], { stdio: 'ignore' });
	const out = `src/assets/art/sheet-${name}.jpg`;
	const info = await sharp(png).resize(1400).jpeg({ quality: 82, mozjpeg: true }).toFile(out);
	console.log(`${out} ${info.width}x${info.height} ${Math.round(info.size / 1024)} KB`);
}
rmSync(tmp, { recursive: true, force: true });
