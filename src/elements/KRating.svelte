<svelte:options customElement={{ tag: 'k-rating', props: { label: { type: 'String' }, hint: { type: 'String' }, error: { type: 'String' }, value: { type: 'Number', reflect: true }, max: { type: 'Number' }, readonly: { type: 'Boolean' }, disabled: { type: 'Boolean' }, name: { type: 'String' }, required: { type: 'Boolean' }, starLabel: { type: 'String', attribute: 'star-label' } }, extend: formAssociated }} />
<script lang="ts">
	import Rating from '../lib/components/Rating.svelte';
	import { formAssociated, setFormValue, emit } from './form.js';
	let { label, hint, error, value = $bindable(0), max = 5, readonly = false, disabled = false, name, required = false, starLabel } = $props();
	const host = $host();
	const initial = value;
	$effect(() => setFormValue(host, !readonly && value > 0 ? String(value) : null));
	$effect(() => { const r = () => (value = initial); host.addEventListener('k-reset', r); return () => host.removeEventListener('k-reset', r); });
</script>
<Rating {label} {hint} {error} bind:value {max} {readonly} {disabled} {name} {required} {starLabel} onchange={(v) => emit(host, 'change', v)} />
