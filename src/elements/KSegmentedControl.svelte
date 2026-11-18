<svelte:options customElement={{ tag: 'k-segmented-control', props: { label: { type: 'String' }, groupLabel: { type: 'String', attribute: 'group-label' }, hint: { type: 'String' }, error: { type: 'String' }, options: { type: 'Array' }, value: { type: 'String', reflect: true }, name: { type: 'String' }, disabled: { type: 'Boolean' }, block: { type: 'Boolean' } }, extend: formAssociated }} />
<script lang="ts">
	import SegmentedControl from '../lib/components/SegmentedControl.svelte';
	import { formAssociated, setFormValue, emit } from './form.js';
	/* group-label: accessible name when there is no visible label. */
	let { label, groupLabel, hint, error, options = [], value = $bindable(''), name, disabled = false, block = false } = $props();
	const host = $host();
	const initial = value;
	$effect(() => setFormValue(host, value || null));
	$effect(() => { const r = () => (value = initial); host.addEventListener('k-reset', r); return () => host.removeEventListener('k-reset', r); });
</script>
<SegmentedControl {label} ariaLabel={groupLabel} {hint} {error} {options} bind:value {name} {disabled} {block} onchange={(v) => emit(host, 'change', v)} />
