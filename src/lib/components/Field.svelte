<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ClassValue } from 'svelte/elements';
	import { joinIds } from './data-utils.js';

	/** What a Field hands to its control. */
	export interface FieldControlProps {
		/** Ids for `aria-describedby`: the error first, then the hint; `undefined` when neither is shown. */
		describedby: string | undefined;
		/** True while there is an error: set `aria-invalid` on the control. */
		invalid: boolean;
		/** The Field's `required`: set it (or `aria-required`) on the control, the visible marker is `aria-hidden`. */
		required: boolean;
	}

	interface Props {
		/** Visible label. */
		label?: string | undefined;
		/** Help text under the control. */
		hint?: string | undefined;
		/**
		 * Error text. Marks the control invalid and replaces the hint (unless `keepHint`). It is a
		 * `role="alert"` paragraph: announced once when it appears or its text changes, not on re-render.
		 */
		error?: string | undefined;
		/** Show the hint under the error instead of hiding it; both are referenced, the error first. */
		keepHint?: boolean | undefined;
		/** Announce the error (`role="alert"`). Turn off when the control announces it itself. */
		announce?: boolean | undefined;
		required?: boolean | null | undefined;
		/** Id of the control the label points to. */
		for?: string | undefined;
		/** Id of the label element, for controls named with `aria-labelledby` (groups). */
		labelId?: string | undefined;
		class?: ClassValue | null | undefined;
		/** Receives the ids for aria-describedby, the invalid state and `required`. */
		children: Snippet<[FieldControlProps]>;
	}
	let {
		label,
		hint,
		error,
		keepHint = false,
		announce = true,
		required = false,
		for: forId,
		labelId,
		class: cls = '',
		children
	}: Props = $props();
	const uid = $props.id();
	const errorId = `${uid}-error`;
	const hintId = `${uid}-hint`;
	const hasError = $derived(!!error);
	const showHint = $derived(!!hint && (!hasError || keepHint));
	const describedby = $derived(joinIds(hasError ? errorId : undefined, showHint ? hintId : undefined));
</script>

<div class="k-field {cls}" class:invalid={hasError}>
	{#if label}
		<label class="label" for={forId} id={labelId}>
			{label}{#if required}<span class="req" aria-hidden="true"> *</span>{/if}
		</label>
	{/if}
	{@render children({ describedby, invalid: hasError, required: !!required })}
	{#if hasError}
		<p class="desc error" id={errorId} role={announce ? 'alert' : undefined}>
			<svg viewBox="0 0 16 16" aria-hidden="true">
				<circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" stroke-width="1.6" /><path
					d="M8 4.5v4.2M8 10.8v.7"
					stroke="currentColor"
					stroke-width="1.8"
				/>
			</svg>
			{error}
		</p>
	{/if}
	{#if showHint}
		<p class="desc" id={hintId}>{hint}</p>
	{/if}
</div>

<style>
	.k-field {
		display: grid;
		gap: var(--k-space-2);
		align-content: start;
		min-width: 0;
	}
	.label {
		font-family: var(--k-label-font);
		font-size: var(--k-label-size);
		font-weight: var(--k-weight-label);
		text-transform: var(--k-label-transform);
		letter-spacing: var(--k-label-tracking);
		color: var(--k-fg);
	}
	.req {
		color: var(--k-danger);
	}
	.desc {
		margin: 0;
		font-size: var(--k-text-sm);
		color: var(--k-fg-hint);
		line-height: 1.4;
	}
	.error {
		display: flex;
		gap: var(--k-space-2);
		align-items: flex-start;
		color: var(--k-danger);
	}
	.error svg {
		flex: none;
		width: 16px;
		height: 16px;
		margin-top: 1px;
	}
</style>
