<script lang="ts">
	import { strings } from './strings.svelte.js';
	import type { Snippet } from 'svelte';

	interface Props {
		/** 0..max. `null` or undefined shows an indeterminate ring. */
		value?: number | null | undefined;
		max?: number | undefined;
		/** Accessible name, e.g. "Upload". */
		label: string;
		/** Outer diameter in px. */
		size?: number | undefined;
		/** Stroke width in px. */
		thickness?: number | undefined;
		/** Shows the percentage in the centre (needs a ring of about 48 px or more). */
		showValue?: boolean | undefined;
		/** Replaces the spoken value, e.g. "3 of 5 files". Default: the percentage. */
		valueText?: string | undefined;
		/** Formats the percentage for the centre and for screen readers. */
		format?: ((percent: number) => string) | undefined;
		/** Text for the indeterminate state: spoken, and shown in the centre under reduced motion. */
		loadingText?: string | undefined;
		class?: string | undefined;
		/** Content for the centre. Screen readers get `valueText` instead. */
		children?: Snippet | undefined;
	}
	let {
		value = null,
		max = 100,
		label,
		size = 64,
		thickness = 6,
		showValue = false,
		valueText,
		format,
		loadingText: loadingTextProp,
		class: cls = '',
		children
	}: Props = $props();
	const loadingText = $derived(loadingTextProp ?? strings().progressRing.loadingText);

	const span = $derived(max > 0 ? max : 100);
	const dim = $derived(Math.max(16, size));
	const stroke = $derived(Math.max(1, Math.min(thickness, dim / 2)));
	const radius = $derived((dim - stroke) / 2);
	const circumference = $derived(2 * Math.PI * radius);
	const now = $derived(value === null || value === undefined || Number.isNaN(value) ? undefined : Math.max(0, Math.min(span, value)));
	const pct = $derived(now === undefined ? undefined : (now / span) * 100);
	const percentText = $derived(pct === undefined ? '' : format ? format(pct) : `${Math.round(pct)}%`);
	const inner = $derived(dim - 2 * stroke);
	/** The word "Loading" only fits inside a ring with enough room. */
	const roomForText = $derived(inner >= 48);
</script>

<div
	class="k-progress-ring {cls}"
	class:indeterminate={pct === undefined}
	role="progressbar"
	aria-label={label}
	aria-valuemin="0"
	aria-valuemax={span}
	aria-valuenow={now}
	aria-valuetext={pct === undefined ? loadingText : (valueText ?? percentText)}
	style:--size="{dim}px"
	style:--value-size="{Math.max(11, Math.min(28, inner * 0.3))}px"
>
	<svg class="svg" viewBox="0 0 {dim} {dim}" width={dim} height={dim} aria-hidden="true" focusable="false">
		<circle class="track" cx={dim / 2} cy={dim / 2} r={radius} fill="none" stroke-width={stroke} />
		<circle
			class="arc"
			cx={dim / 2}
			cy={dim / 2}
			r={radius}
			fill="none"
			stroke-width={stroke}
			transform="rotate(-90 {dim / 2} {dim / 2})"
			stroke-dasharray={pct === undefined ? `${circumference * 0.28} ${circumference}` : circumference}
			stroke-dashoffset={pct === undefined ? 0 : circumference * (1 - pct / 100)}
		/>
	</svg>
	<div class="centre" aria-hidden="true">
		{#if children}
			{@render children()}
		{:else if pct === undefined}
			<span class="loading" class:fits={roomForText}>{loadingText}</span>
		{:else if showValue}
			<span class="val">{percentText}</span>
		{/if}
	</div>
</div>

<style>
	.k-progress-ring {
		position: relative;
		display: inline-grid;
		flex: none;
		width: var(--size);
		height: var(--size);
		color: var(--k-accent-text);
	}
	.svg {
		display: block;
		width: 100%;
		height: 100%;
		overflow: visible;
	}
	.track {
		stroke: var(--k-line);
	}
	.arc {
		stroke: currentColor;
		transition: stroke-dashoffset calc(var(--k-dur) * 2.5) var(--k-ease);
	}
	.indeterminate .svg {
		animation: k-ring-spin 1s linear infinite;
	}
	.centre {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
		padding: calc(var(--size) * 0.14);
		box-sizing: border-box;
		color: var(--k-fg);
		text-align: center;
		line-height: 1.1;
		overflow: hidden;
	}
	.val {
		font-family: var(--k-font-mono);
		font-size: var(--value-size);
		font-weight: 500;
		font-variant-numeric: tabular-nums;
	}
	.loading {
		display: none;
		font-family: var(--k-font-sans);
		font-size: max(10px, calc(var(--value-size) * 0.7));
		font-weight: 600;
	}
	@keyframes k-ring-spin {
		to {
			transform: rotate(360deg);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.arc {
			transition: none;
		}
		.indeterminate .svg {
			animation: none;
		}
		.loading.fits {
			display: block;
		}
	}
	@media (forced-colors: active) {
		.track {
			stroke: GrayText;
		}
		.arc {
			stroke: Highlight;
		}
	}
</style>
