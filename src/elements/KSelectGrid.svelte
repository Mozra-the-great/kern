<svelte:options
	customElement={{
		props: {
			items: { type: 'Array' },
			selected: { type: 'Array' },
			label: { type: 'String' },
			min: { type: 'String' },
			reorderable: { type: 'Boolean' },
			caption: { type: 'String' },
			reorderHint: { type: 'String', attribute: 'reorder-hint' }
		}
	}}
/>

<script lang="ts">
	/**
	 * Grid of pictures as a multi-select listbox (one Tab stop, arrow keys by one place and one row,
	 * Home/End/PageUp/PageDown, Space/Enter toggle, Shift extends, Ctrl/Cmd+A all, Esc clears). With
	 * `reorderable`, Alt+arrow keys and dragging move the focused item; the element does not reorder
	 * `items` itself: set `items` again in the `move` handler (`splice` the item from `from` to `to`;
	 * Svelte: `moveItem`). An item shows `src` as a picture and its `label` and `description` as a caption
	 * (other pictures, e.g. a canvas: the Svelte component's `item` snippet).
	 * @prop items {SelectGridItem[]} `{ id, label, src?, description? }`.
	 * @prop selected {Array<string | number>} The `id`s of the selected items.
	 * @prop min {string} Smallest column width (CSS length). Default `150px`.
	 * @prop caption {boolean | 'true' | 'false'} `false` hides the caption (label and description) under the picture. Default true.
	 * @event change {Array<string | number>} The `id`s of the selected items after the user changed the selection (not for `selected` set from code).
	 * @event move {{ from: number; to: number }} The user moved the item at `from` so that it should end up at `to`.
	 */
	import SelectGrid, { type SelectGridItem } from '../lib/components/SelectGrid.svelte';
	import { emit } from './form.js';
	let { items = [], selected = $bindable([]), label, min, reorderable = false, caption, reorderHint } = $props();
	const host = $host();
	const list = $derived<SelectGridItem[]>(Array.isArray(items) ? items : []);
	const showCaption = $derived(caption === undefined || caption === null || (caption !== false && caption !== 'false'));
</script>

<SelectGrid
	items={list}
	bind:selected
	{label}
	{min}
	{reorderable}
	caption={showCaption}
	{reorderHint}
	onchange={(next: (string | number)[]) => emit(host, 'change', next)}
	onmove={(from: number, to: number) => emit(host, 'move', { from, to })}
/>

<style>
	:host {
		display: block;
		min-width: 0;
	}
</style>
