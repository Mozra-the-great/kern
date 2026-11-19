<svelte:options
	customElement={{
		props: {
			label: { type: 'String' },
			hint: { type: 'String' },
			error: { type: 'String' },
			accept: { type: 'String' },
			multiple: { type: 'Boolean' },
			maxSize: { type: 'Number', attribute: 'max-size' },
			mode: { type: 'String' },
			name: { type: 'String' },
			required: { type: 'Boolean' },
			disabled: { type: 'Boolean' },
			dropLabel: { type: 'String', attribute: 'drop-label' },
			buttonLabel: { type: 'String', attribute: 'button-label' },
			removeLabel: { type: 'String', attribute: 'remove-label' },
			listLabel: { type: 'String', attribute: 'list-label' },
			sizeError: { type: 'String', attribute: 'size-error' },
			typeError: { type: 'String', attribute: 'type-error' },
			countError: { type: 'String', attribute: 'count-error' },
			statusLabel: { type: 'String', attribute: 'status-label' },
			noRejectMessages: { type: 'Boolean', attribute: 'no-reject-messages' }
		},
		extend: formAssociated
	}}
/>

<script lang="ts">
	/**
	 * Drop zone and file picker. The chosen files are the property `el.files`; setting it (e.g. to `[]`
	 * after an upload) replaces them without an event, `el.reset()` also clears the messages. `required`
	 * needs at least one file. `mode="dispatch"` keeps no list: every pick or drop fires `files` with
	 * just those files. Only name, type and size of a file are read, never its content.
	 * @prop mode {'field' | 'dispatch'} `field` keeps a list of chosen files (form value); `dispatch` fires `files` per pick or drop and keeps nothing.
	 * @prop noRejectMessages No message of its own for refused files; the page reports them from `reject`.
	 * @event files {File[]} All chosen files after every change (`dispatch`: the files of this pick or drop).
	 * @event reject {File[]} Refused files of a pick or drop: wrong type, too large, or more than one without `multiple`.
	 * @method reset {(): void} Clears the files, the messages and the native input; fires no event.
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
		mode,
		name,
		required = false,
		disabled = false,
		dropLabel,
		buttonLabel,
		removeLabel,
		listLabel,
		sizeError,
		typeError,
		countError,
		statusLabel,
		noRejectMessages = false
	} = $props();
	const host = $host();
	let files = $state<File[]>([]);
	let drop: ReturnType<typeof FileDrop> | undefined = $state();
	const dispatch = $derived(mode === 'dispatch');
	Object.defineProperty(host, 'files', {
		get: () => files,
		set: (next: unknown) => {
			const list = next instanceof FileList ? Array.from(next) : Array.isArray(next) ? next : [];
			files = list.filter((f): f is File => f instanceof File);
		},
		configurable: true
	});
	Object.defineProperty(host, 'reset', {
		value: () => {
			if (drop) drop.reset();
			else files = [];
		},
		configurable: true,
		writable: true
	});
	formControl(host, {
		anchor: () => inShadow<HTMLButtonElement>(host, 'button'),
		probe: () => ({ attrs: { type: 'file', required: required && !dispatch }, value: files.length > 0 ? 'x' : '' }),
		disabled: () => disabled
	});
	$effect(() => {
		const data = new FormData();
		if (name) for (const f of files) data.append(name, f);
		setFormValue(host, name && files.length && !dispatch ? data : null);
	});
	$effect(() => {
		const r = () => {
			if (drop) drop.reset();
			else files = [];
		};
		host.addEventListener('k-reset', r);
		return () => host.removeEventListener('k-reset', r);
	});
</script>

<FileDrop
	bind:this={drop}
	{label}
	{hint}
	{error}
	{accept}
	{multiple}
	{maxSize}
	{mode}
	{required}
	{disabled}
	{dropLabel}
	{buttonLabel}
	{removeLabel}
	{listLabel}
	{sizeError}
	{typeError}
	{countError}
	{statusLabel}
	rejectMessages={!noRejectMessages}
	bind:files
	onfiles={(f: File[]) => emit(host, 'files', f)}
	onreject={(f: File[]) => emit(host, 'reject', f)}
/>
