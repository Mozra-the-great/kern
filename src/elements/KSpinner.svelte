<svelte:options customElement={{ props: { label: { type: "String" }, size: { type: "Number" } } }} />
<script lang="ts">
	import Spinner from '../lib/components/Spinner.svelte';
	let { label, size } = $props();
</script>
<Spinner {label} {size} />
