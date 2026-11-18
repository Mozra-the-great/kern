<svelte:options customElement={{ tag: 'k-file-drop', props: { label: { type: "String" }, hint: { type: "String" }, error: { type: "String" }, accept: { type: "String" }, multiple: { type: "Boolean" }, maxSize: { type: 'Number', attribute: 'max-size' }, name: { type: "String" }, required: { type: "Boolean" }, disabled: { type: "Boolean" }, dropLabel: { type: 'String', attribute: 'drop-label' }, removeLabel: { type: 'String', attribute: 'remove-label' }, listLabel: { type: 'String', attribute: 'list-label' }, sizeError: { type: 'String', attribute: 'size-error' }, typeError: { type: 'String', attribute: 'type-error' }, countError: { type: 'String', attribute: 'count-error' }, statusLabel: { type: 'String', attribute: 'status-label' } }, extend: formAssociated }} />
<script lang="ts">
	import FileDrop from '../lib/components/FileDrop.svelte';
	import { formAssociated, emit } from './form.js';
	/* The chosen files are the read-only property `el.files`; the "files" event carries them as detail. */
	let { label, hint, error, accept, multiple = false, maxSize, name, required = false, disabled = false, dropLabel, removeLabel, listLabel, sizeError, typeError, countError, statusLabel } = $props();
	const host = $host();
	let files = $state<File[]>([]);
	Object.defineProperty(host, 'files', { get: () => files, configurable: true });
	$effect(() => {
		const data = new FormData();
		if (name) for (const f of files) data.append(name, f);
		(host as any).internals?.setFormValue(name && files.length ? data : null);
	});
	$effect(() => { const r = () => (files = []); host.addEventListener('k-reset', r); return () => host.removeEventListener('k-reset', r); });
</script>
<FileDrop {label} {hint} {error} {accept} {multiple} {maxSize} {required} {disabled} {dropLabel} {removeLabel} {listLabel} {sizeError} {typeError} {countError} {statusLabel} bind:files onfiles={(f: File[]) => emit(host, 'files', f)} />
