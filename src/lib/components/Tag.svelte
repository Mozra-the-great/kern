<script lang="ts">
	import { strings } from './strings.svelte.js';
	import type { Snippet } from 'svelte';

	interface Props {
		/** When set, shows a remove button that calls it. */
		onremove?: (() => void) | undefined;
		/** Accessible name of the remove button. */
		removeLabel?: string | undefined;
		selected?: boolean | undefined;
		class?: string | undefined;
		children?: Snippet | undefined;
	}
	let { onremove, removeLabel: removeLabelProp, selected = false, class: cls = '', children }: Props = $props();
	const removeLabel = $derived(removeLabelProp ?? strings().tag.removeLabel);
</script>

<span class="k-tag {cls}" class:selected>
	<span class="txt">{@render children?.()}</span>
	{#if onremove}
		<button type="button" class="x" aria-label={removeLabel} onclick={onremove}>
			<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="2" /></svg>
		</button>
	{/if}
</span>

<style>
	.k-tag {
		display: inline-flex;
		align-items: center;
		gap: var(--k-space-1);
		min-height: 32px;
		padding: 0 var(--k-space-3);
		border: var(--k-border-w) solid var(--k-border);
		border-radius: var(--k-radius-badge);
		background: var(--k-bg-raised);
		color: var(--k-fg);
		font-family: var(--k-label-font);
		font-size: var(--k-text-sm);
		font-weight: var(--k-weight-label);
		text-transform: var(--k-label-transform);
		letter-spacing: var(--k-label-tracking);
	}
	.selected {
		border-color: var(--k-accent-mark);
		background: var(--k-surface-selected);
	}
	.x {
		position: relative;
		display: grid;
		place-items: center;
		width: 24px;
		height: 24px;
		margin-right: calc(var(--k-space-2) * -1);
		padding: 0;
		border: 0;
		border-radius: var(--k-radius-badge);
		background: transparent;
		color: var(--k-fg-muted);
		cursor: pointer;
	}
	.x::after {
		content: '';
		position: absolute;
		inset: min(0px, calc((100% - var(--k-tap-target)) / 2));
	}
	.x:hover {
		color: var(--k-fg);
		background: var(--k-bg-sunken);
	}
	.x:focus-visible {
		outline: var(--k-focus-w) solid var(--k-focus);
		outline-offset: 0;
	}
	.x svg {
		width: 12px;
		height: 12px;
	}
</style>
