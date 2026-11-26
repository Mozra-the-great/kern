<svelte:options
	customElement={{
		props: {
			columns: { type: 'Array' },
			rows: { type: 'Array' },
			caption: { type: 'String' },
			captionHidden: { type: 'Boolean', attribute: 'caption-hidden' },
			rowKey: { type: 'String', attribute: 'row-key' },
			selectable: { type: 'Boolean' },
			selected: { type: 'Array' },
			rowLabelKey: { type: 'String', attribute: 'row-label-key' },
			noSearch: { type: 'Boolean', attribute: 'no-search' },
			query: { type: 'String' },
			sortKey: { type: 'String', attribute: 'sort-key' },
			sortDir: { type: 'String', attribute: 'sort-dir' },
			pageSize: { type: 'Number', attribute: 'page-size' },
			page: { type: 'Number' },
			loading: { type: 'Boolean' },
			loadingRows: { type: 'Number', attribute: 'loading-rows' },
			noStack: { type: 'Boolean', attribute: 'no-stack' },
			searchLabel: { type: 'String', attribute: 'search-label' },
			searchPlaceholder: { type: 'String', attribute: 'search-placeholder' },
			empty: { type: 'String' },
			emptyFiltered: { type: 'String', attribute: 'empty-filtered' },
			resultsLabel: { type: 'String', attribute: 'results-label' },
			filteredLabel: { type: 'String', attribute: 'filtered-label' },
			selectedLabel: { type: 'String', attribute: 'selected-label' },
			sortedLabel: { type: 'String', attribute: 'sorted-label' },
			ascendingLabel: { type: 'String', attribute: 'ascending-label' },
			descendingLabel: { type: 'String', attribute: 'descending-label' },
			loadingLabel: { type: 'String', attribute: 'loading-label' },
			selectAllLabel: { type: 'String', attribute: 'select-all-label' },
			selectRowLabel: { type: 'String', attribute: 'select-row-label' },
			paginationLabel: { type: 'String', attribute: 'pagination-label' },
			prevLabel: { type: 'String', attribute: 'prev-label' },
			nextLabel: { type: 'String', attribute: 'next-label' },
			pageLabel: { type: 'String', attribute: 'page-label' },
			ofLabel: { type: 'String', attribute: 'of-label' }
		}
	}}
/>

<script lang="ts">
	/**
	 * @prop columns {readonly TableColumn[]}
	 * @prop rows {readonly TableRow[]}
	 * @prop selected {DataRowKey[]}
	 * @prop sortKey {string | null}
	 * @prop sortDir {DataSortDir}
	 * @event select {DataRowKey[]} Keys of the selected rows (by `row-key`).
	 * @event sort {{ key: string; dir: DataSortDir }} The new sort order.
	 */
	import DataTable from '../lib/components/DataTable.svelte';
	import { emit } from './form.js';
	/* Events: "select" (detail = selected keys), "sort" (detail = {key, dir}). Cells show the raw
	   values; per-column `format` functions and the `cell` snippet exist only in Svelte. */
	let {
		columns = [],
		rows = [],
		caption = '',
		captionHidden = false,
		rowKey,
		selectable = false,
		selected = $bindable([]),
		rowLabelKey,
		noSearch = false,
		query = $bindable(''),
		sortKey = $bindable(null),
		sortDir = $bindable('asc'),
		pageSize,
		page = $bindable(1),
		loading = false,
		loadingRows,
		noStack = false,
		searchLabel,
		searchPlaceholder,
		empty,
		emptyFiltered,
		resultsLabel,
		filteredLabel,
		selectedLabel,
		sortedLabel,
		ascendingLabel,
		descendingLabel,
		loadingLabel,
		selectAllLabel,
		selectRowLabel,
		paginationLabel,
		prevLabel,
		nextLabel,
		pageLabel,
		ofLabel
	} = $props();
	const host = $host();
</script>

<DataTable
	{columns}
	{rows}
	{caption}
	{captionHidden}
	{rowKey}
	{selectable}
	bind:selected
	{rowLabelKey}
	searchable={!noSearch}
	bind:query
	bind:sortKey
	bind:sortDir
	{pageSize}
	bind:page
	{loading}
	{loadingRows}
	stack={!noStack}
	{searchLabel}
	{searchPlaceholder}
	{empty}
	{emptyFiltered}
	{resultsLabel}
	{filteredLabel}
	{selectedLabel}
	{sortedLabel}
	{ascendingLabel}
	{descendingLabel}
	{loadingLabel}
	{selectAllLabel}
	{selectRowLabel}
	{paginationLabel}
	{prevLabel}
	{nextLabel}
	{pageLabel}
	{ofLabel}
	onselect={(keys: (string | number)[]) => emit(host, 'select', keys)}
	onsort={(s: { key: string; dir: 'asc' | 'desc' }) => emit(host, 'sort', s)}
/>
