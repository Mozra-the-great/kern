/**
 * Pixel-art runtime (#55), node side: the catalogue, the mascot name mapping (stuffcloud's), integer
 * scaling and the stylesheet rules of stuffcloud's ADR 0008 (ported from stuffcloud's
 * `mascots.test.ts` and the stylesheet part of `mascot.test.ts`). The browser behaviour
 * (motion states, off-screen and hidden-tab pause, reduced motion, layout shift) is tested
 * by mascot.spec.ts with Playwright.
 */
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
	artPath,
	artUrl,
	BOB_OFFSET_PX,
	BOB_PERIOD_MS,
	COMPACT_MAX_WIDTH_PX,
	integerScale,
	isMascotName,
	isCodeArt,
	isStuffcloudArt,
	MASCOT_NAMES,
	MASCOT_SOURCES,
	mascotSize,
	normaliseScale,
	CODE_ART,
	STUFFCLOUD_ART,
	type CodeArt,
	type StuffcloudArt
} from '../../src/lib/components/mascots.js';

const root = resolve(import.meta.dirname, '../..');
const read = (path: string): string => readFileSync(join(root, path), 'utf8');

interface ManifestEntry {
	bytes: number;
	sha256: string;
	cols?: number;
	rows?: number;
}
const manifest = JSON.parse(read('assets/code/manifest.json')) as { files: Record<string, ManifestEntry> };
const artKeys = Object.keys(CODE_ART) as CodeArt[];

describe('art catalogue', () => {
	it('lists every shipped SVG of the manifest, and nothing else', () => {
		const svgs = Object.keys(manifest.files)
			.filter((path) => path.endsWith('.svg'))
			.map((path) => path.replace(/\.svg$/, ''))
			.sort();
		expect([...artKeys].sort()).toEqual(svgs);
		expect(artKeys).toHaveLength(115);
	});

	it.each(artKeys)('%s: the pixel grid equals the viewBox of its SVG file', (key) => {
		const svg = read(`assets/code/${key}.svg`);
		const { cols, rows } = CODE_ART[key];
		expect(svg).toContain(`viewBox="0 0 ${String(cols)} ${String(rows)}"`);
		expect(svg).toContain('shape-rendering="crispEdges"');
	});

	it('ships the Code groups with the expected counts', () => {
		const count = (group: string): number => artKeys.filter((key) => key.startsWith(`${group}/`)).length;
		expect([count('logo'), count('mascots'), count('marks'), count('tool-stickers'), count('seasonal')]).toEqual([1, 9, 11, 42, 52]);
	});
});

describe('deprecated stuffcloud names (#85, removed in 1.0)', () => {
	it('STUFFCLOUD_ART is the very same catalogue as CODE_ART', () => {
		expect(STUFFCLOUD_ART).toBe(CODE_ART);
		const old: StuffcloudArt = 'mascots/axo';
		const next: CodeArt = old;
		expect(STUFFCLOUD_ART[old]).toEqual(CODE_ART[next]);
	});

	it('isStuffcloudArt answers like isCodeArt', () => {
		for (const name of ['mascots/axo', 'tool-stickers/sticker-qr', 'axo', 'constructor', '']) {
			expect(isStuffcloudArt(name)).toBe(isCodeArt(name));
		}
	});
});

describe('mascot cast (stuffcloud names → kern files)', () => {
	it('lists nine mascots, each once, with unique files', () => {
		expect(MASCOT_NAMES).toHaveLength(9);
		expect(new Set(MASCOT_NAMES).size).toBe(9);
		expect(new Set(MASCOT_NAMES.map((name) => MASCOT_SOURCES[name].file)).size).toBe(9);
	});

	it("maps the names exactly like stuffcloud's MASCOT_SOURCES", () => {
		const mapping = Object.fromEntries(MASCOT_NAMES.map((name) => [name, MASCOT_SOURCES[name].file]));
		expect(mapping).toEqual({
			stuffy: 'axo',
			mochi: 'mascot-cat',
			hop: 'mascot-frog',
			bun: 'mascot-bunny',
			bloop: 'mascot-jelly',
			waddle: 'mascot-penguin',
			ember: 'mascot-fox',
			boo: 'mascot-ghost',
			cumulo: 'mascot-cloudy'
		});
		// Grids as in stuffcloud's MASCOT_SOURCES.
		expect(MASCOT_SOURCES.stuffy).toMatchObject({ animal: 'axolotl', cols: 16, rows: 11 });
		expect(MASCOT_SOURCES.cumulo).toMatchObject({ animal: 'cloud', cols: 14, rows: 8 });
	});

	it.each(MASCOT_NAMES)('%s: points at a shipped mascot file with its grid', (name) => {
		const source = MASCOT_SOURCES[name];
		expect(source.art).toBe(`mascots/${source.file}`);
		expect(CODE_ART[source.art]).toEqual({ cols: source.cols, rows: source.rows });
	});

	it('resolves names and paths, and rejects anything else', () => {
		expect(artPath('stuffy')).toBe('mascots/axo');
		expect(artPath('tool-stickers/sticker-qr')).toBe('tool-stickers/sticker-qr');
		expect(artPath('axo')).toBeUndefined();
		expect(artPath('toString')).toBeUndefined();
		expect(isMascotName('boo')).toBe(true);
		expect(isMascotName('mascots/mascot-ghost')).toBe(false);
		expect(isCodeArt('mascots/mascot-ghost')).toBe(true);
		expect(isCodeArt('constructor')).toBe(false);
	});

	it('builds file URLs inside a base, with or without a trailing slash', () => {
		expect(artUrl('/art/code', 'stuffy')).toBe('/art/code/mascots/axo.svg');
		expect(artUrl('/art/code/', 'seasonal/deco-sun')).toBe('/art/code/seasonal/deco-sun.svg');
		expect(() => artUrl('/art', 'nope' as CodeArt)).toThrow('unknown Code art "nope"');
	});
});

describe('integer scaling', () => {
	it.each([
		[1, 1],
		[1.9, 1],
		[2, 2],
		[16, 16],
		[16.99, 16]
	])('normaliseScale(%s) is %s', (input, expected) => {
		expect(normaliseScale(input)).toBe(expected);
	});

	it('falls back to 1 below 1 and for values that are not numbers', () => {
		for (const bad of [0, 0.99, -3, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
			expect(normaliseScale(bad)).toBe(1);
		}
	});

	it('integerScale picks the largest whole scale that fits the width', () => {
		expect(integerScale(256, 16)).toBe(16);
		expect(integerScale(160, 16)).toBe(10);
		expect(integerScale(150, 16)).toBe(9);
		expect(integerScale(110, 16)).toBe(6);
		expect(integerScale(255, 16)).toBe(15);
		expect(integerScale(15, 16)).toBe(1);
	});

	it('integerScale never fails: bad widths or columns give 1', () => {
		expect(integerScale(Number.NaN, 16)).toBe(1);
		expect(integerScale(Number.POSITIVE_INFINITY, 16)).toBe(1);
		expect(integerScale(100, 0)).toBe(1);
		expect(integerScale(100, -4)).toBe(1);
	});

	it('mascotSize multiplies the grid by a whole scale', () => {
		expect(mascotSize({ cols: 16, rows: 11 }, 16)).toEqual({ width: 256, height: 176 });
		expect(mascotSize({ cols: 14, rows: 8 }, 3.7)).toEqual({ width: 42, height: 24 });
		expect(mascotSize({ cols: 12, rows: 12 }, 0)).toEqual({ width: 12, height: 12 });
	});

	it('keeps the design size of the main mascot: 256 px wide is 0.6875 of the width high', () => {
		const { width, height } = mascotSize(MASCOT_SOURCES.stuffy, 16);
		expect(height / width).toBe(0.6875);
	});
});

describe('Mascot stylesheet', () => {
	const source = read('src/lib/components/Mascot.svelte');
	const style = source.slice(source.indexOf('<style>'));
	const script = source.slice(0, source.indexOf('</script>', source.indexOf('<script lang="ts">\n')));

	it('scales pixel art without smoothing', () => {
		expect(style).toMatch(/image-rendering:\s*pixelated;/);
	});

	it('animates only transform, in two steps, with the period and offset as tokens', () => {
		const keyframes = /@keyframes k-mascot-bob \{[\s\S]*?\n\t\}/.exec(style)?.[0] ?? '';
		expect(keyframes).toContain('transform: translateY(0);');
		expect(keyframes).toContain(`transform: translateY(calc(var(--k-mascot-bob-offset, ${String(BOB_OFFSET_PX)}px) * -1));`);
		const properties = [...keyframes.matchAll(/^\s+([a-z-]+):/gm)].map((match) => match[1]);
		expect(new Set(properties)).toEqual(new Set(['transform']));
		expect(style).toContain(`animation: k-mascot-bob var(--k-mascot-bob-period, ${String(BOB_PERIOD_MS / 1000)}s) steps(1) infinite;`);
	});

	it('switches to the compact scale at the phone breakpoint', () => {
		expect(style).toContain(`@media (max-width: ${String(COMPACT_MAX_WIDTH_PX)}px)`);
	});

	it('shows the still pose under prefers-reduced-motion, for every motion state', () => {
		expect(style).toMatch(/@media \(prefers-reduced-motion: reduce\) \{\s*\[data-motion\] img \{\s*animation: none;\s*\}\s*\}/);
	});

	it('pauses with animation-play-state and never lets the box move', () => {
		expect(style).toMatch(/\[data-motion='paused'\] img \{\s*animation-play-state: paused;/);
		expect(style).not.toMatch(/will-change|position:\s*(absolute|fixed)/);
	});

	it('does no layout reads and no timers in the script (nothing per frame)', () => {
		expect(script).not.toMatch(
			/getBoundingClientRect|offsetWidth|offsetHeight|clientWidth|clientHeight|getComputedStyle|requestAnimationFrame|setInterval|setTimeout/
		);
	});

	it('never draws on a canvas and never builds data: URIs', () => {
		expect(source).not.toMatch(/<canvas|getContext|['"]data:|data:image/);
	});
});
