<svelte:options
	customElement={{ props: { href: { type: 'String' }, target: { type: 'String' }, rel: { type: 'String' }, as: { type: 'String' } } }}
/>

<script lang="ts">
	/**
	 * Cell of a `<k-tile-grid>`: draws its right and bottom line. With `href` the whole cell is one link
	 * (its text is the link's name). `as="li"` gives the element the role `listitem`.
	 * @prop as {'div' | 'li'} `li` sets `role="listitem"` on the element itself.
	 */
	import Tile from '../lib/components/Tile.svelte';
	let { href, target, rel, as } = $props();
	const host = $host();
	$effect(() => {
		if (as !== 'li' || host.hasAttribute('role')) return;
		host.setAttribute('role', 'listitem');
		return () => host.removeAttribute('role');
	});
</script>

<Tile {href} {target} {rel}><slot /></Tile>

<style>
	:host {
		display: grid;
		min-width: 0;
	}
</style>
