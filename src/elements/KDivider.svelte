<svelte:options customElement={{ props: { label: { type: 'String' }, vertical: { type: 'Boolean' } } }} />

<script lang="ts">
	import Divider from '../lib/components/Divider.svelte';
	let { label, vertical = false } = $props();
</script>

<Divider {label} {vertical} />
