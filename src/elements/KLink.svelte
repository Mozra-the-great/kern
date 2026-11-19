<svelte:options
	customElement={{
		props: { href: { type: 'String' }, external: { type: 'Boolean' }, externalLabel: { type: 'String', attribute: 'external-label' } }
	}}
/>

<script lang="ts">
	import Link from '../lib/components/Link.svelte';
	let { href, external = false, externalLabel } = $props();
</script>

<Link {href} {external} externalLabel={externalLabel ?? undefined}><slot /></Link>
