/**
 * Keyboard operation of every interactive element (#25), part 2 of the keyboard suite: each element is
 * operated with the keys of its WAI-ARIA Authoring Practices pattern and nothing else (no mouse), on
 * tests/elements/pages/forced-colors.html in the Code theme. The tab order, the focus ring in every theme,
 * the overlays and the focus trap are in a11y-keyboard.spec.ts.
 *
 * Each test names the element and the keys. Reading values goes through the host element's properties, the
 * same ones an app reads; events are the custom events of the element (custom-elements.json).
 */
import { expect, test, type Page } from '@playwright/test';
import { ALL, openPage } from './a11y-shared.js';

test.beforeEach(async ({ page }) => {
	await openPage(page, ALL, { theme: 'code' });
});

/** A property of the host element. */
const prop = <T>(page: Page, sel: string, name: string): Promise<T> =>
	page.evaluate(([s, n]) => (document.querySelector(s as string) as unknown as Record<string, unknown>)[n as string], [
		sel,
		name
	] as const) as Promise<T>;

/** Counts the events of a host from now on; `events` reads the details. */
async function listen(page: Page, sel: string, ...names: string[]): Promise<void> {
	await page.evaluate(
		([s, list]) => {
			const w = window as unknown as { __ev: Record<string, unknown[]> };
			w.__ev ??= {};
			for (const n of list as string[]) {
				const seen: unknown[] = [];
				w.__ev[`${s as string}:${n}`] = seen;
				document.querySelector(s as string)?.addEventListener(n, (e) => seen.push((e as CustomEvent).detail ?? null));
			}
		},
		[sel, names] as const
	);
}
const events = (page: Page, sel: string, name: string): Promise<unknown[]> =>
	page.evaluate((k) => (window as unknown as { __ev: Record<string, unknown[]> }).__ev[k] ?? [], `${sel}:${name}`);

/** The deepest focused element, as `tag#id.class`. */
const focused = (page: Page): Promise<string> =>
	page.evaluate(() => {
		let el: Element | null = document.activeElement;
		while (el?.shadowRoot?.activeElement) el = el.shadowRoot.activeElement;
		return el
			? `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}.${typeof el.className === 'string' ? el.className.trim().split(/\s+/)[0] : ''}`
			: 'none';
	});

const key = (page: Page, ...keys: string[]): Promise<void> =>
	keys.reduce((p, k) => p.then(() => page.keyboard.press(k)), Promise.resolve());

test.describe('actions', () => {
	test('k-button: Enter and Space click it, a link button follows with Enter, a disabled one is out of reach', async ({ page }) => {
		await listen(page, '#btn-primary', 'click');
		await page.locator('#btn-primary button').focus();
		await key(page, 'Enter');
		expect(await events(page, '#btn-primary', 'click')).toHaveLength(1);
		await key(page, 'Space');
		expect(await events(page, '#btn-primary', 'click')).toHaveLength(2);
		await page.locator('#btn-link a').focus();
		await key(page, 'Enter');
		expect(await page.evaluate(() => location.hash)).toBe('#target');
		await expect(page.locator('#btn-disabled button')).toBeDisabled();
		await expect(page.locator('#btn-loading button')).toHaveAttribute('aria-busy', 'true');
	});

	test('k-icon-button and k-link: Enter and Space (button), Enter (link)', async ({ page }) => {
		await listen(page, '#ib', 'click');
		await page.locator('#ib button').focus();
		await key(page, 'Enter', 'Space');
		expect(await events(page, '#ib', 'click')).toHaveLength(2);
		await page.locator('#link a').focus();
		await key(page, 'Enter');
		expect(await page.evaluate(() => location.hash)).toBe('#target');
	});

	test('k-copy-button: Enter and Space copy (or report that copying failed)', async ({ page }) => {
		await listen(page, '#copy', 'copy', 'copy-error');
		await page.locator('#copy button').focus();
		await key(page, 'Enter');
		await expect
			.poll(async () => (await events(page, '#copy', 'copy')).length + (await events(page, '#copy', 'copy-error')).length)
			.toBe(1);
		await key(page, 'Space');
		await expect
			.poll(async () => (await events(page, '#copy', 'copy')).length + (await events(page, '#copy', 'copy-error')).length)
			.toBe(2);
	});

	test('k-download-button: Enter starts the download', async ({ page }) => {
		await listen(page, '#download', 'download');
		await page.locator('#download button').focus();
		const download = page.waitForEvent('download');
		await key(page, 'Enter');
		expect((await download).suggestedFilename()).toBe('hello.txt');
		expect(await events(page, '#download', 'download')).toHaveLength(1);
	});

	test('k-theme-toggle: Enter and Space switch the theme', async ({ page }) => {
		await listen(page, '#theme-toggle', 'change');
		const before = await page.locator('#tbox').getAttribute('data-theme');
		await page.locator('#theme-toggle button').focus();
		await key(page, 'Enter');
		await expect.poll(async () => page.locator('#tbox').getAttribute('data-theme')).not.toBe(before);
		await key(page, 'Space');
		expect((await events(page, '#theme-toggle', 'change')).length).toBe(2);
	});

	test('k-card: a link card follows with Enter, a button card fires action with Enter and Space', async ({ page }) => {
		await listen(page, '#card-button', 'action');
		await page.locator('#card-button .primary').focus();
		await key(page, 'Enter', 'Space');
		expect(await events(page, '#card-button', 'action')).toHaveLength(2);
		await page.locator('#card-link .primary').focus();
		await key(page, 'Enter');
		expect(await page.evaluate(() => location.hash)).toBe('#target');
	});

	test('k-tile: a link tile follows with Enter', async ({ page }) => {
		await page.locator('#tile a').focus();
		await key(page, 'Enter');
		expect(await page.evaluate(() => location.hash)).toBe('#pdf');
	});

	test('k-code, k-code-block and k-terminal: the copy button works with Enter', async ({ page, context }) => {
		await context.grantPermissions(['clipboard-read', 'clipboard-write']);
		for (const sel of ['#code-block', '#codeblock']) {
			await listen(page, sel, 'copy', 'copy-error');
			await page.locator(`${sel} button`).first().focus();
			await key(page, 'Enter');
			await expect
				.poll(async () => (await events(page, sel, 'copy')).length + (await events(page, sel, 'copy-error')).length, { message: sel })
				.toBe(1);
		}
		// the terminal has no event: its button says so
		const copy = page.locator('#terminal button.copy');
		const before = await copy.textContent();
		await copy.focus();
		await key(page, 'Enter');
		await expect.poll(() => copy.textContent(), { message: 'the label of the terminal copy button' }).not.toBe(before);
	});
});

test.describe('fields', () => {
	test('k-input and k-textarea: typing sets the value, Tab leaves', async ({ page }) => {
		await listen(page, '#input', 'change');
		await page.locator('#input input').focus();
		await page.keyboard.type('Mara');
		await key(page, 'Tab');
		expect(await prop(page, '#input', 'value')).toBe('Mara');
		await page.locator('#textarea textarea').focus();
		await page.keyboard.type('Hello');
		await key(page, 'Tab');
		expect(await prop(page, '#textarea', 'value')).toBe('Hello');
		expect(await page.evaluate(() => document.querySelector('#textarea')?.matches(':focus-within'))).toBe(false);
	});

	test('k-select: the arrow keys change the value', async ({ page }) => {
		await listen(page, '#select', 'change');
		await page.locator('#select select').focus();
		await key(page, 'ArrowDown');
		expect(await prop(page, '#select', 'value')).toBe('l');
		await key(page, 'ArrowUp', 'ArrowUp');
		expect(await prop(page, '#select', 'value')).toBe('s');
		expect((await events(page, '#select', 'change')).length).toBeGreaterThan(0);
	});

	test('k-checkbox and k-switch: Space toggles, Tab moves on', async ({ page }) => {
		await page.locator('#check-off input').focus();
		await key(page, 'Space');
		expect(await prop(page, '#check-off', 'checked')).toBe(true);
		await key(page, 'Space');
		expect(await prop(page, '#check-off', 'checked')).toBe(false);
		await page.locator('#switch-off input').focus();
		await key(page, 'Space');
		expect(await prop(page, '#switch-off', 'checked')).toBe(true);
		await expect(page.locator('#switch-off [role=switch]')).toHaveAttribute('aria-checked', 'true');
		await key(page, 'Space');
		expect(await prop(page, '#switch-off', 'checked')).toBe(false);
	});

	test('k-radio-group: the arrow keys move and check, skipping the disabled option, and wrap', async ({ page }) => {
		await page.locator('#radio input:checked').focus();
		await key(page, 'ArrowDown');
		expect(await prop(page, '#radio', 'value')).toBe('express');
		await key(page, 'ArrowDown');
		expect(await prop(page, '#radio', 'value')).toBe('standard');
		await key(page, 'ArrowUp');
		expect(await prop(page, '#radio', 'value')).toBe('express');
		// only the checked radio is in the tab order
		await key(page, 'Tab');
		expect(await page.evaluate(() => document.querySelector('#radio')?.matches(':focus-within'))).toBe(false);
	});

	test('k-segmented-control: the arrow keys select a segment', async ({ page }) => {
		await page.locator('#segmented input:checked').focus();
		await key(page, 'ArrowRight');
		expect(await prop(page, '#segmented', 'value')).toBe('map');
		await key(page, 'ArrowLeft', 'ArrowLeft');
		expect(await prop(page, '#segmented', 'value')).toBe('grid');
	});

	test('k-slider: arrows, Home, End and PageUp', async ({ page }) => {
		await page.locator('#slider input').focus();
		await key(page, 'ArrowRight');
		expect(Number(await prop(page, '#slider', 'value'))).toBe(41);
		await key(page, 'ArrowLeft', 'ArrowLeft');
		expect(Number(await prop(page, '#slider', 'value'))).toBe(39);
		await key(page, 'End');
		expect(Number(await prop(page, '#slider', 'value'))).toBe(100);
		await key(page, 'Home');
		expect(Number(await prop(page, '#slider', 'value'))).toBe(0);
		await key(page, 'PageUp');
		expect(Number(await prop(page, '#slider', 'value'))).toBeGreaterThan(1);
	});

	test('k-number-input: ArrowUp and ArrowDown step, PageUp steps ten, the bounds hold', async ({ page }) => {
		await page.locator('#number input[role=spinbutton]').focus();
		await key(page, 'ArrowUp');
		expect(Number(await prop(page, '#number', 'value'))).toBe(3);
		await key(page, 'ArrowDown', 'ArrowDown', 'ArrowDown');
		expect(Number(await prop(page, '#number', 'value'))).toBe(0);
		await key(page, 'PageUp');
		expect(Number(await prop(page, '#number', 'value'))).toBe(10);
		await key(page, 'ArrowUp');
		expect(Number(await prop(page, '#number', 'value'))).toBe(10);
		await expect(page.locator('#number [role=spinbutton]')).toHaveAttribute('aria-valuenow', '10');
	});

	test('k-pin-input: typing fills the cells and moves on, Backspace moves back', async ({ page }) => {
		await listen(page, '#pin', 'complete');
		await page.locator('#pin input').first().focus();
		await page.keyboard.type('1234');
		expect(await prop(page, '#pin', 'value')).toBe('1234');
		expect(await events(page, '#pin', 'complete')).toHaveLength(1);
		await key(page, 'Backspace');
		expect(await prop(page, '#pin', 'value')).toBe('123');
	});

	test('k-rating: the arrow keys set the value', async ({ page }) => {
		await page.locator('#rating input:checked').focus();
		await key(page, 'ArrowRight');
		expect(Number(await prop(page, '#rating', 'value'))).toBe(4);
		await key(page, 'ArrowLeft', 'ArrowLeft');
		expect(Number(await prop(page, '#rating', 'value'))).toBe(2);
	});

	test('k-tag-input: Enter adds a tag, Backspace in the empty field removes the last one', async ({ page }) => {
		await listen(page, '#taginput', 'change');
		await page.locator('#taginput input[role=combobox]').focus();
		await page.keyboard.type('Holo');
		await key(page, 'Enter');
		expect(await prop(page, '#taginput', 'value')).toEqual(['Gel', 'Matt', 'Holo']);
		await key(page, 'Backspace');
		expect(await prop(page, '#taginput', 'value')).toEqual(['Gel', 'Matt']);
	});

	test('k-combobox: typing filters, ArrowDown and Enter pick, Escape closes', async ({ page }) => {
		const input = page.locator('#combobox input[role=combobox]');
		await input.focus();
		await page.keyboard.type('an');
		await expect(page.locator('#combobox .popup')).toBeVisible();
		await key(page, 'ArrowDown', 'Enter');
		expect(await prop(page, '#combobox', 'value')).toBe('banana');
		await expect(page.locator('#combobox .popup')).toBeHidden();
		await key(page, 'ArrowDown');
		await expect(page.locator('#combobox .popup')).toBeVisible();
		await key(page, 'Escape');
		await expect(page.locator('#combobox .popup')).toBeHidden();
		await expect(input).toBeFocused();
	});

	test('k-file-drop: Enter and Space open the file chooser', async ({ page }) => {
		const button = page.locator('#filedrop button').first();
		await button.focus();
		const first = page.waitForEvent('filechooser');
		await key(page, 'Enter');
		await first;
		const second = page.waitForEvent('filechooser');
		await key(page, 'Space');
		await second;
	});
});

test.describe('navigation', () => {
	test('k-tabs: arrows move and select, Home and End jump, disabled is skipped, one tab stop', async ({ page }) => {
		await listen(page, '#tabs', 'change');
		const tab = (i: number) => page.locator('#tabs [role=tab]').nth(i);
		await tab(0).focus();
		await expect(tab(0)).toHaveAttribute('aria-selected', 'true');
		await key(page, 'ArrowRight');
		await expect(tab(1)).toBeFocused();
		await expect(tab(1)).toHaveAttribute('aria-selected', 'true');
		await expect(page.locator('#tabs [data-tab=two]')).toBeVisible();
		await expect(page.locator('#tabs [data-tab=one]')).toBeHidden();
		await key(page, 'ArrowRight');
		await expect(tab(0)).toBeFocused();
		await key(page, 'End');
		await expect(tab(1)).toBeFocused();
		await key(page, 'Home');
		await expect(tab(0)).toBeFocused();
		await key(page, 'ArrowLeft');
		await expect(tab(1)).toBeFocused();
		// roving tabindex: Tab goes into the panel or on, not to the next tab
		await key(page, 'Tab');
		expect(await focused(page)).not.toContain('tab');
		expect((await events(page, '#tabs', 'change')).length).toBeGreaterThan(2);
	});

	test('k-tab-links: the links are reached in order and Enter follows one', async ({ page }) => {
		await page.locator('#tablinks a').nth(1).focus();
		await key(page, 'Enter');
		expect(await page.evaluate(() => location.hash)).toBe('#two');
	});

	test('k-skip-link: it is the first tab stop, shows itself, and Enter moves the focus to the target', async ({ page }) => {
		await page.keyboard.press('Tab');
		await expect(page.locator('#skip a')).toBeFocused();
		await expect(page.locator('#skip a')).toBeVisible();
		await page.keyboard.press('Enter');
		await expect(page.locator('#main')).toBeFocused();
		await page.keyboard.press('Tab');
		expect(
			await page.evaluate(() => document.querySelector('#main')?.contains(document.activeElement)),
			'the next stop is inside the target'
		).toBe(true);
	});

	test('k-navbar and k-breadcrumb: links follow with Enter', async ({ page }) => {
		await page.locator('#navbar nav a').nth(1).focus();
		await page.keyboard.press('Enter');
		expect(await page.evaluate(() => location.hash)).toBe('#b');
		await page.locator('#breadcrumb a').first().focus();
		await expect(page.locator('#breadcrumb a').first()).toBeFocused();
		await page.keyboard.press('Enter');
		expect(await page.evaluate(() => location.hash)).toBe('');
	});

	test('k-pagination: Enter on a page button changes the page, Enter on next goes on', async ({ page }) => {
		await listen(page, '#pagination', 'change');
		await page
			.getByRole('button', { name: /^(Page )?4$/ })
			.first()
			.focus();
		await key(page, 'Enter');
		expect(Number(await prop(page, '#pagination', 'page'))).toBe(4);
		await page.locator('#pagination').getByRole('button', { name: /next/i }).first().focus();
		await key(page, 'Space');
		expect(Number(await prop(page, '#pagination', 'page'))).toBe(5);
	});

	test('k-stepper: Enter on a step goes there', async ({ page }) => {
		await listen(page, '#stepper', 'step');
		await page.locator('#stepper button').first().focus();
		await key(page, 'Enter');
		expect(await events(page, '#stepper', 'step')).toHaveLength(1);
	});

	test('k-tree-view: arrows move, Right expands, Left collapses, Home and End jump, Enter selects', async ({ page }) => {
		const item = (id: string) => page.locator(`#tree [data-id="${id}"]`);
		await page.locator('#tree [role=treeitem][tabindex="0"]').focus();
		await key(page, 'Home');
		await expect(item('photos')).toBeFocused();
		await key(page, 'ArrowDown');
		await expect(item('2025')).toBeFocused();
		await key(page, 'ArrowLeft');
		await expect(item('photos')).toBeFocused();
		await key(page, 'ArrowLeft');
		await expect(item('photos')).toHaveAttribute('aria-expanded', 'false');
		await key(page, 'ArrowRight');
		await expect(item('photos')).toHaveAttribute('aria-expanded', 'true');
		await key(page, 'End');
		await expect(item('notes')).toBeFocused();
		await listen(page, '#tree', 'select');
		await key(page, 'Enter');
		await expect(item('notes')).toHaveAttribute('aria-selected', 'true');
	});

	test('k-accordion, k-accordion-item and k-collapsible: Enter and Space open and close', async ({ page }) => {
		const closed = page.locator('#accordion summary').nth(1);
		await closed.focus();
		await key(page, 'Enter');
		await expect(page.locator('#accordion details').nth(1)).toHaveAttribute('open', '');
		await key(page, 'Space');
		await expect(page.locator('#accordion details').nth(1)).not.toHaveAttribute('open', '');
		const trigger = page.locator('#collapsible-closed .trigger');
		await listen(page, '#collapsible-closed', 'toggle');
		await trigger.focus();
		await key(page, 'Enter');
		await expect(trigger).toHaveAttribute('aria-expanded', 'true');
		await key(page, 'Space');
		await expect(trigger).toHaveAttribute('aria-expanded', 'false');
	});

	test('k-carousel: the arrow keys, Home and End move the slides', async ({ page }) => {
		await listen(page, '#carousel', 'change');
		await page.locator('#carousel .track').focus();
		await key(page, 'ArrowRight');
		await expect.poll(() => prop(page, '#carousel', 'index')).toBe(1);
		await key(page, 'End');
		await expect.poll(() => prop(page, '#carousel', 'index')).toBe(2);
		await key(page, 'Home');
		await expect.poll(() => prop(page, '#carousel', 'index')).toBe(0);
		await page.locator('#carousel .nav[aria-disabled=false]').focus();
		await key(page, 'Enter');
		await expect.poll(() => prop(page, '#carousel', 'index')).toBe(1);
	});

	test('k-alert and k-tag: Enter on the close button dismisses and removes', async ({ page }) => {
		await listen(page, '#alert-warn', 'dismiss');
		await page.locator('#alert-warn .x').focus();
		await key(page, 'Enter');
		expect(await events(page, '#alert-warn', 'dismiss')).toHaveLength(1);
		await listen(page, '#tag-removable', 'remove');
		await page.locator('#tag-removable button').focus();
		await key(page, 'Enter');
		expect(await events(page, '#tag-removable', 'remove')).toHaveLength(1);
	});
});

test.describe('data and content', () => {
	test('k-table: Enter on a sortable header sorts, a second Enter reverses', async ({ page }) => {
		const th = page.locator('#table th').first();
		await page.locator('#table thead button').first().focus();
		await key(page, 'Enter');
		await expect(th).toHaveAttribute('aria-sort', 'ascending');
		await key(page, 'Space');
		await expect(th).toHaveAttribute('aria-sort', 'descending');
	});

	test('k-data-table: sort with Enter, select a row with Space, filter by typing', async ({ page }) => {
		await listen(page, '#datatable', 'sort', 'select');
		await page.locator('#datatable thead button').first().focus();
		await key(page, 'Enter');
		expect((await events(page, '#datatable', 'sort')).length).toBe(1);
		const row = page.locator('#datatable tbody input[type=checkbox]').first();
		await row.focus();
		await key(page, 'Space');
		expect((await events(page, '#datatable', 'select')).length).toBe(1);
		await page.locator('#datatable input[type=search]').focus();
		await page.keyboard.type('Gol');
		await expect(page.locator('#datatable tbody tr')).toHaveCount(1);
	});

	test('k-heatmap: arrows move between days, Enter picks one, Escape hides the tooltip', async ({ page }) => {
		await listen(page, '#heatmap', 'select');
		const cell = page.locator('#heatmap [role=gridcell][tabindex="0"]');
		await cell.focus();
		const first = await cell.getAttribute('aria-label');
		// the tab stop starts on the last day, the end of the grid
		await page.keyboard.press('ArrowLeft');
		const second = await page.locator('#heatmap [role=gridcell]:focus').getAttribute('aria-label');
		expect(second).not.toBe(first);
		await page.keyboard.press('ArrowDown');
		expect(await page.locator('#heatmap [role=gridcell]:focus').getAttribute('aria-label')).not.toBe(second);
		await page.keyboard.press('Enter');
		expect(await events(page, '#heatmap', 'select')).toHaveLength(1);
		await page.keyboard.press('Escape');
		await expect(page.locator('#heatmap [role=tooltip].shown, #heatmap .tip.shown')).toHaveCount(0);
	});

	test('k-history-bar: arrows, Home and End move between the bars', async ({ page }) => {
		const bar = (i: number) => page.locator(`#history [role=gridcell][data-i="${i}"]`);
		await page.locator('#history [role=gridcell][tabindex="0"]').focus();
		await page.keyboard.press('End');
		await expect(bar(4)).toBeFocused();
		await page.keyboard.press('ArrowLeft');
		await expect(bar(3)).toBeFocused();
		await page.keyboard.press('Home');
		await expect(bar(0)).toBeFocused();
		await page.keyboard.press('ArrowRight');
		await expect(bar(1)).toBeFocused();
	});

	test('k-marquee: the pause button is a tab stop and Enter stops and restarts the movement (without reduced motion)', async ({ page }) => {
		await openPage(page, ALL, { theme: 'code', reducedMotion: 'no-preference', width: 320, height: 640 });
		const pause = page.locator('#marquee .pause');
		await expect(pause).toBeVisible();
		await pause.focus();
		const track = page.locator('#marquee .track');
		const playState = () => track.evaluate((el) => getComputedStyle(el).animationPlayState);
		expect(await playState()).toBe('running');
		await page.keyboard.press('Enter');
		await expect.poll(playState).toBe('paused');
		await expect(pause).toHaveAccessibleName(/play|resume|start/i);
		await page.keyboard.press('Space');
		await expect.poll(playState).toBe('running');
	});

	test('k-scroll-area: the arrow keys scroll the focused region', async ({ page }) => {
		const scroller = page.locator('#scroll .scroller');
		await scroller.focus();
		await key(page, 'ArrowDown', 'ArrowDown');
		// the browser scrolls with the keys in a short animation of its own
		await expect.poll(() => scroller.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
	});

	test('k-resizable: arrows resize the panels, Shift+arrow resizes more, Home and End go to the limits', async ({ page }) => {
		await listen(page, '#resizable', 'change');
		const handle = page.locator('#resizable .handle');
		const now = async (): Promise<number> => Number(await handle.getAttribute('aria-valuenow'));
		await handle.focus();
		const start = await now();
		await key(page, 'ArrowRight');
		const one = await now();
		expect(one).toBeGreaterThan(start);
		await key(page, 'Shift+ArrowRight');
		expect(await now()).toBeGreaterThan(one + 1);
		await key(page, 'Home');
		const home = await now();
		await key(page, 'End');
		expect(await now()).toBeGreaterThan(home);
		expect((await events(page, '#resizable', 'change')).length).toBeGreaterThan(2);
	});

	test('k-sortable-list: the move buttons work with Enter and keep the focus', async ({ page }) => {
		await listen(page, '#sortable', 'move');
		const down = page.locator('#sortable').getByRole('button', { name: 'Move Invoice.pdf down' });
		await down.focus();
		await key(page, 'Enter');
		expect(await events(page, '#sortable', 'move')).toEqual([{ from: 0, to: 1 }]);
		// the item moved: the focus stays on a move button of that item
		expect(await focused(page)).toContain('button');
	});

	test('k-select-grid: arrows move the focus, Space selects, Alt+arrow reorders', async ({ page }) => {
		await listen(page, '#selectgrid', 'change', 'move');
		const option = (label: string) => page.locator('#selectgrid').getByRole('option', { name: label, exact: true });
		await option('Page 1').focus();
		await key(page, 'ArrowRight');
		await expect(option('Page 2')).toBeFocused();
		await key(page, 'ArrowLeft');
		await expect(option('Page 1')).toBeFocused();
		await key(page, 'Space');
		await expect(option('Page 1')).toHaveAttribute('aria-selected', 'true');
		expect((await events(page, '#selectgrid', 'change')).length).toBe(1);
		await key(page, 'Alt+ArrowRight');
		expect(await events(page, '#selectgrid', 'move')).toEqual([{ from: 0, to: 1 }]);
	});
});
