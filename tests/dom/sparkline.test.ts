/**
 * Sparkline: the accessible summary (default and own template with every placeholder, the empty text, the
 * locale), the three variants (line, area, bar) and their paths, a single value and a flat series, `min` and
 * `max` (also non-finite), filtering of non-finite values, the last-value dot (`showLast`), height and width.
 */
import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Sparkline from '../../src/lib/components/Sparkline.svelte';

function root(): HTMLElement {
	return document.querySelector('.k-sparkline') as HTMLElement;
}

describe('Sparkline', () => {
	it('is an image named by the default summary, drawn as a line with a dot on the last value', () => {
		render(Sparkline, { values: [1, 3, 2], locale: 'en-US' });
		const img = screen.getByRole('img', { name: 'Trend: first 1, last 2, min 1, max 3' });
		expect(root().dataset['variant']).toBe('line');
		expect(root().style.height).toBe('32px');
		expect(root().style.width).toBe('');
		expect(img.querySelector('path.line')?.getAttribute('d')).toBe('M0.00 100.00L50.00 0.00L100.00 50.00');
		expect(img.querySelector('path.area')).toBeNull();
		expect(document.querySelector<HTMLElement>('.dot')?.style.top).toBe('calc(50% - 3px)');
	});

	it('fills the area, uses its own template, locale, size and class', () => {
		render(Sparkline, {
			values: [1.5, 2.25, Number.NaN, 4],
			variant: 'area',
			label: '{count} values from {first} to {last} ({min}–{max})',
			locale: 'de-DE',
			height: 4,
			width: 120,
			class: 'mine'
		});
		const img = screen.getByRole('img', { name: '3 values from 1,5 to 4 (1,5–4)' });
		expect(img.querySelector('path.area')?.getAttribute('d')).toMatch(/L100 100L0 100Z$/);
		expect(root().style.height).toBe('8px');
		expect(root().style.width).toBe('120px');
		expect(root().classList.contains('mine')).toBe(true);
	});

	it('draws bars from zero, at least 2 high, without a dot', () => {
		render(Sparkline, { values: [0, 5, 10], variant: 'bar', width: '50%' });
		const rects = Array.from(document.querySelectorAll('rect'));
		expect(rects).toHaveLength(3);
		expect(rects.map((r) => Number(r.getAttribute('height')))).toEqual([2, 50, 100]);
		expect(Number(rects[0]?.getAttribute('x'))).toBeCloseTo(5);
		expect(document.querySelector('.dot')).toBeNull();
		expect(document.querySelector('path')).toBeNull();
		expect(root().style.width).toBe('50%');
	});

	it('bars of negative values start at the smallest value', () => {
		render(Sparkline, { values: [-10, 10], variant: 'bar' });
		expect(Array.from(document.querySelectorAll('rect')).map((r) => Number(r.getAttribute('height')))).toEqual([2, 100]);
	});

	it('respects min and max, clamps values outside and ignores non-finite bounds', () => {
		const { unmount } = render(Sparkline, { values: [0, 50, 200], min: 0, max: 100 });
		expect(document.querySelector('path.line')?.getAttribute('d')).toBe('M0.00 100.00L50.00 50.00L100.00 0.00');
		unmount();
		render(Sparkline, { values: [0, 10], min: Number.NaN, max: Number.POSITIVE_INFINITY });
		expect(document.querySelector('path.line')?.getAttribute('d')).toBe('M0.00 100.00L100.00 0.00');
	});

	it('draws a single value and a flat series across the middle', () => {
		const { unmount } = render(Sparkline, { values: [7] });
		expect(document.querySelector('path.line')?.getAttribute('d')).toBe('M0 50L100 50');
		unmount();
		render(Sparkline, { values: [3, 3], showLast: false });
		expect(document.querySelector('path.line')?.getAttribute('d')).toBe('M0.00 50.00L100.00 50.00');
		expect(document.querySelector('.dot')).toBeNull();
	});

	it('without values has the empty name, no path and no dot', () => {
		const { unmount } = render(Sparkline, { values: [], variant: 'area' });
		const img = screen.getByRole('img', { name: 'No data' });
		expect(img.querySelector('path')).toBeNull();
		expect(document.querySelector('.dot')).toBeNull();
		unmount();
		const second = render(Sparkline, { values: [Number.NaN], variant: 'bar', emptyLabel: 'Nothing yet' });
		expect(screen.getByRole('img', { name: 'Nothing yet' }).querySelector('rect')).toBeNull();
		second.unmount();
		// A missing array (plain JavaScript callers) counts as no values.
		render(Sparkline, { values: undefined as unknown as number[] });
		expect(screen.getByRole('img', { name: 'No data' })).toBeTruthy();
	});
});
