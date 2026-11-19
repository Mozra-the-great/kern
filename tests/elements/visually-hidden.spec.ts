/**
 * <k-visually-hidden> and the global classes `.k-visually-hidden` / `.k-visually-hidden-focusable` (#100):
 * the text is not painted (1×1 px, clipped) but stays in the accessibility tree with its name, and the
 * focusable variants show their content while it has focus. axe stays clean.
 */
import { expect, test, type Locator } from '@playwright/test';
import { axeViolations } from './axe.js';

async function box(locator: Locator): Promise<{ width: number; height: number; clip: string }> {
	return locator.evaluate((el) => {
		const r = el.getBoundingClientRect();
		return { width: r.width, height: r.height, clip: getComputedStyle(el).clipPath };
	});
}

test.beforeEach(async ({ page }) => {
	await page.goto('/tests/elements/pages/visually-hidden.html');
	await page.waitForFunction(() => customElements.get('k-visually-hidden') !== undefined);
});

test('the element and the class hide the text visually and keep it as the accessible name', async ({ page }) => {
	for (const id of ['el', 'cls']) {
		const b = await box(page.locator(`#${id}`));
		expect(b.width).toBeLessThanOrEqual(1);
		expect(b.height).toBeLessThanOrEqual(1);
		expect(b.clip).toBe('inset(50%)');
	}
	await expect(page.getByRole('columnheader', { name: 'Timestamp' })).toBeVisible();
	await expect(page.getByRole('columnheader', { name: 'Change' })).toBeVisible();
	expect(await page.evaluate(() => (window as unknown as { errors: string[] }).errors)).toEqual([]);
});

test('the focusable variants show their link while it has focus, and hide it again', async ({ page }) => {
	for (const [id, name] of [
		['el-focus', 'Jump to the end (element)'],
		['cls-focus', 'Jump to the end (class)']
	] as const) {
		const link = page.getByRole('link', { name });
		expect((await box(page.locator(`#${id}`))).width).toBeLessThanOrEqual(1);
		await link.focus();
		await expect(link).toBeFocused();
		const shown = await box(page.locator(`#${id}`));
		expect(shown.width).toBeGreaterThan(20);
		expect(shown.clip).toBe('none');
		await link.blur();
		expect((await box(page.locator(`#${id}`))).width).toBeLessThanOrEqual(1);
	}
});

for (const theme of ['code', 'flower', 'pop-dark', 'line']) {
	test(`axe: the visually hidden page in ${theme} has no serious or critical violation`, async ({ page }) => {
		await page.evaluate((t) => (document.documentElement.dataset.theme = t), theme);
		expect(await axeViolations(page)).toEqual([]);
	});
}
