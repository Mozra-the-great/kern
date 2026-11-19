/**
 * Deprecated `stuffcloud` theme names (#85, removed in 1.0) in the built demo: the page must look
 * the same under `data-theme="stuffcloud…"` as under `data-theme="code…"`, dark and light, on a
 * desktop and on a phone. The demo opens in the new name; the old one is set on `<html>`
 * afterwards, as a consumer's markup would have it. Compared: every `--k-*` token and the
 * theme-driven computed styles of every element of the page (light DOM and shadow roots).
 * Screenshots are not compared byte for byte: lazy images, the marquee and running counters change
 * between two captures regardless of the theme, which made such a check flaky in CI.
 */
import { expect, test, type Page } from '@playwright/test';

const PAIRS: [string, string][] = [
	['code', 'stuffcloud'],
	['code-light', 'stuffcloud-light']
];

async function open(page: Page, theme: string): Promise<void> {
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await page.addInitScript((t) => {
		try {
			localStorage.setItem('kern-theme', t);
		} catch {
			/* storage blocked: the demo opens in its default theme */
		}
	}, theme);
	await page.goto('index.html');
	await page.evaluate(() => document.fonts.ready);
}

async function setTheme(page: Page, theme: string): Promise<void> {
	await page.evaluate((t) => {
		document.documentElement.dataset.theme = t;
	}, theme);
	// reduced motion sets --k-dur to 0, so no colour transition is left running; two frames let the style settle
	await page.evaluate(async () => {
		await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
	});
}

/** The custom properties of `<html>` and the themed styles of every element. */
async function capture(page: Page): Promise<{ tokens: Record<string, string>; styles: string[] }> {
	const tokens = await page.evaluate(() => {
		const names = new Set<string>();
		const walk = (rules: CSSRuleList): void => {
			for (const rule of Array.from(rules)) {
				if ('cssRules' in rule) walk((rule as CSSGroupingRule).cssRules);
				for (const m of rule.cssText.matchAll(/--k-[\w-]+/g)) names.add(m[0]);
			}
		};
		for (const sheet of Array.from(document.styleSheets)) {
			try {
				walk(sheet.cssRules);
			} catch {
				/* a cross-origin sheet (web fonts) has no readable rules */
			}
		}
		const style = getComputedStyle(document.documentElement);
		return Object.fromEntries([...names].sort().map((n) => [n, style.getPropertyValue(n).trim()]));
	});
	const styles = await page.evaluate(() => {
		// The properties a theme sets through the tokens; geometry and animation state are left out.
		const props = [
			'color',
			'background-color',
			'background-image',
			'border-top-color',
			'border-top-width',
			'border-top-left-radius',
			'box-shadow',
			'outline-color',
			'font-family',
			'font-size',
			'font-weight',
			'letter-spacing',
			'text-transform'
		];
		const out: string[] = [];
		const visit = (root: Document | ShadowRoot, path: string): void => {
			for (const [i, el] of Array.from(root.querySelectorAll('*')).entries()) {
				const style = getComputedStyle(el);
				out.push(`${path}${el.tagName}#${String(i)} ${props.map((p) => style.getPropertyValue(p)).join(' | ')}`);
				if (el.shadowRoot) visit(el.shadowRoot, `${path}${el.tagName}#${String(i)}>`);
			}
		};
		visit(document, '');
		return out;
	});
	return { tokens, styles };
}

for (const [width, height, label] of [
	[1280, 900, 'desktop'],
	[375, 812, 'phone']
] as const) {
	test.describe(`${label} (${String(width)}px)`, () => {
		test.use({ viewport: { width, height }, isMobile: width < 760, hasTouch: width < 760 });

		for (const [next, old] of PAIRS) {
			test(`the demo under data-theme="${old}" looks the same as under "${next}"`, async ({ page }) => {
				await open(page, next);
				await expect(page.locator('html')).toHaveAttribute('data-theme', next);
				const a = await capture(page);
				expect(Object.keys(a.tokens).length).toBeGreaterThan(80);

				await setTheme(page, old);
				await expect(page.locator('html')).toHaveAttribute('data-theme', old);
				const b = await capture(page);

				expect(b.tokens).toEqual(a.tokens);
				expect(a.styles.length).toBeGreaterThan(500);
				expect(b.styles).toEqual(a.styles);
			});
		}
	});
}

test('a theme stored before the rename still opens the demo in the renamed theme', async ({ page }) => {
	await open(page, 'stuffcloud-light');
	await expect(page.locator('html')).toHaveAttribute('data-theme', 'code-light');
});
