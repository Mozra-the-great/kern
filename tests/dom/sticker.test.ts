/**
 * Sticker (#182): one tool sticker through <img>. Every name renders; decorative by default (empty alt, hidden
 * from assistive technology, never focusable), a labelled image with `label`; integer scales; reactive props.
 * The sticker data (names, categories) is tested in tests/unit/stickers.test.ts, the stylesheet in
 * tests/mascot/sticker.spec.ts (a real browser).
 */
import { render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import Sticker from '../../src/lib/components/Sticker.svelte';
import { STICKER_NAMES, stickerGrid, type StickerName } from '../../src/lib/components/stickers.js';
import { reactive } from './reactive.svelte.js';

const BASE = '/assets/code';

function sticker(container: HTMLElement): HTMLElement {
	const host = container.querySelector<HTMLElement>('.k-sticker');
	if (host === null) throw new Error('no sticker rendered');
	return host;
}

function image(container: HTMLElement): HTMLImageElement {
	const img = container.querySelector('img');
	if (img === null) throw new Error('no image rendered');
	return img;
}

describe('Sticker markup', () => {
	it.each(STICKER_NAMES)('%s draws its own svg, decoratively, without any text', (name) => {
		const { container } = render(Sticker, { name, base: BASE });
		const img = image(container);
		expect(img.getAttribute('src')).toBe(`${BASE}/tool-stickers/sticker-${name}.svg`);
		expect(img.getAttribute('alt')).toBe('');
		expect(img.getAttribute('aria-hidden')).toBe('true');
		expect(img.getAttribute('draggable')).toBe('false');
		expect(img.getAttribute('decoding')).toBe('async');
		expect(sticker(container).dataset['sticker']).toBe(name);
		expect(container.textContent.trim()).toBe('');
	});

	it('is hidden from assistive technology and cannot take focus when decorative', () => {
		const { container } = render(Sticker, { name: 'shield', base: BASE });
		expect(screen.queryByRole('img')).toBeNull();
		expect(container.querySelectorAll('[tabindex], a, button, input')).toHaveLength(0);
		expect(image(container).hasAttribute('tabindex')).toBe(false);
	});

	it('is a named image with a label', () => {
		render(Sticker, { name: 'qr', base: BASE, label: 'QR code' });
		const img = screen.getByRole('img', { name: 'QR code' });
		expect(img.getAttribute('alt')).toBe('QR code');
		expect(img.hasAttribute('aria-hidden')).toBe(false);
	});

	it('stays decorative with an empty label', () => {
		const { container } = render(Sticker, { name: 'qr', base: BASE, label: '' });
		expect(image(container).getAttribute('aria-hidden')).toBe('true');
		expect(screen.queryByRole('img')).toBeNull();
	});

	it('renders no image without a source (name without base) and none for an unknown name', () => {
		const first = render(Sticker, { name: 'qr' });
		expect(first.container.querySelector('img')).toBeNull();
		expect(sticker(first.container).dataset['sticker']).toBe('qr');
		const second = render(Sticker, { name: 'mascots/axo' as StickerName, base: BASE });
		expect(second.container.querySelector('img')).toBeNull();
		expect(sticker(second.container).hasAttribute('data-sticker')).toBe(false);
		expect(sticker(second.container).style.getPropertyValue('--cols')).toBe('0');
	});

	it('src wins over base', () => {
		const { container } = render(Sticker, { name: 'qr', base: BASE, src: '/own/qr.svg' });
		expect(image(container).getAttribute('src')).toBe('/own/qr.svg');
		const alone = render(Sticker, { name: 'qr', src: '/other/qr.svg' });
		expect(image(alone.container).getAttribute('src')).toBe('/other/qr.svg');
	});

	it('reserves its box with width and height attributes at an integer scale', () => {
		const { container } = render(Sticker, { name: 'pdf-merge', base: BASE, scale: 6 });
		const { cols, rows } = stickerGrid('pdf-merge');
		expect(image(container).getAttribute('width')).toBe(String(cols * 6));
		expect(image(container).getAttribute('height')).toBe(String(rows * 6));
		expect(sticker(container).style.getPropertyValue('--scale')).toBe('6');
		expect(sticker(container).style.getPropertyValue('--cols')).toBe(String(cols));
		expect(sticker(container).style.getPropertyValue('--rows')).toBe(String(rows));
	});

	it('cuts fractional and invalid scales to whole pixels, default 4', () => {
		const { cols } = stickerGrid('mac');
		const fractional = render(Sticker, { name: 'mac', base: BASE, scale: 3.8 });
		expect(image(fractional.container).getAttribute('width')).toBe(String(cols * 3));
		const invalid = render(Sticker, { name: 'mac', base: BASE, scale: Number.NaN });
		expect(sticker(invalid.container).style.getPropertyValue('--scale')).toBe('1');
		const defaults = render(Sticker, { name: 'mac', base: BASE });
		expect(sticker(defaults.container).style.getPropertyValue('--scale')).toBe('4');
	});

	it('uses the same scale on phones unless a compact scale is given (also whole)', () => {
		const same = render(Sticker, { name: 'qr', base: BASE, scale: 6 });
		expect(sticker(same.container).style.getPropertyValue('--scale-compact')).toBe('6');
		const compact = render(Sticker, { name: 'qr', base: BASE, scale: 8, compactScale: 3.9 });
		expect(sticker(compact.container).style.getPropertyValue('--scale-compact')).toBe('3');
	});

	it('uses only custom-property styling the CSP allows (no inline style text)', () => {
		const { container } = render(Sticker, { name: 'qr', base: BASE });
		const declared = sticker(container).style;
		expect(declared.length).toBeGreaterThan(0);
		for (let index = 0; index < declared.length; index += 1) expect(declared.item(index)).toMatch(/^--/);
	});

	it('adds a custom class next to k-sticker, and a nullish class adds nothing', () => {
		const { container } = render(Sticker, { name: 'qr', base: BASE, class: 'hero' });
		expect(sticker(container).classList.contains('hero')).toBe(true);
		const nullish = render(Sticker, { name: 'qr', base: BASE, class: null as unknown as string });
		expect(sticker(nullish.container).getAttribute('class')).not.toMatch(/null|undefined/);
	});

	it('follows prop changes', async () => {
		const props = reactive<{ name: StickerName; base: string; scale: number; label: string | undefined }>({
			name: 'qr',
			base: BASE,
			scale: 4,
			label: undefined
		});
		const { container } = render(Sticker, { props });
		props.name = 'json';
		props.scale = 2;
		props.label = 'JSON';
		await vi.waitFor(() => expect(image(container).getAttribute('src')).toBe(`${BASE}/tool-stickers/sticker-json.svg`));
		expect(image(container).getAttribute('width')).toBe(String(stickerGrid('json').cols * 2));
		expect(screen.getByRole('img', { name: 'JSON' })).toBe(image(container));
	});
});
