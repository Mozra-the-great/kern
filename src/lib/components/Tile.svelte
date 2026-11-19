<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children'> {
		/** Makes the whole tile a link. */
		href?: string | undefined;
		/** Link target, e.g. `_blank` (with `href`). */
		target?: string | undefined;
		/** Link relation, e.g. `noopener` (with `href`). */
		rel?: string | undefined;
		/**
		 * Root element. `li` inside `<TileGrid as="ul">`; with `href` the link then fills the item.
		 * Default `div` (with `href`: the tile is the `<a>` itself).
		 */
		as?: 'div' | 'li' | 'article' | 'section' | undefined;
		class?: string | undefined;
		children?: Snippet | undefined;
	}
	let { href, target, rel, as = 'div', class: cls = '', children, ...rest }: Props = $props();
	const tag = $derived(['div', 'li', 'article', 'section'].includes(as) ? as : 'div');
	const link = $derived(href !== undefined && href !== '');
</script>

<!-- A cell of a TileGrid: lines on the right and bottom, so the grid reads as one ruled sheet. -->
{#if link && tag === 'div'}
	<a {...rest} {href} {target} {rel} class="k-tile cell link {cls}">{@render children?.()}</a>
{:else if link}
	<svelte:element this={tag} {...rest} class="k-tile {cls}">
		<a {href} {target} {rel} class="cell link">{@render children?.()}</a>
	</svelte:element>
{:else}
	<svelte:element this={tag} {...rest} class="k-tile cell {cls}">{@render children?.()}</svelte:element>
{/if}

<style>
	.k-tile {
		display: flex;
		min-width: 0;
		margin: 0;
		box-sizing: border-box;
		border-right: var(--k-border-w) solid var(--k-line);
		border-bottom: var(--k-border-w) solid var(--k-line);
		color: var(--k-fg);
	}
	.cell {
		display: flex;
		flex: 1;
		flex-direction: column;
		gap: var(--k-space-8);
		min-width: 0;
		box-sizing: border-box;
		padding: var(--k-space-6-5) var(--k-space-7) var(--k-space-7);
	}
	.link {
		color: inherit;
		text-decoration: none;
		transition: background-color var(--k-dur) var(--k-ease);
	}
	.link:hover {
		background: var(--k-bg-raised);
	}
	/* Inside, so the neighbours' lines do not cover it. */
	.link:focus-visible {
		outline: var(--k-focus-w) solid var(--k-focus);
		outline-offset: calc(var(--k-focus-w) * -1);
	}
	/* Narrow grid (phones): icon and text side by side, less padding. */
	@container (max-width: 760px) {
		.cell {
			flex-direction: row;
			align-items: center;
			gap: var(--k-space-5);
			padding: var(--k-space-5) var(--k-space-4);
		}
	}
	@media (forced-colors: active) {
		.k-tile {
			border-color: CanvasText;
		}
		.link:hover {
			outline: 1px solid LinkText;
			outline-offset: -1px;
		}
	}
</style>
