/**
 * data-utils.ts: the shared helpers of the data components. `fill` (string templates), `tipAnchor` (tooltip
 * position inside a wrapper), the locale-safe `numberFormat` / `dateFormat`, `withDefaults` (option merge that
 * ignores `undefined`) and `joinIds` (`aria-describedby` lists; also covered in tests/components).
 */
import { describe, expect, it } from 'vitest';
import { dateFormat, fill, joinIds, numberFormat, tipAnchor, withDefaults } from '../../src/lib/components/data-utils.js';

function box(left: number, top: number, width: number): HTMLElement {
	const rect = { left, top, width, height: 10, right: left + width, bottom: top + 10, x: left, y: top };
	return { getBoundingClientRect: () => rect } as unknown as HTMLElement;
}

describe('fill', () => {
	it('replaces known placeholders and keeps unknown ones', () => {
		expect(fill('{n} of {total}, {missing}', { n: 2, total: 'ten' })).toBe('2 of ten, {missing}');
		expect(fill('no placeholders', {})).toBe('no placeholders');
	});
});

describe('tipAnchor', () => {
	const wrap = box(100, 50, 200);
	it('centres the tip over the target, relative to the wrapper', () => {
		expect(tipAnchor(wrap, box(180, 80, 40), 40)).toEqual({ x: 100, y: 30 });
	});
	it('clamps the centre so the tip stays inside the wrapper on both sides', () => {
		expect(tipAnchor(wrap, box(100, 50, 10), 60)).toEqual({ x: 30, y: 0 });
		expect(tipAnchor(wrap, box(290, 50, 10), 60)).toEqual({ x: 170, y: 0 });
	});
	it('centres a tip that is wider than the wrapper', () => {
		expect(tipAnchor(wrap, box(110, 60, 10), 300)).toEqual({ x: 100, y: 10 });
	});
});

describe('numberFormat and dateFormat', () => {
	const jan = new Date(Date.UTC(2024, 0, 1));
	it('use the given locale', () => {
		expect(numberFormat('de-DE').format(1234.5)).toBe('1.234,5');
		expect(numberFormat('en-US', { maximumFractionDigits: 0 }).format(1234.5)).toBe('1,235');
		expect(dateFormat('en-US', { year: 'numeric', timeZone: 'UTC' }).format(jan)).toBe('2024');
	});
	it('fall back to the default locale on a bad tag instead of throwing', () => {
		expect(numberFormat('not a locale!').format(1)).toBe(new Intl.NumberFormat().format(1));
		expect(dateFormat('not a locale!', { year: 'numeric', timeZone: 'UTC' }).format(jan)).toBe(
			new Intl.DateTimeFormat(undefined, { year: 'numeric', timeZone: 'UTC' }).format(jan)
		);
	});
});

describe('withDefaults', () => {
	const defaults: { a: number; b: string; c?: boolean | undefined } = { a: 1, b: 'x' };
	it('returns a copy of the defaults without overrides', () => {
		const out = withDefaults(defaults, undefined);
		expect(out).toEqual({ a: 1, b: 'x' });
		expect(out).not.toBe(defaults);
	});
	it('takes defined overrides and keeps the default for an explicit undefined', () => {
		expect(withDefaults(defaults, { a: undefined, b: 'y', c: false })).toEqual({ a: 1, b: 'y', c: false });
		expect(defaults).toEqual({ a: 1, b: 'x' });
	});
});

describe('joinIds', () => {
	it('joins ids and lists, dropping empty and repeated ones', () => {
		expect(joinIds('a', null, undefined, '', 'b  c', 'a')).toBe('a b c');
	});
	it('is undefined when nothing is left', () => {
		expect(joinIds()).toBeUndefined();
		expect(joinIds(null, ' ')).toBeUndefined();
	});
});
