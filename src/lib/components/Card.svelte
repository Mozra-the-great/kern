<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes, HTMLButtonAttributes } from 'svelte/elements';

	interface Props extends Omit<HTMLAttributes<HTMLElement>, 'title' | 'class' | 'children' | 'onclick'> {
		/** Heading text. Without it the card has no heading (no empty `<hN>`). */
		title?: string | undefined;
		description?: string | undefined;
		/** Heading level of the title. */
		level?: 2 | 3 | 4 | undefined;
		/** `raised` = on bg-raised, `sunken` = recessed, `outline` = border only. */
		look?: 'raised' | 'sunken' | 'outline' | undefined;
		/**
		 * Root element. `article` (default) for a self-contained item, `section` for a part of the page,
		 * `div` for plain grouping, `li` for a card that is an item of a `<ul>`/`<ol>`.
		 */
		as?: 'article' | 'section' | 'div' | 'li' | undefined;
		/** Makes the whole card a link: the title becomes a link whose hit area covers the card. */
		href?: string | undefined;
		/**
		 * Makes the whole card open something: the title becomes a `<button>` whose hit area covers the
		 * card (Enter and Space work). Without `href` only; other actions in `footer`, `badges` and the
		 * content stay separate controls above it, never inside it.
		 */
		onclick?: ((event: MouseEvent) => void) | undefined;
		/**
		 * Accessible name of the card's link or button. Default: the title (then `description`). Keep the
		 * visible title in it, e.g. "Edit Ruby Red" for the title "Ruby Red".
		 */
		actionLabel?: string | undefined;
		/** `aria-haspopup` of the card's button, e.g. `dialog` when it opens one. */
		actionHaspopup?: HTMLButtonAttributes['aria-haspopup'];
		/** Dimmed look for an item that is used up, gone or archived. Only visual: say it in the content too. */
		muted?: boolean | undefined;
		/** Content above the title, e.g. an image or motif. */
		media?: Snippet | undefined;
		/** Small markers in the top corner (count, state); controls in it stay clickable. */
		badges?: Snippet | undefined;
		/** Row of actions at the bottom. */
		footer?: Snippet | undefined;
		class?: string | undefined;
		children?: Snippet | undefined;
	}
	let {
		title,
		description,
		level = 3,
		look = 'raised',
		as = 'article',
		href,
		onclick,
		actionLabel,
		actionHaspopup,
		muted = false,
		media,
		badges,
		footer,
		class: cls = '',
		children,
		...rest
	}: Props = $props();
	const action = $derived(href ? 'link' : onclick ? 'button' : undefined);
	const name = $derived(actionLabel ?? (title ? undefined : description || 'Open'));
</script>

<svelte:element this={as} {...rest} class="k-card {cls}" data-look={look} class:linked={!!action} class:muted>
	{#if media}<div class="media">{@render media()}</div>{/if}
	{#if action && !title}
		{#if action === 'link'}
			<a class="primary cover" {href} aria-label={name} {onclick}></a>
		{:else}
			<button type="button" class="primary cover" aria-label={name} aria-haspopup={actionHaspopup} {onclick}></button>
		{/if}
	{/if}
	{#if title || description}
		<header>
			{#if title}
				<svelte:element this={`h${level}`} class="title">
					{#if action === 'link'}
						<a class="primary" {href} aria-label={actionLabel} {onclick}>{title}</a>
					{:else if action === 'button'}
						<button type="button" class="primary" aria-label={actionLabel} aria-haspopup={actionHaspopup} {onclick}>{title}</button>
					{:else}
						{title}
					{/if}
				</svelte:element>
			{/if}
			{#if description}<p class="desc">{description}</p>{/if}
		</header>
	{/if}
	{#if badges}<div class="badges">{@render badges()}</div>{/if}
	{#if children}<div class="body">{@render children()}</div>{/if}
	{#if footer}<footer>{@render footer()}</footer>{/if}
</svelte:element>

<style>
	.k-card {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: var(--k-space-4);
		padding: var(--k-space-6);
		border: var(--k-border-w) solid var(--k-line-strong);
		border-radius: var(--k-radius-card);
		background: var(--k-bg-raised);
		color: var(--k-fg);
		box-shadow: var(--k-shadow-raised);
		min-width: 0;
	}
	li.k-card {
		list-style: none;
	}
	[data-look='sunken'] {
		background: var(--k-bg-sunken);
		box-shadow: none;
	}
	[data-look='outline'] {
		background: transparent;
		box-shadow: none;
	}
	.media {
		margin: calc(var(--k-space-6) * -1) calc(var(--k-space-6) * -1) 0;
		overflow: hidden;
		border-radius: var(--k-radius-card) var(--k-radius-card) 0 0;
	}
	.media :global(img) {
		display: block;
		width: 100%;
		height: auto;
	}
	header {
		display: grid;
		gap: var(--k-space-2);
	}
	.title {
		margin: 0;
		font-family: var(--k-font-sans);
		font-size: var(--k-text-lg);
		font-weight: var(--k-weight-heading);
		line-height: 1.3;
	}
	/* The card's link or button: plain text, its ::after covers the whole card. */
	.primary {
		margin: 0;
		padding: 0;
		border: 0;
		background: none;
		color: inherit;
		font: inherit;
		text-align: inherit;
		text-decoration: none;
		cursor: pointer;
	}
	.primary::after {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: inherit;
	}
	.cover {
		position: absolute;
		inset: 0;
		border-radius: inherit;
	}
	.primary:focus-visible {
		outline: none;
	}
	.linked:has(.primary:focus-visible) {
		outline: var(--k-focus-w) solid var(--k-focus);
		outline-offset: var(--k-focus-offset);
	}
	.linked {
		transition:
			border-color var(--k-dur) var(--k-ease),
			transform var(--k-dur) var(--k-ease);
	}
	.linked:hover {
		border-color: var(--k-accent-mark);
	}
	/* Controls in the content stay clickable above the card's hit area. */
	.linked .body :global(:is(a[href], button, input, select, textarea, label, summary, [tabindex]:not([tabindex='-1']))) {
		position: relative;
		z-index: 1;
	}
	.desc {
		margin: 0;
		color: var(--k-fg-muted);
		font-size: var(--k-text-sm);
	}
	.badges {
		position: absolute;
		top: var(--k-space-3);
		right: var(--k-space-3);
		z-index: 2;
		display: flex;
		flex-wrap: wrap;
		justify-content: flex-end;
		gap: var(--k-space-1);
		max-width: calc(100% - 2 * var(--k-space-3));
	}
	/* Without media there is no free corner: the badges sit in the flow, under the title. */
	.k-card:not(:has(> .media)) > .badges {
		position: relative;
		top: auto;
		right: auto;
		justify-content: flex-start;
		max-width: none;
	}
	.body {
		display: grid;
		gap: var(--k-space-3);
	}
	footer {
		display: flex;
		flex-wrap: wrap;
		gap: var(--k-space-3);
		margin-top: auto;
		position: relative;
		z-index: 1;
	}
	.muted {
		border-style: dashed;
		box-shadow: none;
	}
	.muted .media {
		opacity: 0.55;
		filter: grayscale(1);
	}
	.muted .title {
		color: var(--k-fg-muted);
	}
	@media (forced-colors: active) {
		.linked:has(.primary:focus-visible) {
			outline-color: Highlight;
		}
	}
</style>
