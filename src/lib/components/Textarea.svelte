<script lang="ts">
	import type { HTMLTextareaAttributes } from 'svelte/elements';
	import Field from './Field.svelte';
	import { joinIds } from './data-utils.js';

	interface Props extends Omit<HTMLTextareaAttributes, 'value'> {
		label?: string | undefined;
		hint?: string | undefined;
		error?: string | undefined;
		/** Announce the error as `role="alert"` (the default); turn off when the page announces it itself. */
		announce?: boolean | undefined;
		/** Show the hint under the error instead of hiding it (both are referenced, the error first). */
		keepHint?: boolean | undefined;
		value?: string | null | undefined;
		/** Grow with the content (CSS field-sizing where supported). */
		autosize?: boolean | undefined;
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
		rows = 4,
		autosize = false,
		class: cls = '',
		'aria-describedby': ownDescribedby,
		...rest
	}: Props = $props();
	const uid = $props.id();
	const areaId = $derived(id ?? `${uid}-area`);
</script>

<Field {label} {hint} {error} {announce} {keepHint} {required} for={areaId} class={cls}>
	{#snippet children({ describedby, invalid })}
		<textarea
			class="k-textarea"
			class:invalid
			class:autosize
			id={areaId}
			bind:value={() => (value === undefined ? '' : value), (v: string | null) => (value = v)}
			{rows}
			{required}
			aria-invalid={invalid || undefined}
			{...rest}
			aria-describedby={joinIds(describedby, ownDescribedby)}></textarea>
	{/snippet}
</Field>

<style>
	.k-textarea {
		width: 100%;
		box-sizing: border-box;
		padding: var(--k-space-3) var(--k-field-pad-x);
		border: var(--k-border-w) solid var(--k-border);
		border-radius: var(--k-radius-field);
		background: var(--k-field-bg);
		color: var(--k-fg);
		font: inherit;
		font-family: var(--k-field-font);
		font-size: var(--k-field-size);
		/* its own leading, not --k-leading-body: a block of text keeps 1.5 under Code too (stuffcloud's .area) */
		line-height: 1.5;
		/* a JWT, a Base64 blob or a hash breaks at the edge of the box, in every theme (stuffcloud's .area) */
		overflow-wrap: anywhere;
		resize: vertical;
	}
	.k-textarea:hover {
		border-color: var(--k-field-hover-border);
	}
	.k-textarea:focus-visible {
		outline: var(--k-focus-w) solid var(--k-focus);
		outline-offset: var(--k-focus-offset);
		border-color: var(--k-field-focus-border, var(--k-accent-mark));
	}
	.k-textarea:disabled {
		opacity: var(--k-textarea-disabled-opacity);
		cursor: not-allowed;
	}
	.k-textarea::placeholder {
		color: var(--k-fg-muted);
		opacity: 1;
	}
	.invalid {
		border-color: var(--k-danger);
	}
	.autosize {
		field-sizing: content;
		min-height: calc(var(--k-control-h) * 2);
	}
	@media (forced-colors: active) {
		.k-textarea:focus-visible {
			border-color: Highlight;
		}
		.invalid {
			border-style: double;
			border-width: 3px;
		}
		.k-textarea:disabled {
			border-color: GrayText;
			color: GrayText;
		}
		.k-textarea::placeholder {
			color: GrayText;
		}
	}
</style>
