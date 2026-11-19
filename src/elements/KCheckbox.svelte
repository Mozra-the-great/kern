<svelte:options
	customElement={{
		props: {
			checked: { type: 'Boolean', reflect: true },
			indeterminate: { type: 'Boolean' },
			label: { type: 'String' },
			hint: { type: 'String' },
			name: { type: 'String' },
			value: { type: 'String' },
			disabled: { type: 'Boolean' },
			required: { type: 'Boolean' }
		},
		extend: formAssociated
	}}
/>

<script lang="ts">
	/**
	 * Checkbox; submits `value` (default "on") while checked. Without `label` the default slot is the label.
	 * @event change {boolean} The new checked state.
	 */
	import Checkbox from '../lib/components/Checkbox.svelte';
	import { formAssociated, setFormValue, emit } from './form.js';
	import { forwardAttributes, formControl, inShadow } from './control.svelte.js';
	import { CHECK_ATTRS } from './native.js';
	let {
		checked = $bindable(false),
		indeterminate = $bindable(false),
		label,
		hint,
		name,
		value = 'on',
		disabled = false,
		required = false
	} = $props();
	const host = $host();
	const native = forwardAttributes(host, CHECK_ATTRS);
	const control = () => inShadow<HTMLInputElement>(host, 'input');
	formControl(host, { anchor: control, control, watch: () => [checked, required], disabled: () => disabled });
	const initial = checked;
	$effect(() => setFormValue(host, checked ? value : null));
	$effect(() => {
		const r = () => (checked = initial);
		host.addEventListener('k-reset', r);
		return () => host.removeEventListener('k-reset', r);
	});
</script>

<Checkbox
	bind:checked
	bind:indeterminate
	{label}
	{hint}
	{name}
	{value}
	{disabled}
	{required}
	{...native.current}
	onchange={() => emit(host, 'change', checked)}
>
	{#if !label}<slot />{/if}
</Checkbox>
