<svelte:options customElement={{ tag: 'k-radio-group', props: { label: { type: "String" }, options: { type: "Array" }, value: { type: 'String', reflect: true }, name: { type: "String" }, inline: { type: "Boolean" }, error: { type: "String" } }, extend: formAssociated }} />
<script lang="ts">
	import RadioGroup from '../lib/components/RadioGroup.svelte';
	import { formAssociated, setFormValue, emit } from './form.js';
	let { label = '', options = [], value = $bindable(''), name, inline = false, error } = $props();
	const host = $host();
	let first = true;
	$effect(() => { setFormValue(host, value || null); if (!first) emit(host, 'change', value); first = false; });
</script>
<RadioGroup {label} {options} bind:value {name} {inline} {error} />
