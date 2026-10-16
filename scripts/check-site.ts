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

if (failures.length) {
	for (const f of failures) console.error(`FAIL: ${f}`);
	process.exit(1);
}
console.log('check-site: all passed');
