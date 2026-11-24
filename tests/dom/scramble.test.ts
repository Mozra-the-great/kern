/**
 * Scramble: assistive technology reads the real text, never the glyphs; characters are covered by glyphs of
 * the pool and resolve within `duration` (spaces at once), glyphs change every `interval`, `oncomplete` fires
 * at the end, hover replays, and reduced motion, an empty text, an empty pool or `duration: 0` show the text
 * plainly.
 */
import { render } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Scramble from '../../src/lib/components/Scramble.svelte';
import { setMedia } from './env.js';

function covered(container: HTMLElement): string[] {
	return [...container.querySelectorAll('.g')].map((g) => g.textContent ?? '');
}

beforeEach(() => {
	vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame', 'performance'] });
});
afterEach(() => {
	vi.useRealTimers();
	vi.restoreAllMocks();
});

describe('Scramble', () => {
	it('covers the text with pool glyphs and resolves it within the duration', async () => {
		const oncomplete = vi.fn();
		const { container } = render(Scramble, { text: 'ab c', duration: 400, glyphs: 'XY', interval: 10, oncomplete, class: 'extra' });
		expect(container.querySelector('.k-scramble')?.classList.contains('extra')).toBe(true);
		expect(container.querySelector('.sr')?.textContent).toBe('ab c');
		expect(container.querySelector('.vis')?.getAttribute('aria-hidden')).toBe('true');
		const glyphs = covered(container);
		expect(glyphs.length).toBe(3);
		expect(glyphs.every((g) => g === 'X' || g === 'Y')).toBe(true);
		expect(container.querySelectorAll('.f.cover')).toHaveLength(3);
		await vi.advanceTimersByTimeAsync(100);
		await vi.advanceTimersByTimeAsync(400);
		expect(covered(container)).toEqual([]);
		expect(oncomplete).toHaveBeenCalledTimes(1);
	});

	it('keeps a glyph between swaps when the interval is long', async () => {
		vi.spyOn(Math, 'random').mockReturnValue(0.99);
		const { container } = render(Scramble, { text: 'ab', duration: 10_000, glyphs: 'XYZ', interval: 1000 });
		const first = covered(container);
		await vi.advanceTimersByTimeAsync(100);
		expect(covered(container)).toEqual(first);
	});

	it('replays on hover, only with hover set', async () => {
		const oncomplete = vi.fn();
		const { container } = render(Scramble, { text: 'hi', duration: 50, hover: true, oncomplete });
		await vi.advanceTimersByTimeAsync(200);
		expect(covered(container)).toEqual([]);
		container.querySelector('.k-scramble')?.dispatchEvent(new Event('pointerenter'));
		await vi.advanceTimersByTimeAsync(0);
		expect(covered(container).length).toBeGreaterThan(0);
		await vi.advanceTimersByTimeAsync(200);
		expect(oncomplete).toHaveBeenCalledTimes(2);
	});

	it('does not replay on hover without hover', async () => {
		const { container } = render(Scramble, { text: 'hi', duration: 50 });
		await vi.advanceTimersByTimeAsync(200);
		container.querySelector('.k-scramble')?.dispatchEvent(new Event('pointerenter'));
		await vi.advanceTimersByTimeAsync(0);
		expect(covered(container)).toEqual([]);
	});

	it.each([
		['reduced motion', { text: 'abc' }, true],
		['duration 0', { text: 'abc', duration: 0 }, false],
		['an empty pool', { text: 'abc', glyphs: '' }, false],
		['an empty text', { text: '' }, false]
	])('shows the text plainly with %s', (_name, props, reduce) => {
		if (reduce) setMedia('(prefers-reduced-motion: reduce)', true);
		const { container } = render(Scramble, { hover: true, ...props });
		expect(covered(container)).toEqual([]);
		container.querySelector('.k-scramble')?.dispatchEvent(new Event('pointerenter'));
		expect(covered(container)).toEqual([]);
	});

	it('stops when unmounted', async () => {
		const oncomplete = vi.fn();
		const { unmount } = render(Scramble, { text: 'abc', duration: 300 });
		unmount();
		await vi.advanceTimersByTimeAsync(1000);
		expect(oncomplete).not.toHaveBeenCalled();
	});
});
