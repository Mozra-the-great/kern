<script lang="ts">
	interface Props {
		/** 0..max. Leave undefined for an indeterminate bar. */
		value?: number;
		max?: number;
		label: string;
		/** Show the percentage next to the label. */
		showValue?: boolean;
		class?: string;
	}
	let { value, max = 100, label, showValue = false, class: cls = '' }: Props = $props();
	const pct = $derived(value === undefined ? undefined : Math.max(0, Math.min(100, (value / max) * 100)));
</script>

<div class="k-progress {cls}">
	<div class="head">
		<span class="label">{label}</span>
		{#if showValue && pct !== undefined}<span class="val">{Math.round(pct)}%</span>{/if}
	</div>
	<div
		class="track"
		role="progressbar"
		aria-label={label}
		aria-valuemin="0"
		aria-valuemax={max}
		aria-valuenow={value}
	>
		<div class="bar" class:indeterminate={pct === undefined} style:width={pct === undefined ? undefined : `${pct}%`}></div>
	</div>
</div>

<style>
	.k-progress { display: grid; gap: var(--k-space-2); }
	.head { display: flex; justify-content: space-between; font-family: var(--k-label-font); font-size: var(--k-label-size); font-weight: var(--k-weight-label); text-transform: var(--k-label-transform); letter-spacing: var(--k-label-tracking); }
	.val { font-family: var(--k-font-mono); color: var(--k-fg-muted); }
	.track { height: 8px; overflow: hidden; border-radius: var(--k-radius-badge); background: var(--k-bg-sunken); border: var(--k-border-w) solid var(--k-line); }
	.bar { height: 100%; background: var(--k-accent); border-radius: inherit; transition: width 300ms var(--k-ease); }
	.indeterminate { width: 35%; animation: k-slide 1.2s ease-in-out infinite; }
	@keyframes k-slide { from { transform: translateX(-100%); } to { transform: translateX(300%); } }
	@media (prefers-reduced-motion: reduce) { .indeterminate { animation: none; width: 100%; opacity: 0.5; } }
</style>
