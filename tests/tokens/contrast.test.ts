/**
 * Theme contrast contract (WCAG 2.2: 1.4.3 text 4.5:1, 1.4.11 non-text 3:1).
 * Reads the shipped theme CSS, so a new theme or a changed token is checked
 * without copying values into the test. Every `data-theme` value that a theme
 * file names must pass every pair below.
 */
import { describe, expect, it } from 'vitest';
import { contrast, loadRules, resolveTokens, themeVariants } from './theme-css.ts';

const rules = loadRules('src/lib/themes/index.css');
const variants = themeVariants(rules);

/** [foreground, background, what it is]. Text pairs need 4.5:1. */
const TEXT: [string, string, string][] = [
	['--k-fg', '--k-bg', 'body text'],
	['--k-fg', '--k-bg-raised', 'text on cards, fields, overlays'],
	['--k-fg', '--k-bg-sunken', 'text on sunken surfaces'],
	['--k-fg', '--k-selected', 'hovered or active item'],
	['--k-fg', '--k-surface-selected', 'selected item'],
	['--k-fg-muted', '--k-bg', 'secondary text'],
	['--k-fg-muted', '--k-bg-raised', 'secondary text on cards'],
	['--k-fg-muted', '--k-bg-sunken', 'secondary text on sunken surfaces'],
	['--k-fg-hint', '--k-bg', 'field hints'],
	['--k-fg-hint', '--k-bg-raised', 'field hints on cards'],
	['--k-fg-hint', '--k-bg-sunken', 'drop-zone hint'],
	['--k-fg-soft', '--k-bg', 'long copy'],
	['--k-fg-soft', '--k-bg-raised', 'long copy on cards'],
	['--k-fg-code', '--k-bg-code', 'code'],
	['--k-fg-muted', '--k-bg-code', 'line numbers'],
	['--k-fg-code', '--k-bg-sunken', 'inline code'],
	['--k-on-primary', '--k-primary', 'primary button'],
	['--k-on-primary-hover', '--k-primary-hover', 'primary button, hover'],
	['--k-on-accent', '--k-accent', 'accent button'],
	['--k-on-danger', '--k-danger', 'danger button'],
	['--k-link', '--k-bg', 'link'],
	['--k-link', '--k-bg-raised', 'link on cards'],
	['--k-accent-text', '--k-bg', 'accent text'],
	['--k-accent-text', '--k-bg-raised', 'accent text on cards'],
	['--k-accent-text', '--k-accent-soft', 'accent badge'],
	['--k-danger', '--k-bg', 'error text'],
	['--k-danger', '--k-bg-raised', 'error text on cards'],
	['--k-danger', '--k-danger-soft', 'danger badge'],
	['--k-danger', '--k-surface-danger', 'danger alert title'],
	['--k-fg', '--k-surface-danger', 'danger alert text'],
	['--k-ok', '--k-bg', 'ok text'],
	['--k-ok', '--k-bg-raised', 'ok text on cards'],
	['--k-ok', '--k-ok-soft', 'ok badge'],
	['--k-ok', '--k-surface-ok', 'ok alert title'],
	['--k-fg', '--k-surface-ok', 'ok alert text'],
	['--k-warn', '--k-bg', 'warning text'],
	['--k-warn', '--k-bg-raised', 'warning text on cards'],
	['--k-warn', '--k-warn-soft', 'warning badge'],
	['--k-warn', '--k-surface-warn', 'warning alert title'],
	['--k-fg', '--k-surface-warn', 'warning alert text'],
	['--k-info', '--k-bg', 'info text'],
	['--k-info', '--k-bg-raised', 'info text on cards'],
	['--k-info', '--k-info-soft', 'info badge'],
	['--k-info', '--k-surface-info', 'info alert title'],
	['--k-fg', '--k-surface-info', 'info alert text'],
	['--k-fg-muted', '--k-surface-info', 'dismiss button on an info alert'],
	['--k-fg-muted', '--k-surface-ok', 'dismiss button on an ok alert'],
	['--k-fg-muted', '--k-surface-warn', 'dismiss button on a warning alert or toast'],
	['--k-fg-muted', '--k-surface-danger', 'dismiss button on a danger alert or toast']
];

/** Non-text pairs (control edges, focus, marks) need 3:1. */
const NON_TEXT: [string, string, string][] = [
	['--k-border', '--k-bg', 'field and control border'],
	['--k-border', '--k-bg-raised', 'field border on cards'],
	['--k-border', '--k-bg-sunken', 'control border on sunken surfaces'],
	['--k-line-dashed', '--k-bg', 'drop-zone edge'],
	['--k-line-dashed', '--k-bg-sunken', 'drop-zone edge on its own surface'],
	['--k-focus', '--k-bg', 'focus ring'],
	['--k-focus', '--k-bg-raised', 'focus ring on cards'],
	['--k-focus', '--k-bg-sunken', 'focus ring on sunken surfaces'],
	['--k-accent-mark', '--k-bg', 'progress fill, current-tab marker'],
	['--k-accent-mark', '--k-bg-raised', 'accent marks on cards'],
	['--k-accent-mark', '--k-bg-sunken', 'progress and slider fill on the track'],
	['--k-primary', '--k-bg', 'checked checkbox and switch'],
	['--k-primary', '--k-bg-raised', 'checked checkbox on cards'],
	['--k-danger', '--k-bg-raised', 'invalid field border']
];

describe('theme files', () => {
	it('define at least one variant per brand', () => {
		for (const brand of ['code', 'flower', 'pop', 'line']) {
			expect(
				variants.some((v) => v.startsWith(brand)),
				brand
			).toBe(true);
		}
	});

	it('keep colours out of @media rules (the contrast check reads top-level rules only)', () => {
		const colourToken = /^--k-(bg|fg|line|border|primary|on-|accent|link|danger|ok|warn|info|focus|selected|surface)/;
		for (const r of rules) {
			if (r.media === null || r.media.includes('prefers-reduced-motion')) continue;
			// forced colors (#27): the values are system colours of the user's palette, which no contrast check can know
			if (r.media.includes('forced-colors')) {
				const system = /^(Canvas|CanvasText|ButtonText|GrayText|Highlight|HighlightText|LinkText|none|1|1px) !important$/;
				for (const [prop, value] of r.decls) expect(value, `${prop} in @media ${r.media} of ${r.file}`).toMatch(system);
				continue;
			}
			for (const prop of r.decls.keys()) expect(prop, `${prop} in @media ${r.media} of ${r.file}`).not.toMatch(colourToken);
		}
	});
});

describe.each(variants)('data-theme="%s"', (theme) => {
	const tokens = resolveTokens(rules, theme);
	const value = (name: string): string => {
		const v = tokens.get(name);
		if (v === undefined) throw new Error(`${name} is not defined for ${theme}`);
		return v;
	};

	it.each(TEXT)('text %s on %s (%s) >= 4.5:1', (fg, bg) => {
		expect(contrast(value(fg), value(bg))).toBeGreaterThanOrEqual(4.5);
	});

	it.each(NON_TEXT)('non-text %s on %s (%s) >= 3:1', (fg, bg) => {
		expect(contrast(value(fg), value(bg))).toBeGreaterThanOrEqual(3);
	});
});
