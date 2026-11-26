<script lang="ts" module>
	/** What the default rendering and the element read from an item. Items may be any type when `key`, `itemLabel` and the `item` snippet are given. */
	export interface SortableItem {
		/** Identifies the item while it moves. */
		id: string | number;
		/** The item's name: visible text, and part of the accessible name of its buttons. */
		label: string;
		/** Second, muted line under the name. */
		description?: string | undefined;
	}
</script>

<script lang="ts" generics="T">
	import { strings } from './strings.svelte.js';
	import type { Snippet } from 'svelte';
	import Button from './Button.svelte';
	import { fill } from './data-utils.js';
	import { defaultItemLabel, defaultKey, descriptionOf, type ItemKey } from './reorder.js';

	interface Props {
		/** The items in their current order. The list does not reorder them itself: `onmove` and `onremove` tell you what the user asked for. */
		items: readonly T[];
		/** Identifies an item while it moves (keyed rendering). Default: `item.id`, else the index. */
		key?: ((item: T, index: number) => ItemKey) | undefined;
		/** Name of an item, used in the accessible names of its buttons. Default: `item.label`, or the item itself when it is a string or number. */
		itemLabel?: ((item: T, index: number) => string) | undefined;
		/** Accessible name of the list. */
		label?: string | undefined;
		/** Visible texts of the buttons (default: the catalogue). */
		upText?: string | undefined;
		downText?: string | undefined;
		removeText?: string | undefined;
		/** Accessible names of the buttons; `{name}` is replaced by the item's name. They should contain the visible text. */
		upLabel?: string | undefined;
		downLabel?: string | undefined;
		removeLabel?: string | undefined;
		/** Show the remove button. Default true. */
		removable?: boolean | undefined;
		/** Items can also be moved by dragging with the mouse (an extra: the buttons are the way for keyboard and touch). Default true. */
		dragDrop?: boolean | undefined;
		/** The user moved the item at `from` so that it should end up at `to`. Use `moveItem(items, from, to)`. */
		onmove?: ((from: number, to: number) => void) | undefined;
		/** The user asked to remove the item at `index`. */
		onremove?: ((index: number) => void) | undefined;
		/** Content of one item. Default: its label and, when it has one, its description. */
		item?: Snippet<[item: T, index: number]> | undefined;
		id?: string | undefined;
		class?: string | undefined;
	}
	let {
		items,
		key,
		itemLabel,
		label: labelProp,
		upText: upTextProp,
		downText: downTextProp,
		removeText: removeTextProp,
		upLabel: upLabelProp,
		downLabel: downLabelProp,
		removeLabel: removeLabelProp,
		removable = true,
		dragDrop = true,
		onmove,
		onremove,
		item: itemSnippet,
		id,
		class: cls = ''
	}: Props = $props();

	const label = $derived(labelProp ?? strings().sortableList.label);
	const upText = $derived(upTextProp ?? strings().sortableList.upText);
	const downText = $derived(downTextProp ?? strings().sortableList.downText);
	const removeText = $derived(removeTextProp ?? strings().sortableList.removeText);
	const upLabel = $derived(upLabelProp ?? strings().sortableList.upLabel);
	const downLabel = $derived(downLabelProp ?? strings().sortableList.downLabel);
	const removeLabel = $derived(removeLabelProp ?? strings().sortableList.removeLabel);

	const list = $derived(Array.isArray(items) ? (items as readonly T[]) : []);
	const keyOf = (entry: T, index: number): ItemKey => key?.(entry, index) ?? defaultKey(entry, index);
	const nameOf = (entry: T, index: number): string => itemLabel?.(entry, index) ?? defaultItemLabel(entry);

	/** `bind:this` sets this to `null` when the list unmounts, not to `undefined`: guard with `== null`. */
	let root: HTMLUListElement | null | undefined = $state();
	let dragFrom: number | undefined = $state();
	let dropAt: number | undefined = $state();

	/* Focus. A button that moves an item (or the item itself, when the host re-sorts the DOM) loses focus
	 * in the browser, and a pressed button can become disabled (the item reached an end). The host applies
	 * the move later than our handler, maybe asynchronously (a framework re-render), so the wish is kept
	 * and carried out when the items change; it expires, so a move the host rejects does not steal focus
	 * from a later change. */
	type Pending =
		{ kind: 'move'; to: number; pressed: 'up' | 'down'; at: number } | { kind: 'remove'; index: number; count: number; at: number };
	const FOCUS_WINDOW_MS = 1500;
	let pending: Pending | undefined;

	const snapshot = $derived([...list]);
	$effect(() => {
		void snapshot;
		const wish = pending;
		if (wish === undefined || root == null) return;
		if (performance.now() - wish.at > FOCUS_WINDOW_MS) {
			pending = undefined;
			return;
		}
		const rows = Array.from(root.children).filter((child): child is HTMLElement => child instanceof HTMLElement);
		if (wish.kind === 'move') {
			pending = undefined;
			const row = rows[wish.to];
			const wanted = row?.querySelector<HTMLButtonElement>(`[data-action="${wish.pressed}"]`);
			const partner = row?.querySelector<HTMLButtonElement>(`[data-action="${wish.pressed === 'up' ? 'down' : 'up'}"]`);
			(wanted?.disabled === false ? wanted : partner?.disabled === false ? partner : undefined)?.focus();
		} else if (rows.length < wish.count) {
			pending = undefined;
			// The next item moved up into the place of the removed one; at the end, the new last item.
			const row = rows[Math.min(wish.index, rows.length - 1)];
			(
				row?.querySelector<HTMLButtonElement>('[data-action="remove"]:not(:disabled)') ??
				row?.querySelector<HTMLButtonElement>('button:not(:disabled)')
			)?.focus();
		}
	});

	function move(index: number, to: number, pressed: 'up' | 'down'): void {
		if (to < 0 || to >= list.length) return;
		pending = { kind: 'move', to, pressed, at: performance.now() };
		onmove?.(index, to);
	}

	function remove(index: number): void {
		pending = { kind: 'remove', index, count: list.length, at: performance.now() };
		onremove?.(index);
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
			pending = undefined;
			onmove?.(from, index);
		}
	}

	function ondragend(): void {
		dragFrom = undefined;
		dropAt = undefined;
	}
</script>

<!--
  An ordered list whose items move with buttons (the route for keyboard, touch and screen readers) or by
  dragging (an extra). The focus stays on the button that was pressed, or moves to its partner when that
  button is disabled at an end of the list. Announcing a move ("Report moved to position 2 of 5") is the
  host's job: `announce()` from the package, see the README.
-->
<ul {id} class="k-sortable-list {cls}" aria-label={label} bind:this={root}>
	{#each list as entry, index (keyOf(entry, index))}
		{@const name = nameOf(entry, index)}
		<li
			class="item"
			class:dragging={dragFrom === index}
			class:drop={dropAt === index && dragFrom !== index}
			draggable={dragDrop ? 'true' : undefined}
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
			<div class="content">
				{#if itemSnippet}
					{@render itemSnippet(entry, index)}
				{:else}
					<span class="name">{name}</span>
					{#if descriptionOf(entry) !== ''}<span class="description">{descriptionOf(entry)}</span>{/if}
				{/if}
			</div>
			<div class="buttons">
				<Button
					variant="ghost"
					size="sm"
					data-action="up"
					aria-label={fill(upLabel, { name })}
					disabled={index === 0}
					onclick={() => {
						move(index, index - 1, 'up');
					}}
				>
					{upText}
				</Button>
				<Button
					variant="ghost"
					size="sm"
					data-action="down"
					aria-label={fill(downLabel, { name })}
					disabled={index === list.length - 1}
					onclick={() => {
						move(index, index + 1, 'down');
					}}
				>
					{downText}
				</Button>
				{#if removable}
					<Button
						variant="ghost"
						size="sm"
						data-action="remove"
						aria-label={fill(removeLabel, { name })}
						onclick={() => {
							remove(index);
						}}
					>
						{removeText}
					</Button>
				{/if}
			</div>
		</li>
	{/each}
</ul>

<style>
	.k-sortable-list {
		display: flex;
		flex-direction: column;
		gap: var(--k-space-2);
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.item {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: var(--k-space-3);
		min-width: 0;
		padding: var(--k-space-3) var(--k-space-4);
		border: var(--k-border-w) solid var(--k-line-strong);
		border-radius: var(--k-radius-card);
		background: var(--k-bg-raised);
		color: var(--k-fg);
		box-shadow: var(--k-shadow-raised);
		transition:
			opacity var(--k-dur) var(--k-ease),
			background-color var(--k-dur) var(--k-ease),
			border-color var(--k-dur) var(--k-ease);
	}
	.item[draggable='true'] {
		cursor: grab;
	}
	.content {
		display: flex;
		flex: 1 1 14rem;
		flex-direction: column;
		gap: var(--k-space-1);
		min-width: 0;
		overflow-wrap: anywhere;
	}
	.name {
		font-weight: var(--k-weight-label, 600);
	}
	.description {
		color: var(--k-fg-hint);
		font-size: var(--k-text-sm);
	}
	.buttons {
		display: flex;
		flex-wrap: wrap;
		gap: var(--k-space-2);
	}
	.dragging {
		opacity: 0.5;
	}
	.drop {
		border-style: dashed;
		border-color: var(--k-accent-mark);
		background: var(--k-surface-selected);
	}
	@media (forced-colors: active) {
		.item {
			border-color: CanvasText;
		}
		.drop {
			border-color: Highlight;
			outline: 2px solid Highlight;
		}
	}
</style>
