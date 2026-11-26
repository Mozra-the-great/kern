<svelte:options
	customElement={{
		props: {
			label: { type: 'String' },
			hint: { type: 'String' },
			error: { type: 'String' },
			noAnnounce: { type: 'Boolean', attribute: 'no-announce' },
			keepHint: { type: 'Boolean', attribute: 'keep-hint' },
			value: { type: 'String', reflect: true },
			options: { type: 'Array' },
			placeholder: { type: 'String' },
			name: { type: 'String', reflect: true },
			required: { type: 'Boolean' },
			disabled: { type: 'Boolean', reflect: true }
		},
		extend: formAssociated
	}}
/>

<script lang="ts">
	/**
	 * Native select.
	 * @prop options {readonly SelectOption[]}
	 * @event change {string} The chosen value.
	 * @prop noAnnounce The error is not announced (no `role="alert"`); use it when the page announces the message itself. The error stays visible and keeps describing the control.
	 */
	import Select from '../lib/components/Select.svelte';
	import { formAssociated, setFormValue, emit } from './form.js';
	import { forwardAttributes, formControl, inShadow } from './control.svelte.js';
	import { SELECT_ATTRS } from './native.js';
	let {
		label,
		hint,
		error,
		noAnnounce = false,
		keepHint = false,
		value = $bindable(''),
		options = [],
		placeholder,
		name,
		required = false,
		disabled = false
	} = $props();
	const host = $host();
	const native = forwardAttributes(host, SELECT_ATTRS);
	const control = () => inShadow<HTMLSelectElement>(host, 'select');
	formControl(host, { anchor: control, control, watch: () => [value, options, required], disabled: () => disabled });
	const initial = value;
	$effect(() => setFormValue(host, value ?? ''));
	$effect(() => {
		const r = () => (value = initial);
		host.addEventListener('k-reset', r);
		return () => host.removeEventListener('k-reset', r);
	});
</script>

<Select
	{label}
	{hint}
	{error}
	announce={!noAnnounce}
	{keepHint}
	bind:value
	{options}
	{placeholder}
	{name}
	{required}
	{disabled}
	{...native.current}
	onchange={() => emit(host, 'change', value)}
/>
