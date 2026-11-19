<script lang="ts" module>
	import type { TabBadgeFields } from './TabBadge.svelte';

	export interface TabLinkItem extends TabBadgeFields {
		href: string;
		label: string;
		/** The link of the page the visitor is on (`aria-current="page"`). */
		current?: boolean | undefined;
	}
</script>

<script lang="ts">
	import TabBadge, { tabName } from './TabBadge.svelte';
	import { watchScrollFade, type ScrollFade } from './scroll-fade.js';

	interface Props {
		links: TabLinkItem[];
		/** Accessible name of the navigation landmark, e.g. "Sections". */
		label: string;
		/** Same looks as Tabs: `line` = underline marker, `pill` = filled segment. */
		look?: 'line' | 'pill' | undefined;
		/**
		 * The user follows a link with a plain primary click (no modifier key, so not "open in new
		 * tab"). Call `event.preventDefault()` to route on the client instead of loading the page.
		 */
		onnavigate?: ((link: TabLinkItem, event: MouseEvent) => void) | undefined;
		class?: string | undefined;
	}
	let { links, label, look = 'line', onnavigate, class: cls = '' }: Props = $props();

	function onclick(link: TabLinkItem, e: MouseEvent) {
		if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
		onnavigate?.(link, e);
	}

	let strip: HTMLElement | undefined = $state();
	let fade: ScrollFade = $state({ start: false, end: false });
	$effect(() => {
		if (strip) return watchScrollFade(strip, (next) => (fade = next));
	});
</script>

<!-- Links styled like Tabs: plain links in Tab order, no tablist roles and no arrow keys. -->
<nav class="k-tab-links {cls}" data-look={look} aria-label={label}>
	<div class="list" bind:this={strip} data-fade-start={fade.start ? '' : undefined} data-fade-end={fade.end ? '' : undefined}>
		{#each links as link, i (`${i}:${link.href}`)}
			<a
				href={link.href}
				aria-current={link.current ? 'page' : undefined}
				aria-label={tabName(link.label, link)}
				onclick={(e) => onclick(link, e)}
			>
				<!-- The space keeps label and badge apart in the text (axe: label in name). -->
				<span class="text">{link.label}</span>
				<TabBadge item={link} />
			</a>
		{/each}
	</div>
</nav>

<style>
	/* Keep in step with Tabs.svelte (same look; tests/elements/navigation.spec.ts compares them). */
	.k-tab-links {
		min-width: 0;
	}
	.list {
		display: flex;
		gap: var(--k-space-1);
		overflow-x: auto;
		scrollbar-width: thin;
	}
	.list[data-fade-end] {
		mask-image: linear-gradient(90deg, #000 calc(100% - 36px), transparent);
	}
	.list[data-fade-start] {
		mask-image: linear-gradient(90deg, transparent, #000 36px);
	}
	.list[data-fade-start][data-fade-end] {
		mask-image: linear-gradient(90deg, transparent, #000 36px, #000 calc(100% - 36px), transparent);
	}
	.list:dir(rtl)[data-fade-end] {
		mask-image: linear-gradient(270deg, #000 calc(100% - 36px), transparent);
	}
	.list:dir(rtl)[data-fade-start] {
		mask-image: linear-gradient(270deg, transparent, #000 36px);
	}
	.list:dir(rtl)[data-fade-start][data-fade-end] {
		mask-image: linear-gradient(270deg, transparent, #000 36px, #000 calc(100% - 36px), transparent);
	}
	[data-look='line'] .list {
		border-bottom: var(--k-border-w) solid var(--k-line);
	}
	a {
		position: relative;
		flex: none;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--k-space-2);
		box-sizing: border-box;
		min-height: var(--k-control-h);
		padding: 0 var(--k-space-4);
		border: 0;
		background: transparent;
		color: var(--k-fg-muted);
		font-family: var(--k-label-font);
		font-size: var(--k-label-size);
		font-weight: var(--k-weight-label);
		text-transform: var(--k-label-transform);
		letter-spacing: var(--k-label-tracking);
		line-height: normal;
		text-decoration: none;
		white-space: nowrap;
		cursor: pointer;
		transition:
			color var(--k-dur) var(--k-ease),
			background-color var(--k-dur) var(--k-ease),
			box-shadow var(--k-dur) var(--k-ease);
	}
	a:hover {
		color: var(--k-fg);
	}
	/* The strip scrolls and would clip an outer ring: draw it inside. */
	a:focus-visible {
		outline: var(--k-focus-w) solid var(--k-focus);
		outline-offset: calc(var(--k-focus-w) * -1);
	}
	[data-look='line'] a {
		margin-bottom: calc(var(--k-border-w) * -1);
		box-shadow: inset 0 -2px 0 transparent;
	}
	[data-look='line'] a[aria-current='page'] {
		color: var(--k-fg);
		box-shadow: inset 0 -2px 0 var(--k-accent-mark);
	}
	[data-look='pill'] .list {
		padding: var(--k-space-1);
		background: var(--k-bg-sunken);
		border-radius: var(--k-radius-control);
		width: fit-content;
		max-width: 100%;
		box-sizing: border-box;
	}
	[data-look='pill'] a {
		min-height: max(calc(var(--k-control-h) - 8px), var(--k-tap-target));
		border-radius: var(--k-radius-control);
	}
	[data-look='pill'] a[aria-current='page'] {
		color: var(--k-on-primary);
		background: var(--k-primary);
	}
	[data-look='pill'] a[aria-current='page']:focus-visible {
		outline-offset: calc(var(--k-focus-w) * -2);
		outline-color: var(--k-on-primary);
	}
	[data-look='pill'] a[aria-current='page'] :global(.k-tab-badge[data-tone='accent']) {
		background: var(--k-on-primary);
		color: var(--k-primary);
	}
	[data-look='pill'] a[aria-current='page'] :global(.k-tab-dot[data-tone='accent']) {
		background: var(--k-on-primary);
	}
	@media (forced-colors: active) {
		a[aria-current='page'] {
			box-shadow: none;
			border-bottom: 2px solid Highlight;
		}
	}
</style>
