import { readFileSync, existsSync } from 'node:fs';

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

if (failures.length) {
	for (const f of failures) console.error(`FAIL: ${f}`);
	process.exit(1);
}
console.log('check-site: all passed');
