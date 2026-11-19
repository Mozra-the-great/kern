import { defineConfig } from 'vitest/config';

// Node-side unit tests. The browser tests under tests/targets/ run with Playwright
// (npm run test:targets), not here.
export default defineConfig({
	test: {
		include: ['tests/tokens/**/*.test.ts', 'tests/mascot/**/*.test.ts', 'src/**/*.test.ts'],
		environment: 'node'
	}
});
