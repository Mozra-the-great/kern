<script lang="ts">
	import { formatLocale, strings } from './strings.svelte.js';
	import type { Snippet } from 'svelte';
	import { fill, numberFormat } from './data-utils.js';

	interface Props {
		label: string;
		/** Text is shown as it is, numbers are formatted with `locale`. */
		value: string | number;
		/** Unit after the value, e.g. "ms" or "€". */
		unit?: string | undefined;
		/** Change against the reference period. The sign sets the direction. */
		delta?: number | undefined;
		/** Unit of the change. */
		deltaUnit?: string | undefined;
		/** What the change refers to, e.g. "vs. last week". */
		deltaLabel?: string | undefined;
		/** `false` when a rising number is bad (error rate, latency). */
		positiveIsGood?: boolean | undefined;
		/** Spoken text of the change. {value} is the amount with its unit. */
		upLabel?: string | undefined;
		downLabel?: string | undefined;
		flatLabel?: string | undefined;
		description?: string | undefined;
		/** BCP 47 locale of the numbers and dates. Default: the chosen strings language, else the browser's. */
		locale?: string | undefined;
		/** `raised` = on bg-raised, `sunken` = recessed, `outline` = border only. */
		look?: 'raised' | 'sunken' | 'outline' | undefined;
		/** Small chart below the value, e.g. a Sparkline. */
		spark?: Snippet | undefined;
		class?: string | undefined;
	}
	let {
		label,
		value,
		unit,
		delta,
		deltaUnit = '%',
		deltaLabel,
		positiveIsGood = true,
		upLabel: upLabelProp,
		downLabel: downLabelProp,
		flatLabel: flatLabelProp,
		description,
		locale: localeProp,
		look = 'raised',
		spark,
		class: cls = ''
	}: Props = $props();
	const locale = $derived(formatLocale(localeProp));
	const upLabel = $derived(upLabelProp ?? strings().stat.upLabel);
	const downLabel = $derived(downLabelProp ?? strings().stat.downLabel);
	const flatLabel = $derived(flatLabelProp ?? strings().stat.flatLabel);

	const hasDelta = $derived(typeof delta === 'number' && Number.isFinite(delta));
	const shown = $derived(typeof value === 'number' ? numberFormat(locale).format(value) : value);
	const dir = $derived<'up' | 'down' | 'flat'>(!hasDelta || delta === 0 ? 'flat' : (delta as number) > 0 ? 'up' : 'down');
	const tone = $derived<'good' | 'bad' | 'neutral'>(dir === 'flat' ? 'neutral' : (dir === 'up') === positiveIsGood ? 'good' : 'bad');
	const amount = $derived.by((): string => {
		if (!hasDelta) return '';
		const n = numberFormat(locale, { maximumFractionDigits: 1 }).format(Math.abs(delta as number));
		return deltaUnit ? `${n} ${deltaUnit}` : n;
	});
	const visibleDelta = $derived(dir === 'up' ? `+${amount}` : dir === 'down' ? `−${amount}` : amount);
	const spokenDelta = $derived(
		dir === 'up' ? fill(upLabel, { value: amount }) : dir === 'down' ? fill(downLabel, { value: amount }) : flatLabel
	);
</script>

<div class="k-stat {cls}" data-look={look}>
	<p class="label">{label}</p>
	<p class="value">
		<span class="num">{shown}</span>{#if unit}<span class="unit">{unit}</span>{/if}
	</p>
	{#if hasDelta}
		<p class="change">
			<span class="delta" data-dir={dir} data-tone={tone}>
				<svg viewBox="0 0 16 16" aria-hidden="true">
					{#if dir === 'up'}<path d="M8 13V3.5M3.5 7.5L8 3l4.5 4.5" />{:else if dir === 'down'}<path
							d="M8 3v9.5M3.5 8.5L8 13l4.5-4.5"
						/>{:else}<path d="M3 8h10" />{/if}
				</svg>
				<span aria-hidden="true">{visibleDelta}</span>
				<span class="sr">{spokenDelta}</span>
			</span>
			{#if deltaLabel}<span class="ctx">{deltaLabel}</span>{/if}
		</p>
	{/if}
	{#if description}<p class="desc">{description}</p>{/if}
	{#if spark}<div class="spark">{@render spark()}</div>{/if}
</div>

<style>
	.k-stat {
		display: flex;
		flex-direction: column;
		gap: var(--k-space-2);
		min-width: 0;
		padding: var(--k-space-5) var(--k-space-6);
		border: var(--k-border-w) solid var(--k-line);
		border-radius: var(--k-radius-card);
		background: var(--k-bg-raised);
		color: var(--k-fg);
		box-shadow: var(--k-shadow-raised);
	}
	[data-look='sunken'] {
		background: var(--k-bg-sunken);
		box-shadow: none;
	}
	[data-look='outline'] {
		background: transparent;
		box-shadow: none;
	}
	p {
		margin: 0;
	}
	.label {
		color: var(--k-fg-muted);
		font-family: var(--k-label-font);
		font-size: var(--k-text-xs);
		font-weight: var(--k-weight-label);
		text-transform: var(--k-label-transform);
		letter-spacing: var(--k-label-tracking);
		line-height: 1.4;
	}
	.value {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: var(--k-space-1) var(--k-space-2);
		min-width: 0;
	}
	.num {
		font-family: var(--k-font-display);
		font-size: var(--k-text-xl);
		font-weight: var(--k-weight-display);
		font-variant-numeric: tabular-nums;
		line-height: 1.1;
		overflow-wrap: anywhere;
	}
	.unit {
		color: var(--k-fg-muted);
		font-family: var(--k-font-mono);
		font-size: var(--k-text-sm);
	}
	.change {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--k-space-1) var(--k-space-3);
		font-size: var(--k-text-sm);
	}
	.delta {
		display: inline-flex;
		align-items: center;
		gap: var(--k-space-1);
		color: var(--k-fg-muted);
		font-family: var(--k-font-mono);
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}
	.delta[data-tone='good'] {
		color: var(--k-ok);
	}
	.delta[data-tone='bad'] {
		color: var(--k-danger);
	}
	.delta svg {
		flex: none;
		width: 14px;
		height: 14px;
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
		stroke-linecap: square;
		stroke-linejoin: miter;
	}
	.ctx {
		color: var(--k-fg-muted);
	}
	.desc {
		color: var(--k-fg-muted);
		font-size: var(--k-text-sm);
		line-height: 1.4;
		text-wrap: pretty;
	}
	.spark {
		margin-top: auto;
		padding-top: var(--k-space-2);
		min-width: 0;
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
</style>
