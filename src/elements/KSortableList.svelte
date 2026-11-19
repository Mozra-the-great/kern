<svelte:options
	customElement={{
		props: {
			items: { type: 'Array' },
			label: { type: 'String' },
			upText: { type: 'String', attribute: 'up-text' },
			downText: { type: 'String', attribute: 'down-text' },
			removeText: { type: 'String', attribute: 'remove-text' },
			upLabel: { type: 'String', attribute: 'up-label' },
			downLabel: { type: 'String', attribute: 'down-label' },
			removeLabel: { type: 'String', attribute: 'remove-label' },
			removable: { type: 'String' },
			dragDrop: { type: 'String', attribute: 'drag-drop' }
		}
	}}
/>

<script lang="ts">
	/**
	 * Ordered list whose items move with Up, Down and Remove buttons (drag and drop is an extra). The
	 * element does not reorder `items` itself: set `items` again in the `move` and `remove` handlers
	 * (`splice` the item from `from` to `to`; Svelte: `moveItem`). Focus stays on the pressed button, or moves
	 * to its partner when that one is disabled at an end of the list. Say what happened with
	 * `announce()` (README). An item shows its `label` and `description` (richer content: the Svelte
	 * component's `item` snippet).
	 * @prop items {SortableItem[]} `{ id, label, description? }`, in their current order.
	 * @prop removable {boolean | 'true' | 'false'} `false` (property or attribute) hides the Remove buttons. Default true.
	 * @prop dragDrop {boolean | 'true' | 'false'} `false` turns off dragging. Default true.
	 * @event move {{ from: number; to: number }} The user moved the item at `from` so that it should end up at `to`.
	 * @event remove {{ index: number }} The user asked to remove the item at `index`.
	 */
	import SortableList, { type SortableItem } from '../lib/components/SortableList.svelte';
	import { emit } from './form.js';
	let { items = [], label, upText, downText, removeText, upLabel, downLabel, removeLabel, removable, dragDrop } = $props();
	const host = $host();
	const list = $derived<SortableItem[]>(Array.isArray(items) ? items : []);
	const flag = (value: unknown): boolean => value === undefined || value === null || (value !== false && value !== 'false');
</script>

<SortableList
	items={list}
	{label}
	{upText}
	{downText}
	{removeText}
	{upLabel}
	{downLabel}
	{removeLabel}
	removable={flag(removable)}
	dragDrop={flag(dragDrop)}
	onmove={(from: number, to: number) => emit(host, 'move', { from, to })}
	onremove={(index: number) => emit(host, 'remove', { index })}
/>

<style>
	:host {
		display: block;
		min-width: 0;
	}
</style>
