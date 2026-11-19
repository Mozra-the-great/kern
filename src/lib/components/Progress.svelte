<script lang="ts">
	import { normaliseMax, progressValue } from './progress.js';

	interface Props {
		/** 0..max; clamped, NaN and Infinity count as 0. Leave undefined (or null) for an indeterminate bar. */
		value?: number | null | undefined;
		/** Default 100; zero, negative or non-finite values fall back to 100. */
		max?: number | undefined;
		/** Accessible name; also shown above the bar unless `hideLabel`. */
		label: string;
		/** Show the percentage next to the label. */
		showValue?: boolean | undefined;
		/** Keep the label as the accessible name only, without showing it. */
		hideLabel?: boolean | undefined;
		/** `warn` draws the bar in the warning colour, e.g. for storage that is full. */
		tone?: 'default' | 'warn' | undefined;
		/** Spoken instead of the number (`aria-valuetext`), e.g. "3 of 12 files". */
		valueText?: string | undefined;
		class?: string | undefined;
	}
	let { value, max, label, showValue = false, hideLabel = false, tone = 'default', valueText, class: cls = '' }: Props = $props();

	const safeMax = $derived(normaliseMax(max));
	const now = $derived(progressValue(value, max));
	const pct = $derived(now === undefined ? undefined : (now / safeMax) * 100);
	const showHead = $derived(!hideLabel || (showValue && pct !== undefined));
</script>

<div class="k-progress {cls}" data-tone={tone === 'warn' ? 'warn' : undefined}>
	{#if showHead}
		<div class="head">
			{#if !hideLabel}<span class="label">{label}</span>{/if}
			{#if showValue && pct !== undefined}<span class="val">{Math.round(pct)}%</span>{/if}
		</div>
	{/if}
	<div
		class="track"
		role="progressbar"
		aria-label={label}
		aria-valuemin="0"
		aria-valuemax={safeMax}
		aria-valuenow={now}
		aria-valuetext={valueText || undefined}
	>
		<div class="bar" class:indeterminate={pct === undefined} style:width={pct === undefined ? undefined : `${pct}%`}></div>
	</div>
</div>

<style>
	.k-progress {
		--c: var(--k-accent-mark);
		display: grid;
		gap: var(--k-space-2);
	}
	[data-tone='warn'] {
		--c: var(--k-warn);
	}
	.head {
		display: flex;
		justify-content: space-between;
		gap: var(--k-space-2);
		font-family: var(--k-label-font);
		font-size: var(--k-label-size);
		font-weight: var(--k-weight-label);
		text-transform: var(--k-label-transform);
		letter-spacing: var(--k-label-tracking);
	}
	.val {
		margin-inline-start: auto;
		font-family: var(--k-font-mono);
		color: var(--k-fg-muted);
	}
	.track {
		position: relative;
		height: 8px;
		overflow: hidden;
		border-radius: var(--k-radius-badge);
		background: var(--k-bg-sunken);
		border: var(--k-border-w) solid var(--k-line);
	}
	.bar {
		height: 100%;
		background: var(--c);
		border-radius: inherit;
		transition: width calc(var(--k-dur) * 2.5) var(--k-ease);
	}
	/*
	 * Unknown length: stripes half a period wide, painted once on a bar one period wider than the
	 * track that starts one period to the left. The loop moves it by exactly one period with
	 * `transform` only, so it is seamless and runs on the compositor. Themes pick the period, the
	 * loop time and the easing (Code: steps(4), pixel stripes that step along).
	 */
	.indeterminate {
		position: absolute;
		inset-block: 0;
		left: calc(var(--k-progress-period) * -1);
		width: calc(100% + var(--k-progress-period));
		height: auto;
		border-radius: 0;
		background: repeating-linear-gradient(
			90deg,
			var(--c) 0 calc(var(--k-progress-period) / 2),
			transparent calc(var(--k-progress-period) / 2) var(--k-progress-period)
		);
		transition: none;
		animation: k-progress-stripes var(--k-progress-loop) var(--k-progress-ease) infinite;
	}
	@keyframes k-progress-stripes {
		from {
			transform: translateX(0);
		}
		to {
			transform: translateX(var(--k-progress-period));
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.bar {
			transition: none;
		}
		.indeterminate {
			animation: none;
		}
	}
	/* Windows high contrast: system colours, and keep the fill (backgrounds are dropped otherwise). */
	@media (forced-colors: active) {
		.track {
			border: 1px solid CanvasText;
		}
		.bar {
			forced-color-adjust: none;
			background: Highlight;
		}
		.indeterminate {
			background: repeating-linear-gradient(
				90deg,
				Highlight 0 calc(var(--k-progress-period) / 2),
				transparent calc(var(--k-progress-period) / 2) var(--k-progress-period)
			);
		}
	}
</style>
