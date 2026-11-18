<svelte:options customElement={{ tag: 'k-grid-background', props: { variant: { type: "String" }, size: { type: "Number" }, fade: { type: "Boolean" } } }} />
<script lang="ts">
	import GridBackground from '../lib/components/GridBackground.svelte';
	let { variant, size, fade = false } = $props();
</script>
<GridBackground {variant} {size} {fade}><slot /></GridBackground>
<style>
	:host { display: block; min-width: 0; }
</style>
