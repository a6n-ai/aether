// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
	site: 'https://a6n.ai',
	trailingSlash: 'always',
	prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
	integrations: [sitemap()],
	fonts: [
		{
			provider: fontProviders.google(),
			name: 'Figtree',
			cssVariable: '--font-factory',
			weights: [500, 600, 700],
			styles: ['normal'],
			fallbacks: ['system-ui', 'sans-serif'],
		},
	],
});
