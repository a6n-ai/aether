// WebMCP (https://webmachinelearning.github.io/webmcp/): tools an AI agent in the visitor's browser can call.
// They only read the site's own public files (llms.txt, the per-page index.md) or build an email link;
// nothing is sent on the visitor's behalf.
type Tool = { name: string; description: string; inputSchema: object; execute: (input: Record<string, string>) => Promise<unknown> };
type ModelContext = { registerTool?: (tool: Tool) => unknown };

const text = async (url: string) => {
  const r = await fetch(url, { headers: { Accept: 'text/markdown' } });
  if (!r.ok) throw new Error(`${url}: ${r.status}`);
  return r.text();
};

const TOOLS: Tool[] = [
  {
    name: 'list_pages',
    description: 'List the pages of the a6n site (a software factory for businesses) with a one-line summary of each, as markdown.',
    inputSchema: { type: 'object', properties: {} },
    execute: () => text('/llms.txt'),
  },
  {
    name: 'read_page',
    description: 'Read one page of the a6n site as markdown, for example "/how-it-works" or "/what-we-make".',
    inputSchema: { type: 'object', properties: { path: { type: 'string', description: 'Site path starting with "/", for example "/factory"' } }, required: ['path'] },
    execute: ({ path }) => {
      if (!/^\/[a-z0-9\-/]*$/i.test(path ?? '')) throw new Error('path must be a site path such as /factory');
      return text(path.replace(/\/?$/, '/') + 'index.md');
    },
  },
  {
    name: 'request_a_build',
    description: 'Prepare an email to a6n asking for software to be built. Returns a mailto link for the visitor to send; it does not send anything.',
    inputSchema: {
      type: 'object',
      properties: {
        business: { type: 'string', description: 'What the business does, in one sentence' },
        need: { type: 'string', description: 'What it needs, in one sentence' },
      },
      required: ['need'],
    },
    execute: async ({ business = '', need }) => {
      const body = `Hi a6n,\n\nWhat my business does: ${business}\n\nWhat I need: ${need}\n\nA good time to talk:\n`;
      return { to: 'hi@a6n.ai', mailto: `mailto:hi@a6n.ai?subject=${encodeURIComponent('Book a call')}&body=${encodeURIComponent(body)}` };
    },
  },
];

export function registerAgentTools() {
  const mc = ((document as unknown as { modelContext?: ModelContext }).modelContext
    ?? (navigator as unknown as { modelContext?: ModelContext }).modelContext);
  if (!mc?.registerTool) return;
  for (const t of TOOLS) {
    try { Promise.resolve(mc.registerTool(t)).catch(() => {}); } catch { /* an older draft of the API: skip the tool */ }
  }
}
