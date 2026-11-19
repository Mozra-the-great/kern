<script lang="ts">
	import { strings } from './strings.svelte.js';
	import { tick } from 'svelte';
	import { sharedToastQueue, type ToastItem, type ToastQueue } from './toast-queue.js';

	interface Props {
		/** Corner or edge of the viewport. Default `bottom-right`. */
		position?: 'bottom-right' | 'bottom-left' | 'bottom-center' | 'top-right' | 'top-left' | 'top-center' | undefined;
		dismissLabel?: string | undefined;
		/** Label of the undo button of toasts with `onundo`. */
		undoLabel?: string | undefined;
		/** Accessible name of the notification region. */
		label?: string | undefined;
		/** Most toasts open at once; sets the queue's limit (default 5). The oldest closes first. */
		max?: number | undefined;
		/** Queue to render. Default: the page-wide queue behind `toast()`. */
		queue?: ToastQueue | undefined;
		/** The user pressed a toast's dismiss button. */
		ondismiss?: ((item: ToastItem) => void) | undefined;
		/** The user pressed a toast's undo button. */
		onundo?: ((item: ToastItem) => void) | undefined;
		/** The user pressed a toast's action button. */
		onaction?: ((item: ToastItem) => void) | undefined;
	}
	let {
		position = 'bottom-right',
		dismissLabel: dismissLabelProp,
		undoLabel: undoLabelProp,
		label: labelProp,
		max,
		queue,
		ondismiss,
		onundo,
		onaction
	}: Props = $props();
	const dismissLabel = $derived(dismissLabelProp ?? strings().toaster.dismissLabel);
	const undoLabel = $derived(undoLabelProp ?? strings().toaster.undoLabel);
	const label = $derived(labelProp ?? strings().toaster.label);

	const q = $derived(queue ?? sharedToastQueue());
	let items: readonly ToastItem[] = $state.raw([]);
	let region: HTMLElement | undefined = $state();
	/** Where focus came from when it entered the region: it goes back there when the last toast closes. */
	let returnTo: HTMLElement | null = null;

	$effect(() =>
		q.subscribe((list) => {
			items = list;
		})
	);
	$effect(() => {
		if (max !== undefined) q.max = max;
	});

	const polite = $derived(items.filter((t) => t.tone !== 'danger'));
	const assertive = $derived(items.filter((t) => t.tone === 'danger'));

	/** Pauses the toast's countdown while it is hovered, holds focus or the tab is hidden. */
	function hold(node: HTMLElement, id: number) {
		const owner = q;
		let hovered = false;
		let focused = false;
		let hidden = typeof document !== 'undefined' && document.visibilityState === 'hidden';
		let held = false;
		const sync = () => {
			const want = hovered || focused || hidden;
			if (want === held) return;
			held = want;
			if (want) owner.pause(id);
			else owner.resume(id);
		};
		const enter = () => {
			hovered = true;
			sync();
		};
		const leave = () => {
			hovered = false;
			sync();
		};
		const focusin = () => {
			focused = true;
			sync();
		};
		const focusout = (e: FocusEvent) => {
			if (e.relatedTarget instanceof Node && node.contains(e.relatedTarget)) return;
			focused = false;
			sync();
		};
		const visibility = () => {
			hidden = document.visibilityState === 'hidden';
			sync();
		};
		node.addEventListener('mouseenter', enter);
		node.addEventListener('mouseleave', leave);
		node.addEventListener('focusin', focusin);
		node.addEventListener('focusout', focusout);
		document.addEventListener('visibilitychange', visibility);
		sync();
		return {
			destroy() {
				node.removeEventListener('mouseenter', enter);
				node.removeEventListener('mouseleave', leave);
				node.removeEventListener('focusin', focusin);
				node.removeEventListener('focusout', focusout);
				document.removeEventListener('visibilitychange', visibility);
				if (held) owner.resume(id);
			}
		};
	}

	function trackEntry(e: FocusEvent) {
		const from = e.relatedTarget;
		if (from instanceof HTMLElement && from.isConnected && region && !region.contains(from)) returnTo = from;
	}

	/**
	 * Runs `close` for the toast of the pressed button. After a keyboard activation focus moves to
	 * the next toast (or the previous one), else back to where it came from, instead of the page start.
	 */
	async function closeFrom(e: MouseEvent, close: () => void) {
		const toast = (e.currentTarget as HTMLElement).closest('.toast');
		const keyboard = e.detail === 0;
		let target: Element | null | undefined;
		if (keyboard && region && toast) {
			const all = [...region.querySelectorAll('.toast')];
			const at = all.indexOf(toast);
			target = all[at + 1] ?? all[at - 1];
		}
		close();
		if (!keyboard) return;
		await tick();
		const button = target?.isConnected ? target.querySelector('button') : null;
		if (button) {
			button.focus();
			return;
		}
		if (returnTo?.isConnected) returnTo.focus();
		returnTo = null;
	}
</script>

{#snippet card(t: ToastItem)}
	<div class="toast" data-tone={t.tone} use:hold={t.id}>
		<span class="dot" aria-hidden="true"></span>
		<div class="content">
			{#if t.title}<p class="title">{t.title}</p>{/if}
			<p class="msg">{t.message}</p>
		</div>
		{#if t.onundo}
			<button
				type="button"
				class="act"
				onclick={(e) =>
					closeFrom(e, () => {
						q.undo(t.id);
						onundo?.(t);
					})}
			>
				{undoLabel}
			</button>
		{/if}
		{#if t.action}
			<button
				type="button"
				class="act"
				onclick={(e) =>
					closeFrom(e, () => {
						q.runAction(t.id);
						onaction?.(t);
					})}
			>
				{t.action.label}
			</button>
		{/if}
		<button
			type="button"
			class="x"
			aria-label={dismissLabel}
			onclick={(e) =>
				closeFrom(e, () => {
					q.dismiss(t.id);
					ondismiss?.(t);
				})}
		>
			<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="2" /></svg>
		</button>
	</div>
{/snippet}

<!-- Both live regions exist from the start, so screen readers announce what is added to them:
     danger interrupts (alert), everything else waits its turn (status). -->
<section bind:this={region} class="k-toaster" data-pos={position} aria-label={label} onfocusin={trackEntry}>
	{#key q}
		<div class="list" role="status" aria-atomic="false">
			{#each polite as t (t.id)}{@render card(t)}{/each}
		</div>
		<div class="list" role="alert" aria-atomic="false">
			{#each assertive as t (t.id)}{@render card(t)}{/each}
		</div>
	{/key}
</section>

<style>
	.k-toaster {
		position: fixed;
		z-index: 1000;
		pointer-events: none;
		padding: var(--k-toaster-offset);
		width: min(var(--k-toaster-width), 100vw);
		box-sizing: border-box;
	}
	[data-pos='bottom-right'] {
		right: 0;
		bottom: 0;
	}
	[data-pos='bottom-left'] {
		left: 0;
		bottom: 0;
	}
	[data-pos='top-right'] {
		right: 0;
		top: 0;
	}
	[data-pos='top-left'] {
		left: 0;
		top: 0;
	}
	[data-pos='bottom-center'] {
		left: 50%;
		bottom: 0;
		transform: translateX(-50%);
	}
	[data-pos='top-center'] {
		left: 50%;
		top: 0;
		transform: translateX(-50%);
	}
	@media (max-width: 760px) {
		[data-pos^='bottom'] {
			padding-bottom: var(--k-toaster-offset-mobile);
		}
	}
	.list {
		display: flex;
		flex-direction: column;
		gap: var(--k-space-2);
	}
	[data-pos^='bottom'] .list {
		flex-direction: column-reverse;
	}
	.list:has(> .toast) + .list:has(> .toast) {
		margin-top: var(--k-space-2);
	}
	.toast {
		--c: var(--k-info);
		pointer-events: auto;
		display: flex;
		gap: var(--k-space-3);
		align-items: flex-start;
		padding: var(--k-toast-pad);
		border: var(--k-border-w) solid var(--k-line-strong);
		border-radius: var(--k-radius-overlay);
		background: var(--k-bg-raised);
		color: var(--k-fg);
		box-shadow: var(--k-shadow-sm);
		animation: k-in var(--k-dur) var(--k-ease);
	}
	[data-tone='ok'] {
		--c: var(--k-ok);
		border-color: var(--k-toast-ok-border);
	}
	[data-tone='warn'] {
		--c: var(--k-warn);
		border-color: var(--k-toast-warn-border);
		background: var(--k-surface-warn);
	}
	[data-tone='danger'] {
		--c: var(--k-danger);
		border-color: var(--k-danger);
		background: var(--k-surface-danger);
	}
	.dot {
		flex: none;
		width: 10px;
		height: 10px;
		margin-top: 7px;
		border-radius: var(--k-radius-badge);
		background: var(--c);
	}
	.content {
		flex: 1;
		min-width: 0;
		padding-top: 2px;
		overflow-wrap: anywhere;
	}
	.title {
		margin: 0;
		font-weight: var(--k-weight-heading);
	}
	.msg {
		margin: 0;
		font-size: var(--k-toast-msg-size);
	}
	.act {
		position: relative;
		flex: none;
		min-height: 32px;
		padding: 0 var(--k-space-3);
		border: var(--k-border-w) solid var(--k-border);
		border-radius: var(--k-radius-control);
		background: transparent;
		color: var(--k-fg);
		font: inherit;
		font-size: var(--k-text-sm);
		font-weight: var(--k-weight-label);
		cursor: pointer;
	}
	.act:hover {
		background: var(--k-bg-sunken);
	}
	.x {
		position: relative;
		flex: none;
		display: grid;
		place-items: center;
		width: 32px;
		height: 32px;
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
	.act::after,
	.x::after {
		content: '';
		position: absolute;
		inset: min(0px, calc((100% - var(--k-tap-target)) / 2));
	}
	.x svg {
		width: 14px;
		height: 14px;
	}
	button:focus-visible {
		outline: var(--k-focus-w) solid var(--k-focus);
		outline-offset: 0;
	}
	@keyframes k-in {
		from {
			opacity: 0;
			transform: translateY(8px);
		}
	}
	/* Windows high contrast: a visible edge per toast and a tone dot that keeps its shape. */
	@media (forced-colors: active) {
		.toast {
			border: 1px solid CanvasText;
		}
		[data-tone='danger'] {
			border-width: 3px;
		}
		.dot {
			forced-color-adjust: none;
			background: CanvasText;
		}
		/* the tone dot differs by shape as well as colour: ok = circle, warn = diamond, others = square */
		[data-tone='ok'] .dot {
			border-radius: 50%;
		}
		[data-tone='warn'] .dot {
			transform: rotate(45deg);
		}
		/* the dismiss and action buttons are borderless: give them an edge */
		.x,
		.act {
			border: 1px solid ButtonText;
			color: ButtonText;
		}
		button:focus-visible {
			outline-color: Highlight;
		}
	}
</style>
