<script lang="ts" module>
	export interface NavbarItem {
		label: string;
		href: string;
		/** Marks the link of the current page (`aria-current="page"`). */
		current?: boolean | undefined;
	}
</script>

<script lang="ts">
	import { strings } from './strings.svelte.js';
	import { tick, type Snippet } from 'svelte';

	interface Props {
		/** Links of the bar. Without any (omitted or empty) the bar shows only `brand` and `actions`: no menu button, no `<nav>`. */
		items?: readonly NavbarItem[] | undefined;
		/** Logo or product name, on the left. */
		brand?: Snippet | undefined;
		/** Controls on the right, e.g. a theme switch or a sign-in button. Stays in the bar on narrow widths. */
		actions?: Snippet | undefined;
		/** Accessible name of the navigation landmark. */
		label?: string | undefined;
		/** Accessible name of the menu button shown on narrow widths. */
		menuLabel?: string | undefined;
		class?: string | undefined;
	}
	let { items = [], brand, actions, label: labelProp, menuLabel: menuLabelProp, class: cls = '' }: Props = $props();
	const label = $derived(labelProp ?? strings().navbar.label);
	const menuLabel = $derived(menuLabelProp ?? strings().navbar.menuLabel);
	const uid = $props.id();
	/* No links, no navigation: the landmark, the panel and the menu button would all be empty. */
	const hasItems = $derived(items.length > 0);

	let open = $state(false);
	let header: HTMLElement | undefined = $state();
	let toggle: HTMLButtonElement | undefined = $state();
	let panel: HTMLElement | undefined = $state();

	/* The panel comes before the button in the DOM (it is placed below the bar, and in the bar on wide screens), so
	 * after a keyboard press the next Tab would leave it behind: move the focus to its first link instead. */
	async function onToggle(e: MouseEvent) {
		open = !open;
		if (!open || e.detail !== 0) return;
		await tick();
		panel?.querySelector<HTMLElement>('a')?.focus();
	}

	/* Losing the last link closes the panel, so it does not reopen when links come back. */
	$effect(() => {
		if (!hasItems) open = false;
	});

	/* Escape closes the panel and gives the focus back to the menu button. */
	$effect(() => {
		const el = header;
		if (!el) return;
		const onkey = (e: KeyboardEvent) => {
			if (e.key !== 'Escape' || !open) return;
			e.preventDefault();
			open = false;
			toggle?.focus();
		};
		el.addEventListener('keydown', onkey);
		return () => el.removeEventListener('keydown', onkey);
	});

	function onWindowClick(e: MouseEvent) {
		if (open && header && !e.composedPath().includes(header)) open = false;
	}
</script>

<svelte:window onclick={onWindowClick} />

<header class="k-navbar {cls}" class:open bind:this={header}>
	<div class="bar">
		{#if brand}<div class="brand">{@render brand()}</div>{/if}
		{#if hasItems}
			<nav class="panel" id="{uid}-panel" bind:this={panel} aria-label={label} data-open={open}>
				<ul>
					{#each items as item (item.href + item.label)}
						<li>
							<a href={item.href} aria-current={item.current ? 'page' : undefined} onclick={() => (open = false)}>{item.label}</a>
						</li>
					{/each}
				</ul>
			</nav>
		{/if}
		{#if actions}<div class="actions">{@render actions()}</div>{/if}
		{#if hasItems}
			<button
				type="button"
				bind:this={toggle}
				class="toggle"
				aria-label={menuLabel}
				aria-expanded={open}
				aria-controls="{uid}-panel"
				onclick={onToggle}
			>
				{#if open}
					<svg viewBox="0 0 20 20" aria-hidden="true">
						<path d="M4 4l12 12M16 4L4 16" fill="none" stroke="currentColor" stroke-width="2" />
					</svg>
				{:else}
					<svg viewBox="0 0 20 20" aria-hidden="true">
						<path d="M3 5h14M3 10h14M3 15h14" fill="none" stroke="currentColor" stroke-width="2" />
					</svg>
				{/if}
			</button>
		{/if}
	</div>
</header>

<style>
	.k-navbar {
		container-type: inline-size;
		position: relative;
		z-index: 100;
		border-bottom: var(--k-border-w) solid var(--k-line);
		background: var(--k-bg-raised);
		color: var(--k-fg);
	}
	/* an open panel overlays the page, so lift the bar above later siblings */
	.k-navbar.open {
		z-index: 950;
	}
	.bar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--k-space-2) var(--k-space-4);
		min-height: 64px;
		padding: var(--k-space-2) var(--k-space-4);
	}
	.brand {
		flex: 1 1 auto;
		min-width: min-content;
		font-family: var(--k-font-display);
		font-weight: var(--k-weight-display);
		font-size: var(--k-text-lg);
	}
	.brand :global(a) {
		color: inherit;
		text-decoration: none;
	}
	.actions {
		display: flex;
		align-items: center;
		gap: var(--k-space-2);
	}

	.toggle {
		display: inline-grid;
		place-items: center;
		width: var(--k-control-h);
		height: var(--k-control-h);
		padding: 0;
		border: var(--k-border-w) solid var(--k-border);
		border-radius: var(--k-radius-control);
		background: transparent;
		color: var(--k-fg);
		cursor: pointer;
		transition: background-color var(--k-dur) var(--k-ease);
	}
	.toggle:hover,
	.toggle[aria-expanded='true'] {
		background: var(--k-bg-sunken);
	}
	.toggle svg {
		width: 20px;
		height: 20px;
	}
	.toggle:focus-visible,
	a:focus-visible {
		outline: var(--k-focus-w) solid var(--k-focus);
		outline-offset: var(--k-focus-offset);
	}

	/* narrow: items live in a panel below the bar */
	.panel {
		display: none;
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		padding: var(--k-space-2) var(--k-space-4) var(--k-space-4);
		border-bottom: var(--k-border-w) solid var(--k-line);
		background: var(--k-bg-raised);
		box-shadow: var(--k-shadow-overlay);
	}
	.panel[data-open='true'] {
		display: block;
	}
	ul {
		display: grid;
		gap: var(--k-space-1);
		margin: 0;
		padding: 0;
		list-style: none;
	}
	a {
		display: flex;
		align-items: center;
		min-height: var(--k-control-h);
		padding: 0 var(--k-space-3);
		border-radius: var(--k-radius-control);
		color: var(--k-fg);
		font-family: var(--k-label-font);
		font-size: var(--k-label-size);
		font-weight: var(--k-weight-label);
		text-transform: var(--k-label-transform);
		letter-spacing: var(--k-label-tracking);
		text-decoration: none;
		transition: background-color var(--k-dur) var(--k-ease);
	}
	a:hover {
		background: var(--k-bg-sunken);
	}
	a[aria-current='page'] {
		background: var(--k-surface-selected);
		font-weight: var(--k-weight-heading);
		box-shadow: inset 4px 0 0 var(--k-accent-mark);
	}

	@container (min-width: 720px) {
		.brand {
			flex: none;
		}
		.toggle {
			display: none;
		}
		.panel {
			display: block;
			position: static;
			flex: 1;
			padding: 0;
			border: 0;
			background: transparent;
			box-shadow: none;
		}
		ul {
			display: flex;
			flex-wrap: wrap;
			gap: var(--k-space-1);
		}
		a[aria-current='page'] {
			box-shadow: inset 0 -3px 0 var(--k-accent-mark);
		}
		.actions {
			margin-left: auto;
		}
	}
	@media (forced-colors: active) {
		.toggle {
			color: ButtonText;
		}
		/* Current page: inverted (the tint and the inset bar are dropped). */
		a[aria-current='page'] {
			forced-color-adjust: none;
			background: Highlight;
			color: HighlightText;
			box-shadow: none;
		}
		a:hover {
			outline: 1px solid Highlight;
		}
	}
</style>
