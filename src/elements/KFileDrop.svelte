<svelte:options
	customElement={{
		props: {
			label: { type: 'String' },
			hint: { type: 'String' },
			error: { type: 'String' },
			accept: { type: 'String' },
			multiple: { type: 'Boolean' },
			maxSize: { type: 'Number', attribute: 'max-size' },
			name: { type: 'String' },
			required: { type: 'Boolean' },
			disabled: { type: 'Boolean' },
			dropLabel: { type: 'String', attribute: 'drop-label' },
			removeLabel: { type: 'String', attribute: 'remove-label' },
			listLabel: { type: 'String', attribute: 'list-label' },
			sizeError: { type: 'String', attribute: 'size-error' },
			typeError: { type: 'String', attribute: 'type-error' },
			countError: { type: 'String', attribute: 'count-error' },
			statusLabel: { type: 'String', attribute: 'status-label' }
		},
		extend: formAssociated
	}}
/>

<script lang="ts">
	/**
	 * Drop zone and file picker. The chosen files are the read-only property `el.files`;
	 * `required` needs at least one file.
	 * @event files {File[]} All chosen files after every change.
	 */
	import FileDrop from '../lib/components/FileDrop.svelte';
	import { formAssociated, setFormValue, emit } from './form.js';
	import { formControl, inShadow } from './control.svelte.js';
	let {
		label,
		hint,
		error,
		accept,
		multiple = false,
		maxSize,
		name,
		required = false,
		disabled = false,
		dropLabel,
		removeLabel,
		listLabel,
		sizeError,
		typeError,
		countError,
		statusLabel
	} = $props();
	const host = $host();
	let files = $state<File[]>([]);
	Object.defineProperty(host, 'files', { get: () => files, configurable: true });
	formControl(host, {
		anchor: () => inShadow<HTMLButtonElement>(host, 'button'),
		probe: () => ({ attrs: { type: 'file', required }, value: files.length > 0 ? 'x' : '' }),
		disabled: () => disabled
	});
	$effect(() => {
		const data = new FormData();
		if (name) for (const f of files) data.append(name, f);
		setFormValue(host, name && files.length ? data : null);
	});
	$effect(() => {
		const r = () => (files = []);
		host.addEventListener('k-reset', r);
		return () => host.removeEventListener('k-reset', r);
	});
</script>

<FileDrop
	{label}
	{hint}
	{error}
	{accept}
	{multiple}
	{maxSize}
	{required}
	{disabled}
	{dropLabel}
	{removeLabel}
	{listLabel}
	{sizeError}
	{typeError}
	{countError}
	{statusLabel}
	bind:files
	onfiles={(f: File[]) => emit(host, 'files', f)}
/>
