<svelte:options customElement={{ tag: 'k-tooltip', props: { text: { type: "String" }, placement: { type: "String" } } }} />
<script lang="ts">
	import Tooltip from '../lib/components/Tooltip.svelte';
	let { text = '', placement } = $props();
</script>
<Tooltip {text} {placement}><slot /></Tooltip>
