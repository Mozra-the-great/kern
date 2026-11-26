<script lang="ts">
	// SortableList inside a boundary: an error thrown by one of its effects lands in `onerror` instead of the page
	// (tests/dom/sortablelist.test.ts, the list empties and refills).
	import SortableList, { type SortableItem } from '../../../src/lib/components/SortableList.svelte';

	let {
		items,
		onremove,
		onerror
	}: { items: readonly SortableItem[]; onremove: (index: number) => void; onerror: (error: unknown) => void } = $props();
</script>

<svelte:boundary {onerror}>
	<SortableList {items} {onremove} label="Fruit" />
	{#snippet failed()}
		<p role="alert">boundary failed</p>
	{/snippet}
</svelte:boundary>
