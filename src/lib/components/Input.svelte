<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLInputAttributes } from 'svelte/elements';
	import Field from './Field.svelte';
	import { joinIds } from './data-utils.js';

	interface Props extends Omit<HTMLInputAttributes, 'value'> {
		label?: string | undefined;
		hint?: string | undefined;
		error?: string | undefined;
		/** Announce the error as `role="alert"` (the default); turn off when the page announces it itself. */
		announce?: boolean | undefined;
		/** Show the hint under the error instead of hiding it (both are referenced, the error first). */
		keepHint?: boolean | undefined;
		value?: string | number | null | undefined;
		/** Content inside the field before the text, e.g. an icon. */
		leading?: Snippet | undefined;
		/** Content inside the field after the text, e.g. a unit or button. */
		trailing?: Snippet | undefined;
	}
	let {
		label,
		hint,
		error,
		announce,
		keepHint,
		value = $bindable(),
		id,
		required,
		class: cls = '',
		leading,
		trailing,
		'aria-describedby': ownDescribedby,
		...rest
	}: Props = $props();
	const uid = $props.id();
	const inputId = $derived(id ?? `${uid}-input`);
</script>

<Field {label} {hint} {error} {announce} {keepHint} {required} for={inputId} class={cls}>
	{#snippet children({ describedby, invalid })}
		<div class="k-input" class:invalid>
			{#if leading}<span class="adorn">{@render leading()}</span>{/if}
			<input
				id={inputId}
				bind:value={() => (value === undefined ? '' : value), (v: string | number | null) => (value = v)}
				{required}
				aria-invalid={invalid || undefined}
				{...rest}
				aria-describedby={joinIds(describedby, ownDescribedby)}
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
		padding: 0 var(--k-field-pad-x);
		border: var(--k-border-w) solid var(--k-border);
		border-radius: var(--k-radius-field);
		background: var(--k-field-bg);
		color: var(--k-fg);
		transition: border-color var(--k-dur) var(--k-ease);
	}
	.k-input:hover {
		border-color: var(--k-field-hover-border);
	}
	.k-input:focus-within {
		outline: var(--k-focus-w) solid var(--k-focus);
		outline-offset: var(--k-focus-offset);
		border-color: var(--k-field-focus-border, var(--k-accent-mark));
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
		font-family: var(--k-field-font);
		font-size: var(--k-field-size);
	}
	input::placeholder {
		color: var(--k-fg-muted);
		opacity: 1;
	}
	input:disabled {
		cursor: not-allowed;
	}
	.k-input:has(input:disabled) {
		opacity: var(--k-field-disabled-opacity);
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
	@media (forced-colors: active) {
		.k-input:focus-within {
			border-color: Highlight;
		}
		/* Invalid: a double edge as well as the red one (which is dropped). */
		.invalid {
			border-style: double;
			border-width: 3px;
		}
		.k-input:has(input:disabled) {
			border-color: GrayText;
			color: GrayText;
		}
		input::placeholder {
			color: GrayText;
		}
		.adorn {
			color: CanvasText;
		}
	}
</style>
