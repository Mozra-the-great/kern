<svelte:options
	customElement={{
		props: {
			text: { type: 'String' },
			value: { type: 'String' },
			label: { type: 'String' },
			showLabel: { type: 'Boolean', attribute: 'show-label' },
			accessibleLabel: { type: 'String', attribute: 'accessible-label' },
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
	 * Copies `text` (or `value`) to the clipboard and announces the result in a polite live region, once
	 * per click; the message stays until the next click. `show-label` shows `label` as visible text; `accessible-label` is
	 * the longer accessible name (it must contain the visible `label`, WCAG 2.5.3) and wins over `label` as the name.
	 * @event copy {string} The copied text.
	 * @event copy-error Copying failed.
	 */
	import CopyButton from '../lib/components/CopyButton.svelte';
	import { emit } from './form.js';
	let {
		text,
		value = '',
		label,
		showLabel = false,
		accessibleLabel,
		copiedLabel,
		errorLabel,
		variant,
		size,
		resetAfter,
		disabled = false
	} = $props();
	const host = $host();
</script>

<CopyButton
	{text}
	{value}
	{label}
	{showLabel}
	{accessibleLabel}
	{copiedLabel}
	{errorLabel}
	{variant}
	{size}
	{resetAfter}
	{disabled}
	oncopy={(copied: string) => emit(host, 'copy', copied)}
	onerror={() => emit(host, 'copy-error')}
/>

<style>
	:host {
		display: inline-flex;
	}
</style>
