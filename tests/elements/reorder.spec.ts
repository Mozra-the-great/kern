import { expect, test, type Locator, type Page } from '@playwright/test';

// SortableList and SelectGrid (#68) in the browser through the built custom elements, which render the
// same Svelte components: names, keyboard flows, focus rules, drag and drop, reduced motion, forced colours.

interface TestWindow {
	events: string[];
	errors: string[];
}

async function ready(page: Page) {
	await page.goto('/tests/elements/pages/reorder.html');
	await page.waitForFunction(() =>
		['k-sortable-list', 'k-select-grid', 'k-live-announcer'].every((tag) =>
			[...document.querySelectorAll(tag)].every((el) => customElements.get(tag) && el.shadowRoot?.firstElementChild)
		)
	);
	await expect(page.locator('#grid').getByRole('option')).toHaveCount(11);
}
const events = (page: Page) => page.evaluate(() => (window as unknown as TestWindow).events);
const clear = (page: Page) => page.evaluate(() => ((window as unknown as TestWindow).events.length = 0));
const names = (host: Locator) =>
	host.getByRole('listitem').evaluateAll((items) => items.map((li) => li.querySelector('.name')?.textContent));
const options = (page: Page, id = 'grid') => page.locator(`#${id}`).getByRole('option');
const option = (page: Page, label: string, id = 'grid') => page.locator(`#${id}`).getByRole('option', { name: label, exact: true });
const property = (page: Page, id: string, name: string) =>
	page.evaluate(([id, name]) => (document.getElementById(id as string) as unknown as Record<string, unknown>)[name as string], [id, name]);
/** Number of items in the first row of a grid, measured like the component does. */
const columnsOf = (page: Page, id: string) =>
	page.evaluate((id) => {
		const tops = [...(document.getElementById(id)?.shadowRoot?.querySelectorAll<HTMLElement>('[role="option"]') ?? [])].map(
			(o) => o.offsetTop
		);
		return tops.filter((t) => t === tops[0]).length;
	}, id);

test.describe('SortableList (#68)', () => {
	test.beforeEach(async ({ page }) => {
		await ready(page);
	});

	test('a named list; every button names its item and contains its visible text (WCAG 2.5.3)', async ({ page }) => {
		const list = page.locator('#list');
		await expect(list.getByRole('list', { name: 'Files' })).toBeVisible();
		await expect(list.getByRole('listitem')).toHaveCount(4);
		await expect(list.getByRole('button', { name: 'Move Report.pdf up' })).toBeDisabled();
		await expect(list.getByRole('button', { name: 'Move Report.pdf down' })).toBeEnabled();
		await expect(list.getByRole('button', { name: 'Move Notes.pdf down' })).toBeDisabled();
		await expect(list.getByRole('button', { name: 'Remove Invoice.pdf' })).toBeEnabled();
		const pairs = await list
			.getByRole('button')
			.evaluateAll((buttons) => buttons.map((b) => [b.textContent ?? '', b.getAttribute('aria-label') ?? '']));
		expect(pairs).toHaveLength(12);
		for (const [visible, name] of pairs) expect(name.toLowerCase(), visible).toContain(visible.trim().toLowerCase());
		// Name, description of the item.
		await expect(list.getByRole('listitem').first()).toContainText('Report.pdf');
		await expect(list.getByRole('listitem').first()).toContainText('1 page');
	});

	test('texts follow the attributes; the German texts also contain the visible text', async ({ page }) => {
		const list = page.locator('#german');
		await expect(list.getByRole('list', { name: 'Dateien' })).toBeVisible();
		await expect(list.getByRole('button', { name: 'Invoice.pdf nach oben verschieben' })).toHaveText('Nach oben');
		await expect(list.getByRole('button', { name: 'Invoice.pdf nach unten verschieben' })).toHaveText('Nach unten');
		await expect(list.getByRole('button', { name: 'Invoice.pdf entfernen' })).toHaveText('Entfernen');
		const pairs = await list
			.getByRole('button')
			.evaluateAll((buttons) => buttons.map((b) => [b.textContent ?? '', b.getAttribute('aria-label') ?? '']));
		for (const [visible, name] of pairs) expect(name.toLowerCase()).toContain(visible.trim().toLowerCase());
	});

	test('keyboard: the focus stays on the pressed button after a move, and moves to the partner at an end', async ({ page }) => {
		const list = page.locator('#list');
		await list.getByRole('button', { name: 'Move Invoice.pdf down' }).focus();
		await page.keyboard.press('Enter');
		expect(await names(list)).toEqual(['Report.pdf', 'Contract.pdf', 'Invoice.pdf', 'Notes.pdf']);
		await expect(list.getByRole('button', { name: 'Move Invoice.pdf down' })).toBeFocused();
		// The last move reaches the end: "down" is disabled now, the focus goes to "up" of the same item.
		await page.keyboard.press('Space');
		expect(await names(list)).toEqual(['Report.pdf', 'Contract.pdf', 'Notes.pdf', 'Invoice.pdf']);
		await expect(list.getByRole('button', { name: 'Move Invoice.pdf down' })).toBeDisabled();
		await expect(list.getByRole('button', { name: 'Move Invoice.pdf up' })).toBeFocused();
		await page.keyboard.press('Enter');
		await page.keyboard.press('Enter');
		expect(await names(list)).toEqual(['Report.pdf', 'Invoice.pdf', 'Contract.pdf', 'Notes.pdf']);
		await expect(list.getByRole('button', { name: 'Move Invoice.pdf up' })).toBeFocused();
		await page.keyboard.press('Enter');
		await expect(list.getByRole('button', { name: 'Move Invoice.pdf up' })).toBeDisabled();
		await expect(list.getByRole('button', { name: 'Move Invoice.pdf down' })).toBeFocused();
		expect(await events(page)).toEqual([
			'list:move:{"from":1,"to":2}',
			'list:move:{"from":2,"to":3}',
			'list:move:{"from":3,"to":2}',
			'list:move:{"from":2,"to":1}',
			'list:move:{"from":1,"to":0}'
		]);
	});

	test('a host that applies the move later keeps the focus rules', async ({ page }) => {
		const list = page.locator('#slow');
		await list.getByRole('button', { name: 'Move Report.pdf down' }).focus();
		await page.keyboard.press('Enter');
		await expect.poll(() => names(list)).toEqual(['Invoice.pdf', 'Report.pdf', 'Contract.pdf', 'Notes.pdf']);
		await expect(list.getByRole('button', { name: 'Move Report.pdf down' })).toBeFocused();
		await list.getByRole('button', { name: 'Move Notes.pdf up' }).focus();
		await page.keyboard.press('Enter');
		await expect(list.getByRole('button', { name: 'Move Notes.pdf up' })).toBeFocused();
	});

	test('a move the host rejects does not take the focus when the items change later', async ({ page }) => {
		const list = page.locator('#stubborn');
		await list.getByRole('button', { name: 'Move One.pdf down' }).focus();
		await page.keyboard.press('Enter');
		expect(await events(page)).toEqual([]);
		await page.locator('#after').focus();
		// The wish to focus the moved item expires after a moment.
		await page.waitForTimeout(1700);
		await page.evaluate(() => {
			const el = document.getElementById('stubborn') as unknown as { items: unknown[] };
			el.items = [...el.items];
		});
		await expect(page.locator('#after')).toBeFocused();
		await expect(list.getByRole('button', { name: 'Move One.pdf down' })).not.toBeFocused();
	});

	test('removing moves the focus to the next item, and to the new last item at the end', async ({ page }) => {
		const list = page.locator('#list');
		await list.getByRole('button', { name: 'Remove Invoice.pdf' }).focus();
		await page.keyboard.press('Enter');
		expect(await names(list)).toEqual(['Report.pdf', 'Contract.pdf', 'Notes.pdf']);
		await expect(list.getByRole('button', { name: 'Remove Contract.pdf' })).toBeFocused();
		await page.keyboard.press('Enter');
		await expect(list.getByRole('button', { name: 'Remove Notes.pdf' })).toBeFocused();
		await page.keyboard.press('Enter');
		await expect(list.getByRole('button', { name: 'Remove Report.pdf' })).toBeFocused();
		expect(await events(page)).toEqual(['list:remove:{"index":1}', 'list:remove:{"index":1}', 'list:remove:{"index":1}']);
	});

	test('announcements are the host job: the live announcer says what happened', async ({ page }) => {
		const list = page.locator('#list');
		await list.getByRole('button', { name: 'Move Report.pdf down' }).click();
		await expect(page.getByRole('status')).toHaveText('Report.pdf moved to position 2 of 4');
	});

	test('removable="false" hides the remove buttons and drag-drop="false" turns dragging off', async ({ page }) => {
		const list = page.locator('#fixed');
		await expect(list.getByRole('button', { name: /^Remove/ })).toHaveCount(0);
		await expect(list.getByRole('button')).toHaveCount(8);
		await expect(list.getByRole('listitem').first()).not.toHaveAttribute('draggable');
		await expect(page.locator('#list').getByRole('listitem').first()).toHaveAttribute('draggable', 'true');
	});

	test('drag and drop moves an item as an extra; dropping on itself does nothing', async ({ page }) => {
		const items = page.locator('#list').getByRole('listitem');
		await items.nth(0).dragTo(items.nth(2));
		expect(await names(page.locator('#list'))).toEqual(['Invoice.pdf', 'Contract.pdf', 'Report.pdf', 'Notes.pdf']);
		expect(await events(page)).toEqual(['list:move:{"from":0,"to":2}']);
		await clear(page);
		await items.nth(1).dragTo(items.nth(1));
		expect(await events(page)).toEqual([]);
	});

	test('the buttons are reachable by Tab in item order, disabled ones are skipped', async ({ page }) => {
		await page.locator('#before').focus();
		await page.keyboard.press('Tab');
		const list = page.locator('#list');
		await expect(list.getByRole('button', { name: 'Move Report.pdf down' })).toBeFocused();
		await page.keyboard.press('Tab');
		await expect(list.getByRole('button', { name: 'Remove Report.pdf' })).toBeFocused();
		await page.keyboard.press('Tab');
		await expect(list.getByRole('button', { name: 'Move Invoice.pdf up' })).toBeFocused();
	});

	test('reduced motion: no transition runs when an item moves or is dragged over', async ({ page }) => {
		const item = page.locator('#list').getByRole('listitem').first();
		const duration = () => item.evaluate((el) => getComputedStyle(el).transitionDuration);
		expect((await duration()).split(',').some((d) => d.trim() !== '0s')).toBe(true);
		await page.emulateMedia({ reducedMotion: 'reduce' });
		expect((await duration()).split(',').every((d) => d.trim() === '0s')).toBe(true);
		await page.locator('#list').getByRole('button', { name: 'Move Report.pdf down' }).click();
		const running = await page.evaluate(
			() =>
				(document.getElementById('list')?.shadowRoot?.querySelectorAll('*') ?? []).length &&
				[...(document.getElementById('list')?.shadowRoot?.querySelectorAll('*') ?? [])].flatMap((n) => n.getAnimations()).length
		);
		expect(running).toBe(0);
	});

	test('forced colours: the items keep a visible border', async ({ page }) => {
		await page.emulateMedia({ forcedColors: 'active' });
		const item = page.locator('#list').getByRole('listitem').first();
		const text = await page.evaluate(() => {
			const probe = document.createElement('div');
			probe.style.cssText = 'forced-color-adjust:none;color:CanvasText';
			document.body.append(probe);
			const color = getComputedStyle(probe).color;
			probe.remove();
			return color;
		});
		await expect(item).toHaveCSS('border-top-color', text);
		await expect(item).toHaveCSS('border-top-width', '1px');
	});

	test('no errors on the page', async ({ page }) => {
		expect(await page.evaluate(() => (window as unknown as TestWindow).errors)).toEqual([]);
	});
});

test.describe('SelectGrid (#68)', () => {
	test.beforeEach(async ({ page }) => {
		await ready(page);
	});

	test('a multi-select listbox with one Tab stop and a name per picture', async ({ page }) => {
		const grid = page.locator('#grid').getByRole('listbox', { name: 'Pages' });
		await expect(grid).toHaveAttribute('aria-multiselectable', 'true');
		await expect(options(page)).toHaveCount(11);
		await expect(option(page, 'Page 3')).toHaveAttribute('aria-selected', 'false');
		await expect(page.locator('#grid [role="option"][tabindex="0"]')).toHaveCount(1);
		await expect(page.locator('#grid [role="option"][tabindex="-1"]')).toHaveCount(10);
		await expect(option(page, 'Page 1')).toHaveAttribute('tabindex', '0');
		// The picture is decorative, the name comes from the option.
		await expect(page.locator('#grid img').first()).toHaveAttribute('alt', '');
		// Reorderable: every option points to the hint about Alt+arrow.
		await expect(option(page, 'Page 1')).toHaveAccessibleDescription('Hold Alt and press an arrow key to move the focused item.');
		await expect(option(page, 'Page 1', 'plain')).not.toHaveAttribute('aria-describedby');
	});

	test('arrow keys move by one and by one row, measured from the layout; Home, End, PageUp, PageDown', async ({ page }) => {
		const columns = await columnsOf(page, 'grid');
		expect(columns).toBeGreaterThan(2);
		await page.locator('#german').getByRole('button', { name: 'Notes.pdf entfernen' }).focus();
		await page.keyboard.press('Tab');
		await expect(option(page, 'Page 1')).toBeFocused();
		await page.keyboard.press('ArrowRight');
		await expect(option(page, 'Page 2')).toBeFocused();
		await page.keyboard.press('ArrowDown');
		await expect(option(page, `Page ${2 + columns}`)).toBeFocused();
		await page.keyboard.press('ArrowUp');
		await expect(option(page, 'Page 2')).toBeFocused();
		await page.keyboard.press('ArrowUp');
		await expect(option(page, 'Page 2')).toBeFocused();
		await page.keyboard.press('ArrowLeft');
		await page.keyboard.press('ArrowLeft');
		await expect(option(page, 'Page 1')).toBeFocused();
		await page.keyboard.press('End');
		await expect(option(page, 'Page 11')).toBeFocused();
		await page.keyboard.press('ArrowRight');
		await expect(option(page, 'Page 11')).toBeFocused();
		await page.keyboard.press('Home');
		await expect(option(page, 'Page 1')).toBeFocused();
		await page.keyboard.press('PageDown');
		await expect(option(page, 'Page 11')).toBeFocused();
		await page.keyboard.press('PageUp');
		await expect(option(page, 'Page 1')).toBeFocused();
		// The roving tabindex follows the focus.
		await page.keyboard.press('ArrowRight');
		await expect(option(page, 'Page 2')).toHaveAttribute('tabindex', '0');
		await expect(option(page, 'Page 1')).toHaveAttribute('tabindex', '-1');
		// A change of width changes the row length.
		await page.locator('#wide').evaluate((el) => (el.style.width = '300px'));
		const narrow = await columnsOf(page, 'grid');
		expect(narrow).toBeLessThan(columns);
		await option(page, 'Page 2').focus();
		await page.keyboard.press('ArrowDown');
		await expect(option(page, `Page ${2 + narrow}`)).toBeFocused();
		// Moving the focus never changes the selection.
		expect(await events(page)).toEqual([]);
	});

	test('Space and Enter toggle; Shift extends; Ctrl+A selects all; Escape clears', async ({ page }) => {
		await option(page, 'Page 2').focus();
		await page.keyboard.press('Space');
		await expect(option(page, 'Page 2')).toHaveAttribute('aria-selected', 'true');
		await page.keyboard.press('ArrowRight');
		await page.keyboard.press('Enter');
		await expect(option(page, 'Page 3')).toHaveAttribute('aria-selected', 'true');
		await page.keyboard.press('Enter');
		await expect(option(page, 'Page 3')).toHaveAttribute('aria-selected', 'false');
		// Shift+arrow selects the range from the place where it started.
		await page.keyboard.press('ArrowRight');
		await page.keyboard.press('ArrowRight');
		await expect(option(page, 'Page 5')).toBeFocused();
		await page.keyboard.press('Shift+ArrowRight');
		await page.keyboard.press('Shift+ArrowRight');
		expect(await property(page, 'grid', 'selected')).toEqual([5, 6, 7]);
		await page.keyboard.press('Shift+ArrowLeft');
		expect(await property(page, 'grid', 'selected')).toEqual([5, 6]);
		await page.keyboard.press('Shift+Space');
		expect(await property(page, 'grid', 'selected')).toEqual([5, 6]);
		// A plain arrow key starts a new range: Shift+Space selects from there.
		await page.keyboard.press('ArrowRight');
		await page.keyboard.press('ArrowRight');
		await page.keyboard.press('Shift+Space');
		expect(await property(page, 'grid', 'selected')).toEqual([8]);
		await page.keyboard.press('Control+a');
		expect(await property(page, 'grid', 'selected')).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
		await expect(page.locator('#grid [aria-selected="true"]')).toHaveCount(11);
		await page.keyboard.press('Escape');
		expect(await property(page, 'grid', 'selected')).toEqual([]);
		await expect(page.locator('#grid [aria-selected="true"]')).toHaveCount(0);
		const log = await events(page);
		expect(log[0]).toBe('grid:change:[2]');
		expect(log).toContain('grid:change:[5,6,7]');
		expect(log.at(-1)).toBe('grid:change:[]');
		// Escape with nothing selected, and Ctrl+A twice, fire nothing more.
		const count = log.length;
		await page.keyboard.press('Escape');
		await page.keyboard.press('Control+a');
		await page.keyboard.press('Control+a');
		expect((await events(page)).length).toBe(count + 1);
	});

	test('a click toggles, Shift+click extends; selected from code stays silent', async ({ page }) => {
		await option(page, 'Page 4').click();
		await option(page, 'Page 7').click({ modifiers: ['Shift'] });
		expect(await property(page, 'grid', 'selected')).toEqual([4, 5, 6, 7]);
		await option(page, 'Page 5').click();
		expect(await property(page, 'grid', 'selected')).toEqual([4, 6, 7]);
		await clear(page);
		await page.evaluate(() => Object.assign(document.getElementById('grid') as HTMLElement, { selected: [1, 9] }));
		await expect(option(page, 'Page 9')).toHaveAttribute('aria-selected', 'true');
		await expect(option(page, 'Page 4')).toHaveAttribute('aria-selected', 'false');
		expect(await events(page)).toEqual([]);
	});

	test('the selection shows by a check mark and a heavier outline, not by colour alone', async ({ page }) => {
		const marks = (label: string, id = 'plain') =>
			option(page, label, id).evaluate((el) => {
				const check = el.querySelector('.check') as HTMLElement;
				return {
					glyph: getComputedStyle(check, '::after').content,
					border: getComputedStyle(check).borderTopWidth,
					fill: getComputedStyle(check).backgroundColor
				};
			});
		const on = await marks('Page 2');
		const off = await marks('Page 1');
		expect(on.glyph).not.toBe(off.glyph);
		expect(off.glyph).toMatch(/none|normal/);
		expect(on.fill).not.toBe(off.fill);
	});

	test('forced colours: a selected item gets a 4px Highlight border and a Highlight check', async ({ page }) => {
		await page.emulateMedia({ forcedColors: 'active' });
		const system = await page.evaluate(() => {
			const probe = document.createElement('div');
			probe.style.cssText = 'forced-color-adjust:none;background:Highlight;color:CanvasText';
			document.body.append(probe);
			const cs = getComputedStyle(probe);
			const out = { highlight: cs.backgroundColor, text: cs.color };
			probe.remove();
			return out;
		});
		const on = option(page, 'Page 2', 'plain');
		const off = option(page, 'Page 1', 'plain');
		await expect(on).toHaveCSS('border-top-width', '4px');
		await expect(on).toHaveCSS('border-top-color', system.highlight);
		await expect(off).toHaveCSS('border-top-width', '2px');
		await expect(off).toHaveCSS('border-top-color', system.text);
		await expect(on.locator('.check')).toHaveCSS('background-color', system.highlight);
	});

	test('Alt+arrow moves the focused item and the focus goes with it; a plain grid ignores it', async ({ page }) => {
		const columns = await columnsOf(page, 'grid');
		await option(page, 'Page 3').focus();
		await page.keyboard.press('Alt+ArrowRight');
		await expect(options(page).nth(3)).toBeFocused();
		await expect(options(page).nth(3)).toHaveAttribute('aria-label', 'Page 3');
		await page.keyboard.press('Alt+ArrowLeft');
		await page.keyboard.press('Alt+ArrowLeft');
		await expect(options(page).nth(1)).toHaveAttribute('aria-label', 'Page 3');
		await expect(options(page).nth(1)).toBeFocused();
		await page.keyboard.press('Alt+ArrowDown');
		await expect(options(page).nth(1 + columns)).toHaveAttribute('aria-label', 'Page 3');
		await expect(options(page).nth(1 + columns)).toBeFocused();
		// Up past the first row and left past the first item: nothing happens.
		await page.keyboard.press('Home');
		await page.keyboard.press('Alt+ArrowUp');
		await page.keyboard.press('Alt+ArrowLeft');
		const log = await events(page);
		expect(log).toEqual([
			'grid:move:{"from":2,"to":3}',
			'grid:move:{"from":3,"to":2}',
			'grid:move:{"from":2,"to":1}',
			`grid:move:{"from":1,"to":${1 + columns}}`
		]);
		// Selected keys follow their item.
		await option(page, 'Page 3').press('Space');
		await page.keyboard.press('Alt+ArrowRight');
		expect(await property(page, 'grid', 'selected')).toEqual([3]);
		await expect(option(page, 'Page 3')).toHaveAttribute('aria-selected', 'true');
		// A grid without reorderable ignores Alt+arrow and the browser keeps the key.
		await clear(page);
		await option(page, 'Page 3', 'plain').focus();
		await page.keyboard.press('Alt+ArrowRight');
		expect(await events(page)).toEqual([]);
		await expect(option(page, 'Page 3', 'plain')).toBeFocused();
		await expect(options(page, 'plain').nth(2)).toHaveAttribute('aria-label', 'Page 3');
	});

	test('drag and drop reorders an extra; only a reorderable grid is draggable', async ({ page }) => {
		await expect(options(page).first()).toHaveAttribute('draggable', 'true');
		await expect(options(page, 'plain').first()).not.toHaveAttribute('draggable');
		await options(page).nth(0).dragTo(options(page).nth(3));
		await expect(options(page).nth(3)).toHaveAttribute('aria-label', 'Page 1');
		expect(await events(page)).toEqual(['grid:move:{"from":0,"to":3}']);
	});

	test('the focus returns to the Tab stop when the focused item goes away', async ({ page }) => {
		await option(page, 'Page 11').focus();
		await page.evaluate(() => {
			const el = document.getElementById('grid') as unknown as { items: unknown[] };
			el.items = el.items.slice(0, 9);
		});
		await expect(options(page)).toHaveCount(9);
		await expect(option(page, 'Page 9')).toBeFocused();
		await expect(page.locator('#grid [role="option"][tabindex="0"]')).toHaveCount(1);
	});

	test('one Tab stop: Tab leaves the grid, Shift+Tab comes back to the item that was focused last', async ({ page }) => {
		await option(page, 'Page 2', 'rtlgrid').focus();
		await page.keyboard.press('Tab');
		await expect(page.locator('#after')).toBeFocused();
		await page.keyboard.press('Shift+Tab');
		await expect(option(page, 'Page 2', 'rtlgrid')).toBeFocused();
	});

	test('right to left: ArrowLeft goes to the next item', async ({ page }) => {
		await option(page, 'Page 1', 'rtlgrid').focus();
		await page.keyboard.press('ArrowLeft');
		await expect(option(page, 'Page 2', 'rtlgrid')).toBeFocused();
		await page.keyboard.press('ArrowRight');
		await expect(option(page, 'Page 1', 'rtlgrid')).toBeFocused();
		await page.keyboard.press('Alt+ArrowLeft');
		await expect(options(page, 'rtlgrid').nth(1)).toHaveAttribute('aria-label', 'Page 1');
	});

	test('reduced motion: no transition on the items', async ({ page }) => {
		const duration = () => option(page, 'Page 1').evaluate((el) => getComputedStyle(el).transitionDuration);
		expect((await duration()).split(',').some((d) => d.trim() !== '0s')).toBe(true);
		await page.emulateMedia({ reducedMotion: 'reduce' });
		expect((await duration()).split(',').every((d) => d.trim() === '0s')).toBe(true);
		await option(page, 'Page 1').click();
		const running = await page.evaluate(
			() => [...(document.getElementById('grid')?.shadowRoot?.querySelectorAll('*') ?? [])].flatMap((n) => n.getAnimations()).length
		);
		expect(running).toBe(0);
	});

	test('the items are at least 44px big and the grid wraps on a narrow screen', async ({ page }) => {
		const box = await option(page, 'Page 1', 'plain').boundingBox();
		expect(box?.width).toBeGreaterThanOrEqual(44);
		expect(box?.height).toBeGreaterThanOrEqual(44);
		await page.setViewportSize({ width: 320, height: 700 });
		expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
	});

	test('no errors on the page', async ({ page }) => {
		expect(await page.evaluate(() => (window as unknown as TestWindow).errors)).toEqual([]);
	});
});
