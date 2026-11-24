/**
 * motion.svelte.ts, the helpers of the effect components: the reduced-motion flag (also without matchMedia),
 * observeInView (with and without IntersectionObserver, empty batches), graphemes (with and without
 * Intl.Segmenter), the number formatter that never throws, and whole-number options.
 */
import { render } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Typewriter from '../../src/lib/components/Typewriter.svelte';
import {
	graphemes,
	makeNumberFormatter,
	observeInView,
	prefersReducedMotion,
	wholeNumberOptions
} from '../../src/lib/components/motion.svelte.js';
import { setMedia } from './env.js';

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('prefersReducedMotion / useReducedMotion', () => {
	it('follows the media query', () => {
		expect(prefersReducedMotion()).toBe(false);
		setMedia('(prefers-reduced-motion: reduce)', true);
		expect(prefersReducedMotion()).toBe(true);
	});

	it('is false without matchMedia, and a component still renders its text', () => {
		vi.stubGlobal('matchMedia', undefined);
		expect(prefersReducedMotion()).toBe(false);
		const { container } = render(Typewriter, { text: 'abc', speed: 0 });
		expect(container.querySelector('.sr')?.textContent).toBe('abc');
	});
});

describe('observeInView', () => {
	it('reports visible once without IntersectionObserver', () => {
		vi.stubGlobal('IntersectionObserver', undefined);
		const seen: boolean[] = [];
		const stop = observeInView(document.body, (v) => seen.push(v));
		expect(seen).toEqual([true]);
		expect(() => stop()).not.toThrow();
	});

	it('passes the options, reports the last entry of a batch and ignores an empty one', () => {
		let callback: IntersectionObserverCallback = () => undefined;
		let init: IntersectionObserverInit | undefined;
		const disconnect = vi.fn();
		class Observer {
			constructor(cb: IntersectionObserverCallback, options?: IntersectionObserverInit) {
				callback = cb;
				init = options;
			}
			observe(): void {}
			disconnect(): void {
				disconnect();
			}
		}
		vi.stubGlobal('IntersectionObserver', Observer);
		const seen: boolean[] = [];
		const stop = observeInView(document.body, (v) => seen.push(v), { threshold: 0.3, rootMargin: '10px' });
		expect(init).toEqual({ threshold: 0.3, rootMargin: '10px' });
		const self = {} as IntersectionObserver;
		callback([], self);
		callback([{ isIntersecting: false } as IntersectionObserverEntry, { isIntersecting: true } as IntersectionObserverEntry], self);
		expect(seen).toEqual([true]);
		stop();
		expect(disconnect).toHaveBeenCalledTimes(1);
		observeInView(document.body, () => undefined);
		expect(init).toEqual({ threshold: 0, rootMargin: '0px' });
	});
});

describe('graphemes', () => {
	it('keeps emoji and combining marks whole', () => {
		expect(graphemes('a👍🏽é')).toEqual(['a', '👍🏽', 'é']);
	});

	it('splits by code point without Intl.Segmenter', () => {
		vi.stubGlobal('Intl', { ...Intl, Segmenter: undefined });
		expect(graphemes('ab😀')).toEqual(['a', 'b', '😀']);
	});
});

describe('makeNumberFormatter', () => {
	it('formats with locale and options', () => {
		expect(makeNumberFormatter('de-DE', { minimumFractionDigits: 2 }).format(1.5)).toBe('1,50');
	});

	it('keeps the options when only the locale is invalid', () => {
		expect(makeNumberFormatter('not a locale!', { minimumIntegerDigits: 3 }).format(7)).toBe('007');
	});

	it('falls back to the default format when the options are invalid', () => {
		expect(makeNumberFormatter('en', { style: 'currency' }).format(3)).toBe(new Intl.NumberFormat().format(3));
	});
});

describe('wholeNumberOptions', () => {
	it('drops fractions for whole plain ranges', () => {
		expect(wholeNumberOptions(undefined, true)).toEqual({ maximumFractionDigits: 0 });
		expect(wholeNumberOptions({ style: 'unit', unit: 'meter' }, true)).toEqual({ style: 'unit', unit: 'meter', maximumFractionDigits: 0 });
	});

	it.each<[string, Intl.NumberFormatOptions | undefined, boolean]>([
		['fractional ranges', { style: 'decimal' }, false],
		['currencies', { style: 'currency', currency: 'EUR' }, true],
		['compact notation', { notation: 'compact' }, true],
		['explicit maximum digits', { maximumFractionDigits: 2 }, true],
		['explicit minimum digits', { minimumFractionDigits: 1 }, true],
		['explicit maximum significant digits', { maximumSignificantDigits: 3 }, true],
		['explicit minimum significant digits', { minimumSignificantDigits: 2 }, true]
	])('leaves %s alone', (_name, options, whole) => {
		expect(wholeNumberOptions(options, whole)).toBe(options);
	});
});
