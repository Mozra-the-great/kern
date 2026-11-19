import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// Demo site: index.html (Svelte components) and elements.html (custom elements).
export default defineConfig({
	plugins: [svelte()],
	base: './',
	build: {
		outDir: 'demo-dist',
		// The pixel art stays a file (never a data: URI), as a CSP with img-src 'self' needs and as
		// consumers should configure it too (README, "Mascot"). Other assets keep the default.
		assetsInlineLimit: (file) => (file.endsWith('.svg') ? false : undefined),
		rollupOptions: { input: { index: 'index.html', elements: 'elements.html' } }
	}
});
