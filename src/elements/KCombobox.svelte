<svelte:options customElement={{ tag: 'k-combobox', props: { label: { type: "String" }, hint: { type: "String" }, error: { type: "String" }, value: { type: 'String', reflect: true }, options: { type: "Array" }, placeholder: { type: "String" }, name: { type: "String" }, required: { type: "Boolean" }, disabled: { type: "Boolean" }, allowCustom: { type: 'Boolean', attribute: 'allow-custom' }, noResults: { type: 'String', attribute: 'no-results' }, toggleLabel: { type: 'String', attribute: 'toggle-label' } }, extend: formAssociated }} />
<script lang="ts">
	import Combobox from '../lib/components/Combobox.svelte';
	import { formAssociated, setFormValue, emit } from './form.js';
	let { label, hint, error, value = $bindable(''), options = [], placeholder, name, required = false, disabled = false, allowCustom = false, noResults, toggleLabel } = $props();
	const host = $host();
	const initial = value;
	$effect(() => setFormValue(host, value ?? ''));
	$effect(() => { const r = () => (value = initial); host.addEventListener('k-reset', r); return () => host.removeEventListener('k-reset', r); });
</script>
<Combobox {label} {hint} {error} bind:value {options} {placeholder} {name} {required} {disabled} {allowCustom} {noResults} {toggleLabel} onchange={(v) => emit(host, 'change', v)} />
