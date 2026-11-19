import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../..', import.meta.url));
const port = 4179;

// Touch-target test (issue #40) against the built demo (npm run build first).
export default defineConfig({
	testDir: '.',
	timeout: 120_000,
	fullyParallel: true,
	workers: 3,
	retries: process.env.CI ? 1 : 0,
	forbidOnly: !!process.env.CI,
	reporter: process.env.CI ? 'line' : 'list',
	use: {
		baseURL: `http://127.0.0.1:${port}/`,
		...devices['Desktop Chrome'],
		// A phone: 375px wide, touch, so (pointer: coarse) matches.
		viewport: { width: 375, height: 812 },
		deviceScaleFactor: 1,
		isMobile: true,
		hasTouch: true
	},
	webServer: {
		command: `node node_modules/vite/bin/vite.js preview --port ${port} --strictPort --host 127.0.0.1`,
		cwd: root,
		url: `http://127.0.0.1:${port}/index.html`,
		reuseExistingServer: false,
		timeout: 60_000
	}
});
