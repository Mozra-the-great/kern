/**
 * SelectGrid: a multi-select listbox of pictures with one Tab stop (roving tabindex). Covered: the name and
 * options (default label, `itemLabel`, `key`, pictures, captions, descriptions, the `item` snippet and
 * `caption`), `bind:selected` and `onchange` (click, Shift+click, Space/Enter, Shift+Space, Ctrl/Cmd+A,
 * Escape; nothing for an unchanged selection), arrow keys by place and by row (the column count is measured
 * from `offsetTop`, stubbed here), Home/End/PageUp/PageDown, right-to-left arrows, Alt+arrow and dragging with
 * `reorderable` (`onmove`, the reorder hint, focus that follows the moved item), focus handed back when the
 * grid itself or a removed item had it, and an empty list (also one that is emptied and refilled: `bind:this`
 * sets the grid to `null` when its last item goes, #175).
 */
import { fireEvent, render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SelectGrid, { type SelectGridItem } from '../../src/lib/components/SelectGrid.svelte';
import type { ItemKey } from '../../src/lib/components/reorder.js';
import SelectGridBoundary from './harness/SelectGridBoundary.svelte';
import { flush, mapSnippet } from './helpers.js';
import { reactive } from './reactive.svelte.js';

const items: SelectGridItem[] = [
	{ id: 'a', label: 'Alpha', src: '/a.png', description: 'First' },
	{ id: 'b', label: 'Beta', src: '/b.png' },
	{ id: 'c', label: 'Gamma' },
	{ id: 'd', label: 'Delta' },
	{ id: 'e', label: 'Epsilon' }
];

/** Lays the options out in rows of `columns` (jsdom has no layout, offsetTop is always 0). */
function stubColumns(columns: number): void {
	vi.spyOn(HTMLElement.prototype, 'offsetTop', 'get').mockImplementation(function (this: HTMLElement) {
		const parent = this.parentElement;
		if (parent === null) return 0;
		return Math.floor(Array.from(parent.children).indexOf(this) / columns) * 100;
	});
}

function option(name: string): HTMLElement {
	return screen.getByRole('option', { name });
}
function tabStops(): string[] {
	return screen
		.getAllByRole('option')
		.filter((o) => o.tabIndex === 0)
		.map((o) => o.getAttribute('aria-label') ?? '');
}

interface State {
	items: SelectGridItem[];
	selected?: readonly ItemKey[] | undefined;
	onchange?: ((selected: ItemKey[]) => void) | undefined;
	onmove?: ((from: number, to: number) => void) | undefined;
	reorderable?: boolean | undefined;
}

afterEach(() => {
	vi.restoreAllMocks();
});

describe('SelectGrid', () => {
	it('is a named multi-select listbox with one Tab stop, pictures and captions', () => {
		render(SelectGrid<SelectGridItem>, { items, id: 'grid', min: '120px', class: 'mine' });
		const grid = screen.getByRole('listbox', { name: 'Selectable items' });
		expect(grid.id).toBe('grid');
		expect(grid.classList.contains('mine')).toBe(true);
		expect(grid.getAttribute('aria-multiselectable')).toBe('true');
		expect(grid.style.getPropertyValue('--k-select-grid-min')).toBe('120px');
		expect(tabStops()).toEqual(['Alpha']);
		const alpha = option('Alpha');
		expect(alpha.getAttribute('aria-selected')).toBe('false');
		expect(alpha.getAttribute('aria-describedby')).toBeNull();
		expect(alpha.getAttribute('draggable')).toBeNull();
		expect(alpha.querySelector('img')?.getAttribute('src')).toBe('/a.png');
		expect(alpha.querySelector('.caption-name')?.textContent).toBe('Alpha');
		expect(alpha.querySelector('.caption-description')?.textContent).toBe('First');
		expect(option('Beta').querySelector('.caption-description')).toBeNull();
		expect(option('Gamma').querySelector('img')).toBeNull();
		expect(document.querySelector('.hint')).toBeNull();
	});

	it('uses its own label, key, item label and item snippet; the snippet hides captions unless caption is set', () => {
		const words = ['one', 'two'];
		const { unmount } = render(SelectGrid<string>, {
			items: words,
			label: 'Words',
			key: (w: string) => `k-${w}`,
			itemLabel: (w: string, i: number) => `${i}:${w}`,
			item: createRawSnippet((w: () => string, i: () => number, on: () => boolean) => ({
				render: () => `<span data-snippet>${w().toUpperCase()} ${i()} ${on() ? 'on' : 'off'}</span>`
			})),
			selected: ['k-two']
		});
		expect(screen.getByRole('listbox', { name: 'Words' })).toBeTruthy();
		expect(option('1:two').getAttribute('aria-selected')).toBe('true');
		expect(option('0:one').querySelector('[data-snippet]')?.textContent).toBe('ONE 0 off');
		expect(option('1:two').querySelector('[data-snippet]')?.textContent).toBe('TWO 1 on');
		expect(document.querySelector('.caption')).toBeNull();
		unmount();
		render(SelectGrid<string | number>, { items: ['x', 5], caption: true, item: mapSnippet<string | number>(String) });
		expect(option('x').querySelector('.caption-name')?.textContent).toBe('x');
		expect(option('5')).toBeTruthy();
	});

	it('caption=false hides the captions of the default rendering; plain items are keyed by position', async () => {
		const user = userEvent.setup();
		const props = reactive<{ items: unknown[]; caption: boolean; selected?: readonly ItemKey[] | undefined }>({
			items: [{}, { label: 3 }],
			caption: false,
			selected: undefined
		});
		render(SelectGrid<unknown>, { props });
		expect(document.querySelector('.caption')).toBeNull();
		const options = screen.getAllByRole('option');
		expect(options.map((o) => o.getAttribute('aria-label'))).toEqual(['', '']);
		await user.click(options[1] as HTMLElement);
		expect(props.selected).toEqual([1]);
	});

	it('toggles with click, extends with Shift+click and reports every change', async () => {
		const user = userEvent.setup();
		const onchange = vi.fn();
		const props = reactive<State>({ items, onchange, selected: undefined });
		render(SelectGrid<SelectGridItem>, { props });
		await user.click(option('Beta'));
		expect(props.selected).toEqual(['b']);
		expect(onchange).toHaveBeenLastCalledWith(['b']);
		expect(option('Beta').getAttribute('aria-selected')).toBe('true');
		expect(option('Beta').classList.contains('selected')).toBe(true);
		expect(tabStops()).toEqual(['Beta']);
		await user.keyboard('{Shift>}');
		await user.click(option('Delta'));
		await user.keyboard('{/Shift}');
		expect(props.selected).toEqual(['b', 'c', 'd']);
		await user.click(option('Gamma'));
		expect(props.selected).toEqual(['b', 'd']);
		// The selection follows the order of the items, not the order of the clicks.
		await user.click(option('Alpha'));
		expect(props.selected).toEqual(['a', 'b', 'd']);
		expect(onchange).toHaveBeenCalledTimes(4);
	});

	it('moves the focus with the arrow keys by place and by row, Home/End and PageUp/PageDown', async () => {
		stubColumns(2);
		const user = userEvent.setup();
		render(SelectGrid<SelectGridItem>, { items });
		await user.tab();
		expect(document.activeElement).toBe(option('Alpha'));
		await user.keyboard('{ArrowRight}');
		expect(document.activeElement).toBe(option('Beta'));
		expect(tabStops()).toEqual(['Beta']);
		await user.keyboard('{ArrowDown}');
		expect(document.activeElement).toBe(option('Delta'));
		await user.keyboard('{ArrowDown}');
		expect(document.activeElement).toBe(option('Delta'));
		await user.keyboard('{ArrowLeft}');
		expect(document.activeElement).toBe(option('Gamma'));
		await user.keyboard('{ArrowUp}');
		expect(document.activeElement).toBe(option('Alpha'));
		await user.keyboard('{End}');
		expect(document.activeElement).toBe(option('Epsilon'));
		await user.keyboard('{Home}');
		expect(document.activeElement).toBe(option('Alpha'));
		await user.keyboard('{PageDown}');
		expect(document.activeElement).toBe(option('Epsilon'));
		await user.keyboard('{PageUp}');
		expect(document.activeElement).toBe(option('Alpha'));
		// Other keys and Cmd shortcuts other than Cmd+A are left alone.
		await user.keyboard('x');
		await user.keyboard('{Meta>}c{/Meta}');
		expect(document.activeElement).toBe(option('Alpha'));
	});

	it('selects with Space and Enter, extends with Shift+arrows and Shift+Space, Ctrl+A selects all and Escape clears', async () => {
		const user = userEvent.setup();
		const onchange = vi.fn();
		const props = reactive<State>({ items, onchange, selected: undefined });
		render(SelectGrid<SelectGridItem>, { props });
		await user.tab();
		await user.keyboard(' ');
		expect(props.selected).toEqual(['a']);
		await user.keyboard('{Enter}');
		expect(props.selected).toEqual([]);
		await user.keyboard('{Shift>}{ArrowRight}{ArrowRight}{/Shift}');
		expect(props.selected).toEqual(['a', 'b', 'c']);
		expect(document.activeElement).toBe(option('Gamma'));
		await user.keyboard('{ArrowRight}{ArrowRight}');
		await user.keyboard('{Shift>} {/Shift}');
		expect(props.selected).toEqual(['e']);
		await user.keyboard('{Control>}a{/Control}');
		expect(props.selected).toEqual(['a', 'b', 'c', 'd', 'e']);
		onchange.mockClear();
		await user.keyboard('{Meta>}A{/Meta}');
		expect(onchange).not.toHaveBeenCalled();
		await user.keyboard('{Escape}');
		expect(props.selected).toEqual([]);
		onchange.mockClear();
		await user.keyboard('{Escape}');
		expect(onchange).not.toHaveBeenCalled();
		// Alt+arrow without reorderable is left to the browser.
		await user.keyboard('{Alt>}{ArrowLeft}{/Alt}');
		expect(document.activeElement).toBe(option('Epsilon'));
	});

	it('swaps left and right in a right-to-left layout', () => {
		const real = window.getComputedStyle.bind(window);
		vi.spyOn(window, 'getComputedStyle').mockImplementation((element: Element, pseudo?: string | null) =>
			element.getAttribute('role') === 'listbox' ? ({ direction: 'rtl' } as CSSStyleDeclaration) : real(element, pseudo)
		);
		render(SelectGrid<SelectGridItem>, { items });
		option('Beta').focus();
		fireEvent.keyDown(option('Beta'), { key: 'ArrowLeft' });
		expect(document.activeElement).toBe(option('Gamma'));
		fireEvent.keyDown(option('Gamma'), { key: 'ArrowRight' });
		expect(document.activeElement).toBe(option('Beta'));
		fireEvent.keyDown(option('Beta'), { key: 'ArrowUp' });
		expect(document.activeElement).toBe(option('Beta'));
	});

	it('ignores keys that do not come from an option', () => {
		const onchange = vi.fn();
		render(SelectGrid<SelectGridItem>, { items, onchange });
		const grid = screen.getByRole('listbox');
		fireEvent.keyDown(grid, { key: ' ' });
		const inner = document.createElement('span');
		inner.setAttribute('role', 'option');
		grid.append(inner);
		fireEvent.keyDown(inner, { key: ' ' });
		inner.remove();
		expect(onchange).not.toHaveBeenCalled();
	});

	it('hands the focus to the Tab stop when the grid itself is focused', async () => {
		const user = userEvent.setup();
		render(SelectGrid<SelectGridItem>, { items });
		await user.click(option('Gamma'));
		screen.getByRole('listbox').focus();
		expect(document.activeElement).toBe(option('Gamma'));
		// Focusing an option directly does not hand it on.
		option('Alpha').focus();
		expect(document.activeElement).toBe(option('Alpha'));
	});

	describe('reorderable', () => {
		beforeEach(() => {
			stubColumns(2);
		});

		it('describes each option with the hint and moves with Alt+arrow; the focus follows the item', async () => {
			const user = userEvent.setup();
			const props = reactive<State & { reorderHint?: string | undefined }>({ items: [...items], reorderable: true, onmove: undefined });
			props.onmove = (from: number, to: number) => {
				const next = [...props.items];
				const [moved] = next.splice(from, 1);
				next.splice(to, 0, moved as SelectGridItem);
				props.items = next;
			};
			const onmove = vi.spyOn(props, 'onmove');
			render(SelectGrid<SelectGridItem>, { props });
			const hint = document.querySelector('.hint') as HTMLElement;
			expect(hint.textContent).toBe('Hold Alt and press an arrow key to move the focused item.');
			expect(option('Alpha').getAttribute('aria-describedby')).toBe(hint.id);
			expect(option('Alpha').getAttribute('draggable')).toBe('true');
			await user.tab();
			await user.keyboard('{Alt>}{ArrowRight}{/Alt}');
			expect(onmove).toHaveBeenLastCalledWith(0, 1);
			await vi.waitFor(() => expect(screen.getAllByRole('option')[1]?.getAttribute('aria-label')).toBe('Alpha'));
			await vi.waitFor(() => expect(document.activeElement).toBe(option('Alpha')));
			await user.keyboard('{Alt>}{ArrowDown}{/Alt}');
			expect(onmove).toHaveBeenLastCalledWith(1, 3);
			await vi.waitFor(() => expect(document.activeElement).toBe(option('Alpha')));
			onmove.mockClear();
			// Beyond the edge and with other keys nothing moves.
			await user.keyboard('{Alt>}{ArrowDown}{/Alt}');
			await user.keyboard('{Alt>}x{/Alt}');
			expect(onmove).not.toHaveBeenCalled();
			props.reorderHint = 'Alt + arrows';
			await vi.waitFor(() => expect(document.querySelector('.hint')?.textContent).toBe('Alt + arrows'));
		});

		it('works without onmove', async () => {
			const user = userEvent.setup();
			render(SelectGrid<SelectGridItem>, { items, reorderable: true });
			await user.tab();
			await user.keyboard('{Alt>}{ArrowRight}{/Alt}');
			expect(document.activeElement).toBe(option('Alpha'));
		});

		it('drags an item onto another and marks both while dragging', async () => {
			const onmove = vi.fn();
			render(SelectGrid<SelectGridItem>, { items, reorderable: true, onmove });
			const data: Record<string, string> = {};
			const transfer = {
				effectAllowed: 'none',
				dropEffect: 'none',
				setData: (type: string, value: string) => {
					data[type] = value;
				}
			};
			const drag = (type: string, target: HTMLElement, withTransfer = true): Event => {
				const event = new Event(type, { bubbles: true, cancelable: true });
				if (withTransfer) Object.defineProperty(event, 'dataTransfer', { value: transfer });
				target.dispatchEvent(event);
				return event;
			};
			// A drag that did not start here is ignored.
			expect(drag('dragover', option('Gamma')).defaultPrevented).toBe(false);
			expect(drag('drop', option('Gamma')).defaultPrevented).toBe(false);

			drag('dragstart', option('Alpha'));
			expect(transfer.effectAllowed).toBe('move');
			expect(data['text/plain']).toBe('0');
			await flush();
			expect(option('Alpha').classList.contains('dragging')).toBe(true);
			expect(drag('dragover', option('Gamma')).defaultPrevented).toBe(true);
			expect(transfer.dropEffect).toBe('move');
			await flush();
			expect(option('Gamma').classList.contains('drop')).toBe(true);
			drag('dragover', option('Beta'), false);
			await flush();
			expect(option('Beta').classList.contains('drop')).toBe(true);
			expect(drag('drop', option('Gamma')).defaultPrevented).toBe(true);
			expect(onmove).toHaveBeenCalledWith(0, 2);
			await flush();
			expect(option('Alpha').classList.contains('dragging')).toBe(false);
			expect(option('Beta').classList.contains('drop')).toBe(false);

			// Dropping an item on itself and a cancelled drag move nothing.
			onmove.mockClear();
			drag('dragstart', option('Beta'), false);
			drag('drop', option('Beta'));
			drag('dragstart', option('Beta'));
			drag('dragend', option('Beta'));
			await flush();
			expect(option('Beta').classList.contains('dragging')).toBe(false);
			expect(onmove).not.toHaveBeenCalled();
		});
	});

	it('puts the focus back on the Tab stop when the focused item goes away', async () => {
		const user = userEvent.setup();
		const props = reactive<State>({ items: [...items] });
		render(SelectGrid<SelectGridItem>, { props });
		await user.click(option('Epsilon'));
		expect(document.activeElement).toBe(option('Epsilon'));
		props.items = items.slice(0, 3);
		await vi.waitFor(() => expect(document.activeElement).toBe(option('Gamma')));
		expect(tabStops()).toEqual(['Gamma']);
	});

	it('a move wish expires: the focus stays on the Tab stop instead of following the item', async () => {
		stubColumns(5);
		const user = userEvent.setup();
		const props = reactive<State>({ items: [...items], reorderable: true, onmove: vi.fn() });
		render(SelectGrid<SelectGridItem>, { props });
		await user.tab();
		const now = vi.spyOn(performance, 'now').mockReturnValue(1000);
		await user.keyboard('{Alt>}{ArrowRight}{/Alt}');
		now.mockReturnValue(5000);
		props.items = [items[1] as SelectGridItem, items[0] as SelectGridItem, ...items.slice(2)];
		await vi.waitFor(() => expect(screen.getAllByRole('option')[1]?.getAttribute('aria-label')).toBe('Alpha'));
		await flush();
		expect(document.activeElement).toBe(screen.getAllByRole('option')[0]);
		expect(tabStops()).toEqual(['Beta']);
	});

	it('renders nothing without items, also for a value that is not an array', () => {
		const { unmount } = render(SelectGrid<SelectGridItem>, { items: [] });
		expect(screen.queryByRole('listbox')).toBeNull();
		unmount();
		render(SelectGrid<SelectGridItem>, { items: undefined as unknown as SelectGridItem[], selected: 'a' as unknown as ItemKey[] });
		expect(screen.queryByRole('listbox')).toBeNull();
	});

	it('ignores a selected value that is not an array', () => {
		render(SelectGrid<SelectGridItem>, { items, selected: 'a' as unknown as ItemKey[] });
		expect(screen.getAllByRole('option').every((o) => o.getAttribute('aria-selected') === 'false')).toBe(true);
	});

	describe('emptied and refilled (#175)', () => {
		/** Props of a host whose errors land in `errors`, because the grid sits in a `svelte:boundary`. */
		function bounded(initial: SelectGridItem[]): {
			props: { items: SelectGridItem[]; onerror: (error: unknown) => void };
			errors: unknown[];
		} {
			const errors: unknown[] = [];
			const props = reactive<{ items: SelectGridItem[]; onerror: (error: unknown) => void }>({
				items: initial,
				onerror: (error) => errors.push(error)
			});
			return { props, errors };
		}

		it('does not throw when the last item is removed while the focus is inside, and works again after a refill', async () => {
			const user = userEvent.setup();
			const { props, errors } = bounded(items);
			render(SelectGridBoundary, { props });
			await user.click(option('Gamma'));
			expect(document.activeElement).toBe(option('Gamma'));

			props.items = [];
			await flush();
			expect(errors).toEqual([]);
			expect(screen.queryByRole('alert')).toBeNull();
			expect(screen.queryByRole('listbox')).toBeNull();

			props.items = items.slice(0, 3);
			await flush();
			expect(errors).toEqual([]);
			expect(screen.queryByRole('alert')).toBeNull();
			expect(screen.getAllByRole('option')).toHaveLength(3);
			expect(tabStops()).toHaveLength(1);
			// The grid works again: Tab reaches the stop, the arrow keys move the focus.
			await user.tab();
			const stop = screen.getAllByRole('option').find((o) => o.tabIndex === 0);
			expect(document.activeElement).toBe(stop);
			// The stop is where the user was (Gamma, the last of three now): ArrowLeft moves on to Beta.
			expect(stop).toBe(option('Gamma'));
			await user.keyboard('{ArrowLeft}');
			expect(document.activeElement).toBe(option('Beta'));
		});

		it('survives several rounds of n -> 0 -> n and keeps one Tab stop', async () => {
			const { props, errors } = bounded(items);
			render(SelectGridBoundary, { props });
			for (let round = 0; round < 3; round++) {
				option('Delta').focus();
				props.items = [];
				await flush();
				expect(screen.queryAllByRole('option')).toHaveLength(0);
				props.items = items;
				await flush();
				expect(screen.getAllByRole('option')).toHaveLength(items.length);
				expect(tabStops()).toHaveLength(1);
			}
			expect(errors).toEqual([]);
			expect(screen.queryByRole('alert')).toBeNull();
		});

		it('hands the focus to the Tab stop when items go away but some remain', async () => {
			const { props, errors } = bounded(items);
			render(SelectGridBoundary, { props });
			option('Epsilon').focus();
			props.items = items.slice(0, 2);
			await flush();
			expect(document.activeElement).toBe(option('Beta'));
			expect(errors).toEqual([]);
		});
	});
});
