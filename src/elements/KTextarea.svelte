<svelte:options customElement={{ tag: 'k-textarea', props: { label: { type: "String" }, hint: { type: "String" }, error: { type: "String" }, value: { type: 'String', reflect: true }, name: { type: "String" }, placeholder: { type: "String" }, rows: { type: "Number" }, required: { type: "Boolean" }, disabled: { type: "Boolean" }, autosize: { type: "Boolean" } }, extend: formAssociated }} />
<script lang="ts">
	import Textarea from '../lib/components/Textarea.svelte';
	import { formAssociated, setFormValue, emit } from './form.js';
	let { label, hint, error, value = $bindable(''), name, placeholder, rows, required = false, disabled = false, autosize = false } = $props();
	const host = $host();
	const initial = value;
	$effect(() => setFormValue(host, value ?? ''));
	$effect(() => { const r = () => (value = initial); host.addEventListener('k-reset', r); return () => host.removeEventListener('k-reset', r); });
</script>
<Textarea {label} {hint} {error} bind:value {name} {placeholder} {rows} {required} {disabled} {autosize} onchange={() => emit(host, 'change', value)} />
