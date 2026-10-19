// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
	site: 'https://a6n.ai',
	integrations: [sitemap()],
	fonts: [
		{
			provider: fontProviders.google(),
			name: 'EB Garamond',
			cssVariable: '--font-display',
			weights: [400, 500],
			styles: ['normal', 'italic'],
			fallbacks: ['Georgia', 'serif'],
		},
		{
			provider: fontProviders.fontshare(),
			name: 'Switzer',
			cssVariable: '--font-body',
			weights: [400, 500, 600],
			styles: ['normal'],
			fallbacks: ['system-ui', 'sans-serif'],
		},
	],
});
