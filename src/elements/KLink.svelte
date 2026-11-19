<svelte:options customElement={{ props: { href: { type: 'String' }, external: { type: 'Boolean' } } }} />

<script lang="ts">
	import Link from '../lib/components/Link.svelte';
	let { href, external = false } = $props();
</script>

<Link {href} {external}><slot /></Link>
