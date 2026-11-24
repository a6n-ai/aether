// After `astro build`: write what AI agents read, next to the HTML.
//   dist/**/index.md                       markdown copy of each page (served for Accept: text/markdown)
//   dist/llms.txt                          overview per llmstxt.org
//   dist/.well-known/agent-skills/index.json   skills index with sha256 digests (Agent Skills Discovery v0.2.0)
//   dist/.well-known/ai-catalog.json       ARD manifest listing the two resources above
// usage: node scripts/agent-files.ts
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, relative } from 'node:path';
import assert from 'node:assert/strict';

const SITE = 'https://a6n.ai';
const DIST = 'dist';

const ENT: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'", apos: "'", nbsp: ' ', rarr: '→', larr: '←', nearr: '↗', times: '×', hellip: '…' };
const decode = (s: string) => s.replace(/&(#x?[0-9a-f]+|\w+);/gi, (m, e: string) =>
  ENT[e.toLowerCase()] ?? (e[0] === '#' ? String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : +e.slice(1)) : m));

// our own semantic HTML is simple enough for a small converter: headings, paragraphs, lists, links, tables
export function htmlToMd(html: string) {
  let s = html
    .replace(/<(script|style|svg|canvas|noscript|template|button)\b[\s\S]*?<\/\1>/gi, '')
    .replace(/<(\w+)\b[^>]*\baria-hidden="true"[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<a\b[^>]*\bhref="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href: string, t: string) => {
      const text = t.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
      if (!text) return '';
      const url = href.startsWith('/') ? SITE + href : href;
      return `[${text}](${url})`;
    })
    .replace(/<h([1-4])\b[^>]*>([\s\S]*?)<\/h\1>/gi, (_, n: string, t: string) => `\n\n${'#'.repeat(+n)} ${t.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()}\n\n`)
    .replace(/<(strong|b)\b[^>]*>([\s\S]*?)<\/\1>/gi, '**$2**')
    .replace(/<li\b[^>]*>/gi, '\n- ')
    .replace(/<\/(td|th)>/gi, ' | ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/span>/gi, ' ')
    .replace(/<\/?(p|div|section|header|footer|article|ul|ol|tr|table|figure|figcaption|dl|dt|dd|blockquote|form|label|nav|li|summary|details)\b[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '');
  s = decode(s).replace(/[ \t]+/g, ' ').replace(/ *\n */g, '\n').replace(/^-$/gm, '').replace(/\n{3,}/g, '\n\n').replace(/\| *\n/g, '\n');
  return s.trim() + '\n';
}

const pages: { path: string; title: string; desc: string; md: string }[] = [];
const walk = (dir: string) => {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) { if (!f.startsWith('_') && f !== 'art' && f !== 'plates') walk(p); continue; }
    if (f !== 'index.html' && f !== '404.html') continue;
    const html = readFileSync(p, 'utf8');
    const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1];
    if (!main) continue;
    const title = decode(html.match(/<title>([^<]*)<\/title>/i)?.[1] ?? '').trim();
    const desc = decode(html.match(/<meta name="description" content="([^"]*)"/i)?.[1] ?? '').trim();
    const rel = '/' + relative(DIST, dir).split('\\').join('/');
    const path = f === '404.html' ? '/404' : (rel === '/' ? '/' : rel + '/');
    const body = htmlToMd(main);
    // the page's own h1 stays in the body; the title only heads the file when the body has none
    const head = /^# /m.test(body) ? '' : `# ${title}\n\n`;
    const md = `${head}> ${desc}\n\nSource: ${SITE}${path === '/404' ? '/404' : path}\n\n${body}`;
    if (f === 'index.html') writeFileSync(join(dir, 'index.md'), md);
    pages.push({ path, title, desc, md });
  }
};
walk(DIST);
pages.sort((a, b) => a.path.split('/').length - b.path.split('/').length || a.path.localeCompare(b.path));

// self-check: every page converted to real text with its heading and no leftover markup
for (const p of pages) {
  assert.ok(p.md.length > 200, `${p.path}: markdown too short`);
  assert.ok(!/<\/?[a-z][^>]*>/i.test(p.md), `${p.path}: html left in markdown`);
}
assert.ok(pages.some(p => p.path === '/'), 'home page missing');

const listed = pages.filter(p => p.path !== '/404');
const home = listed.find(p => p.path === '/')!;
const llms = [
  '# a6n',
  '',
  '> a6n, the (Ai)ny Management System, is a software factory for your business: it plans, builds and runs software for growing businesses, with AI inside.',
  '',
  'Every page below is also served as markdown: request it with `Accept: text/markdown`, or open the `index.md` link.',
  '',
  '## Pages',
  '',
  ...listed.map(p => `- [${p.title.replace(/ \| a6n$/, '')}](${SITE}${p.path === '/' ? '/' : p.path}index.md): ${p.desc}`),
  '',
  '## Contact',
  '',
  '- Email: hi@a6n.ai',
  `- Agent skill for requesting a build: ${SITE}/.well-known/agent-skills/request-a-build/SKILL.md`,
  '',
].join('\n');
assert.ok(home && llms.includes('/factory/index.md'));
writeFileSync(join(DIST, 'llms.txt'), llms);

const skillPath = '.well-known/agent-skills/request-a-build/SKILL.md';
const sha = (f: string) => 'sha256:' + createHash('sha256').update(readFileSync(join(DIST, f))).digest('hex');
const skill = readFileSync(join(DIST, skillPath), 'utf8');
const skillDesc = skill.match(/^description: (.*)$/m)![1];
writeFileSync(join(DIST, '.well-known/agent-skills/index.json'), JSON.stringify({
  $schema: 'https://schemas.agentskills.io/discovery/0.2.0/schema.json',
  skills: [{ name: 'request-a-build', type: 'skill-md', description: skillDesc, url: '/' + skillPath, digest: sha(skillPath) }],
}, null, 2) + '\n');

writeFileSync(join(DIST, '.well-known/ai-catalog.json'), JSON.stringify({
  specVersion: '1.0',
  host: { displayName: 'a6n', identifier: 'did:web:a6n.ai' },
  entries: [
    { identifier: 'urn:air:a6n.ai:docs:llms', displayName: 'a6n site overview', type: 'text/markdown', url: `${SITE}/llms.txt`,
      representativeQueries: ['what does a6n build', 'how does the a6n software factory work', 'which businesses run systems built by a6n'] },
    { identifier: 'urn:air:a6n.ai:skill:request-a-build', displayName: 'Request a build from a6n', type: 'text/markdown', url: `${SITE}/${skillPath}`,
      representativeQueries: ['hire a team to build software for my business', 'contact a6n about a custom app', 'book a call with a6n'] },
  ],
}, null, 2) + '\n');

console.log(`agent files: ${pages.length} markdown pages, llms.txt, agent-skills index, ai-catalog`);
