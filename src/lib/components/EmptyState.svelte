<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		description?: string | undefined;
		/** Heading level of the title. */
		level?: 2 | 3 | 4 | undefined;
		/** Decorative illustration or icon above the title (hidden from assistive technology). */
		icon?: Snippet | undefined;
		/** Call to action below the text, e.g. one or two buttons. */
		actions?: Snippet | undefined;
		class?: string | undefined;
	}
	let { title, description, level = 3, icon, actions, class: cls = '' }: Props = $props();
</script>

<div class="k-empty {cls}">
	{#if icon}<div class="icon" aria-hidden="true">{@render icon()}</div>{/if}
	<svelte:element this={`h${level}`} class="title">{title}</svelte:element>
	{#if description}<p class="desc">{description}</p>{/if}
	{#if actions}<div class="actions">{@render actions()}</div>{/if}
</div>

<style>
	.k-empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--k-space-3);
		padding: var(--k-space-8) var(--k-space-4);
		text-align: center;
		color: var(--k-fg);
		min-width: 0;
	}
	.icon {
		display: grid;
		place-items: center;
		width: 64px;
		height: 64px;
		margin-bottom: var(--k-space-2);
		border: var(--k-border-w) solid var(--k-line);
		border-radius: var(--k-radius-card);
		background: var(--k-bg-sunken);
		color: var(--k-fg-muted);
	}
	.icon :global(svg) { width: 28px; height: 28px; }
	.title { margin: 0; max-width: 32ch; font-size: var(--k-text-lg); font-weight: var(--k-weight-heading); line-height: 1.3; text-wrap: balance; }
	.desc { margin: 0; max-width: 44ch; color: var(--k-fg-muted); font-size: var(--k-text-sm); text-wrap: pretty; }
	.actions { display: flex; flex-wrap: wrap; justify-content: center; gap: var(--k-space-3); margin-top: var(--k-space-2); }
</style>
