<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';

	interface Props extends HTMLButtonAttributes {
		/** Visual weight. One `primary` per view. */
		variant?: 'primary' | 'secondary' | 'ghost' | 'accent' | 'danger' | undefined;
		/**
		 * Height from the theme: `sm` = `--k-control-h-sm`, `md` = `--k-control-h`, `lg` = `--k-control-h-lg`
		 * (never below `--k-tap-target`). `icon` is a `--k-tap-icon` square for an icon without text: give it
		 * an `aria-label`.
		 */
		size?: 'sm' | 'md' | 'lg' | 'icon' | undefined;
		/** Full width. */
		block?: boolean | undefined;
		/** Full width with the label at the start and the last child (arrow, icon, count) at the end. */
		wide?: boolean | undefined;
		/** Shows a spinner and blocks clicks. */
		loading?: boolean | undefined;
		/**
		 * Renders an `<a>` instead of a `<button>` (attributes that only buttons know are passed on as they
		 * are). With `disabled` or `loading` it stays an `<a>`, without
		 * `href` and with `aria-disabled="true"`: it cannot be followed and leaves the tab order.
		 */
		href?: string | undefined;
		/** Link only: browsing context, as on `<a>`. */
		target?: HTMLAnchorAttributes['target'];
		/** Link only: relation, as on `<a>`. */
		rel?: string | null | undefined;
		/** Link only: download the target instead of navigating; a string is the file name. */
		download?: string | boolean | null | undefined;
		/** Link only: language of the linked page. */
		hreflang?: string | null | undefined;
		/** Link only: referrer policy, as on `<a>`. */
		referrerpolicy?: ReferrerPolicy | null | undefined;
		children?: Snippet; // same type as the inherited HTML attribute
	}
	let {
		variant = 'primary',
		size = 'md',
		block = false,
		wide = false,
		loading = false,
		href,
		target,
		rel,
		download,
		hreflang,
		referrerpolicy,
		type = 'button',
		disabled,
		class: cls = '',
		children,
		...rest
	}: Props = $props();
	const inert = $derived(!!disabled || loading);
	/** A disabled link has no href, so a click cannot navigate; this also stops handlers on the host page. */
	function blockClick(e: MouseEvent) {
		e.preventDefault();
		e.stopImmediatePropagation();
	}
</script>

{#if href}
	<a
		class="k-button {cls}"
		data-variant={variant}
		data-size={size}
		class:block={block || wide}
		class:wide
		{...rest as HTMLAnchorAttributes}
		href={inert ? undefined : href}
		target={inert ? undefined : target}
		rel={inert ? undefined : rel}
		download={inert ? undefined : download === true ? '' : download === false ? undefined : download}
		{hreflang}
		{referrerpolicy}
		role={inert ? 'link' : undefined}
		aria-disabled={inert || undefined}
		aria-busy={loading || undefined}
		onclickcapture={inert ? blockClick : undefined}
	>
		{#if loading}<span class="spin" aria-hidden="true"></span>{/if}
		{@render children?.()}
	</a>
{:else}
	<button
		class="k-button {cls}"
		data-variant={variant}
		data-size={size}
		class:block={block || wide}
		class:wide
		{type}
		disabled={inert}
		aria-busy={loading || undefined}
		{...rest}
	>
		{#if loading}<span class="spin" aria-hidden="true"></span>{/if}
		{@render children?.()}
	</button>
{/if}

<style>
	.k-button {
		display: inline-flex;
		box-sizing: border-box;
		align-items: center;
		justify-content: center;
		gap: var(--k-space-2);
		min-height: var(--k-control-h);
		min-width: var(--k-tap-target);
		padding: 0 var(--k-space-5);
		border: var(--k-border-w) solid transparent;
		border-radius: var(--k-radius-control);
		font-family: var(--k-label-font);
		font-size: var(--k-label-size);
		font-weight: var(--k-weight-label);
		text-transform: var(--k-label-transform);
		letter-spacing: var(--k-label-tracking);
		line-height: 1.2;
		text-decoration: none;
		cursor: pointer;
		user-select: none;
		white-space: nowrap;
		transition:
			background-color var(--k-dur) var(--k-ease),
			color var(--k-dur) var(--k-ease),
			border-color var(--k-dur) var(--k-ease),
			transform var(--k-dur) var(--k-ease);
	}
	.k-button:focus-visible {
		outline: var(--k-focus-w) solid var(--k-focus);
		outline-offset: var(--k-focus-offset);
	}
	.k-button:active:not(:disabled, [aria-disabled='true']) {
		transform: translateY(1px);
	}
	.k-button:disabled,
	.k-button[aria-disabled='true'] {
		cursor: not-allowed;
		opacity: var(--k-disabled-opacity);
	}
	.block {
		display: flex;
		width: 100%;
	}
	.wide {
		justify-content: space-between;
		text-align: start;
	}

	[data-size='sm'] {
		min-height: max(var(--k-control-h-sm), var(--k-tap-target));
		padding: 0 var(--k-space-3);
	}
	[data-size='lg'] {
		min-height: var(--k-control-h-lg);
		padding: 0 var(--k-space-7);
	}
	[data-size='icon'] {
		width: max(var(--k-tap-icon), var(--k-tap-target));
		min-width: 0;
		height: max(var(--k-tap-icon), var(--k-tap-target));
		min-height: 0;
		padding: 0;
	}
	[data-size='icon'] :global(svg) {
		width: 20px;
		height: 20px;
	}

	[data-variant='primary'] {
		background: var(--k-primary);
		color: var(--k-on-primary);
	}
	[data-variant='primary']:hover:not(:disabled, [aria-disabled='true']) {
		background: var(--k-primary-hover);
		color: var(--k-on-primary-hover);
	}

	[data-variant='secondary'] {
		background: transparent;
		color: var(--k-fg);
		border-color: var(--k-border);
	}
	[data-variant='secondary']:hover:not(:disabled, [aria-disabled='true']) {
		background: var(--k-bg-sunken);
		border-color: var(--k-fg);
	}

	[data-variant='ghost'] {
		background: transparent;
		color: var(--k-fg);
	}
	[data-variant='ghost']:hover:not(:disabled, [aria-disabled='true']) {
		background: var(--k-bg-sunken);
	}

	[data-variant='accent'] {
		background: var(--k-accent);
		color: var(--k-on-accent);
	}
	[data-variant='accent']:hover:not(:disabled, [aria-disabled='true']) {
		filter: brightness(0.95);
	}

	[data-variant='danger'] {
		background: var(--k-danger);
		color: var(--k-on-danger);
	}
	[data-variant='danger']:hover:not(:disabled, [aria-disabled='true']) {
		filter: brightness(0.92);
	}

	.spin {
		width: 1em;
		height: 1em;
		border: 2px solid currentColor;
		border-right-color: transparent;
		border-radius: 50%;
		animation: k-spin 0.7s linear infinite;
	}
	@keyframes k-spin {
		to {
			transform: rotate(360deg);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.spin {
			animation-duration: 2s;
		}
	}
	@media (forced-colors: active) {
		/* Backgrounds become the system colour: keep the edge, and show disabled as GrayText. */
		.k-button {
			border-color: ButtonText;
		}
		.k-button:disabled,
		.k-button[aria-disabled='true'] {
			opacity: 1;
			border-color: GrayText;
			color: GrayText;
		}
	}
</style>
