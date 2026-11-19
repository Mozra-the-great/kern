import { defineConfig, devices } from '@playwright/test';

// Browser tests of the built custom elements (dist-elements/). Run `npm run build` first.
// Wave 7 (#35, React bridge tests) extends this setup.
const port = Number(process.env.KERN_TEST_PORT ?? 4791);

export default defineConfig({
	testDir: '.',
	testMatch: '*.spec.ts',
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI ? [['list'], ['github']] : 'list',
	// visual.spec.ts: CI never writes a missing baseline (it would pass on the retry otherwise); locally a
	// missing one is written and the test fails once. Small tolerance for anti-aliasing only.
	updateSnapshots: process.env.CI ? 'none' : 'missing',
	expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.002, animations: 'disabled', caret: 'hide', scale: 'css' } },
	use: { baseURL: `http://127.0.0.1:${port}` },
	projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
	webServer: {
		command: 'node server.mjs',
		cwd: import.meta.dirname,
		env: { PORT: String(port) },
		url: `http://127.0.0.1:${port}/tests/elements/pages/form.html`,
		reuseExistingServer: false,
		timeout: 15_000
	}
});
