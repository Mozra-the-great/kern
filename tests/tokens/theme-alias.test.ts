/**
 * Deprecated `stuffcloud` names (#85, removed in 1.0): the theme was renamed to `code`, and the
 * old `data-theme` values, the old CSS entry and the old asset path must keep working. Reads
 * the shipped CSS and package.json, so a rule that names only one of the two spellings fails here.
 * The browser side (identical computed styles for both names) is tests/elements/theme-alias.spec.ts
 * and tests/targets/theme-alias.spec.ts.
 */
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadRules, matches, resolveTokens, themeVariants } from './theme-css.ts';
import { createThemeScript, isDarkTheme, themeFamily, themePair, THEME_FAMILIES } from '../../src/lib/components/theme.ts';

/** [new, deprecated alias]: every variant the theme file defines, plus a prefix-only (unknown) variant. */
const PAIRS: [string, string][] = [
	['code', 'stuffcloud'],
	['code-dark', 'stuffcloud-dark'],
	['code-light', 'stuffcloud-light'],
	['code-paper', 'stuffcloud-paper'],
	['code-contrast', 'stuffcloud-contrast'],
	['code-something', 'stuffcloud-something']
];

const rules = loadRules('src/lib/themes/index.css');
const entryRules = loadRules('src/lib/themes/code.css');

describe('data-theme aliases in the theme CSS', () => {
	it('defines every renamed variant and every alias', () => {
		const variants = themeVariants(rules);
		for (const [next, old] of PAIRS.slice(0, 5)) {
			expect(variants, next).toContain(next);
			expect(variants, old).toContain(old);
		}
	});

	it.each(PAIRS)('%s and %s resolve to exactly the same tokens', (next, old) => {
		for (const set of [rules, entryRules]) {
			const a = resolveTokens(set, next);
			const b = resolveTokens(set, old);
			expect(a.size).toBeGreaterThan(80);
			expect([...b.entries()]).toEqual([...a.entries()]);
			expect(a.get('--k-bg') ?? '').not.toBe('');
		}
	});

	it('names both spellings in every rule that names either (media rules included, so sizes match too)', () => {
		const brand = rules.filter((r) => /brands[\\/]code\.css$/.test(r.file));
		expect(brand.length).toBeGreaterThanOrEqual(6);
		for (const r of brand) {
			const hits = (theme: string): boolean => r.selectors.some((s) => matches(s, theme));
			for (const [next, old] of PAIRS) expect(hits(old), `${old} in a rule of ${next}`).toBe(hits(next));
		}
	});

	it('keeps the aliases out of the other brands', () => {
		for (const brand of ['flower', 'pop', 'line']) {
			const other = loadRules(`src/lib/themes/${brand}.css`);
			const selectors = other.flatMap((r) => r.selectors);
			expect(
				selectors.some((s) => /stuffcloud|code/.test(s)),
				brand
			).toBe(false);
			expect(themeVariants(other).length, brand).toBeGreaterThan(0);
		}
	});
});

describe('theme helpers know both families', () => {
	it('puts Code first and keeps the old family working', () => {
		expect(THEME_FAMILIES.code).toEqual({ light: 'code-light', dark: 'code' });
		expect(THEME_FAMILIES.stuffcloud).toEqual({ light: 'stuffcloud-light', dark: 'stuffcloud' });
		expect(themeFamily('code-light')).toBe('code');
		expect(themeFamily('stuffcloud-light')).toBe('stuffcloud');
	});

	it('themePair keeps a consumer in its own spelling, and falls back to Code', () => {
		expect(themePair('code-light').map((t) => t.id)).toEqual(['code-light', 'code']);
		expect(themePair('stuffcloud').map((t) => t.id)).toEqual(['stuffcloud-light', 'stuffcloud']);
		expect(themePair('nope').map((t) => t.id)).toEqual(['code-light', 'code']);
		expect(themePair(undefined).map((t) => t.id)).toEqual(['code-light', 'code']);
	});

	it('isDarkTheme agrees for both spellings', () => {
		for (const suffix of ['', '-dark', '-light', '-paper', '-contrast']) {
			expect(isDarkTheme(`stuffcloud${suffix}`), suffix).toBe(isDarkTheme(`code${suffix}`));
		}
		expect(isDarkTheme('code')).toBe(true);
		expect(isDarkTheme('code-light')).toBe(false);
	});

	it('the before-paint script knows both families and falls back to Code', () => {
		const script = createThemeScript('k', { followSystem: true });
		expect(script).toContain('"code":["code-light","code"]');
		expect(script).toContain('"stuffcloud":["stuffcloud-light","stuffcloud"]');
		expect(script).toContain('M["code"]');
	});
});

describe('package exports keep the old import paths', () => {
	const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as { name: string; exports: Record<string, string | object> };
	const require = createRequire(resolve('package.json'));

	it('maps themes/stuffcloud.css to the new file, without a second copy', () => {
		expect(pkg.exports['./themes/code.css']).toBe('./dist/themes/code.css');
		expect(pkg.exports['./themes/stuffcloud.css']).toBe(pkg.exports['./themes/code.css']);
		// the plain file path keeps working through a shim that only imports the new entry (no second copy of the rules)
		const shim = readFileSync('src/lib/themes/stuffcloud.css', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
		expect(shim.trim()).toBe("@import './code.css';");
		expect(existsSync('src/lib/themes/brands/stuffcloud.css')).toBe(false);
	});

	it('maps assets/stuffcloud/* to assets/code/* ahead of the general assets entry', () => {
		expect(pkg.exports['./assets/stuffcloud/*']).toBe('./assets/code/*');
		expect(pkg.exports['./assets/*']).toBe('./assets/*');
		expect(existsSync('assets/stuffcloud')).toBe(false);
	});

	it.each([['logo/logo.svg'], ['mascots/axo.svg'], ['tool-stickers/sticker-qr.svg'], ['manifest.json']])(
		'Node resolves assets/%s by the old and the new specifier to the same file',
		(file) => {
			const next = require.resolve(`${pkg.name}/assets/code/${file}`);
			const old = require.resolve(`${pkg.name}/assets/stuffcloud/${file}`);
			expect(old).toBe(next);
			expect(next).toBe(resolve('assets/code', file));
			// the other brands keep their own paths
			expect(require.resolve(`${pkg.name}/assets/pop/logo/logo.svg`)).toBe(resolve('assets/pop/logo/logo.svg'));
		}
	);

	// dist/ exists after `npm run build` (CI runs the unit tests after the build); without it only the map above is checked.
	it.skipIf(!existsSync('dist/themes/code.css'))('Node resolves themes/stuffcloud.css and themes/code.css to dist/themes/code.css', () => {
		const next = require.resolve(`${pkg.name}/themes/code.css`);
		const old = require.resolve(`${pkg.name}/themes/stuffcloud.css`);
		expect(old).toBe(next);
		expect(next).toBe(resolve('dist/themes/code.css'));
	});
});
