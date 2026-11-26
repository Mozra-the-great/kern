/**
 * `data-theme` on `<html>` keeps the reader's default font size (#144). base.css used to put a px
 * `font-size` on every `[data-theme]` element, so a root theme replaced the browser setting and froze
 * every `rem` at 16px (17px in Line).
 *
 * How the setting is emulated: the CDP command `Page.setFontSizes` sets the browser's default ("standard")
 * font size of the page, the same value as Chrome's Settings > Appearance > Font size (the initial value of
 * the root's `font-size`, what `font-size: medium` and the root's `1rem` resolve to). The override lives as long
 * as its CDP session, so each measurement sets the size first, then loads the page at 16px or 20px.
 *
 * Contract: the root takes `--k-root-scale` times the default size (1 everywhere except Line, where it is
 * 17 / 16 because Line's `--k-text-md` is 17px; at 16px that is exactly `--k-text-md`, as before). A theme box
 * inside the page (`<div data-theme>`) still sets `--k-text-md` in px, and component text stays on the px
 * `--k-text-*` tokens: neither follows the setting (docs/consumer-guide.md, "Schriftgröße").
 */
import { expect, test, type Page } from '@playwright/test';

/** Every variant: four brands, light and dark, plus the other two Code schemes. */
const VARIANTS = [
	'code',
	'code-dark',
	'code-light',
	'code-paper',
	'code-contrast',
	'flower',
	'flower-wald',
	'pop',
	'pop-dark',
	'line',
	'line-light'
] as const;

const DEFAULT_SIZE = 16;
const LARGE_SIZE = 20;

interface Sizes {
	root: number;
	rem: number;
	bodyText: number;
	box: number;
	textMd: number;
	textSm: number;
	scale: number;
	buttonText: number;
	buttonHeight: number;
	inputText: number;
}

/** `data-theme` on `<html>` plus content that shows what follows the root: plain text, `1rem`, a theme box, components. */
async function open(page: Page, theme: string, size: number, extraCss = ''): Promise<void> {
	// the reader's default font size, as Chrome's settings page sets it, before the page loads. The session stays open: a CDP override ends with it.
	const cdp = await page.context().newCDPSession(page);
	await cdp.send('Page.setFontSizes', { fontSizes: { standard: size } });
	await page.goto('/tests/elements/pages/primitives.html');
	await page.waitForFunction(() => customElements.get('k-button') !== undefined);
	await page.evaluate(
		([t, css]) => {
			document.documentElement.dataset.theme = t;
			if (css) document.head.append(Object.assign(document.createElement('style'), { textContent: css }));
			const host = document.createElement('div');
			host.id = 'probe';
			host.innerHTML =
				'<p id="plain">Plain text</p><div id="rem" style="width: 1rem; height: 1rem"></div>' +
				`<div id="box" data-theme="${t}"><span id="box-text">Theme box</span></div>` +
				'<k-button id="btn">Save</k-button><k-input id="inp" label="Name"></k-input>';
			document.body.append(host);
		},
		[theme, extraCss]
	);
	await page.waitForFunction(
		() =>
			document.getElementById('btn')?.shadowRoot?.querySelector('button') &&
			document.getElementById('inp')?.shadowRoot?.querySelector('input')
	);
}

async function measure(page: Page): Promise<Sizes> {
	return page.evaluate(() => {
		const px = (value: string): number => parseFloat(value);
		const style = (el: Element | null | undefined): CSSStyleDeclaration => getComputedStyle(el as Element);
		const root = document.documentElement;
		const button = document.getElementById('btn')?.shadowRoot?.querySelector('button');
		const input = document.getElementById('inp')?.shadowRoot?.querySelector('input');
		return {
			root: px(style(root).fontSize),
			rem: document.getElementById('rem')?.getBoundingClientRect().width ?? NaN,
			bodyText: px(style(document.getElementById('plain')).fontSize),
			box: px(style(document.getElementById('box-text')).fontSize),
			textMd: px(style(root).getPropertyValue('--k-text-md')),
			textSm: px(style(root).getPropertyValue('--k-text-sm')),
			scale: px(style(root).getPropertyValue('--k-root-scale')),
			buttonText: px(style(button).fontSize),
			buttonHeight: button?.getBoundingClientRect().height ?? NaN,
			inputText: px(style(input).fontSize)
		};
	});
}

for (const theme of VARIANTS) {
	test(`data-theme="${theme}" on <html>: default size unchanged, a larger default scales the root`, async ({ page }) => {
		// the default 16px: as before the fix, the root is --k-text-md (16px, Line 17px)
		await open(page, theme, DEFAULT_SIZE);
		const base = await measure(page);
		expect(base.textMd, 'theme loaded').toBeGreaterThan(0);
		expect(base.root).toBe(base.textMd);
		expect(base.root).toBe(DEFAULT_SIZE * base.scale);
		expect(base.rem).toBe(base.root);
		expect(base.bodyText).toBe(base.root);
		expect(base.box).toBe(base.textMd);

		// the reader chose 20px: the root, `rem` and text without a size of its own follow
		await open(page, theme, LARGE_SIZE);
		const large = await measure(page);
		expect(large.root).toBe(LARGE_SIZE * base.scale);
		expect(large.rem).toBe(large.root);
		expect(large.bodyText).toBe(large.root);
		if (base.scale === 1) {
			expect(large.root).toBe(LARGE_SIZE);
			expect(large.rem).toBe(LARGE_SIZE);
		}

		// what stays on the design's px values: the tokens, a theme box in the page, component text and heights
		expect(large.textMd).toBe(base.textMd);
		expect(large.textSm).toBe(base.textSm);
		expect(large.box).toBe(base.textMd);
		expect(large.buttonText).toBe(base.buttonText);
		expect(large.buttonHeight).toBe(base.buttonHeight);
		expect(large.inputText).toBe(base.inputText);

		// back to the default: nothing stuck
		await open(page, theme, DEFAULT_SIZE);
		expect(await measure(page)).toEqual(base);
	});
}

test('the 16px sizes are the design values (Code: 16px root, 15px button; Line: 17px root)', async ({ page }) => {
	await open(page, 'code', DEFAULT_SIZE);
	expect(await measure(page)).toMatchObject({
		root: 16,
		rem: 16,
		bodyText: 16,
		box: 16,
		textMd: 16,
		textSm: 14,
		buttonText: 15
	});

	await open(page, 'line', DEFAULT_SIZE);
	expect(await measure(page)).toMatchObject({ root: 17, rem: 17, bodyText: 17, box: 17, textMd: 17, scale: 1.0625 });
	// Line at 20px: 17 / 16 of the setting, 21.25px
	await open(page, 'line', LARGE_SIZE);
	expect((await measure(page)).root).toBe(21.25);
});

test('a theme box in the page keeps setting the base size, also inside a root theme', async ({ page }) => {
	await open(page, 'flower', LARGE_SIZE);
	const sizes = await page.evaluate(() => {
		const host = document.createElement('div');
		host.dataset.theme = 'code';
		host.innerHTML = '<span id="inner">x</span>';
		document.body.append(host);
		return {
			box: getComputedStyle(host).fontSize,
			root: getComputedStyle(document.documentElement).fontSize
		};
	});
	expect(sizes).toEqual({ box: '16px', root: '20px' });
});

test("a page's own html font-size still wins over the theme", async ({ page }) => {
	await open(page, 'code', DEFAULT_SIZE, 'html { font-size: 62.5%; }');
	expect((await measure(page)).root).toBe(10);
	await open(page, 'code', LARGE_SIZE, 'html { font-size: 62.5%; }');
	expect((await measure(page)).root).toBe(12.5);
});
