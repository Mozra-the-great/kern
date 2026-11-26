/**
 * Tab strips (#153, WCAG 2.1.1, 2.4.3): the strip of a `k-tabs` / `k-tab-links` must not scroll vertically. In the line look
 * the tab used to be 1px taller than the room left by the strip's own border (a negative margin made it overlap), so the
 * strip had `scrollHeight` > `clientHeight`; with `overflow-x: auto` that makes it a scroll container, and Firefox adds a
 * scroll container as an unnamed keyboard stop before the first tab. Chromium does not, so this spec also runs in the
 * Firefox project of playwright.config.ts (besides the pill-strip test of a11y-reflow.spec.ts, #159).
 *
 * Per theme variant and width (1280, 375, 320 px), for both looks and for strips that fit and strips that scroll sideways:
 * `scrollHeight <= clientHeight`; the sideways strips still scroll, fade their edge and keep the focus ring inside the strip;
 * Tab from a button before the strip lands on the first tab (k-tabs: the one tab in the Tab order) or the first link
 * (k-tab-links: each link), with no stop in between and none for the strip itself, and Shift+Tab comes back. The same
 * `scrollHeight` check covers every other strip of tests/elements/pages/forced-colors.html that scrolls sideways
 * (segmented control, breadcrumb, pagination, carousel, history bar, heatmap, code block ...).
 */
import { expect, test, type Page } from '@playwright/test';
import { ALL, openPage, settle, THEMES } from './a11y-shared.js';

const WIDTHS = [1280, 375, 320] as const;
const SHORT = ['One', 'Two', 'Three'];
const LONG = ['Overview', 'Statistics', 'Notifications', 'Integrations', 'Billing', 'Members', 'Security', 'Audit log', 'Danger zone'];

interface Strip {
	id: string;
	tag: 'k-tabs' | 'k-tab-links';
	look: 'line' | 'pill';
	/** Enough tabs to scroll sideways on a phone. */
	long: boolean;
}

const STRIPS: Strip[] = (['k-tabs', 'k-tab-links'] as const).flatMap((tag) =>
	(['line', 'pill'] as const).flatMap((look) =>
		[false, true].map((long): Strip => ({ id: `strip-${tag.slice(2)}-${look}-${long ? 'long' : 'short'}`, tag, look, long }))
	)
);

/** Builds every strip between two buttons, each in its own row, in the page. */
async function addStrips(page: Page): Promise<void> {
	await page.evaluate(
		({ strips, long, short }) => {
			const main = document.querySelector('main');
			for (const s of strips) {
				const names = s.long ? long : short;
				const row = document.createElement('div');
				row.id = `${s.id}-row`;
				row.style.cssText = 'display:grid;grid-template-columns:minmax(0,1fr);gap:8px';
				const before = document.createElement('button');
				before.id = `${s.id}-before`;
				before.textContent = 'Before';
				const host = document.createElement(s.tag);
				host.id = s.id;
				host.setAttribute('label', s.id);
				host.setAttribute('look', s.look);
				if (s.tag === 'k-tabs') host.setAttribute('tabs', JSON.stringify(names.map((label, i) => ({ id: `t${i}`, label }))));
				else host.setAttribute('links', JSON.stringify(names.map((label, i) => ({ href: `#${s.id}-${i}`, label, current: i === 0 }))));
				const after = document.createElement('button');
				after.id = `${s.id}-after`;
				after.textContent = 'After';
				row.append(before, host, after);
				main?.append(row);
			}
		},
		{ strips: STRIPS, long: LONG, short: SHORT }
	);
	await page.waitForFunction(
		(ids) => ids.every((id) => document.getElementById(id)?.shadowRoot?.querySelector('.list')),
		STRIPS.map((s) => s.id)
	);
	await settle(page);
}

interface Metrics {
	scrollHeight: number;
	clientHeight: number;
	scrollWidth: number;
	clientWidth: number;
	fadeEnd: boolean;
	scrolled: number;
}

/** Runs in the browser, for the one strip with this id. */
function stripMetrics(id: string): Metrics | null {
	const list = document.getElementById(id)?.shadowRoot?.querySelector<HTMLElement>('.list');
	if (!list) return null;
	const m = {
		scrollHeight: list.scrollHeight,
		clientHeight: list.clientHeight,
		scrollWidth: list.scrollWidth,
		clientWidth: list.clientWidth,
		fadeEnd: list.hasAttribute('data-fade-end'),
		scrolled: 0
	};
	if (m.scrollWidth > m.clientWidth) {
		list.scrollLeft = 40;
		m.scrolled = list.scrollLeft;
		list.scrollLeft = 0;
	}
	return m;
}

/** Runs in the browser: the focused element through the shadow roots, as `tag|text`; a button of the page also as `#id`. */
function focusedLabel(): string {
	let el: Element | null = document.activeElement;
	while (el?.shadowRoot?.activeElement) el = el.shadowRoot.activeElement;
	if (!el) return 'none';
	const own = el.getRootNode() === document ? `#${el.id}` : '';
	return `${el.tagName.toLowerCase()}${own}|${(el.textContent ?? '').trim().replace(/\s+/g, ' ')}`;
}

/** Runs in the browser: where the ring of the focused tab lies compared with the strip, which clips what sticks out. */
function ringInStrip(): { inside: boolean; detail: string } {
	let el: Element | null = document.activeElement;
	while (el?.shadowRoot?.activeElement) el = el.shadowRoot.activeElement;
	const list = el?.closest('.list');
	if (!el || !list) return { inside: false, detail: 'the focus is not in a strip' };
	const c = getComputedStyle(el);
	const width = parseFloat(c.outlineWidth);
	const offset = parseFloat(c.outlineOffset);
	const r = el.getBoundingClientRect();
	const l = list.getBoundingClientRect();
	const border = parseFloat(getComputedStyle(list).borderBottomWidth);
	// the ring is drawn from `offset` outwards: its outer edge lies at offset + width beyond the tab box
	const outer = Math.max(0, offset + width);
	const detail = `ring ${width}px at offset ${offset}px, tab ${r.top.toFixed(1)}..${r.bottom.toFixed(1)}, strip ${l.top.toFixed(1)}..${(l.bottom - border).toFixed(1)}`;
	const inside = c.outlineStyle !== 'none' && r.top - outer >= l.top - 0.5 && r.bottom + outer <= l.bottom - border + 0.5;
	return { inside, detail };
}

for (const theme of THEMES) {
	for (const width of WIDTHS) {
		test(`tab strips in ${theme} at ${width}px: no vertical overflow, no extra Tab stop`, async ({ page }) => {
			await openPage(page, ALL, { theme, width, height: 700 });
			await addStrips(page);

			// 1. every strip of the page that scrolls sideways has no room to scroll down (the scroll area scrolls down on purpose)
			const tall = await page.evaluate(() => {
				const out: string[] = [];
				const walk = (root: Document | ShadowRoot): void => {
					for (const el of root.querySelectorAll('*')) {
						const s = getComputedStyle(el);
						const host = (el.getRootNode() as ShadowRoot).host as Element | undefined;
						const sidewaysScroller = /auto|scroll/.test(s.overflowX);
						if (sidewaysScroller && host?.tagName !== 'K-SCROLL-AREA' && el.clientHeight > 0 && el.scrollHeight > el.clientHeight) {
							out.push(
								`${host?.tagName.toLowerCase() ?? 'page'}#${host?.id ?? ''} .${(el as HTMLElement).className.split(' ')[0] ?? ''}: ` +
									`scrollHeight ${el.scrollHeight} > clientHeight ${el.clientHeight}`
							);
						}
						if (el.shadowRoot) walk(el.shadowRoot);
					}
				};
				walk(document);
				return out;
			});
			expect.soft(tall, 'sideways scrollers that also overflow vertically').toEqual([]);

			for (const strip of STRIPS) {
				const where = `${strip.tag} ${strip.look} ${strip.long ? 'long' : 'short'}`;
				const m = await page.evaluate(stripMetrics, strip.id);
				expect(m, `${where} has a strip`).not.toBeNull();
				if (!m) continue;
				expect.soft(m.scrollHeight, `${where}: scrollHeight <= clientHeight`).toBeLessThanOrEqual(m.clientHeight);
				if (strip.long && width <= 375) {
					expect.soft(m.scrollWidth, `${where} scrolls sideways on a phone`).toBeGreaterThan(m.clientWidth);
					expect.soft(m.fadeEnd, `${where} fades its end edge`).toBe(true);
					expect.soft(m.scrolled, `${where} can be scrolled with scrollLeft`).toBeGreaterThan(0);
				}

				// 2. Tab from before the strip lands on its first tab / link; no stop for the strip itself
				await page.locator(`#${strip.id}-before`).focus();
				const stops: string[] = [];
				for (let i = 0; i < 20; i++) {
					await page.keyboard.press('Tab');
					const at = await page.evaluate(focusedLabel);
					if (at === `button#${strip.id}-after|After`) break;
					stops.push(at);
					if (i === 0) {
						const ring = await page.evaluate(ringInStrip);
						expect.soft(ring.inside, `${where}: the ring of the first stop lies inside the strip (${ring.detail})`).toBe(true);
					}
				}
				const names = strip.long ? LONG : SHORT;
				const expected = strip.tag === 'k-tabs' ? names.slice(0, 1) : names;
				expect
					.soft(
						stops.map((x) => x.split('|')[1]),
						`${where}: the stops between the two buttons`
					)
					.toEqual(expected);
				const kind = strip.tag === 'k-tabs' ? 'button' : 'a';
				expect
					.soft(
						stops.map((x) => x.split('|')[0]),
						`${where}: every stop is a tab / link, none is the strip`
					)
					.toEqual(expected.map(() => kind));

				// 3. and back: one Shift+Tab per stop, one more reaches the button before the strip
				for (let i = 0; i < stops.length; i++) await page.keyboard.press('Shift+Tab');
				expect
					.soft(await page.evaluate(focusedLabel), `${where}: Shift+Tab walks the same stops back`)
					.toBe(`${kind}|${expected[0] ?? ''}`);
				await page.keyboard.press('Shift+Tab');
				expect
					.soft(await page.evaluate(focusedLabel), `${where}: and leaves the strip for the button before it`)
					.toBe(`button#${strip.id}-before|Before`);
			}
		});
	}
}
