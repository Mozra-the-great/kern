<svelte:options customElement={{ tag: 'k-spinner', props: { label: { type: "String" }, size: { type: "Number" } } }} />
<script lang="ts">
	import Spinner from '../lib/components/Spinner.svelte';
	let { label, size } = $props();
</script>
<Spinner {label} {size} />
