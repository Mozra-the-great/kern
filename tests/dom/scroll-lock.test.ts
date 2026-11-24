/**
 * scroll-lock.ts: the page scroll lock of the modal overlays, counted on <html>: nested locks, a release that
 * is safe to call twice, the scrollbar gutter kept while a scrollbar takes room, the earlier inline styles
 * restored (also when the stored copy is damaged), and a no-op without a document (SSR).
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { lockScroll } from '../../src/lib/components/scroll-lock.js';

const html = document.documentElement;

afterEach(() => {
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
	html.removeAttribute('style');
	html.removeAttribute('data-k-scroll-lock');
	html.removeAttribute('data-k-scroll-lock-prev');
});

describe('lockScroll', () => {
	it('hides the overflow until the last of nested locks is released, then restores the styles', () => {
		html.style.overflow = 'auto';
		const one = lockScroll();
		const two = lockScroll();
		expect(html.style.overflow).toBe('hidden');
		expect(html.getAttribute('data-k-scroll-lock')).toBe('2');
		one();
		one();
		expect(html.getAttribute('data-k-scroll-lock')).toBe('1');
		expect(html.style.overflow).toBe('hidden');
		two();
		expect(html.style.overflow).toBe('auto');
		expect(html.hasAttribute('data-k-scroll-lock')).toBe(false);
		expect(html.hasAttribute('data-k-scroll-lock-prev')).toBe(false);
	});

	it('keeps the room of a visible scrollbar and gives it back', () => {
		vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1024);
		vi.spyOn(html, 'clientWidth', 'get').mockReturnValue(1009);
		const release = lockScroll();
		expect(html.style.scrollbarGutter).toBe('stable');
		release();
		expect(html.style.scrollbarGutter).toBe('');
	});

	it('leaves the gutter alone without a scrollbar', () => {
		vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1024);
		vi.spyOn(html, 'clientWidth', 'get').mockReturnValue(1024);
		const release = lockScroll();
		expect(html.style.scrollbarGutter).toBe('');
		release();
	});

	it.each([
		['damaged JSON', '{oops'],
		['not an array', '{"overflow":"auto"}'],
		['wrong types', '[1, null]']
	])('clears the styles when the stored copy is %s', (_name, stored) => {
		html.style.overflow = 'scroll';
		const release = lockScroll();
		html.setAttribute('data-k-scroll-lock-prev', stored);
		release();
		expect(html.style.overflow).toBe('');
	});

	it('clears the styles when the stored copy and the count are gone', () => {
		const release = lockScroll();
		html.removeAttribute('data-k-scroll-lock-prev');
		html.removeAttribute('data-k-scroll-lock');
		release();
		expect(html.style.overflow).toBe('');
	});

	it('does nothing without a document', () => {
		vi.stubGlobal('document', undefined);
		const release = lockScroll();
		expect(release()).toBeUndefined();
		vi.unstubAllGlobals();
		expect(html.style.overflow).toBe('');
	});
});
