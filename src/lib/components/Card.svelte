<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title?: string;
		description?: string;
		/** Heading level of the title. */
		level?: 2 | 3 | 4;
		/** `raised` = on bg-raised, `sunken` = recessed, `outline` = border only. */
		look?: 'raised' | 'sunken' | 'outline';
		/** Makes the whole card a link. */
		href?: string;
		/** Content above the title, e.g. an image or motif. */
		media?: Snippet;
		/** Row of actions at the bottom. */
		footer?: Snippet;
		class?: string;
		children?: Snippet;
	}
	let { title, description, level = 3, look = 'raised', href, media, footer, class: cls = '', children }: Props = $props();
</script>

<article class="k-card {cls}" data-look={look} class:linked={!!href}>
	{#if media}<div class="media">{@render media()}</div>{/if}
	{#if title || description}
		<header>
			{#if title}
				<svelte:element this={`h${level}`} class="title">
					{#if href}<a {href}>{title}</a>{:else}{title}{/if}
				</svelte:element>
			{/if}
			{#if description}<p class="desc">{description}</p>{/if}
		</header>
	{/if}
	{#if children}<div class="body">{@render children()}</div>{/if}
	{#if footer}<footer>{@render footer()}</footer>{/if}
</article>

<style>
	.k-card {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: var(--k-space-4);
		padding: var(--k-space-6);
		border: var(--k-border-w) solid var(--k-line);
		border-radius: var(--k-radius-card);
		background: var(--k-bg-raised);
		color: var(--k-fg);
		box-shadow: var(--k-shadow-raised);
		min-width: 0;
	}
	[data-look='sunken'] { background: var(--k-bg-sunken); box-shadow: none; }
	[data-look='outline'] { background: transparent; box-shadow: none; }
	.media { margin: calc(var(--k-space-6) * -1) calc(var(--k-space-6) * -1) 0; overflow: hidden; border-radius: var(--k-radius-card) var(--k-radius-card) 0 0; }
	.media :global(img) { display: block; width: 100%; height: auto; }
	header { display: grid; gap: var(--k-space-2); }
	.title { margin: 0; font-family: var(--k-font-sans); font-size: var(--k-text-lg); font-weight: var(--k-weight-heading); line-height: 1.3; }
	.title a { color: inherit; text-decoration: none; }
	.title a::after { content: ''; position: absolute; inset: 0; border-radius: inherit; }
	.title a:focus-visible { outline: none; }
	.linked:has(a:focus-visible) { outline: var(--k-focus-w) solid var(--k-focus); outline-offset: var(--k-focus-offset); }
	.linked { transition: border-color var(--k-dur) var(--k-ease), transform var(--k-dur) var(--k-ease); }
	.linked:hover { border-color: var(--k-accent); }
	.desc { margin: 0; color: var(--k-fg-muted); font-size: var(--k-text-sm); }
	.body { display: grid; gap: var(--k-space-3); }
	footer { display: flex; flex-wrap: wrap; gap: var(--k-space-3); margin-top: auto; position: relative; z-index: 1; }
</style>
