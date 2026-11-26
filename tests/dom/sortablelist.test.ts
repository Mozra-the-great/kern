/**
 * SortableList in jsdom: the labelled list, the up/down/remove buttons with their names and disabled ends, the
 * callbacks (the list never reorders itself), the focus after the host applied a move or a removal (pressed
 * button, its partner at an end, the next item after a removal, nothing after the wish expired), drag and drop
 * with the mouse (`onmove`, the drop marker, `dragDrop={false}`), custom keys, labels and the `item` snippet.
 * Markup and the pure helpers are tests/components/reorder.test.ts and tests/unit/reorder.test.ts.
 */
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { tick } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import SortableList, { type SortableItem } from '../../src/lib/components/SortableList.svelte';
import { moveItem } from '../../src/lib/components/reorder.js';
import SortableListBoundary from './harness/SortableListBoundary.svelte';
import { mapSnippet2 } from './helpers.js';
import { reactive } from './reactive.svelte.js';

afterEach(() => {
	vi.restoreAllMocks();
});

const fruit: SortableItem[] = [
	{ id: 'a', label: 'Apple', description: 'Red' },
	{ id: 'b', label: 'Banana' },
	{ id: 'c', label: 'Cherry' }
];
const rows = (): HTMLElement[] => Array.from(document.querySelectorAll<HTMLElement>('li.item'));
const names = (): string[] => rows().map((row) => row.querySelector('.name')?.textContent ?? '');

/** Props of a host that applies every move and removal. */
function host(items: SortableItem[] = fruit): {
	items: SortableItem[];
	onmove: (from: number, to: number) => void;
	onremove: (index: number) => void;
} {
	const props = reactive<{ items: SortableItem[]; onmove: (from: number, to: number) => void; onremove: (index: number) => void }>({
		items,
		onmove: (from, to) => {
			props.items = moveItem(props.items, from, to);
		},
		onremove: (index) => {
			props.items = props.items.filter((_, i) => i !== index);
		}
	});
	return props;
}

/** A drag event with a minimal `dataTransfer` (jsdom has no DragEvent), or none at all. */
function drag(type: string, transfer = true): Event & { dataTransfer: { effectAllowed: string; dropEffect: string; data: string } | null } {
	const event = new Event(type, { bubbles: true, cancelable: true });
	const data = transfer
		? {
				effectAllowed: '',
				dropEffect: '',
				data: '',
				setData(_type: string, value: string): void {
					this.data = value;
				}
			}
		: null;
	Object.defineProperty(event, 'dataTransfer', { value: data });
	return event as Event & { dataTransfer: { effectAllowed: string; dropEffect: string; data: string } | null };
}

describe('SortableList', () => {
	it('renders a named list with the labels, descriptions and named buttons, disabled at the ends', () => {
		render(SortableList, { items: fruit });
		expect(screen.getByRole('list', { name: 'Items' })).toBeTruthy();
		expect(names()).toEqual(['Apple', 'Banana', 'Cherry']);
		expect(screen.getByText('Red').classList.contains('description')).toBe(true);
		expect(rows()[1]?.querySelector('.description')).toBeNull();
		expect(screen.getByRole('button', { name: 'Move Apple up' }).hasAttribute('disabled')).toBe(true);
		expect(screen.getByRole('button', { name: 'Move Apple down' }).hasAttribute('disabled')).toBe(false);
		expect(screen.getByRole('button', { name: 'Move Cherry down' }).hasAttribute('disabled')).toBe(true);
		expect(screen.getByRole('button', { name: 'Remove Banana' }).textContent.trim()).toBe('Remove');
		expect(rows().every((row) => row.getAttribute('draggable') === 'true')).toBe(true);
	});

	it('uses the texts, labels, id and class it is given and can hide remove and dragging', () => {
		render(SortableList, {
			items: fruit,
			label: 'Fruit',
			upText: 'Hoch',
			downText: 'Runter',
			removeText: 'Weg',
			upLabel: '{name} hoch',
			downLabel: '{name} runter',
			removeLabel: '{name} weg',
			removable: false,
			dragDrop: false,
			id: 'fruit',
			class: 'extra'
		});
		const list = screen.getByRole('list', { name: 'Fruit' });
		expect(list.id).toBe('fruit');
		expect(list.classList.contains('extra')).toBe(true);
		expect(screen.getByRole('button', { name: 'Apple hoch' }).textContent.trim()).toBe('Hoch');
		expect(screen.getByRole('button', { name: 'Apple runter' }).textContent.trim()).toBe('Runter');
		expect(screen.queryByRole('button', { name: /weg/ })).toBeNull();
		expect(rows().some((row) => row.hasAttribute('draggable'))).toBe(false);
	});

	it('reports moves and removals without reordering by itself', async () => {
		const user = userEvent.setup();
		const onmove = vi.fn<(from: number, to: number) => void>();
		const onremove = vi.fn<(index: number) => void>();
		render(SortableList, { items: fruit, onmove, onremove });
		await user.click(screen.getByRole('button', { name: 'Move Banana up' }));
		expect(onmove).toHaveBeenLastCalledWith(1, 0);
		await user.click(screen.getByRole('button', { name: 'Move Banana down' }));
		expect(onmove).toHaveBeenLastCalledWith(1, 2);
		await user.click(screen.getByRole('button', { name: 'Remove Cherry' }));
		expect(onremove).toHaveBeenCalledWith(2);
		expect(names()).toEqual(['Apple', 'Banana', 'Cherry']);
	});

	it('a disabled end button does nothing, and the buttons work without callbacks', async () => {
		const user = userEvent.setup();
		render(SortableList, { items: fruit });
		const up = screen.getByRole('button', { name: 'Move Apple up' });
		up.removeAttribute('disabled');
		await user.click(up);
		const down = screen.getByRole('button', { name: 'Move Cherry down' });
		down.removeAttribute('disabled');
		await user.click(down);
		await user.click(screen.getByRole('button', { name: 'Move Apple down' }));
		await user.click(screen.getByRole('button', { name: 'Remove Apple' }));
		expect(names()).toEqual(['Apple', 'Banana', 'Cherry']);
	});

	it('keeps the focus on the pressed button after the host moved the item', async () => {
		const user = userEvent.setup();
		const props = host();
		render(SortableList, { props });
		await user.click(screen.getByRole('button', { name: 'Move Apple down' }));
		await tick();
		expect(names()).toEqual(['Banana', 'Apple', 'Cherry']);
		expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Move Apple down' }));
	});

	it('moves the focus to the partner button when the pressed one became disabled at an end', async () => {
		const user = userEvent.setup();
		const props = host();
		render(SortableList, { props });
		await user.click(screen.getByRole('button', { name: 'Move Banana up' }));
		await tick();
		expect(names()).toEqual(['Banana', 'Apple', 'Cherry']);
		expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Move Banana down' }));
		await user.click(screen.getByRole('button', { name: 'Move Apple down' }));
		await tick();
		expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Move Apple up' }));
	});

	it('focuses nothing when the moved item has no enabled button at its new place', async () => {
		const user = userEvent.setup();
		const props = reactive<{ items: SortableItem[]; onmove: () => void }>({ items: fruit.slice(0, 2), onmove: () => undefined });
		render(SortableList, { props });
		const button = screen.getByRole('button', { name: 'Move Apple down' });
		await user.click(button);
		props.items = [fruit[1] as SortableItem];
		await tick();
		expect(document.activeElement).toBe(document.body);
	});

	it('after a removal, focuses the remove button of the item that moved up, or the new last item', async () => {
		const user = userEvent.setup();
		const props = host();
		render(SortableList, { props });
		await user.click(screen.getByRole('button', { name: 'Remove Apple' }));
		await tick();
		expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Remove Banana' }));
		await user.click(screen.getByRole('button', { name: 'Remove Cherry' }));
		await tick();
		expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Remove Banana' }));
	});

	it('after a removal without remove buttons, focuses the first enabled button of that place', async () => {
		const props = reactive<{ items: SortableItem[]; removable: boolean; onremove: (index: number) => void }>({
			items: fruit,
			removable: true,
			onremove: (index) => {
				props.removable = false;
				props.items = props.items.filter((_, i) => i !== index);
			}
		});
		render(SortableList, { props });
		await userEvent.setup().click(screen.getByRole('button', { name: 'Remove Apple' }));
		await tick();
		expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Move Banana down' }));
	});

	it('waits for the removal and gives up when it never comes in time', async () => {
		const user = userEvent.setup();
		const props = reactive<{ items: SortableItem[]; onremove: () => void }>({ items: fruit, onremove: () => undefined });
		render(SortableList, { props });
		await user.click(screen.getByRole('button', { name: 'Remove Apple' }));
		// A change that removes nothing keeps the wish.
		props.items = [...fruit];
		await tick();
		const now = performance.now();
		vi.spyOn(performance, 'now').mockReturnValue(now + 5000);
		props.items = fruit.slice(1);
		await tick();
		expect(document.activeElement).not.toBe(screen.getByRole('button', { name: 'Remove Banana' }));
		vi.restoreAllMocks();
		props.items = fruit.slice(2);
		await tick();
		expect(document.activeElement).not.toBe(screen.getByRole('button', { name: 'Remove Cherry' }));
	});

	it('moves an item by dragging it onto another', async () => {
		const onmove = vi.fn<(from: number, to: number) => void>();
		render(SortableList, { items: fruit, onmove });
		const [first, , third] = rows() as [HTMLElement, HTMLElement, HTMLElement];
		const start = drag('dragstart');
		first.dispatchEvent(start);
		expect(start.dataTransfer?.effectAllowed).toBe('move');
		expect(start.dataTransfer?.data).toBe('0');
		const over = drag('dragover');
		third.dispatchEvent(over);
		expect(over.defaultPrevented).toBe(true);
		expect(over.dataTransfer?.dropEffect).toBe('move');
		await tick();
		expect(first.classList.contains('dragging')).toBe(true);
		expect(third.classList.contains('drop')).toBe(true);
		const drop = drag('drop');
		third.dispatchEvent(drop);
		expect(drop.defaultPrevented).toBe(true);
		expect(onmove).toHaveBeenCalledWith(0, 2);
		await tick();
		expect(first.classList.contains('dragging')).toBe(false);
		expect(third.classList.contains('drop')).toBe(false);
	});

	it('ignores a drop on the dragged item itself, drags it was not the source of, and cleans up on dragend', async () => {
		const onmove = vi.fn<(from: number, to: number) => void>();
		render(SortableList, { items: fruit, onmove });
		const [first, second] = rows() as [HTMLElement, HTMLElement];
		const stray = drag('dragover');
		second.dispatchEvent(stray);
		expect(stray.defaultPrevented).toBe(false);
		second.dispatchEvent(drag('drop'));
		first.dispatchEvent(drag('dragstart', false));
		first.dispatchEvent(drag('dragover', false));
		await tick();
		expect(first.classList.contains('drop')).toBe(false);
		first.dispatchEvent(drag('drop', false));
		expect(onmove).not.toHaveBeenCalled();
		first.dispatchEvent(drag('dragstart'));
		second.dispatchEvent(drag('dragover'));
		first.dispatchEvent(drag('dragend'));
		await tick();
		expect(second.classList.contains('drop')).toBe(false);
		second.dispatchEvent(drag('drop'));
		expect(onmove).not.toHaveBeenCalled();
		first.dispatchEvent(drag('dragstart'));
		second.dispatchEvent(drag('drop'));
	});

	it('takes any item type with key, itemLabel and an item snippet; strings label themselves', () => {
		const item = mapSnippet2<{ code: string }, number>((entry, i) => `${entry.code}@${String(i)}`);
		const key = vi.fn((entry: { code: string }) => entry.code);
		render(SortableList, {
			items: [{ code: 'x' }, { code: 'y' }],
			key,
			itemLabel: (entry: { code: string }) => `Code ${entry.code}`,
			item
		});
		expect(screen.getByText('x@0')).toBeTruthy();
		expect(screen.getByRole('button', { name: 'Move Code y up' })).toBeTruthy();
		expect(key).toHaveBeenCalled();
		render(SortableList, { items: ['one', 'two'], label: 'Words' });
		expect(screen.getByRole('button', { name: 'Remove two' })).toBeTruthy();
	});

	it('renders an empty list for items that are not an array', () => {
		render(SortableList, { items: undefined as unknown as readonly SortableItem[] });
		expect(rows()).toEqual([]);
	});

	describe('emptied and refilled (#175)', () => {
		it('does not throw when the last item is removed with the focus on its button, and works again after a refill', async () => {
			const user = userEvent.setup();
			const errors: unknown[] = [];
			const props = reactive<{ items: SortableItem[]; onremove: (index: number) => void; onerror: (error: unknown) => void }>({
				items: fruit.slice(0, 2),
				onremove: (index) => {
					props.items = props.items.filter((_, i) => i !== index);
				},
				onerror: (error) => errors.push(error)
			});
			render(SortableListBoundary, { props });
			await user.click(screen.getByRole('button', { name: 'Remove Banana' }));
			await tick();
			expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Remove Apple' }));
			await user.click(screen.getByRole('button', { name: 'Remove Apple' }));
			await tick();
			expect(errors).toEqual([]);
			expect(screen.queryByRole('alert')).toBeNull();
			expect(rows()).toEqual([]);
			expect(screen.getByRole('list', { name: 'Fruit' })).toBeTruthy();

			props.items = fruit;
			await tick();
			expect(errors).toEqual([]);
			expect(names()).toEqual(['Apple', 'Banana', 'Cherry']);
			// The first removal after the refill moves the focus on as before the list was empty.
			await user.click(screen.getByRole('button', { name: 'Remove Cherry' }));
			await tick();
			expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Remove Banana' }));
			expect(errors).toEqual([]);
		});

		it('survives several rounds of n -> 0 -> n with the focus inside before emptying', async () => {
			const errors: unknown[] = [];
			const props = reactive<{ items: SortableItem[]; onremove: (index: number) => void; onerror: (error: unknown) => void }>({
				items: fruit,
				onremove: () => undefined,
				onerror: (error) => errors.push(error)
			});
			render(SortableListBoundary, { props });
			for (let round = 0; round < 3; round++) {
				screen.getByRole('button', { name: 'Move Banana up' }).focus();
				props.items = [];
				await tick();
				expect(rows()).toEqual([]);
				props.items = fruit;
				await tick();
				expect(rows()).toHaveLength(3);
			}
			expect(errors).toEqual([]);
			expect(screen.queryByRole('alert')).toBeNull();
		});
	});
});
