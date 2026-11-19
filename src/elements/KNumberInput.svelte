<svelte:options
	customElement={{
		props: {
			label: { type: 'String' },
			hint: { type: 'String' },
			error: { type: 'String' },
			value: { type: 'Number', reflect: true },
			min: { type: 'Number' },
			max: { type: 'Number' },
			step: { type: 'Number' },
			format: { type: 'Object' },
			locale: { type: 'String' },
			name: { type: 'String' },
			required: { type: 'Boolean' },
			disabled: { type: 'Boolean' },
			readonly: { type: 'Boolean' },
			placeholder: { type: 'String' },
			decrementLabel: { type: 'String', attribute: 'decrement-label' },
			incrementLabel: { type: 'String', attribute: 'increment-label' }
		},
		extend: formAssociated
	}}
/>

<script lang="ts">
	/**
	 * Number field with step buttons. `format`: Intl.NumberFormat options as JSON, e.g.
	 * format='{"style":"currency","currency":"EUR"}'. `min`/`max`/`required` are validated;
	 * `step` is the arrow increment, not a constraint.
	 * @prop format {Intl.NumberFormatOptions}
	 * @prop value {number | null}
	 * @event change {number | null} The committed number, or null when the field is empty.
	 */
	import NumberInput from '../lib/components/NumberInput.svelte';
	import { formAssociated, setFormValue, emit } from './form.js';
	import { formControl, inShadow } from './control.svelte.js';
	let {
		label,
		hint,
		error,
		value = $bindable(null),
		min,
		max,
		step = 1,
		format,
		locale,
		name,
		required = false,
		disabled = false,
		readonly = false,
		placeholder,
		decrementLabel,
		incrementLabel
	} = $props();
	const host = $host();
	const initial = value;
	formControl(host, {
		anchor: () => inShadow<HTMLInputElement>(host, 'input[role="spinbutton"]'),
		probe: () => ({
			attrs: { type: 'number', step: 'any', min, max, required: required && !readonly },
			value: typeof value === 'number' && Number.isFinite(value) ? String(value) : ''
		}),
		disabled: () => disabled
	});
	$effect(() => setFormValue(host, typeof value === 'number' && Number.isFinite(value) ? String(value) : null));
	$effect(() => {
		const r = () => (value = initial);
		host.addEventListener('k-reset', r);
		return () => host.removeEventListener('k-reset', r);
	});
</script>

<NumberInput
	{label}
	{hint}
	{error}
	bind:value
	{min}
	{max}
	{step}
	{format}
	{locale}
	{name}
	{required}
	{disabled}
	{readonly}
	{placeholder}
	{decrementLabel}
	{incrementLabel}
	onchange={(v) => emit(host, 'change', v)}
/>
