<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children'> {
		/** Root element. `ul`/`ol` for a list of tiles (then use `<Tile as="li">`). Default `div`. */
		as?: 'div' | 'ul' | 'ol' | 'section' | 'nav' | undefined;
		/** Smallest column width before the grid drops a column (CSS length). Default `280px`. */
		min?: string | undefined;
		class?: string | undefined;
		children?: Snippet | undefined;
	}
	let { as = 'div', min, class: cls = '', children, ...rest }: Props = $props();
	const tag = $derived(['div', 'ul', 'ol', 'section', 'nav'].includes(as) ? as : 'div');
</script>

<!-- A closed ruled sheet: the grid draws the top and left line, every Tile its right and bottom line. -->
<svelte:element this={tag} {...rest} class="k-tile-grid {cls}" style:--k-tile-min={min || undefined}>
	{@render children?.()}
</svelte:element>

<style>
	.k-tile-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(var(--k-tile-min, 280px), 100%), 1fr));
		margin: 0;
		padding: 0;
		list-style: none;
		box-sizing: border-box;
		border-top: var(--k-border-w) solid var(--k-line);
		/* The left edge joins the top line at the corner. `--k-tile-grid-left-w: 0` drops it (a grid that sits against a bordered container). */
		border-left: var(--k-tile-grid-left-w, var(--k-border-w)) solid var(--k-line);
		/* Tiles switch to a row layout when the grid is narrow (phones), see Tile.svelte. */
		container-type: inline-size;
	}
	@media (forced-colors: active) {
		.k-tile-grid {
			border-color: CanvasText;
		}
	}
</style>
