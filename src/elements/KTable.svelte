<svelte:options
	customElement={{
		props: {
			columns: { type: 'Array' },
			rows: { type: 'Array' },
			caption: { type: 'String' },
			captionHidden: { type: 'Boolean', attribute: 'caption-hidden' },
			stack: { type: 'Boolean' },
			empty: { type: 'String' }
		}
	}}
/>

<script lang="ts">
	/**
	 * @prop columns {TableColumn[]}
	 * @prop rows {TableRow[]}
	 */
	import Table from '../lib/components/Table.svelte';
	let { columns = [], rows = [], caption, captionHidden = false, stack = true, empty } = $props();
</script>

<Table {columns} {rows} {caption} {captionHidden} {stack} {empty} />

<style>
	/* A table that cannot stack (`stack` off) is as wide as its columns. As the only item of a grid, its scrolling box may be
	   narrower than that (what a data table does by being a grid): otherwise the host takes the width of the table and widens
	   the page instead of scrolling inside its box (#137). */
	:host {
		display: grid;
		min-width: 0;
	}
</style>
