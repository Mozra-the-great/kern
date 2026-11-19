<script lang="ts">
	import type { Snippet } from 'svelte';
	import { lockScroll } from './scroll-lock.js';

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
		closeLabel = 'Close',
		oncancel,
		onclose,
		footer,
		children
	}: Props = $props();

	let dialog: HTMLDialogElement | undefined = $state();
	const uid = $props.id();
	let release: (() => void) | undefined;
	/** A close the dialog could not refuse (an uncancelable `cancel`) that has to be undone. */
	let keepOpen = false;
	/** Close events still to come for closes `requestClose` already reported. */
	let skipCloseEvents = 0;

	$effect(() => {
		if (!dialog) return;
		if (open && !dialog.open) {
			dialog.showModal();
			release ??= lockScroll();
			focusInitial(dialog);
		} else if (!open && dialog.open) dialog.close();
	});
	$effect(() => () => {
		release?.();
		release = undefined;
	});

	function focusInitial(d: HTMLDialogElement) {
		if (initialFocus === undefined || initialFocus === '') return;
		let target: Element | null = typeof initialFocus === 'string' ? null : initialFocus;
		if (typeof initialFocus === 'string') {
			try {
				target = d.querySelector(initialFocus);
				const root = d.getRootNode();
				if (!target && root instanceof ShadowRoot) target = root.host.querySelector(initialFocus);
			} catch {
				// not a valid selector: keep the browser's choice
			}
		}
		if (target instanceof HTMLElement || target instanceof SVGElement) target.focus();
	}

	/** A close request by the user; true when the dialog closed. */
	function requestClose(): boolean {
		if (!dismissible || !dialog) return false;
		const event = new Event('cancel', { cancelable: true });
		oncancel?.(event);
		if (event.defaultPrevented) return false;
		dialog.close();
		// The close event comes a task later; update `open` now so the app can reopen right away.
		skipCloseEvents++;
		finish();
		return true;
	}
	function handleCancel(e: Event) {
		e.preventDefault();
		// Browsers ignore preventDefault() on a cancel without user activation; reopen after that close.
		if (!requestClose() && !e.cancelable) keepOpen = true;
	}
	function handleClose() {
		if (keepOpen && dialog) {
			keepOpen = false;
			dialog.showModal();
			return;
		}
		if (skipCloseEvents > 0) {
			skipCloseEvents--;
			return;
		}
		// Reopened before this close event arrived: nothing to report.
		if (dialog?.open) return;
		finish();
	}
	function finish() {
		release?.();
		release = undefined;
		open = false;
		onclose?.();
	}
	function handleClick(e: MouseEvent) {
		if (closeOnBackdrop && e.target === dialog) requestClose();
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
	oncancel={handleCancel}
	onclose={handleClose}
	onclick={handleClick}
>
	<div class="inner">
		<header>
			<h2 id="{uid}-t">{title}</h2>
			{#if dismissible}
				<button type="button" class="x" aria-label={closeLabel} onclick={requestClose}>
					<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="2" /></svg>
				</button>
			{/if}
		</header>
		{#if description}<p class="desc" id="{uid}-d">{description}</p>{/if}
		{#if children}<div class="body">{@render children()}</div>{/if}
		{#if footer}<footer>{@render footer()}</footer>{/if}
	</div>
</dialog>

<style>
	.k-modal {
		width: min(520px, calc(100vw - 32px));
		max-height: calc(100dvh - 32px);
		padding: 0;
		border: var(--k-border-w) solid var(--k-line-strong);
		border-radius: var(--k-radius-overlay);
		background: var(--k-bg-raised);
		color: var(--k-fg);
		box-shadow: var(--k-shadow-overlay);
		font-family: var(--k-font-sans);
	}
	[data-size='sm'] {
		width: min(400px, calc(100vw - 32px));
	}
	[data-size='lg'] {
		width: min(760px, calc(100vw - 32px));
	}
	.k-modal::backdrop {
		background: var(--k-backdrop);
	}
	.k-modal[open] {
		animation: k-pop var(--k-dur) var(--k-ease);
	}
	.inner {
		display: grid;
		gap: var(--k-space-4);
		padding: var(--k-space-6);
	}
	header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--k-space-4);
	}
	h2 {
		margin: 0;
		font-size: var(--k-text-lg);
		font-weight: var(--k-weight-heading);
		line-height: 1.3;
	}
	.desc {
		margin: calc(var(--k-space-2) * -1) 0 0;
		color: var(--k-fg-muted);
		font-size: var(--k-text-sm);
	}
	footer {
		display: flex;
		flex-wrap: wrap;
		justify-content: flex-end;
		gap: var(--k-space-3);
		margin-top: var(--k-space-2);
	}
	.x {
		flex: none;
		display: grid;
		place-items: center;
		width: var(--k-tap-icon);
		height: var(--k-tap-icon);
		margin: calc(12px - var(--k-tap-icon) / 2) calc(12px - var(--k-tap-icon) / 2) 0 0;
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
	@keyframes k-pop {
		from {
			opacity: 0;
			transform: translateY(8px) scale(0.98);
		}
	}
	@media (max-width: 520px) {
		footer {
			flex-direction: column-reverse;
		}
		footer :global(> *) {
			width: 100%;
		}
	}
</style>
