/**
 * Reflow at 320 px (WCAG 1.4.10, #25): at 320 x 640 CSS pixels (a 1280 px window at 400 % zoom) no page of
 * tests/elements/pages scrolls sideways, and no interactive control is cut off by its container or the screen.
 * Every page in the eight theme variants, and the open states of forced-colors.html (modal, menus, pickers,
 * toasts, the phone menu ...). A control inside a container that scrolls on purpose (a table, the carousel
 * track, a code block) is reachable by scrolling and does not count as clipped.
 */
import { expect, test, type Page } from '@playwright/test';
import { ALL, elementsReady, openPage, PAGES, settle, STATES, THEMES } from './a11y-shared.js';

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

/**
 * A button label wider than its container wraps instead of overflowing (#121). The Button is as wide as its one
 * line while that fits and never wider than the container; a word wider than the container breaks. Injected into
 * the page with every element, in a 200 px box (narrower than the page, so the box, not the page, is the limit).
 */
const LONG = 'A very long button label that a consumer wrote and that does not fit on one line at all';
const UNBREAKABLE = 'Averyveryverylongunbreakablelabelwithoutanyspacesthatkeepsgoingandgoing';

interface Fit {
	box: { left: number; right: number };
	buttons: { name: string; left: number; right: number; height: number; clipped: boolean }[];
	/** Height of the one-line button next to them, in the box. */
	short: number;
}

/** Runs in the browser. */
function measureFit(): Fit {
	const box = document.getElementById('long-box');
	if (!box) throw new Error('no box');
	const b = box.getBoundingClientRect();
	const buttons = [...box.querySelectorAll<HTMLElement>('k-button[data-long]')].map((host) => {
		const inner = host.shadowRoot?.querySelector<HTMLElement>('.k-button');
		if (!inner) throw new Error('k-button has not rendered');
		const r = inner.getBoundingClientRect();
		// the label is part of the flex box: its text must not stick out of the button
		const range = document.createRange();
		range.selectNodeContents(host);
		const t = range.getBoundingClientRect();
		return {
			name: host.getAttribute('data-long') ?? '',
			left: r.left,
			right: r.right,
			height: r.height,
			clipped: t.left < r.left - 1 || t.right > r.right + 1
		};
	});
	const one = box.querySelector<HTMLElement>('k-button[data-short]')?.shadowRoot?.querySelector('.k-button');
	return { box: { left: b.left, right: b.right }, buttons, short: one?.getBoundingClientRect().height ?? 0 };
}

for (const theme of THEMES) {
	test(`320 px: a long button label wraps inside its container in ${theme}`, async ({ page }) => {
		await openPage(page, ALL, { theme, width: 320, height: 640 });
		await page.evaluate(
			([long, unbreakable]) => {
				document.querySelector('main')?.insertAdjacentHTML(
					'beforeend',
					`<div id="long-box" style="width:200px;display:grid;gap:8px;justify-items:start">
						<k-button data-short>Save</k-button>
						<k-button data-long="primary">${long}</k-button>
						<k-button data-long="secondary" variant="secondary">${unbreakable}</k-button>
						<k-button data-long="small" size="sm" variant="ghost">${long}</k-button>
						<k-button data-long="large" size="lg" variant="accent">${long}</k-button>
						<k-button data-long="link" href="#">${long}</k-button>
						<k-button data-long="block" block variant="danger">${long}</k-button>
						<k-button data-long="wide" wide variant="secondary">${long}</k-button>
					</div>`
				);
			},
			[LONG, UNBREAKABLE]
		);
		await elementsReady(page);
		await settle(page);
		const fit = await page.evaluate(measureFit);
		expect(fit.buttons).toHaveLength(7);
		for (const b of fit.buttons) {
			expect(b.left, `${b.name} starts inside the box`).toBeGreaterThanOrEqual(fit.box.left - 1);
			expect(b.right, `${b.name} ends inside the box`).toBeLessThanOrEqual(fit.box.right + 1);
			expect(b.clipped, `${b.name}: the label stays inside the button`).toBe(false);
			expect(b.height, `${b.name} grew to wrap the label`).toBeGreaterThan(fit.short);
		}
		await expectReflow(page);
	});
}
