<svelte:options customElement={{ tag: 'k-progress', props: { value: { type: "Number" }, max: { type: "Number" }, label: { type: "String" }, showValue: { type: 'Boolean', attribute: 'show-value' } } }} />
<script lang="ts">
	import Progress from '../lib/components/Progress.svelte';
	let { value, max, label = '', showValue = false } = $props();
</script>
<Progress {value} {max} {label} {showValue} />
