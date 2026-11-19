<script lang="ts">
	// SortableList and SelectGrid (#68): every prop, fed with values that may be undefined, generic items with
	// `key`, `itemLabel` and the `item` snippet, and the bindable `selected` bound to `T | undefined` state.
	import { SelectGrid, SortableList, announce, moveItem } from '@mozra-the-great/kern';
	import type { ItemKey, SelectGridItem, SortableItem } from '@mozra-the-great/kern';

	interface Props {
		maybeString?: string | undefined;
		maybeBoolean?: boolean | undefined;
	}
	let { maybeString, maybeBoolean }: Props = $props();

	let files: SortableItem[] = $state([
		{ id: 1, label: 'Report.pdf', description: '3 pages' },
		{ id: 'b', label: 'Invoice.pdf' }
	]);
	interface Entry {
		uid: number;
		name: string;
		size: number;
	}
	let entries: Entry[] = $state([
		{ uid: 1, name: 'a.pdf', size: 10 },
		{ uid: 2, name: 'b.pdf', size: 20 }
	]);
	const pages: SelectGridItem[] = $state([
		{ id: 1, label: 'Page 1', src: '/p1.png' },
		{ id: 'two', label: 'Page 2', description: 'turned' }
	]);
	let selected: ItemKey[] | undefined = $state();
	let selectedEntries: ItemKey[] = $state([1]);
	const words: string[] = $state(['one', 'two']);
	const maybeFiles: SortableItem[] = $derived([{ id: 1, label: 'Maybe', description: maybeString }]);
	const maybePages: SelectGridItem[] = $derived([{ id: 1, label: 'Maybe', src: maybeString, description: maybeString }]);

	function move(from: number, to: number): void {
		files = moveItem(files, from, to);
		announce(`Moved to position ${to + 1} of ${files.length}`);
	}
</script>

<SortableList items={files} onmove={move} onremove={(index: number) => (files = files.filter((_, i) => i !== index))} />
<SortableList
	items={maybeFiles}
	key={undefined}
	itemLabel={undefined}
	label={maybeString}
	upText={maybeString}
	downText={maybeString}
	removeText={maybeString}
	upLabel={maybeString}
	downLabel={maybeString}
	removeLabel={maybeString}
	removable={maybeBoolean}
	dragDrop={maybeBoolean}
	onmove={undefined}
	onremove={undefined}
	item={undefined}
	id={maybeString}
	class={maybeString}
/>
<SortableList
	items={entries}
	key={(entry: Entry) => entry.uid}
	itemLabel={(entry: Entry) => entry.name}
	label="Entries"
	onmove={(from: number, to: number) => (entries = moveItem(entries, from, to))}
>
	{#snippet item(entry: Entry, index: number)}
		<strong>{index + 1}. {entry.name}</strong> <span>{entry.size} KB</span>
	{/snippet}
</SortableList>
<SortableList items={words} label="Words" />

<SelectGrid items={pages} bind:selected label="Pages" />
<SelectGrid
	items={maybePages}
	selected={undefined}
	key={undefined}
	itemLabel={undefined}
	label={maybeString}
	min={maybeString}
	reorderable={maybeBoolean}
	caption={maybeBoolean}
	reorderHint={maybeString}
	onchange={undefined}
	onmove={undefined}
	item={undefined}
	id={maybeString}
	class={maybeString}
/>
<SelectGrid
	items={entries}
	bind:selected={selectedEntries}
	key={(entry: Entry) => entry.uid}
	itemLabel={(entry: Entry, index: number) => `${index + 1}: ${entry.name}`}
	reorderable
	onchange={(next: ItemKey[]) => (selectedEntries = next)}
	onmove={(from: number, to: number) => (entries = moveItem(entries, from, to))}
>
	{#snippet item(entry: Entry, _index: number, isSelected: boolean)}
		<span data-selected={isSelected}>{entry.name}</span>
	{/snippet}
</SelectGrid>
