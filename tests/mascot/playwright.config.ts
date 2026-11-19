import { defineConfig, devices } from '@playwright/test';

// Browser tests of the pixel-art runtime (#55) against the built <k-mascot> (dist-elements/):
// motion states, off-screen and hidden-tab pause, reduced motion, integer scales, no layout
// shift, strict CSP. Run `npm run build` first. Unit tests of the same module: mascots.test.ts (Vitest).
const port = Number(process.env.KERN_MASCOT_PORT ?? 4792);

export default defineConfig({
	testDir: '.',
	testMatch: '*.spec.ts',
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI ? [['list'], ['github']] : 'list',
	use: { baseURL: `http://127.0.0.1:${port}`, viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 },
	projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 } }],
	webServer: {
		command: 'node server.mjs',
		cwd: import.meta.dirname,
		env: { PORT: String(port) },
		url: `http://127.0.0.1:${port}/tests/mascot/pages/mascot.html`,
		reuseExistingServer: false,
		timeout: 15_000
	}
});
