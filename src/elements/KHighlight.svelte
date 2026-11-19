<svelte:options customElement={{ props: { inView: { type: 'String', attribute: 'in-view' }, delay: { type: 'Number' } } }} />

<script lang="ts">
	import Highlight from '../lib/components/Highlight.svelte';
	/* in-view defaults to on; in-view="false" draws the marker right after mount. */
	let { inView, delay } = $props();
	const on = (v: unknown, fallback: boolean) => (v === undefined || v === null ? fallback : v !== false && v !== 'false');
</script>

<Highlight inView={on(inView, true)} {delay}><slot /></Highlight>
