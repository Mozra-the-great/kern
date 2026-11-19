<svelte:options
	customElement={{
		props: {
			value: { type: 'String' },
			label: { type: 'String' },
			copiedLabel: { type: 'String', attribute: 'copied-label' },
			errorLabel: { type: 'String', attribute: 'error-label' },
			variant: { type: 'String' },
			size: { type: 'String' },
			resetAfter: { type: 'Number', attribute: 'reset-after' },
			disabled: { type: 'Boolean' }
		}
	}}
/>

<script lang="ts">
	/**
	 * @event copy {string} The copied text.
	 * @event copy-error Copying failed.
	 */
	import CopyButton from '../lib/components/CopyButton.svelte';
	import { emit } from './form.js';
	/* Fires `copy` (detail = the copied text) and `copy-error`. */
	let { value = '', label, copiedLabel, errorLabel, variant, size, resetAfter, disabled = false } = $props();
	const host = $host();
</script>

<CopyButton
	{value}
	{label}
	{copiedLabel}
	{errorLabel}
	{variant}
	{size}
	{resetAfter}
	{disabled}
	oncopy={(text: string) => emit(host, 'copy', text)}
	onerror={() => emit(host, 'copy-error')}
/>

<style>
	:host {
		display: inline-flex;
	}
</style>
