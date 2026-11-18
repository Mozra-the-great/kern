<svelte:options customElement={{ tag: 'k-checkbox', props: { checked: { type: 'Boolean', reflect: true }, indeterminate: { type: "Boolean" }, label: { type: "String" }, hint: { type: "String" }, name: { type: "String" }, value: { type: "String" }, disabled: { type: "Boolean" }, required: { type: "Boolean" } }, extend: formAssociated }} />
<script lang="ts">
	import Checkbox from '../lib/components/Checkbox.svelte';
	import { formAssociated, setFormValue, emit } from './form.js';
	let { checked = $bindable(false), indeterminate = $bindable(false), label, hint, name, value = 'on', disabled = false, required = false } = $props();
	const host = $host();
	$effect(() => setFormValue(host, checked ? value : null));
</script>
<Checkbox bind:checked bind:indeterminate {label} {hint} {name} {value} {disabled} {required} onchange={() => emit(host, 'change', checked)}>
	{#if !label}<slot />{/if}
</Checkbox>
