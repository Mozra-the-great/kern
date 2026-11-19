/**
 * Visual regression of the Code theme (#38): the components that stuffcloud replaces with kern
 * (Button, Input, Select, Checkbox, Card, Tabs, Progress, FileDrop, Modal, Toaster) on an isolated
 * test page, dark and light, at 1280, 375 and 320 px. Each component is its own screenshot, so a
 * change shows where it happened. The deprecated `stuffcloud` names render against the same
 * baselines: an alias that drifts from `code` fails here.
 *
 * Deterministic on purpose: the test fonts are loaded and checked (tests/elements/pages/fonts),
 * reduced motion stops the indeterminate Progress, Playwright freezes animations and hides the caret,
 * and nothing on the page depends on time or data. Baselines are per platform
 * (`visual.spec.ts-snapshots/<name>-chromium-<platform>.png`): Linux for CI, win32 for local runs.
 * CI never writes a missing baseline (`updateSnapshots: 'none'`) and never retries this file; a failed
 * run uploads the actual screenshots (artifact `visual-results`). Refresh: docs/themes.md.
 */
import { expect, test, type Page } from '@playwright/test';

const WIDTHS = [1280, 375, 320] as const;
/** [data-theme, baseline]: the alias spellings must match the Code baselines exactly. */
const THEMES = [
	['code', 'code'],
	['code-light', 'code-light'],
	['stuffcloud', 'code'],
	['stuffcloud-light', 'code-light']
] as const;
const SHOTS = ['button', 'input', 'select', 'checkbox', 'card', 'tabs', 'progress', 'filedrop'] as const;

test.describe.configure({ retries: 0 });

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
			for (const shot of SHOTS) await expect(page.locator(`[data-shot="${shot}"]`)).toHaveScreenshot(`${shot}-${base}-${width}.png`);
		});

		test(`${theme} modal at ${width}px`, async ({ page }) => {
			await open(page, theme, width, 'modal');
			await page.evaluate(() => document.getElementById('modal')?.setAttribute('open', ''));
			await expect(page.getByRole('dialog')).toBeVisible();
			// focus lands on the first control; take it off so no ring depends on focus heuristics
			await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
			await expect(page).toHaveScreenshot(`modal-${base}-${width}.png`);
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
			await expect(page).toHaveScreenshot(`toasts-${base}-${width}.png`);
		});
	}
}
