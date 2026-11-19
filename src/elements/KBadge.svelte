<svelte:options customElement={{ props: { tone: { type: "String" }, look: { type: "String" } } }} />
<script lang="ts">
	import Badge from '../lib/components/Badge.svelte';
	let { tone, look } = $props();
</script>
<Badge {tone} {look}><slot /></Badge>
