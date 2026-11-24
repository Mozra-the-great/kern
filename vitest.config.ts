import { svelteTesting } from '@testing-library/svelte/vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';

// Two Vitest projects:
//  - `node`: pure logic and server-rendered markup (tests/tokens, tests/unit, tests/components, tests/mascot/*.test.ts).
//    The browser tests under tests/targets/, tests/elements/ and tests/mascot/ run with Playwright, not here.
//  - `dom`: component behaviour in jsdom with @testing-library/svelte (tests/dom): props, bindable values, callbacks,
//    keyboard, focus and ARIA. Svelte's client runtime is resolved via the `browser` condition (svelteTesting()).
//    Rendering that needs real layout (overlay position, scroll, touch targets) stays with the Playwright suites.
// `npm run test:coverage` measures both over src/lib (see docs/testing.md).
export default defineConfig({
	test: {
		coverage: {
			provider: 'v8',
			include: ['src/lib/**/*.{ts,svelte}'],
			// The themes are CSS; everything else under src/lib is measured.
			exclude: ['src/lib/themes/**', 'src/lib/**/*.d.ts'],
			reporter: ['text-summary', 'text', 'json-summary', 'lcov'],
			reportsDirectory: 'coverage',
			// Ratchet: the coverage of stage 2 of #24 rounded down (the floor is 95 % on all four metrics; these
			// are higher because the suite reached more), so CI fails when it drops. Raise these numbers whenever
			// the coverage grows; never lower them to get green.
			thresholds: { statements: 99, branches: 96, functions: 99, lines: 100 }
		},
		projects: [
			{
				extends: true,
				plugins: [svelte()],
				test: {
					name: 'node',
					include: [
						'tests/tokens/**/*.test.ts',
						'tests/mascot/**/*.test.ts',
						'tests/unit/**/*.test.ts',
						'tests/components/**/*.test.ts',
						'src/**/*.test.ts'
					],
					environment: 'node'
				}
			},
			{
				extends: true,
				plugins: [svelte(), svelteTesting()],
				test: {
					name: 'dom',
					include: ['tests/dom/**/*.test.ts'],
					environment: 'jsdom',
					setupFiles: ['tests/dom/setup.ts']
				}
			}
		]
	}
});
