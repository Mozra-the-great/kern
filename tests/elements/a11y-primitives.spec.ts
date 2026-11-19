/**
 * SkipLink, LiveAnnouncer, OnlineStatus (#64) and Prose (#59) in the browser, through the built
 * custom elements: keyboard and focus, the live regions and what they say, the shared announcer of
 * two copies of kern, offline and online, and the typography of long text.
 */
import { expect, test, type Page } from '@playwright/test';

const PAGE = '/tests/elements/pages/primitives.html';

interface TestWindow {
	kern: { announce(message: string, politeness?: string): void };
	errors: string[];
	pwned?: number;
	changes: boolean[];
}

async function ready(page: Page): Promise<void> {
	await page.goto(PAGE);
	await page.waitForFunction(() =>
		[...document.querySelectorAll('*')]
			.filter((el) => el.tagName.startsWith('K-'))
			.every((el) => customElements.get(el.tagName.toLowerCase()) && el.shadowRoot)
	);
}

const polite = (page: Page) => page.locator('#announcer [role=status]');
const assertive = (page: Page) => page.locator('#announcer [role=alert]');
const notice = (page: Page) => page.locator('#online .notice');

test.describe('SkipLink', () => {
	test('is the first tab stop, hidden until it has focus, then visible with a focus ring', async ({ page }) => {
		await ready(page);
		const link = page.locator('#skip a');
		const size = async () => link.evaluate((el) => ({ w: el.getBoundingClientRect().width, h: el.getBoundingClientRect().height }));
		expect(await size()).toEqual({ w: 1, h: 1 });
		await page.keyboard.press('Tab');
		await expect(link).toBeFocused();
		await expect(link).toBeVisible();
		const shown = await size();
		expect(shown.h).toBeGreaterThanOrEqual(44);
		expect(shown.w).toBeGreaterThan(100);
		await expect(link).toHaveText('Skip to main content');
		const ring = await link.evaluate((el) => {
			const cs = getComputedStyle(el);
			return { style: cs.outlineStyle, width: parseFloat(cs.outlineWidth) };
		});
		expect(ring.style).toBe('solid');
		expect(ring.width).toBeGreaterThanOrEqual(2);
		await page.keyboard.press('Tab');
		expect(await size()).toEqual({ w: 1, h: 1 });
	});

	test('Enter moves focus to the target, keeps the address and leaves no tabindex behind', async ({ page }) => {
		await ready(page);
		const before = page.url();
		await page.keyboard.press('Tab');
		await page.keyboard.press('Enter');
		await expect(page.locator('#main')).toBeFocused();
		expect(page.url()).toBe(before);
		await expect(page.locator('#main')).toHaveAttribute('tabindex', '-1');
		// The next Tab continues after the target, not at the top of the page.
		await page.keyboard.press('Tab');
		await expect(page.locator('#say-polite')).toBeFocused();
		await expect(page.locator('#main')).not.toHaveAttribute('tabindex');
	});

	test('a click works too', async ({ page }) => {
		await ready(page);
		await page.keyboard.press('Tab');
		await page.locator('#skip a').click();
		await expect(page.locator('#main')).toBeFocused();
	});

	test('keeps the browser behaviour when the target does not exist', async ({ page }) => {
		await ready(page);
		await page.keyboard.press('Tab');
		await page.keyboard.press('Tab');
		await expect(page.locator('#skip-missing a')).toBeFocused();
		await expect(page.locator('#skip-missing a')).toHaveText('Skip nowhere');
		await page.keyboard.press('Enter');
		expect(page.url()).toMatch(/#does-not-exist$/);
	});

	test('takes its text from the catalogue and from the label attribute', async ({ page }) => {
		await ready(page);
		await page.evaluate(() => {
			const w = window as unknown as { kern: { strings: { set(x: unknown): void; de: object } } };
			w.kern.strings.set(w.kern.strings.de);
		});
		await expect(page.locator('#skip a')).toHaveText('Zum Hauptinhalt springen');
		await page.locator('#skip').evaluate((el) => el.setAttribute('label', 'Zum Inhalt'));
		await expect(page.locator('#skip a')).toHaveText('Zum Inhalt');
	});

	test('stays visible with forced colors', async ({ page }) => {
		await page.emulateMedia({ forcedColors: 'active' });
		await ready(page);
		await page.keyboard.press('Tab');
		const link = page.locator('#skip a');
		await expect(link).toBeVisible();
		const outline = await link.evaluate((el) => getComputedStyle(el).outlineStyle);
		expect(outline).toBe('solid');
	});
});

test.describe('LiveAnnouncer', () => {
	test('has both regions from the first render, empty and hidden from view', async ({ page }) => {
		await ready(page);
		await expect(polite(page)).toHaveText('');
		await expect(assertive(page)).toHaveText('');
		await expect(polite(page)).toHaveAttribute('aria-live', 'polite');
		await expect(polite(page)).toHaveAttribute('aria-atomic', 'true');
		await expect(assertive(page)).toHaveAttribute('aria-live', 'assertive');
		const box = await polite(page).boundingBox();
		expect(box?.width ?? 99).toBeLessThanOrEqual(1);
		expect(box?.height ?? 99).toBeLessThanOrEqual(1);
	});

	test('says a polite message in the status region and an assertive one in the alert region', async ({ page }) => {
		await ready(page);
		await page.evaluate(() => {
			const { kern } = window as unknown as TestWindow;
			kern.announce('Changes saved');
			kern.announce('Connection lost', 'assertive');
		});
		await expect(polite(page)).toHaveText('Changes saved');
		await expect(assertive(page)).toHaveText('Connection lost');
	});

	test('says the same message again by clearing the region in between', async ({ page }) => {
		await ready(page);
		await page.evaluate(() => {
			const w = window as unknown as { texts: string[]; kern: TestWindow['kern'] };
			w.texts = [];
			const region = document.getElementById('announcer')?.shadowRoot?.querySelector('[role=status]');
			if (region)
				new MutationObserver(() => w.texts.push(region.textContent ?? '')).observe(region, {
					childList: true,
					characterData: true,
					subtree: true
				});
			w.kern.announce('Saved');
		});
		await expect(polite(page)).toHaveText('Saved');
		await page.evaluate(() => (window as unknown as TestWindow).kern.announce('Saved'));
		await expect.poll(() => page.evaluate(() => (window as unknown as { texts: string[] }).texts.join('|'))).toBe('Saved||Saved');
	});

	test('works from the buttons of the page, which are kern elements', async ({ page }) => {
		await ready(page);
		await page.evaluate(() => {
			const { kern } = window as unknown as TestWindow;
			document.getElementById('say-polite')?.addEventListener('click', () => kern.announce('From a button'));
			document.getElementById('say-assertive')?.addEventListener('click', () => kern.announce('Urgent', 'assertive'));
		});
		await page.locator('#say-polite').click();
		await expect(polite(page)).toHaveText('From a button');
		await page.locator('#say-assertive').click();
		await expect(assertive(page)).toHaveText('Urgent');
	});

	test('a second copy of kern (the live-announcer entry) speaks through the first copy’s regions', async ({ page }) => {
		await ready(page);
		await page.addScriptTag({
			type: 'module',
			content:
				"import { announce } from '/dist-elements/elements/live-announcer.js'; window.fromEntry = announce; window.entryLoaded = true;"
		});
		await page.waitForFunction(() => (window as unknown as { entryLoaded?: boolean }).entryLoaded);
		await page.evaluate(() =>
			(window as unknown as { fromEntry: (m: string, p?: string) => void }).fromEntry('From the entry copy', 'assertive')
		);
		await expect(assertive(page)).toHaveText('From the entry copy');
		await expect(polite(page)).toHaveText('');
	});

	test('only the first live-announcer on a page fills its regions, so nothing is spoken twice', async ({ page }) => {
		await ready(page);
		await page.evaluate(() => {
			const second = document.createElement('k-live-announcer');
			second.id = 'second';
			document.body.append(second);
		});
		await page.waitForFunction(() => document.getElementById('second')?.shadowRoot?.querySelector('[role=status]'));
		await page.evaluate(() => (window as unknown as TestWindow).kern.announce('Once'));
		await expect(polite(page)).toHaveText('Once');
		await expect(page.locator('#second [role=status]')).toHaveText('');
		// When the first one goes away, the second takes over.
		await page.evaluate(() => document.getElementById('announcer')?.remove());
		await page.evaluate(() => (window as unknown as TestWindow).kern.announce('Twice'));
		await expect(page.locator('#second [role=status]')).toHaveText('Twice');
	});

	test('removes a message after a while', async ({ page }) => {
		await page.clock.install();
		await ready(page);
		await page.evaluate(() => (window as unknown as TestWindow).kern.announce('Short lived'));
		await expect(polite(page)).toHaveText('Short lived');
		await page.clock.runFor(10_500);
		await expect(polite(page)).toHaveText('');
	});
});

test.describe('OnlineStatus', () => {
	test('shows nothing while online', async ({ page }) => {
		await ready(page);
		await expect(notice(page)).toHaveCount(0);
		await expect(page.locator('#online [role=status]')).toHaveCount(0);
	});

	test('shows a non-blocking notice when the connection is lost, announces it, and says when it is back', async ({ page, context }) => {
		await ready(page);
		await page.evaluate(() => {
			const w = window as unknown as TestWindow;
			w.changes = [];
			document
				.getElementById('online')
				?.addEventListener('change', (e) => w.changes.push((e as CustomEvent<{ online: boolean }>).detail.online));
		});
		await context.setOffline(true);
		await expect(notice(page)).toBeVisible();
		await expect(notice(page)).toContainText('No connection');
		await expect(notice(page)).toContainText('Opened tools keep working.');
		await expect(polite(page)).toHaveText('No connection');
		// The announcer speaks; the notice itself is not a second live region.
		await expect(page.locator('#online [role=status]')).toHaveCount(0);
		// Non-blocking: the page stays operable and nothing is inert or covered.
		await page.locator('#say-polite button').focus();
		await expect(page.locator('#say-polite button')).toBeFocused();

		await context.setOffline(false);
		await expect(notice(page)).toHaveCount(0);
		await expect(polite(page)).toHaveText('Back online');
		expect(await page.evaluate(() => (window as unknown as TestWindow).changes)).toEqual([false, true]);
	});

	test('announces a page that starts offline, but says nothing about coming online for the first time', async ({ page }) => {
		await page.addInitScript(() => {
			Object.defineProperty(Navigator.prototype, 'onLine', { configurable: true, get: () => false });
		});
		await ready(page);
		await expect(notice(page)).toBeVisible();
		await expect(polite(page)).toHaveText('No connection');
		const changes = await page.evaluate(() => (window as unknown as TestWindow).changes ?? []);
		expect(changes).toEqual([]);
	});

	test('is its own live region when no announcer is on the page', async ({ page, context }) => {
		await ready(page);
		await page.evaluate(() => document.getElementById('announcer')?.remove());
		await expect(page.locator('#online [role=status]')).toHaveCount(1);
		await context.setOffline(true);
		await expect(page.locator('#online [role=status] .notice')).toContainText('No connection');
		await context.setOffline(false);
		await expect(notice(page)).toHaveCount(0);
	});

	test('announce="false" keeps the notice a live region and leaves the announcer alone', async ({ page, context }) => {
		await ready(page);
		await page.locator('#online').evaluate((el) => el.setAttribute('announce', 'false'));
		await expect(page.locator('#online [role=status]')).toHaveCount(1);
		await context.setOffline(true);
		await expect(notice(page)).toBeVisible();
		await expect(polite(page)).toHaveText('');
		await context.setOffline(false);
	});

	test('its texts come from the catalogue unless set', async ({ page, context }) => {
		await ready(page);
		await page.locator('#online').evaluate((el) => {
			el.removeAttribute('offline-title');
			el.removeAttribute('offline-text');
			el.removeAttribute('online-text');
		});
		await page.evaluate(() => {
			const w = window as unknown as { kern: { strings: { set(x: unknown): void; de: object } } };
			w.kern.strings.set(w.kern.strings.de);
		});
		await context.setOffline(true);
		await expect(notice(page)).toContainText('Keine Verbindung');
		await expect(polite(page)).toHaveText('Keine Verbindung');
		await context.setOffline(false);
		await expect(polite(page)).toHaveText('Wieder online');
	});
});

test.describe('Prose', () => {
	test('turns plain text into paragraphs, lines and links, and never into HTML', async ({ page }) => {
		await ready(page);
		const root = page.locator('#prose-text');
		await expect(root.locator('p')).toHaveCount(4);
		await expect(root.locator('p').first()).toHaveText('Angaben gemäß § 5 DDG');
		await expect(root.locator('p').nth(1).locator('br')).toHaveCount(1);
		// The markup in the text is shown as text.
		await expect(root.locator('p').nth(3)).toContainText('<b>Kein</b> Markup: <img src=x onerror="window.pwned = 1">');
		await expect(root.locator('b, img')).toHaveCount(0);
		expect(await page.evaluate(() => (window as unknown as TestWindow).pwned)).toBeUndefined();
		const external = root.getByRole('link', { name: /^https:\/\/example\.com\/impressum(?:\s|$)/ });
		await expect(external).toHaveAttribute('href', 'https://example.com/impressum');
		await expect(external).toHaveAttribute('target', '_blank');
		await expect(external).toHaveAttribute('rel', 'noopener noreferrer');
		await expect(external).toContainText('(opens in a new tab)');
		const mail = root.getByRole('link', { name: 'kontakt@example.com' });
		await expect(mail).toHaveAttribute('href', 'mailto:kontakt@example.com');
		await expect(mail).not.toHaveAttribute('target');
	});

	test('sets the line length, the leading and the space between blocks from tokens', async ({ page }) => {
		await ready(page);
		const metrics = await page.locator('#prose-text').evaluate((host) => {
			const block = host.shadowRoot?.querySelector('.k-prose') as HTMLElement;
			const cs = getComputedStyle(block);
			const p = block.querySelector('p') as HTMLElement;
			const probe = document.createElement('div');
			probe.style.width = '68ch';
			probe.style.font = cs.font;
			document.body.append(probe);
			const measure = probe.getBoundingClientRect().width;
			probe.remove();
			return {
				maxWidth: parseFloat(cs.maxWidth),
				width: block.getBoundingClientRect().width,
				measure,
				lineHeight: parseFloat(cs.lineHeight) / parseFloat(cs.fontSize),
				gap: parseFloat(getComputedStyle(p).marginBottom),
				space3: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--k-space-3'))
			};
		});
		expect(metrics.maxWidth).toBeCloseTo(metrics.measure, 0);
		expect(metrics.width).toBeLessThanOrEqual(metrics.maxWidth + 0.5);
		expect(metrics.lineHeight).toBeCloseTo(1.6, 2);
		expect(metrics.gap).toBe(metrics.space3);
	});

	test('styles the elements placed directly inside, and the last one has no trailing space', async ({ page }) => {
		await ready(page);
		const info = await page.locator('#prose-slot').evaluate((host) => {
			const get = (selector: string) => getComputedStyle(host.querySelector(selector) as Element);
			return {
				h2Size: parseFloat(get('h2').fontSize),
				pGap: parseFloat(get('p').marginBottom),
				ulPad: parseFloat(get('ul').paddingInlineStart),
				lastGap: parseFloat(get('ul').marginBottom)
			};
		});
		expect(info.h2Size).toBeGreaterThan(16);
		expect(info.pGap).toBeGreaterThan(0);
		expect(info.ulPad).toBeGreaterThan(0);
		expect(info.lastGap).toBe(0);
	});
});

test('the page has no script errors', async ({ page }) => {
	await ready(page);
	expect(await page.evaluate(() => (window as unknown as TestWindow).errors)).toEqual([]);
});
