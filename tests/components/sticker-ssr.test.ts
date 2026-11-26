/**
 * Server-rendered markup of Sticker (svelte/server, #182): the first paint must already hold the right file,
 * the reserved box and the accessibility state (decorative by default, labelled with `label`) for every sticker.
 */
import { describe, expect, it } from 'vitest';
import Sticker from '../../src/lib/components/Sticker.svelte';
import { STICKER_NAMES, stickerGrid } from '../../src/lib/components/stickers.js';
import { html, one, tags, text } from './html.js';

const BASE = '/assets/code';

describe('Sticker on the server', () => {
	it.each(STICKER_NAMES)('%s: draws its own file, decoratively, at an integer scale', (name) => {
		const markup = html(Sticker, { name, base: BASE, scale: 3 });
		const img = one(markup, 'img');
		const { cols, rows } = stickerGrid(name);
		expect(img.attrs['src']).toBe(`${BASE}/tool-stickers/sticker-${name}.svg`);
		expect(img.attrs['alt']).toBe('');
		expect(img.attrs['aria-hidden']).toBe('true');
		expect(img.attrs['width']).toBe(String(cols * 3));
		expect(img.attrs['height']).toBe(String(rows * 3));
		expect(img.attrs['draggable']).toBe('false');
		expect(one(markup, 'span').attrs['data-sticker']).toBe(name);
		// A sticker is a picture: no text, nothing focusable, no role of its own.
		expect(text(markup)).toBe('');
		expect(tags(markup).filter((tag) => tag.name !== 'span' && tag.name !== 'img')).toEqual([]);
		expect(markup).not.toMatch(/tabindex|role=/);
	});

	it('is a labelled image with a label', () => {
		const img = one(html(Sticker, { name: 'qr', base: BASE, label: 'QR code' }), 'img');
		expect(img.attrs['alt']).toBe('QR code');
		expect('aria-hidden' in img.attrs).toBe(false);
	});

	it('stays decorative with an empty label', () => {
		const img = one(html(Sticker, { name: 'qr', base: BASE, label: '' }), 'img');
		expect(img.attrs['alt']).toBe('');
		expect(img.attrs['aria-hidden']).toBe('true');
	});

	it('draws no image without a source, or for a name that is not a sticker', () => {
		expect(tags(html(Sticker, { name: 'qr' }), 'img')).toEqual([]);
		const unknown = html(Sticker, { name: 'axo' as 'qr', base: BASE });
		expect(tags(unknown, 'img')).toEqual([]);
		expect('data-sticker' in one(unknown, 'span').attrs).toBe(false);
	});

	it('src wins over base, and a trailing slash on base is fine', () => {
		expect(one(html(Sticker, { name: 'qr', base: BASE, src: '/own/qr.svg' }), 'img').attrs['src']).toBe('/own/qr.svg');
		expect(one(html(Sticker, { name: 'qr', base: `${BASE}/` }), 'img').attrs['src']).toBe(`${BASE}/tool-stickers/sticker-qr.svg`);
	});

	it('cuts a fractional scale to whole pixels and defaults to 4', () => {
		const { cols } = stickerGrid('qr');
		expect(one(html(Sticker, { name: 'qr', base: BASE, scale: 5.9 }), 'img').attrs['width']).toBe(String(cols * 5));
		expect(one(html(Sticker, { name: 'qr', base: BASE }), 'img').attrs['width']).toBe(String(cols * 4));
		expect(one(html(Sticker, { name: 'qr', base: BASE, scale: Number.NaN }), 'img').attrs['width']).toBe(String(cols));
	});

	it('takes the scale on phones from compactScale (whole), else from scale', () => {
		expect(one(html(Sticker, { name: 'qr', base: BASE, scale: 6 }), 'span').attrs['style']).toContain('--scale-compact: 6');
		expect(one(html(Sticker, { name: 'qr', base: BASE, scale: 6, compactScale: 2.7 }), 'span').attrs['style']).toContain(
			'--scale-compact: 2'
		);
	});

	it('adds a custom class next to k-sticker', () => {
		expect(one(html(Sticker, { name: 'qr', base: BASE, class: 'hero' }), 'span').attrs['class']).toContain('k-sticker hero');
	});
});
