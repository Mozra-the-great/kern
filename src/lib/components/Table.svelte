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
	import { strings } from './strings.svelte.js';
	import type { Snippet } from 'svelte';
	import { hasFocus, watchScrollRegion } from './scroll-region.js';

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
	let { columns, rows, caption, captionHidden = false, cell, stack = true, empty: emptyProp, class: cls = '' }: Props = $props();
	const empty = $derived(emptyProp ?? strings().table.empty);
	const scrollLabel = $derived(strings().table.scrollLabel);
	const uid = $props.id();

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

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
	class="k-table {cls}"
	class:stack
	class:sortable={columns.some((c) => c.sortable)}
	bind:this={wrap}
	role={scrolls ? 'region' : undefined}
	aria-labelledby={scrolls && caption ? `${uid}-c` : undefined}
	aria-label={scrolls && !caption ? scrollLabel : undefined}
	tabindex={scrolls ? 0 : held ? -1 : undefined}
	onfocusout={() => (held = false)}
>
	<table>
		{#if caption}<caption id="{uid}-c" class:sr={captionHidden}>{caption}</caption>{/if}
		<thead>
			<tr>
				{#each columns as c (c.key)}
					<th
						scope="col"
						class:sortable={c.sortable}
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
		/* With sortable columns the header stays on screen as a row of sort buttons; hidden, they would take focus unseen. */
		.stack.sortable thead {
			display: block;
			position: static;
			width: auto;
			height: auto;
			overflow: visible;
			clip: auto;
		}
		.stack.sortable thead tr {
			display: flex;
			flex-wrap: wrap;
			align-items: center;
			gap: var(--k-space-2);
			border: 0;
			border-radius: 0;
			background: none;
			overflow: visible;
		}
		.stack.sortable th {
			position: absolute;
			width: 1px;
			height: 1px;
			padding: 0;
			overflow: hidden;
			clip: rect(0 0 0 0);
			border: 0;
		}
		.stack.sortable th.sortable {
			position: static;
			display: inline-flex;
			align-items: center;
			width: auto;
			height: auto;
			min-height: max(40px, var(--k-tap-target));
			padding: 0 var(--k-space-3);
			overflow: visible;
			clip: auto;
			border: var(--k-border-w) solid var(--k-line);
			border-radius: var(--k-radius-control);
			background: var(--k-bg-raised);
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
	@media (forced-colors: active) {
		/* Sortable headers are buttons without a box: underline them like links; the arrow keeps its state by shape. */
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
		tbody tr:hover td {
			outline: 1px solid Highlight;
			outline-offset: -1px;
		}
	}
</style>
