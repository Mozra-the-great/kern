<svelte:options
	customElement={{
		props: {
			label: { type: 'String' },
			hint: { type: 'String' },
			error: { type: 'String' },
			keepHint: { type: 'Boolean', attribute: 'keep-hint' },
			value: { type: 'String', reflect: true },
			name: { type: 'String' },
			type: { type: 'String' },
			placeholder: { type: 'String' },
			required: { type: 'Boolean' },
			disabled: { type: 'Boolean' },
			autocomplete: { type: 'String' },
			inputmode: { type: 'String' }
		},
		extend: formAssociated
	}}
/>

<script lang="ts">
	/**
	 * Text field (any native `type` except checkbox, radio and file).
	 * @event change {string} The value, when the user commits it (blur or Enter).
	 */
	import Input from '../lib/components/Input.svelte';
	import { formAssociated, setFormValue, emit } from './form.js';
	import { forwardAttributes, formControl, inShadow } from './control.svelte.js';
	import { INPUT_ATTRS } from './native.js';
	let {
		label,
		hint,
		error,
		keepHint = false,
		value = $bindable(''),
		name,
		type = 'text',
		placeholder,
		required = false,
		disabled = false,
		autocomplete,
		inputmode
	} = $props();
	const host = $host();
	const initial = value;
	const native = forwardAttributes(host, INPUT_ATTRS);
	const control = () => inShadow<HTMLInputElement>(host, 'input');
	formControl(host, { anchor: control, control, watch: () => [value, required, type], disabled: () => disabled });
	$effect(() => setFormValue(host, value ?? ''));
	$effect(() => {
		const r = () => (value = initial);
		host.addEventListener('k-reset', r);
		return () => host.removeEventListener('k-reset', r);
	});
</script>

<Input
	{label}
	{hint}
	{error}
	{keepHint}
	bind:value
	{name}
	{type}
	{placeholder}
	{required}
	{disabled}
	{autocomplete}
	{inputmode}
	{...native.current}
	onchange={() => emit(host, 'change', value)}
/>
