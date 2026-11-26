/**
 * Visual regression of the Code theme (#38): the components that stuffcloud replaces with kern
 * (Button, Input, Select, Textarea, Checkbox, Card, Tabs, Progress, FileDrop, Modal, Toaster) on an isolated
 * test page, dark and light, at 1280, 375 and 320 px. Each component is its own screenshot, so a
 * change shows where it happened. The deprecated `stuffcloud` names render against the same
 * baselines: an alias that drifts from `code` fails here.
 *
 * Deterministic on purpose: the test fonts are loaded and checked (tests/elements/pages/fonts),
 * reduced motion stops the indeterminate Progress, Playwright freezes animations and hides the caret,
 * and nothing on the page depends on time or data. Baselines are per platform
 * (`visual.spec.ts-snapshots/<name>-chromium-<platform>.png`): Linux for CI, win32 for local runs.
 * A missing baseline is written but fails the test in CI, and this file is never retried; a failed CI
 * run uploads the new and the actual screenshots (artifact `visual-results`). Refresh: docs/themes.md.
 */
import { existsSync } from 'node:fs';
import { expect, test, type Locator, type Page } from '@playwright/test';

const WIDTHS = [1280, 375, 320] as const;
/** [data-theme, baseline]: the alias spellings must match the Code baselines exactly. */
const THEMES = [
	['code', 'code'],
	['code-light', 'code-light'],
	['stuffcloud', 'code'],
	['stuffcloud-light', 'code-light']
] as const;
const SHOTS = ['button', 'input', 'select', 'textarea', 'checkbox', 'card', 'tabs', 'progress', 'filedrop'] as const;

test.describe.configure({ retries: 0 });

/**
 * One screenshot against its baseline. A missing baseline is written (so a CI run produces the Linux
 * files for the `visual-results` artifact), but in CI the test still fails: a check that has nothing
 * to compare against must not pass.
 */
async function shot(target: Page | Locator, name: string, missing: string[]): Promise<void> {
	if (!existsSync(test.info().snapshotPath(name, { kind: 'screenshot' }))) missing.push(name);
	if ('goto' in target) await expect.soft(target).toHaveScreenshot(name);
	else await expect.soft(target).toHaveScreenshot(name);
}
const noneMissing = (missing: string[]): void => {
	if (process.env.CI) expect(missing, 'baselines missing (written now; see docs/themes.md, Visual regression)').toEqual([]);
};

async function open(page: Page, theme: string, width: number, overlay = ''): Promise<void> {
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await page.setViewportSize({ width, height: 900 });
	await page.goto(`/tests/elements/pages/visual.html?theme=${theme}&overlay=${overlay}`);
	await page.evaluate(async () => {
		await Promise.all(['k-button', 'k-input', 'k-modal', 'k-toaster', 'k-tabs'].map((t) => customElements.whenDefined(t)));
		await document.fonts.ready;
		for (const font of ['400 15px Inter', '600 15px Inter', '400 15px "JetBrains Mono"', '700 16px Silkscreen'])
			await document.fonts.load(font);
		await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
	});
	const fonts = await page.evaluate(() => ['15px Inter', '15px "JetBrains Mono"'].map((f) => document.fonts.check(f)));
	expect(fonts, 'test fonts loaded').toEqual([true, true]);
	expect(await page.evaluate(() => (window as unknown as { errors: string[] }).errors)).toEqual([]);
}

for (const [theme, base] of THEMES) {
	for (const width of WIDTHS) {
		test(`${theme} components at ${width}px`, async ({ page }) => {
			await open(page, theme, width);
			const missing: string[] = [];
			for (const name of SHOTS) await shot(page.locator(`[data-shot="${name}"]`), `${name}-${base}-${width}.png`, missing);
			noneMissing(missing);
		});

		test(`${theme} modal at ${width}px`, async ({ page }) => {
			await open(page, theme, width, 'modal');
			await page.evaluate(() => document.getElementById('modal')?.setAttribute('open', ''));
			await expect(page.getByRole('dialog')).toBeVisible();
			// focus lands on the first control; take it off so no ring depends on focus heuristics
			await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
			const missing: string[] = [];
			await shot(page, `modal-${base}-${width}.png`, missing);
			noneMissing(missing);
		});

		test(`${theme} toasts at ${width}px`, async ({ page }) => {
			await open(page, theme, width, 'toast');
			await page.evaluate(() => {
				const k = (window as unknown as { kern: { toast: (o: object) => number } }).kern;
				k.toast({ message: 'Site published.', tone: 'ok', duration: 0 });
				k.toast({ message: 'Storage almost full.', tone: 'warn', duration: 0 });
				k.toast({ message: 'Upload failed. Try again.', tone: 'danger', duration: 0 });
				k.toast({ message: 'Link copied.', duration: 0 });
			});
			await expect(page.getByText('Link copied.')).toBeVisible();
			const missing: string[] = [];
			await shot(page, `toasts-${base}-${width}.png`, missing);
			noneMissing(missing);
		});
	}
}

/**
 * Forced colors (#27): the same page under `forcedColors: 'active'`, in the dark palette (Code) and the
 * light palette (Code light), at 1280 and 375 px. The baselines are named `fc-<shot>-<palette>-<width>`.
 * Besides the components above: `controls` (switch, radio, slider, segmented control, rating) and `status`
 * (alerts, badges, tags, pagination, stepper), which carry their state in the shot. The assertions per
 * element are in forced-colors.spec.ts; these screenshots are what a person looks at.
 */
const FC_PALETTES = [
	['code', 'dark'],
	['code-light', 'light']
] as const;
const FC_SHOTS = ['button', 'input', 'checkbox', 'tabs', 'progress', 'filedrop', 'controls', 'status'] as const;

async function openForced(page: Page, theme: string, scheme: 'dark' | 'light', width: number, overlay = ''): Promise<void> {
	await page.emulateMedia({ forcedColors: 'active', colorScheme: scheme });
	await open(page, theme, width, overlay);
	await page.waitForFunction(() =>
		[...document.querySelectorAll('*')]
			.filter((el) => el.tagName.startsWith('K-'))
			.every((el) => customElements.get(el.tagName.toLowerCase()) && el.shadowRoot?.firstElementChild)
	);
	expect(await page.evaluate(() => matchMedia('(forced-colors: active)').matches), 'forced colors are on').toBe(true);
}

for (const [theme, scheme] of FC_PALETTES) {
	for (const width of [1280, 375]) {
		test(`forced colors, ${scheme} palette: components at ${width}px`, async ({ page }) => {
			await openForced(page, theme, scheme, width);
			const missing: string[] = [];
			for (const name of FC_SHOTS) await shot(page.locator(`[data-shot="${name}"]`), `fc-${name}-${scheme}-${width}.png`, missing);
			noneMissing(missing);
		});

		test(`forced colors, ${scheme} palette: modal at ${width}px`, async ({ page }) => {
			await openForced(page, theme, scheme, width, 'modal');
			await page.evaluate(() => document.getElementById('modal')?.setAttribute('open', ''));
			await expect(page.getByRole('dialog')).toBeVisible();
			// the ring of the focused close button is part of what is shown here
			const missing: string[] = [];
			await shot(page, `fc-modal-${scheme}-${width}.png`, missing);
			noneMissing(missing);
		});

		test(`forced colors, ${scheme} palette: toasts at ${width}px`, async ({ page }) => {
			await openForced(page, theme, scheme, width, 'toast');
			await page.evaluate(() => {
				const k = (window as unknown as { kern: { toast: (o: object) => number } }).kern;
				k.toast({ message: 'Site published.', tone: 'ok', duration: 0 });
				k.toast({ message: 'Storage almost full.', tone: 'warn', duration: 0 });
				k.toast({ message: 'Upload failed. Try again.', tone: 'danger', duration: 0 });
				k.toast({ message: 'Link copied.', duration: 0 });
			});
			await expect(page.getByText('Link copied.')).toBeVisible();
			const missing: string[] = [];
			await shot(page, `fc-toasts-${scheme}-${width}.png`, missing);
			noneMissing(missing);
		});
	}
}
