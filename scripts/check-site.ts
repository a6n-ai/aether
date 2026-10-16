import { readFileSync, existsSync, statSync } from 'node:fs';

const failures: string[] = [];
const check = (ok: boolean, message: string) => {
	if (!ok) failures.push(message);
};

const file = 'dist/index.html';
if (!existsSync(file)) {
	console.error(`FAIL: ${file} missing, run npm run build first`);
	process.exit(1);
}
const html = readFileSync(file, 'utf8');
const markup = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, '');
const ariaLabels = [...markup.matchAll(/aria-label="([^"]*)"/g)].map((m) => m[1]);
const visible = markup.replace(/<[^>]+>/g, ' ') + ' ' + ariaLabels.join(' ');

const BANNED = ['API', 'LLM', 'agentic', 'platform', 'SaaS', 'stack', 'integration', 'backend', 'webhook', 'AI-powered', 'Realm', 'Aether'];
for (const word of BANNED) {
	check(!new RegExp(`\\b${word}\\b`, 'i').test(visible), `banned word in copy: ${word}`);
}
check(/href="mailto:hi@a6n\.ai\?subject=Book%20a%20call/.test(markup), 'no Book a call mailto link');
check((markup.match(/<h1[\s>]/g) ?? []).length === 1, 'expected exactly one <h1>');
check(/<html[^>]*lang="en"/.test(html), 'missing <html lang="en">');

const heroImg = markup.match(/<img[^>]*fetchpriority="high"[^>]*>/)?.[0] ?? '';
check(/alt="[^"]*Creation of Adam[^"]*"/.test(heroImg), 'hero <img> needs fetchpriority="high" and alt mentioning Creation of Adam');
const heroPicture = markup.match(/<picture[^>]*>[\s\S]*?fetchpriority="high"[\s\S]*?<\/picture>/)?.[0] ?? '';
check(/srcset="[^"]*\.(avif|webp)/.test(heroPicture), 'hero must be served as avif/webp');
const avif = heroPicture.match(/<source[^>]*srcset="([^"]+)"[^>]*type="image\/avif"/)?.[1] ?? '';
const at800 = avif.split(',').map((s) => s.trim().split(' ')).find(([, w]) => w === '800w')?.[0];
if (at800) {
	const path = 'dist' + decodeURIComponent(at800.split('?')[0]);
	const kb = existsSync(path) ? statSync(path).size / 1024 : Infinity;
	check(kb <= 180, `hero 800w avif is ${kb.toFixed(0)} KB, limit 180`);
} else check(false, 'hero has no 800w avif candidate');

const plate = markup.match(/<figure[^>]*data-machine="workbench"[\s\S]*?<\/figure>/)?.[0] ?? '';
check(plate !== '', 'missing workbench figure');
const svgLabel = plate.match(/<svg[^>]*role="img"[^>]*aria-label="([^"]*)"/)?.[1] ?? '';
check(svgLabel.length >= 60, 'workbench svg needs role="img" and a 60+ char aria-label');
const STEP_LABELS = ['parts that already work', 'pick what you need', 'fitted to your business', 'your app, open for customers'];
const stepTexts = [...plate.matchAll(/<li[^>]*data-step="\d"[^>]*>([\s\S]*?)<\/li>/g)].map((m) => m[1].replace(/<[^>]+>/g, '').trim());
check(JSON.stringify(stepTexts) === JSON.stringify(STEP_LABELS), `workbench step labels wrong: ${JSON.stringify(stepTexts)}`);
check(
	plate.includes("We don't start from a blank page. Your app is put together from parts already running for other businesses, then shaped around yours.") ||
		plate.includes('We don&#39;t start from a blank page. Your app is put together from parts already running for other businesses, then shaped around yours.'),
	'workbench caption missing',
);

const css = [...html.matchAll(/href="(\/_astro\/[^"]+\.css)"/g)].map((m) => readFileSync('dist' + m[1], 'utf8')).join('') + html;
check(/color-scheme:\s*light/.test(css), 'page must set color-scheme: light');
for (const client of ['TiffinGrab', 'Puchkaman', 'Xplorers', 'Copper + Cloves']) {
	check(markup.includes(client), `missing client card: ${client}`);
}
const order = ['data-machine="workbench"', 'data-section="clients"', 'Tell us about your business.'].map((s) => markup.indexOf(s));
check(order.every((i, n) => i > 0 && (n === 0 || i > order[n - 1])), 'clients section must sit after the workshop and before the closing call');
check(markup.includes('Tell us about your business.'), 'missing closing call heading');

if (failures.length) {
	for (const f of failures) console.error(`FAIL: ${f}`);
	process.exit(1);
}
console.log('check-site: all passed');
