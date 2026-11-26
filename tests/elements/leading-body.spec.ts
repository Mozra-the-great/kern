/**
 * `--k-leading-body` (#145): the line height of the themed element and of all text without one of its own.
 * Code takes `normal` (stuffcloud's body sets no line-height, so the browser's `normal` applies); Flower, Pop and Line
 * keep 1.5. The rule lives on `[data-theme]`, so it holds for `<html data-theme>` and for a theme box in the page, and
 * a box nested inside another theme gets its own theme's value, not the parent's.
 */
import { expect, test, type Page } from '@playwright/test';

const CODE = [
	'code',
	'code-dark',
	'code-light',
	'code-paper',
	'code-contrast',
	'stuffcloud',
	'stuffcloud-dark',
	'stuffcloud-light'
] as const;
const OTHERS = ['flower', 'flower-wald', 'pop', 'pop-dark', 'line', 'line-light'] as const;

interface Leading {
	/** Computed `line-height` of the element ("normal" or px), and its font size in px. */
	lineHeight: string;
	fontSize: number;
	token: string;
}

async function open(page: Page, theme: string, extraCss = ''): Promise<void> {
	await page.goto('/tests/elements/pages/primitives.html');
	await page.waitForFunction(() => customElements.get('k-alert') !== undefined);
	await page.evaluate(
		([t, css]) => {
			document.documentElement.dataset.theme = t;
			if (css) document.head.append(Object.assign(document.createElement('style'), { textContent: css }));
			const host = document.createElement('div');
			host.id = 'probe';
			host.innerHTML =
				`<p id="plain">Plain text</p><div id="box" data-theme="${t}"><span id="box-text">Theme box</span></div>` +
				'<div id="in-flower" data-theme="flower"><span id="in-flower-text">Flower box</span></div>' +
				'<div id="in-code" data-theme="code"><span id="in-code-text">Code box</span></div>';
			document.body.append(host);
		},
		[theme, extraCss]
	);
}

async function leading(page: Page, id: string): Promise<Leading> {
	return page.evaluate((elId) => {
		const el = document.getElementById(elId) ?? document.documentElement;
		const style = getComputedStyle(el);
		return { lineHeight: style.lineHeight, fontSize: parseFloat(style.fontSize), token: style.getPropertyValue('--k-leading-body').trim() };
	}, id);
}

/** The unitless ratio a computed `line-height` stands for, or `normal`. */
const ratio = (l: Leading): string | number => (l.lineHeight === 'normal' ? 'normal' : parseFloat(l.lineHeight) / l.fontSize);

for (const theme of CODE) {
	test(`data-theme="${theme}": line-height is normal on <html>, in a theme box and in text without one`, async ({ page }) => {
		await open(page, theme);
		for (const id of ['', 'plain', 'box', 'box-text']) {
			const l = await leading(page, id);
			expect(ratio(l), `${id || 'html'} line-height`).toBe('normal');
		}
		expect((await leading(page, '')).token).toBe('normal');
	});
}

for (const theme of OTHERS) {
	test(`data-theme="${theme}": line-height stays 1.5 on <html>, in a theme box and in text without one`, async ({ page }) => {
		await open(page, theme);
		for (const id of ['', 'plain', 'box', 'box-text']) {
			const l = await leading(page, id);
			expect(ratio(l), `${id || 'html'} line-height`).toBe(1.5);
		}
		expect((await leading(page, '')).token).toBe('1.5');
	});
}

test('a theme box nested in another theme takes its own value, in both directions', async ({ page }) => {
	await open(page, 'code');
	expect(ratio(await leading(page, 'in-flower'))).toBe(1.5);
	expect(ratio(await leading(page, 'in-flower-text'))).toBe(1.5);
	expect(ratio(await leading(page, 'in-code'))).toBe('normal');

	await open(page, 'flower');
	expect(ratio(await leading(page, 'in-code'))).toBe('normal');
	expect(ratio(await leading(page, 'in-code-text'))).toBe('normal');
	expect(ratio(await leading(page, 'in-flower'))).toBe(1.5);
});

test('--k-leading-body: 1.5 on the themed element restores the old Code look (the migration)', async ({ page }) => {
	await open(page, 'code', 'html[data-theme], #box { --k-leading-body: 1.5; }');
	expect(ratio(await leading(page, ''))).toBe(1.5);
	expect(ratio(await leading(page, 'plain'))).toBe(1.5);
	expect(ratio(await leading(page, 'box'))).toBe(1.5);
	expect(ratio(await leading(page, 'box-text'))).toBe(1.5);
});

test('Alert and Toast keep their own 1.5 line in Code, where their icon and dot offsets are set', async ({ page }) => {
	await open(page, 'code');
	await page.evaluate(() => {
		const el = Object.assign(document.createElement('k-alert'), { id: 'alert' });
		el.setAttribute('title', 'Hinweis');
		el.textContent = 'Gespeichert.';
		document.body.append(el);
	});
	await page.waitForFunction(() => document.getElementById('alert')?.shadowRoot?.querySelector('.k-alert'));
	const lines = await page.evaluate(() => {
		const box = document.getElementById('alert')?.shadowRoot?.querySelector('.k-alert') as Element;
		const text = document.getElementById('alert')?.shadowRoot?.querySelector('.text') as Element;
		const read = (el: Element): { lineHeight: string; fontSize: number } => {
			const s = getComputedStyle(el);
			return { lineHeight: s.lineHeight, fontSize: parseFloat(s.fontSize) };
		};
		return { box: read(box), text: read(text) };
	});
	expect(parseFloat(lines.box.lineHeight) / lines.box.fontSize).toBe(1.5);
	expect(parseFloat(lines.text.lineHeight) / lines.text.fontSize).toBe(1.5);

	await page.goto('/tests/elements/pages/feedback.html');
	await page.waitForFunction(
		() => customElements.get('k-toaster') && document.querySelector('#toaster')?.shadowRoot?.querySelector('section')
	);
	await page.evaluate(() => {
		document.documentElement.dataset.theme = 'code';
		(window as unknown as { kern: { toast: (o: { message: string; tone: string }) => void } }).kern.toast({ message: 'saved', tone: 'ok' });
	});
	const toast = await page.evaluate(async () => {
		const root = document.getElementById('toaster')?.shadowRoot;
		await new Promise((r) => setTimeout(r, 50));
		const msg = root?.querySelector('.toast .msg') as Element;
		const s = getComputedStyle(msg);
		return { lineHeight: s.lineHeight, fontSize: parseFloat(s.fontSize) };
	});
	expect(parseFloat(toast.lineHeight) / toast.fontSize).toBe(1.5);
});
