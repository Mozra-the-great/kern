<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';
	import Field from './Field.svelte';

	interface Props extends Omit<HTMLInputAttributes, 'value' | 'type' | 'min' | 'max' | 'step' | 'size' | 'required'> {
		label?: string | undefined;
		hint?: string | undefined;
		error?: string | undefined;
		/** Defaults to the middle of the range, snapped to `step`. */
		value?: number | undefined;
		min?: number | undefined;
		max?: number | undefined;
		step?: number | undefined;
		/** Shows the current value next to the slider. */
		showValue?: boolean | undefined;
		/** Formats the value for the display and for screen readers, e.g. `(v) => `${v} %``. */
		format?: ((value: number) => string) | undefined;
	}
	let {
		label,
		hint,
		error,
		value = $bindable(),
		min = 0,
		max = 100,
		step = 1,
		showValue = false,
		format,
		id,
		class: cls = '',
		...rest
	}: Props = $props();
	const uid = $props.id();
	const sliderId = $derived(id ?? `${uid}-slider`);

	function snap(v: number): number {
		const s = step > 0 ? step : 1;
		const snapped = min + Math.round((v - min) / s) * s;
		return Math.min(max, Math.max(min, Number(snapped.toFixed(10))));
	}
	$effect.pre(() => {
		if (value === undefined) value = snap(min + (max - min) / 2);
	});

	const current = $derived(value ?? min);
	const ratio = $derived(max > min ? Math.min(1, Math.max(0, (current - min) / (max - min))) : 0);
	const shown = $derived(format ? format(current) : String(current));
</script>

<Field {label} {hint} {error} for={sliderId} class={cls}>
	{#snippet children({ describedby, invalid })}
		<div class="k-slider" class:invalid>
			<input
				type="range"
				id={sliderId}
				bind:value
				{min}
				{max}
				{step}
				style:--ratio={ratio}
				aria-valuetext={format ? shown : undefined}
				aria-invalid={invalid || undefined}
				aria-describedby={describedby}
				{...rest}
			/>
			{#if showValue}<output class="val" for={sliderId}>{shown}</output>{/if}
		</div>
	{/snippet}
</Field>

<style>
	.k-slider {
		display: flex;
		align-items: center;
		gap: var(--k-space-4);
	}
	input {
		--thumb: 24px;
		--track: 10px;
		--fill: calc(var(--thumb) / 2 + (100% - var(--thumb)) * var(--ratio, 0));
		appearance: none;
		-webkit-appearance: none;
		flex: 1;
		min-width: 0;
		height: var(--k-control-h);
		margin: 0;
		padding: 0;
		border-radius: var(--k-radius-field);
		background: transparent;
		cursor: pointer;
	}
	input:focus-visible {
		outline: var(--k-focus-w) solid var(--k-focus);
		outline-offset: var(--k-focus-offset);
	}
	input:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	input::-webkit-slider-runnable-track {
		box-sizing: border-box;
		height: var(--track);
		border: var(--k-border-w) solid var(--k-border);
		border-radius: var(--k-radius-badge);
		background: linear-gradient(to right, var(--k-accent-mark) var(--fill), var(--k-bg-sunken) var(--fill));
	}
	input::-moz-range-track {
		box-sizing: border-box;
		height: var(--track);
		border: var(--k-border-w) solid var(--k-border);
		border-radius: var(--k-radius-badge);
		background: linear-gradient(to right, var(--k-accent-mark) var(--fill), var(--k-bg-sunken) var(--fill));
	}
	input::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		box-sizing: border-box;
		width: var(--thumb);
		height: var(--thumb);
		margin-top: calc((var(--track) - var(--thumb)) / 2);
		border: 2px solid var(--k-bg-raised);
		border-radius: var(--k-radius-control);
		background: var(--k-primary);
		box-shadow:
			0 0 0 var(--k-border-w) var(--k-primary),
			var(--k-shadow-raised);
		transition: background-color var(--k-dur) var(--k-ease);
	}
	input::-moz-range-thumb {
		box-sizing: border-box;
		width: var(--thumb);
		height: var(--thumb);
		border: 2px solid var(--k-bg-raised);
		border-radius: var(--k-radius-control);
		background: var(--k-primary);
		box-shadow:
			0 0 0 var(--k-border-w) var(--k-primary),
			var(--k-shadow-raised);
		transition: background-color var(--k-dur) var(--k-ease);
	}
	input:hover:not(:disabled)::-webkit-slider-thumb {
		background: var(--k-primary-hover);
	}
	input:hover:not(:disabled)::-moz-range-thumb {
		background: var(--k-primary-hover);
	}
	.invalid input::-webkit-slider-runnable-track {
		border-color: var(--k-danger);
	}
	.invalid input::-moz-range-track {
		border-color: var(--k-danger);
	}

	.val {
		flex: none;
		min-width: 4ch;
		text-align: end;
		font-family: var(--k-font-mono);
		font-size: var(--k-text-sm);
		font-variant-numeric: tabular-nums;
		color: var(--k-fg);
	}
</style>
