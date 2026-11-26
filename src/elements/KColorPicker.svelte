<svelte:options
	customElement={{
		props: {
			label: { type: 'String' },
			hint: { type: 'String' },
			error: { type: 'String' },
			noAnnounce: { type: 'Boolean', attribute: 'no-announce' },
			value: { type: 'String', reflect: true },
			alpha: { type: 'Boolean' },
			swatches: { type: 'Array' },
			name: { type: 'String', reflect: true },
			required: { type: 'Boolean' },
			disabled: { type: 'Boolean', reflect: true },
			placeholder: { type: 'String' },
			pickerLabel: { type: 'String', attribute: 'picker-label' },
			areaLabel: { type: 'String', attribute: 'area-label' },
			areaText: { type: 'String', attribute: 'area-text' },
			hueLabel: { type: 'String', attribute: 'hue-label' },
			alphaLabel: { type: 'String', attribute: 'alpha-label' },
			swatchesLabel: { type: 'String', attribute: 'swatches-label' },
			invalidText: { type: 'String', attribute: 'invalid-text' }
		},
		extend: formAssociated
	}}
/>

<script lang="ts">
	/**
	 * Colour field with a picker popup. `swatches`: JSON list of hex strings or {"value","label"} objects.
	 * @prop swatches {readonly (string | ColorSwatch)[]}
	 * @event change {string} The chosen colour as hex, or "" when cleared.
	 * @prop noAnnounce The error is not announced (no `role="alert"`); use it when the page announces the message itself. The error stays visible and keeps describing the control.
	 */
	import ColorPicker from '../lib/components/ColorPicker.svelte';
	import { formAssociated, setFormValue, emit } from './form.js';
	import { formControl, inShadow } from './control.svelte.js';
	let {
		label,
		hint,
		error,
		noAnnounce = false,
		value = $bindable(''),
		alpha = false,
		swatches = [],
		name,
		required = false,
		disabled = false,
		placeholder,
		pickerLabel,
		areaLabel,
		areaText,
		hueLabel,
		alphaLabel,
		swatchesLabel,
		invalidText
	} = $props();
	const host = $host();
	const initial = value;
	formControl(host, {
		anchor: () => inShadow<HTMLInputElement>(host, 'input[type="text"]'),
		probe: () => ({ attrs: { required }, value: value ?? '' }),
		disabled: () => disabled
	});
	$effect(() => setFormValue(host, value || null));
	$effect(() => {
		const r = () => (value = initial);
		host.addEventListener('k-reset', r);
		return () => host.removeEventListener('k-reset', r);
	});
</script>

<ColorPicker
	{label}
	{hint}
	{error}
	announce={!noAnnounce}
	bind:value
	{alpha}
	{swatches}
	{name}
	{required}
	{disabled}
	{placeholder}
	{pickerLabel}
	{areaLabel}
	{areaText}
	{hueLabel}
	{alphaLabel}
	{swatchesLabel}
	{invalidText}
	onchange={(v) => emit(host, 'change', v)}
/>
