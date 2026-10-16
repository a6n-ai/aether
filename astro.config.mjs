// @ts-check
import { defineConfig, fontProviders } from 'astro/config';

export default defineConfig({
	site: 'https://a6n.ai',
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
			provider: fontProviders.google(),
			name: 'Inter',
			cssVariable: '--font-body',
			weights: [400, 500, 600],
			fallbacks: ['system-ui', 'sans-serif'],
		},
	],
});
