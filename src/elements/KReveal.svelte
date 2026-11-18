<svelte:options customElement={{ tag: 'k-reveal', props: { direction: { type: "String" }, delay: { type: "Number" }, once: { type: "String" }, threshold: { type: "Number" } } }} />
<script lang="ts">
	import Reveal from '../lib/components/Reveal.svelte';
	/* once defaults to on; once="false" hides the content again when it leaves the viewport. */
	let { direction, delay, once, threshold } = $props();
	const on = (v: unknown, fallback: boolean) => (v === undefined || v === null ? fallback : v !== false && v !== 'false');
</script>
<Reveal {direction} {delay} once={on(once, true)} {threshold}><slot /></Reveal>
<style>
	:host { display: block; min-width: 0; }
</style>
