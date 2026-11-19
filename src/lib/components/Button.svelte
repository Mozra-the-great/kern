<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	interface Props extends HTMLButtonAttributes {
		/** Visual weight. One `primary` per view. */
		variant?: 'primary' | 'secondary' | 'ghost' | 'accent' | 'danger';
		size?: 'sm' | 'md' | 'lg';
		/** Full width. */
		block?: boolean;
		/** Shows a spinner and blocks clicks. */
		loading?: boolean;
		/** Renders an `<a>` instead of a `<button>`. */
		href?: string;
		children?: Snippet;
	}
	let {
		variant = 'primary',
		size = 'md',
		block = false,
		loading = false,
		href,
		type = 'button',
		disabled,
		class: cls = '',
		children,
		...rest
	}: Props = $props();
</script>

{#if href && !disabled}
	<a class="k-button {cls}" data-variant={variant} data-size={size} class:block {href} {...rest as any}>
		{@render children?.()}
	</a>
{:else}
	<button
		class="k-button {cls}"
		data-variant={variant}
		data-size={size}
		class:block
		{type}
		disabled={disabled || loading}
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
	.k-button:active:not(:disabled) { transform: translateY(1px); }
	.k-button:disabled { cursor: not-allowed; opacity: 0.5; }
	.block { display: flex; width: 100%; }

	[data-size='sm'] { min-height: max(var(--k-control-h-sm), var(--k-tap-target)); padding: 0 var(--k-space-3); }
	[data-size='lg'] { min-height: var(--k-control-h-lg); padding: 0 var(--k-space-7); }

	[data-variant='primary'] { background: var(--k-primary); color: var(--k-on-primary); }
	[data-variant='primary']:hover:not(:disabled) { background: var(--k-primary-hover); color: var(--k-on-primary-hover); }

	[data-variant='secondary'] { background: transparent; color: var(--k-fg); border-color: var(--k-border); }
	[data-variant='secondary']:hover:not(:disabled) { background: var(--k-bg-sunken); border-color: var(--k-fg); }

	[data-variant='ghost'] { background: transparent; color: var(--k-fg); }
	[data-variant='ghost']:hover:not(:disabled) { background: var(--k-bg-sunken); }

	[data-variant='accent'] { background: var(--k-accent); color: var(--k-on-accent); }
	[data-variant='accent']:hover:not(:disabled) { filter: brightness(0.95); }

	[data-variant='danger'] { background: var(--k-danger); color: var(--k-on-danger); }
	[data-variant='danger']:hover:not(:disabled) { filter: brightness(0.92); }

	.spin {
		width: 1em;
		height: 1em;
		border: 2px solid currentColor;
		border-right-color: transparent;
		border-radius: 50%;
		animation: k-spin 0.7s linear infinite;
	}
	@keyframes k-spin { to { transform: rotate(360deg); } }
	@media (prefers-reduced-motion: reduce) { .spin { animation-duration: 2s; } }
</style>
