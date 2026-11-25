/**
 * Reflow of the demo at 320 px (WCAG 1.4.10, #116): at 320 x 640 CSS pixels (a 1280 px window at 400 % zoom)
 * neither built demo page, `index.html` (Svelte components) nor `elements.html` (custom elements), scrolls
 * sideways, in any of the eight theme variants. The components themselves are checked by
 * tests/elements/a11y-reflow.spec.ts; this guards the demo layout around them (a long label, an unbreakable
 * piece of code, a grid track that grows with its content).
 *
 * `scrollWidth <= innerWidth` is the check; the elements that stick out are only listed to make a failure
 * readable. A box inside a container that scrolls or clips on purpose (a table, the carousel, a code block)
 * does not widen the page and is not listed.
 */
import { expect, test, type Page } from '@playwright/test';

/** One `data-theme` id per theme family and scheme: the real ids of src/lib/themes/brands/*.css. */
const THEMES = ['code', 'code-light', 'flower', 'flower-wald', 'pop', 'pop-dark', 'line', 'line-light'] as const;
const PAGES = ['index.html', 'elements.html'] as const;

// A desktop window at 400 % zoom, not a phone: with `isMobile` Chromium would widen the layout viewport to
// fit an overflowing page and `innerWidth` would no longer be 320.
test.use({ viewport: { width: 320, height: 640 }, isMobile: false, hasTouch: false });

interface Reflow {
	scrollWidth: number;
	innerWidth: number;
	/** Visible elements whose box ends beyond the window and that no scrolling or clipping ancestor contains. */
	wide: string[];
}

async function open(page: Page, url: string, theme: string): Promise<void> {
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await page.addInitScript((t) => {
		try {
			localStorage.setItem('kern-theme', t);
		} catch {
			/* storage blocked: index.html opens in its default theme, the theme is set on <html> below anyway */
		}
	}, theme);
	await page.goto(url);
	await page.evaluate((t) => {
		document.documentElement.dataset.theme = t;
	}, theme);
	await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
	// every custom element of elements.html is defined and has rendered; index.html has none
	await page.waitForFunction(() =>
		[...document.querySelectorAll('*')]
			.filter((el) => el.tagName.startsWith('K-'))
			.every((el) => customElements.get(el.tagName.toLowerCase()) && el.shadowRoot?.firstElementChild)
	);
	// fonts and two frames, so the widths are the final ones
	await page.evaluate(async () => {
		await document.fonts.ready;
		await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
	});
}

/** Runs in the browser. */
function measure(): Reflow {
	const width = window.innerWidth;
	const parentOf = (el: Element): Element | null => {
		if (el.parentElement) return el.parentElement;
		const root = el.getRootNode();
		return root instanceof ShadowRoot ? root.host : null;
	};
	const describe = (el: Element): string => {
		const names: string[] = [];
		for (let cur: Element | null = el; cur && names.length < 4; cur = parentOf(cur)) {
			const id = cur.id ? `#${cur.id}` : '';
			const cls = typeof cur.className === 'string' && cur.className ? `.${cur.className.trim().split(/\s+/)[0]}` : '';
			names.unshift(`${cur.tagName.toLowerCase()}${id}${cls}`);
		}
		return names.join(' > ');
	};
	/** True when an ancestor that scrolls or clips on the x axis contains the box, so it cannot widen the page. */
	const contained = (el: Element): boolean => {
		for (let cur = parentOf(el); cur && cur !== document.documentElement; cur = parentOf(cur)) {
			if (getComputedStyle(cur).overflowX === 'visible') continue;
			const c = cur.getBoundingClientRect();
			if (c.right <= width + 1 && c.left >= -1) return true;
		}
		return false;
	};
	const wide: string[] = [];
	const walk = (root: Document | ShadowRoot): void => {
		for (const el of root.querySelectorAll('*')) {
			if (el.shadowRoot) walk(el.shadowRoot);
			if (['SCRIPT', 'STYLE', 'HEAD', 'TITLE', 'META', 'LINK'].includes(el.tagName)) continue;
			const r = el.getBoundingClientRect();
			// a pixel or two is text for assistive technology (visually hidden), not a box
			if (r.width < 2 || r.height < 2) continue;
			if (r.right > width + 1 && !contained(el)) wide.push(`${describe(el)} ends at ${Math.round(r.right)} px`);
		}
	};
	walk(document);
	return { scrollWidth: document.documentElement.scrollWidth, innerWidth: width, wide: wide.slice(0, 10) };
}

for (const url of PAGES) {
	for (const theme of THEMES) {
		test(`${url} does not scroll sideways at 320 px in ${theme}`, async ({ page }) => {
			await open(page, url, theme);
			const r = await page.evaluate(measure);
			expect(r.innerWidth, 'the window is 320 px wide').toBe(320);
			expect(r.scrollWidth, `page ${r.scrollWidth} px wide, wider: ${r.wide.join('; ')}`).toBeLessThanOrEqual(r.innerWidth);
		});
	}
}

// Canary: the check finds a box that is too wide, so it cannot pass because it looks at nothing.
test('the check fails on a deliberately wide box', async ({ page }) => {
	await open(page, 'index.html', 'code');
	await page.evaluate(() => {
		const box = document.createElement('div');
		box.id = 'canary-wide';
		box.style.cssText = 'width: 400px; height: 20px';
		document.querySelector('main')?.append(box);
	});
	const r = await page.evaluate(measure);
	expect(r.scrollWidth).toBeGreaterThan(r.innerWidth);
	expect(r.wide.join('; ')).toContain('#canary-wide');
});
