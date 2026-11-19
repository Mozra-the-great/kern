<script lang="ts">
	import type { HTMLSelectAttributes } from 'svelte/elements';
	import Field from './Field.svelte';

	export interface SelectOption {
		value: string;
		label: string;
		disabled?: boolean;
	}
	interface Props extends Omit<HTMLSelectAttributes, 'value'> {
		label?: string;
		hint?: string;
		error?: string;
		value?: string;
		options: SelectOption[];
		/** Text of an empty first option. */
		placeholder?: string;
	}
	let { label, hint, error, value = $bindable(''), options, placeholder, id, required, class: cls = '', ...rest }: Props = $props();
	const uid = $props.id();
	const selId = $derived(id ?? `${uid}-select`);
</script>

<Field {label} {hint} {error} {required} for={selId} class={cls}>
	{#snippet children({ describedby, invalid })}
		<div class="k-select" class:invalid>
			<select id={selId} bind:value {required} aria-invalid={invalid || undefined} aria-describedby={describedby} {...rest}>
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
	.k-select { position: relative; display: flex; }
	select {
		appearance: none;
		box-sizing: border-box;
		width: 100%;
		min-height: var(--k-control-h);
		padding: 0 calc(var(--k-space-4) + 24px) 0 var(--k-space-4);
		border: var(--k-border-w) solid var(--k-border);
		border-radius: var(--k-radius-field);
		background: var(--k-bg-raised);
		color: var(--k-fg);
		font: inherit;
		font-size: var(--k-text-md);
		cursor: pointer;
	}
	select:hover { border-color: var(--k-fg-muted); }
	select:focus-visible { outline: var(--k-focus-w) solid var(--k-focus); outline-offset: var(--k-focus-offset); border-color: var(--k-accent-mark); }
	.invalid select { border-color: var(--k-danger); }
	svg { position: absolute; right: var(--k-space-4); top: 50%; width: 16px; height: 16px; transform: translateY(-50%); pointer-events: none; color: var(--k-fg-muted); }
</style>
