<svelte:options customElement={{ props: { target: { type: 'String' }, label: { type: 'String' } } }} />

<script lang="ts">
	/**
	 * Skip link: hidden until it has keyboard focus, then jumps to the element with the id `target`
	 * (focus moves there; the address bar stays as it is). Put it first in the page, before the header.
	 * The target is looked up in the document, so it works with the page's `<main id="main">`.
	 */
	import SkipLink from '../lib/components/SkipLink.svelte';
	let { target, label } = $props();
</script>

<SkipLink target={target ?? ''} label={label ?? undefined} />
