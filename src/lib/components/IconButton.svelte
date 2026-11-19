<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	interface Props extends HTMLButtonAttributes {
		/** Accessible name. Required: the button has no visible text. */
		label: string;
		variant?: 'ghost' | 'secondary' | 'primary' | undefined;
		size?: 'sm' | 'md' | undefined;
		children?: Snippet; // same type as the inherited HTML attribute
	}
	let { label, variant = 'ghost', size = 'md', type = 'button', class: cls = '', children, ...rest }: Props = $props();
</script>

<button class="k-icon-button {cls}" data-variant={variant} data-size={size} aria-label={label} title={label} {type} {...rest}>
	{@render children?.()}
</button>

<style>
	.k-icon-button {
		display: inline-grid;
		box-sizing: border-box;
		place-items: center;
		width: var(--k-tap-icon);
		height: var(--k-tap-icon);
		padding: 0;
		border: var(--k-border-w) solid transparent;
		border-radius: var(--k-radius-control);
		background: transparent;
		color: var(--k-fg);
		cursor: pointer;
		transition: background-color var(--k-dur) var(--k-ease), color var(--k-dur) var(--k-ease);
	}
	.k-icon-button :global(svg) { width: 20px; height: 20px; }
	[data-size='sm'] { width: max(var(--k-control-h-sm), var(--k-tap-target)); height: max(var(--k-control-h-sm), var(--k-tap-target)); }
	.k-icon-button:hover:not(:disabled) { background: var(--k-bg-sunken); }
	[data-variant='secondary'] { border-color: var(--k-border); }
	[data-variant='primary'] { background: var(--k-primary); color: var(--k-on-primary); }
	[data-variant='primary']:hover:not(:disabled) { background: var(--k-primary-hover); color: var(--k-on-primary-hover); }
	.k-icon-button:focus-visible { outline: var(--k-focus-w) solid var(--k-focus); outline-offset: var(--k-focus-offset); }
	.k-icon-button:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
