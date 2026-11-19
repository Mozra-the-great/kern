<script lang="ts" module>
	export interface Column<R> {
		key: keyof R & string;
		label: string;
		align?: 'start' | 'end' | 'center' | undefined;
		/** Set in the mono family: numbers, ids. */
		mono?: boolean | undefined;
		sortable?: boolean | undefined;
	}
</script>

<script lang="ts" generics="Row extends Record<string, unknown>">
	import type { Snippet } from 'svelte';

	interface Props {
		columns: Column<Row>[];
		rows: Row[];
		/** Table caption; also its accessible name. */
		caption?: string | undefined;
		/** Hide the caption visually. */
		captionHidden?: boolean | undefined;
		/** Custom cell rendering. */
		cell?: Snippet<[{ row: Row; column: Column<Row>; value: unknown }]> | undefined;
		/** Below the breakpoint, show rows as stacked cards. */
		stack?: boolean | undefined;
		empty?: string | undefined;
		class?: string | undefined;
	}
	let { columns, rows, caption, captionHidden = false, cell, stack = true, empty = 'No entries', class: cls = '' }: Props = $props();

	let sortKey = $state<string | null>(null);
	let sortDir = $state<1 | -1>(1);
	const sorted = $derived.by(() => {
		if (!sortKey) return rows;
		const k = sortKey;
		return [...rows].sort((a, b) => {
			const x = a[k],
				y = b[k];
			if (typeof x === 'number' && typeof y === 'number') return (x - y) * sortDir;
			// eslint-disable-next-line @typescript-eslint/no-base-to-string -- sorts arbitrary cell values by their string form
			return String(x ?? '').localeCompare(String(y ?? ''), undefined, { numeric: true }) * sortDir;
		});
	});
	function sortBy(k: string) {
		if (sortKey === k) sortDir = sortDir === 1 ? -1 : 1;
		else {
			sortKey = k;
			sortDir = 1;
		}
	}
</script>

<div class="k-table {cls}" class:stack>
	<table>
		{#if caption}<caption class:sr={captionHidden}>{caption}</caption>{/if}
		<thead>
			<tr>
				{#each columns as c (c.key)}
					<th
						scope="col"
						data-align={c.align ?? 'start'}
						aria-sort={sortKey === c.key ? (sortDir === 1 ? 'ascending' : 'descending') : c.sortable ? 'none' : undefined}
					>
						{#if c.sortable}
							<button type="button" onclick={() => sortBy(c.key)}>
								{c.label}
								<svg
									viewBox="0 0 16 16"
									aria-hidden="true"
									class:active={sortKey === c.key}
									class:desc={sortKey === c.key && sortDir === -1}
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
			{#each sorted as row, i (i)}
				<tr>
					{#each columns as c (c.key)}
						<td data-align={c.align ?? 'start'} class:mono={c.mono} data-label={c.label}>
							{#if cell}{@render cell({ row, column: c, value: row[c.key] })}{:else}{row[c.key] ?? ''}{/if}
						</td>
					{/each}
				</tr>
			{:else}
				<tr><td class="empty" colspan={columns.length}>{empty}</td></tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	.k-table {
		overflow-x: auto;
		border: var(--k-border-w) solid var(--k-line);
		border-radius: var(--k-radius-card);
		background: var(--k-bg-raised);
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
	.sr {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip: rect(0 0 0 0);
		white-space: nowrap;
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
		padding: 0;
		border: 0;
		background: none;
		color: inherit;
		font: inherit;
		text-transform: inherit;
		letter-spacing: inherit;
		cursor: pointer;
	}
	th button::after {
		content: '';
		position: absolute;
		inset: min(0px, calc((100% - var(--k-tap-target)) / 2));
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
		opacity: 0.35;
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
		background: var(--k-selected);
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
	@media (max-width: 760px) {
		.stack {
			border: 0;
			background: none;
			overflow: visible;
		}
		.stack thead {
			position: absolute;
			width: 1px;
			height: 1px;
			overflow: hidden;
			clip: rect(0 0 0 0);
		}
		.stack table,
		.stack tbody,
		.stack tr,
		.stack td {
			display: block;
		}
		.stack tr {
			margin-bottom: var(--k-space-3);
			border: var(--k-border-w) solid var(--k-line);
			border-radius: var(--k-radius-card);
			background: var(--k-bg-raised);
			overflow: hidden;
		}
		.stack td {
			display: flex;
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
</style>
