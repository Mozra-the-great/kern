<script lang="ts" module>
	export interface BreadcrumbItem {
		label: string;
		/** Without `href` the item is plain text. */
		href?: string | undefined;
	}
</script>

<script lang="ts">
	import { strings } from './strings.svelte.js';
	import { tick } from 'svelte';

	interface Props {
		items: BreadcrumbItem[];
		/** Accessible name of the navigation landmark. */
		label?: string | undefined;
		/** Show at most this many items (first, an ellipsis button, the last ones). Without it,
		 *  trails of four or more items collapse on narrow containers only. */
		max?: number | undefined;
		/** Accessible name of the ellipsis button. */
		expandLabel?: string | undefined;
		class?: string | undefined;
	}
	let { items, label: labelProp, max, expandLabel: expandLabelProp, class: cls = '' }: Props = $props();
	const label = $derived(labelProp ?? strings().breadcrumb.label);
	const expandLabel = $derived(expandLabelProp ?? strings().breadcrumb.expandLabel);

	let expanded = $state(false);
	let list: HTMLOListElement | undefined = $state();

	const n = $derived(items.length);
	const maxItems = $derived(max === undefined ? undefined : Math.max(2, Math.floor(max)));
	/** How many items at the end stay visible while the middle is collapsed. */
	const keepTail = $derived(maxItems === undefined ? 2 : maxItems - 1);
	/** Items 1 .. hideTo-1 are collapsible. */
	const hideTo = $derived(n - keepTail);
	const collapsed = $derived(!expanded && hideTo > 1);
	const byMax = $derived(maxItems !== undefined);
	const inMiddle = (i: number): boolean => i >= 1 && i < hideTo;

	async function expand() {
		expanded = true;
		await tick();
		list?.children[1]?.querySelector<HTMLElement>('a, [data-text]')?.focus();
	}
</script>

<nav class="k-breadcrumb {cls}" aria-label={label}>
	<ol bind:this={list}>
		{#each items as item, i (i)}
			{#if collapsed && i === 1}
				<li class="gap" class:narrow={!byMax}>
					<button type="button" class="more" aria-label={expandLabel} onclick={expand}>
						<svg viewBox="0 0 16 16" aria-hidden="true">
							<circle cx="3" cy="8" r="1.4" fill="currentColor" /><circle cx="8" cy="8" r="1.4" fill="currentColor" /><circle
								cx="13"
								cy="8"
								r="1.4"
								fill="currentColor"
							/>
						</svg>
					</button>
					<svg class="sep" viewBox="0 0 16 16" aria-hidden="true">
						<path d="M6 3l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.6" />
					</svg>
				</li>
			{/if}
			{#if !(collapsed && byMax && inMiddle(i))}
				<li class:mid={collapsed && !byMax && inMiddle(i)}>
					{#if item.href}
						<a href={item.href} aria-current={i === n - 1 ? 'page' : undefined}>{item.label}</a>
					{:else}
						<span class="text" data-text tabindex="-1" aria-current={i === n - 1 ? 'page' : undefined}>{item.label}</span>
					{/if}
					{#if i < n - 1}
						<svg class="sep" viewBox="0 0 16 16" aria-hidden="true">
							<path d="M6 3l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.6" />
						</svg>
					{/if}
				</li>
			{/if}
		{/each}
	</ol>
</nav>

<style>
	.k-breadcrumb {
		container-type: inline-size;
		min-width: 0;
	}
	ol {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	li {
		display: inline-flex;
		align-items: center;
		min-width: 0;
	}
	a,
	.text,
	.more {
		display: inline-flex;
		align-items: center;
		min-height: max(40px, var(--k-tap-target));
		padding: 0 var(--k-space-2);
		border-radius: var(--k-radius-badge);
		font-family: var(--k-label-font);
		font-size: var(--k-label-size);
		font-weight: var(--k-weight-label);
		text-transform: var(--k-label-transform);
		letter-spacing: var(--k-label-tracking);
		overflow-wrap: anywhere;
	}
	a {
		color: var(--k-fg-muted);
		text-decoration: underline;
		text-decoration-color: transparent;
		text-underline-offset: 4px;
		transition: color var(--k-dur) var(--k-ease);
	}
	a:hover {
		color: var(--k-fg);
		text-decoration-color: currentColor;
	}
	.text {
		color: var(--k-fg-muted);
	}
	[aria-current='page'] {
		color: var(--k-fg);
		font-weight: var(--k-weight-heading);
	}
	a[aria-current='page'] {
		text-decoration-color: var(--k-accent-mark);
		text-decoration-thickness: 2px;
	}
	.more {
		justify-content: center;
		min-width: max(40px, var(--k-tap-target));
		border: var(--k-border-w) solid var(--k-line);
		background: transparent;
		color: var(--k-fg-muted);
		cursor: pointer;
	}
	.more:hover {
		background: var(--k-bg-sunken);
		color: var(--k-fg);
		border-color: var(--k-border);
	}
	.more svg {
		width: 16px;
		height: 16px;
	}
	a:focus-visible,
	.text:focus-visible,
	.more:focus-visible {
		outline: var(--k-focus-w) solid var(--k-focus);
		outline-offset: var(--k-focus-offset);
	}
	.sep {
		flex: none;
		width: 14px;
		height: 14px;
		color: var(--k-fg-muted);
	}
	.narrow {
		display: none;
	}
	@container (max-width: 520px) {
		.mid {
			display: none;
		}
		.narrow {
			display: inline-flex;
		}
	}
	@media (forced-colors: active) {
		a {
			color: LinkText;
			text-decoration-color: LinkText;
		}
		a[aria-current='page'] {
			text-decoration-thickness: 2px;
		}
		.sep {
			color: CanvasText;
		}
		.more {
			border-color: ButtonText;
			color: ButtonText;
		}
	}
</style>
