<svelte:options
	customElement={{
		props: {
			label: { type: 'String' },
			hint: { type: 'String' },
			error: { type: 'String' },
			noAnnounce: { type: 'Boolean', attribute: 'no-announce' },
			value: { type: 'String', reflect: true },
			options: { type: 'Array' },
			placeholder: { type: 'String' },
			name: { type: 'String', reflect: true },
			required: { type: 'Boolean' },
			disabled: { type: 'Boolean', reflect: true },
			allowCustom: { type: 'Boolean', attribute: 'allow-custom' },
			noResults: { type: 'String', attribute: 'no-results' },
			toggleLabel: { type: 'String', attribute: 'toggle-label' }
		},
		extend: formAssociated
	}}
/>

<script lang="ts">
	/**
	 * Text field with a filtered list of options; `allow-custom` also accepts free text.
	 * @prop options {readonly ComboboxOption[]}
	 * @event change {string} The chosen value.
	 * @prop noAnnounce The error is not announced (no `role="alert"`); use it when the page announces the message itself. The error stays visible and keeps describing the control.
	 */
	import Combobox from '../lib/components/Combobox.svelte';
	import { formAssociated, setFormValue, emit } from './form.js';
	import { formControl, inShadow } from './control.svelte.js';
	let {
		label,
		hint,
		error,
		noAnnounce = false,
		value = $bindable(''),
		options = [],
		placeholder,
		name,
		required = false,
		disabled = false,
		allowCustom = false,
		noResults,
		toggleLabel
	} = $props();
	const host = $host();
	const initial = value;
	formControl(host, {
		anchor: () => inShadow<HTMLInputElement>(host, 'input[role="combobox"]'),
		probe: () => ({ attrs: { required }, value: value ?? '' }),
		disabled: () => disabled
	});
	$effect(() => setFormValue(host, value ?? ''));
	$effect(() => {
		const r = () => (value = initial);
		host.addEventListener('k-reset', r);
		return () => host.removeEventListener('k-reset', r);
	});
</script>

<Combobox
	{label}
	{hint}
	{error}
	announce={!noAnnounce}
	bind:value
	{options}
	{placeholder}
	{name}
	{required}
	{disabled}
	{allowCustom}
	{noResults}
	{toggleLabel}
	onchange={(v) => emit(host, 'change', v)}
/>
