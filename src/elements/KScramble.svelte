<svelte:options customElement={{ props: { text: { type: "String" }, duration: { type: "Number" }, glyphs: { type: "String" }, interval: { type: "Number" }, hover: { type: "Boolean" } } }} />
<script lang="ts">
	/**
	 * @event complete The text is resolved.
	 */
	import Scramble from '../lib/components/Scramble.svelte';
	import { emit } from './form.js';
	/* Without the text attribute the element's own text is used. */
	let { text, duration, glyphs, interval, hover = false } = $props();
	const host = $host();
</script>
<Scramble text={text ?? (host.textContent ?? '').trim()} {duration} {glyphs} {interval} {hover} oncomplete={() => emit(host, 'complete')} />
