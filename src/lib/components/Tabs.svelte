<script lang="ts" module>
	import type { TabBadgeFields } from './TabBadge.svelte';

	export interface TabItem extends TabBadgeFields {
		id: string;
		label: string;
		disabled?: boolean | undefined;
		/** Not rendered and skipped by the arrow keys, e.g. a page only admins see. */
		hidden?: boolean | undefined;
		/**
		 * Id of the element this tab controls (`aria-controls`) when Tabs renders no `panel`, e.g. the
		 * `<main>` the app swaps. Ignored with a `panel`, which gets its own id.
		 */
		controls?: string | undefined;
	}
</script>

<script lang="ts">
	import { tick, type Snippet } from 'svelte';
	import TabBadge, { tabName } from './TabBadge.svelte';
	import { watchScrollFade, type ScrollFade } from './scroll-fade.js';

	interface Props {
		tabs: readonly TabItem[];
		/** Id of the active tab. */
		value?: string | undefined;
		/** Accessible name of the tab list. */
		label?: string | undefined;
		/** `line` = underline marker, `pill` = filled segment. */
		look?: 'line' | 'pill' | undefined;
		/**
		 * Renders the panel of the given tab id. Without it Tabs is only the tab bar (app navigation):
		 * the page renders the content itself, and `controls` of an item names it.
		 */
		panel?: Snippet<[string]> | undefined;
		/** Called when the user picks another tab (click or arrow keys), not when `value` is set from outside. */
		onchange?: ((id: string) => void) | undefined;
		class?: string | undefined;
	}
	let { tabs, value = $bindable(), label, look = 'line', panel, onchange, class: cls = '' }: Props = $props();
	const uid = $props.id();
	const shown = $derived(tabs.filter((t) => !t.hidden));
	const enabled = $derived(shown.filter((t) => !t.disabled));
	const active = $derived(value ?? enabled[0]?.id ?? '');
	/** The tab that takes Tab focus: the active one, or the first usable one when the active one is hidden or disabled. */
	const focusable = $derived(enabled.some((t) => t.id === active) ? active : enabled[0]?.id);
	let list: HTMLElement | undefined = $state();
	let fade: ScrollFade = $state({ start: false, end: false });
	$effect(() => {
		if (list) return watchScrollFade(list, (next) => (fade = next));
	});

	const tabId = (id: string): string => `${uid}-tab-${id}`;
	const panelId = (id: string): string => `${uid}-panel-${id}`;

	function select(id: string, focus = false) {
		const changed = id !== active;
		value = id;
		if (changed) onchange?.(id);
		if (!focus) return;
		const tab = list?.querySelector<HTMLElement>(`#${CSS.escape(tabId(id))}`);
		tab?.focus();
		// A theme may set the selected tab heavier (--k-tab-selected-weight), so it grows once the
		// selection renders: scroll it fully into view after that, or the strip stops short of its end.
		void tick().then(() => tab?.scrollIntoView({ block: 'nearest', inline: 'nearest' }));
	}
	function onkeydown(e: KeyboardEvent) {
		const from = (e.target instanceof Element ? e.target.closest('[role="tab"]')?.getAttribute('data-id') : undefined) ?? active;
		const count = enabled.length;
		if (count === 0) return;
		const i = enabled.findIndex((t) => t.id === from);
		let n = -1;
		if (e.key === 'ArrowRight') n = i < 0 ? 0 : (i + 1) % count;
		else if (e.key === 'ArrowLeft') n = i < 0 ? count - 1 : (i - 1 + count) % count;
		else if (e.key === 'Home') n = 0;
		else if (e.key === 'End') n = count - 1;
		const next = enabled[n];
		if (next) {
			e.preventDefault();
			select(next.id, true);
		}
	}
</script>

<div class="k-tabs {cls}" data-look={look}>
	<div
		class="list"
		role="tablist"
		aria-label={label}
		bind:this={list}
		tabindex="-1"
		{onkeydown}
		data-fade-start={fade.start ? '' : undefined}
		data-fade-end={fade.end ? '' : undefined}
	>
		{#each shown as t (t.id)}
			<button
				type="button"
				role="tab"
				id={tabId(t.id)}
				data-id={t.id}
				aria-selected={t.id === active}
				aria-controls={panel ? panelId(t.id) : t.controls || undefined}
				aria-label={tabName(t.label, t)}
				tabindex={t.id === focusable ? 0 : -1}
				disabled={t.disabled}
				onclick={() => select(t.id)}
			>
				<!-- The space keeps label and badge apart in the text (axe: label in name). -->
				<span class="text">{t.label}</span>
				<TabBadge item={t} />
			</button>
		{/each}
	</div>
	{#if panel}
		<div class="panel" role="tabpanel" id={panelId(active)} aria-labelledby={tabId(active)} tabindex="0">
			{@render panel(active)}
		</div>
	{/if}
</div>

<style>
	.k-tabs {
		display: grid;
		/* The column may shrink below the strip: an auto column is as wide as the strip's content, so a pill strip with more
		 * tabs than fit widened the page instead of scrolling (#159). */
		grid-template-columns: minmax(0, 1fr);
		gap: var(--k-space-5);
		min-width: 0;
	}
	.list {
		display: flex;
		gap: var(--k-tabs-gap);
		overflow-x: auto;
		/* Only the sideways overflow scrolls. A strip that also scrolls vertically becomes a keyboard stop of its own
		 * in Firefox (#153); the tabs fit by arithmetic (see the line look below), this keeps it so under rounding. */
		overflow-y: hidden;
		scrollbar-width: var(--k-tabs-scrollbar);
		outline: none;
	}
	/* Hidden tabs on either side: fade that edge as a hint that the strip scrolls. */
	.list[data-fade-end] {
		mask-image: linear-gradient(90deg, #000 calc(100% - var(--k-tabs-fade-end)), transparent);
	}
	.list[data-fade-start] {
		mask-image: linear-gradient(90deg, transparent, #000 var(--k-tabs-fade-start));
	}
	.list[data-fade-start][data-fade-end] {
		mask-image: linear-gradient(90deg, transparent, #000 var(--k-tabs-fade-start), #000 calc(100% - var(--k-tabs-fade-end)), transparent);
	}
	.list:dir(rtl)[data-fade-end] {
		mask-image: linear-gradient(270deg, #000 calc(100% - var(--k-tabs-fade-end)), transparent);
	}
	.list:dir(rtl)[data-fade-start] {
		mask-image: linear-gradient(270deg, transparent, #000 var(--k-tabs-fade-start));
	}
	.list:dir(rtl)[data-fade-start][data-fade-end] {
		mask-image: linear-gradient(270deg, transparent, #000 var(--k-tabs-fade-start), #000 calc(100% - var(--k-tabs-fade-end)), transparent);
	}
	[data-look='line'] .list {
		border-bottom: var(--k-border-w) solid var(--k-line);
	}
	button {
		position: relative;
		flex: none;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--k-space-2);
		min-height: var(--k-tab-h);
		padding: 0 var(--k-tab-pad-x);
		border: 0;
		background: transparent;
		color: var(--k-tab-fg);
		font-family: var(--k-tab-font);
		font-size: var(--k-tab-size);
		font-weight: var(--k-tab-weight);
		text-transform: var(--k-tab-transform);
		letter-spacing: var(--k-tab-tracking);
		white-space: nowrap;
		cursor: pointer;
		transition:
			color var(--k-dur) var(--k-ease),
			background-color var(--k-dur) var(--k-ease),
			box-shadow var(--k-dur) var(--k-ease);
	}
	button:hover:not(:disabled) {
		color: var(--k-tab-hover-fg);
	}
	button:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}
	/* The strip scrolls and would clip an outer ring: draw it inside. */
	button:focus-visible {
		outline: var(--k-focus-w) solid var(--k-focus);
		outline-offset: calc(var(--k-focus-w) * -1);
	}
	/* The strip's border-bottom is part of --k-tab-h: a tab ends above it. The padding keeps the label centred in
	 * the full height, and the selected bar stays 2px minus the border it used to overlap (the strip clipped that
	 * part). A tab taller than the strip (negative margin) overflowed it by the border and made it scroll (#153). */
	[data-look='line'] button {
		min-height: calc(var(--k-tab-h) - var(--k-border-w));
		padding-top: var(--k-border-w);
		border-inline-end: var(--k-tab-divider-w) solid var(--k-line);
		box-shadow: inset 0 calc(max(0px, 2px - var(--k-border-w)) * -1) 0 transparent;
	}
	[data-look='line'] button[aria-selected='true'] {
		color: var(--k-fg);
		background: var(--k-tab-selected-bg);
		font-weight: var(--k-tab-selected-weight);
		box-shadow: inset 0 calc(max(0px, 2px - var(--k-border-w)) * -1) 0 var(--k-accent-mark);
	}
	[data-look='pill'] .list {
		padding: var(--k-space-1);
		background: var(--k-bg-sunken);
		border-radius: var(--k-radius-control);
		width: fit-content;
		max-width: 100%;
		box-sizing: border-box;
	}
	[data-look='pill'] button {
		min-height: max(calc(var(--k-control-h) - 8px), var(--k-tap-target));
		border-radius: var(--k-radius-control);
	}
	[data-look='pill'] button[aria-selected='true'] {
		color: var(--k-on-primary);
		background: var(--k-primary);
	}
	/* The focus ring sits on the filled pill: keep a gap of the pill colour between ring and text. */
	[data-look='pill'] button[aria-selected='true']:focus-visible {
		outline-offset: calc(var(--k-focus-w) * -2);
		outline-color: var(--k-on-primary);
	}
	/* An accent badge or dot would vanish on a filled pill of the same colour: invert it there. */
	[data-look='pill'] button[aria-selected='true'] :global(.k-tab-badge[data-tone='accent']) {
		background: var(--k-on-primary);
		color: var(--k-primary);
	}
	[data-look='pill'] button[aria-selected='true'] :global(.k-tab-dot[data-tone='accent']) {
		background: var(--k-on-primary);
	}
	.panel:focus-visible {
		outline: var(--k-focus-w) solid var(--k-focus);
		outline-offset: var(--k-focus-offset);
	}
	@media (forced-colors: active) {
		/* Selected tab: a Highlight bar instead of the inset shadow (dropped). In the line look the bar is 4px minus
		 * the border of the strip (3px with a 1px border), as the shadow is 2px minus it. */
		[data-look='line'] button[aria-selected='true'] {
			box-shadow: none;
			border-bottom: calc(4px - var(--k-border-w)) solid Highlight;
		}
		/* the pill is round: a bar under it would curl, so it gets a full edge (the margin keeps its size) */
		[data-look='pill'] button[aria-selected='true'] {
			margin: -2px;
			border: 2px solid Highlight;
		}
		button:disabled {
			opacity: 1;
			color: GrayText;
		}
		button:focus-visible {
			outline-color: Highlight;
		}
	}
</style>
