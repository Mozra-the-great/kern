<svelte:options customElement={{ tag: 'k-input', props: { label: { type: "String" }, hint: { type: "String" }, error: { type: "String" }, value: { type: 'String', reflect: true }, name: { type: "String" }, type: { type: "String" }, placeholder: { type: "String" }, required: { type: "Boolean" }, disabled: { type: "Boolean" }, autocomplete: { type: "String" }, inputmode: { type: "String" } }, extend: formAssociated }} />
<script lang="ts">
	import Input from '../lib/components/Input.svelte';
	import { formAssociated, setFormValue, emit } from './form.js';
	let { label, hint, error, value = $bindable(''), name, type = 'text', placeholder, required = false, disabled = false, autocomplete, inputmode } = $props();
	const host = $host();
	const initial = value;
	$effect(() => setFormValue(host, value ?? ''));
	$effect(() => { const r = () => (value = initial); host.addEventListener('k-reset', r); return () => host.removeEventListener('k-reset', r); });
</script>
<Input {label} {hint} {error} bind:value {name} {type} {placeholder} {required} {disabled} {autocomplete} {inputmode} onchange={() => emit(host, 'change', value)} />
