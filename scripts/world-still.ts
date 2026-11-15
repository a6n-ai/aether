// Renders the finished world, every place drawn and the Vitruvian inked, to src/assets/world/whole.jpg: the
// finale the still page shows when the world cannot run (reduced motion, no JS, a slow device).
// Needs the built site served (dist/ on http://127.0.0.1:4400) and Playwright; run from a folder that has it:
//   cd ~/.cache/jury && node /path/to/aether/scripts/world-still.ts [url]
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const { chromium } = createRequire(resolve(process.cwd(), 'noop.js'))('playwright');
const url = process.argv[2] ?? 'http://127.0.0.1:4400/';
const out = resolve(dirname(fileURLToPath(import.meta.url)), '../src/assets/world/whole.jpg');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1800, height: 1150 }, deviceScaleFactor: 1 });
await page.goto(url, { waitUntil: 'networkidle' });
await page.evaluate(() => {
	const s = document.querySelector<HTMLElement>('[data-stop="finale"]')!;
	(window as Window & { a6nScrollTo?: (y: number) => void }).a6nScrollTo!(s.getBoundingClientRect().top + scrollY + s.offsetHeight * 0.95);
});
await page.waitForTimeout(4000);
const data = await page.evaluate(() => (document.querySelector('canvas.world') as HTMLCanvasElement).toDataURL('image/jpeg', 0.82));
writeFileSync(out, Buffer.from(data.split(',')[1], 'base64'));
console.log('wrote', out);
await browser.close();
