<svelte:options
	customElement={{
		props: {
			label: { type: 'String' },
			hint: { type: 'String' },
			error: { type: 'String' },
			value: { type: 'Array' },
			placeholder: { type: 'String' },
			name: { type: 'String' },
			required: { type: 'Boolean' },
			disabled: { type: 'Boolean' },
			max: { type: 'Number' },
			caseSensitive: { type: 'Boolean', attribute: 'case-sensitive' },
			suggestions: { type: 'Array' },
			removeLabel: { type: 'String', attribute: 'remove-label' },
			instructions: { type: 'String' },
			addedText: { type: 'String', attribute: 'added-text' },
			removedText: { type: 'String', attribute: 'removed-text' },
			duplicateText: { type: 'String', attribute: 'duplicate-text' },
			maxText: { type: 'String', attribute: 'max-text' },
			listLabel: { type: 'String', attribute: 'list-label' }
		},
		extend: formAssociated
	}}
/>

<script lang="ts">
	/**
	 * Free-text tags. The form gets one entry per tag under `name`, like a multi-select;
	 * `required` needs at least one tag.
	 * @prop value {string[]}
	 * @prop suggestions {string[]}
	 * @event change {string[]} All tags after the user added or removed one.
	 */
	import TagInput from '../lib/components/TagInput.svelte';
	import { formAssociated, setFormValue, emit } from './form.js';
	import { formControl, inShadow } from './control.svelte.js';
	let {
		label,
		hint,
		error,
		value = $bindable([]),
		placeholder,
		name,
		required = false,
		disabled = false,
		max,
		caseSensitive = false,
		suggestions = [],
		removeLabel,
		instructions,
		addedText,
		removedText,
		duplicateText,
		maxText,
		listLabel
	} = $props();
	const host = $host();
	const initial: string[] = Array.isArray(value) ? [...value] : [];
	formControl(host, {
		anchor: () => inShadow<HTMLInputElement>(host, 'input[type="text"]'),
		probe: () => ({ attrs: { required }, value: Array.isArray(value) && value.length > 0 ? 'x' : '' }),
		disabled: () => disabled
	});
	$effect(() => {
		const tags: string[] = Array.isArray(value) ? value : [];
		const data = new FormData();
		if (name) for (const t of tags) data.append(name, t);
		setFormValue(host, name && tags.length ? data : null);
	});
	$effect(() => {
		const r = () => (value = [...initial]);
		host.addEventListener('k-reset', r);
		return () => host.removeEventListener('k-reset', r);
	});
</script>

<TagInput
	{label}
	{hint}
	{error}
	bind:value
	{placeholder}
	{name}
	{required}
	{disabled}
	{max}
	{caseSensitive}
	{suggestions}
	{removeLabel}
	{instructions}
	{addedText}
	{removedText}
	{duplicateText}
	{maxText}
	{listLabel}
	onchange={(v: string[]) => emit(host, 'change', [...v])}
/>
