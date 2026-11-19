<svelte:options customElement={{ props: { label: { type: "String" }, hint: { type: "String" }, error: { type: "String" }, value: { type: 'String', reflect: true }, options: { type: "Array" }, placeholder: { type: "String" }, name: { type: "String" }, required: { type: "Boolean" }, disabled: { type: "Boolean" } }, extend: formAssociated }} />
<script lang="ts">
	/**
	 * Native select.
	 * @prop options {SelectOption[]}
	 * @event change {string} The chosen value.
	 */
	import Select from '../lib/components/Select.svelte';
	import { formAssociated, setFormValue, emit } from './form.js';
	import { forwardAttributes, formControl, inShadow } from './control.svelte.js';
	import { SELECT_ATTRS } from './native.js';
	let { label, hint, error, value = $bindable(''), options = [], placeholder, name, required = false, disabled = false } = $props();
	const host = $host();
	const native = forwardAttributes(host, SELECT_ATTRS);
	const control = () => inShadow<HTMLSelectElement>(host, 'select');
	formControl(host, { anchor: control, control, watch: () => [value, options, required], disabled: () => disabled });
	const initial = value;
	$effect(() => setFormValue(host, value ?? ''));
	$effect(() => { const r = () => (value = initial); host.addEventListener('k-reset', r); return () => host.removeEventListener('k-reset', r); });
</script>
<Select {label} {hint} {error} bind:value {options} {placeholder} {name} {required} {disabled} {...native.current} onchange={() => emit(host, 'change', value)} />
