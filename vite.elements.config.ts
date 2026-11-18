import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// Builds src/elements/* as custom elements (<k-button>, <k-modal>, …).
// The core components in src/lib are compiled into them; only the wrappers
// register tags, so warnings about custom-element props in src/lib are noise.
export default defineConfig({
	plugins: [
		svelte({
			compilerOptions: { customElement: true, css: 'injected' },
			onwarn(w, handler) {
				if (w.code === 'custom_element_props_identifier' && w.filename?.includes('src/lib/')) return;
				handler?.(w);
			}
		})
	],
	build: {
		outDir: 'dist-elements',
		minify: true,
		lib: { entry: 'src/elements/index.ts', formats: ['es'], fileName: () => 'kern-elements.js' }
	}
});
