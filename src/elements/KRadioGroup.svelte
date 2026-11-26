<svelte:options
	customElement={{
		props: {
			label: { type: 'String' },
			options: { type: 'Array' },
			value: { type: 'String', reflect: true },
			name: { type: 'String', reflect: true },
			inline: { type: 'Boolean' },
			error: { type: 'String' },
			required: { type: 'Boolean' }
		},
		extend: formAssociated
	}}
/>

<script lang="ts">
	/**
	 * Group of radio buttons in a fieldset. `required` needs a choice.
	 * @prop options {readonly RadioOption[]}
	 * @event change {string} The picked value (user input only, not when value/options are set).
	 */
	import RadioGroup from '../lib/components/RadioGroup.svelte';
	import { formAssociated, setFormValue, emit } from './form.js';
	import { formControl, inShadow } from './control.svelte.js';
	let { label = '', options = [], value = $bindable(''), name, inline = false, error, required = false } = $props();
	const host = $host();
	formControl(host, {
		anchor: () =>
			inShadow<HTMLInputElement>(host, 'input[type="radio"]:checked') ??
			inShadow<HTMLInputElement>(host, 'input[type="radio"]:not(:disabled)'),
		probe: () => ({ attrs: { type: 'radio', required }, value: value ? 'on' : '' })
	});
	const initial = value;
	$effect(() => setFormValue(host, value || null));
	$effect(() => {
		const r = () => (value = initial);
		host.addEventListener('k-reset', r);
		return () => host.removeEventListener('k-reset', r);
	});
</script>

<RadioGroup {label} {options} bind:value {name} {inline} {error} onchange={(v: string) => emit(host, 'change', v)} />
