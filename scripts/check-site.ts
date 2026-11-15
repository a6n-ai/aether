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

const BANNED = ['API', 'LLM', 'agentic', 'platform', 'SaaS', 'tech stack', 'integration', 'backend', 'webhook', 'AI-powered', 'AI-native', 'Realm', 'Aether'];
const PAGES = ['index.html', 'how-it-works/index.html', ...['tiffingrab', 'puchkaman', 'xplorers', 'copper-cloves'].map((s) => `clients/${s}/index.html`)];
for (const page of PAGES) {
	const path = `dist/${page}`;
	if (!existsSync(path)) {
		check(false, `${page} missing`);
		continue;
	}
	const raw = readFileSync(path, 'utf8');
	const body = raw.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, '');
	const text = body.replace(/<[^>]+>/g, ' ') + ' ' + [...body.matchAll(/aria-label="([^"]*)"/g)].map((m) => m[1]).join(' ');
	for (const word of BANNED) check(!new RegExp(`\\b${word}\\b`, 'i').test(text), `${page}: banned word in copy: ${word}`);
	check(/href="mailto:hi@a6n\.ai\?subject=Book%20a%20call/.test(body), `${page}: no Book a call mailto link`);
	check((body.match(/<h1[\s>]/g) ?? []).length === 1, `${page}: expected exactly one <h1>`);
	check(/<html[^>]*lang="en"/.test(raw), `${page}: missing <html lang="en">`);
	// every page is a place on the one sheet: the world canvas, and its stops with real words beside them
	check(/<canvas[^>]*class="world"/.test(raw), `${page}: missing the world canvas`);
	check(/data-stop="[^"]+"/.test(body), `${page}: no stops`);
	for (const img of body.matchAll(/<img[^>]*class="still"[^>]*>/g)) check((img[0].match(/alt="([^"]*)"/)?.[1] ?? '').length >= 40, `${page}: a stop's still needs a 40+ char alt`);
	for (const phrase of ['until it arrives', 'bookings, delivery and messages are parts']) {
		check(!text.includes(phrase), `${page}: overpromising copy: "${phrase}"`);
	}
}
check(/What is a6n\?/.test(readFileSync('dist/how-it-works/index.html', 'utf8')), 'the "What is a6n?" answer is missing from how it works');
check(/\(Ai\)ny Management System/.test(visible), 'brand line missing');

const heroImg = markup.match(/<img[^>]*fetchpriority="high"[^>]*>/)?.[0] ?? '';
check(/alt="[^"]*Creation of Adam[^"]*"/.test(heroImg), 'hero <img> needs fetchpriority="high" and alt mentioning Creation of Adam');
const heroPicture = markup.match(/<picture[^>]*>[\s\S]*?fetchpriority="high"[\s\S]*?<\/picture>/)?.[0] ?? '';
check(/srcset="[^"]*\.(avif|webp)/.test(heroPicture), 'hero must be served as avif/webp');
const avif = heroPicture.match(/<source[^>]*srcset="([^"]+)"[^>]*type="image\/avif"/)?.[1] ?? '';
const at800 = avif.split(',').map((s) => s.trim().split(' ')).find(([, w]) => w === '900w')?.[0];
if (at800) {
	const path = 'dist' + decodeURIComponent(at800.split('?')[0]);
	const kb = existsSync(path) ? statSync(path).size / 1024 : Infinity;
	check(kb <= 180, `hero 900w avif is ${kb.toFixed(0)} KB, limit 180`);
} else check(false, 'hero has no 900w avif candidate');

const css = [...html.matchAll(/href="(\/_astro\/[^"]+\.css)"/g)].map((m) => readFileSync('dist' + m[1], 'utf8')).join('') + html;
check(/color-scheme:\s*light/.test(css), 'page must set color-scheme: light');
for (const name of ['TiffinGrab', 'Xplorers', 'Relay', 'Copper + Cloves']) check(markup.includes(name), `missing on the home page: ${name}`);
const order = ['bench', 'shop', 'street', 'help', 'work', 'notes', 'finale'].map((id) => markup.indexOf(`data-stop="${id}"`));
check(order.every((i, n) => i > 0 && (n === 0 || i > order[n - 1])), 'the home journey must run bench, shop, street, help, work, notes, finale');
for (const href of ['https://tiffingrab.ca', 'https://xplorers.life', 'https://copperandcloves.com', 'https://relay.a6n.ai']) check(markup.includes(`href="${href}"`), `the work must link to ${href}`);
check(html.includes('"@type":"FAQPage"'), 'home is missing its FAQPage data');
check(markup.includes('We help businesses run on their own system.'), 'missing closing call heading');

if (failures.length) {
	for (const f of failures) console.error(`FAIL: ${f}`);
	process.exit(1);
}
console.log('check-site: all passed');
