import { expect, test } from './react-app.js';

// #35: elements come and go with React: unmounting a root leaves nothing behind (listeners, scroll lock, open dialogs),
// mounting it again works and does not double the handlers, and keyed reorders move the elements without losing state.

const ALL = ['forms', 'overlays', 'toasts', 'nav', 'data', 'lists', 'keyed'] as const;

test('unmounting every root removes its elements, listeners and scroll lock; mounting again works once', async ({ app, page }) => {
	await app.open([]);
	// One round first: Svelte adds a few page-wide listeners once, for good (form reset handling), and React one
	// `selectionchange` listener. What counts is that a second round leaves the page exactly as the first one did.
	for (const name of ALL) await app.mount(name);
	await page.waitForFunction(() => document.querySelectorAll('k-input').length > 0);
	for (const name of ALL) await app.unmount(name);
	await expect.poll(() => page.locator('k-input').count()).toBe(0);
	const baseline = await app.listeners();
	for (const name of ALL) await app.mount(name);
	await page.waitForFunction(() =>
		[...document.querySelectorAll('*')].filter((el) => el.tagName.startsWith('K-')).every((el) => el.shadowRoot?.firstElementChild)
	);
	expect((await app.listeners()).length).toBeGreaterThan(baseline.length);

	// Leave a modal and a popover open and a toast on screen: the harshest unmount.
	await page.locator('#open-modal').click();
	await expect(page.locator('#modal dialog')).toBeVisible();
	expect(await page.locator('html').evaluate((el) => el.hasAttribute('data-k-scroll-lock'))).toBe(true);
	await page.evaluate(() => window.kern?.toast({ message: 'Still here', duration: 0 }));
	await expect(page.locator('#toaster').getByText('Still here')).toHaveCount(1);

	for (const name of ALL) await app.unmount(name);
	await expect.poll(() => page.locator('*').evaluateAll((els) => els.filter((el) => el.tagName.startsWith('K-')).length)).toBe(0);
	await expect.poll(() => app.listeners()).toEqual(baseline);
	expect(await page.locator('html').evaluate((el) => [el.hasAttribute('data-k-scroll-lock'), el.style.overflow])).toEqual([false, '']);
	expect(await page.evaluate(() => document.querySelectorAll('dialog').length)).toBe(0);
	expect(await page.evaluate(() => window.harness.refs.user)).toBeNull();

	// Mounted again: the form works, every user action reaches React exactly once.
	await app.mount('forms');
	await expect(page.locator('#user')).toBeAttached();
	await app.reset();
	await app.control('user').fill('dora');
	await app.control('user').press('Tab');
	await expect(page.locator('#state')).toContainText('"user":"dora"');
	await app.settle();
	expect(await app.handled()).toEqual([{ source: 'user', type: 'change', detail: 'dora' }]);
	expect(await app.emitted()).toHaveLength(1);
	// The toast raised before the unmount waits in the page-wide store; a new toaster shows it, once.
	await app.mount('toasts');
	await expect(page.locator('#toaster').getByText('Still here')).toHaveCount(1);
	await app.unmount('toasts');
	await app.unmount('forms');
	await expect.poll(() => app.listeners()).toEqual(baseline);
});

test('mounting and unmounting in a loop does not accumulate listeners or elements', async ({ app, page }) => {
	await app.open([]);
	await app.mount('overlays');
	const once = await app.listeners();
	await app.unmount('overlays');
	const empty = await app.listeners();
	for (let i = 0; i < 5; i++) {
		await app.mount('overlays');
		await page.locator('#open-drawer').click();
		await expect(page.locator('#drawer dialog')).toBeVisible();
		await page.keyboard.press('Escape');
		await expect(page.locator('#drawer dialog')).toBeHidden();
		expect(await app.listeners()).toEqual(once);
		await app.unmount('overlays');
		await expect.poll(() => app.listeners()).toEqual(empty);
	}
	expect(await page.evaluate(() => document.querySelectorAll('*').length)).toBeLessThan(40);
});

test('a keyed list reorders and drops elements without losing their state or firing events', async ({ app, page }) => {
	await app.open(['keyed']);
	const order = () => page.locator('#keyed > li').evaluateAll((items) => items.map((li) => li.id));
	expect(await order()).toEqual(['row-a', 'row-b', 'row-c']);
	await app.control('field-b').fill('typed in b');
	await app.control('field-b').press('Tab');
	await expect(page.locator('#keyed-state')).toContainText('typed in b');
	await app.reset();

	// React moves the DOM nodes: disconnected and connected again in one task.
	const field = page.locator('#field-b');
	await field.evaluate((el) => el.setAttribute('data-mark', 'same node'));
	await page.locator('#reverse').click();
	await expect.poll(order).toEqual(['row-c', 'row-b', 'row-a']);
	await app.settle();
	await expect(app.control('field-a')).toHaveValue('first');
	await expect(app.control('field-b')).toHaveValue('typed in b');
	await expect(app.control('field-c')).toHaveValue('third');
	await expect(field).toHaveAttribute('data-mark', 'same node');
	expect(await app.events()).toEqual([]);
	// The moved elements still work: the right row changes.
	await app.control('field-a').fill('moved a');
	await app.control('field-a').press('Tab');
	await expect(page.locator('#keyed-state')).toContainText('"id":"a","value":"moved a"');
	expect(await app.handled()).toEqual([{ source: 'field-a', type: 'change', detail: 'moved a' }]);

	await app.reset();
	await page.locator('#drop-first').click();
	await expect.poll(order).toEqual(['row-b', 'row-a']);
	await expect(page.locator('#field-c')).toHaveCount(0);
	expect(await app.events()).toEqual([]);

	// An element that is removed and rendered again starts from its props, and reports nothing while it does.
	await page.locator('#hide-toggle').click();
	await expect(page.locator('#toggle')).toHaveCount(0);
	await page.locator('#hide-toggle').click();
	await expect(page.locator('#toggle')).toHaveCount(1);
	await expect(app.control('toggle')).toBeChecked();
	expect(await app.events()).toEqual([]);
});
