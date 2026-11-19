/**
 * Deprecated `stuffcloud` theme names (#85, removed in 1.0), in a real browser against the built
 * theme CSS and custom elements: `data-theme="stuffcloud…"` must compute exactly the same custom
 * properties and the same styles on a kern element as `data-theme="code…"`, on a desktop and on a
 * phone width (the 760px rule sets the control height).
 */
import { expect, test, type Page } from '@playwright/test';

const PAIRS: [string, string][] = [
	['code', 'stuffcloud'],
	['code-dark', 'stuffcloud-dark'],
	['code-light', 'stuffcloud-light'],
	['code-paper', 'stuffcloud-paper'],
	['code-contrast', 'stuffcloud-contrast'],
	['code-something', 'stuffcloud-something']
];

interface Snapshot {
	tokens: Record<string, string>;
	button: Record<string, string>;
	colorScheme: string;
}

/** Computed tokens (every `--k-*` the loaded stylesheets mention) and styles of a button under `theme`. */
async function snapshot(page: Page, theme: string): Promise<Snapshot> {
	return page.evaluate(async (t) => {
		const names = new Set<string>();
		const walk = (rules: CSSRuleList): void => {
			for (const rule of Array.from(rules)) {
				if (rule instanceof CSSImportRule) {
					if (rule.styleSheet) walk(rule.styleSheet.cssRules);
				} else if ('cssRules' in rule) {
					walk((rule as CSSGroupingRule).cssRules);
				}
				for (const m of rule.cssText.matchAll(/--k-[\w-]+/g)) names.add(m[0]);
			}
		};
		for (const sheet of Array.from(document.styleSheets)) walk(sheet.cssRules);

		const host = document.createElement('div');
		host.dataset.theme = t;
		host.innerHTML = '<k-button id="b">Save</k-button>';
		document.body.append(host);
		// the element renders its shadow DOM a tick after it is connected
		for (let i = 0; i < 100 && !document.getElementById('b')?.shadowRoot?.querySelector('button'); i++)
			await new Promise((r) => setTimeout(r, 20));
		const style = getComputedStyle(host);
		const tokens: Record<string, string> = {};
		for (const name of [...names].sort()) tokens[name] = style.getPropertyValue(name).trim();
		const inner = document.getElementById('b')?.shadowRoot?.querySelector('button, .k-button');
		const button: Record<string, string> = {};
		if (inner) {
			const cs = getComputedStyle(inner);
			for (const prop of [
				'background-color',
				'color',
				'border-top-color',
				'border-top-width',
				'border-top-left-radius',
				'box-shadow',
				'min-height',
				'font-family'
			])
				button[prop] = cs.getPropertyValue(prop);
		}
		const out = { tokens, button, colorScheme: style.colorScheme };
		host.remove();
		return out;
	}, theme);
}

for (const [width, label] of [
	[1280, 'desktop'],
	[375, 'phone']
] as const) {
	test.describe(`${label} (${String(width)}px)`, () => {
		test.use({ viewport: { width, height: 800 } });

		for (const [next, old] of PAIRS) {
			test(`data-theme="${old}" computes the same as "${next}"`, async ({ page }) => {
				await page.goto('/tests/elements/pages/primitives.html');
				await page.waitForFunction(() => customElements.get('k-button') !== undefined);
				const a = await snapshot(page, next);
				const b = await snapshot(page, old);
				// not vacuous: the theme really sets tokens
				expect(Object.keys(a.tokens).length).toBeGreaterThan(80);
				expect(a.tokens['--k-bg']).not.toBe('');
				expect(a.tokens['--k-radius-control']).toBe('0');
				expect(a.button['background-color']).toBeTruthy();
				expect(b).toEqual(a);
			});
		}

		test('the phone rule of the theme reaches the old name too', async ({ page }) => {
			await page.goto('/tests/elements/pages/primitives.html');
			const height = async (theme: string): Promise<string> =>
				page.evaluate((t) => {
					const host = document.createElement('div');
					host.dataset.theme = t;
					document.body.append(host);
					const v = getComputedStyle(host).getPropertyValue('--k-control-h').trim();
					host.remove();
					return v;
				}, theme);
			const next = await height('code');
			expect(await height('stuffcloud')).toBe(next);
			if (width <= 760) expect(next).toBe('56px');
		});
	});
}
