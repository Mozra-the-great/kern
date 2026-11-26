<svelte:options
	customElement={{
		props: {
			code: { type: 'String' },
			block: { type: 'Boolean' },
			language: { type: 'String' },
			lineNumbers: { type: 'Boolean', attribute: 'line-numbers' },
			startLine: { type: 'Number', attribute: 'start-line' },
			copy: { type: 'Boolean' },
			copyLabel: { type: 'String', attribute: 'copy-label' },
			copyAccessibleLabel: { type: 'String', attribute: 'copy-accessible-label' },
			copiedLabel: { type: 'String', attribute: 'copied-label' },
			copyErrorLabel: { type: 'String', attribute: 'copy-error-label' },
			label: { type: 'String' }
		}
	}}
/>

<script lang="ts">
	/**
	 * Block only: `copy-accessible-label` is the copy button's accessible name when it should say more than `copy-label`.
	 * @event copy {string} The copied text.
	 */
	import Code from '../lib/components/Code.svelte';
	import { emit } from './form.js';
	import { dedent, watchText } from './text.js';
	/*
	 * Inline: the slot is the code. Block (or a `code` attribute): the text of the element is the code,
	 * dedented, and follows later changes of the light DOM. Fires `copy` (detail = the copied text).
	 */
	let {
		code,
		block = false,
		language,
		lineNumbers = false,
		startLine,
		copy = false,
		copyLabel,
		copyAccessibleLabel,
		copiedLabel,
		copyErrorLabel,
		label
	} = $props();
	const host = $host();

	let hostText = $state(dedent(host.textContent ?? ''));
	$effect(() => watchText(host, (text) => (hostText = text)));
	const fromText = $derived(block || code !== undefined);
</script>

{#snippet slotted()}{#if !fromText}<slot />{/if}{/snippet}
<Code
	code={fromText ? (code ?? hostText) : undefined}
	{block}
	{language}
	{lineNumbers}
	{startLine}
	{copy}
	{copyLabel}
	{copyAccessibleLabel}
	{copiedLabel}
	{copyErrorLabel}
	{label}
	oncopy={(text: string) => emit(host, 'copy', text)}
	children={fromText ? undefined : slotted}
/>

<style>
	:host {
		display: inline;
		min-width: 0;
	}
	:host([block]) {
		display: block;
	}
</style>
