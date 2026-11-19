<script lang="ts">
	import type { Snippet } from 'svelte';
	import Link from './Link.svelte';
	import { parseProse } from './prose.js';

	interface Props {
		/**
		 * Plain text: blank lines separate paragraphs, line breaks stay, and web and e-mail addresses
		 * become links (external ones open in a new tab with `rel="noopener noreferrer"`). The text is
		 * never read as HTML. Without `text`, the children are set in the same typography.
		 */
		text?: string | null | undefined;
		/** Read after external links in `text`. Default: "(opens in a new tab)" (see the strings catalogue). */
		externalLabel?: string | undefined;
		class?: string | undefined;
		/** Your own markup (headings, paragraphs, lists, links), used when `text` is not set. */
		children?: Snippet | undefined;
	}
	let { text, externalLabel, class: cls = '', children }: Props = $props();
	const paragraphs = $derived(parseProse(text));
</script>

<div class="k-prose {cls}">
	{#if text !== undefined && text !== null}
		{#each paragraphs as lines, p (p)}
			<p>
				{#each lines as segments, l (l)}{#if l > 0}<br />{/if}{#each segments as s, i (i)}{#if s.type === 'link'}<Link
								href={s.href}
								external={s.external}
								{externalLabel}
							>
								{s.text}
							</Link>{:else}{s.text}{/if}{/each}{/each}
			</p>
		{/each}
	{:else}
		{@render children?.()}
	{/if}
</div>

<style>
	/*
	 * Typography for long running text. Everything comes from tokens: --k-prose-measure (line length),
	 * --k-prose-leading and --k-prose-gap (space between blocks). The rules apply to your own markup
	 * inside the block and, in the custom element, to the elements placed directly in <k-prose>
	 * (a shadow root cannot style deeper than that: use <k-link> or style the rest on the page).
	 */
	.k-prose {
		max-inline-size: var(--k-prose-measure);
		color: var(--k-fg-soft);
		font-family: var(--k-font-sans);
		font-size: var(--k-text-md);
		line-height: var(--k-prose-leading);
		overflow-wrap: anywhere;
	}
	.k-prose :global(:is(p, ul, ol, blockquote, pre, hr)),
	:global(.k-prose > slot::slotted(:is(p, ul, ol, blockquote, pre, hr))) {
		margin-block: 0 var(--k-prose-gap);
	}
	.k-prose :global(:is(h1, h2, h3, h4)),
	:global(.k-prose > slot::slotted(:is(h1, h2, h3, h4))) {
		margin-block: calc(var(--k-prose-gap) * 2) var(--k-prose-gap);
		color: var(--k-fg);
		font-family: var(--k-font-display);
		font-weight: var(--k-weight-heading);
		line-height: 1.25;
		text-wrap: balance;
	}
	.k-prose :global(h1),
	:global(.k-prose > slot::slotted(h1)) {
		font-size: var(--k-text-xl);
	}
	.k-prose :global(h2),
	:global(.k-prose > slot::slotted(h2)) {
		font-size: var(--k-text-lg);
	}
	.k-prose :global(:is(h3, h4)),
	:global(.k-prose > slot::slotted(:is(h3, h4))) {
		font-size: var(--k-text-md);
	}
	.k-prose :global(:is(ul, ol)),
	:global(.k-prose > slot::slotted(:is(ul, ol))) {
		padding-inline-start: 1.5em;
	}
	.k-prose :global(li + li) {
		margin-block-start: calc(var(--k-prose-gap) / 3);
	}
	.k-prose :global(blockquote),
	:global(.k-prose > slot::slotted(blockquote)) {
		padding-inline-start: var(--k-space-4);
		border-inline-start: var(--k-border-w) solid var(--k-line-strong);
		color: var(--k-fg-muted);
	}
	.k-prose :global(hr),
	:global(.k-prose > slot::slotted(hr)) {
		border: 0;
		border-block-start: var(--k-border-w) solid var(--k-line-strong);
	}
	.k-prose :global(:is(code, kbd, samp)) {
		padding: 0 0.25em;
		border-radius: var(--k-radius-badge);
		background: var(--k-bg-sunken);
		font-family: var(--k-font-mono);
		font-size: 0.9em;
	}
	/* Links in your own markup look like <Link>; the ones made from `text` are <Link> already. */
	.k-prose :global(a),
	:global(.k-prose > slot::slotted(a)) {
		color: var(--k-link);
		text-decoration: underline;
		text-underline-offset: 0.18em;
		text-decoration-thickness: 1px;
		border-radius: 2px;
	}
	.k-prose :global(a:hover),
	:global(.k-prose > slot::slotted(a:hover)) {
		text-decoration-thickness: 2px;
	}
	.k-prose :global(a:focus-visible),
	:global(.k-prose > slot::slotted(a:focus-visible)) {
		outline: var(--k-focus-w) solid var(--k-focus);
		outline-offset: var(--k-focus-offset);
	}
	.k-prose > :global(:first-child),
	:global(.k-prose > slot::slotted(:first-child)) {
		margin-block-start: 0;
	}
	.k-prose > :global(:last-child),
	:global(.k-prose > slot::slotted(:last-child)) {
		margin-block-end: 0;
	}
	@media (forced-colors: active) {
		.k-prose :global(a),
		:global(.k-prose > slot::slotted(a)) {
			color: LinkText;
		}
	}
</style>
