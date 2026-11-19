<svelte:options customElement={{ props: { label: { type: "String" }, variant: { type: "String" }, size: { type: "String" }, disabled: { type: "Boolean" } } }} />
<script lang="ts">
	import IconButton from '../lib/components/IconButton.svelte';
	let { label = '', variant, size, disabled = false } = $props();
</script>
<IconButton {label} {variant} {size} {disabled}><slot /></IconButton>
