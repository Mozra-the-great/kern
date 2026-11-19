<svelte:options customElement={{ props: { as: { type: 'String' }, min: { type: 'String' } } }} />

<script lang="ts">
	/**
	 * Ruled grid of `<k-tile>` children (stuffcloud's TileGrid): as many columns of at least `min`
	 * (default 280px) as fit, one hairline between all cells; narrow grids switch the tiles to rows.
	 * `as="ul"` / `as="ol"` give the element the role `list` (use `<k-tile as="li">` inside); name the
	 * grid with `aria-label` on the element.
	 * @prop as {'div' | 'ul' | 'ol'} `ul`/`ol` set `role="list"` on the element itself.
	 * @prop min {string} Smallest column width (CSS length). Default `280px`.
	 */
	import TileGrid from '../lib/components/TileGrid.svelte';
	let { as, min } = $props();
	const host = $host();
	// Inside a shadow root a <ul> would not see the <li> of its children; the host takes the role.
	$effect(() => {
		if ((as !== 'ul' && as !== 'ol') || host.hasAttribute('role')) return;
		host.setAttribute('role', 'list');
		return () => host.removeAttribute('role');
	});
</script>

<TileGrid {min}><slot /></TileGrid>

<style>
	:host {
		display: block;
		min-width: 0;
	}
</style>
