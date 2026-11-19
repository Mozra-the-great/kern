<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	interface Props extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
		/** Id of the control the label points to (only for `as="label"`). */
		for?: string | undefined;
		/** Shows the required marker. */
		required?: boolean | null | undefined;
		/** Label text; or pass children for richer content. */
		text?: string | undefined;
		/**
		 * `label` for a single control. `span` names a group via `aria-labelledby`
		 * (radio groups, segmented controls), where a `<label>` has no control to point to.
		 */
		as?: 'label' | 'span' | undefined;
		children?: Snippet | undefined;
	}
	let { for: forId, required = false, text, as = 'label', class: cls = '', children, ...rest }: Props = $props();
</script>

{#if as === 'label'}
	<label class="k-label {cls}" for={forId} {...rest}>
		{#if text}{text}{:else}{@render children?.()}{/if}{#if required}<span class="req" aria-hidden="true"> *</span>{/if}
	</label>
{:else}
	<span class="k-label {cls}" {...rest}>
		{#if text}{text}{:else}{@render children?.()}{/if}{#if required}<span class="req" aria-hidden="true"> *</span>{/if}
	</span>
{/if}

<style>
	.k-label {
		display: block;
		font-family: var(--k-label-font);
		font-size: var(--k-label-size);
		font-weight: var(--k-weight-label);
		text-transform: var(--k-label-transform);
		letter-spacing: var(--k-label-tracking);
		line-height: 1.5;
		color: var(--k-field-label-color);
	}
	.req {
		color: var(--k-danger);
	}
</style>
