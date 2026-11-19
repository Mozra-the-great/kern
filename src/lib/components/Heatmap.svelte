<script lang="ts" module>
	export interface HeatmapDatum {
		/** ISO date `yyyy-mm-dd` (a time part is ignored). Several entries of one day add up. */
		date: string;
		value: number;
	}
</script>

<script lang="ts">
	import { formatLocale, strings } from './strings.svelte.js';
	import { tick } from 'svelte';
	import { dateFormat, fill, numberFormat, tipAnchor } from './data-utils.js';

	interface Props {
		data: HeatmapDatum[];
		/** Accessible name of the grid. */
		label: string;
		/** First day of the range, ISO. Default: the earliest date in `data`. */
		start?: string | undefined;
		/** Last day of the range, ISO. Default: the latest date in `data`. */
		end?: string | undefined;
		/** First weekday row: 0 = Sunday … 6 = Saturday. */
		weekStart?: number | undefined;
		/** Locale of month names, weekday names, dates and numbers. Default: the chosen strings language, else the browser's. */
		locale?: string | undefined;
		/** Value of the darkest step. Default: the largest value in the range. */
		max?: number | undefined;
		/** Text of a cell. Placeholders: {date} {value}. Shown on hover or focus and spoken. */
		cellLabel?: string | undefined;
		legend?: boolean | undefined;
		lessLabel?: string | undefined;
		moreLabel?: string | undefined;
		/** Shown when there is no date range at all. */
		emptyLabel?: string | undefined;
		/** Edge length of a cell in pixels. */
		cellSize?: number | undefined;
		/** Called on Enter, Space or click on a day. */
		onselect?: ((detail: { date: string; value: number }) => void) | undefined;
		class?: string | undefined;
	}
	let {
		data,
		label,
		start,
		end,
		weekStart = 1,
		locale: localeProp,
		max,
		cellLabel: cellLabelProp,
		legend = true,
		lessLabel: lessLabelProp,
		moreLabel: moreLabelProp,
		emptyLabel: emptyLabelProp,
		cellSize = 16,
		onselect,
		class: cls = ''
	}: Props = $props();
	const locale = $derived(formatLocale(localeProp));
	const cellLabel = $derived(cellLabelProp ?? strings().heatmap.cellLabel);
	const lessLabel = $derived(lessLabelProp ?? strings().heatmap.lessLabel);
	const moreLabel = $derived(moreLabelProp ?? strings().heatmap.moreLabel);
	const emptyLabel = $derived(emptyLabelProp ?? strings().heatmap.emptyLabel);

	const DAY = 86_400_000;
	const MAX_DAYS = 3660;
	const LEVELS = [0, 1, 2, 3, 4] as const;

	function parseDay(s: string | undefined): number | null {
		const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s ?? '');
		if (!m) return null;
		const ms = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
		return new Date(ms).getUTCMonth() === Number(m[2]) - 1 ? Math.floor(ms / DAY) : null;
	}
	const toIso = (day: number): string => new Date(day * DAY).toISOString().slice(0, 10);
	/** 1970-01-01 was a Thursday. 0 = Sunday. */
	const weekday = (day: number): number => (((day + 4) % 7) + 7) % 7;

	const sums = $derived.by((): Map<number, number> => {
		const map = new Map<number, number>();
		for (const d of data ?? []) {
			const day = parseDay(d.date);
			if (day === null || !Number.isFinite(d.value)) continue;
			map.set(day, (map.get(day) ?? 0) + d.value);
		}
		return map;
	});

	const span = $derived.by((): { from: number; to: number } | null => {
		const days = [...sums.keys()];
		let from = parseDay(start) ?? (days.length ? Math.min(...days) : null);
		let to = parseDay(end) ?? (days.length ? Math.max(...days) : null);
		if (from === null || to === null) return null;
		if (from > to) [from, to] = [to, from];
		return { from: Math.max(from, to - MAX_DAYS + 1), to };
	});

	const first = $derived((((weekday(span?.from ?? 0) - (Math.floor(weekStart) || 0)) % 7) + 7) % 7);
	const gridStart = $derived((span?.from ?? 0) - first);
	const cols = $derived(span ? Math.floor((span.to - gridStart) / 7) + 1 : 0);
	const lastRow = $derived(span ? (span.to - gridStart) % 7 : 0);
	const dayAt = (c: number, r: number): number => gridStart + c * 7 + r;
	const inRange = (day: number): boolean => !!span && day >= span.from && day <= span.to;

	const nf = $derived(numberFormat(locale));
	const topValue = $derived.by((): number => {
		if (typeof max === 'number' && max > 0) return max;
		let top = 0;
		if (span) for (const [day, v] of sums) if (inRange(day) && v > top) top = v;
		return top;
	});
	const levelOf = (v: number): number => (v <= 0 || topValue <= 0 ? 0 : Math.max(1, Math.min(4, Math.ceil((v / topValue) * 4))));

	interface Cell {
		day: number;
		iso: string;
		value: number;
		level: number;
		text: string;
	}
	const cells = $derived.by((): Map<number, Cell> => {
		const map = new Map<number, Cell>();
		if (!span) return map;
		const fmt = dateFormat(locale, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
		for (let day = span.from; day <= span.to; day++) {
			const value = sums.get(day) ?? 0;
			map.set(day, {
				day,
				iso: toIso(day),
				value,
				level: levelOf(value),
				text: fill(cellLabel, { date: fmt.format(new Date(day * DAY)), value: nf.format(value) })
			});
		}
		return map;
	});

	const rowIdx = [0, 1, 2, 3, 4, 5, 6];
	const colIdx = $derived(Array.from({ length: cols }, (_, i) => i));
	const weekdayNames = $derived.by((): string[] => {
		const fmt = dateFormat(locale, { weekday: 'short', timeZone: 'UTC' });
		return rowIdx.map((r) => (r % 2 === 0 && r < 6 ? fmt.format(new Date(dayAt(0, r) * DAY)) : ''));
	});
	const months = $derived.by((): { col: number; text: string }[] => {
		if (!span) return [];
		const fmt = dateFormat(locale, { month: 'short', timeZone: 'UTC' });
		const out: { col: number; text: string }[] = [];
		let prev = -1;
		for (let c = 0; c < cols; c++) {
			const day = Math.max(dayAt(c, 0), span.from);
			const m = new Date(day * DAY).getUTCMonth();
			if (m !== prev) out.push({ col: c, text: fmt.format(new Date(day * DAY)) });
			prev = m;
		}
		// A first month that is cut off after less than three weeks has no room for its name.
		if (out.length > 1 && out[1].col - out[0].col < 3) out.shift();
		return out;
	});

	let activeDay = $state<number | null>(null);
	const tabbable = $derived(span ? Math.min(span.to, Math.max(span.from, activeDay ?? span.to)) : null);

	let wrap: HTMLElement | undefined = $state();
	let scroller: HTMLElement | undefined = $state();
	let grid: HTMLElement | undefined = $state();
	let tipEl: HTMLElement | undefined = $state();
	let tip = $state<{ day: number; x: number; y: number } | null>(null);

	// Start at the newest week when the grid is wider than its box.
	$effect(() => {
		void cols;
		if (scroller) scroller.scrollLeft = scroller.scrollWidth;
	});

	const cellEl = (day: number): HTMLElement | null | undefined => grid?.querySelector<HTMLElement>(`[data-day="${day}"]`);
	async function showTip(day: number) {
		const el = cellEl(day);
		if (!el || !wrap) return;
		tip = { day, ...tipAnchor(wrap, el, 0) };
		await tick();
		if (!tip || tip.day !== day || !wrap) return;
		tip = { day, ...tipAnchor(wrap, el, tipEl?.offsetWidth ?? 0) };
	}
	const hideTip = () => (tip = null);
	const dayOf = (target: EventTarget | null): number | null => {
		const el = target instanceof Element ? target.closest<HTMLElement>('[data-day]') : null;
		return el ? Number(el.dataset.day) : null;
	};

	async function focusDay(day: number) {
		activeDay = day;
		await tick();
		cellEl(day)?.focus();
	}
	/** The cell a key moves to; stays inside the range, never wraps. */
	function target(day: number, key: string, ctrl: boolean): number | null {
		if (!span) return null;
		const rel = day - gridStart;
		let c = Math.floor(rel / 7);
		let r = rel % 7;
		if (key === 'ArrowLeft') c -= 1;
		else if (key === 'ArrowRight') c += 1;
		else if (key === 'ArrowUp') r -= 1;
		else if (key === 'ArrowDown') r += 1;
		else if (key === 'Home') {
			if (ctrl) return span.from;
			c = 0;
		} else if (key === 'End') {
			if (ctrl) return span.to;
			c = cols - 1;
		} else return null;
		c = Math.max(0, Math.min(cols - 1, c));
		r = Math.max(c === 0 ? first : 0, Math.min(c === cols - 1 ? lastRow : 6, r));
		return dayAt(c, r);
	}
	function pick(day: number) {
		const cell = cells.get(day);
		if (cell) onselect?.({ date: cell.iso, value: cell.value });
	}
	function onkeydown(e: KeyboardEvent) {
		const day = dayOf(e.target);
		if (day === null) return;
		if (e.key === 'Escape') {
			hideTip();
			return;
		}
		if (e.altKey || e.metaKey) return;
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			pick(day);
			return;
		}
		const to = target(day, e.key, e.ctrlKey);
		if (to === null) return;
		e.preventDefault();
		void focusDay(to);
	}
	function onclick(e: MouseEvent) {
		const day = dayOf(e.target);
		if (day !== null) pick(day);
	}
	function onfocusin(e: FocusEvent) {
		const day = dayOf(e.target);
		if (day === null) return;
		activeDay = day;
		void showTip(day);
	}
	function onpointerover(e: PointerEvent) {
		const day = dayOf(e.target);
		if (day !== null) void showTip(day);
	}
</script>

<div class="k-heatmap {cls}" bind:this={wrap} style:--cell="{Math.max(8, cellSize)}px">
	{#if !span}
		<p class="empty">{emptyLabel}</p>
	{:else}
		<div class="scroll" bind:this={scroller} onscroll={hideTip}>
			<div class="months" aria-hidden="true" style:--cols={cols}>
				<span class="lead"></span>
				{#each months as m (m.col)}
					<span class="month" style:grid-column={m.col + 2}>{m.text}</span>
				{/each}
			</div>
			<!-- Roving tabindex: the cells take focus, not the grid itself. -->
			<!-- svelte-ignore a11y_interactive_supports_focus -->
			<div
				class="grid"
				role="grid"
				aria-label={label}
				bind:this={grid}
				{onkeydown}
				{onclick}
				{onfocusin}
				onfocusout={hideTip}
				{onpointerover}
				onpointerleave={hideTip}
			>
				{#each rowIdx as r (r)}
					<div class="row" role="row" style:--cols={cols}>
						<span class="lead" aria-hidden="true">{weekdayNames[r]}</span>
						{#each colIdx as c (c)}
							{@const day = dayAt(c, r)}
							{@const cell = cells.get(day)}
							{#if cell && inRange(day)}
								<div
									class="cell"
									role="gridcell"
									data-day={day}
									data-level={cell.level}
									tabindex={day === tabbable ? 0 : -1}
									aria-label={cell.text}
								></div>
							{:else}
								<div class="cell pad" role="gridcell" aria-hidden="true"></div>
							{/if}
						{/each}
					</div>
				{/each}
			</div>
		</div>
		{#if legend}
			<div class="legend" aria-hidden="true">
				<span>{lessLabel}</span>
				{#each LEVELS as l (l)}<span class="cell sw" data-level={l}></span>{/each}
				<span>{moreLabel}</span>
			</div>
		{/if}
		{#if tip}
			{@const cell = cells.get(tip.day)}
			{#if cell}
				<div class="tip" bind:this={tipEl} aria-hidden="true" style:left="{tip.x}px" style:top="{tip.y}px">{cell.text}</div>
			{/if}
		{/if}
	{/if}
</div>

<style>
	.k-heatmap {
		--gap: 3px;
		--lead: 54px;
		position: relative;
		display: grid;
		gap: var(--k-space-2);
		min-width: 0;
		color: var(--k-fg);
	}
	.scroll {
		overflow-x: auto;
		padding: var(--k-space-3) var(--k-space-4) var(--k-space-3) 0;
		border: var(--k-border-w) solid var(--k-line);
		border-radius: min(var(--k-radius-card), 20px);
		background: var(--k-bg-raised);
	}
	.months,
	.grid {
		width: max-content;
	}
	.months,
	.row {
		display: grid;
		grid-template-columns: var(--lead) repeat(var(--cols), var(--cell));
		column-gap: var(--gap);
	}
	.grid {
		display: grid;
		row-gap: var(--gap);
		margin-top: var(--gap);
	}
	.lead {
		position: sticky;
		left: 0;
		z-index: 2;
		box-sizing: border-box;
		padding-left: var(--k-space-4);
		display: flex;
		align-items: center;
		background: var(--k-bg-raised);
		color: var(--k-fg-muted);
		font-family: var(--k-label-font);
		font-size: var(--k-text-xs);
		text-transform: var(--k-label-transform);
		letter-spacing: var(--k-label-tracking);
		line-height: 1;
	}
	.months .lead {
		height: 1px;
	}
	.month {
		grid-row: 1;
		justify-self: start;
		color: var(--k-fg-muted);
		font-family: var(--k-label-font);
		font-size: var(--k-text-xs);
		text-transform: var(--k-label-transform);
		letter-spacing: var(--k-label-tracking);
		line-height: 1;
		white-space: nowrap;
	}
	.months {
		height: 14px;
		align-items: end;
	}
	.cell {
		--bg: var(--k-bg-sunken);
		width: var(--cell);
		height: var(--cell);
		border-radius: min(var(--k-radius-badge), 3px);
		background: var(--bg);
		box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--k-fg) 16%, transparent);
	}
	[data-level='1'] {
		--bg: color-mix(in srgb, var(--k-accent) 30%, var(--k-bg-sunken));
	}
	[data-level='2'] {
		--bg: color-mix(in srgb, var(--k-accent) 55%, var(--k-bg-sunken));
	}
	[data-level='3'] {
		--bg: color-mix(in srgb, var(--k-accent) 78%, var(--k-bg-sunken));
	}
	[data-level='4'] {
		--bg: var(--k-accent);
	}
	.pad {
		visibility: hidden;
	}
	div.cell[data-day] {
		cursor: pointer;
	}
	div.cell[data-day]:hover {
		box-shadow: inset 0 0 0 2px var(--k-fg);
	}
	.cell:focus-visible {
		outline: var(--k-focus-w) solid var(--k-focus);
		outline-offset: 1px;
		position: relative;
		z-index: 1;
	}
	.legend {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: var(--k-space-1);
		color: var(--k-fg-muted);
		font-family: var(--k-label-font);
		font-size: var(--k-text-xs);
		text-transform: var(--k-label-transform);
		letter-spacing: var(--k-label-tracking);
	}
	.legend span:first-child {
		margin-right: var(--k-space-1);
	}
	.legend span:last-child {
		margin-left: var(--k-space-1);
	}
	.sw {
		width: 12px;
		height: 12px;
	}
	.empty {
		margin: 0;
		padding: var(--k-space-6);
		border: var(--k-border-w) dashed var(--k-line);
		border-radius: var(--k-radius-card);
		color: var(--k-fg-muted);
		text-align: center;
	}
	.tip {
		position: absolute;
		z-index: 900;
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
</style>
