<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		open?: boolean | undefined;
		title: string;
		side?: 'right' | 'left' | 'bottom' | undefined;
		closeLabel?: string | undefined;
		onclose?: (() => void) | undefined;
		footer?: Snippet | undefined;
		children?: Snippet | undefined;
	}
	let { open = $bindable(), title, side = 'right', closeLabel = 'Close', onclose, footer, children }: Props = $props();
	let dialog: HTMLDialogElement | undefined = $state();
	const uid = $props.id();

	$effect(() => {
		if (!dialog) return;
		if (open && !dialog.open) dialog.showModal();
		else if (!open && dialog.open) dialog.close();
	});
</script>

<dialog
	bind:this={dialog}
	class="k-drawer"
	data-side={side}
	aria-labelledby="{uid}-t"
	onclose={() => {
		open = false;
		onclose?.();
	}}
	onclick={(e) => {
		if (e.target === dialog) dialog?.close();
	}}
>
	<div class="inner">
		<header>
			<h2 id="{uid}-t">{title}</h2>
			<button type="button" class="x" aria-label={closeLabel} onclick={() => dialog?.close()}>
				<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="2" /></svg>
			</button>
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
</style>
