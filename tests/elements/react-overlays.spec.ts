import { expect, test } from './react-app.js';

// #35: modal, drawer and popover whose `open` is React state (StrictMode, development build). `close`, `cancel` and
// `toggle` report the user's action only; React's own `open={false}` closes silently.

test.beforeEach(async ({ app }) => {
	await app.open(['overlays']);
});

const locked = (html: Element) => html.hasAttribute('data-k-scroll-lock');

test('a modal opens from React state, takes focus, hosts React children and closes on Escape with close + cancel', async ({
	app,
	page
}) => {
	expect(await app.emitted()).toEqual([]);
	await page.locator('#open-modal').click();
	await expect(page.locator('#modal dialog')).toBeVisible();
	await expect(page.locator('#modal-input')).toBeFocused();
	expect(await page.locator('html').evaluate(locked)).toBe(true);
	// Opening from React is not a user close: nothing was reported.
	expect(await app.emitted()).toEqual([]);

	// React-rendered light DOM inside the dialog stays alive and controlled.
	await page.locator('#modal-input').fill('too many');
	await expect(page.locator('#modal-input')).toHaveValue('too many');

	await page.keyboard.press('Escape');
	await expect(page.locator('#modal dialog')).toBeHidden();
	expect((await app.handled()).map((h) => h.type)).toEqual(['cancel', 'close']);
	expect((await app.emitted()).map((e) => e.type)).toEqual(['cancel', 'close']);
	await expect(page.locator('#overlay-state')).toContainText('"modal":false');
	expect(await page.locator('html').evaluate(locked)).toBe(false);
	await expect(page.locator('#open-modal')).toBeFocused();
	// React kept the text the user typed; reopening shows it.
	await page.locator('#open-modal').click();
	await expect(page.locator('#modal-input')).toHaveValue('too many');
});

test('closing from React (footer slot button, body button, state) reports nothing', async ({ app, page }) => {
	for (const close of [
		() => page.locator('#modal-cancel').click(),
		() => page.locator('#modal-confirm').click(),
		() => page.locator('#close-modal-from-react').evaluate((b: HTMLElement) => b.click())
	]) {
		await page.locator('#open-modal').click();
		await expect(page.locator('#modal dialog')).toBeVisible();
		await app.reset();
		await close();
		await expect(page.locator('#modal dialog')).toBeHidden();
		await app.settle();
		expect(await app.events()).toEqual([]);
		expect(await app.handled()).toEqual([]);
		expect(await page.locator('html').evaluate(locked)).toBe(false);
	}
});

test('a click on the backdrop and the close button ask to close like Escape', async ({ app, page }) => {
	await page.locator('#open-modal').click();
	await expect(page.locator('#modal dialog')).toBeVisible();
	await page.mouse.click(2, 2);
	await expect(page.locator('#modal dialog')).toBeHidden();
	expect((await app.handled()).map((h) => h.type)).toEqual(['cancel', 'close']);

	await app.reset();
	await page.locator('#open-modal').click();
	await page.locator('#modal').getByRole('button', { name: 'Close' }).click();
	await expect(page.locator('#modal dialog')).toBeHidden();
	expect((await app.handled()).map((h) => h.type)).toEqual(['cancel', 'close']);
});

test('dismissible=false: Escape and the backdrop do nothing, only React closes it', async ({ app, page }) => {
	await page.locator('#open-blocking').click();
	await expect(page.locator('#blocking dialog')).toBeVisible();
	await expect(page.locator('#blocking').getByRole('button', { name: 'Close' })).toHaveCount(0);
	await app.reset();
	await page.keyboard.press('Escape');
	await page.mouse.click(2, 2);
	await app.settle();
	await expect(page.locator('#blocking dialog')).toBeVisible();
	expect(await app.events()).toEqual([]);
	await expect(page.locator('#blocking')).toHaveAttribute('open', '');
	await page.locator('#blocking-resolve').click();
	await expect(page.locator('#blocking dialog')).toBeHidden();
	expect(await app.events()).toEqual([]);
	expect(await page.locator('html').evaluate(locked)).toBe(false);
});

test('preventDefault() in a React oncancel keeps the modal open each time', async ({ app, page }) => {
	await page.locator('#open-guarded').click();
	await expect(page.locator('#guarded dialog')).toBeVisible();
	await page.keyboard.press('Escape');
	await expect(page.locator('#guarded-cancels')).toHaveText('1');
	await page.locator('#guarded').getByRole('button', { name: 'Close' }).click();
	await expect(page.locator('#guarded-cancels')).toHaveText('2');
	await expect(page.locator('#guarded dialog')).toBeVisible();
	expect((await app.handled()).map((h) => h.type)).toEqual(['cancel', 'cancel']);
	expect((await app.emitted()).filter((e) => e.type === 'close')).toEqual([]);
	await page.locator('#guarded-discard').click();
	await expect(page.locator('#guarded dialog')).toBeHidden();
	expect((await app.handled()).map((h) => h.type)).toEqual(['cancel', 'cancel']);
});

test('closeOnBackdrop={false} (a property) keeps the modal open on a backdrop click; Escape still closes it', async ({ app, page }) => {
	await page.locator('#open-sticky').click();
	await expect(page.locator('#sticky dialog')).toBeVisible();
	await page.mouse.click(2, 2);
	await app.settle();
	await expect(page.locator('#sticky dialog')).toBeVisible();
	expect(await app.emitted()).toEqual([]);
	await page.keyboard.press('Escape');
	await expect(page.locator('#sticky dialog')).toBeHidden();
	expect((await app.emitted()).map((e) => e.type)).toEqual(['cancel', 'close']);
});

test('a drawer follows React state and reports Escape', async ({ app, page }) => {
	await page.locator('#open-drawer').click();
	await expect(page.locator('#drawer dialog')).toBeVisible();
	await page.locator('#drawer-apply').click();
	await expect(page.locator('#drawer dialog')).toBeHidden();
	expect(await app.emitted()).toEqual([]);

	await page.locator('#open-drawer').click();
	await expect(page.locator('#drawer dialog')).toBeVisible();
	await page.keyboard.press('Escape');
	await expect(page.locator('#drawer dialog')).toBeHidden();
	expect((await app.handled()).map((h) => h.type)).toEqual(['close']);
	await expect(page.locator('#overlay-state')).toContainText('"drawer":false');
	expect(await page.locator('html').evaluate(locked)).toBe(false);
});

test('a popover reports user toggles; open={state} from React is silent', async ({ app, page }) => {
	const trigger = page.locator('#pop').getByRole('button', { name: 'Details' });
	await page.locator('#open-pop-from-react').click();
	await expect(page.locator('#pop-body')).toBeVisible();
	expect(await app.emitted()).toEqual([]);

	await page.keyboard.press('Escape');
	await expect(page.locator('#pop-body')).toBeHidden();
	await expect(page.locator('#overlay-state')).toContainText('"pop":false');
	expect((await app.handled()).filter((h) => h.source === 'pop')).toEqual([{ source: 'pop', type: 'toggle', detail: false }]);

	await app.reset();
	await trigger.click();
	await expect(page.locator('#pop-body')).toBeVisible();
	expect(await app.handled()).toEqual([{ source: 'pop', type: 'toggle', detail: true }]);
	await trigger.click();
	await expect(page.locator('#pop-body')).toBeHidden();
	expect((await app.handled()).map((h) => h.detail)).toEqual([true, false]);
});
