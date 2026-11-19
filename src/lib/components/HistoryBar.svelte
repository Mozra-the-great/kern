<script lang="ts" module>
	export type HistoryStatus = 'ok' | 'warn' | 'down' | 'none';

	export interface HistoryItem {
		/** Name of the period, e.g. a date. Shown in the tooltip and spoken. */
		label: string;
		status: HistoryStatus;
		/** Extra text, e.g. "2 min outage". */
		detail?: string | undefined;
	}
</script>

<script lang="ts">
	import { tick } from 'svelte';
	import { fill, numberFormat, tipAnchor } from './data-utils.js';

	interface Props {
		items: HistoryItem[];
		/** Accessible name of the bars. */
		label: string;
		/** Summary above the bars. Placeholders: {percent} {ok} {total}. */
		summaryLabel?: string | undefined;
		/** Summary when no period has data. */
		noDataLabel?: string | undefined;
		/** Status names for tooltip, speech and legend. */
		statusLabels?: Partial<Record<HistoryStatus, string>> | undefined;
		/** Show the legend that names the four bar shapes. */
		legend?: boolean | undefined;
		/** Text under the first and the last bar, e.g. "90 days ago" and "Today". */
		startLabel?: string | undefined;
		endLabel?: string | undefined;
		/** Locale of the percentage. */
		locale?: string | undefined;
		class?: string | undefined;
	}
	let {
		items,
		label,
		summaryLabel = '{percent} % ok',
		noDataLabel = 'No data',
		statusLabels,
		legend = true,
		startLabel,
		endLabel,
		locale,
		class: cls = ''
	}: Props = $props();
	const uid = $props.id();

	const names = $derived<Record<HistoryStatus, string>>({
		ok: 'OK',
		warn: 'Degraded',
		down: 'Down',
		none: 'No data',
		...statusLabels
	});
	const order: HistoryStatus[] = ['ok', 'warn', 'down', 'none'];

	const summary = $derived.by((): string => {
		const total = items.filter((i) => i.status !== 'none').length;
		if (total === 0) return noDataLabel;
		const ok = items.filter((i) => i.status === 'ok').length;
		// Truncate, so a single failure never rounds up to 100.
		const percent = Math.floor((ok / total) * 1000) / 10;
		return fill(summaryLabel, {
			percent: numberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(percent),
			ok,
			total
		});
	});
	const speak = (it: HistoryItem): string => `${it.label}: ${names[it.status]}${it.detail ? `, ${it.detail}` : ''}`;

	let active = $state<number | null>(null);
	const tabbable = $derived(items.length === 0 ? -1 : Math.min(active ?? items.length - 1, items.length - 1));

	let wrap: HTMLElement | undefined = $state();
	let scroller: HTMLElement | undefined = $state();
	let grid: HTMLElement | undefined = $state();
	let tipEl: HTMLElement | undefined = $state();
	let tip = $state<{ index: number; x: number; y: number } | null>(null);

	// Show the newest period when the bars are wider than their box.
	$effect(() => {
		void items.length;
		if (scroller) scroller.scrollLeft = scroller.scrollWidth;
	});

	async function showTip(index: number) {
		const el = grid?.querySelector<HTMLElement>(`[data-i="${index}"]`);
		if (!el || !wrap) return;
		tip = { index, ...tipAnchor(wrap, el, 0) };
		await tick();
		if (!tip || tip.index !== index || !wrap) return;
		tip = { index, ...tipAnchor(wrap, el, tipEl?.offsetWidth ?? 0) };
	}
	const hideTip = () => (tip = null);
	const indexOf = (target: EventTarget | null): number | null => {
		const el = target instanceof Element ? target.closest<HTMLElement>('[data-i]') : null;
		return el ? Number(el.dataset.i) : null;
	};

	async function focusAt(i: number) {
		const next = Math.max(0, Math.min(items.length - 1, i));
		active = next;
		await tick();
		grid?.querySelector<HTMLElement>(`[data-i="${next}"]`)?.focus();
	}
	function onkeydown(e: KeyboardEvent) {
		if (e.altKey || e.ctrlKey || e.metaKey) return;
		const i = indexOf(e.target);
		if (i === null) return;
		const to =
			e.key === 'ArrowLeft' ? i - 1 : e.key === 'ArrowRight' ? i + 1 : e.key === 'Home' ? 0 : e.key === 'End' ? items.length - 1 : null;
		if (e.key === 'Escape') {
			hideTip();
			return;
		}
		if (to === null) return;
		e.preventDefault();
		void focusAt(to);
	}
	function onfocusin(e: FocusEvent) {
		const i = indexOf(e.target);
		if (i === null) return;
		active = i;
		void showTip(i);
	}
	function onpointerover(e: PointerEvent) {
		const i = indexOf(e.target);
		if (i !== null) void showTip(i);
	}
</script>

<div class="k-history {cls}" bind:this={wrap}>
	<div class="head">
		<p class="summary" id="{uid}-sum">{summary}</p>
		{#if legend}
			<ul class="legend">
				{#each order as s (s)}
					<li><span class="swatch" data-status={s} aria-hidden="true"><span class="fill"></span></span>{names[s]}</li>
				{/each}
			</ul>
		{/if}
	</div>
	<div class="scroll" bind:this={scroller} onscroll={hideTip}>
		<!-- Roving tabindex: the bars take focus, not the grid itself. -->
		<!-- svelte-ignore a11y_interactive_supports_focus -->
		<div
			class="bars"
			role="grid"
			aria-label={label}
			aria-describedby="{uid}-sum"
			bind:this={grid}
			{onkeydown}
			{onfocusin}
			onfocusout={hideTip}
			{onpointerover}
			onpointerleave={hideTip}
		>
			<div class="row" role="row">
				{#each items as it, i (i)}
					<div class="bar" role="gridcell" tabindex={i === tabbable ? 0 : -1} aria-label={speak(it)} data-i={i} data-status={it.status}>
						<span class="fill"></span>
					</div>
				{/each}
			</div>
		</div>
	</div>
	{#if startLabel || endLabel}
		<p class="ends" aria-hidden="true"><span>{startLabel ?? ''}</span><span>{endLabel ?? ''}</span></p>
	{/if}
	{#if tip && items[tip.index]}
		{@const it = items[tip.index]}
		<div class="tip" bind:this={tipEl} aria-hidden="true" style:left="{tip.x}px" style:top="{tip.y}px">
			<strong>{it.label}</strong>
			<span>{names[it.status]}</span>
			{#if it.detail}<span class="detail">{it.detail}</span>{/if}
		</div>
	{/if}
</div>

<style>
	.k-history {
		position: relative;
		display: grid;
		gap: var(--k-space-2);
		min-width: 0;
		color: var(--k-fg);
	}
	.head {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		justify-content: space-between;
		gap: var(--k-space-2) var(--k-space-4);
	}
	.summary {
		margin: 0;
		font-family: var(--k-font-mono);
		font-size: var(--k-text-sm);
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}
	.legend {
		display: flex;
		flex-wrap: wrap;
		gap: var(--k-space-1) var(--k-space-4);
		margin: 0;
		padding: 0;
		list-style: none;
		color: var(--k-fg-muted);
		font-family: var(--k-label-font);
		font-size: var(--k-text-xs);
		text-transform: var(--k-label-transform);
		letter-spacing: var(--k-label-tracking);
	}
	.legend li {
		display: inline-flex;
		align-items: center;
		gap: var(--k-space-2);
	}
	.scroll {
		overflow-x: auto;
		padding: 3px;
		margin: -3px;
	}
	.bars {
		width: max-content;
		min-width: 100%;
	}
	.row {
		--h: 36px;
		display: flex;
		align-items: stretch;
		gap: 2px;
		height: var(--h);
	}
	.bar {
		display: flex;
		align-items: flex-end;
		flex: 1 1 0;
		min-width: 5px;
		max-width: 18px;
		cursor: default;
	}
	.bar:focus-visible {
		outline: var(--k-focus-w) solid var(--k-focus);
		outline-offset: 1px;
		position: relative;
		z-index: 1;
	}
	.fill {
		--c: var(--k-ok);
		display: block;
		width: 100%;
		height: 100%;
		border-radius: min(var(--k-radius-badge), 2px);
		background: var(--c);
	}
	[data-status='warn'] > .fill {
		--c: var(--k-warn);
		height: 60%;
	}
	[data-status='down'] > .fill {
		--c: var(--k-danger);
		border: 1px solid var(--c);
		background: repeating-linear-gradient(135deg, var(--c) 0 2px, color-mix(in srgb, var(--c) 18%, var(--k-bg-raised)) 2px 4px);
	}
	[data-status='none'] > .fill {
		--c: var(--k-border);
		background: transparent;
		border: 1px solid var(--c);
	}
	.bar:hover > .fill {
		filter: brightness(1.15);
	}
	.ends {
		display: flex;
		justify-content: space-between;
		gap: var(--k-space-4);
		margin: 0;
		color: var(--k-fg-muted);
		font-size: var(--k-text-xs);
	}
	.swatch {
		display: inline-flex;
		width: 8px;
		height: 16px;
		align-items: flex-end;
		flex: none;
	}
	.swatch[data-status='warn'] .fill {
		height: 60%;
	}
	.tip {
		position: absolute;
		z-index: 900;
		display: grid;
		gap: 2px;
		width: max-content;
		max-width: calc(100% - 8px);
		padding: var(--k-space-1) var(--k-space-2);
		border-radius: min(var(--k-radius-field), 8px);
		background: var(--k-fg);
		color: var(--k-bg);
		font-size: var(--k-text-xs);
		line-height: 1.4;
		pointer-events: none;
		transform: translate(-50%, calc(-100% - 6px));
	}
	.tip strong {
		font-weight: 700;
	}
	.tip .detail {
		opacity: 0.85;
	}
</style>
