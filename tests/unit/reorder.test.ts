/**
 * The keyboard model and helpers behind SortableList and SelectGrid (#68), as plain functions: moving an
 * item, keys, row and column arithmetic. The same behaviour in a browser is tested by
 * tests/elements/reorder.spec.ts.
 */
import { describe, expect, it } from 'vitest';
import {
	PAGE_ROWS,
	between,
	columnsOf,
	defaultItemLabel,
	defaultKey,
	descriptionOf,
	isNavKey,
	moveItem,
	moveStep,
	nextIndex,
	srcOf
} from '../../src/lib/components/reorder.js';

describe('moveItem', () => {
	const abcd = ['a', 'b', 'c', 'd'];

	it('moves an item so that it ends up at the target index, in both directions', () => {
		expect(moveItem(abcd, 0, 2)).toEqual(['b', 'c', 'a', 'd']);
		expect(moveItem(abcd, 3, 0)).toEqual(['d', 'a', 'b', 'c']);
		expect(moveItem(abcd, 1, 2)).toEqual(['a', 'c', 'b', 'd']);
	});

	it('returns a copy and leaves the input alone', () => {
		const input = ['a', 'b'];
		const out = moveItem(input, 0, 1);
		expect(out).not.toBe(input);
		expect(input).toEqual(['a', 'b']);
		expect(moveItem(input, 0, 0)).toEqual(['a', 'b']);
		expect(moveItem(input, 0, 0)).not.toBe(input);
	});

	it('ignores indices that are out of range or not whole numbers', () => {
		expect(moveItem(abcd, -1, 2)).toEqual(abcd);
		expect(moveItem(abcd, 0, 4)).toEqual(abcd);
		expect(moveItem(abcd, 4, 0)).toEqual(abcd);
		expect(moveItem(abcd, 0.5, 2)).toEqual(abcd);
		expect(moveItem(abcd, Number.NaN, 2)).toEqual(abcd);
		expect(moveItem([], 0, 0)).toEqual([]);
	});

	it('keeps falsy items', () => {
		expect(moveItem([0, '', undefined, 1], 0, 3)).toEqual(['', undefined, 1, 0]);
	});
});

describe('item fields', () => {
	it('key: the id of an object, else the index', () => {
		expect(defaultKey({ id: 'x' }, 4)).toBe('x');
		expect(defaultKey({ id: 7 }, 4)).toBe(7);
		expect(defaultKey({ id: {} }, 4)).toBe(4);
		expect(defaultKey('plain', 2)).toBe(2);
		expect(defaultKey(null, 1)).toBe(1);
		expect(defaultKey(undefined, 0)).toBe(0);
	});

	it('name: the label of an object, a plain string or number, else empty', () => {
		expect(defaultItemLabel({ label: 'Report' })).toBe('Report');
		expect(defaultItemLabel('Report')).toBe('Report');
		expect(defaultItemLabel(3)).toBe('3');
		expect(defaultItemLabel({ label: 1 })).toBe('');
		expect(defaultItemLabel(null)).toBe('');
	});

	it('description and src only when they are strings', () => {
		expect(descriptionOf({ description: '3 pages' })).toBe('3 pages');
		expect(descriptionOf({ description: 3 })).toBe('');
		expect(descriptionOf('x')).toBe('');
		expect(srcOf({ src: '/a.png' })).toBe('/a.png');
		expect(srcOf({})).toBe('');
	});
});

describe('grid navigation', () => {
	// 11 items in rows of 4: 0-3, 4-7, 8-10.
	const count = 11;
	const columns = 4;
	const go = (key: Parameters<typeof nextIndex>[0], from: number): number => nextIndex(key, from, count, columns);

	it('knows the navigation keys', () => {
		for (const key of ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'])
			expect(isNavKey(key)).toBe(true);
		for (const key of [' ', 'Enter', 'a', 'Tab', 'Escape']) expect(isNavKey(key)).toBe(false);
	});

	it('moves by one place and stops at both ends', () => {
		expect(go('ArrowRight', 3)).toBe(4);
		expect(go('ArrowLeft', 4)).toBe(3);
		expect(go('ArrowLeft', 0)).toBe(0);
		expect(go('ArrowRight', 10)).toBe(10);
	});

	it('moves by one row and does nothing where there is no row', () => {
		expect(go('ArrowDown', 1)).toBe(5);
		expect(go('ArrowUp', 5)).toBe(1);
		expect(go('ArrowUp', 2)).toBe(2);
		// Item 7 would go to 11, which does not exist; item 10 has no row below.
		expect(go('ArrowDown', 7)).toBe(7);
		expect(go('ArrowDown', 10)).toBe(10);
		expect(go('ArrowDown', 6)).toBe(10);
	});

	it('Home and End go to the first and last item', () => {
		expect(go('Home', 9)).toBe(0);
		expect(go('End', 2)).toBe(10);
	});

	it('PageUp and PageDown jump by rows and stop at the ends', () => {
		expect(PAGE_ROWS).toBe(5);
		expect(nextIndex('PageDown', 1, 60, 4)).toBe(21);
		expect(nextIndex('PageUp', 21, 60, 4)).toBe(1);
		expect(go('PageDown', 1)).toBe(10);
		expect(go('PageUp', 9)).toBe(0);
	});

	it('survives an empty grid and nonsense column counts', () => {
		expect(nextIndex('ArrowDown', 0, 0, 4)).toBe(0);
		expect(nextIndex('End', 0, 0, 4)).toBe(0);
		expect(nextIndex('ArrowDown', 0, 3, 0)).toBe(1);
		expect(nextIndex('ArrowDown', 0, 3, 2.9)).toBe(2);
		expect(nextIndex('ArrowDown', 0, 3, -5)).toBe(1);
	});

	it('Alt+arrow moves by one place or one row; other keys move nothing', () => {
		expect(moveStep('ArrowLeft', 4)).toBe(-1);
		expect(moveStep('ArrowRight', 4)).toBe(1);
		expect(moveStep('ArrowUp', 4)).toBe(-4);
		expect(moveStep('ArrowDown', 4)).toBe(4);
		expect(moveStep('ArrowDown', 0)).toBe(1);
		expect(moveStep('Home', 4)).toBeUndefined();
		expect(moveStep('a', 4)).toBeUndefined();
	});

	it('between: both ends included, either way round', () => {
		expect(between(2, 5)).toEqual([2, 3, 4, 5]);
		expect(between(5, 2)).toEqual([2, 3, 4, 5]);
		expect(between(3, 3)).toEqual([3]);
	});

	it('the column count is the number of items in the first row', () => {
		expect(columnsOf([0, 0, 0, 0, 120, 120, 120, 120, 240])).toBe(4);
		expect(columnsOf([0, 0, 0])).toBe(3);
		expect(columnsOf([0, 100, 200])).toBe(1);
		// No layout (jsdom, display: none) reports the same offset for all: one long row, never zero.
		expect(columnsOf([])).toBe(1);
	});
});
