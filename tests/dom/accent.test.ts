/**
 * Accent API (#41) in a real DOM; the colour math against the theme CSS is tests/unit/accent.test.ts.
 * Covered here: `installAccent` (one `<style id="kern-accent">` replaced per call, nonce, the stored copy, blocked
 * storage, `theme-color` painted and restored: created, existing with and without content), `removeAccent`,
 * `applyAccent` / `clearAccent` on an element (computed surfaces as hex or opaque rgb, ignored when they are not
 * plain colours, `data-theme` of an ancestor, explicit surfaces) and the custom grounds of `accentTokens`
 * (all four surfaces, a ground where no tint keeps the body text readable, a ground no lightness can satisfy).
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	ACCENT_TOKENS,
	accentCss,
	accentTokens,
	applyAccent,
	clearAccent,
	installAccent,
	removeAccent
} from '../../src/lib/components/accent.js';

const ACCENT = '#e91e8c';

function themeColors(): (string | null)[] {
	return [...document.querySelectorAll('meta[name="theme-color"]')].map((m) => m.getAttribute('content'));
}

/** Fakes the computed `--k-*` surfaces of every element. */
function computed(values: Record<string, string>): void {
	vi.spyOn(window, 'getComputedStyle').mockImplementation(
		() => ({ getPropertyValue: (name: string): string => values[name] ?? '' }) as unknown as CSSStyleDeclaration
	);
}

afterEach(() => {
	removeAccent({ storageKey: 'accent' });
	document.head.querySelectorAll('meta').forEach((m) => m.remove());
	document.body.replaceChildren();
	localStorage.clear();
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

describe('installAccent', () => {
	it('puts one style element in the head and replaces its CSS on every call', () => {
		const first = installAccent(ACCENT);
		expect(first.ok).toBe(true);
		const style = document.getElementById('kern-accent');
		expect(style?.parentElement).toBe(document.head);
		expect(style?.textContent).toBe(first.ok ? first.css : '');
		const second = installAccent('#0066cc', { selector: '.app' });
		expect(document.querySelectorAll('#kern-accent')).toHaveLength(1);
		expect(document.getElementById('kern-accent')?.textContent).toBe(second.ok ? second.css : '');
		expect(document.getElementById('kern-accent')?.textContent).toContain(".app[data-theme='code']");
	});

	it('sets a valid nonce only', () => {
		installAccent(ACCENT, { nonce: '"bad nonce"' });
		expect((document.getElementById('kern-accent') as HTMLStyleElement).nonce).toBe('');
		installAccent(ACCENT, { nonce: 'abc123+/=' });
		expect((document.getElementById('kern-accent') as HTMLStyleElement).nonce).toBe('abc123+/=');
	});

	it('leaves the page alone for invalid input', () => {
		const color = installAccent('pink');
		expect(color.ok === false && color.error.code).toBe('invalid-color');
		const selector = installAccent(ACCENT, { selector: '} body {' });
		expect(selector.ok === false && selector.error.code).toBe('invalid-selector');
		expect(document.getElementById('kern-accent')).toBeNull();
	});

	it('stores the CSS for the head script and removeAccent deletes it', () => {
		const result = installAccent(ACCENT, { storageKey: 'accent' });
		expect(localStorage.getItem('accent')).toBe(result.ok ? result.css : null);
		removeAccent({ storageKey: 'accent' });
		expect(localStorage.getItem('accent')).toBeNull();
		expect(document.getElementById('kern-accent')).toBeNull();
	});

	it('survives storage that throws or does not exist', () => {
		vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
			throw new DOMException('full', 'QuotaExceededError');
		});
		vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
			throw new DOMException('blocked', 'SecurityError');
		});
		expect(installAccent(ACCENT, { storageKey: 'accent' }).ok).toBe(true);
		expect(() => removeAccent({ storageKey: 'accent' })).not.toThrow();
		vi.restoreAllMocks();
		vi.stubGlobal('localStorage', undefined);
		expect(installAccent(ACCENT, { storageKey: 'accent' }).ok).toBe(true);
		vi.unstubAllGlobals();
		const getter = vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
			throw new DOMException('denied', 'SecurityError');
		});
		expect(installAccent(ACCENT, { storageKey: 'accent' }).ok).toBe(true);
		getter.mockRestore();
	});

	it('works on a document that is passed in', () => {
		const doc = document.implementation.createHTMLDocument('other');
		expect(installAccent(ACCENT, { document: doc }).ok).toBe(true);
		expect(doc.getElementById('kern-accent')).not.toBeNull();
		expect(document.getElementById('kern-accent')).toBeNull();
		removeAccent({ document: doc });
		expect(doc.getElementById('kern-accent')).toBeNull();
	});
});

describe('theme-color', () => {
	it('creates the meta while the accent is installed and removes it again', () => {
		installAccent(ACCENT, { themeColor: 'accent' });
		expect(themeColors()).toEqual([ACCENT]);
		installAccent('#0066cc', { themeColor: 'accent' });
		expect(themeColors()).toEqual(['#0066cc']);
		installAccent(ACCENT);
		expect(themeColors()).toEqual([]);
	});

	it('paints existing metas and restores their content, or the missing content', () => {
		document.head.insertAdjacentHTML(
			'beforeend',
			'<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)"><meta name="theme-color">'
		);
		installAccent(ACCENT, { themeColor: 'accent' });
		expect(themeColors()).toEqual([ACCENT, ACCENT]);
		removeAccent();
		expect(themeColors()).toEqual(['#ffffff', null]);
	});

	it('keeps painting a meta it created even when the page added its own later', () => {
		installAccent(ACCENT, { themeColor: 'accent' });
		const created = document.querySelector('meta[name="theme-color"]');
		created?.remove();
		document.head.insertAdjacentHTML('beforeend', '<meta name="theme-color" content="#123456">');
		installAccent('#0066cc', { themeColor: 'accent' });
		expect(themeColors()).toEqual(['#0066cc']);
		expect(created?.getAttribute('content')).toBe('#0066cc');
		removeAccent();
		expect(themeColors()).toEqual(['#123456']);
	});

	it('restoring without a painted meta changes nothing', () => {
		document.head.insertAdjacentHTML('beforeend', '<meta name="theme-color" content="#abcdef">');
		removeAccent();
		expect(themeColors()).toEqual(['#abcdef']);
	});
});

describe('applyAccent', () => {
	it('uses the data-theme of an ancestor and clears earlier tokens', () => {
		const wrap = document.createElement('div');
		wrap.setAttribute('data-theme', 'flower-wald');
		const el = document.createElement('div');
		wrap.append(el);
		document.body.append(wrap);
		el.style.setProperty('--k-focus', 'red');
		const result = applyAccent(el, ACCENT, { roles: ['accent'] });
		expect(result.ok && result.scheme).toBe('dark');
		expect(el.style.getPropertyValue('--k-accent')).toBe(ACCENT);
		expect(el.style.getPropertyValue('--k-focus')).toBe('');
		clearAccent(el);
		expect(ACCENT_TOKENS.every((t) => el.style.getPropertyValue(t) === '')).toBe(true);
	});

	it('reads the computed surfaces as hex or opaque rgb()', () => {
		computed({
			'--k-bg': ' #101010 ',
			'--k-bg-raised': 'rgb(20, 20, 20)',
			'--k-bg-sunken': 'rgba(0 0 0 / 100%)',
			'--k-fg': 'rgb(240,240,240,1)'
		});
		const el = document.createElement('div');
		const result = applyAccent(el, '#3355ff');
		expect(result.ok && result.scheme).toBe('dark');
		const direct = accentTokens('#3355ff', { surfaces: { bg: '#101010', raised: '#141414', sunken: '#000000', fg: '#f0f0f0' } });
		expect(result.ok && direct.ok && result.tokens).toEqual(direct.ok ? direct.tokens : undefined);
	});

	it.each([
		['a translucent colour', 'rgba(0, 0, 0, 0.5)'],
		['a translucent percentage', 'rgb(0 0 0 / 40%)'],
		['a named colour', 'black'],
		['a colour mix', 'color-mix(in srgb, red 10%, white)']
	])('ignores computed surfaces with %s', (_name, value) => {
		computed({ '--k-bg': value, '--k-bg-raised': '#ffffff', '--k-bg-sunken': '#ffffff', '--k-fg': '#000000' });
		const el = document.createElement('div');
		const result = applyAccent(el, ACCENT, { scheme: 'dark' });
		const scheme = accentTokens(ACCENT, { scheme: 'dark' });
		expect(result.ok && scheme.ok && result.tokens).toEqual(scheme.ok ? scheme.tokens : undefined);
	});

	it('skips the computed surfaces with computed=false or without getComputedStyle', () => {
		const spy = vi.spyOn(window, 'getComputedStyle');
		const el = document.createElement('div');
		applyAccent(el, ACCENT, { computed: false, theme: 'pop' });
		expect(spy).not.toHaveBeenCalled();
		vi.stubGlobal('getComputedStyle', undefined);
		const result = applyAccent(el, ACCENT, { theme: 'pop' });
		expect(result.ok && result.tokens['--k-accent']).toBe(ACCENT);
	});

	it('explicit surfaces win and invalid input changes nothing', () => {
		const el = document.createElement('div');
		const result = applyAccent(el, ACCENT, { surfaces: { bg: '#000', scheme: 'dark' } });
		expect(result.ok && result.scheme).toBe('dark');
		clearAccent(el);
		const bad = applyAccent(el, 'nope');
		expect(bad.ok).toBe(false);
		expect(el.getAttribute('style') ?? '').toBe('');
	});

	it('clearAccent ignores something that is not an element', () => {
		expect(() => clearAccent({} as ElementCSSInlineStyle)).not.toThrow();
	});
});

describe('accentTokens on custom grounds', () => {
	it('takes all four surfaces and their own foreground', () => {
		const result = accentTokens(ACCENT, { surfaces: { bg: '#fafafa', raised: '#ffffff', sunken: '#eeeeee', fg: '#222222' } });
		expect(result.ok && result.scheme).toBe('light');
		expect(result.ok && result.checks.filter((c) => c.token === '--k-fg').every((c) => c.pass)).toBe(true);
	});

	it('rejects a bad foreground', () => {
		const result = accentTokens(ACCENT, { surfaces: { bg: '#ffffff', fg: 'black' } });
		expect(result.ok === false && result.error.code).toBe('invalid-ground');
	});

	it('uses the weakest tint when no tint keeps the body text readable', () => {
		const result = accentTokens('#0000ff', { surfaces: { bg: '#ffffff', fg: '#999999' }, roles: ['accent'] });
		expect(result.ok && result.guaranteed).toBe(false);
		expect(result.ok && result.tokens['--k-accent-soft']).toBeTruthy();
	});

	it('returns the better end when no lightness reaches the contrast on every surface', () => {
		const result = accentTokens('#808080', {
			surfaces: { bg: '#000000', raised: '#ffffff', sunken: '#ffffff', fg: '#000000', scheme: 'light' }
		});
		expect(result.ok && result.guaranteed).toBe(false);
		expect(result.ok && result.adjustments.length).toBeGreaterThan(0);
	});

	it('accentCss fails for an invalid colour', () => {
		const result = accentCss('nope');
		expect(result.ok === false && result.error.code).toBe('invalid-color');
	});
});
