<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ClassValue } from 'svelte/elements';

	interface Props {
		/** Visible label. */
		label?: string;
		/** Help text under the control. */
		hint?: string;
		/** Error text. Replaces the hint and marks the control invalid. */
		error?: string;
		required?: boolean | null;
		/** Id of the control the label points to. */
		for?: string;
		class?: ClassValue | null;
		/** Receives the ids for aria-describedby. */
		children: Snippet<[{ describedby: string | undefined; invalid: boolean }]>;
	}
	let { label, hint, error, required = false, for: forId, class: cls = '', children }: Props = $props();
	const uid = $props.id();
	const descId = $derived(error || hint ? `${uid}-desc` : undefined);
</script>

<div class="k-field {cls}" class:invalid={!!error}>
	{#if label}
		<label class="label" for={forId}>
			{label}{#if required}<span class="req" aria-hidden="true"> *</span>{/if}
		</label>
	{/if}
	{@render children({ describedby: descId, invalid: !!error })}
	{#if error}
		<p class="desc error" id={descId}>
			<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" stroke-width="1.6" /><path d="M8 4.5v4.2M8 10.8v.7" stroke="currentColor" stroke-width="1.8" /></svg>
			{error}
		</p>
	{:else if hint}
		<p class="desc" id={descId}>{hint}</p>
	{/if}
</div>

<style>
	.k-field { display: grid; gap: var(--k-space-2); align-content: start; min-width: 0; }
	.label {
		font-family: var(--k-label-font);
		font-size: var(--k-label-size);
		font-weight: var(--k-weight-label);
		text-transform: var(--k-label-transform);
		letter-spacing: var(--k-label-tracking);
		color: var(--k-fg);
	}
	.req { color: var(--k-danger); }
	.desc { margin: 0; font-size: var(--k-text-sm); color: var(--k-fg-muted); line-height: 1.4; }
	.error { display: flex; gap: var(--k-space-2); align-items: flex-start; color: var(--k-danger); }
	.error svg { flex: none; width: 16px; height: 16px; margin-top: 1px; }
</style>
