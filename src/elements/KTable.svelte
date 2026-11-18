<svelte:options customElement={{ tag: 'k-table', props: { columns: { type: "Array" }, rows: { type: "Array" }, caption: { type: "String" }, captionHidden: { type: 'Boolean', attribute: 'caption-hidden' }, stack: { type: "Boolean" }, empty: { type: "String" } } }} />
<script lang="ts">
	import Table from '../lib/components/Table.svelte';
	let { columns = [], rows = [], caption, captionHidden = false, stack = true, empty } = $props();
</script>
<Table {columns} {rows} {caption} {captionHidden} {stack} {empty} />
