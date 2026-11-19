<svelte:options
	customElement={{
		props: {
			page: { type: 'Number', reflect: true },
			pageCount: { type: 'Number', attribute: 'page-count' },
			siblings: { type: 'Number' },
			label: { type: 'String' },
			prevLabel: { type: 'String', attribute: 'prev-label' },
			nextLabel: { type: 'String', attribute: 'next-label' },
			pageLabel: { type: 'String', attribute: 'page-label' },
			ofLabel: { type: 'String', attribute: 'of-label' }
		}
	}}
/>

<script lang="ts">
	/**
	 * @event change {number} The page the user moved to.
	 */
	import Pagination from '../lib/components/Pagination.svelte';
	import { emit } from './form.js';
	let { page = $bindable(1), pageCount = 1, siblings, label, prevLabel, nextLabel, pageLabel, ofLabel } = $props();
	const host = $host();
</script>

<Pagination
	bind:page
	{pageCount}
	{siblings}
	{label}
	{prevLabel}
	{nextLabel}
	{pageLabel}
	{ofLabel}
	onchange={(p: number) => emit(host, 'change', p)}
/>
