import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// Demo site: index.html (Svelte components) and elements.html (custom elements).
export default defineConfig({
	plugins: [svelte()],
	base: './',
	build: {
		outDir: 'demo-dist',
		rollupOptions: { input: { index: 'index.html', elements: 'elements.html' } }
	}
});
