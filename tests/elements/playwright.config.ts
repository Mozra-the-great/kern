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
		// does not: a11y-tab-strip.spec.ts, which checks the strips' Tab order and scroll metrics, also runs there, in CI too
		// (`npm run test:elements` needs `npx playwright install firefox`). It has no screenshots, so no Firefox baselines.
		// `KERN_FIREFOX=1` adds the hit-target spec (#150), which is run in Firefox by hand only.
		{
			name: 'firefox',
			testMatch: process.env.KERN_FIREFOX ? ['a11y-tab-strip.spec.ts', 'hit-target.spec.ts'] : 'a11y-tab-strip.spec.ts',
			use: { ...devices['Desktop Firefox'] }
		},
		// A pill strip with more tabs than fit widened the page in Firefox only (#159: its grid column was as wide as the
		// strip, Chromium sized it right anyway). The one test of a11y-reflow.spec.ts for it runs there too; `grep` keeps the
		// rest of that spec in Chromium.
		{
			name: 'firefox-reflow',
			testMatch: 'a11y-reflow.spec.ts',
			grep: /pill tab strip with many tabs/,
			use: { ...devices['Desktop Firefox'] }
		}
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
