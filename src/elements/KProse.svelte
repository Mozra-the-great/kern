<svelte:options
	customElement={{
		props: {
			text: { type: 'String' },
			externalLabel: { type: 'String', attribute: 'external-label' }
		}
	}}
/>

<script lang="ts">
	/**
	 * Typography for long running text, e.g. legal pages. Set `text` (plain text: blank lines make
	 * paragraphs, web and e-mail addresses become links, nothing is read as HTML) or place your own
	 * markup inside. Line length, leading and spacing come from `--k-prose-*` tokens. A shadow root can
	 * style only the elements placed directly inside (headings, paragraphs, lists, links); nested
	 * markup keeps the page's own styles.
	 */
	import Prose from '../lib/components/Prose.svelte';
	let { text, externalLabel } = $props();
	const fromText = $derived(text !== undefined && text !== null);
</script>

{#snippet slotted()}{#if !fromText}<slot />{/if}{/snippet}
<Prose text={text ?? undefined} externalLabel={externalLabel ?? undefined} children={fromText ? undefined : slotted} />

<style>
	:host {
		display: block;
	}
</style>
