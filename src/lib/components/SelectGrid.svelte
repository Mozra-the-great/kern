<script lang="ts" module>
	/** What the default rendering and the element read from an item. Items may be any type when `key`, `itemLabel` and the `item` snippet are given. */
	export interface SelectGridItem {
		/** Identifies the item: what `selected` lists, and what stays with it when it moves. */
		id: string | number;
		/** The item's name: its accessible name and the caption under the picture. */
		label: string;
		/** URL of the picture. */
		src?: string | undefined;
		/** Second, muted line under the caption. */
		description?: string | undefined;
	}
</script>

<script lang="ts" generics="T">
	import { strings } from './strings.svelte.js';
	import type { Snippet } from 'svelte';
	import {
		between,
		columnsOf,
		defaultItemLabel,
		defaultKey,
		descriptionOf,
		isNavKey,
		moveStep,
		nextIndex,
		srcOf,
		type ItemKey
	} from './reorder.js';

	interface Props {
		/** The items in their current order. With `reorderable` the grid does not reorder them itself: `onmove` tells you what the user asked for. */
		items: readonly T[];
		/** Identifies an item while it moves. Default: `item.id`, else the index. */
		key?: ((item: T, index: number) => ItemKey) | undefined;
		/** Accessible name of an option. Default: `item.label`, or the item itself when it is a string or number. */
		itemLabel?: ((item: T, index: number) => string) | undefined;
		/** Keys of the selected items, in the order of `items`. Bindable. */
		selected?: readonly ItemKey[] | undefined;
		/** Accessible name of the grid. */
		label?: string | undefined;
		/** Smallest column width (CSS length). Default `150px`. */
		min?: string | undefined;
		/** Alt + arrow keys and dragging move the focused item (`onmove`). Default false. */
		reorderable?: boolean | undefined;
		/** The user changed the selection (keyboard, click, select all, clear); never for a `selected` set from code. */
		onchange?: ((selected: ItemKey[]) => void) | undefined;
		/** The user moved the item at `from` so that it should end up at `to`. Use `moveItem(items, from, to)`. */
		onmove?: ((from: number, to: number) => void) | undefined;
		/** Content of one item (a picture). Default: `item.src` as a picture, `item.label` as a caption. */
		item?: Snippet<[item: T, index: number, selected: boolean]> | undefined;
		/** Show the caption (label and description) under the picture. Default: true without an `item` snippet, false with one. */
		caption?: boolean | undefined;
		/** Text of the hint that tells how to reorder with the keyboard (default: the catalogue). */
		reorderHint?: string | undefined;
		id?: string | undefined;
		class?: string | undefined;
	}
	let {
		items,
		key,
		itemLabel,
		selected = $bindable(),
		label: labelProp,
		min,
		reorderable = false,
		onchange,
		onmove,
		item: itemSnippet,
		caption,
		reorderHint: reorderHintProp,
		id,
		class: cls = ''
	}: Props = $props();

	const label = $derived(labelProp ?? strings().selectGrid.label);
	const reorderHint = $derived(reorderHintProp ?? strings().selectGrid.reorderHint);

	const uid = $props.id();
	const hintId = `${uid}-hint`;

	const list = $derived(Array.isArray(items) ? (items as readonly T[]) : []);
	const keyOf = (entry: T, index: number): ItemKey => key?.(entry, index) ?? defaultKey(entry, index);
	const nameOf = (entry: T, index: number): string => itemLabel?.(entry, index) ?? defaultItemLabel(entry);
	const keys = $derived(list.map((entry, index) => keyOf(entry, index)));
	const chosen = $derived(new Set<ItemKey>(Array.isArray(selected) ? selected : []));
	const canMove = $derived(reorderable);
	const showCaption = $derived(caption ?? itemSnippet === undefined);

	let root: HTMLDivElement | undefined = $state();
	/** Index of the item that holds the Tab stop (roving tabindex). */
	let current = $state(0);
	/** Where Shift+arrow and Shift+Space start their range. */
	let anchor = $state(0);
	let dragFrom: number | undefined = $state();
	let dropAt: number | undefined = $state();

	const active = $derived(Math.min(Math.max(current, 0), Math.max(list.length - 1, 0)));

	function options(): HTMLElement[] {
		return root === undefined ? [] : Array.from(root.children).filter((child): child is HTMLElement => child instanceof HTMLElement);
	}

	/** True while the focus is inside the grid (also inside a shadow root). */
	function hasFocus(): boolean {
		if (root === undefined) return false;
		const focused = (root.getRootNode() as Document | ShadowRoot).activeElement;
		return focused !== null && root.contains(focused);
	}

	/** Items in the first row: the number of columns the layout has right now. */
	function columns(): number {
		return columnsOf(options().map((option) => option.offsetTop));
	}

	function focusAt(index: number): void {
		current = index;
		options()[index]?.focus();
	}

	/** Sets the selection to the items at `indices`, in the order of `items`; tells the host when it changed. */
	function commit(indices: Iterable<number>): void {
		const wanted = new Set(indices);
		const next = keys.filter((_, index) => wanted.has(index));
		const same = next.length === chosen.size && next.every((k) => chosen.has(k));
		if (same) return;
		selected = next;
		onchange?.(next);
	}

	const chosenIndices = (): number[] => keys.flatMap((k, index) => (chosen.has(k) ? [index] : []));

	function toggle(index: number): void {
		anchor = index;
		const next = new Set(chosenIndices());
		if (!next.delete(index)) next.add(index);
		commit(next);
	}

	function selectRange(index: number): void {
		commit(between(Math.min(anchor, list.length - 1), index));
	}

	/* Focus. After a move the item is somewhere else in the DOM (a keyed re-sort loses focus in the
	 * browser) and the host applies the move later than our handler, maybe asynchronously: the wish is
	 * kept and carried out when the items change, and it expires. When items go away while the focus is
	 * inside, it returns to the Tab stop instead of falling to the page. */
	const FOCUS_WINDOW_MS = 1500;
	let pending: { to: number; at: number } | undefined;
	let hadFocus = false;
	const snapshot = $derived([...list]);

	$effect.pre(() => {
		void snapshot;
		hadFocus = hasFocus();
	});

	$effect(() => {
		void snapshot;
		const wish = pending;
		pending = undefined;
		if (wish !== undefined && performance.now() - wish.at <= FOCUS_WINDOW_MS && wish.to < list.length) {
			anchor = wish.to;
			focusAt(wish.to);
		} else if (hadFocus && list.length > 0 && !hasFocus()) {
			focusAt(active);
		}
		hadFocus = false;
	});

	function onkeydown(event: KeyboardEvent): void {
		const target = event.target;
		if (!(target instanceof HTMLElement) || target.getAttribute('role') !== 'option') return;
		const position = options().indexOf(target);
		// Cmd+A selects all; other Cmd shortcuts belong to the system.
		if (position < 0 || (event.metaKey && event.key.toLowerCase() !== 'a')) return;
		const rtl = root !== undefined && getComputedStyle(root).direction === 'rtl';
		const key = rtl && event.key === 'ArrowLeft' ? 'ArrowRight' : rtl && event.key === 'ArrowRight' ? 'ArrowLeft' : event.key;

		if ((event.ctrlKey || event.metaKey) && key.toLowerCase() === 'a') {
			event.preventDefault();
			commit(list.keys());
			return;
		}
		if (event.altKey) {
			// Alt+arrow is the keyboard way to reorder; without `reorderable` the browser keeps it (Alt+Left is "back").
			const step = canMove ? moveStep(key, columns()) : undefined;
			if (step === undefined) return;
			event.preventDefault();
			const to = position + step;
			if (to >= 0 && to < list.length) {
				pending = { to, at: performance.now() };
				onmove?.(position, to);
			}
			return;
		}
		if (isNavKey(key)) {
			event.preventDefault();
			const to = nextIndex(key, position, list.length, columns());
			if (event.shiftKey) selectRange(to);
			else anchor = to;
			focusAt(to);
		} else if (key === ' ' || key === 'Enter') {
			event.preventDefault();
			if (event.shiftKey) selectRange(position);
			else toggle(position);
		} else if (key === 'Escape' && chosen.size > 0) {
			event.preventDefault();
			commit([]);
		}
	}

	function onclick(event: MouseEvent, index: number): void {
		current = index;
		if (event.shiftKey) selectRange(index);
		else toggle(index);
	}

	function ondragstart(event: DragEvent, index: number): void {
		dragFrom = index;
		const transfer = event.dataTransfer;
		if (transfer) {
			transfer.effectAllowed = 'move';
			transfer.setData('text/plain', String(index));
		}
	}

	function ondragover(event: DragEvent, index: number): void {
		if (dragFrom === undefined) return;
		event.preventDefault();
		if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
		dropAt = index;
	}

	function ondrop(event: DragEvent, index: number): void {
		if (dragFrom === undefined) return;
		event.preventDefault();
		const from = dragFrom;
		dragFrom = undefined;
		dropAt = undefined;
		if (from !== index) {
			current = index;
			pending = { to: index, at: performance.now() };
			onmove?.(from, index);
		}
	}

	function ondragend(): void {
		dragFrom = undefined;
		dropAt = undefined;
	}
</script>

<!--
  A grid of pictures as a multi-select listbox: one Tab stop, arrow keys by one place and by one row (the
  column count is measured from the layout), Home/End/PageUp/PageDown, Space and Enter toggle, Shift
  extends, Ctrl/Cmd+A selects all, Esc clears, Alt+arrow moves the item (with `reorderable`). Dragging is
  an extra. The selection shows as a check mark and a thicker outline, not by colour alone.
-->
{#if list.length > 0}
	<div
		{id}
		bind:this={root}
		class="k-select-grid {cls}"
		role="listbox"
		aria-label={label}
		aria-multiselectable="true"
		tabindex="-1"
		onfocus={(event) => {
			// A click between two items focuses the grid itself: hand the focus to the Tab stop.
			if (event.target === root) focusAt(active);
		}}
		style:--k-select-grid-min={min || undefined}
		{onkeydown}
	>
		{#each list as entry, index (keys[index])}
			{@const isSelected = chosen.has(keys[index])}
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<div
				class="option"
				class:selected={isSelected}
				class:dragging={dragFrom === index}
				class:drop={dropAt === index && dragFrom !== index}
				role="option"
				aria-selected={isSelected}
				aria-label={nameOf(entry, index)}
				aria-describedby={canMove ? hintId : undefined}
				tabindex={index === active ? 0 : -1}
				draggable={canMove ? 'true' : undefined}
				onfocus={() => {
					current = index;
				}}
				onclick={(event) => {
					onclick(event, index);
				}}
				ondragstart={(event) => {
					ondragstart(event, index);
				}}
				ondragover={(event) => {
					ondragover(event, index);
				}}
				ondrop={(event) => {
					ondrop(event, index);
				}}
				{ondragend}
			>
				<span class="picture">
					{#if itemSnippet}
						{@render itemSnippet(entry, index, isSelected)}
					{:else if srcOf(entry) !== ''}
						<img src={srcOf(entry)} alt="" loading="lazy" draggable="false" />
					{/if}
				</span>
				{#if showCaption}
					<span class="caption" aria-hidden="true">
						<span class="caption-name">{nameOf(entry, index)}</span>
						{#if descriptionOf(entry) !== ''}<span class="caption-description">{descriptionOf(entry)}</span>{/if}
					</span>
				{/if}
				<span class="check" aria-hidden="true"></span>
			</div>
		{/each}
	</div>
	{#if canMove}<span id={hintId} class="hint">{reorderHint}</span>{/if}
{/if}

<style>
	.k-select-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(var(--k-select-grid-min, 150px), 100%), 1fr));
		gap: var(--k-space-4);
		min-width: 0;
	}
	.option {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: stretch;
		gap: var(--k-space-2);
		min-width: 0;
		box-sizing: border-box;
		padding: var(--k-space-3);
		border: 2px solid var(--k-line-strong);
		border-radius: var(--k-radius-card);
		background: var(--k-bg-raised);
		color: var(--k-fg);
		box-shadow: var(--k-shadow-raised);
		cursor: pointer;
		user-select: none;
		transition:
			opacity var(--k-dur) var(--k-ease),
			background-color var(--k-dur) var(--k-ease),
			border-color var(--k-dur) var(--k-ease);
	}
	.option[draggable='true'] {
		cursor: grab;
	}
	.option:focus-visible {
		outline: var(--k-focus-w) solid var(--k-focus);
		outline-offset: var(--k-focus-offset);
	}
	.picture {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 0;
		aspect-ratio: var(--k-select-grid-ratio, 1 / 1);
		overflow: hidden;
	}
	.picture :global(img) {
		display: block;
		max-width: 100%;
		max-height: 100%;
		object-fit: contain;
	}
	.caption {
		display: flex;
		flex-direction: column;
		align-items: center;
		min-width: 0;
		text-align: center;
		overflow-wrap: anywhere;
	}
	.caption-description {
		color: var(--k-fg-hint);
		font-size: var(--k-text-sm);
	}
	/* The check box is drawn for every item, so "selectable" shows before anything is selected. */
	.check {
		position: absolute;
		inset-block-start: var(--k-space-2);
		inset-inline-end: var(--k-space-2);
		box-sizing: border-box;
		inline-size: 22px;
		block-size: 22px;
		border: 2px solid var(--k-fg);
		border-radius: calc(var(--k-radius-control) / 2);
		background: var(--k-bg-raised);
	}
	.selected {
		border-color: var(--k-accent-mark);
		background: var(--k-surface-selected);
	}
	.selected .check {
		border-color: var(--k-accent-mark);
		background: var(--k-accent-mark);
	}
	.selected .check::after {
		content: '';
		display: block;
		inline-size: 5px;
		block-size: 10px;
		margin: 1px 0 0 6px;
		border: solid var(--k-bg-raised);
		border-width: 0 2px 2px 0;
		transform: rotate(45deg);
	}
	.dragging {
		opacity: 0.5;
	}
	.drop {
		border-style: dashed;
		border-color: var(--k-accent-mark);
	}
	.hint {
		position: absolute;
		inline-size: 1px;
		block-size: 1px;
		margin: -1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}
	@media (forced-colors: active) {
		.option {
			border-color: CanvasText;
		}
		.selected {
			border-color: Highlight;
			border-width: 4px;
			padding: calc(var(--k-space-3) - 2px);
		}
		.check {
			border-color: CanvasText;
		}
		.selected .check {
			border-color: Highlight;
			background: Highlight;
		}
		.selected .check::after {
			border-color: HighlightText;
		}
		.option:focus-visible {
			outline: 3px solid CanvasText;
		}
	}
</style>
