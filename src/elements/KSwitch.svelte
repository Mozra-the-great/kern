<svelte:options
	customElement={{
		props: {
			checked: { type: 'Boolean', reflect: true },
			label: { type: 'String' },
			hint: { type: 'String' },
			name: { type: 'String', reflect: true },
			value: { type: 'String' },
			disabled: { type: 'Boolean', reflect: true },
			labelFirst: { type: 'Boolean', attribute: 'label-first' }
		},
		extend: formAssociated
	}}
/>

<script lang="ts">
	/**
	 * On/off switch (a checkbox with role="switch"); submits `value` (default "on") while on.
	 * @event change {boolean} The new checked state.
	 */
	import Switch from '../lib/components/Switch.svelte';
	import { formAssociated, setFormValue, emit } from './form.js';
	import { forwardAttributes, formControl, inShadow } from './control.svelte.js';
	import { SWITCH_ATTRS } from './native.js';
	let { checked = $bindable(false), label = '', hint, name, value = 'on', disabled = false, labelFirst = false } = $props();
	const host = $host();
	const native = forwardAttributes(host, SWITCH_ATTRS);
	const control = () => inShadow<HTMLInputElement>(host, 'input');
	formControl(host, { anchor: control, control, watch: () => [checked], disabled: () => disabled });
	const initial = checked;
	$effect(() => setFormValue(host, checked ? value : null));
	$effect(() => {
		const r = () => (checked = initial);
		host.addEventListener('k-reset', r);
		return () => host.removeEventListener('k-reset', r);
	});
</script>

<Switch
	bind:checked
	{label}
	{hint}
	{name}
	{value}
	{disabled}
	{labelFirst}
	{...native.current}
	onchange={() => emit(host, 'change', checked)}
/>
