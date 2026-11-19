/**
 * The accent API needs each theme's surfaces without a browser, so src/lib/components/accent-themes.ts
 * holds a copy. This fails when a theme's `--k-bg`, `--k-bg-raised`, `--k-bg-sunken` or `--k-fg` changes
 * and the copy does not: update the table with the values printed here.
 */
import { describe, expect, it } from 'vitest';
import { ACCENT_GROUNDS } from '../../src/lib/components/accent-themes.ts';
import { isDarkTheme } from '../../src/lib/components/theme.ts';
import { loadRules, resolveTokens, themeVariants } from './theme-css.ts';

const rules = loadRules('src/lib/themes/index.css');

describe.each(themeVariants(rules))('accent ground of data-theme="%s"', (theme) => {
	const t = resolveTokens(rules, theme);
	const css = (name: string): string => t.get(name) ?? '(missing)';

	it('matches the theme CSS', () => {
		const ground = ACCENT_GROUNDS[theme];
		expect(ground, `add "${theme}" to ACCENT_GROUNDS`).toBeDefined();
		expect(
			{ bg: ground?.bg, raised: ground?.raised, sunken: ground?.sunken, fg: ground?.fg },
			`update ACCENT_GROUNDS["${theme}"] in src/lib/components/accent-themes.ts`
		).toEqual({ bg: css('--k-bg'), raised: css('--k-bg-raised'), sunken: css('--k-bg-sunken'), fg: css('--k-fg') });
	});

	it('has the scheme that the theme toggle assumes', () => {
		expect(ACCENT_GROUNDS[theme]?.scheme).toBe(isDarkTheme(theme) ? 'dark' : 'light');
	});
});
