/**
 * A scrolling box that holds nothing the keyboard can focus (#137, axe `scrollable-region-focusable`, WCAG 2.1.1): the
 * panels of a `k-resizable` and the wrapper of a `k-table` / `k-data-table` (the text-only counterpart of the overlays in
 * a11y-overlays.spec.ts, #132). While such a box overflows it is a tab stop with `role="region"` and a name (the caption
 * of the table, the catalogue text without one; the `data-label` of a panel, "Panel n of m" without one) and a focus
 * ring in `--k-focus`; the arrow keys and PageDown scroll it. Otherwise there is no extra stop.
 *
 * Page: tests/elements/pages/forced-colors.html, the boxes come from `openScrolling` (a11y-shared.ts).
 */
import { expect, test, type Locator, type Page } from '@playwright/test';
import { ALL, openPage, openScrolling, SCROLL_STOPS, THEMES, type Scrolling } from './a11y-shared.js';

const KINDS: Scrolling[] = ['table', 'data-table', 'resizable'];
const regions = (page: Page): Locator => page.locator('#scrolling [role=region]');

/** Resolved focus colour of the theme, the outline of a ring and whether the browser shows it for keyboard focus. */
const ringOf = (region: Locator): Promise<{ visible: boolean; style: string; width: number; color: string; token: string }> =>
	region.evaluate((el) => {
		const c = getComputedStyle(el);
		const probe = document.createElement('span');
		probe.style.color = 'var(--k-focus)';
		document.documentElement.append(probe);
		const token = getComputedStyle(probe).color;
		probe.remove();
		return {
			visible: el.matches(':focus-visible'),
			style: c.outlineStyle,
			width: parseFloat(c.outlineWidth),
			color: c.outlineColor,
			token
		};
	});

for (const theme of THEMES) {
	for (const kind of KINDS) {
		test(`${kind} in ${theme}: Tab reaches the scrolling box, it has a named ring in --k-focus, the keys scroll it`, async ({ page }) => {
			await openPage(page, ALL, { theme, width: 1280, height: 640 });
			await openScrolling(page, kind, 'horizontal');
			const all = regions(page);
			await expect(all).toHaveCount(SCROLL_STOPS[kind]);
			const first = all.first();
			// the name: the caption of the table, the text of the catalogue without one, the label of the panel
			const names = await all.evaluateAll((els) => els.map((el) => el.getAttribute('aria-label') ?? el.getAttribute('aria-labelledby')));
			expect(names.every((n) => n !== null && n !== '')).toBe(true);
			await expect(
				page.getByRole('region', { name: { table: 'Inventory', 'data-table': 'Scrollable table', resizable: 'Notes' }[kind] })
			).toHaveCount(1);
			if (kind === 'resizable') await expect(page.getByRole('region', { name: 'Panel 2 of 2' })).toHaveCount(1);

			await page.locator('#before-scrolling').focus();
			await page.keyboard.press('Tab');
			await expect(first, 'Tab reached the scrolling box').toBeFocused();
			const ring = await ringOf(first);
			expect(ring.visible, 'the ring is shown after keyboard focus').toBe(true);
			expect(ring.style).not.toBe('none');
			expect(ring.width).toBeGreaterThan(0);
			expect(ring.color, 'the ring is drawn in --k-focus').toBe(ring.token);

			if (kind === 'resizable') {
				await expect.poll(() => first.evaluate((el) => el.scrollTop)).toBe(0);
				await page.keyboard.press('PageDown');
				await expect.poll(() => first.evaluate((el) => el.scrollTop), { message: 'PageDown scrolls the panel' }).toBeGreaterThan(50);
				const before = await first.evaluate((el) => el.scrollTop);
				await page.keyboard.press('ArrowDown');
				await expect.poll(() => first.evaluate((el) => el.scrollTop), { message: 'ArrowDown scrolls it further' }).toBeGreaterThan(before);
				await page.keyboard.press('End');
				await expect.poll(() => first.evaluate((el) => el.scrollHeight - el.clientHeight - el.scrollTop)).toBeLessThan(2);
			} else {
				await expect.poll(() => first.evaluate((el) => el.scrollLeft)).toBe(0);
				await page.keyboard.press('ArrowRight');
				await expect
					.poll(() => first.evaluate((el) => el.scrollLeft), { message: 'ArrowRight scrolls the table sideways' })
					.toBeGreaterThan(0);
				await page.keyboard.press('ArrowLeft');
				await expect.poll(() => first.evaluate((el) => el.scrollLeft), { message: 'ArrowLeft scrolls it back' }).toBe(0);
			}
			await expect(first, 'the focus stays on the box').toBeFocused();

			// no extra stop: Tab leaves a table for the next control; a resizable has its handle, then the second panel
			await page.keyboard.press('Tab');
			if (kind === 'resizable') {
				await expect(page.locator('#scrolling-element [role=separator]')).toBeFocused();
				await page.keyboard.press('Tab');
				await expect(all.nth(1)).toBeFocused();
				await page.keyboard.press('Tab');
			}
			await expect(page.locator('#after-scrolling')).toBeFocused();
			await page.keyboard.press('Shift+Tab');
			await expect(all.last(), 'Shift+Tab comes back to the box').toBeFocused();
		});
	}
}

test.describe('no extra tab stop', () => {
	test('a wide table with a sortable header or a selection column, and a panel with a button, has no stop of its own', async ({ page }) => {
		await openPage(page, ALL, { width: 1280, height: 640 });
		await openScrolling(page, 'table');
		// a sortable header is a way in: the stop goes, and Tab goes to the header button
		await page.evaluate(() => {
			const table = document.querySelector('#scrolling-element') as HTMLElement & {
				columns: { key: string; label: string; sortable?: boolean }[];
			};
			table.columns = table.columns.map((c, i) => ({ ...c, sortable: i === 0 }));
		});
		await expect(regions(page)).toHaveCount(0);
		await page.locator('#before-scrolling').focus();
		await page.keyboard.press('Tab');
		await expect(page.locator('#scrolling-element button')).toBeFocused();
		await page.keyboard.press('Tab');
		await expect(page.locator('#after-scrolling')).toBeFocused();
		// the same for a data table with checkboxes
		await page.evaluate(() => document.querySelector('#scrolling')?.remove());
		await openScrolling(page, 'data-table');
		await page.evaluate(() => ((document.querySelector('#scrolling-element') as HTMLElement & { selectable: boolean }).selectable = true));
		await expect(regions(page)).toHaveCount(0);
		// a button in one panel of a resizable: that panel has no stop, the other keeps its own
		await page.evaluate(() => document.querySelector('#scrolling')?.remove());
		await openScrolling(page, 'resizable');
		await page.evaluate(() =>
			document.querySelector('#scrolling-element [data-panel="Notes"]')?.insertAdjacentHTML('beforeend', '<k-button>Reset</k-button>')
		);
		await expect(regions(page)).toHaveCount(1);
		await expect(page.getByRole('region', { name: 'Panel 2 of 2' })).toHaveCount(1);
	});

	test('the page tables and resizable (content fits) have no region and no stop', async ({ page }) => {
		await openPage(page, ALL, { width: 1280, height: 640 });
		for (const sel of ['#table', '#datatable', '#resizable']) {
			expect(await page.locator(`${sel} [role=region]`).count(), `${sel} has no region`).toBe(0);
			expect(await page.locator(`${sel} .k-table[tabindex], ${sel} .panel[tabindex]`).count(), `${sel} has no stop`).toBe(0);
		}
	});

	test('a stacked table on a phone is no scroller: the cards have no stop', async ({ page }) => {
		await openPage(page, ALL, { width: 320, height: 640 });
		// the table must not get a stop, so it is built by hand (stacking is the default), not with openScrolling
		await page.evaluate(() => {
			const table = document.createElement('k-table') as HTMLElement & { columns: unknown; rows: unknown };
			table.id = 'stacked';
			table.setAttribute('caption', 'Inventory');
			table.columns = Array.from({ length: 8 }, (_, i) => ({ key: `c${i}`, label: `Column number ${i + 1}` }));
			table.rows = [Object.fromEntries(Array.from({ length: 8 }, (_, i) => [`c${i}`, `Row 1 value ${i + 1}`]))];
			document.querySelector('main')?.append(table);
		});
		await expect(page.locator('#stacked .k-table.stack')).toBeVisible();
		await page.evaluate(() => new Promise((r) => setTimeout(r, 200)));
		expect(await page.locator('#stacked [role=region]').count()).toBe(0);
		expect(await page.locator('#stacked .k-table[tabindex]').count()).toBe(0);
	});
});
