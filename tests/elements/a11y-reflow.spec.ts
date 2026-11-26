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

/**
 * A pill tab strip with more tabs than fit scrolls inside its container instead of widening the page (#159). The
 * component's own grid column used to be as wide as the strip, so the strip never overflowed, the page did. The strip
 * sits directly in the page here (no `minmax(0, 1fr)` row around it, which would hide the bug), and the line look
 * next to it must keep working. 1280 px: enough tabs that they do not fit there either. Chromium sized the column right
 * anyway; the bug showed in Firefox, so this test also runs in the `firefox-reflow` project (playwright.config.ts).
 */
const MANY = Array.from({ length: 40 }, (_, i) => `Section ${i + 1}`);

for (const theme of THEMES) {
	for (const width of [1280, 375, 320] as const) {
		test(`${width}px: a pill tab strip with many tabs scrolls inside its container in ${theme}`, async ({ page }) => {
			await openPage(page, ALL, { theme, width, height: 640 });
			await page.evaluate((names) => {
				const tabs = JSON.stringify(names.map((label, i) => ({ id: `t${i}`, label, badge: i === 1 ? 3 : undefined })));
				document
					.querySelector('main')
					?.insertAdjacentHTML(
						'beforeend',
						`<k-tabs id="many-pill" look="pill" label="Many pills" tabs='${tabs}'></k-tabs><k-tabs id="many-line" look="line" label="Many lines" tabs='${tabs}'></k-tabs>`
					);
			}, MANY);
			await elementsReady(page);
			await settle(page);
			const strips = await page.evaluate(() =>
				['many-pill', 'many-line'].map((id) => {
					const host = document.getElementById(id);
					const list = host?.shadowRoot?.querySelector<HTMLElement>('.list');
					const h = host?.getBoundingClientRect();
					const parent = host?.parentElement?.getBoundingClientRect();
					return {
						id,
						scrollWidth: list?.scrollWidth ?? 0,
						clientWidth: list?.clientWidth ?? 0,
						fadeEnd: list?.hasAttribute('data-fade-end') ?? false,
						hostRight: h?.right ?? 0,
						parentRight: parent?.right ?? 0
					};
				})
			);
			for (const s of strips) {
				expect(s.scrollWidth, `${s.id} has more tabs than fit`).toBeGreaterThan(s.clientWidth);
				expect(s.fadeEnd, `${s.id} fades its end edge`).toBe(true);
				expect(s.hostRight, `${s.id} stays inside the page`).toBeLessThanOrEqual(s.parentRight + 1);
			}
			await expectReflow(page);
		});
	}
}

/**
 * A long word in a Textarea breaks instead of widening it (#149): a JWT, a Base64 blob or a hash has no space to wrap
 * at. Five boxes, each narrower than the page: a block and a flex item (each with and without `autosize`) and a
 * shrink-to-fit box (where the text, not the width, sizes the box). One area per box, so a sibling cannot squeeze it
 * below its own padding. The area stays inside its box and the page does not scroll.
 */
const LONG_WORD = '0123456789abcdef'.repeat(9);

interface AreaFit {
	box: { left: number; right: number };
	areas: { name: string; left: number; right: number; wraps: boolean; overflowWrap: string }[];
}

/** Runs in the browser. */
function measureAreas(): AreaFit[] {
	return [...document.querySelectorAll<HTMLElement>('.area-box')].map((box) => {
		const b = box.getBoundingClientRect();
		const areas = [...box.querySelectorAll<HTMLElement>('k-textarea')].map((host) => {
			const area = host.shadowRoot?.querySelector('textarea');
			if (!area) throw new Error('k-textarea has not rendered');
			const r = area.getBoundingClientRect();
			return {
				name: host.getAttribute('data-area') ?? '',
				left: r.left,
				right: r.right,
				// the text wraps inside the area: nothing to scroll sideways
				wraps: area.scrollWidth <= area.clientWidth,
				overflowWrap: getComputedStyle(area).overflowWrap
			};
		});
		return { box: { left: b.left, right: b.right }, areas };
	});
}

for (const theme of THEMES) {
	test(`320 px: a long unbroken word in a Textarea wraps inside its box in ${theme}`, async ({ page }) => {
		await openPage(page, ALL, { theme, width: 320, height: 640 });
		await page.evaluate((word) => {
			const area = (name: string, extra = ''): string =>
				`<k-textarea data-area="${name}" label="${name}" value="${word}" ${extra}></k-textarea>`;
			document.querySelector('main')?.insertAdjacentHTML(
				'beforeend',
				`<div class="area-box" style="width:240px">${area('block')}</div>
				<div class="area-box" style="width:240px">${area('block autosize', 'autosize')}</div>
				<div class="area-box" style="width:240px;display:flex">${area('flex')}</div>
				<div class="area-box" style="width:240px;display:flex">${area('flex autosize', 'autosize')}</div>
				<div class="area-box" style="width:240px"><div style="display:inline-block;max-width:100%">${area('shrink', 'autosize')}</div></div>`
			);
		}, LONG_WORD);
		await elementsReady(page);
		await settle(page);
		const fits = await page.evaluate(measureAreas);
		expect(fits).toHaveLength(5);
		for (const fit of fits)
			for (const a of fit.areas) {
				expect(a.left, `${a.name} starts inside the box`).toBeGreaterThanOrEqual(fit.box.left - 1);
				expect(a.right, `${a.name} ends inside the box`).toBeLessThanOrEqual(fit.box.right + 1);
				expect(a.wraps, `${a.name}: the text wraps instead of scrolling sideways`).toBe(true);
				expect(a.overflowWrap, `${a.name}: breaks anywhere`).toBe('anywhere');
			}
		await expectReflow(page);
	});
}
