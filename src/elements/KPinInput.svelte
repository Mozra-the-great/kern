<svelte:options
	customElement={{
		props: {
			label: { type: 'String' },
			hint: { type: 'String' },
			error: { type: 'String' },
			value: { type: 'String', reflect: true },
			length: { type: 'Number' },
			type: { type: 'String' },
			mask: { type: 'Boolean' },
			name: { type: 'String', reflect: true },
			required: { type: 'Boolean' },
			disabled: { type: 'Boolean', reflect: true },
			digitLabel: { type: 'String', attribute: 'digit-label' }
		},
		extend: formAssociated
	}}
/>

<script lang="ts">
	/**
	 * One-time code: `length` boxes, `type` numeric or alphanumeric. The first box has
	 * autocomplete="one-time-code". A partly filled code is invalid; `required` rejects an empty one.
	 * @event change {string} The code so far.
	 * @event complete {string} The code, once every box is filled.
	 */
	import PinInput from '../lib/components/PinInput.svelte';
	import { formAssociated, setFormValue, emit } from './form.js';
	import { formControl, inShadow } from './control.svelte.js';
	let {
		label,
		hint,
		error,
		value = $bindable(''),
		length = 6,
		type = 'numeric',
		mask = false,
		name,
		required = false,
		disabled = false,
		digitLabel
	} = $props();
	const host = $host();
	const initial = value;
	formControl(host, {
		anchor: () => inShadow<HTMLInputElement>(host, 'input.box:not(.filled)') ?? inShadow<HTMLInputElement>(host, 'input.box'),
		probe: () => ({ attrs: { required, pattern: `.{${Math.max(1, Math.floor(Number(length) || 6))}}` }, value: value ?? '' }),
		disabled: () => disabled
	});
	$effect(() => setFormValue(host, value ?? ''));
	$effect(() => {
		const r = () => (value = initial);
		host.addEventListener('k-reset', r);
		return () => host.removeEventListener('k-reset', r);
	});
</script>

<PinInput
	{label}
	{hint}
	{error}
	bind:value
	{length}
	{type}
	{mask}
	{name}
	{required}
	{disabled}
	{digitLabel}
	onchange={(v) => emit(host, 'change', v)}
	oncomplete={(v) => emit(host, 'complete', v)}
/>
