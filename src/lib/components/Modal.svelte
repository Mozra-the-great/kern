<script lang="ts">
	import { strings } from './strings.svelte.js';
	import type { Snippet } from 'svelte';
	import { ModalDialog } from './modal-dialog.js';
	import { hasFocus, watchScrollRegion } from './scroll-region.js';

	interface Props {
		open?: boolean | undefined;
		title: string;
		description?: string | undefined;
		size?: 'sm' | 'md' | 'lg' | undefined;
		/** Close when the backdrop is clicked. */
		closeOnBackdrop?: boolean | undefined;
		/**
		 * `false`: Escape, the backdrop and the close button (hidden) do nothing; only the app closes
		 * the dialog by setting `open` to false. For decisions that must be answered. Default true.
		 */
		dismissible?: boolean | undefined;
		/**
		 * What gets focus when the dialog opens: an element, or a CSS selector looked up inside the
		 * dialog (and in the light DOM of a custom-element host). Default: the browser's choice
		 * (an `autofocus` element, else the first focusable one).
		 */
		initialFocus?: string | HTMLElement | undefined;
		/** `role="alertdialog"`: a confirmation that interrupts the user. */
		alert?: boolean | undefined;
		closeLabel?: string | undefined;
		/**
		 * The user asked to close (Escape, close button, backdrop). Call `event.preventDefault()` to
		 * keep the dialog open.
		 */
		oncancel?: ((event: Event) => void) | undefined;
		/**
		 * The user closed the dialog (Escape, close button, backdrop, a `<form method="dialog">`
		 * button). Not called when the app closes it by setting `open` to false.
		 */
		onclose?: (() => void) | undefined;
		footer?: Snippet | undefined;
		children?: Snippet | undefined;
	}
	let {
		open = $bindable(),
		title,
		description,
		size = 'md',
		closeOnBackdrop = true,
		dismissible = true,
		initialFocus,
		alert = false,
		closeLabel: closeLabelProp,
		oncancel,
		onclose,
		footer,
		children
	}: Props = $props();
	const closeLabel = $derived(closeLabelProp ?? strings().modal.closeLabel);
	const bodyLabel = $derived(strings().modal.bodyLabel);

	let dialog: HTMLDialogElement | undefined = $state();
	const uid = $props.id();
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

	// The dialog scrolls as a whole. When it overflows and holds nothing tabbable (not even a close button, see
	// `dismissible`), its content wrapper becomes a tab stop, named by the title, so the keyboard can scroll it.
	// No tabindex otherwise: even -1 would make it the dialog's first focus target on open. While it has the focus it
	// stays focusable (-1), so a resize that makes the content fit does not throw the focus out of the dialog.
	let inner: HTMLElement | undefined = $state();
	let focusableInner = $state(false);
	let heldInner = $state(false);
	$effect(() => {
		if (dialog && inner) {
			const el = inner;
			return watchScrollRegion(
				dialog,
				(needs) => {
					focusableInner = needs;
					heldInner = !needs && hasFocus(el);
				},
				el
			);
		}
	});

	function handleClick(e: MouseEvent) {
		if (closeOnBackdrop && e.target === dialog) control.requestClose();
	}
</script>

<dialog
	bind:this={dialog}
	class="k-modal"
	data-size={size}
	role={alert ? 'alertdialog' : undefined}
	closedby={dismissible ? undefined : 'none'}
	aria-labelledby="{uid}-t"
	aria-describedby={description ? `${uid}-d` : undefined}
	oncancel={control.oncancel}
	onclose={control.onclose}
	onclick={handleClick}
>
	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<div
		class="inner"
		bind:this={inner}
		role={focusableInner ? 'region' : undefined}
		aria-labelledby={focusableInner && title ? `${uid}-t` : undefined}
		aria-label={focusableInner && !title ? bodyLabel : undefined}
		tabindex={focusableInner ? 0 : heldInner ? -1 : undefined}
		onfocusout={() => (heldInner = false)}
	>
		<header role="none">
			<h2 id="{uid}-t">{title}</h2>
			{#if dismissible}
				<button type="button" class="x" aria-label={closeLabel} onclick={() => control.requestClose()}>
					<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="2" /></svg>
				</button>
			{/if}
		</header>
		{#if description}<p class="desc" id="{uid}-d">{description}</p>{/if}
		{#if children}<div class="body">{@render children()}</div>{/if}
		{#if footer}<footer role="none">{@render footer()}</footer>{/if}
	</div>
</dialog>

<style>
	.k-modal {
		width: var(--k-modal-width, min(520px, calc(100vw - 32px)));
		/* a theme's width also beats the browser's max-width for modal dialogs (100% less 2em and 6px) */
		min-width: var(--k-modal-width, auto);
		max-height: calc(100dvh - 32px);
		margin: var(--k-modal-margin);
		padding: 0;
		border: var(--k-border-w) solid var(--k-line-strong);
		border-width: var(--k-modal-border-w);
		border-radius: var(--k-radius-overlay);
		background: var(--k-modal-bg);
		color: var(--k-fg);
		box-shadow: var(--k-modal-shadow);
		font-family: var(--k-font-sans);
	}
	[data-size='sm'] {
		width: var(--k-modal-width, min(400px, calc(100vw - 32px)));
	}
	[data-size='lg'] {
		width: var(--k-modal-width, min(760px, calc(100vw - 32px)));
	}
	.k-modal::backdrop {
		background: var(--k-backdrop);
	}
	.k-modal[open] {
		animation: k-pop var(--k-modal-enter-dur) var(--k-ease);
	}
	.inner {
		display: grid;
		gap: var(--k-modal-gap);
		padding: var(--k-modal-pad);
	}
	/* Inside the box: the dialog clips an outside ring where the wrapper meets its edge. */
	.inner:focus-visible {
		border-radius: var(--k-radius-field);
		outline: var(--k-focus-w) solid var(--k-focus);
		/* a gap to the dialog's own edge, so the ring is not mistaken for the border (Pop draws a black one) */
		outline-offset: calc(var(--k-focus-w) * -1 - 4px);
	}
	header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--k-space-4);
	}
	h2 {
		margin: 0;
		font-size: var(--k-modal-title-size);
		font-weight: var(--k-weight-heading);
		letter-spacing: var(--k-modal-title-tracking);
		line-height: var(--k-modal-title-leading);
	}
	.desc {
		margin: calc(var(--k-space-2) * -1) 0 0;
		color: var(--k-fg-muted);
		font-size: var(--k-text-sm);
	}
	footer {
		display: flex;
		flex-direction: var(--k-modal-actions-direction);
		flex-wrap: wrap;
		justify-content: flex-end;
		gap: var(--k-space-3);
		margin-top: var(--k-space-2);
	}
	footer :global(> *) {
		width: var(--k-modal-action-w);
	}
	.x {
		flex: none;
		display: grid;
		place-items: center;
		width: var(--k-tap-icon);
		height: var(--k-tap-icon);
		margin: var(--k-modal-close-inset) var(--k-modal-close-inset) 0 0;
		padding: 0;
		border: var(--k-close-border-w) solid var(--k-line-strong);
		border-radius: var(--k-radius-control);
		background: transparent;
		color: var(--k-close-fg);
		cursor: pointer;
	}
	.x:hover {
		color: var(--k-fg);
		background: var(--k-close-hover-bg);
		border-color: var(--k-fg);
	}
	.x:focus-visible {
		outline: var(--k-focus-w) solid var(--k-focus);
		outline-offset: 0;
	}
	.x svg {
		width: var(--k-modal-close-icon);
		height: var(--k-modal-close-icon);
	}
	.x path {
		stroke-width: var(--k-close-stroke);
	}
	@keyframes k-pop {
		from {
			opacity: 0;
			transform: translateY(8px) scale(0.98);
		}
	}
	@media (max-width: 520px) {
		footer {
			flex-direction: column-reverse;
			/* Stacked: every action fills the row. The token (not a width rule on the children) is what KModal
			 * reads for the <k-button> hosts and the buttons inside them, so Svelte and custom elements agree. */
			--k-modal-action-w: 100%;
		}
	}
	@media (forced-colors: active) {
		.x {
			border: 1px solid ButtonText;
			color: ButtonText;
		}
	}
</style>
