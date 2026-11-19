<svelte:options customElement={{ tag: 'k-code', props: { code: { type: 'String' }, block: { type: 'Boolean' }, language: { type: 'String' }, lineNumbers: { type: 'Boolean', attribute: 'line-numbers' }, startLine: { type: 'Number', attribute: 'start-line' }, copy: { type: 'Boolean' }, copyLabel: { type: 'String', attribute: 'copy-label' }, copiedLabel: { type: 'String', attribute: 'copied-label' }, copyErrorLabel: { type: 'String', attribute: 'copy-error-label' }, label: { type: 'String' } } }} />
<script lang="ts">
	import Code from '../lib/components/Code.svelte';
	import { emit } from './form.js';
	/*
	 * Inline: the slot is the code. Block (or a `code` attribute): the text of the element is the code,
	 * dedented, and follows later changes of the light DOM. Fires `copy` (detail = the copied text).
	 */
	let { code, block = false, language, lineNumbers = false, startLine, copy = false, copyLabel, copiedLabel, copyErrorLabel, label } = $props();
	const host = $host();

	function dedent(raw: string): string {
		const lines = raw.replace(/\r\n?/g, '\n').split('\n');
		while (lines.length > 0 && lines[0].trim() === '') lines.shift();
		while (lines.length > 0 && lines[lines.length - 1].trim() === '') lines.pop();
		const indents = lines.filter((l) => l.trim() !== '').map((l) => (/^[ \t]*/.exec(l) ?? [''])[0].length);
		const cut = indents.length > 0 ? Math.min(...indents) : 0;
		return lines.map((l) => l.slice(cut)).join('\n');
	}
	let hostText = $state(dedent(host.textContent ?? ''));
	$effect(() => {
		const read = () => (hostText = dedent(host.textContent ?? ''));
		read();
		const observer = new MutationObserver(read);
		observer.observe(host, { childList: true, characterData: true, subtree: true });
		return () => observer.disconnect();
	});
	const fromText = $derived(block || code !== undefined);
</script>
{#snippet slotted()}{#if !fromText}<slot />{/if}{/snippet}
<Code code={fromText ? (code ?? hostText) : undefined} {block} {language} {lineNumbers} {startLine} {copy} {copyLabel} {copiedLabel} {copyErrorLabel} {label} oncopy={(text: string) => emit(host, 'copy', text)} children={fromText ? undefined : slotted} />
<style>
	:host { display: inline; min-width: 0; }
	:host([block]) { display: block; }
</style>
