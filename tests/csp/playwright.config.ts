import { defineConfig, devices } from '@playwright/test';

// The Svelte build path under a strict CSP (#125): the production build of tests/fixtures/csp-app (every exported
// component, every overlay opened) served with `style-src 'self'` and no 'unsafe-inline'. `npm run test:csp` builds
// the fixture and its negative twin first; `npm run build` must have run before.
const port = Number(process.env.KERN_CSP_PORT ?? 4793);

export default defineConfig({
	testDir: '.',
	testMatch: '*.spec.ts',
	outputDir: 'test-results',
	timeout: 180_000,
	fullyParallel: true,
	workers: 2,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI ? [['list'], ['github']] : 'list',
	use: { baseURL: `http://127.0.0.1:${port}`, actionTimeout: 5_000 },
	expect: { timeout: 5_000 },
	projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } } }],
	webServer: {
		command: 'node server.mjs',
		cwd: import.meta.dirname,
		env: { PORT: String(port) },
		url: `http://127.0.0.1:${port}/index.html`,
		reuseExistingServer: false,
		timeout: 15_000
	}
});
