<script lang="ts" module>
	export interface DataColumn<R> {
		key: keyof R & string;
		label: string;
		align?: 'start' | 'end' | 'center';
		/** Set in the mono family: numbers, ids. */
		mono?: boolean;
		sortable?: boolean;
		/** Text of a cell. Also what the filter searches. Default: the raw value. */
		format?: (value: unknown, row: R) => string;
	}
	export type DataRowKey = string | number;
	export type DataSortDir = 'asc' | 'desc';
</script>

<script lang="ts" generics="Row extends Record<string, unknown>">
	import type { Snippet } from 'svelte';
	import Input from './Input.svelte';
	import Pagination from './Pagination.svelte';
	import Skeleton from './Skeleton.svelte';
	import { fill } from './data-utils.js';

	interface Props {
		columns: DataColumn<Row>[];
		rows: Row[];
		/** Table caption; also its accessible name. */
		caption: string;
		/** Hide the caption visually. */
		captionHidden?: boolean;
		/** Field whose value identifies a row. Default: the position in `rows`. */
		rowKey?: keyof Row & string;
		/** Show a checkbox column. */
		selectable?: boolean;
		/** Keys of the selected rows (see `rowKey`). Kept across filter, sort and pages. */
		selected?: DataRowKey[];
		/** Column whose text names a row for the checkbox. Default: the first column. */
		rowLabelKey?: keyof Row & string;
		/** Show the filter field. */
		searchable?: boolean;
		/** Filter text. Words must all occur in the row's cells. */
		query?: string;
		sortKey?: string | null;
		sortDir?: DataSortDir;
		/** Rows per page. 0 shows all rows. */
		pageSize?: number;
		/** Current page, 1-based. */
		page?: number;
		/** Show placeholder rows instead of the data. */
		loading?: boolean;
		/** Number of placeholder rows. Default: the page size, at most 10. */
		loadingRows?: number;
		/** Below the breakpoint, show rows as stacked cards. */
		stack?: boolean;
		/** Custom cell rendering. */
		cell?: Snippet<[{ row: Row; column: DataColumn<Row>; value: unknown }]>;
		onselect?: (keys: DataRowKey[]) => void;
		onsort?: (sort: { key: string; dir: DataSortDir }) => void;

		/* Texts. Placeholders in braces. */
		searchLabel?: string;
		searchPlaceholder?: string;
		empty?: string;
		/** {query} */
		emptyFiltered?: string;
		/** {count} {total} */
		resultsLabel?: string;
		/** {count} {total}; used while a filter is active. */
		filteredLabel?: string;
		/** {count} */
		selectedLabel?: string;
		/** {column} {direction} */
		sortedLabel?: string;
		ascendingLabel?: string;
		descendingLabel?: string;
		loadingLabel?: string;
		selectAllLabel?: string;
		/** {row} */
		selectRowLabel?: string;
		paginationLabel?: string;
		prevLabel?: string;
		nextLabel?: string;
		pageLabel?: string;
		ofLabel?: string;
		class?: string;
	}
	let {
		columns,
		rows,
		caption,
		captionHidden = false,
		rowKey,
		selectable = false,
		selected = $bindable([]),
		rowLabelKey,
		searchable = true,
		query = $bindable(''),
		sortKey = $bindable(null),
		sortDir = $bindable('asc'),
		pageSize = 10,
		page = $bindable(1),
		loading = false,
		loadingRows,
		stack = true,
		cell,
		onselect,
		onsort,
		searchLabel = 'Filter',
		searchPlaceholder = '',
		empty = 'No entries',
		emptyFiltered = 'No entries match “{query}”',
		resultsLabel = '{count} entries',
		filteredLabel = '{count} of {total} entries',
		selectedLabel = '{count} selected',
		sortedLabel = 'Sorted by {column}, {direction}',
		ascendingLabel = 'ascending',
		descendingLabel = 'descending',
		loadingLabel = 'Loading…',
		selectAllLabel = 'Select all rows on this page',
		selectRowLabel = 'Select {row}',
		paginationLabel = 'Table pagination',
		prevLabel,
		nextLabel,
		pageLabel,
		ofLabel,
		class: cls = ''
	}: Props = $props();

	interface Entry { row: Row; index: number }

	const text = (row: Row, c: DataColumn<Row>): string => {
		const v = row[c.key];
		return c.format ? c.format(v, row) : v === null || v === undefined ? '' : String(v);
	};

	const words = $derived(query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean));
	const filtered = $derived.by((): Entry[] => {
		const all = rows.map((row, index) => ({ row, index }));
		if (words.length === 0) return all;
		return all.filter(({ row }) => {
			const hay = columns.map((c) => text(row, c)).join(' ').toLocaleLowerCase();
			return words.every((w) => hay.includes(w));
		});
	});
	const sorted = $derived.by((): Entry[] => {
		const k = sortKey;
		if (!k) return filtered;
		const dir = sortDir === 'desc' ? -1 : 1;
		return [...filtered].sort((a, b) => {
			const x = a.row[k], y = b.row[k];
			if (typeof x === 'number' && typeof y === 'number') return (x - y) * dir;
			return String(x ?? '').localeCompare(String(y ?? ''), undefined, { numeric: true }) * dir;
		});
	});

	const size = $derived(Math.max(0, Math.floor(pageSize) || 0));
	const pageCount = $derived(size ? Math.max(1, Math.ceil(sorted.length / size)) : 1);
	const current = $derived(Math.min(pageCount, Math.max(1, Math.floor(page) || 1)));
	const visible = $derived(size ? sorted.slice((current - 1) * size, current * size) : sorted);

	const keyOf = (e: Entry): DataRowKey => {
		if (!rowKey) return e.index;
		const v = e.row[rowKey];
		return typeof v === 'number' ? v : String(v);
	};
	const sel = $derived(new Set(selected));
	const pageKeys = $derived(visible.map(keyOf));
	const pageSelected = $derived(pageKeys.filter((k) => sel.has(k)).length);
	const allOnPage = $derived(pageKeys.length > 0 && pageSelected === pageKeys.length);
	const someOnPage = $derived(pageSelected > 0 && !allOnPage);

	let headBox: HTMLInputElement | undefined = $state();
	$effect(() => {
		if (headBox) headBox.indeterminate = someOnPage;
	});

	function commit(next: DataRowKey[]) {
		selected = next;
		onselect?.(next);
	}
	function toggleAll(on: boolean) {
		const keys = new Set(pageKeys);
		commit(on ? [...selected, ...pageKeys.filter((k) => !sel.has(k))] : selected.filter((k) => !keys.has(k)));
	}
	function toggleRow(k: DataRowKey, on: boolean) {
		commit(on ? (sel.has(k) ? selected : [...selected, k]) : selected.filter((x) => x !== k));
	}
	function sortBy(key: string) {
		if (sortKey === key) sortDir = sortDir === 'asc' ? 'desc' : 'asc';
		else { sortKey = key; sortDir = 'asc'; }
		page = 1;
		onsort?.({ key, dir: sortDir });
	}

	const labelCol = $derived(columns.find((c) => c.key === rowLabelKey) ?? columns[0]);
	const rowName = (e: Entry): string => (labelCol ? text(e.row, labelCol) : String(keyOf(e)));
	const sortCol = $derived(columns.find((c) => c.key === sortKey));

	const status = $derived.by((): string => {
		if (loading) return loadingLabel;
		const parts = [fill(words.length ? filteredLabel : resultsLabel, { count: sorted.length, total: rows.length })];
		if (selectable && selected.length) parts.push(fill(selectedLabel, { count: selected.length }));
		return parts.join(' · ');
	});
	const sortStatus = $derived(
		sortCol ? fill(sortedLabel, { column: sortCol.label, direction: sortDir === 'asc' ? ascendingLabel : descendingLabel }) : ''
	);

	const skeletonRows = $derived(Array.from({ length: Math.max(1, Math.floor(loadingRows ?? Math.min(size || 10, 10))) }, (_, i) => i));
	const span = $derived(columns.length + (selectable ? 1 : 0));
</script>

<div class="k-datatable {cls}">
	<div class="toolbar">
		{#if searchable}
			<div class="search">
				<Input
					type="search"
					label={searchLabel}
					placeholder={searchPlaceholder}
					autocomplete="off"
					bind:value={query}
					oninput={() => (page = 1)}
				>
					{#snippet leading()}<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="9" cy="9" r="6" /><path d="M14 14l4 4" /></svg>{/snippet}
				</Input>
			</div>
		{/if}
		<p class="status" role="status">{status}{#if sortStatus}<span class="sr">. {sortStatus}</span>{/if}</p>
	</div>

	<div class="k-table" class:stack>
		<table aria-busy={loading || undefined}>
			<caption class:sr={captionHidden}>{caption}</caption>
			<thead>
				<tr>
					{#if selectable}
						<th scope="col" class="sel">
							<label class="chk">
								<input type="checkbox" bind:this={headBox} checked={allOnPage} disabled={pageKeys.length === 0} onchange={(e) => toggleAll(e.currentTarget.checked)} />
								<svg viewBox="0 0 16 16" aria-hidden="true">{#if someOnPage}<path d="M4 8h8" />{:else}<path d="M3.5 8.5l3 3 6-7" />{/if}</svg>
								<span class="selall-text">{selectAllLabel}</span>
							</label>
						</th>
					{/if}
					{#each columns as c (c.key)}
						<th
							scope="col"
							class:sortable={c.sortable}
							data-align={c.align ?? 'start'}
							aria-sort={sortKey === c.key ? (sortDir === 'asc' ? 'ascending' : 'descending') : c.sortable ? 'none' : undefined}
						>
							{#if c.sortable}
								<button type="button" onclick={() => sortBy(c.key)}>
									{c.label}
									<svg viewBox="0 0 16 16" aria-hidden="true" class:active={sortKey === c.key} class:desc={sortKey === c.key && sortDir === 'desc'}><path d="M4 10l4-4 4 4" fill="none" stroke="currentColor" stroke-width="2" /></svg>
								</button>
							{:else}{c.label}{/if}
						</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#if loading}
					{#each skeletonRows as i (i)}
						<tr aria-hidden="true">
							{#if selectable}<td class="sel"><Skeleton variant="rect" width={22} height={22} /></td>{/if}
							{#each columns as c, j (c.key)}
								<td data-align={c.align ?? 'start'} data-label={c.label}><Skeleton width="{50 + ((i * 7 + j * 13) % 40)}%" height={14} /></td>
							{/each}
						</tr>
					{/each}
				{:else}
					{#each visible as entry (entry.index)}
						{@const k = keyOf(entry)}
						<tr class:selected={sel.has(k)}>
							{#if selectable}
								<td class="sel">
									<label class="chk">
										<input
											type="checkbox"
											aria-label={fill(selectRowLabel, { row: rowName(entry) })}
											checked={sel.has(k)}
											onchange={(e) => toggleRow(k, e.currentTarget.checked)}
										/>
										<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" /></svg>
									</label>
								</td>
							{/if}
							{#each columns as c (c.key)}
								<td data-align={c.align ?? 'start'} class:mono={c.mono} data-label={c.label}>
									{#if cell}{@render cell({ row: entry.row, column: c, value: entry.row[c.key] })}{:else}{text(entry.row, c)}{/if}
								</td>
							{/each}
						</tr>
					{:else}
						<tr><td class="empty" colspan={span}>{words.length ? fill(emptyFiltered, { query: query.trim() }) : empty}</td></tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>

	{#if pageCount > 1 && !loading}
		<Pagination
			page={current}
			{pageCount}
			label={paginationLabel}
			{prevLabel}
			{nextLabel}
			{pageLabel}
			{ofLabel}
			onchange={(p) => (page = p)}
		/>
	{/if}
</div>

<style>
	.k-datatable { display: grid; gap: var(--k-space-3); min-width: 0; color: var(--k-fg); }
	.toolbar { display: flex; flex-wrap: wrap; align-items: end; justify-content: space-between; gap: var(--k-space-2) var(--k-space-4); }
	.search { flex: 1 1 220px; max-width: 360px; min-width: 0; }
	.status { margin: 0; padding-bottom: var(--k-space-2); color: var(--k-fg-muted); font-family: var(--k-font-mono); font-size: var(--k-text-xs); font-variant-numeric: tabular-nums; }
	.sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0; }

	.k-table { overflow-x: auto; border: var(--k-border-w) solid var(--k-line); border-radius: var(--k-radius-card); background: var(--k-bg-raised); }
	table { width: 100%; border-collapse: collapse; font-size: var(--k-text-sm); }
	caption { padding: var(--k-space-4); text-align: left; font-weight: var(--k-weight-heading); }
	caption.sr { padding: 0; }
	th { padding: var(--k-space-3) var(--k-space-4); background: var(--k-bg-sunken); color: var(--k-fg-muted); text-align: left; font-family: var(--k-label-font); font-size: var(--k-text-xs); font-weight: var(--k-weight-label); text-transform: var(--k-label-transform); letter-spacing: var(--k-label-tracking); white-space: nowrap; border-bottom: var(--k-border-w) solid var(--k-line); }
	th button { position: relative; display: inline-flex; align-items: center; gap: var(--k-space-1); min-height: 24px; padding: 0; border: 0; background: none; color: inherit; font: inherit; text-transform: inherit; letter-spacing: inherit; cursor: pointer; }
	th button:hover { color: var(--k-fg); }
	th button:focus-visible { outline: var(--k-focus-w) solid var(--k-focus); outline-offset: 2px; }
	th svg { width: 12px; height: 12px; opacity: 0.45; transition: transform var(--k-dur) var(--k-ease); }
	th svg.active { opacity: 1; }
	th svg.desc { transform: rotate(180deg); }
	td { padding: var(--k-space-3) var(--k-space-4); border-bottom: var(--k-border-w) solid var(--k-line); vertical-align: middle; }
	tbody tr:last-child td { border-bottom: 0; }
	tbody tr:hover td { background: color-mix(in srgb, var(--k-fg) 5%, transparent); }
	tbody tr.selected td { background: color-mix(in srgb, var(--k-accent) 10%, var(--k-bg-raised)); }
	tbody tr.selected td:first-child { box-shadow: inset 3px 0 0 var(--k-accent-mark); }
	[data-align='end'] { text-align: right; }
	[data-align='center'] { text-align: center; }
	.mono { font-family: var(--k-font-mono); font-variant-numeric: tabular-nums; }
	.empty { padding: var(--k-space-7); text-align: center; color: var(--k-fg-muted); }

	.sel { width: 1%; padding-block: 0; padding-inline: var(--k-space-3) var(--k-space-1); }
	.chk { position: relative; display: grid; place-items: center; width: max(40px, var(--k-tap-target)); height: max(40px, var(--k-tap-target)); cursor: pointer; }
	th button::after { content: ''; position: absolute; inset: min(0px, calc((100% - var(--k-tap-target)) / 2)); }
	.chk input {
		appearance: none;
		grid-area: 1 / 1;
		width: 22px;
		height: 22px;
		margin: 0;
		border: calc(var(--k-border-w) + 0.5px) solid var(--k-border);
		border-radius: min(var(--k-radius-field), 6px);
		background: var(--k-bg-raised);
		cursor: pointer;
		transition: background-color var(--k-dur) var(--k-ease), border-color var(--k-dur) var(--k-ease);
	}
	.chk input:hover { border-color: var(--k-fg); }
	.chk input:checked, .chk input:indeterminate { background: var(--k-primary); border-color: var(--k-primary); }
	.chk input:focus-visible { outline: var(--k-focus-w) solid var(--k-focus); outline-offset: var(--k-focus-offset); }
	.chk input:disabled { opacity: 0.5; cursor: not-allowed; }
	.chk svg { grid-area: 1 / 1; width: 16px; height: 16px; fill: none; stroke: var(--k-on-primary); stroke-width: 2.2; opacity: 0; pointer-events: none; }
	.chk input:checked + svg, .chk input:indeterminate + svg { opacity: 1; }
	.selall-text { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }

	@media (max-width: 760px) {
		.stack { border: 0; background: none; overflow: visible; }
		/* The header turns into a row of sort and select-all chips. */
		.stack thead, .stack tr, .stack tbody, .stack table { display: block; }
		.stack thead tr { display: flex; flex-wrap: wrap; align-items: center; gap: var(--k-space-2); margin-bottom: var(--k-space-3); }
		.stack th { display: none; padding: 0 var(--k-space-3); border: var(--k-border-w) solid var(--k-line); border-radius: var(--k-radius-control); background: var(--k-bg-raised); }
		.stack th.sortable, .stack th.sel { display: inline-flex; align-items: center; min-height: max(40px, var(--k-tap-target)); }
		.stack th.sel { width: auto; padding-inline: var(--k-space-1) var(--k-space-3); }
		.stack th button { min-height: max(40px, var(--k-tap-target)); }
		.stack .selall-text { position: static; width: auto; height: auto; margin: 0; overflow: visible; clip-path: none; white-space: normal; }
		.stack th.sel .chk { display: inline-flex; align-items: center; gap: var(--k-space-2); width: auto; min-height: max(40px, var(--k-tap-target)); }
		.stack th.sel .chk input { flex: none; }
		.stack th.sel .chk svg { position: absolute; left: 3px; top: 50%; translate: 0 -50%; }
		.stack .chk { width: max(36px, var(--k-tap-target)); }
		.stack tbody tr { margin-bottom: var(--k-space-3); border: var(--k-border-w) solid var(--k-line); border-radius: var(--k-radius-card); background: var(--k-bg-raised); overflow: hidden; }
		.stack tbody tr.selected { border-color: var(--k-accent-mark); }
		.stack tbody tr.selected td { background: transparent; }
		.stack tbody tr.selected td:first-child { box-shadow: none; }
		.stack td { display: flex; align-items: center; justify-content: space-between; gap: var(--k-space-4); text-align: right; }
		.stack td::before { content: attr(data-label); color: var(--k-fg-muted); font-family: var(--k-label-font); font-size: var(--k-text-xs); text-transform: var(--k-label-transform); letter-spacing: var(--k-label-tracking); text-align: left; }
		.stack td.sel { width: auto; justify-content: flex-start; padding: var(--k-space-1) var(--k-space-3); }
		.stack td.sel::before, .stack td.empty::before { content: none; }
		.stack tbody tr:last-child td { border-bottom: var(--k-border-w) solid var(--k-line); }
		.stack tr td:last-child { border-bottom: 0; }
	}
</style>
