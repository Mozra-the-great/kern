<svelte:options customElement={{ tag: 'k-accordion-item', props: { title: { type: "String" }, open: { type: 'Boolean', reflect: true }, name: { type: "String" } } }} />
<script lang="ts">
	import AccordionItem from '../lib/components/AccordionItem.svelte';
	let { title = '', open = $bindable(false), name } = $props();
</script>
<AccordionItem {title} bind:open {name}><slot /></AccordionItem>
