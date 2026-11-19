import type { Page } from '@playwright/test';
import { expect, test } from './react-app.js';

// #35: tabs, tab links, data table, pagination, sortable list, select grid and file drop driven by React 19.
// The #29 shape is in the first test: one tab state feeds four kern elements and every handler writes into the others.

test.describe('navigation', () => {
	test.beforeEach(async ({ app }) => {
		await app.open(['nav']);
	});

	const panel = (id: string) => `#${id}`;

	test('picking a tab updates every element that shares the state: one event, no crash (#29), no echo from the others', async ({
		app,
		page
	}) => {
		await expect(page.locator(panel('panel-a'))).toBeVisible();
		await expect(page.locator(panel('panel-b'))).toBeHidden();
		expect(await app.events()).toEqual([]);

		await page
			.locator('#tabs')
			.getByRole('tab', { name: /Brands/ })
			.click();
		await expect(page.locator('#nav-state')).toContainText('"tab":"b"');
		await expect(page.locator(panel('panel-b'))).toBeVisible();
		await expect(page.locator(panel('panel-a'))).toBeHidden();
		await expect(page.locator('#appnav').getByRole('tab', { name: 'More' })).toHaveAttribute('aria-selected', 'true');
		await expect(page.locator('#mirror').getByRole('radio', { name: 'B' })).toBeChecked();
		await expect(page.locator('#radios').getByRole('radio', { name: 'Radio B' })).toBeChecked();
		// The user changed one element; the others took the value from React without reporting it.
		expect((await app.emitted()).map((e) => `${e.id}:${e.type}:${String(e.detail)}`)).toEqual(['tabs:change:b']);
		expect(await app.handled()).toEqual([{ source: 'tabs', type: 'change', detail: 'b' }]);

		for (const [selector, name, source] of [
			['#appnav', 'Home', 'tabs'],
			['#mirror', 'A', 'mirror'],
			['#radios', 'Radio A', 'radios']
		] as const) {
			await page.locator('#tab-b-from-react').click();
			await expect(page.locator(panel('panel-b'))).toBeVisible();
			await app.reset();
			// Radio groups lay their label over the input: the user clicks the label.
			const target =
				selector === '#appnav'
					? page.locator(selector).getByRole('tab', { name })
					: selector === '#radios'
						? page.locator(selector).getByText(name)
						: page.locator(selector).getByRole('radio', { name });
			await target.click();
			await expect(page.locator('#nav-state')).toContainText('"tab":"a"');
			expect(
				(await app.emitted()).map((e) => e.type),
				source
			).toEqual(['change']);
			await expect(page.locator(panel('panel-a'))).toBeVisible();
		}
	});

	test('a tab set from React and new tab arrays (badge counts) fire no change', async ({ app, page }) => {
		await page.locator('#tab-b-from-react').click();
		await expect(page.locator(panel('panel-b'))).toBeVisible();
		// The panel of the first tab holds a React button that raises the badge count: a new `tabs` array each time.
		await page.locator('#appnav').getByRole('tab', { name: 'Home' }).click();
		await app.reset();
		await page.locator('#panel-a-button').click();
		await page.locator('#panel-a-button').click();
		await expect(page.locator('#tabs').getByRole('tab', { name: 'Brands 4 new' })).toBeVisible();
		expect(await app.events()).toEqual([]);
		expect(await app.handled()).toEqual([]);
		await expect(page.locator('#tabs').getByRole('tab', { selected: true })).toHaveText('Polishes');
	});

	test('keyboard: arrow keys move the selection and report it once; a panel React adds later stays hidden', async ({ app, page }) => {
		await page.locator('#tabs').getByRole('tab', { name: 'Polishes' }).focus();
		await page.keyboard.press('ArrowRight');
		await expect(page.locator(panel('panel-b'))).toBeVisible();
		expect((await app.emitted()).map((e) => e.detail)).toEqual(['b']);
		// Disabled and unknown tabs are skipped: the next arrow wraps to the first tab.
		await page.keyboard.press('ArrowRight');
		await expect(page.locator(panel('panel-a'))).toBeVisible();

		await app.reset();
		await page.locator('#add-panel').click();
		await expect(page.locator('#panel-x')).toBeHidden();
		await expect(page.locator(panel('panel-a'))).toBeVisible();
		expect(await app.events()).toEqual([]);
	});

	test('tab links: the user clicks, React routes (preventDefault), the current link follows React state', async ({ app, page }) => {
		const links = page.locator('#links');
		await expect(links.getByRole('link', { name: 'Polishes' })).toHaveAttribute('aria-current', 'page');
		const url = page.url();
		await links.getByRole('link', { name: 'Brands' }).click();
		await expect(page.locator('#nav-state')).toContainText('"route":"/brands"');
		await expect(links.getByRole('link', { name: 'Brands' })).toHaveAttribute('aria-current', 'page');
		await expect(links.getByRole('link', { name: 'Polishes' })).not.toHaveAttribute('aria-current', 'page');
		expect(page.url()).toBe(url);
		expect(await app.handled()).toEqual([{ source: 'links', type: 'navigate', detail: '/brands' }]);
		expect((await app.emitted()).map((e) => e.type)).toEqual(['navigate']);

		await app.reset();
		await links.getByRole('link', { name: 'Polishes' }).click();
		await expect(links.getByRole('link', { name: 'Polishes' })).toHaveAttribute('aria-current', 'page');
		await app.reset();
		await page.locator('#route-from-react').click();
		await expect(links.getByRole('link', { name: 'Brands' })).toHaveAttribute('aria-current', 'page');
		expect(await app.events()).toEqual([]);
	});
});

test.describe('data', () => {
	test.beforeEach(async ({ app }) => {
		await app.open(['data']);
	});

	const names = (page: Page) =>
		page.locator('#table tbody tr').evaluateAll((rows) => rows.map((r) => r.querySelectorAll('td')[1]?.textContent ?? ''));

	test('sorting: a header click reports `sort`; sortKey/sortDir from React sort silently', async ({ app, page }) => {
		expect(await names(page)).toEqual(['Mint', 'Berry', 'Night']);
		await page.locator('#table').getByRole('button', { name: 'Name' }).click();
		await expect(page.locator('#data-state')).toContainText('"sort":{"key":"name","dir":"asc"}');
		expect(await names(page)).toEqual(['Berry', 'Cloud', 'Mint']);
		expect(await app.handled()).toEqual([{ source: 'table', type: 'sort', detail: { key: 'name', dir: 'asc' } }]);
		await page.locator('#table').getByRole('button', { name: /Name/ }).click();
		await expect(page.locator('#data-state')).toContainText('"dir":"desc"');
		expect(await names(page)).toEqual(['Rose', 'Night', 'Mint']);

		await app.reset();
		await page.locator('#sort-from-react').click();
		await expect(page.locator('#data-state')).toContainText('"key":"qty"');
		await expect.poll(() => names(page)).toEqual(['Night', 'Rose', 'Mint']);
		expect(await app.events()).toEqual([]);
	});

	test('selection: a checkbox click reports `select`; selected from React ticks the rows silently', async ({ app, page }) => {
		await page.locator('#table').getByRole('checkbox', { name: 'Select Mint' }).check();
		await expect(page.locator('#data-state')).toContainText('"selected":[1]');
		expect(await app.handled()).toEqual([{ source: 'table', type: 'select', detail: [1] }]);

		await app.reset();
		await page.locator('#select-from-react').click();
		await expect(page.locator('#table').getByRole('checkbox', { name: 'Select Berry' })).toBeChecked();
		await expect(page.locator('#table').getByRole('checkbox', { name: 'Select Mint' })).not.toBeChecked();
		expect(await app.events()).toEqual([]);
	});

	test('new rows arrays, a longer list and the filter field fire nothing', async ({ app, page }) => {
		await page.locator('#more-rows').click();
		await expect(page.locator('#table').getByRole('status').first()).toContainText('6');
		await page.locator('#table').getByRole('searchbox').fill('oti');
		await expect(page.locator('#table').getByText('No entries match')).toBeVisible();
		await page.locator('#table').getByRole('searchbox').fill('Sa');
		await expect.poll(() => names(page)).toEqual(['Sand']);
		expect(await app.emitted()).toEqual([]);
	});

	test('pagination: a click reports `change` with the page; page from React is silent', async ({ app, page }) => {
		const pager = page.locator('#pager');
		await pager.getByRole('button', { name: 'Next' }).click();
		await expect(page.locator('#data-state')).toContainText('"page":2');
		await expect(pager.getByRole('button', { name: 'Page 2' })).toHaveAttribute('aria-current', 'page');
		expect(await app.handled()).toEqual([{ source: 'pager', type: 'change', detail: 2 }]);
		await app.reset();
		await page.locator('#page-from-react').click();
		await expect(pager.getByRole('button', { name: 'Page 4' })).toHaveAttribute('aria-current', 'page');
		expect(await app.events()).toEqual([]);
	});
});
