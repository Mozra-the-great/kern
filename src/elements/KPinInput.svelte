<svelte:options customElement={{ tag: 'k-pin-input', props: { label: { type: 'String' }, hint: { type: 'String' }, error: { type: 'String' }, value: { type: 'String', reflect: true }, length: { type: 'Number' }, type: { type: 'String' }, mask: { type: 'Boolean' }, name: { type: 'String' }, required: { type: 'Boolean' }, disabled: { type: 'Boolean' }, digitLabel: { type: 'String', attribute: 'digit-label' } }, extend: formAssociated }} />
<script lang="ts">
	import PinInput from '../lib/components/PinInput.svelte';
	import { formAssociated, setFormValue, emit } from './form.js';
	let { label, hint, error, value = $bindable(''), length = 6, type = 'numeric', mask = false, name, required = false, disabled = false, digitLabel } = $props();
	const host = $host();
	const initial = value;
	$effect(() => setFormValue(host, value ?? ''));
	$effect(() => { const r = () => (value = initial); host.addEventListener('k-reset', r); return () => host.removeEventListener('k-reset', r); });
</script>
<PinInput {label} {hint} {error} bind:value {length} {type} {mask} {name} {required} {disabled} {digitLabel} onchange={(v) => emit(host, 'change', v)} oncomplete={(v) => emit(host, 'complete', v)} />
