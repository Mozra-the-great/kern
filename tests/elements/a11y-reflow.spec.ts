/**
 * Reflow at 320 px (WCAG 1.4.10, #25): at 320 x 640 CSS pixels (a 1280 px window at 400 % zoom) no page of
 * tests/elements/pages scrolls sideways, and no interactive control is cut off by its container or the screen.
 * Every page in the eight theme variants, and the open states of forced-colors.html (modal, menus, pickers,
 * toasts, the phone menu ...). A control inside a container that scrolls on purpose (a table, the carousel
 * track, a code block) is reachable by scrolling and does not count as clipped.
 */
import { expect, test, type Page } from '@playwright/test';
import { ALL, openPage, PAGES, STATES, THEMES } from './a11y-shared.js';

// A page load can stall on a busy machine (see load() in a11y-shared.ts): leave room for its retries.
test.describe.configure({ timeout: 90_000 });

interface Report {
	/** scrollWidth of the page minus the window width; > 0 means a horizontal scrollbar. */
	overflow: number;
	/** Descriptions of the elements that stick out of the page or of a container that hides the excess. */
	wide: string[];
	/** Interactive controls that cannot be reached because a container with `overflow: hidden` or the screen cuts them off. */
	clipped: string[];
}

/** Runs in the browser. */
function reflowReport(): Report {
	const INTERACTIVE =
		'a[href], button, input:not([type=hidden]), select, textarea, summary, [tabindex]:not([tabindex="-1"]), [contenteditable=true], ' +
		'[role=button], [role=link], [role=tab], [role=menuitem], [role=option], [role=checkbox], [role=switch], [role=radio], [role=slider], [role=combobox], [role=treeitem], [role=gridcell][tabindex]';
	const width = document.documentElement.clientWidth;
	const parentOf = (el: Element): Element | null => {
		if (el.parentElement) return el.parentElement;
		const root = el.getRootNode();
		return root instanceof ShadowRoot ? root.host : null;
	};
	const all: Element[] = [];
	const walk = (root: Document | ShadowRoot | Element): void => {
		for (const el of root.querySelectorAll('*')) {
			all.push(el);
			if (el.shadowRoot) walk(el.shadowRoot);
		}
	};
	walk(document);
	const describe = (el: Element): string => {
		const names: string[] = [];
		for (let cur: Element | null = el; cur && names.length < 4; cur = parentOf(cur)) {
			const id = cur.id ? `#${cur.id}` : '';
			const cls = typeof cur.className === 'string' && cur.className ? `.${cur.className.trim().split(/\s+/)[0]}` : '';
			names.unshift(`${cur.tagName.toLowerCase()}${id}${cls}`);
		}
		return names.join(' > ');
	};
	const shown = (el: Element): DOMRect | null => {
		const r = el.getBoundingClientRect();
		if (r.width < 2 || r.height < 2) return null; // not painted, or text for assistive technology only
		for (let cur: Element | null = el; cur; cur = parentOf(cur)) {
			const s = getComputedStyle(cur);
			if (s.display === 'none' || s.visibility === 'hidden' || s.visibility === 'collapse') return null;
			if (cur.hasAttribute('inert')) return null;
		}
		return r;
	};
	/** The nearest ancestor that clips this element's box on the x axis and how (`hidden` cuts, `scroll` can be scrolled). */
	const cuts = (el: Element, r: DOMRect): { by: 'hidden' | 'scroll'; at: Element } | null => {
		for (let cur = parentOf(el); cur && cur !== document.documentElement; cur = parentOf(cur)) {
			const s = getComputedStyle(cur);
			if (s.display === 'contents') continue;
			const x = s.overflowX;
			if (x === 'visible') continue;
			const c = cur.getBoundingClientRect();
			// a box of a pixel or two is text for assistive technology (visually hidden, shown on focus)
			if (c.width < 2 || c.height < 2) continue;
			if (r.left < c.left - 1 || r.right > c.right + 1) return { by: x === 'hidden' || x === 'clip' ? 'hidden' : 'scroll', at: cur };
		}
		return null;
	};

	const wide: string[] = [];
	for (const el of all) {
		if (['SCRIPT', 'STYLE', 'HEAD', 'TITLE', 'META', 'LINK'].includes(el.tagName)) continue;
		const r = shown(el);
		if (!r) continue;
		if (r.right > width + 1 || r.left < -1) {
			// beyond the screen is fine inside a container that scrolls or hides it; elsewhere it is what makes the page wide
			if (cuts(el, r)) continue;
			// only the outermost element that sticks out
			const parent = parentOf(el);
			const pr = parent ? parent.getBoundingClientRect() : null;
			if (!pr || pr.right <= width + 1) wide.push(`${describe(el)} spans ${Math.round(r.left)}..${Math.round(r.right)}`);
		}
	}

	const clipped: string[] = [];
	for (const el of all.filter((e) => e.matches(INTERACTIVE))) {
		const r = shown(el);
		if (!r) continue;
		const cut = cuts(el, r);
		if (cut?.by === 'hidden') clipped.push(`${describe(el)} is cut off by ${describe(cut.at)}`);
		else if (!cut && (r.left < -1 || r.right > width + 1))
			clipped.push(`${describe(el)} is outside the screen (${Math.round(r.left)}..${Math.round(r.right)})`);
	}
	return { overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, wide, clipped };
}

async function expectReflow(page: Page): Promise<void> {
	const report = await page.evaluate(reflowReport);
	expect(report.overflow, `the page scrolls sideways by ${report.overflow}px; wide: ${report.wide.join('; ')}`).toBeLessThanOrEqual(0);
	expect(report.wide, 'elements outside the screen').toEqual([]);
	expect(report.clipped, 'interactive controls that are cut off').toEqual([]);
}

test('the check sees an overflow and a clipped control (it is not vacuous)', async ({ page }) => {
	await openPage(page, ALL, { width: 320 });
	await page.evaluate(() => {
		document
			.querySelector('main')
			?.insertAdjacentHTML(
				'beforeend',
				'<div style="width:120px;overflow:hidden"><button id="cut" style="margin-left:100px;width:100px">Cut</button></div><div style="width:500px;height:5px"></div>'
			);
	});
	const report = await page.evaluate(reflowReport);
	expect(report.overflow).toBeGreaterThan(0);
	expect(report.clipped.join()).toContain('button#cut');
});

for (const theme of THEMES) {
	for (const name of PAGES) {
		test(`320 px: ${name} page in ${theme}`, async ({ page }) => {
			await openPage(page, name, { theme, width: 320, height: 640 });
			await expectReflow(page);
		});
	}
	for (const [name, state] of Object.entries(STATES)) {
		test(`320 px: ${name} open in ${theme}`, async ({ page }) => {
			await openPage(page, ALL, { theme, width: 320, height: 640 });
			await state.prepare(page);
			await expectReflow(page);
		});
	}
}
