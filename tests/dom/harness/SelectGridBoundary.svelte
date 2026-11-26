<script lang="ts">
	// SelectGrid inside a boundary: an error thrown by one of its effects lands in `onerror` instead of the page
	// (tests/dom/selectgrid.test.ts, the list empties and refills).
	import SelectGrid, { type SelectGridItem } from '../../../src/lib/components/SelectGrid.svelte';

	let { items, onerror }: { items: readonly SelectGridItem[]; onerror: (error: unknown) => void } = $props();
</script>

<svelte:boundary {onerror}>
	<SelectGrid {items} label="Pictures" />
	{#snippet failed()}
		<p role="alert">boundary failed</p>
	{/snippet}
</svelte:boundary>
