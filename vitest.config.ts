import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// Node-side unit tests. The browser tests under tests/targets/, tests/elements/ and tests/mascot/
// run with Playwright, not here. tests/components/ renders the Svelte components with
// `svelte/server` (markup and attributes); their behaviour in a browser is covered by the element
// tests, which run the same components inside the custom elements.
export default defineConfig({
	plugins: [svelte()],
	test: {
		include: [
			'tests/tokens/**/*.test.ts',
			'tests/mascot/**/*.test.ts',
			'tests/unit/**/*.test.ts',
			'tests/components/**/*.test.ts',
			'src/**/*.test.ts'
		],
		environment: 'node'
	}
});
