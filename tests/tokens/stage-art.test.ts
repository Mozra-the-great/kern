/**
 * `--k-bg-stage` (#188): the flat panel a mascot or sticker scene stands on.
 *
 * Two things are guarded here:
 * - which themes set the token themselves and which keep the neutral default (`--k-bg-sunken`), so a
 *   theme cannot lose or gain a stage unnoticed;
 * - whether the art stays readable on it: WCAG 1.4.11 (non-text contrast, 3:1) between the colours on
 *   the silhouette of the art, the pixels that touch the stage, and the stage itself. The art has
 *   fixed colours (assets/README.md, "Fixed colours"), so this is measured on the shipped SVG files
 *   per theme that defines the stage, never assumed.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { MASCOT_SOURCES } from '../../src/lib/components/mascots.js';
import { stickerPath, STICKER_NAMES } from '../../src/lib/components/stickers.js';
import { dominantStroke, pixelSilhouette } from './art-edges.ts';
import { contrast, loadRules, matches, parseColor, resolveTokens, themeVariants, type Rule } from './theme-css.ts';

const rules = loadRules('src/lib/themes/index.css');
const variants = themeVariants(rules);
const STAGE = '--k-bg-stage';
const assets = resolve(import.meta.dirname, '../../assets');

/** Does a brand file (not `base.css`) set `name` for `theme`? Then the theme has a value of its own. */
const setsOwnValue = (name: string, theme: string): boolean =>
	rules.some(
		(r: Rule) => r.media === null && !r.file.endsWith('base.css') && r.selectors.some((s) => matches(s, theme)) && r.decls.has(name)
	);

/** The brand of a `data-theme` value; `stuffcloud*` are the deprecated aliases of `code*` (#85). */
const brandOf = (theme: string): string => {
	const brand = theme.split('-')[0];
	return brand === 'stuffcloud' ? 'code' : brand;
};
const withStage = variants.filter((v) => setsOwnValue(STAGE, v));
const withoutStage = variants.filter((v) => !setsOwnValue(STAGE, v));

/**
 * Code art whose silhouette touches the stage in a colour below 3:1 on Code's violet `#8b5cf6`. This is
 * a recorded finding, not an allowance: the art is drawn for the dark Code panel, it keeps its own
 * bright colours, and the design reference (design system, `pixel-art-and-mascots.md`) gives stickers on the
 * panel a 2px white outline (white on violet is 4.23:1) that the art files do not contain. The list is
 * what the test compares against, in both directions: a new piece of art that fails must be added here on
 * purpose, and a piece that starts to pass (or a stage that changes) must come off it.
 */
const BELOW_3_ON_VIOLET: readonly string[] = [
	'mascots/axo',
	'mascots/mascot-bunny',
	'mascots/mascot-cloudy',
	'mascots/mascot-fox',
	'mascots/mascot-frog',
	'mascots/mascot-jelly',
	'mascots/mascot-penguin',
	'tool-stickers/sticker-base64',
	'tool-stickers/sticker-burn',
	'tool-stickers/sticker-colour',
	'tool-stickers/sticker-diff',
	'tool-stickers/sticker-download',
	'tool-stickers/sticker-expiry',
	'tool-stickers/sticker-hash',
	'tool-stickers/sticker-img-background',
	'tool-stickers/sticker-img-convert',
	'tool-stickers/sticker-img-crop',
	'tool-stickers/sticker-img-exif',
	'tool-stickers/sticker-img-pixel',
	'tool-stickers/sticker-img-resize',
	'tool-stickers/sticker-json',
	'tool-stickers/sticker-jwt',
	'tool-stickers/sticker-mac',
	'tool-stickers/sticker-markdown',
	'tool-stickers/sticker-password',
	'tool-stickers/sticker-paste',
	'tool-stickers/sticker-pdf-compress',
	'tool-stickers/sticker-pdf-merge',
	'tool-stickers/sticker-pdf-protect',
	'tool-stickers/sticker-pdf-rotate',
	'tool-stickers/sticker-pdf-split',
	'tool-stickers/sticker-qr',
	'tool-stickers/sticker-regex',
	'tool-stickers/sticker-report',
	'tool-stickers/sticker-shield',
	'tool-stickers/sticker-site',
	'tool-stickers/sticker-sql',
	'tool-stickers/sticker-subnet',
	'tool-stickers/sticker-trash',
	'tool-stickers/sticker-units',
	'tool-stickers/sticker-url',
	'tool-stickers/sticker-xml',
	'tool-stickers/sticker-yaml'
];

/** The recorded failures per stage colour of the Code art. Any other stage colour must pass for all art. */
const RECORDED_BELOW_3: Readonly<Record<string, readonly string[]>> = { '#8b5cf6': BELOW_3_ON_VIOLET };

/** The art `Mascot` and `Sticker` draw: the nine mascots and the 42 tool stickers. */
const CODE_ART: readonly string[] = [
	...Object.values(MASCOT_SOURCES).map((m) => m.art as string),
	...STICKER_NAMES.map((n) => stickerPath(n) as string)
];

/** Worst contrast between a colour on the art's silhouette and `stage`. */
const worstEdge = (art: string, stage: string): number => {
	const edge = pixelSilhouette(readFileSync(resolve(assets, 'code', `${art}.svg`), 'utf8'));
	return Math.min(...[...edge.keys()].map((colour) => contrast(colour, stage)));
};

describe('the stage token', () => {
	it('is defined by base.css with a neutral default that exists in every theme', () => {
		const base = readFileSync(resolve(import.meta.dirname, '../../src/lib/themes/base.css'), 'utf8');
		expect(base).toMatch(/--k-bg-stage:\s*var\(--k-bg-sunken\);/);
	});

	it('is set by every variant of Code (and its old names), Pop and Flower', () => {
		expect([...new Set(withStage.map(brandOf))].sort()).toEqual(['code', 'flower', 'pop']);
		for (const theme of variants.filter((v) => ['code', 'pop', 'flower'].includes(brandOf(v)))) expect(withStage, theme).toContain(theme);
	});

	it('is not set by Line, which has no stage, so it keeps the neutral default (bg-sunken)', () => {
		expect([...new Set(withoutStage.map(brandOf))]).toEqual(['line']);
		for (const theme of withoutStage) {
			const tokens = resolveTokens(rules, theme);
			expect(tokens.get(STAGE), theme).toBe(tokens.get('--k-bg-sunken'));
		}
	});

	it.each(variants)('resolves to an opaque colour in data-theme="%s"', (theme) => {
		const value = resolveTokens(rules, theme).get(STAGE);
		expect(value, theme).toBeDefined();
		expect(parseColor(value ?? '').a).toBe(1);
	});

	it('has the values of the design systems: violet in Code, green in Pop, cream in Flower', () => {
		const expected: Readonly<Record<string, string>> = { code: '#8b5cf6', pop: '#10a916', flower: '#f6f0e0' };
		for (const theme of withStage) expect(resolveTokens(rules, theme).get(STAGE), theme).toBe(expected[brandOf(theme)]);
	});
});

describe('art readability on the stage (WCAG 1.4.11, 3:1)', () => {
	it('knows the nine mascots and 42 stickers', () => {
		expect(CODE_ART).toHaveLength(51);
		expect(new Set(CODE_ART).size).toBe(51);
	});

	it('measures a silhouette from the file, not from a table', () => {
		// axo.svg: a pink body (#ffa6c4) with red tufts (#ff4f8b) on the outside, dark eyes and mouth inside
		const edge = pixelSilhouette(readFileSync(resolve(assets, 'code/mascots/axo.svg'), 'utf8'));
		expect([...edge.keys()].sort()).toEqual(['#ff4f8b', '#ffa6c4']);
	});

	describe.each(withStage.filter((v) => brandOf(v) === 'code'))('Code art on data-theme="%s"', (theme) => {
		const stage = resolveTokens(rules, theme).get(STAGE) ?? '';

		it('has exactly the recorded pieces below 3:1 (a new failure or a fixed piece changes this list)', () => {
			const below = CODE_ART.filter((art) => worstEdge(art, stage) < 3).sort();
			expect(below).toEqual([...(RECORDED_BELOW_3[stage] ?? [])].sort());
		});
	});

	describe.each(withStage.filter((v) => brandOf(v) === 'pop'))('Pop mascots on data-theme="%s"', (theme) => {
		const stage = resolveTokens(rules, theme).get(STAGE) ?? '';
		const files = readdirSync(resolve(assets, 'pop/mascots')).filter((f) => f.endsWith('.svg'));

		it.each(files)('the ink outline of %s reaches 3:1 on the stage', (file) => {
			const outline = dominantStroke(readFileSync(resolve(assets, 'pop/mascots', file), 'utf8'));
			expect(outline, file).toBe('#151714');
			expect(contrast(outline ?? '', stage), file).toBeGreaterThanOrEqual(3);
		});
	});

	describe.each(withStage.filter((v) => brandOf(v) === 'flower'))('Flower art on data-theme="%s"', (theme) => {
		it('has no outline to measure: the motifs are filled shapes drawn for the cream ground the stage is', () => {
			for (const group of readdirSync(resolve(assets, 'flower'), { withFileTypes: true }).filter((d) => d.isDirectory())) {
				for (const file of readdirSync(resolve(assets, 'flower', group.name)).filter((f) => f.endsWith('.svg'))) {
					expect(dominantStroke(readFileSync(resolve(assets, 'flower', group.name, file), 'utf8')), `${group.name}/${file}`).toBeNull();
				}
			}
			expect(resolveTokens(rules, theme).get(STAGE)).toBe('#f6f0e0');
		});
	});
});
