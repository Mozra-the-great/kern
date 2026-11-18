<svelte:options customElement={{ tag: 'k-switch', props: { checked: { type: 'Boolean', reflect: true }, label: { type: "String" }, hint: { type: "String" }, name: { type: "String" }, value: { type: "String" }, disabled: { type: "Boolean" }, labelFirst: { type: 'Boolean', attribute: 'label-first' } }, extend: formAssociated }} />
<script lang="ts">
	import Switch from '../lib/components/Switch.svelte';
	import { formAssociated, setFormValue, emit } from './form.js';
	let { checked = $bindable(false), label = '', hint, name, value = 'on', disabled = false, labelFirst = false } = $props();
	const host = $host();
	$effect(() => setFormValue(host, checked ? value : null));
</script>
<Switch bind:checked {label} {hint} {name} {value} {disabled} {labelFirst} onchange={() => emit(host, 'change', checked)} />
