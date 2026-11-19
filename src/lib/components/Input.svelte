<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLInputAttributes } from 'svelte/elements';
	import Field from './Field.svelte';

	interface Props extends Omit<HTMLInputAttributes, 'value'> {
		label?: string | undefined;
		hint?: string | undefined;
		error?: string | undefined;
		value?: string | number | null | undefined;
		/** Content inside the field before the text, e.g. an icon. */
		leading?: Snippet | undefined;
		/** Content inside the field after the text, e.g. a unit or button. */
		trailing?: Snippet | undefined;
	}
	let { label, hint, error, value = $bindable(), id, required, class: cls = '', leading, trailing, ...rest }: Props = $props();
	const uid = $props.id();
	const inputId = $derived(id ?? `${uid}-input`);
</script>

<Field {label} {hint} {error} {required} for={inputId} class={cls}>
	{#snippet children({ describedby, invalid })}
		<div class="k-input" class:invalid>
			{#if leading}<span class="adorn">{@render leading()}</span>{/if}
			<input
				id={inputId}
				bind:value={() => (value === undefined ? '' : value), (v: string | number | null) => (value = v)}
				{required}
				aria-invalid={invalid || undefined}
				aria-describedby={describedby}
				{...rest}
			/>
			{#if trailing}<span class="adorn">{@render trailing()}</span>{/if}
		</div>
	{/snippet}
</Field>

<style>
	.k-input {
		display: flex;
		box-sizing: border-box;
		align-items: center;
		gap: var(--k-space-2);
		min-height: var(--k-control-h);
		padding: 0 var(--k-space-4);
		border: var(--k-border-w) solid var(--k-border);
		border-radius: var(--k-radius-field);
		background: var(--k-bg-raised);
		color: var(--k-fg);
		transition: border-color var(--k-dur) var(--k-ease);
	}
	.k-input:hover {
		border-color: var(--k-fg-muted);
	}
	.k-input:focus-within {
		outline: var(--k-focus-w) solid var(--k-focus);
		outline-offset: var(--k-focus-offset);
		border-color: var(--k-accent-mark);
	}
	.invalid {
		border-color: var(--k-danger);
	}
	input {
		flex: 1;
		min-width: 0;
		height: 100%;
		min-height: var(--k-control-h);
		margin-block: calc(var(--k-border-w) * -1);
		padding: 0;
		border: 0;
		outline: 0;
		background: transparent;
		color: inherit;
		font: inherit;
		font-size: var(--k-text-md);
	}
	input::placeholder {
		color: var(--k-fg-muted);
		opacity: 1;
	}
	input:disabled {
		cursor: not-allowed;
	}
	.k-input:has(input:disabled) {
		opacity: 0.55;
	}
	.adorn {
		display: inline-flex;
		align-items: center;
		color: var(--k-fg-muted);
	}
	.adorn :global(svg) {
		width: 18px;
		height: 18px;
	}
</style>
