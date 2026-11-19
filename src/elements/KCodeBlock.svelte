<svelte:options
	customElement={{
		props: {
			code: { type: 'String' },
			label: { type: 'String' },
			language: { type: 'String' },
			lineNumbers: { type: 'Boolean', attribute: 'line-numbers' },
			startLine: { type: 'Number', attribute: 'start-line' },
			copy: { type: 'Boolean' },
			copyLabel: { type: 'String', attribute: 'copy-label' },
			copiedLabel: { type: 'String', attribute: 'copied-label' },
			copyErrorLabel: { type: 'String', attribute: 'copy-error-label' },
			copyIcon: { type: 'Boolean', attribute: 'copy-icon' },
			showScrollbar: { type: 'Boolean', attribute: 'show-scrollbar' }
		}
	}}
/>

<script lang="ts">
	/**
	 * Code block (stuffcloud's CodeBlock): the `code` attribute or the element's text (dedented, follows
	 * later changes) in a box that scrolls sideways without a visible scrollbar and is focusable while it
	 * scrolls. A copy button with visible text appears with `copy-label` or `copy`; the result is
	 * announced in a polite live region.
	 * @prop copy {boolean} Shows the copy button. Default: on when `copy-label` is set.
	 * @prop copyIcon {boolean} Icon-only copy button (`copy-label` becomes its accessible name).
	 * @prop showScrollbar {boolean} Keeps the scrollbar visible.
	 * @event copy {string} The copied text.
	 * @event copy-error Copying failed (no clipboard, permission denied).
	 */
	import CodeBlock from '../lib/components/CodeBlock.svelte';
	import { emit } from './form.js';
	import { dedent, watchText } from './text.js';
	let {
		code,
		label,
		language,
		lineNumbers = false,
		startLine,
		copy,
		copyLabel,
		copiedLabel,
		copyErrorLabel,
		copyIcon = false,
		showScrollbar = false
	} = $props();
	const host = $host();
	let hostText = $state(dedent(host.textContent ?? ''));
	$effect(() => watchText(host, (text) => (hostText = text)));
</script>

<CodeBlock
	code={code ?? hostText}
	{label}
	{language}
	{lineNumbers}
	{startLine}
	{copy}
	{copyLabel}
	{copiedLabel}
	{copyErrorLabel}
	showCopyLabel={!copyIcon}
	hideScrollbar={!showScrollbar}
	oncopy={(copied: boolean, text: string) => {
		if (copied) emit(host, 'copy', text);
		else emit(host, 'copy-error');
	}}
/>

<style>
	:host {
		display: block;
		min-width: 0;
	}
</style>
