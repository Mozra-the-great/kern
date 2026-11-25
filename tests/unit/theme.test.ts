/**
 * theme.ts: families, dark detection, the light/dark pair, toggle roles, system pick, storage helpers that
 * survive blocked storage, the before-paint script (run against a stand-in document) and its CSP hash.
 */
import { createHash } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	THEME_FAMILIES,
	createThemeScript,
	isDarkTheme,
	pickBySystem,
	readStoredTheme,
	scriptHash,
	themeFamily,
	themePair,
	themeScript,
	themeScriptHash,
	toggleRoles,
	writeStoredTheme
} from '../../src/lib/components/theme.js';

afterEach(() => {
	vi.unstubAllGlobals();
});

function memoryStorage(initial: Record<string, string> = {}): Storage {
	const data = new Map(Object.entries(initial));
	return {
		get length(): number {
			return data.size;
		},
		clear: (): void => data.clear(),
		getItem: (key: string): string | null => data.get(key) ?? null,
		key: (index: number): string | null => [...data.keys()][index] ?? null,
		removeItem: (key: string): void => void data.delete(key),
		setItem: (key: string, value: string): void => void data.set(key, value)
	};
}

function blockedStorage(): Storage {
	const fail = (): never => {
		throw new DOMException('blocked', 'SecurityError');
	};
	return { length: 0, clear: fail, getItem: fail, key: fail, removeItem: fail, setItem: fail };
}

describe('themeFamily', () => {
	it('is the part before the first dash, empty for a missing id', () => {
		expect(themeFamily('code-light')).toBe('code');
		expect(themeFamily('flower')).toBe('flower');
		expect(themeFamily(null)).toBe('');
		expect(themeFamily(undefined)).toBe('');
	});
});

describe('isDarkTheme', () => {
	it('knows the built-in dark themes and any id ending in -dark', () => {
		expect(isDarkTheme('code')).toBe(true);
		expect(isDarkTheme('flower-wald')).toBe(true);
		expect(isDarkTheme('brand-dark')).toBe(true);
		expect(isDarkTheme('code-light')).toBe(false);
		expect(isDarkTheme('pop')).toBe(false);
	});
});

describe('themePair', () => {
	it('returns light then dark of the family, with default and custom labels', () => {
		expect(themePair('pop-dark')).toEqual([
			{ id: 'pop', label: 'Light' },
			{ id: 'pop-dark', label: 'Dark' }
		]);
		expect(themePair('line', { light: 'Hell', dark: 'Dunkel' })).toEqual([
			{ id: 'line-light', label: 'Hell' },
			{ id: 'line', label: 'Dunkel' }
		]);
	});

	it('falls back to Code for unknown or missing families', () => {
		expect(themePair('acme').map((t) => t.id)).toEqual(['code-light', 'code']);
		expect(themePair(undefined).map((t) => t.id)).toEqual(['code-light', 'code']);
	});

	it('keeps the deprecated stuffcloud family on its own ids', () => {
		expect(themePair('stuffcloud').map((t) => t.id)).toEqual([THEME_FAMILIES.stuffcloud.light, THEME_FAMILIES.stuffcloud.dark]);
	});
});

describe('toggleRoles', () => {
	it('is undefined unless there are exactly two themes', () => {
		expect(toggleRoles([])).toBeUndefined();
		expect(toggleRoles([{ id: 'a', label: 'A' }])).toBeUndefined();
		expect(toggleRoles(themePair('code').concat({ id: 'x', label: 'X' }))).toBeUndefined();
	});

	it('the dark one is "on", wherever it stands', () => {
		const light = { id: 'pop', label: 'Light' };
		const dark = { id: 'pop-dark', label: 'Dark' };
		expect(toggleRoles([light, dark])).toEqual({ on: dark, off: light });
		expect(toggleRoles([dark, light])).toEqual({ on: dark, off: light });
	});

	it('without exactly one dark theme the second entry is "on"', () => {
		const a = { id: 'a', label: 'A' };
		const b = { id: 'b', label: 'B' };
		expect(toggleRoles([a, b])).toEqual({ on: b, off: a });
		const c = { id: 'c-dark', label: 'C' };
		const d = { id: 'd-dark', label: 'D' };
		expect(toggleRoles([c, d])).toEqual({ on: d, off: c });
	});
});

describe('pickBySystem', () => {
	it('picks the on/off theme of a pair', () => {
		const pair = themePair('flower');
		expect(pickBySystem(pair, true)?.id).toBe('flower-wald');
		expect(pickBySystem(pair, false)?.id).toBe('flower');
	});

	it('in a longer list picks the first theme of the matching scheme, or none', () => {
		const list = [
			{ id: 'pop', label: 'Pop' },
			{ id: 'line', label: 'Line' },
			{ id: 'code-light', label: 'Code light' }
		];
		expect(pickBySystem(list, true)?.id).toBe('line');
		expect(pickBySystem(list, false)?.id).toBe('pop');
		expect(pickBySystem(list.slice(0, 1).concat(list[2]).concat({ id: 'x', label: 'X' }), true)).toBeUndefined();
	});
});

describe('stored theme', () => {
	it('reads and writes through localStorage', () => {
		const storage = memoryStorage({ k: 'pop' });
		vi.stubGlobal('localStorage', storage);
		expect(readStoredTheme('k')).toBe('pop');
		expect(readStoredTheme('other')).toBeNull();
		writeStoredTheme('k', 'line');
		expect(storage.getItem('k')).toBe('line');
	});

	it('reads null and writes nothing when storage throws', () => {
		vi.stubGlobal('localStorage', blockedStorage());
		expect(readStoredTheme('k')).toBeNull();
		expect(() => writeStoredTheme('k', 'pop')).not.toThrow();
	});
});

/** Runs the before-paint script against a stand-in `<html>`, storage and matchMedia. */
function runScript(
	script: string,
	{ stored, attr, dark, storage }: { stored?: string; attr?: string | null; dark?: boolean; storage?: Storage }
): string | null {
	let theme: string | null = attr ?? null;
	const documentElement = {
		getAttribute: (name: string): string | null => (name === 'data-theme' ? theme : null),
		setAttribute: (name: string, value: string): void => {
			if (name === 'data-theme') theme = value;
		}
	};
	const store = storage ?? memoryStorage(stored === undefined ? {} : { 'kern-theme': stored });
	const media =
		dark === undefined
			? (): never => {
					throw new Error('no matchMedia');
				}
			: (): { matches: boolean } => ({ matches: dark });
	const run = new Function('document', 'localStorage', 'matchMedia', script) as (d: unknown, s: Storage, m: unknown) => void;
	run({ documentElement }, store, media);
	return theme;
}

describe('createThemeScript', () => {
	it('applies a stored, well-formed theme id', () => {
		expect(runScript(themeScript, { stored: 'pop-dark', attr: 'code' })).toBe('pop-dark');
	});

	it('ignores a stored id with unsafe characters and a missing one', () => {
		expect(runScript(themeScript, { stored: 'x" onload="y', attr: 'code' })).toBe('code');
		expect(runScript(themeScript, { attr: 'code' })).toBe('code');
	});

	it('survives blocked storage', () => {
		expect(runScript(themeScript, { storage: blockedStorage(), attr: 'line' })).toBe('line');
	});

	it('followSystem picks the dark or light theme of the page family, Code when there is none', () => {
		const script = createThemeScript('kern-theme', { followSystem: true });
		expect(runScript(script, { attr: 'flower', dark: true })).toBe('flower-wald');
		expect(runScript(script, { attr: 'flower-wald', dark: false })).toBe('flower');
		expect(runScript(script, { attr: null, dark: true })).toBe('code');
		expect(runScript(script, { attr: 'acme', dark: false })).toBe('code-light');
		expect(runScript(script, { stored: 'pop', attr: 'flower', dark: true })).toBe('pop');
	});

	it('followSystem without matchMedia leaves the page alone', () => {
		const script = createThemeScript('kern-theme', { followSystem: true });
		expect(runScript(script, { attr: 'line' })).toBe('line');
	});

	it('escapes "<" so a key cannot close the script element', () => {
		const script = createThemeScript('</script><b>');
		expect(script).not.toContain('</script>');
		expect(script).toContain('\\u003c/script>');
	});
});

/** The reference: Node's own SHA-256 over the UTF-8 bytes, as a CSP hash source. */
const nodeHash = (source: string): string => `'sha256-${createHash('sha256').update(source, 'utf8').digest('base64')}'`;

describe('scriptHash and themeScriptHash', () => {
	it('match a SHA-256 of the UTF-8 text, in the quoted form script-src takes', async () => {
		for (const source of ['', 'a', themeScript, 'ä€😀 non-ASCII', 'x'.repeat(10_000), ' leading and trailing \n']) {
			const hash = await scriptHash(source);
			expect(hash).toBe(nodeHash(source));
			expect(hash).toMatch(/^'sha256-[A-Za-z0-9+/]{43}='$/);
		}
		// the published SHA-256 of the empty string (e3b0c442…b855), independent of node:crypto
		expect(await scriptHash('')).toBe("'sha256-47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU='");
	});

	it('hash exactly the text createThemeScript returns, for every option set', async () => {
		for (const options of [undefined, {}, { followSystem: true }, { followSystem: false }, { followSystem: undefined }]) {
			expect(await themeScriptHash('kern-theme', options)).toBe(nodeHash(createThemeScript('kern-theme', options)));
		}
		expect(await themeScriptHash('kern-theme')).toBe(nodeHash(themeScript));
	});

	it('change with the key and the options, so a stale hash cannot allow another script', async () => {
		const hashes = new Set([
			await themeScriptHash('kern-theme'),
			await themeScriptHash('kern-theme', { followSystem: true }),
			await themeScriptHash('app-theme'),
			await themeScriptHash('</script>')
		]);
		expect(hashes.size).toBe(4);
		// one character of whitespace is another script for the browser
		expect(await scriptHash(`${themeScript}\n`)).not.toBe(await scriptHash(themeScript));
	});

	it('reject with a clear error where Web Crypto is missing', async () => {
		vi.stubGlobal('crypto', undefined);
		await expect(scriptHash('x')).rejects.toThrow(/Web Crypto/);
		await expect(themeScriptHash('kern-theme')).rejects.toThrow(/Web Crypto/);
	});
});
