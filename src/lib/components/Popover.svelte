<script lang="ts">
	import type { Snippet } from 'svelte';
	import { anchorTo, composedContains, eventWithin, focusFirstIn, type Placement } from './anchor.js';

	export type PopoverPlacement = Placement;

	interface Props {
		open?: boolean;
		/** Text of the trigger button; also the accessible name of the panel. */
		label: string;
		/** Custom trigger content; `label` stays the accessible name. Keep it non-interactive (text, icon). */
		trigger?: Snippet;
		triggerVariant?: 'secondary' | 'ghost';
		placement?: Placement;
		/** Called when the popover opens or closes. */
		ontoggle?: (open: boolean) => void;
		class?: string;
		/** Panel content. */
		children?: Snippet;
	}
	let {
		open = $bindable(false),
		label,
		trigger,
		triggerVariant = 'secondary',
		placement = 'bottom-start',
		ontoggle,
		class: cls = '',
		children
	}: Props = $props();
	const uid = $props.id();
	let btn: HTMLButtonElement | undefined = $state();
	let panel: HTMLElement | undefined = $state();
	let wasOpen = false;

	$effect(() => {
		if (!open || !btn || !panel) return;
		const stop = anchorTo(btn, panel, { placement });
		const target = panel;
		// Move focus into the panel: first tabbable element, else the panel itself.
		queueMicrotask(() => { if (!focusFirstIn(target)) target.focus(); });
		return stop;
	});

	$effect(() => {
		if (open === wasOpen) return;
		wasOpen = open;
		ontoggle?.(open);
	});

	function close(refocus: boolean) {
		if (!open) return;
		open = false;
		if (refocus) btn?.focus();
	}
	function onPanelKey(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			e.preventDefault();
			e.stopPropagation();
			close(true);
		}
	}
	function onFocusOut(e: FocusEvent) {
		// Non-modal: when focus leaves panel and trigger (e.g. Tab past the end), close quietly.
		const next = e.relatedTarget as Node | null;
		if (!next) return;
		if (composedContains(panel, next) || composedContains(btn, next)) return;
		close(false);
	}
	function onWindowPointer(e: PointerEvent) {
		if (open && !eventWithin(e, btn, panel)) close(false);
	}
	function onTriggerKey(e: KeyboardEvent) {
		if (e.key === 'Escape' && open) {
			e.preventDefault();
			close(true);
		}
	}
</script>

<svelte:window onpointerdown={onWindowPointer} />

<div class="k-popover {cls}">
	<button
		bind:this={btn}
		type="button"
		class="trigger"
		data-variant={triggerVariant}
		aria-haspopup="dialog"
		aria-expanded={open}
		aria-controls="{uid}-panel"
		aria-label={trigger ? label : undefined}
		onclick={() => (open ? close(true) : (open = true))}
		onkeydown={onTriggerKey}
	>
		{#if trigger}{@render trigger()}{:else}{label}<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" stroke-width="2" /></svg>{/if}
	</button>
	{#if open}
		<div
			class="panel"
			role="dialog"
			id="{uid}-panel"
			aria-label={label}
			tabindex="-1"
			bind:this={panel}
			onkeydown={onPanelKey}
			onfocusout={onFocusOut}
		>
			{@render children?.()}
		</div>
	{/if}
</div>

<style>
	.k-popover { position: relative; display: inline-block; }
	.trigger {
		display: inline-flex;
		align-items: center;
		gap: var(--k-space-2);
		min-height: var(--k-control-h);
		min-width: 40px;
		padding: 0 var(--k-space-4);
		border: var(--k-border-w) solid var(--k-border);
		border-radius: var(--k-radius-control);
		background: transparent;
		color: var(--k-fg);
		font-family: var(--k-label-font);
		font-size: var(--k-label-size);
		font-weight: var(--k-weight-label);
		text-transform: var(--k-label-transform);
		letter-spacing: var(--k-label-tracking);
		cursor: pointer;
	}
	.trigger[data-variant='ghost'] { border-color: transparent; }
	.trigger:hover, .trigger[aria-expanded='true'] { background: var(--k-bg-sunken); }
	.trigger:focus-visible { outline: var(--k-focus-w) solid var(--k-focus); outline-offset: var(--k-focus-offset); }
	.trigger svg { width: 14px; height: 14px; transition: transform var(--k-dur) var(--k-ease); }
	.trigger[aria-expanded='true'] svg { transform: rotate(180deg); }
	.panel {
		position: fixed;
		z-index: 950;
		box-sizing: border-box;
		width: max-content;
		min-width: 200px;
		max-width: min(360px, calc(100vw - 16px));
		max-height: var(--avail-h, 70vh);
		overflow: auto;
		padding: var(--k-space-4);
		border: var(--k-border-w) solid var(--k-line);
		border-radius: min(var(--k-radius-overlay), 16px);
		background: var(--k-bg-raised);
		color: var(--k-fg);
		box-shadow: var(--k-shadow-overlay);
		font-family: var(--k-font-sans);
		font-size: var(--k-text-sm);
		text-transform: none;
		letter-spacing: 0;
		animation: k-pop-down var(--k-dur) var(--k-ease);
	}
	.panel:global([data-placement^='top']) { animation-name: k-pop-up; }
	.panel:focus-visible { outline: var(--k-focus-w) solid var(--k-focus); outline-offset: var(--k-focus-offset); }
	@keyframes k-pop-down { from { opacity: 0; transform: translateY(-4px); } }
	@keyframes k-pop-up { from { opacity: 0; transform: translateY(4px); } }
</style>
