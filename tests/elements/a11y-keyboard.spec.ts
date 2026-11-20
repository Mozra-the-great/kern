/**
 * Keyboard (WCAG 2.1.1, 2.1.2, 2.4.3, 2.4.7, #25): every interactive element is reachable with Tab, shows a focus
 * ring after keyboard focus, works with the keys its pattern documents (WAI-ARIA Authoring Practices), and
 * nothing traps the focus except an open modal dialog, which closes on Escape and gives the focus back.
 *
 * Page: tests/elements/pages/forced-colors.html (every element). Part 1 walks the whole tab order in every theme:
 * a ring on each stop, no loop, every interactive element on the list reached. Part 2 operates each element
 * with the keyboard only. Part 3 checks the overlays (modal focus trap and restore, non-modal overlays that
 * release the focus). The forced-colors ring is checked in forced-colors.spec.ts (#27).
 */
import { expect, test, type Page } from '@playwright/test';
import { ALL, elementTags, KEYBOARD, openPage, REACHABLE, THEMES } from './a11y-shared.js';
import { readFile } from 'node:fs/promises';

interface Stop {
	/** Short description of the focused element: tag, id, class, accessible text. */
	desc: string;
	/** Tag names of the custom elements around it (innermost first). */
	hosts: string[];
	/** Where the focus ring is drawn, or null when there is none. */
	ring: string | null;
	/** Index of an earlier stop with the same element, -1 for a new one. */
	seen: number;
	focusVisible: boolean;
}

/** Runs in the browser: describes the focused element (through shadow roots) and finds its focus ring. */
function focusStop(): Stop | null {
	const w = window as unknown as { __stops?: Element[] };
	let el: Element | null = document.activeElement;
	while (el?.shadowRoot?.activeElement) el = el.shadowRoot.activeElement;
	if (!el || el === document.body || el === document.documentElement) return null;
	const stops = (w.__stops ??= []);
	const seen = stops.indexOf(el);
	if (seen < 0) stops.push(el);
	const parentOf = (e: Element): Element | null => {
		if (e.parentElement) return e.parentElement;
		const root = e.getRootNode();
		return root instanceof ShadowRoot ? root.host : null;
	};
	const hosts: string[] = [];
	for (let cur: Element | null = el; cur; cur = parentOf(cur)) if (cur.tagName.startsWith('K-')) hosts.push(cur.tagName.toLowerCase());
	const clear = (c: string): boolean => c === 'transparent' || /^rgba\([^)]*,\s*0\)$/.test(c) || /\/ 0\)$/.test(c);
	const outline = (e: Element, pseudo?: string): boolean => {
		const s = getComputedStyle(e, pseudo);
		return s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0 && !clear(s.outlineColor);
	};
	// the ring is on the element, on a wrapper that has the focus within, on a part inside it or on a neighbour in the same component
	const candidates = new Set<Element>();
	for (let cur: Element | null = el, i = 0; cur && i < 8; cur = parentOf(cur), i++) {
		candidates.add(cur);
		for (const sib of cur.parentElement?.children ?? []) candidates.add(sib);
	}
	for (const child of [...el.querySelectorAll('*')].slice(0, 12)) candidates.add(child);
	let ring: string | null = null;
	for (const c of candidates) {
		for (const pseudo of [undefined, '::before', '::after']) {
			if (outline(c, pseudo)) {
				ring = `${c.tagName.toLowerCase()}.${typeof c.className === 'string' ? c.className.trim().split(/\s+/)[0] : ''}${pseudo ?? ''}`;
				break;
			}
		}
		if (ring) break;
	}
	if (!ring) {
		// no outline: a box-shadow or border that appears with the focus counts (compare with the blurred state)
		const look = (): string =>
			[...candidates].map((c) => `${getComputedStyle(c).boxShadow}|${getComputedStyle(c).borderTopColor}`).join(';');
		const focused = look();
		(el as HTMLElement).blur();
		const resting = look();
		(el as HTMLElement).focus();
		if (focused !== resting) ring = 'box-shadow or border';
	}
	const label = (el.getAttribute('aria-label') ?? el.textContent ?? el.getAttribute('placeholder') ?? el.getAttribute('name') ?? '')
		.replace(/\s+/g, ' ')
		.trim()
		.slice(0, 30);
	return {
		desc: `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}${typeof el.className === 'string' && el.className ? `.${el.className.trim().split(/\s+/)[0]}` : ''} "${label}" in ${hosts.join(' < ')}`,
		hosts,
		ring,
		seen,
		focusVisible: el.matches(':focus-visible')
	};
}

/** Tabs through the page until the focus leaves it or comes round to the first stop. */
async function walkTabOrder(page: Page, limit = 400): Promise<{ stops: Stop[]; loop: string | null }> {
	await page.evaluate(() => {
		(window as unknown as { __stops?: Element[] }).__stops = [];
		(document.activeElement as HTMLElement | null)?.blur();
		window.scrollTo(0, 0);
	});
	const stops: Stop[] = [];
	for (let i = 0; i < limit; i++) {
		await page.keyboard.press('Tab');
		const stop = await page.evaluate(focusStop);
		if (!stop) return { stops, loop: null };
		if (stop.seen === 0) return { stops, loop: null };
		if (stop.seen > 0) return { stops, loop: `${stop.desc} came again after stop ${stop.seen} (at stop ${i + 1})` };
		stops.push(stop);
	}
	return { stops, loop: `no end after ${limit} stops` };
}

test.describe('every element is covered', () => {
	test('KEYBOARD lists each element, its test exists, and static elements hold no control', async ({ page }) => {
		const tags = await elementTags();
		expect(Object.keys(KEYBOARD).sort(), 'KEYBOARD must list exactly the elements of custom-elements.json').toEqual(tags);
		// the tag must be named in the spec (a test title, or the table of a looped test)
		const sourceOf = (file: string): Promise<string> => readFile(new URL(file, import.meta.url), 'utf8');
		const covered = { keys: await sourceOf('./a11y-keys.spec.ts'), overlays: await sourceOf('./a11y-overlays.spec.ts') };
		const named = (all: string, tag: string): boolean => new RegExp(`(^|[^\\w-])${tag}(?![\\w-])`).test(all);
		for (const [tag, how] of Object.entries(KEYBOARD)) {
			if (how === 'keys' || how === 'overlays')
				expect(named(covered[how], tag), `${tag} needs a test that names it in a11y-${how}.spec.ts`).toBe(true);
			else expect(how.static.length, `${tag} needs a reason`).toBeGreaterThan(3);
		}
		for (const tag of REACHABLE) expect(KEYBOARD[tag], `${tag} of REACHABLE is in KEYBOARD`).toBeDefined();
		await openPage(page, ALL, { theme: 'code' });
		const statics = Object.entries(KEYBOARD)
			.filter(([tag, how]) => typeof how === 'object' && !REACHABLE.includes(tag))
			.map(([tag]) => tag);
		const withControls = await page.evaluate((list) => {
			const CONTROL =
				'a[href], button, input:not([type=hidden]), select, textarea, summary, [tabindex]:not([tabindex="-1"]), [role=button], [role=tab], [role=menuitem], [role=option], [role=gridcell][tabindex]';
			return list.filter((tag) => [...document.querySelectorAll(tag)].some((el) => el.shadowRoot?.querySelector(CONTROL)));
		}, statics);
		expect(withControls, 'static elements that render a control: move them to keys or overlays').toEqual([]);
	});
});

test.describe('tab order and focus ring', () => {
	for (const theme of THEMES) {
		test(`every tab stop has a ring, nothing traps the focus, every control is reached in ${theme}`, async ({ page }) => {
			test.setTimeout(90_000);
			await openPage(page, ALL, { theme });
			const { stops, loop } = await walkTabOrder(page);
			expect(loop, 'the tab order loops').toBeNull();
			expect(stops.length, 'tab stops').toBeGreaterThan(100);
			expect(
				stops.filter((s) => !s.ring).map((s) => s.desc),
				'tab stops without a focus ring'
			).toEqual([]);
			expect(
				stops.filter((s) => !s.focusVisible).map((s) => s.desc),
				'stops that do not match :focus-visible after Tab'
			).toEqual([]);
			const reached = new Set(stops.flatMap((s) => s.hosts));
			expect(
				REACHABLE.filter((t) => !reached.has(t)),
				'interactive elements without a tab stop'
			).toEqual([]);
		});
	}

	test('the ring check sees a missing ring (it is not vacuous)', async ({ page }) => {
		await openPage(page, ALL, { theme: 'code' });
		await page.evaluate(() => {
			document.body.insertAdjacentHTML('afterbegin', '<button id="bare" style="outline:none;box-shadow:none">Bare</button>');
			(window as unknown as { __stops?: Element[] }).__stops = [];
		});
		await page.keyboard.press('Tab');
		const stop = await page.evaluate(focusStop);
		expect(stop?.desc).toContain('bare');
		expect(stop?.ring).toBeNull();
	});

	test('a ring shows after keyboard focus but not after a mouse click (:focus-visible)', async ({ page }) => {
		await openPage(page, ALL, { theme: 'code' });
		const ring = (sel: string): Promise<boolean> =>
			page.locator(sel).evaluate((el) => {
				const s = getComputedStyle(el);
				return s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0;
			});
		for (const sel of ['#btn-secondary button', '#ib button', '#tabs [role=tab] >> nth=0', '#breadcrumb a >> nth=0', '#btn-link a']) {
			await page.locator(sel).click();
			expect(await ring(sel), `${sel} after a mouse click`).toBe(false);
			await page.locator(sel).blur();
			await page.locator(sel).focus();
			await page.keyboard.press('Shift+Tab');
			await page.keyboard.press('Tab');
			expect(await ring(sel), `${sel} after the keyboard`).toBe(true);
		}
	});
});
