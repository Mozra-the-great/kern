<svelte:options customElement={{ props: { shape: { type: "String" }, blink: { type: "String" }, cycles: { type: "Number" } } }} />
<script lang="ts">
	import Caret from '../lib/components/Caret.svelte';
	/* blink defaults to on; blink="false" (or el.blink = false) turns it off. cycles: blinks before it stays solid, 0 = forever. */
	let { shape, blink, cycles } = $props();
	const on = (v: unknown, fallback: boolean) => (v === undefined || v === null ? fallback : v !== false && v !== 'false');
</script>
<Caret {shape} blink={on(blink, true)} {cycles} />
