<script lang="ts">
	import type { HTMLSelectAttributes } from 'svelte/elements';
	import Field from './Field.svelte';
	import { joinIds } from './data-utils.js';

	export interface SelectOption {
		value: string;
		label: string;
		disabled?: boolean | undefined;
	}
	interface Props extends Omit<HTMLSelectAttributes, 'value'> {
		label?: string | undefined;
		hint?: string | undefined;
		error?: string | undefined;
		/** Show the hint under the error instead of hiding it (both are referenced, the error first). */
		keepHint?: boolean | undefined;
		value?: string | undefined;
		options: SelectOption[];
		/** Text of an empty first option. */
		placeholder?: string | undefined;
	}
	let {
		label,
		hint,
		error,
		keepHint,
		value = $bindable(),
		options,
		placeholder,
		id,
		required,
		class: cls = '',
		'aria-describedby': ownDescribedby,
		...rest
	}: Props = $props();
	const uid = $props.id();
	const selId = $derived(id ?? `${uid}-select`);
</script>

<Field {label} {hint} {error} {keepHint} {required} for={selId} class={cls}>
	{#snippet children({ describedby, invalid })}
		<div class="k-select" class:invalid>
			<select
				id={selId}
				bind:value={() => value ?? '', (v: string) => (value = v)}
				{required}
				aria-invalid={invalid || undefined}
				{...rest}
				aria-describedby={joinIds(describedby, ownDescribedby)}
			>
				{#if placeholder}<option value="" disabled={required}>{placeholder}</option>{/if}
				{#each options as o (o.value)}
					<option value={o.value} disabled={o.disabled}>{o.label}</option>
				{/each}
			</select>
			<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" stroke-width="2" /></svg>
		</div>
	{/snippet}
</Field>

<style>
	.k-select {
		position: relative;
		display: flex;
	}
	select {
		appearance: none;
		box-sizing: border-box;
		width: 100%;
		min-height: var(--k-control-h);
		padding: 0 calc(var(--k-field-pad-x) + 24px) 0 var(--k-field-pad-x);
		border: var(--k-border-w) solid var(--k-border);
		border-radius: var(--k-radius-field);
		background: var(--k-select-bg);
		color: var(--k-fg);
		font: inherit;
		font-family: var(--k-field-font);
		font-size: var(--k-field-size);
		cursor: pointer;
	}
	select:hover {
		border-color: var(--k-fg-muted);
	}
	select:focus-visible {
		outline: var(--k-focus-w) solid var(--k-focus);
		outline-offset: var(--k-focus-offset);
		border-color: var(--k-accent-mark);
	}
	.invalid select {
		border-color: var(--k-danger);
	}
	svg {
		position: absolute;
		right: var(--k-field-pad-x);
		top: 50%;
		width: 16px;
		height: 16px;
		transform: translateY(-50%);
		pointer-events: none;
		color: var(--k-fg-muted);
	}
	@media (forced-colors: active) {
		select:focus-visible {
			border-color: Highlight;
		}
		.invalid select {
			border-style: double;
			border-width: 3px;
		}
		select:disabled {
			border-color: GrayText;
			color: GrayText;
		}
		/* The chevron is an SVG with its own authored colour. */
		svg {
			color: ButtonText;
		}
		select:disabled + svg {
			color: GrayText;
		}
	}
</style>
