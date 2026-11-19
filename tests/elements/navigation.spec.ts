import { expect, test, type Page } from '@playwright/test';

// Navigation and content (#46 CodeBlock, #47 TabLinks, #48 Tabs without panels, #49 Tile/TileGrid), in
// the browser through the built custom elements, which render the same Svelte components.

interface TestWindow {
	log: string[];
	errors: string[];
}

async function ready(page: Page) {
	await page.waitForFunction(() =>
		['k-tabs', 'k-tab-links', 'k-code-block', 'k-tile-grid', 'k-tile'].every((t) =>
			[...document.querySelectorAll(t)].every((el) => customElements.get(t) && el.shadowRoot?.firstElementChild)
		)
	);
}
const log = (page: Page) => page.evaluate(() => (window as unknown as TestWindow).log);
function listen(page: Page, id: string, types: string[]) {
	return page.evaluate(
		([id, types]) => {
			const w = window as unknown as TestWindow;
			w.log = [];
			for (const type of types as string[])
				document
					.getElementById(id as string)
					?.addEventListener(type, (e) => w.log.push(`${type}:${JSON.stringify((e as CustomEvent).detail)}`));
		},
		[id, types] as const
	);
}

test.describe('Tabs as an app tab bar (#48)', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/tests/elements/pages/navigation.html');
		await ready(page);
	});

	test('without child panels there is no tabpanel and no aria-controls; with children there is one', async ({ page }) => {
		const nav = page.locator('#appnav');
		await expect(nav.getByRole('tablist', { name: 'Main' })).toBeVisible();
		await expect(nav.getByRole('tabpanel')).toHaveCount(0);
		for (const tab of await nav.getByRole('tab').all()) await expect(tab).not.toHaveAttribute('aria-controls');
		await expect(page.locator('#panels').getByRole('tabpanel')).toHaveCount(1);
		await expect(page.locator('#panels').getByRole('tab', { name: 'JSON' })).toHaveAttribute('aria-controls', /panel-json$/);
		expect(await page.evaluate(() => (window as unknown as TestWindow).errors)).toEqual([]);
	});

	test('panels rendered later by a framework bring the tabpanel; removing them takes it away', async ({ page }) => {
		const nav = page.locator('#appnav');
		await page.evaluate(() => {
			const panel = document.createElement('div');
			panel.dataset.tab = 'polishes';
			panel.textContent = 'Late panel';
			document.getElementById('appnav')?.append(panel);
		});
		await expect(nav.getByRole('tabpanel')).toHaveCount(1);
		await expect(page.getByText('Late panel')).toBeVisible();
		await page.evaluate(() => document.querySelector('#appnav > [data-tab]')?.remove());
		await expect(nav.getByRole('tabpanel')).toHaveCount(0);
	});

	test('badges and dots are part of the tab name; hidden tabs are not rendered', async ({ page }) => {
		const nav = page.locator('#appnav');
		await expect(nav.getByRole('tab')).toHaveCount(4);
		await expect(nav.getByRole('tab', { name: 'Polishes 3 new', exact: true })).toBeVisible();
		await expect(nav.getByRole('tab', { name: 'More Sync error', exact: true })).toBeVisible();
		await expect(nav.getByRole('tab', { name: 'Stats', exact: true })).toBeVisible();
		await expect(nav.getByRole('tab', { name: /Admin/ })).toHaveCount(0);
		// The visible count is decorative; the dot is drawn in the danger colour.
		await expect(nav.locator('.k-tab-badge')).toHaveText('3');
		await expect(nav.locator('.k-tab-badge')).toHaveAttribute('aria-hidden', 'true');
		await expect(nav.locator('.k-tab-dot')).toHaveAttribute('data-tone', 'danger');
	});

	test('arrow keys skip hidden and disabled tabs and wrap; change only for user input', async ({ page }) => {
		await listen(page, 'appnav', ['change']);
		const nav = page.locator('#appnav');
		const name = (n: string) => nav.getByRole('tab', { name: new RegExp(`^${n}`) });
		await name('Polishes').focus();
		await page.keyboard.press('ArrowRight');
		await expect(name('Stats')).toBeFocused();
		await expect(name('Stats')).toHaveAttribute('aria-selected', 'true');
		await page.keyboard.press('ArrowRight');
		await expect(name('More')).toBeFocused();
		await page.keyboard.press('ArrowRight');
		await expect(name('Polishes')).toBeFocused();
		await page.keyboard.press('ArrowLeft');
		await expect(name('More')).toBeFocused();
		await page.keyboard.press('Home');
		await expect(name('Polishes')).toBeFocused();
		await page.keyboard.press('End');
		await expect(name('More')).toBeFocused();
		await name('Stats').click();
		expect(await log(page)).toEqual([
			'change:"stats"',
			'change:"more"',
			'change:"polishes"',
			'change:"more"',
			'change:"polishes"',
			'change:"more"',
			'change:"stats"'
		]);
		// Set from code: selected, no event; a hidden tab as value leaves Tab focus on a usable tab.
		await page.evaluate(() => Object.assign(document.getElementById('appnav') as HTMLElement, { value: 'more' }));
		await expect(name('More')).toHaveAttribute('aria-selected', 'true');
		await page.evaluate(() => Object.assign(document.getElementById('appnav') as HTMLElement, { value: 'admin' }));
		await expect(nav.locator('[role="tab"][tabindex="0"]')).toHaveCount(1);
		await expect(nav.locator('[role="tab"][tabindex="0"]')).toHaveAttribute('data-id', 'polishes');
		expect(await log(page)).toHaveLength(7);
	});

	test('a narrow strip scrolls with a fade on the hidden side; the focus ring is drawn inside', async ({ page }) => {
		const list = page.locator('#many [role="tablist"]');
		await expect(list).toHaveAttribute('data-fade-end', '');
		await expect(list).not.toHaveAttribute('data-fade-start');
		await expect(list).toHaveCSS('mask-image', /linear-gradient/);
		await page.locator('#many').getByRole('tab', { name: 'Alpha' }).focus();
		await page.keyboard.press('End');
		await expect(page.locator('#many').getByRole('tab', { name: 'Foxtrot' })).toBeFocused();
		await expect(list).toHaveAttribute('data-fade-start', '');
		await expect(list).not.toHaveAttribute('data-fade-end');
		const offset = await page
			.locator('#many')
			.getByRole('tab', { name: 'Foxtrot' })
			.evaluate((el) => parseFloat(getComputedStyle(el).outlineOffset));
		expect(offset).toBeLessThan(0);
		// A strip that fits has no fade.
		await expect(page.locator('#panels [role="tablist"]')).not.toHaveAttribute('data-fade-end');
	});
});

test.describe('TabLinks (#47)', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/tests/elements/pages/navigation.html');
		await ready(page);
	});

	test('a named navigation landmark of links; only the current one has aria-current', async ({ page }) => {
		const nav = page.getByRole('navigation', { name: 'Convert tools' });
		await expect(nav.getByRole('link')).toHaveCount(3);
		await expect(nav.getByRole('link', { name: 'Base64' })).toHaveAttribute('href', '#base64');
		await expect(nav.getByRole('link', { name: 'Convert' })).toHaveAttribute('aria-current', 'page');
		await expect(nav.getByRole('link', { name: 'Base64' })).not.toHaveAttribute('aria-current');
		await expect(nav.getByRole('link', { name: 'Units 2' })).not.toHaveAttribute('aria-current');
		await expect(nav.locator('[role="tab"], [role="tablist"]')).toHaveCount(0);
	});

	test('Tab walks the links, arrow keys do nothing', async ({ page }) => {
		const nav = page.getByRole('navigation', { name: 'Convert tools' });
		await nav.getByRole('link', { name: 'Convert' }).focus();
		await page.keyboard.press('ArrowRight');
		await expect(nav.getByRole('link', { name: 'Convert' })).toBeFocused();
		await page.keyboard.press('Tab');
		await expect(nav.getByRole('link', { name: 'Base64' })).toBeFocused();
		await page.keyboard.press('Tab');
		await expect(nav.getByRole('link', { name: /^Units/ })).toBeFocused();
	});

	test('navigate is cancelable for client-side routing and not fired for modified clicks', async ({ page }) => {
		await listen(page, 'links', ['navigate']);
		await page.evaluate(() =>
			document.getElementById('links')?.addEventListener('navigate', (e) => {
				if ((e as CustomEvent<{ href: string }>).detail.href === '#base64') e.preventDefault();
			})
		);
		const nav = page.getByRole('navigation', { name: 'Convert tools' });
		await nav.getByRole('link', { name: 'Base64' }).click();
		expect(await page.evaluate(() => location.hash)).toBe('');
		await nav.getByRole('link', { name: /^Units/ }).click();
		await expect.poll(() => page.evaluate(() => location.hash)).toBe('#units');
		// Ctrl+click opens a new tab in a browser: kern stays out of it (the test stops the navigation itself).
		await page.evaluate(() => window.addEventListener('click', (e) => e.preventDefault(), { capture: true, once: true }));
		await nav.getByRole('link', { name: 'Convert' }).click({ modifiers: ['Control'] });
		expect(await log(page)).toEqual([
			'navigate:{"href":"#base64","label":"Base64"}',
			'navigate:{"href":"#units","label":"Units","current":false,"badge":2}'
		]);
	});

	test('the current link looks like the selected tab, in both looks', async ({ page }) => {
		const props = [
			'color',
			'background-color',
			'box-shadow',
			'min-height',
			'font-family',
			'font-size',
			'font-weight',
			'text-transform',
			'padding-left'
		];
		const style = (loc: ReturnType<Page['locator']>) =>
			loc.evaluate((el, props) => {
				const cs = getComputedStyle(el);
				return props.map((p) => cs.getPropertyValue(p));
			}, props);
		// Colour transitions would compare mid-fade values: reduced motion sets --k-dur to 0.
		await page.emulateMedia({ reducedMotion: 'reduce' });
		await page.reload();
		await ready(page);
		for (const theme of ['code', 'flower', 'line']) {
			await page.evaluate(async (t) => {
				document.documentElement.dataset.theme = t;
				await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
			}, theme);
			const tab = page.locator('#panels').getByRole('tab', { name: 'JSON' });
			const link = page.getByRole('navigation', { name: 'Convert tools' }).getByRole('link', { name: 'Convert' });
			expect(await style(link), theme).toEqual(await style(tab));
			const other = page.getByRole('navigation', { name: 'Convert tools' }).getByRole('link', { name: 'Base64' });
			expect(await style(other), theme).toEqual(await style(page.locator('#panels').getByRole('tab', { name: 'YAML' })));
		}
		// Pill look: the current link is filled with the primary colour like a selected pill tab.
		const pill = page.getByRole('navigation', { name: 'Views' }).getByRole('link', { name: 'Grid' });
		const primary = await page.evaluate(() => {
			const probe = document.createElement('div');
			probe.style.background = 'var(--k-primary)';
			document.body.append(probe);
			const c = getComputedStyle(probe).backgroundColor;
			probe.remove();
			return c;
		});
		await expect(pill).toHaveCSS('background-color', primary);
	});
});

test.describe('CodeBlock (#46)', () => {
	test.beforeEach(async ({ page }) => {
		await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
		await page.goto('/tests/elements/pages/navigation.html');
		await ready(page);
		await listen(page, 'cb', ['copy', 'copy-error']);
	});
	const block = (page: Page) => page.locator('#cb');
	const code = 'stuffcloud deploy ./dist --expires 7d --target production --region eu-central --verbose --dry-run';

	test('shows the text as code, markup stays text; no copy button unless asked for', async ({ page }) => {
		await expect(block(page).locator('code')).toHaveText(code);
		await expect(page.locator('#cb-plain code')).toHaveText('<b>x</b>');
		await expect(page.locator('#cb-plain b')).toHaveCount(0);
		await expect(page.locator('#cb-plain').getByRole('button')).toHaveCount(0);
		// copy + copy-icon: icon-only, named by the label; line numbers in a hidden gutter.
		await expect(page.locator('#cb-lines').getByRole('button', { name: 'Copy' })).toBeVisible();
		await expect(page.locator('#cb-lines .text')).toHaveCount(0);
		await expect(page.locator('#cb-lines .gutter')).toHaveText('1\n2');
		await expect(page.locator('#cb-lines .gutter')).toHaveAttribute('aria-hidden', 'true');
	});

	test('a block that scrolls sideways is a named, focusable region without a visible scrollbar; keys scroll it', async ({ page }) => {
		await page.setViewportSize({ width: 375, height: 700 });
		const region = block(page).getByRole('region', { name: 'Deploy command' });
		await expect(region).toHaveAttribute('tabindex', '0');
		await expect(region).toHaveCSS('scrollbar-width', 'none');
		await region.focus();
		await page.keyboard.press('ArrowRight');
		await page.keyboard.press('End');
		await expect.poll(() => region.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
		// One that fits is no region and not in the Tab order.
		await expect(page.locator('#cb-plain [role="region"]')).toHaveCount(0);
		await expect(page.locator('#cb-plain [tabindex="0"]')).toHaveCount(0);
	});

	test('copies the code, announces it, resets the icon after two seconds; a second copy restarts them', async ({ page, context }) => {
		await context.grantPermissions(['clipboard-read', 'clipboard-write']);
		const button = block(page).getByRole('button', { name: 'Copy' });
		const status = block(page).getByRole('status');
		await expect(status).toBeEmpty();
		await button.click();
		await expect(status).toHaveText('Copied');
		expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(code);
		await expect(button).toHaveAttribute('data-status', 'copied');
		await page.clock.runFor(1500);
		await button.click();
		await expect(status).toHaveText('Copied');
		await page.clock.runFor(1500);
		await expect(button).toHaveAttribute('data-status', 'copied');
		await page.clock.runFor(600);
		await expect(button).toHaveAttribute('data-status', 'idle');
		expect(await log(page)).toEqual([`copy:${JSON.stringify(code)}`, `copy:${JSON.stringify(code)}`]);
	});

	test('a failed copy (no clipboard, no fallback) announces the error and fires copy-error', async ({ page }) => {
		await page.evaluate(() => {
			Object.defineProperty(navigator, 'clipboard', {
				configurable: true,
				value: { writeText: () => Promise.reject(new Error('denied')) }
			});
			document.execCommand = () => false;
		});
		const button = block(page).getByRole('button', { name: 'Copy' });
		await button.click();
		await expect(block(page).getByRole('status')).toHaveText('Copy failed');
		await expect(button).toHaveAttribute('data-status', 'error');
		expect(await log(page)).toEqual(['copy-error:null']);
		// Without any clipboard API at all.
		await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined }));
		await button.click();
		await expect(block(page).getByRole('status')).toHaveText('Copy failed');
		expect(await log(page)).toEqual(['copy-error:null', 'copy-error:null']);
	});

	test('the text follows later changes of the element', async ({ page }) => {
		await page.evaluate(() => {
			const el = document.getElementById('cb-plain') as HTMLElement & { code: string | undefined };
			el.code = undefined;
			el.textContent = '\n      echo one\n        echo two\n    ';
		});
		await expect(page.locator('#cb-plain code')).toHaveText('echo one\n  echo two');
	});
});

test.describe('Tile and TileGrid (#49)', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/tests/elements/pages/navigation.html');
		await ready(page);
	});

	test('a list of tiles: whole-cell links and a plain cell', async ({ page }) => {
		const list = page.getByRole('list', { name: 'Tools' });
		await expect(list.getByRole('listitem')).toHaveCount(3);
		await expect(list.getByRole('link', { name: 'PDF Merge and split' })).toHaveAttribute('href', '#pdf');
		await expect(list.getByRole('link')).toHaveCount(2);
		await expect(page.locator('#plain-tile a')).toHaveCount(0);
		// The link fills the whole cell.
		const cell = await page.locator('#grid k-tile').first().boundingBox();
		const link = await list.getByRole('link', { name: /^PDF/ }).boundingBox();
		expect(link?.width).toBeCloseTo(cell?.width ?? 0, 0);
		expect(link?.height).toBeCloseTo(cell?.height ?? 0, 0);
	});

	test('hairlines: the grid draws the top, every tile its right and bottom; rows on phones', async ({ page }) => {
		const grid = page.locator('#grid .k-tile-grid');
		await expect(grid).toHaveCSS('border-top-style', 'solid');
		const tile = page.locator('#plain-tile .k-tile');
		await expect(tile).toHaveCSS('border-right-style', 'solid');
		await expect(tile).toHaveCSS('border-bottom-style', 'solid');
		await expect(tile).toHaveCSS('border-left-style', 'none');
		// auto-fit keeps the empty tracks at 0px: count the real columns.
		const columns = () =>
			grid.evaluate(
				(el) =>
					getComputedStyle(el)
						.gridTemplateColumns.split(' ')
						.filter((w) => parseFloat(w) > 0).length
			);
		expect(await columns()).toBe(3);
		await expect(page.locator('#plain-tile .cell')).toHaveCSS('flex-direction', 'column');
		await page.setViewportSize({ width: 375, height: 700 });
		expect(await columns()).toBe(1);
		await expect(page.locator('#plain-tile .cell')).toHaveCSS('flex-direction', 'row');
		await expect(page.locator('#grid k-tile').first().locator('a')).toHaveCSS('flex-direction', 'row');
	});
});
