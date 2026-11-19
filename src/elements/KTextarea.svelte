<svelte:options
	customElement={{
		props: {
			label: { type: 'String' },
			hint: { type: 'String' },
			error: { type: 'String' },
			value: { type: 'String', reflect: true },
			name: { type: 'String' },
			placeholder: { type: 'String' },
			rows: { type: 'Number' },
			required: { type: 'Boolean' },
			disabled: { type: 'Boolean' },
			autosize: { type: 'Boolean' }
		},
		extend: formAssociated
	}}
/>

<script lang="ts">
	/**
	 * Multi-line text field; `autosize` grows it with its content.
	 * @event change {string} The value, when the user commits it (blur).
	 */
	import Textarea from '../lib/components/Textarea.svelte';
	import { formAssociated, setFormValue, emit } from './form.js';
	import { forwardAttributes, formControl, inShadow } from './control.svelte.js';
	import { TEXTAREA_ATTRS } from './native.js';
	let {
		label,
		hint,
		error,
		value = $bindable(''),
		name,
		placeholder,
		rows,
		required = false,
		disabled = false,
		autosize = false
	} = $props();
	const host = $host();
	const initial = value;
	const native = forwardAttributes(host, TEXTAREA_ATTRS);
	const control = () => inShadow<HTMLTextAreaElement>(host, 'textarea');
	formControl(host, { anchor: control, control, watch: () => [value, required], disabled: () => disabled });
	$effect(() => setFormValue(host, value ?? ''));
	$effect(() => {
		const r = () => (value = initial);
		host.addEventListener('k-reset', r);
		return () => host.removeEventListener('k-reset', r);
	});
</script>

<Textarea
	{label}
	{hint}
	{error}
	bind:value
	{name}
	{placeholder}
	{rows}
	{required}
	{disabled}
	{autosize}
	{...native.current}
	onchange={() => emit(host, 'change', value)}
/>
