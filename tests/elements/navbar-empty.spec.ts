/**
 * <k-navbar> without items (#131): `items` missing or `[]` renders only the brand and the actions, no menu button, no
 * phone panel and no empty `nav` landmark, at every width, in the eight theme variants. axe stays clean and the page
 * does not scroll sideways at 320 px; a navbar with items next to it is unchanged. The same two variants are on the
 * all-elements page (`#navbar-bare`, `#navbar-empty`), so the matrix specs (axe, reflow, keyboard, forced colors) cover
 * them as well; this spec asserts the structure.
 */
import { expect, test, type Page } from '@playwright/test';
import { ALL, elementsReady, openPage, settle, THEMES } from './a11y-shared.js';
import { axeViolations } from './axe.js';

/** What the navbar of the page shows: the controls and landmarks of its shadow root, and whether it is painted. */
async function parts(page: Page, id: string) {
	return page.evaluate((i) => {
		const root = document.getElementById(i)?.shadowRoot;
		if (!root) throw new Error(`#${i} has not rendered`);
		const box = root.querySelector<HTMLElement>('.k-navbar')?.getBoundingClientRect();
		return {
			buttons: root.querySelectorAll('button').length,
			navs: root.querySelectorAll('nav, [role=navigation]').length,
			panels: root.querySelectorAll('.panel').length,
			lists: root.querySelectorAll('ul').length,
			brand: root.querySelector('.brand')?.textContent?.trim() ?? null,
			actions: root.querySelector('.actions') !== null,
			width: box?.width ?? 0
		};
	}, id);
}

for (const theme of THEMES) {
	test.describe(`k-navbar without items in ${theme}`, () => {
		test.beforeEach(async ({ page }) => {
			await openPage(page, ALL, { theme, width: 320, height: 640 });
		});

		test('items missing or [] render only brand and actions, with items the navbar is unchanged', async ({ page }) => {
			for (const id of ['navbar-bare', 'navbar-empty']) {
				const p = await parts(page, id);
				expect(p, id).toMatchObject({ buttons: 0, navs: 0, panels: 0, lists: 0, actions: true, brand: '' });
				// the brand is a slot: it is in the light DOM and shown by the slot
				expect(p.width, `${id} is painted across the page`).toBeGreaterThan(200);
				await expect(page.locator(`#${id} [slot=brand]`)).toBeVisible();
				await expect(page.locator(`#${id} [slot=actions]`)).toBeVisible();
				await expect(page.locator(`#${id}`).getByRole('navigation')).toHaveCount(0);
				await expect(page.locator(`#${id}`).getByRole('button', { name: 'Menu' })).toHaveCount(0);
			}
			expect(await parts(page, 'navbar')).toMatchObject({ buttons: 1, navs: 1, panels: 1, lists: 1, actions: true });
			// at 320 px the panel is closed (display: none), so it is only in the DOM; the menu button is there
			await expect(page.locator('#navbar').getByRole('button', { name: 'Menu' })).toBeVisible();
		});

		test('axe is clean on the navbars without items', async ({ page }) => {
			const findings = await axeViolations(page);
			expect(findings, JSON.stringify(findings, null, 2)).toEqual([]);
		});

		test('no horizontal scroll at 320 px', async ({ page }) => {
			const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
			expect(over).toBeLessThanOrEqual(0);
		});
	});
}

test.describe('k-navbar items at runtime', () => {
	test.beforeEach(async ({ page }) => {
		await openPage(page, ALL, { width: 1280, height: 800 });
	});

	test('wide: no items means no nav, with items the links are inline and there is no menu button', async ({ page }) => {
		expect(await parts(page, 'navbar-bare')).toMatchObject({ buttons: 0, navs: 0 });
		await page.evaluate(() => {
			const el = document.getElementById('navbar-bare') as HTMLElement & { items?: { label: string; href: string }[] };
			el.items = [{ label: 'Home', href: '#home' }];
		});
		await expect(page.locator('#navbar-bare').getByRole('navigation')).toHaveCount(1);
		await expect(page.locator('#navbar-bare').getByRole('link', { name: 'Home' })).toBeVisible();
		await expect(page.locator('#navbar-bare').getByRole('button', { name: /menu/i })).toBeHidden();
		await page.evaluate(() => {
			(document.getElementById('navbar-bare') as HTMLElement & { items?: unknown[] }).items = [];
		});
		expect(await parts(page, 'navbar-bare')).toMatchObject({ buttons: 0, navs: 0, panels: 0 });
	});

	test('narrow: the menu button goes with the last item and an open menu does not come back', async ({ page }) => {
		await page.setViewportSize({ width: 320, height: 640 });
		type El = HTMLElement & { items?: { label: string; href: string }[] };
		await page.evaluate(() => {
			(document.getElementById('navbar-bare') as El).items = [{ label: 'Home', href: '#home' }];
		});
		const toggle = page.locator('#navbar-bare button[aria-expanded]');
		await expect(toggle).toBeVisible();
		await toggle.click();
		await expect(toggle).toHaveAttribute('aria-expanded', 'true');
		await page.evaluate(() => {
			(document.getElementById('navbar-bare') as El).items = [];
		});
		await expect(toggle).toHaveCount(0);
		await page.evaluate(() => {
			(document.getElementById('navbar-bare') as El).items = [{ label: 'Home', href: '#home' }];
		});
		await expect(toggle).toHaveAttribute('aria-expanded', 'false');
	});

	test('no events while rendering', async ({ page }) => {
		const log = await page.evaluate(async () => {
			const seen: string[] = [];
			const host = document.createElement('div');
			for (const type of ['change', 'input', 'toggle', 'open', 'close', 'select', 'click', 'navigate'])
				host.addEventListener(type, (e) => seen.push(e.type), true);
			document.body.append(host);
			host.insertAdjacentHTML(
				'beforeend',
				'<k-navbar id="fresh-a"><span slot="brand">kern</span></k-navbar><k-navbar id="fresh-b" items="[]"></k-navbar>'
			);
			await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
			return seen;
		});
		await elementsReady(page);
		await settle(page);
		expect(log).toEqual([]);
		expect(await parts(page, 'fresh-a')).toMatchObject({ buttons: 0, navs: 0, brand: '' });
		expect(await parts(page, 'fresh-b')).toMatchObject({ buttons: 0, navs: 0 });
	});
});
