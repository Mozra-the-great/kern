<script lang="ts" module>
	export interface DataColumn<R> {
		key: keyof R & string;
		label: string;
		align?: 'start' | 'end' | 'center' | undefined;
		/** Set in the mono family: numbers, ids. */
		mono?: boolean | undefined;
		sortable?: boolean | undefined;
		/** Text of a cell. Also what the filter searches. Default: the raw value. */
		format?: ((value: unknown, row: R) => string) | undefined;
	}
	export type DataRowKey = string | number;
	export type DataSortDir = 'asc' | 'desc';
</script>

<script lang="ts" generics="Row extends Record<string, unknown>">
	import { strings } from './strings.svelte.js';
	import type { Snippet } from 'svelte';
	import Input from './Input.svelte';
	import Pagination from './Pagination.svelte';
	import Skeleton from './Skeleton.svelte';
	import { fill } from './data-utils.js';
	import { hasFocus, watchScrollRegion } from './scroll-region.js';

	interface Props {
		columns: DataColumn<Row>[];
		rows: Row[];
		/** Table caption; also its accessible name. */
		caption: string;
		/** Hide the caption visually. */
		captionHidden?: boolean | undefined;
		/** Field whose value identifies a row. Default: the position in `rows`. */
		rowKey?: Extract<keyof Row, string> | undefined;
		/** Show a checkbox column. */
		selectable?: boolean | undefined;
		/** Keys of the selected rows (see `rowKey`). Kept across filter, sort and pages. */
		selected?: DataRowKey[] | undefined;
		/** Column whose text names a row for the checkbox. Default: the first column. */
		rowLabelKey?: Extract<keyof Row, string> | undefined;
		/** Show the filter field. */
		searchable?: boolean | undefined;
		/** Filter text. Words must all occur in the row's cells. */
		query?: string | undefined;
		sortKey?: string | null | undefined;
		sortDir?: DataSortDir | undefined;
		/** Rows per page. 0 shows all rows. */
		pageSize?: number | undefined;
		/** Current page, 1-based. */
		page?: number | undefined;
		/** Show placeholder rows instead of the data. */
		loading?: boolean | undefined;
		/** Number of placeholder rows. Default: the page size, at most 10. */
		loadingRows?: number | undefined;
		/** Below the breakpoint, show rows as stacked cards. */
		stack?: boolean | undefined;
		/** Custom cell rendering. */
		cell?: Snippet<[{ row: Row; column: DataColumn<Row>; value: unknown }]> | undefined;
		onselect?: ((keys: DataRowKey[]) => void) | undefined;
		onsort?: ((sort: { key: string; dir: DataSortDir }) => void) | undefined;

		/* Texts. Placeholders in braces. */
		searchLabel?: string | undefined;
		searchPlaceholder?: string | undefined;
		empty?: string | undefined;
		/** {query} */
		emptyFiltered?: string | undefined;
		/** {count} {total} */
		resultsLabel?: string | undefined;
		/** {count} {total}; used while a filter is active. */
		filteredLabel?: string | undefined;
		/** {count} */
		selectedLabel?: string | undefined;
		/** {column} {direction} */
		sortedLabel?: string | undefined;
		ascendingLabel?: string | undefined;
		descendingLabel?: string | undefined;
		loadingLabel?: string | undefined;
		selectAllLabel?: string | undefined;
		/** {row} */
		selectRowLabel?: string | undefined;
		paginationLabel?: string | undefined;
		prevLabel?: string | undefined;
		nextLabel?: string | undefined;
		pageLabel?: string | undefined;
		ofLabel?: string | undefined;
		class?: string | undefined;
	}
	let {
		columns,
		rows,
		caption,
		captionHidden = false,
		rowKey,
		selectable = false,
		selected = $bindable(),
		rowLabelKey,
		searchable = true,
		query = $bindable(),
		sortKey = $bindable(),
		sortDir = $bindable(),
		pageSize = 10,
		page = $bindable(),
		loading = false,
		loadingRows,
		stack = true,
		cell,
		onselect,
		onsort,
		searchLabel: searchLabelProp,
		searchPlaceholder = '',
		empty: emptyProp,
		emptyFiltered: emptyFilteredProp,
		resultsLabel: resultsLabelProp,
		filteredLabel: filteredLabelProp,
		selectedLabel: selectedLabelProp,
		sortedLabel: sortedLabelProp,
		ascendingLabel: ascendingLabelProp,
		descendingLabel: descendingLabelProp,
		loadingLabel: loadingLabelProp,
		selectAllLabel: selectAllLabelProp,
		selectRowLabel: selectRowLabelProp,
		paginationLabel: paginationLabelProp,
		prevLabel,
		nextLabel,
		pageLabel,
		ofLabel,
		class: cls = ''
	}: Props = $props();
	const searchLabel = $derived(searchLabelProp ?? strings().dataTable.searchLabel);
	const empty = $derived(emptyProp ?? strings().dataTable.empty);
	const emptyFiltered = $derived(emptyFilteredProp ?? strings().dataTable.emptyFiltered);
	const resultsLabel = $derived(resultsLabelProp ?? strings().dataTable.resultsLabel);
	const filteredLabel = $derived(filteredLabelProp ?? strings().dataTable.filteredLabel);
	const selectedLabel = $derived(selectedLabelProp ?? strings().dataTable.selectedLabel);
	const sortedLabel = $derived(sortedLabelProp ?? strings().dataTable.sortedLabel);
	const ascendingLabel = $derived(ascendingLabelProp ?? strings().dataTable.ascendingLabel);
	const descendingLabel = $derived(descendingLabelProp ?? strings().dataTable.descendingLabel);
	const loadingLabel = $derived(loadingLabelProp ?? strings().dataTable.loadingLabel);
	const selectAllLabel = $derived(selectAllLabelProp ?? strings().dataTable.selectAllLabel);
	const selectRowLabel = $derived(selectRowLabelProp ?? strings().dataTable.selectRowLabel);
	const paginationLabel = $derived(paginationLabelProp ?? strings().dataTable.paginationLabel);
	const scrollLabel = $derived(strings().dataTable.scrollLabel);
	const uid = $props.id();

	interface Entry {
		row: Row;
		index: number;
	}

	const text = (row: Row, c: DataColumn<Row>): string => {
		const v = row[c.key];
		// eslint-disable-next-line @typescript-eslint/no-base-to-string -- cells are arbitrary values; plain String() is the documented fallback
		return c.format ? c.format(v, row) : v === null || v === undefined ? '' : String(v);
	};

	// The bindable props have no fallback (binding `undefined` = prop left out); these are the values in effect.
	const selectedKeys = $derived(selected ?? []);
	const search = $derived(query ?? '');
	const sortOrder = $derived(sortDir ?? 'asc');
	const words = $derived(search.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean));
	const filtered = $derived.by((): Entry[] => {
		const all = rows.map((row, index) => ({ row, index }));
		if (words.length === 0) return all;
		return all.filter(({ row }) => {
			const hay = columns
				.map((c) => text(row, c))
				.join(' ')
				.toLocaleLowerCase();
			return words.every((w) => hay.includes(w));
		});
	});
	const sorted = $derived.by((): Entry[] => {
		const k = sortKey;
		if (!k) return filtered;
		const dir = sortOrder === 'desc' ? -1 : 1;
		return [...filtered].sort((a, b) => {
			const x = a.row[k],
				y = b.row[k];
			if (typeof x === 'number' && typeof y === 'number') return (x - y) * dir;
			// eslint-disable-next-line @typescript-eslint/no-base-to-string -- sorts arbitrary cell values by their string form
			return String(x ?? '').localeCompare(String(y ?? ''), undefined, { numeric: true }) * dir;
		});
	});

	const size = $derived(Math.max(0, Math.floor(pageSize) || 0));
	const pageCount = $derived(size ? Math.max(1, Math.ceil(sorted.length / size)) : 1);
	const current = $derived(Math.min(pageCount, Math.max(1, Math.floor(page ?? 1) || 1)));
	const visible = $derived(size ? sorted.slice((current - 1) * size, current * size) : sorted);

	const keyOf = (e: Entry): DataRowKey => {
		if (!rowKey) return e.index;
		const v = e.row[rowKey];
		return typeof v === 'number' ? v : String(v);
	};
	const sel = $derived(new Set(selectedKeys));
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
		commit(on ? [...selectedKeys, ...pageKeys.filter((k) => !sel.has(k))] : selectedKeys.filter((k) => !keys.has(k)));
	}
	function toggleRow(k: DataRowKey, on: boolean) {
		commit(on ? (sel.has(k) ? selectedKeys : [...selectedKeys, k]) : selectedKeys.filter((x) => x !== k));
	}
	function sortBy(key: string) {
		if (sortKey === key) sortDir = sortOrder === 'asc' ? 'desc' : 'asc';
		else {
			sortKey = key;
			sortDir = 'asc';
		}
		page = 1;
		onsort?.({ key, dir: sortOrder });
	}

	const labelCol = $derived(columns.find((c) => c.key === rowLabelKey) ?? columns[0]);
	const rowName = (e: Entry): string => (labelCol ? text(e.row, labelCol) : String(keyOf(e)));
	const sortCol = $derived(columns.find((c) => c.key === sortKey));

	const status = $derived.by((): string => {
		if (loading) return loadingLabel;
		const parts = [fill(words.length ? filteredLabel : resultsLabel, { count: sorted.length, total: rows.length })];
		if (selectable && selectedKeys.length) parts.push(fill(selectedLabel, { count: selectedKeys.length }));
		return parts.join(' · ');
	});
	const sortStatus = $derived(
		sortCol ? fill(sortedLabel, { column: sortCol.label, direction: sortOrder === 'asc' ? ascendingLabel : descendingLabel }) : ''
	);

	const skeletonRows = $derived(Array.from({ length: Math.max(1, Math.floor(loadingRows ?? Math.min(size || 10, 10))) }, (_, i) => i));
	const span = $derived(columns.length + (selectable ? 1 : 0));

	// A wrapper that scrolls sideways (`stack={false}`, or a table wider than its container) but holds nothing tabbable
	// (no sortable header, no checkbox, no link in a cell) is a tab stop itself, so the keyboard can scroll it. No tabindex
	// otherwise; while it has the focus it stays focusable (-1), so content that now fits does not drop the focus onto the page.
	let wrap: HTMLElement | undefined = $state();
	let scrolls = $state(false);
	let held = $state(false);
	$effect(() => {
		if (wrap) {
			const el = wrap;
			return watchScrollRegion(el, (needs) => {
				scrolls = needs;
				held = !needs && hasFocus(el);
			});
		}
	});
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
					{#snippet leading()}<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
							<circle cx="9" cy="9" r="6" /><path d="M14 14l4 4" />
						</svg>{/snippet}
				</Input>
			</div>
		{/if}
		<p class="status" role="status">
			{status}{#if sortStatus}<span class="sr">. {sortStatus}</span>{/if}
		</p>
	</div>

	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<div
		class="k-table"
		class:stack
		bind:this={wrap}
		role={scrolls ? 'region' : undefined}
		aria-labelledby={scrolls && caption ? `${uid}-c` : undefined}
		aria-label={scrolls && !caption ? scrollLabel : undefined}
		tabindex={scrolls ? 0 : held ? -1 : undefined}
		onfocusout={() => (held = false)}
	>
		<table aria-busy={loading || undefined}>
			<caption id="{uid}-c" class:sr={captionHidden}>{caption}</caption>
			<thead>
				<tr>
					{#if selectable}
						<th scope="col" class="sel">
							<label class="chk">
								<input
									type="checkbox"
									bind:this={headBox}
									checked={allOnPage}
									disabled={pageKeys.length === 0}
									onchange={(e) => toggleAll(e.currentTarget.checked)}
								/>
								<svg viewBox="0 0 16 16" aria-hidden="true">
									{#if someOnPage}<path d="M4 8h8" />{:else}<path d="M3.5 8.5l3 3 6-7" />{/if}
								</svg>
								<span class="selall-text">{selectAllLabel}</span>
							</label>
						</th>
					{/if}
					{#each columns as c (c.key)}
						<th
							scope="col"
							class:sortable={c.sortable}
							data-align={c.align ?? 'start'}
							aria-sort={sortKey === c.key ? (sortOrder === 'asc' ? 'ascending' : 'descending') : c.sortable ? 'none' : undefined}
						>
							{#if c.sortable}
								<button type="button" onclick={() => sortBy(c.key)}>
									{c.label}
									<svg
										viewBox="0 0 16 16"
										aria-hidden="true"
										class:active={sortKey === c.key}
										class:desc={sortKey === c.key && sortOrder === 'desc'}
									>
										<path d="M4 10l4-4 4 4" fill="none" stroke="currentColor" stroke-width="2" />
									</svg>
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
								<td data-align={c.align ?? 'start'} data-label={c.label}>
									<Skeleton width="{50 + ((i * 7 + j * 13) % 40)}%" height={14} />
								</td>
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
						<tr><td class="empty" colspan={span}>{words.length ? fill(emptyFiltered, { query: search.trim() }) : empty}</td></tr>
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
	.k-datatable {
		display: grid;
		gap: var(--k-space-3);
		min-width: 0;
		color: var(--k-fg);
	}
	.toolbar {
		display: flex;
		flex-wrap: wrap;
		align-items: end;
		justify-content: space-between;
		gap: var(--k-space-2) var(--k-space-4);
	}
	.search {
		flex: 1 1 220px;
		max-width: 360px;
		min-width: 0;
	}
	.status {
		margin: 0;
		padding-bottom: var(--k-space-2);
		color: var(--k-fg-muted);
		font-family: var(--k-font-mono);
		font-size: var(--k-text-xs);
		font-variant-numeric: tabular-nums;
	}
	.sr {
		position: absolute;
		width: 1px;
		height: 1px;
		margin: -1px;
		padding: 0;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
		border: 0;
	}

	.k-table {
		overflow-x: auto;
		border: var(--k-border-w) solid var(--k-line);
		border-radius: var(--k-radius-card);
		background: var(--k-bg-raised);
	}
	/* Inside the box: the wrapper clips an outside ring where it meets its edge. */
	.k-table:focus-visible {
		outline: var(--k-focus-w) solid var(--k-focus);
		/* a gap to the border, so the ring is not mistaken for it (Pop draws a black one) */
		outline-offset: calc(var(--k-focus-w) * -1 - 2px);
	}
	table {
		width: 100%;
		border-collapse: collapse;
		font-size: var(--k-text-sm);
	}
	caption {
		padding: var(--k-space-4);
		text-align: left;
		font-weight: var(--k-weight-heading);
	}
	caption.sr {
		padding: 0;
	}
	th {
		padding: var(--k-space-3) var(--k-space-4);
		background: var(--k-bg-sunken);
		color: var(--k-fg-muted);
		text-align: left;
		font-family: var(--k-label-font);
		font-size: var(--k-text-xs);
		font-weight: var(--k-weight-label);
		text-transform: var(--k-label-transform);
		letter-spacing: var(--k-label-tracking);
		white-space: nowrap;
		border-bottom: var(--k-border-w) solid var(--k-line);
	}
	th button {
		position: relative;
		display: inline-flex;
		align-items: center;
		gap: var(--k-space-1);
		min-height: 24px;
		padding: 0;
		border: 0;
		background: none;
		color: inherit;
		font: inherit;
		text-transform: inherit;
		letter-spacing: inherit;
		cursor: pointer;
	}
	th button:hover {
		color: var(--k-fg);
	}
	th button:focus-visible {
		outline: var(--k-focus-w) solid var(--k-focus);
		outline-offset: 2px;
	}
	th svg {
		width: 12px;
		height: 12px;
		opacity: 0.45;
		transition: transform var(--k-dur) var(--k-ease);
	}
	th svg.active {
		opacity: 1;
	}
	th svg.desc {
		transform: rotate(180deg);
	}
	td {
		padding: var(--k-space-3) var(--k-space-4);
		border-bottom: var(--k-border-w) solid var(--k-line);
		vertical-align: middle;
	}
	tbody tr:last-child td {
		border-bottom: 0;
	}
	tbody tr:hover td {
		background: color-mix(in srgb, var(--k-fg) 5%, transparent);
	}
	tbody tr.selected td {
		background: color-mix(in srgb, var(--k-accent) 10%, var(--k-bg-raised));
	}
	tbody tr.selected td:first-child {
		box-shadow: inset 3px 0 0 var(--k-accent-mark);
	}
	[data-align='end'] {
		text-align: right;
	}
	[data-align='center'] {
		text-align: center;
	}
	.mono {
		font-family: var(--k-font-mono);
		font-variant-numeric: tabular-nums;
	}
	.empty {
		padding: var(--k-space-7);
		text-align: center;
		color: var(--k-fg-muted);
	}

	.sel {
		width: 1%;
		padding-block: 0;
		padding-inline: var(--k-space-3) var(--k-space-1);
	}
	.chk {
		position: relative;
		display: grid;
		place-items: center;
		width: max(40px, var(--k-tap-target));
		height: max(40px, var(--k-tap-target));
		cursor: pointer;
	}
	th button::after {
		content: '';
		position: absolute;
		inset: min(0px, calc((100% - var(--k-tap-target)) / 2));
	}
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
		transition:
			background-color var(--k-dur) var(--k-ease),
			border-color var(--k-dur) var(--k-ease);
	}
	.chk input:hover {
		border-color: var(--k-fg);
	}
	.chk input:checked,
	.chk input:indeterminate {
		background: var(--k-primary);
		border-color: var(--k-primary);
	}
	.chk input:focus-visible {
		outline: var(--k-focus-w) solid var(--k-focus);
		outline-offset: var(--k-focus-offset);
	}
	.chk input:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.chk svg {
		grid-area: 1 / 1;
		width: 16px;
		height: 16px;
		fill: none;
		stroke: var(--k-on-primary);
		stroke-width: 2.2;
		opacity: 0;
		pointer-events: none;
	}
	.chk input:checked + svg,
	.chk input:indeterminate + svg {
		opacity: 1;
	}
	.selall-text {
		position: absolute;
		width: 1px;
		height: 1px;
		margin: -1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}

	@media (max-width: 760px) {
		.stack {
			border: 0;
			background: none;
			overflow: visible;
		}
		/* The header turns into a row of sort and select-all chips. */
		.stack thead,
		.stack tr,
		.stack tbody,
		.stack table {
			display: block;
		}
		.stack thead tr {
			display: flex;
			flex-wrap: wrap;
			align-items: center;
			gap: var(--k-space-2);
			margin-bottom: var(--k-space-3);
		}
		.stack th {
			display: none;
			padding: 0 var(--k-space-3);
			border: var(--k-border-w) solid var(--k-line);
			border-radius: var(--k-radius-control);
			background: var(--k-bg-raised);
		}
		.stack th.sortable,
		.stack th.sel {
			display: inline-flex;
			align-items: center;
			min-height: max(40px, var(--k-tap-target));
		}
		.stack th.sel {
			width: auto;
			padding-inline: var(--k-space-1) var(--k-space-3);
		}
		.stack th button {
			min-height: max(40px, var(--k-tap-target));
		}
		.stack .selall-text {
			position: static;
			width: auto;
			height: auto;
			margin: 0;
			overflow: visible;
			clip-path: none;
			white-space: normal;
		}
		.stack th.sel .chk {
			display: inline-flex;
			align-items: center;
			gap: var(--k-space-2);
			width: auto;
			min-height: max(40px, var(--k-tap-target));
		}
		.stack th.sel .chk input {
			flex: none;
		}
		.stack th.sel .chk svg {
			position: absolute;
			left: 3px;
			top: 50%;
			translate: 0 -50%;
		}
		.stack .chk {
			width: max(36px, var(--k-tap-target));
		}
		.stack tbody tr {
			margin-bottom: var(--k-space-3);
			border: var(--k-border-w) solid var(--k-line);
			border-radius: var(--k-radius-card);
			background: var(--k-bg-raised);
			overflow: hidden;
		}
		.stack tbody tr.selected {
			border-color: var(--k-accent-mark);
		}
		.stack tbody tr.selected td {
			background: transparent;
		}
		.stack tbody tr.selected td:first-child {
			box-shadow: none;
		}
		.stack td {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: var(--k-space-4);
			text-align: right;
		}
		.stack td::before {
			content: attr(data-label);
			color: var(--k-fg-muted);
			font-family: var(--k-label-font);
			font-size: var(--k-text-xs);
			text-transform: var(--k-label-transform);
			letter-spacing: var(--k-label-tracking);
			text-align: left;
		}
		.stack td.sel {
			width: auto;
			justify-content: flex-start;
			padding: var(--k-space-1) var(--k-space-3);
		}
		.stack td.sel::before,
		.stack td.empty::before {
			content: none;
		}
		.stack tbody tr:last-child td {
			border-bottom: var(--k-border-w) solid var(--k-line);
		}
		.stack tr td:last-child {
			border-bottom: 0;
		}
	}
	@media (forced-colors: active) {
		th button {
			text-decoration: underline;
			text-underline-offset: 3px;
		}
		th svg {
			opacity: 1;
		}
		th svg:not(.active) {
			opacity: 0.5;
		}
		/* Selected row: inverted instead of a tint and an inset bar (both dropped). */
		tbody tr.selected td {
			forced-color-adjust: none;
			background: Highlight;
			color: HighlightText;
			box-shadow: none;
			border-bottom-color: HighlightText;
		}
		tbody tr.selected td:first-child {
			box-shadow: none;
		}
		.stack tbody tr.selected {
			border-width: 3px;
			border-color: Highlight;
		}
		.stack tbody tr.selected td {
			background: Canvas;
			color: CanvasText;
		}
		tbody tr:hover td {
			outline: 1px solid Highlight;
			outline-offset: -1px;
		}
		.chk input:checked,
		.chk input:indeterminate {
			border-color: Highlight;
		}
		/* the selected row opts out of forced colours (its fill is Highlight); the checkbox in it must not inherit that, or it keeps the theme fill under a system-coloured mark */
		.chk {
			forced-color-adjust: auto;
		}
		.chk svg {
			stroke: CanvasText;
		}
		.chk input:disabled {
			opacity: 1;
			border-color: GrayText;
		}
	}
</style>
