/*
 * Helpers shared by SortableList and SelectGrid (#68): moving an item inside a list, keys of items and
 * the keyboard model of a grid (listbox with rows and columns). All of it is plain functions, so it is
 * testable without a DOM and safe on the server.
 */

/** What identifies an item while it moves: the value of `key`, or the item's `id`. */
export type ItemKey = string | number;

/** Returns a copy of `items` with the item at `from` moved so that it ends up at index `to`. Out-of-range indices return an unchanged copy. */
export function moveItem<T>(items: readonly T[], from: number, to: number): T[] {
	const next = [...items];
	if (!Number.isInteger(from) || !Number.isInteger(to)) return next;
	if (from < 0 || from >= next.length || to < 0 || to >= next.length || from === to) return next;
	const [moved] = next.splice(from, 1);
	next.splice(to, 0, moved);
	return next;
}

function field(item: unknown, name: string): unknown {
	return typeof item === 'object' && item !== null ? (item as Record<string, unknown>)[name] : undefined;
}

/** The key of an item: `item.id` (string or number), else its index. */
export function defaultKey(item: unknown, index: number): ItemKey {
	const id = field(item, 'id');
	return typeof id === 'string' || typeof id === 'number' ? id : index;
}

/** The name of an item: `item.label`, a plain string or number itself, else an empty string. */
export function defaultItemLabel(item: unknown): string {
	const label = field(item, 'label');
	if (typeof label === 'string') return label;
	return typeof item === 'string' || typeof item === 'number' ? String(item) : '';
}

/** `item.description` when it is a string. */
export function descriptionOf(item: unknown): string {
	const description = field(item, 'description');
	return typeof description === 'string' ? description : '';
}

/** `item.src` when it is a non-empty string. */
export function srcOf(item: unknown): string {
	const src = field(item, 'src');
	return typeof src === 'string' ? src : '';
}

export type NavKey = 'ArrowLeft' | 'ArrowRight' | 'ArrowUp' | 'ArrowDown' | 'Home' | 'End' | 'PageUp' | 'PageDown';

const NAV_KEYS: readonly string[] = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'];

export function isNavKey(key: string): key is NavKey {
	return NAV_KEYS.includes(key);
}

/** Rows that PageUp and PageDown jump. */
export const PAGE_ROWS = 5;

/**
 * Where the focus goes from `index` on `key` in a grid of `count` items with `columns` columns; stays
 * inside the grid. Up and down by a row do nothing when there is no row to go to; PageUp and PageDown
 * jump by `PAGE_ROWS` rows and stop at the first and last item.
 */
export function nextIndex(key: NavKey, index: number, count: number, columns: number): number {
	if (count <= 0) return 0;
	const last = count - 1;
	const cols = Math.max(1, Math.floor(columns));
	const clamp = (value: number): number => Math.min(Math.max(value, 0), last);
	switch (key) {
		case 'ArrowLeft':
			return clamp(index - 1);
		case 'ArrowRight':
			return clamp(index + 1);
		case 'ArrowUp':
			return index - cols < 0 ? index : index - cols;
		case 'ArrowDown':
			return index + cols > last ? index : index + cols;
		case 'Home':
			return 0;
		case 'End':
			return last;
		case 'PageUp':
			return clamp(index - cols * PAGE_ROWS);
		case 'PageDown':
			return clamp(index + cols * PAGE_ROWS);
	}
}

/** How far Alt+arrow moves an item: one place sideways, one row up or down. `undefined` for other keys. */
export function moveStep(key: string, columns: number): number | undefined {
	switch (key) {
		case 'ArrowLeft':
			return -1;
		case 'ArrowRight':
			return 1;
		case 'ArrowUp':
			return -Math.max(1, columns);
		case 'ArrowDown':
			return Math.max(1, columns);
		default:
			return undefined;
	}
}

/** The indices from `a` to `b`, either way round, both included. */
export function between(a: number, b: number): number[] {
	const from = Math.min(a, b);
	const to = Math.max(a, b);
	return Array.from({ length: to - from + 1 }, (_, offset) => from + offset);
}

/** How many items share the first row, from the vertical offset of each item (at least 1). */
export function columnsOf(tops: readonly number[]): number {
	return Math.max(1, tops.filter((top) => top === tops[0]).length);
}
