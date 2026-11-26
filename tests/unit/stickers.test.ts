/**
 * The sticker data (#182): the names against the shipped files in both directions, the categories (every
 * sticker in exactly one, the two tables agree, neutral names) and the URL / path helpers.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CODE_ART } from '../../src/lib/components/code-art.js';
import {
	isStickerCategory,
	isStickerName,
	STICKER_CATEGORIES,
	STICKER_CATEGORY,
	STICKER_NAMES,
	STICKERS_BY_CATEGORY,
	stickerGrid,
	stickerPath,
	stickersOfCategory,
	stickerUrl,
	type StickerCategory,
	type StickerName
} from '../../src/lib/components/stickers.js';

const dir = resolve(import.meta.dirname, '../../assets/code/tool-stickers');
const files = readdirSync(dir)
	.filter((file) => file.endsWith('.svg'))
	.sort();

describe('sticker names', () => {
	it('lists 42 unique names in alphabetical order', () => {
		expect(STICKER_NAMES).toHaveLength(42);
		expect(new Set(STICKER_NAMES).size).toBe(42);
		expect([...STICKER_NAMES].sort()).toEqual([...STICKER_NAMES]);
	});

	it('matches the shipped files in both directions', () => {
		expect(files).toEqual(STICKER_NAMES.map((name) => `sticker-${name}.svg`));
	});

	it.each(STICKER_NAMES)('%s: has a catalogue entry that matches its viewBox', (name) => {
		const path = stickerPath(name);
		expect(path).toBe(`tool-stickers/sticker-${name}`);
		expect(Object.hasOwn(CODE_ART, path)).toBe(true);
		const { cols, rows } = stickerGrid(name);
		const svg = readFileSync(resolve(dir, `sticker-${name}.svg`), 'utf8');
		expect(svg).toContain(`viewBox="0 0 ${String(cols)} ${String(rows)}"`);
	});

	it('recognises names and nothing else', () => {
		expect(isStickerName('qr')).toBe(true);
		expect(isStickerName('tool-stickers/sticker-qr')).toBe(false);
		expect(isStickerName('constructor')).toBe(false);
		expect(isStickerName('')).toBe(false);
		expect(isStickerName(undefined)).toBe(false);
		expect(isStickerName(42)).toBe(false);
	});
});

describe('sticker categories', () => {
	it('names eight categories', () => {
		expect(STICKER_CATEGORIES).toEqual(['pdf', 'images', 'convert', 'time', 'network', 'text', 'dev', 'hosting']);
	});

	it('puts every sticker in exactly one category', () => {
		expect(Object.keys(STICKER_CATEGORY).sort()).toEqual([...STICKER_NAMES]);
		for (const name of STICKER_NAMES) expect(isStickerCategory(STICKER_CATEGORY[name])).toBe(true);
	});

	it('keeps the per-sticker table and the per-category lists in step', () => {
		const listed: StickerName[] = [];
		for (const category of STICKER_CATEGORIES) {
			const names = STICKERS_BY_CATEGORY[category];
			expect(names.length).toBeGreaterThan(0);
			for (const name of names) expect(STICKER_CATEGORY[name]).toBe(category);
			listed.push(...names);
		}
		expect([...listed].sort()).toEqual([...STICKER_NAMES]);
	});

	it('counts the stickers per category', () => {
		const counts = Object.fromEntries(STICKER_CATEGORIES.map((category) => [category, STICKERS_BY_CATEGORY[category].length]));
		expect(counts).toEqual({ pdf: 5, images: 6, convert: 6, time: 3, network: 2, text: 5, dev: 7, hosting: 8 });
	});

	it('uses neutral names: plain lower-case words, no product or app name', () => {
		for (const category of STICKER_CATEGORIES) expect(category).toMatch(/^[a-z]+$/);
		for (const forbidden of ['stuffcloud', 'kern', 'mozra']) expect(STICKER_CATEGORIES.join(' ')).not.toContain(forbidden);
	});

	it('lists the stickers of a category, and nothing for anything else', () => {
		expect(stickersOfCategory('network')).toEqual(['subnet', 'mac']);
		const known: StickerCategory = 'pdf';
		expect(stickersOfCategory(known)).toBe(STICKERS_BY_CATEGORY.pdf);
		expect(stickersOfCategory('constructor')).toEqual([]);
		expect(stickersOfCategory('')).toEqual([]);
	});

	it('recognises categories and nothing else', () => {
		expect(isStickerCategory('dev')).toBe(true);
		expect(isStickerCategory('toString')).toBe(false);
		expect(isStickerCategory(null)).toBe(false);
	});
});

describe('sticker URLs', () => {
	it('joins base and path with exactly one slash', () => {
		expect(stickerUrl('/art/code', 'qr')).toBe('/art/code/tool-stickers/sticker-qr.svg');
		expect(stickerUrl('/art/code/', 'pdf-merge')).toBe('/art/code/tool-stickers/sticker-pdf-merge.svg');
	});
});
