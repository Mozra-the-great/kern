<script lang="ts">
	import Code from './Code.svelte';

	interface Props {
		/** The code, shown as text (markup is never interpreted). */
		code: string;
		/** Accessible name of the code region while it scrolls. Defaults to "<language> code" or "Code". */
		label?: string | undefined;
		/** Name of the language: shown in the header, `language-…` class for outside highlighters. */
		language?: string | undefined;
		lineNumbers?: boolean | undefined;
		startLine?: number | undefined;
		/** Shows the copy button. Default: on when `copyLabel` is set (stuffcloud), else off. */
		copy?: boolean | undefined;
		/** Visible text of the copy button. Default "Copy". */
		copyLabel?: string | undefined;
		/**
		 * Accessible name of the copy button when it should say more than `copyLabel`, e.g. `copyLabel` "Copy" and
		 * `copyAccessibleLabel` "Copy command" on a page with several blocks. It is the button's `aria-label`, with and without
		 * `showCopyLabel` (icon-only: also the tooltip), and wins over `copyLabel` as the name; `copyLabel` stays the visible text.
		 * WCAG 2.5.3 (Label in Name): with `showCopyLabel` (the default) it must contain the visible `copyLabel`. Empty,
		 * whitespace-only or `null` counts as not set. The spoken results (`copiedLabel`, `copyErrorLabel`) are not affected.
		 */
		copyAccessibleLabel?: string | undefined;
		/** Announced after a successful copy. Default "Copied". */
		copiedLabel?: string | undefined;
		/** Announced when copying failed. Default "Copy failed". */
		copyErrorLabel?: string | undefined;
		/** `false`: an icon-only copy button with `copyLabel` as its name. Default true. */
		showCopyLabel?: boolean | undefined;
		/** `false` keeps the scrollbar visible. Default true (stuffcloud: no visible scrollbar). */
		hideScrollbar?: boolean | undefined;
		/** Called after every copy attempt: `true` when the code is on the clipboard. */
		oncopy?: ((copied: boolean, text: string) => void) | undefined;
		class?: string | undefined;
	}
	let {
		code,
		label,
		language,
		lineNumbers,
		startLine,
		copy,
		copyLabel,
		copyAccessibleLabel,
		copiedLabel,
		copyErrorLabel,
		showCopyLabel = true,
		hideScrollbar = true,
		oncopy,
		class: cls
	}: Props = $props();
	const withCopy = $derived(copy ?? copyLabel !== undefined);
</script>

<!-- stuffcloud's CodeBlock on top of Code: a block with a text copy button and no visible scrollbar. -->
<Code
	block
	{code}
	{label}
	{language}
	{lineNumbers}
	{startLine}
	copy={withCopy}
	{copyLabel}
	{copyAccessibleLabel}
	{copiedLabel}
	{copyErrorLabel}
	copyShowLabel={showCopyLabel}
	{hideScrollbar}
	oncopy={(text: string) => oncopy?.(true, text)}
	oncopyerror={() => oncopy?.(false, code)}
	class={cls}
/>
