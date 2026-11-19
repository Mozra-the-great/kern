import { expect, test } from '@playwright/test';

// #33: per-element entry points register only their tags; registration is idempotent;
// a k-* tag owned by another library is left alone with a warning.

const defined = (tags: string[]) => tags.filter((t) => !!customElements.get(t));

test('an element entry registers only its tag', async ({ page }) => {
	await page.goto('/tests/elements/pages/entries.html');
	await page.addScriptTag({
		type: 'module',
		content: "import '/dist-elements/elements/button.js'; import '/dist-elements/elements/accordion.js'; window.loaded = true;"
	});
	await page.waitForFunction(() => (window as unknown as { loaded?: boolean }).loaded);
	expect(await page.evaluate(defined, ['k-button', 'k-accordion', 'k-accordion-item', 'k-input', 'k-modal'])).toEqual([
		'k-button',
		'k-accordion',
		'k-accordion-item'
	]);
	await expect(page.locator('#b button')).toBeVisible();
	await expect(page.locator('#b')).toHaveText('One');
	expect(await page.evaluate(() => window.kern)).toBeUndefined();
});

test('loading entries and the all-in-one bundle together is idempotent', async ({ page }) => {
	await page.goto('/tests/elements/pages/entries.html');
	await page.addScriptTag({
		type: 'module',
		content:
			"import '/dist-elements/elements/button.js'; import '/dist-elements/kern-elements.js'; import '/dist-elements/elements/input.js'; import { toast } from '/dist-elements/elements/toaster.js'; window.toastFn = typeof toast; window.loaded = true;"
	});
	await page.waitForFunction(() => (window as unknown as { loaded?: boolean }).loaded);
	expect(await page.evaluate(() => (window as unknown as { errors: string[] }).errors)).toEqual([]);
	expect(await page.evaluate(() => (window as unknown as { warnings: string[] }).warnings)).toEqual([]);
	expect(await page.evaluate(defined, ['k-button', 'k-input', 'k-modal', 'k-toaster'])).toHaveLength(4);
	expect(await page.evaluate(() => [typeof window.kern?.toast, (window as unknown as { toastFn: string }).toastFn])).toEqual([
		'function',
		'function'
	]);
});

test('a k-* tag defined by another library is not overwritten', async ({ page }) => {
	await page.goto('/tests/elements/pages/entries.html');
	await page.evaluate(() => customElements.define('k-badge', class extends HTMLElement {}));
	await page.addScriptTag({ type: 'module', content: "import '/dist-elements/kern-elements.js'; window.loaded = true;" });
	await page.waitForFunction(() => (window as unknown as { loaded?: boolean }).loaded);
	expect(await page.evaluate(() => (window as unknown as { errors: string[] }).errors)).toEqual([]);
	expect(await page.evaluate(() => (window as unknown as { warnings: string[] }).warnings)).toEqual([
		expect.stringContaining('<k-badge> is already defined by another library')
	]);
	expect(await page.evaluate(() => !!customElements.get('k-button'))).toBe(true);
});
