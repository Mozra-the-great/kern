import { defineConfig, devices } from '@playwright/test';

// Browser tests of the built custom elements (dist-elements/). Run `npm run build` first.
// react-*.spec.ts (#35) drive the built React 19 app in tests/fixtures/react-app (`npm run build:react-app`, which
// `npm run test:elements` runs first).
const port = Number(process.env.KERN_TEST_PORT ?? 4791);

export default defineConfig({
	testDir: '.',
	testMatch: '*.spec.ts',
	// next to this file (tests/elements/test-results): the path CI uploads as `visual-results` and
	// scripts/ci/visual-baselines.mjs reads; without it the folder lands in the working directory
	outputDir: 'test-results',
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI ? [['list'], ['github']] : 'list',
	// visual.spec.ts: a missing baseline is written (CI uploads it) and fails the test in CI; never
	// `--update-snapshots` in CI. Small tolerance for anti-aliasing only.
	updateSnapshots: 'missing',
	expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.002, animations: 'disabled', caret: 'hide', scale: 'css' } },
	use: { baseURL: `http://127.0.0.1:${port}` },
	projects: [
		{ name: 'chromium', use: { ...devices['Desktop Chrome'] } },
		// Firefox makes a scroll container a keyboard stop of its own (a tab strip that overflowed by 1px, #153), Chromium
		// does not: the one spec that checks the strips' Tab order and scroll metrics runs there too (`npm run test:elements`
		// needs `npx playwright install firefox`). It has no screenshots, so there are no Firefox baselines.
		{ name: 'firefox', testMatch: 'a11y-tab-strip.spec.ts', use: { ...devices['Desktop Firefox'] } }
	],
	webServer: {
		command: 'node server.mjs',
		cwd: import.meta.dirname,
		env: { PORT: String(port) },
		url: `http://127.0.0.1:${port}/tests/elements/pages/form.html`,
		reuseExistingServer: false,
		timeout: 15_000
	}
});
