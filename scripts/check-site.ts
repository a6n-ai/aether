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
	if (page !== 'index.html') {
		check(/<canvas[^>]*class="world"/.test(raw), `${page}: missing the world canvas`);
		check(/data-stop="[^"]+"/.test(body), `${page}: no stops`);
	}
	for (const img of body.matchAll(/<img[^>]*class="still"[^>]*>/g)) check((img[0].match(/alt="([^"]*)"/)?.[1] ?? '').length >= 40, `${page}: a stop's still needs a 40+ char alt`);
	for (const phrase of ['until it arrives', 'bookings, delivery and messages are parts']) {
		check(!text.includes(phrase), `${page}: overpromising copy: "${phrase}"`);
	}
}
check(/What is a6n\?/.test(readFileSync('dist/how-it-works/index.html', 'utf8')), 'the "What is a6n?" answer is missing from how it works');
// home: the software factory page
const css = [...html.matchAll(/href="(\/_astro\/[^"]+\.css)"/g)].map((m) => readFileSync('dist' + m[1], 'utf8')).join('') + html;
check(/color-scheme:\s*light/.test(css), 'page must set color-scheme: light');
check(/<h1[^>]*>[\s\S]*software factory[\s\S]*<\/h1>/i.test(markup), 'home h1 must name the software factory');
const sections = ['class="hero', 'class="hands', 'id="hub"', 'id="parts"', 'id="how"', 'id="log"', 'id="talk"'].map((m) => markup.indexOf(m));
check(sections.every((i, n) => i > 0 && (n === 0 || i > sections[n - 1])), 'home must run hero, hands, routes, parts, how it works, output log, closing');
check(markup.includes('Tell us what<br>you need.'), 'missing closing call heading');
check(/Creation of Adam[\s\S]*Public domain/.test(visible), 'hands section must credit Michelangelo, The Creation of Adam');
check(/A study of a woman's hands[\s\S]*Public domain/.test(visible), 'closing sketch must credit Leonardo');
check(existsSync('public/art/leo-hands.png') && statSync('public/art/leo-hands.png').size < 500 * 1024, 'closing sketch art missing or over 500 KB');
const showcase = existsSync('dist/showcase/index.html') ? readFileSync('dist/showcase/index.html', 'utf8') : '';
for (const repo of ['monarch', 'inscribe', 'relay', 'rays']) check(showcase.includes(`href="https://github.com/a6n-ai/${repo}"`), `showcase must link ${repo}`);

if (failures.length) {
	for (const f of failures) console.error(`FAIL: ${f}`);
	process.exit(1);
}
console.log('check-site: all passed');
