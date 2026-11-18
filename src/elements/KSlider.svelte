<svelte:options customElement={{ tag: 'k-slider', props: { label: { type: "String" }, hint: { type: "String" }, error: { type: "String" }, value: { type: 'Number', reflect: true }, min: { type: "Number" }, max: { type: "Number" }, step: { type: "Number" }, showValue: { type: 'Boolean', attribute: 'show-value' }, unit: { type: "String" }, name: { type: "String" }, disabled: { type: "Boolean" } }, extend: formAssociated }} />
<script lang="ts">
	import Slider from '../lib/components/Slider.svelte';
	import { formAssociated, setFormValue, emit } from './form.js';
	/* unit: text appended to the shown value, e.g. unit=" %". */
	let { label, hint, error, value = $bindable(), min = 0, max = 100, step = 1, showValue = false, unit, name, disabled = false } = $props();
	const host = $host();
	const initial = value;
	const format = $derived(unit ? (v: number) => `${v}${unit}` : undefined);
	$effect(() => setFormValue(host, value === undefined ? null : String(value)));
	$effect(() => { const r = () => (value = initial); host.addEventListener('k-reset', r); return () => host.removeEventListener('k-reset', r); });
</script>
<Slider {label} {hint} {error} bind:value {min} {max} {step} {showValue} {format} {name} {disabled} oninput={() => emit(host, 'input', value)} onchange={() => emit(host, 'change', value)} />
