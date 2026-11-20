/**
 * Overlays with the keyboard only (WCAG 2.1.2 No Keyboard Trap, 2.4.3 Focus Order, #25), part 3 of the keyboard
 * suite. Modal dialogs (Modal, Drawer, CommandPalette) are the one place where Tab is trapped on purpose:
 * focus moves in, Tab and Shift+Tab cycle inside, Escape closes, and the focus returns to the opener.
 * Every other overlay (popover, menus, pickers, tooltip, toasts, the phone menu) closes with Escape, hands the focus
 * back to its trigger, and lets Tab leave. Page: tests/elements/pages/forced-colors.html, Code theme.
 */
import { expect, test, type Page } from '@playwright/test';
import { ALL, openPage } from './a11y-shared.js';

/**
 * True when the focus is inside the element: its shadow tree, its light DOM children, and what is slotted into it.
 * (`:focus-within` on a host does not see focus that sits in a shadow root of a child.)
 */
const inside = (page: Page, sel: string): Promise<boolean> =>
	page.evaluate((s) => {
		const host = document.querySelector(s);
		let el: Element | null = document.activeElement;
		while (el?.shadowRoot?.activeElement) el = el.shadowRoot.activeElement;
		while (el) {
			if (el === host) return true;
			const root: Node = el.getRootNode();
			el = el.assignedSlot ?? el.parentElement ?? (root instanceof ShadowRoot ? root.host : null);
		}
		return false;
	}, sel);

/** The deepest focused element as `tag#id.class` (through shadow roots). */
const deepFocus = (page: Page): Promise<string> =>
	page.evaluate(() => {
		let el: Element | null = document.activeElement;
		while (el?.shadowRoot?.activeElement) el = el.shadowRoot.activeElement;
		return el
			? `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}.${typeof el.className === 'string' ? el.className.trim().split(/\s+/)[0] : ''}`
			: 'none';
	});

/** Collects the `detail` of an event of a host in window.__sel. */
const collect = (page: Page, sel: string, event: string): Promise<void> =>
	page.evaluate(
		([s, e]) => {
			const w = window as unknown as { __sel: unknown[] };
			w.__sel = [];
			document.querySelector(s as string)?.addEventListener(e as string, (ev) => w.__sel.push((ev as CustomEvent).detail));
		},
		[sel, event] as const
	);
const collected = (page: Page): Promise<number> => page.evaluate(() => (window as unknown as { __sel: unknown[] }).__sel.length);

/** Two frames: the scroll that a focus() causes is reported in the next frame, and a scroll outside a menu closes it. */
const frames = (page: Page): Promise<void> =>
	page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))));

test.beforeEach(async ({ page }) => {
	await openPage(page, ALL, { theme: 'code' });
});

test.describe('modal dialogs: focus moves in, is trapped, Escape closes, focus goes back', () => {
	const dialogs: { name: string; opener: string; host: string; inner: string }[] = [
		{ name: 'k-modal', opener: '#open-modal button', host: '#modal', inner: '#modal dialog[open]' },
		{ name: 'k-drawer', opener: '#open-drawer button', host: '#drawer', inner: '#drawer dialog[open]' },
		{ name: 'k-command-palette', opener: '#open-palette button', host: '#palette', inner: '#palette dialog[open]' }
	];
	for (const d of dialogs) {
		test(`${d.name}: Enter on the opener opens it, Tab and Shift+Tab stay inside, Escape closes and returns the focus`, async ({
			page
		}) => {
			const opener = page.locator(d.opener);
			await opener.focus();
			await page.keyboard.press('Enter');
			await expect(page.locator(d.inner)).toBeVisible();
			expect(await inside(page, d.host), 'the focus moved into the dialog').toBe(true);
			// The native modal dialog makes the page behind inert: Tab cycles through the dialog and, after its last
			// control, passes through the browser's own UI (document.activeElement is the body for one press). The
			// focus must never land on the page behind.
			const stops = new Set<string>();
			for (const press of ['Tab', 'Shift+Tab']) {
				for (let i = 0; i < 9; i++) {
					await page.keyboard.press(press);
					const where = await deepFocus(page);
					const ok = (await inside(page, d.host)) || where.startsWith('body');
					expect(ok, `after ${press} ${i + 1} the focus is on ${where}, behind the dialog`).toBe(true);
					stops.add(where);
				}
			}
			expect(stops.size, 'Tab moves between the controls of the dialog').toBeGreaterThan(1);
			// put the focus back in the dialog (a press that left it for the browser UI)
			if (!(await inside(page, d.host))) await page.keyboard.press('Tab');
			expect(await inside(page, d.host)).toBe(true);
			await page.keyboard.press('Escape');
			await expect(page.locator(d.inner)).toBeHidden();
			await expect(opener, 'the focus is back on the opener').toBeFocused();
		});
	}

	test('k-modal: with dismissible="false" Escape does nothing and the app closes it', async ({ page }) => {
		await page.evaluate(() => {
			const m = document.querySelector('#modal') as HTMLElement & { dismissible: boolean; open: boolean };
			m.dismissible = false;
			m.open = true;
		});
		await expect(page.locator('#modal dialog[open]')).toBeVisible();
		await page.keyboard.press('Escape');
		await expect(page.locator('#modal dialog[open]')).toBeVisible();
		expect(await inside(page, '#modal')).toBe(true);
		await page.evaluate(() => ((document.querySelector('#modal') as HTMLElement & { open: boolean }).open = false));
		await expect(page.locator('#modal dialog[open]')).toBeHidden();
	});

	test('k-command-palette: the hotkey opens it, typing filters, ArrowDown and Enter choose, the focus returns', async ({ page }) => {
		await page.locator('#btn-primary button').focus();
		await collect(page, '#palette', 'select');
		await page.keyboard.press('Control+k');
		await expect(page.locator('#palette dialog[open]')).toBeVisible();
		await page.keyboard.type('sh');
		await page.keyboard.press('ArrowDown');
		await page.keyboard.press('Enter');
		await expect(page.locator('#palette dialog[open]')).toBeHidden();
		expect(await collected(page)).toBe(1);
		await expect(page.locator('#btn-primary button')).toBeFocused();
	});
});

test.describe('non-modal overlays: Escape closes them and the focus goes back, Tab never traps', () => {
	test('k-popover: Enter opens, Tab goes into the panel, Escape closes, Tab out of the panel closes quietly', async ({ page }) => {
		const trigger = page.locator('#popover .trigger');
		await trigger.focus();
		await page.keyboard.press('Enter');
		await expect(page.locator('#popover .panel')).toBeVisible();
		expect(await deepFocus(page), 'the focus moves into the panel').toContain('input');
		await page.keyboard.press('Escape');
		await expect(page.locator('#popover .panel')).toBeHidden();
		await expect(trigger).toBeFocused();
		await page.keyboard.press('Space');
		await expect(page.locator('#popover .panel')).toBeVisible();
		for (let i = 0; i < 4; i++) await page.keyboard.press('Tab');
		await expect(page.locator('#popover .panel')).toBeHidden();
		expect(await inside(page, '#popover'), 'the focus left the popover').toBe(false);
	});

	test('k-dropdown-menu: Enter opens, arrows skip disabled items and separators, Home and End jump, Escape returns the focus', async ({
		page
	}) => {
		const trigger = page.locator('#dropdown .trigger');
		const item = (name: string) => page.locator('#dropdown').getByRole('menuitem', { name });
		await collect(page, '#dropdown', 'select');
		await trigger.focus();
		await page.keyboard.press('Enter');
		await expect(item('Rename')).toBeFocused();
		await page.keyboard.press('ArrowDown');
		await expect(item('Delete'), 'Copy is disabled and skipped').toBeFocused();
		await page.keyboard.press('ArrowDown');
		await expect(item('Rename'), 'wraps').toBeFocused();
		await page.keyboard.press('End');
		await expect(item('Delete')).toBeFocused();
		await page.keyboard.press('Home');
		await expect(item('Rename')).toBeFocused();
		await page.keyboard.press('Escape');
		await expect(page.locator('#dropdown .menu')).toBeHidden();
		await expect(trigger).toBeFocused();
		await page.keyboard.press('ArrowDown');
		await expect(item('Rename'), 'ArrowDown on the button opens it too').toBeFocused();
		await page.keyboard.press('Enter');
		await expect(page.locator('#dropdown .menu')).toBeHidden();
		await expect(trigger).toBeFocused();
		expect(await collected(page)).toBe(1);
		await page.keyboard.press('Enter');
		await expect(page.locator('#dropdown .menu')).toBeVisible();
		await page.keyboard.press('Tab');
		await expect(page.locator('#dropdown .menu'), 'Tab closes the menu').toBeHidden();
		expect(await inside(page, '#dropdown')).toBe(false);
	});

	test('k-dropdown-menu: a click opens and closes it (the window listener must see through the shadow root)', async ({ page }) => {
		const trigger = page.locator('#dropdown .trigger');
		await trigger.click();
		await expect(page.locator('#dropdown .menu')).toBeVisible();
		await trigger.click();
		await expect(page.locator('#dropdown .menu')).toBeHidden();
		await trigger.click();
		await page.locator('#dropdown').getByRole('menuitem', { name: 'Rename' }).click();
		await expect(page.locator('#dropdown .menu')).toBeHidden();
		await trigger.click();
		await expect(page.locator('#dropdown .menu')).toBeVisible();
		await page.locator('#btn-primary button').click();
		await expect(page.locator('#dropdown .menu'), 'a click outside closes it').toBeHidden();
	});

	test('k-context-menu: Shift+F10 opens it, arrows move, Escape closes and returns the focus to the area', async ({ page }) => {
		const area = page.locator('#context .k-context-area');
		await area.focus();
		await frames(page);
		await page.keyboard.press('Shift+F10');
		await expect(page.locator('#context .menu')).toBeVisible();
		await expect(page.locator('#context [role=menuitem]').first()).toBeFocused();
		await page.keyboard.press('ArrowDown');
		await expect(page.locator('#context').getByRole('menuitem', { name: /Rename/ })).toBeFocused();
		await page.keyboard.press('Escape');
		await expect(page.locator('#context .menu')).toBeHidden();
		await expect(area).toBeFocused();
		await page.keyboard.press('ContextMenu');
		await expect(page.locator('#context .menu')).toBeVisible();
		await page.keyboard.press('Tab');
		await expect(page.locator('#context .menu'), 'Tab closes the menu').toBeHidden();
	});

	test('k-date-picker: Enter opens the calendar, arrows and PageDown move the day, Enter picks, Escape returns the focus', async ({
		page
	}) => {
		const open = page.locator('#date .cal');
		await open.focus();
		await page.keyboard.press('Enter');
		await expect(page.locator('#date .dialog')).toBeVisible();
		const day = () => page.locator('#date [role=gridcell][tabindex="0"]');
		await expect(day()).toBeFocused();
		await expect(day()).toContainText('19');
		await page.keyboard.press('ArrowRight');
		await expect(day()).toContainText('20');
		await page.keyboard.press('ArrowDown');
		await expect(day()).toContainText('27');
		await page.keyboard.press('ArrowLeft');
		await expect(day()).toContainText('26');
		await page.keyboard.press('PageDown');
		await expect(page.locator('#date .dialog')).toContainText(/December/);
		await page.keyboard.press('Enter');
		await expect(page.locator('#date .dialog')).toBeHidden();
		expect(String(await page.evaluate(() => (document.querySelector('#date') as HTMLElement & { value: string }).value))).toMatch(
			/^2026-12-\d\d$/
		);
		await expect(open).toBeFocused();
		await page.keyboard.press('Enter');
		await expect(page.locator('#date .dialog')).toBeVisible();
		await page.keyboard.press('Escape');
		await expect(page.locator('#date .dialog')).toBeHidden();
		await expect(open).toBeFocused();
	});

	test('k-color-picker: Enter opens the panel, Tab moves inside, Escape closes and returns the focus', async ({ page }) => {
		const open = page.locator('#color .swatch-btn');
		await open.focus();
		await page.keyboard.press('Enter');
		await expect(page.locator('#color .panel')).toBeVisible();
		await page.keyboard.press('Tab');
		expect(await inside(page, '#color')).toBe(true);
		await page.keyboard.press('Escape');
		await expect(page.locator('#color .panel')).toBeHidden();
		await expect(open).toBeFocused();
	});

	test('k-tag-input: Escape closes the suggestions and keeps the focus in the field', async ({ page }) => {
		const input = page.locator('#taginput input[role=combobox]');
		await input.focus();
		await page.keyboard.type('H');
		await expect(page.locator('#taginput .popup')).toBeVisible();
		await page.keyboard.press('Escape');
		await expect(page.locator('#taginput .popup')).toBeHidden();
		await expect(input).toBeFocused();
	});

	test('k-tooltip: it shows on keyboard focus and Escape hides it while the focus stays', async ({ page }) => {
		await page.keyboard.press('Shift');
		const trigger = page.locator('#tooltip #dropdown .trigger');
		await trigger.focus();
		await expect(page.locator('#tooltip .tip.shown')).toBeVisible();
		// the trigger sits in another element's shadow root: the text reaches it as aria-description
		await expect(trigger).toHaveAttribute('aria-description', 'More actions');
		await page.keyboard.press('Escape');
		await expect(page.locator('#tooltip .tip.shown')).toBeHidden();
		await expect(trigger).toBeFocused();
	});

	test('k-navbar: the menu button opens the panel with Enter, Escape closes it and returns the focus', async ({ page }) => {
		await page.setViewportSize({ width: 320, height: 640 });
		const toggle = page.locator('#navbar button[aria-expanded]').first();
		await toggle.focus();
		await page.keyboard.press('Enter');
		await expect(toggle).toHaveAttribute('aria-expanded', 'true');
		// the panel is before the button in the DOM: the focus goes to its first link, so Tab does not skip it
		await expect(page.locator('#navbar nav a').first()).toBeFocused();
		await page.keyboard.press('Tab');
		await expect(page.locator('#navbar nav a').nth(1)).toBeFocused();
		await page.keyboard.press('Escape');
		await expect(toggle).toHaveAttribute('aria-expanded', 'false');
		await expect(toggle).toBeFocused();
	});

	test('k-toaster: Tab reaches the action, Enter runs it and the focus is not lost', async ({ page }) => {
		await page.evaluate(() => {
			const w = window as unknown as { __undo: number; kern: { toast: (o: object) => number } };
			w.__undo = 0;
			w.kern.toast({ message: 'Deleted one', duration: 0, onundo: () => w.__undo++ });
			w.kern.toast({ message: 'Deleted two', duration: 0, onundo: () => w.__undo++ });
		});
		await expect(page.getByText('Deleted two')).toBeVisible();
		await page.locator('#btn-primary button').focus();
		let reached = false;
		for (let i = 0; i < 400 && !reached; i++) {
			await page.keyboard.press('Tab');
			reached = (await deepFocus(page)).includes('button') && (await inside(page, '#toaster'));
		}
		expect(reached, 'the toasts are in the tab order').toBe(true);
		await page.keyboard.press('Enter');
		expect(await page.evaluate(() => (window as unknown as { __undo: number }).__undo)).toBe(1);
		expect(await inside(page, '#toaster'), 'the focus moved to another toast, not lost').toBe(true);
		await expect(page.getByText(/Deleted (one|two)/)).toHaveCount(1);
	});
});
