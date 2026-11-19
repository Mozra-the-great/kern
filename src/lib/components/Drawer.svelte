<script lang="ts">
	import { strings } from './strings.svelte.js';
	import type { Snippet } from 'svelte';
	import { ModalDialog } from './modal-dialog.js';

	interface Props {
		open?: boolean | undefined;
		title: string;
		side?: 'right' | 'left' | 'bottom' | undefined;
		/** Close when the backdrop is clicked. Default true. */
		closeOnBackdrop?: boolean | undefined;
		/**
		 * `false`: Escape, the backdrop and the close button (hidden) do nothing; only the app closes
		 * the drawer by setting `open` to false. Default true.
		 */
		dismissible?: boolean | undefined;
		/**
		 * What gets focus when the drawer opens: an element, or a CSS selector looked up inside the
		 * drawer (and in the light DOM of a custom-element host). Default: the browser's choice.
		 */
		initialFocus?: string | HTMLElement | undefined;
		closeLabel?: string | undefined;
		/**
		 * The user asked to close (Escape, close button, backdrop). Call `event.preventDefault()` to
		 * keep the drawer open.
		 */
		oncancel?: ((event: Event) => void) | undefined;
		/**
		 * The user closed the drawer (Escape, close button, backdrop, a `<form method="dialog">`
		 * button). Not called when the app closes it by setting `open` to false.
		 */
		onclose?: (() => void) | undefined;
		footer?: Snippet | undefined;
		children?: Snippet | undefined;
	}
	let {
		open = $bindable(),
		title,
		side = 'right',
		closeOnBackdrop = true,
		dismissible = true,
		initialFocus,
		closeLabel: closeLabelProp,
		oncancel,
		onclose,
		footer,
		children
	}: Props = $props();
	const closeLabel = $derived(closeLabelProp ?? strings().drawer.closeLabel);
	let dialog: HTMLDialogElement | undefined = $state();
	const uid = $props.id();
	// Same open/close, scroll lock and focus handling as Modal.
	const control = new ModalDialog({
		dismissible: () => dismissible,
		initialFocus: () => initialFocus,
		cancel: (event) => oncancel?.(event),
		closed: () => {
			open = false;
			onclose?.();
		}
	});

	$effect(() => {
		if (dialog) control.sync(dialog, !!open);
	});
	$effect(() => () => control.destroy());
</script>

<dialog
	bind:this={dialog}
	class="k-drawer"
	data-side={side}
	closedby={dismissible ? undefined : 'none'}
	aria-labelledby="{uid}-t"
	oncancel={control.oncancel}
	onclose={control.onclose}
	onclick={(e) => {
		if (closeOnBackdrop && e.target === dialog) control.requestClose();
	}}
>
	<div class="inner">
		<header>
			<h2 id="{uid}-t">{title}</h2>
			{#if dismissible}
				<button type="button" class="x" aria-label={closeLabel} onclick={() => control.requestClose()}>
					<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="2" /></svg>
				</button>
			{/if}
		</header>
		<div class="body">{@render children?.()}</div>
		{#if footer}<footer>{@render footer()}</footer>{/if}
	</div>
</dialog>

<style>
	.k-drawer {
		position: fixed;
		margin: 0;
		padding: 0;
		max-width: 100vw;
		max-height: 100dvh;
		border: 0;
		background: var(--k-bg-raised);
		color: var(--k-fg);
		box-shadow: var(--k-shadow-overlay);
		font-family: var(--k-font-sans);
	}
	.k-drawer::backdrop {
		background: var(--k-backdrop);
	}
	[data-side='right'] {
		inset: 0 0 0 auto;
		width: min(420px, 100vw);
		height: 100dvh;
		border-left: var(--k-border-w) solid var(--k-line-strong);
		border-radius: var(--k-radius-overlay) 0 0 var(--k-radius-overlay);
	}
	[data-side='left'] {
		inset: 0 auto 0 0;
		width: min(420px, 100vw);
		height: 100dvh;
		border-right: var(--k-border-w) solid var(--k-line-strong);
		border-radius: 0 var(--k-radius-overlay) var(--k-radius-overlay) 0;
	}
	[data-side='bottom'] {
		inset: auto 0 0 0;
		width: 100vw;
		max-height: 85dvh;
		border-top: var(--k-border-w) solid var(--k-line-strong);
		border-radius: var(--k-radius-overlay) var(--k-radius-overlay) 0 0;
	}
	[data-side='right'][open] {
		animation: k-from-right 200ms var(--k-ease);
	}
	[data-side='left'][open] {
		animation: k-from-left 200ms var(--k-ease);
	}
	[data-side='bottom'][open] {
		animation: k-from-bottom 200ms var(--k-ease);
	}
	.inner {
		display: flex;
		flex-direction: column;
		height: 100%;
		box-sizing: border-box;
	}
	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--k-space-4);
		padding: var(--k-space-5) var(--k-space-6);
		border-bottom: var(--k-border-w) solid var(--k-line);
	}
	h2 {
		margin: 0;
		font-size: var(--k-text-lg);
		font-weight: var(--k-weight-heading);
	}
	.body {
		flex: 1;
		overflow: auto;
		padding: var(--k-space-6);
	}
	footer {
		display: flex;
		gap: var(--k-space-3);
		justify-content: flex-end;
		padding: var(--k-space-4) var(--k-space-6);
		border-top: var(--k-border-w) solid var(--k-line);
	}
	.x {
		display: grid;
		place-items: center;
		width: var(--k-tap-icon);
		height: var(--k-tap-icon);
		margin: calc(18px - var(--k-tap-icon) / 2);
		padding: 0;
		border: 0;
		border-radius: var(--k-radius-control);
		background: transparent;
		color: var(--k-fg-muted);
		cursor: pointer;
	}
	.x:hover {
		color: var(--k-fg);
		background: var(--k-bg-sunken);
	}
	.x:focus-visible {
		outline: var(--k-focus-w) solid var(--k-focus);
		outline-offset: 0;
	}
	.x svg {
		width: 16px;
		height: 16px;
	}
	@keyframes k-from-right {
		from {
			transform: translateX(100%);
		}
	}
	@keyframes k-from-left {
		from {
			transform: translateX(-100%);
		}
	}
	@keyframes k-from-bottom {
		from {
			transform: translateY(100%);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.k-drawer[open] {
			animation: none !important;
		}
	}
	@media (forced-colors: active) {
		.x {
			border: 1px solid ButtonText;
			color: ButtonText;
		}
	}
</style>
