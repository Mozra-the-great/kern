<svelte:options customElement={{ tag: 'k-select', props: { label: { type: "String" }, hint: { type: "String" }, error: { type: "String" }, value: { type: 'String', reflect: true }, options: { type: "Array" }, placeholder: { type: "String" }, name: { type: "String" }, required: { type: "Boolean" }, disabled: { type: "Boolean" } }, extend: formAssociated }} />
<script lang="ts">
	import Select from '../lib/components/Select.svelte';
	import { formAssociated, setFormValue, emit } from './form.js';
	let { label, hint, error, value = $bindable(''), options = [], placeholder, name, required = false, disabled = false } = $props();
	const host = $host();
	$effect(() => setFormValue(host, value ?? ''));
</script>
<Select {label} {hint} {error} bind:value {options} {placeholder} {name} {required} {disabled} onchange={() => emit(host, 'change', value)} />
