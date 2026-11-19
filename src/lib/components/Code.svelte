<script lang="ts">
	import { strings } from './strings.svelte.js';
	import type { Snippet } from 'svelte';
	import CopyButton from './CopyButton.svelte';
	import { fill } from './data-utils.js';

	interface Props {
		/** The code as text. Needed for line numbers and the copy button; `children` can replace it for plain content. */
		code?: string | undefined;
		/** `<pre><code>` box instead of inline `<code>`. */
		block?: boolean | undefined;
		/** Name of the language. Shown in the header and set as `language-…` class and `data-language` for outside highlighters. */
		language?: string | undefined;
		/** Block only, needs `code`. The numbers are not selectable and hidden from assistive technology. */
		lineNumbers?: boolean | undefined;
		/** Number of the first line. */
		startLine?: number | undefined;
		/** Block only: shows a button that copies the code. */
		copy?: boolean | undefined;
		copyLabel?: string | undefined;
		copiedLabel?: string | undefined;
		copyErrorLabel?: string | undefined;
		/** Accessible name of the block when it can scroll. Defaults to "<language> code" or "Code". */
		label?: string | undefined;
		/** Block only: shows `copyLabel` as text on the copy button instead of an icon-only button. */
		copyShowLabel?: boolean | undefined;
		/** Block only: no visible scrollbar (the block still scrolls by keyboard, wheel and touch). */
		hideScrollbar?: boolean | undefined;
		/** Called with the code after it was copied. */
		oncopy?: ((text: string) => void) | undefined;
		/** Called when copying failed (no clipboard, permission denied). */
		oncopyerror?: ((error: unknown) => void) | undefined;
		class?: string | undefined;
		children?: Snippet | undefined;
	}
	let {
		code,
		block = false,
		language,
		lineNumbers = false,
		startLine = 1,
		copy = false,
		copyLabel: copyLabelProp,
		copiedLabel: copiedLabelProp,
		copyErrorLabel: copyErrorLabelProp,
		label,
		copyShowLabel = false,
		hideScrollbar = false,
		oncopy,
		oncopyerror,
		class: cls = '',
		children
	}: Props = $props();
	const copyLabel = $derived(copyLabelProp ?? strings().code.copyLabel);
	const copiedLabel = $derived(copiedLabelProp ?? strings().code.copiedLabel);
	const copyErrorLabel = $derived(copyErrorLabelProp ?? strings().code.copyErrorLabel);

	/* One trailing newline is a line terminator, not an empty last line. */
	const text = $derived(code === undefined ? undefined : code.replace(/\r\n?/g, '\n').replace(/\n$/, ''));
	const first = $derived(Number.isFinite(startLine) ? Math.trunc(startLine) : 1);
	const numbers = $derived.by((): string => {
		if (!lineNumbers || text === undefined) return '';
		return text
			.split('\n')
			.map((_, i) => String(first + i))
			.join('\n');
	});
	const langClass = $derived(language ? `language-${language.replace(/[^\w+#.-]/g, '')}` : undefined);
	const regionLabel = $derived(label ?? (language ? fill(strings().code.languageLabel, { language }) : strings().code.label));
	const showHead = $derived(!!language || copy);

	let codeEl: HTMLElement | undefined = $state();
	let scroller: HTMLElement | undefined = $state();
	let inner: HTMLElement | undefined = $state();
	let scrollable = $state(false);

	/* A box that scrolls sideways must be reachable by keyboard. */
	$effect(() => {
		const el = scroller;
		if (!el) return;
		const measure = (): void => {
			scrollable = el.scrollWidth > el.clientWidth + 1;
		};
		measure();
		if (typeof ResizeObserver === 'undefined') return;
		const observer = new ResizeObserver(measure);
		observer.observe(el);
		if (inner) observer.observe(inner);
		return () => observer.disconnect();
	});

	const read = (): string => text ?? codeEl?.textContent ?? '';
</script>

{#if block}
	<div class="k-code-block {cls}">
		{#if showHead}
			<div class="head">
				{#if language}<span class="lang">{language}</span>{/if}
				{#if copy}
					<CopyButton
						getValue={read}
						size="sm"
						label={copyLabel}
						showLabel={copyShowLabel}
						{copiedLabel}
						errorLabel={copyErrorLabel}
						{oncopy}
						onerror={oncopyerror}
						class="copy"
					/>
				{/if}
			</div>
		{/if}
		<!-- Focusable and named only while it scrolls sideways, so keyboard users can reach the hidden part. -->
		<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
		<div
			class="scroll"
			class:no-bar={hideScrollbar}
			bind:this={scroller}
			tabindex={scrollable ? 0 : undefined}
			role={scrollable ? 'region' : undefined}
			aria-label={scrollable ? regionLabel : undefined}
		>
			<div class="inner" bind:this={inner}>
				{#if numbers}<span class="gutter" aria-hidden="true">{numbers}</span>{/if}
				<pre><code bind:this={codeEl} class={langClass} data-language={language}
						>{#if text !== undefined}{text}{:else}{@render children?.()}{/if}</code
					></pre>
			</div>
		</div>
	</div>
{:else}
	<code class="k-code inline {cls}" data-language={language}>
		{#if text !== undefined}{text}{:else}{@render children?.()}{/if}
	</code>
{/if}

<style>
	.k-code.inline {
		padding: 0.1em 0.4em;
		border: var(--k-border-w) solid var(--k-line);
		border-radius: min(var(--k-radius-badge), 6px);
		background: var(--k-bg-sunken);
		color: var(--k-fg-code);
		font-family: var(--k-font-mono);
		font-size: 0.9em;
		font-weight: 400;
		line-height: 1.4;
		letter-spacing: 0;
		text-transform: none;
		overflow-wrap: anywhere;
		-webkit-box-decoration-break: clone;
		box-decoration-break: clone;
	}

	.k-code-block {
		min-width: 0;
		max-width: 100%;
		overflow: hidden;
		border: var(--k-border-w) solid var(--k-line);
		border-radius: min(var(--k-radius-card), 16px);
		background: var(--k-bg-code);
		color: var(--k-fg-code);
		box-shadow: var(--k-shadow-raised);
		font-family: var(--k-font-mono);
		font-size: var(--k-text-sm);
		font-weight: 400;
		letter-spacing: 0;
		text-transform: none;
		line-height: 1.6;
	}
	.head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--k-space-3);
		min-height: 40px;
		padding: 0 var(--k-space-2) 0 var(--k-space-4);
		border-bottom: var(--k-border-w) solid var(--k-line);
		background: var(--k-bg-sunken);
	}
	.lang {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		color: var(--k-fg-muted);
		font-family: var(--k-label-font);
		font-size: var(--k-text-xs);
		font-weight: var(--k-weight-label);
		letter-spacing: var(--k-label-tracking);
		text-transform: var(--k-label-transform);
	}
	.head :global(.copy) {
		margin-inline-start: auto;
	}

	.scroll {
		overflow-x: auto;
		overflow-y: hidden;
		overscroll-behavior-x: contain;
	}
	.scroll.no-bar {
		scrollbar-width: none;
	}
	.scroll.no-bar::-webkit-scrollbar {
		display: none;
	}
	.scroll:focus-visible {
		outline: var(--k-focus-w) solid var(--k-focus);
		outline-offset: calc(var(--k-focus-w) * -1);
	}
	.inner {
		display: flex;
		width: max-content;
		min-width: 100%;
	}
	pre {
		flex: 1 0 auto;
		margin: 0;
		padding: var(--k-space-4);
		font: inherit;
		white-space: pre;
		tab-size: 2;
	}
	code {
		font: inherit;
	}
	.gutter {
		position: sticky;
		left: 0;
		z-index: 1;
		flex: none;
		padding: var(--k-space-4) var(--k-space-3) var(--k-space-4) var(--k-space-4);
		border-right: var(--k-border-w) solid var(--k-line);
		background: var(--k-bg-code);
		color: var(--k-fg-muted);
		text-align: right;
		white-space: pre;
		font-variant-numeric: tabular-nums;
		user-select: none;
		-webkit-user-select: none;
	}
	.gutter + pre {
		padding-left: var(--k-space-4);
	}
	@media (forced-colors: active) {
		.k-code.inline,
		.k-code-block,
		.head,
		.gutter {
			border-color: CanvasText;
		}
		.scroll:focus-visible {
			outline-color: Highlight;
		}
	}
</style>
