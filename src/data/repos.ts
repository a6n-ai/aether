export interface Repo {
	name: string;
	letter: string;
	colour: string;
	description: string;
	tags: string[];
	repo: string | null;
	site: string | null;
	soon?: boolean;
	runs?: { name: string; href: string }[];
}

export const REPOS: Repo[] = [
	{
		name: 'Quarry',
		letter: 'Q',
		colour: '--butter',
		description: 'A fast native macOS database viewer for PostgreSQL, MySQL and SQLite, with SSH tunnels.',
		tags: ['Rust', 'macOS'],
		repo: null,
		site: null,
		soon: true,
	},
	{
		name: 'Inscribe',
		letter: 'I',
		colour: '--cobalt',
		description: 'A local-first memory engine for coding agents. Structured facts in SQLite, with no keys to manage. Works with Claude Code, Codex and Gemini CLI.',
		tags: ['Apache-2.0', 'Go'],
		repo: 'https://github.com/a6n-ai/inscribe',
		site: null,
	},
	{
		name: 'Rays',
		letter: 'R',
		colour: '--coral',
		description: 'A download manager for macOS that sorts every download into the right folder with on-device AI. One CLI, with an MCP server.',
		tags: ['AGPL-3.0', 'Rust'],
		repo: 'https://github.com/a6n-ai/rays',
		site: 'https://rays.a6n.ai',
	},
	{
		name: 'Realm',
		letter: 'R',
		colour: '--teal',
		description: 'One codebase for many client apps: subscriptions, deliveries, payments and a staff CRM, one app per business.',
		tags: ['AGPL-3.0', 'TypeScript'],
		repo: 'https://github.com/a6n-ai/realm',
		site: null,
		runs: [
			{ name: 'TiffinGrab', href: '/clients/tiffingrab/' },
			{ name: 'Xplorers', href: '/clients/xplorers/' },
		],
	},
	{
		name: 'Monarch',
		letter: 'M',
		colour: '--teal',
		description: 'An AI gateway that routes every request to the right product or client system, based on what it remembers about them.',
		tags: ['AI gateway'],
		repo: 'https://github.com/a6n-ai/monarch',
		site: null,
	},
	{
		name: 'Relay',
		letter: 'R',
		colour: '--lilac',
		description: 'An operator console for email and notifications: an outbox, mailbox conversations and campaigns.',
		tags: ['AGPL-3.0', 'TypeScript'],
		repo: 'https://github.com/a6n-ai/relay',
		site: null,
	},
	{
		name: 'Copper + Cloves',
		letter: 'C',
		colour: '--coral',
		description: 'The app behind The Studio by Copper + Cloves, a wellness studio in India: classes, passes, café orders and the members\' portal.',
		tags: ['BSD-3-Clause', 'TypeScript'],
		repo: 'https://github.com/a6n-ai/Copper-Cloves',
		site: null,
		runs: [{ name: 'Copper + Cloves', href: '/clients/copper-cloves/' }],
	},
];
