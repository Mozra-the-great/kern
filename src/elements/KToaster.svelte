<svelte:options
	customElement={{
		props: { position: { type: 'String' }, dismissLabel: { type: 'String', attribute: 'dismiss-label' }, label: { type: 'String' } }
	}}
/>

<script lang="ts">
	import Toaster from '../lib/components/Toaster.svelte';
	let { position, dismissLabel, label } = $props();
</script>

<Toaster {position} {dismissLabel} {label} />
