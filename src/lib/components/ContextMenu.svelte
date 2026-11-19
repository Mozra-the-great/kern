<script lang="ts">
	import { strings } from './strings.svelte.js';
	import type { Snippet } from 'svelte';
	import type { MenuEntry } from './DropdownMenu.svelte';
	import { activeElementOf, composedContains, deepActiveElement, eventWithin, placeAtPoint } from './anchor.js';

	interface Props {
		items: MenuEntry[];
		/** Accessible name of the menu. */
		label?: string | undefined;
		/** Accessible name of the target area (role="group"). Recommended when the area is focusable. */
		areaLabel?: string | undefined;
		/** Make the target area itself focusable so keyboard users can open the menu. Turn off when it holds focusable content. */
		focusable?: boolean | undefined;
		/** Long-press delay on touch, in ms. */
		longPress?: number | undefined;
		disabled?: boolean | undefined;
		class?: string | undefined;
		/** The target area. */
		children: Snippet;
	}
	let {
		items,
		label: labelProp,
		areaLabel,
		focusable = true,
		longPress = 500,
		disabled = false,
		class: cls = '',
		children
	}: Props = $props();
	const label = $derived(labelProp ?? strings().contextMenu.label);
	const uid = $props.id();

	let open = $state(false);
	let point = $state({ x: 0, y: 0 });
	let area: HTMLElement | undefined = $state();
	let menu: HTMLElement | undefined = $state();
	let restore: HTMLElement | null = null;
	let keyboardOpenedAt = -Infinity;
	let pressTimer: ReturnType<typeof setTimeout> | undefined;
	let pressStart: { x: number; y: number; id: number } | null = null;
	let swallowClick = false;

	const entries = () => Array.from(menu?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])') ?? []);

	$effect(() => {
		if (!open || !menu) return;
		placeAtPoint(menu, point.x, point.y);
		const target = menu;
		queueMicrotask(() => (entries()[0] ?? target).focus());
	});

	function openAt(x: number, y: number) {
		if (disabled || !area) return;
		const focused = deepActiveElement();
		if (!open) restore = focused instanceof HTMLElement && composedContains(area, focused) ? focused : focusable ? area : null;
		point = { x, y };
		open = true;
	}
	function close(refocus = true) {
		if (!open) return;
		open = false;
		if (refocus) restore?.focus();
		restore = null;
	}
	function cancelPress() {
		clearTimeout(pressTimer);
		pressTimer = undefined;
		pressStart = null;
	}

	function oncontextmenu(e: MouseEvent) {
		if (disabled) return;
		e.preventDefault();
		cancelPress();
		// The keyboard path already opened the menu; browsers may fire contextmenu after the key too.
		if (open && performance.now() - keyboardOpenedAt < 800) return;
		openAt(e.clientX, e.clientY);
	}
	function onAreaKey(e: KeyboardEvent) {
		if (disabled) return;
		if ((e.key === 'F10' && e.shiftKey) || e.key === 'ContextMenu') {
			e.preventDefault();
			const origin = e.composedPath()[0];
			const from = origin instanceof Element ? origin : area;
			const r = from?.getBoundingClientRect();
			if (!r) return;
			keyboardOpenedAt = performance.now();
			openAt(r.left + Math.min(16, r.width / 2), Math.min(r.bottom, r.top + 40));
		}
	}
	function onpointerdown(e: PointerEvent) {
		if (disabled || e.pointerType === 'mouse') return;
		cancelPress();
		pressStart = { x: e.clientX, y: e.clientY, id: e.pointerId };
		pressTimer = setTimeout(() => {
			if (!pressStart) return;
			swallowClick = true;
			openAt(pressStart.x, pressStart.y);
			pressStart = null;
		}, longPress);
	}
	function onpointermove(e: PointerEvent) {
		if (!pressStart || e.pointerId !== pressStart.id) return;
		if (Math.hypot(e.clientX - pressStart.x, e.clientY - pressStart.y) > 10) cancelPress();
	}
	function onclickcapture(e: MouseEvent) {
		// The tap that ended a long press must not also activate what is under the finger.
		if (!swallowClick) return;
		swallowClick = false;
		e.preventDefault();
		e.stopPropagation();
	}

	function onMenuKey(e: KeyboardEvent) {
		const list = entries();
		const i = menu ? list.indexOf(activeElementOf(menu) as HTMLElement) : -1;
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			list[(i + 1) % list.length]?.focus();
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			list[(i - 1 + list.length) % list.length]?.focus();
		} else if (e.key === 'Home') {
			e.preventDefault();
			list[0]?.focus();
		} else if (e.key === 'End') {
			e.preventDefault();
			list[list.length - 1]?.focus();
		} else if (e.key === 'Escape' || (e.key === 'F10' && e.shiftKey) || e.key === 'ContextMenu') {
			e.preventDefault();
			e.stopPropagation();
			close();
		} else if (e.key === 'Tab') close(false);
		else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
			const k = e.key.toLowerCase();
			const hit = [...list.slice(i + 1), ...list.slice(0, i + 1)].find((el) => el.textContent?.trim().toLowerCase().startsWith(k));
			hit?.focus();
		}
	}
	function choose(item: Extract<MenuEntry, { id: string }>) {
		if (item.disabled) return;
		close();
		item.onselect?.();
	}
	function onWindowPointer(e: PointerEvent) {
		if (open && !eventWithin(e, menu)) close(false);
	}
	function onWindowScroll(e: Event) {
		if (open && !eventWithin(e, menu)) close(false);
	}
</script>

<svelte:window
	onpointerdown={onWindowPointer}
	onscrollcapture={onWindowScroll}
	onresize={() => close(false)}
	onblur={() => close(false)}
	onpointerup={cancelPress}
	onpointercancel={cancelPress}
/>

<!-- The area must be reachable by keyboard so Shift+F10 / the menu key can open the menu;
     like a focusable scroll region it carries a group role and, ideally, a name (areaLabel). -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
<div
	class="k-context-area {cls}"
	bind:this={area}
	role="group"
	aria-label={areaLabel}
	aria-keyshortcuts={disabled ? undefined : 'Shift+F10'}
	tabindex={focusable && !disabled ? 0 : undefined}
	{oncontextmenu}
	onkeydown={onAreaKey}
	{onpointerdown}
	{onpointermove}
	{onclickcapture}
>
	{@render children()}
</div>

{#if open}
	<div
		class="menu"
		role="menu"
		id="{uid}-menu"
		tabindex="-1"
		aria-label={label}
		bind:this={menu}
		onkeydown={onMenuKey}
		oncontextmenu={(e) => e.preventDefault()}
	>
		{#each items as item, i (i)}
			{#if item.type === 'separator'}
				<div class="sep" role="separator"></div>
			{:else if item.type === 'label'}
				<div class="group-label" role="presentation">{item.label}</div>
			{:else if item.href}
				<a
					role="menuitem"
					tabindex="-1"
					href={item.href}
					class:danger={item.danger}
					aria-disabled={item.disabled || undefined}
					onclick={() => close(false)}
				>
					<span>{item.label}</span>{#if item.shortcut}<kbd>{item.shortcut}</kbd>{/if}
				</a>
			{:else}
				<button
					type="button"
					role="menuitem"
					tabindex="-1"
					class:danger={item.danger}
					aria-disabled={item.disabled || undefined}
					onclick={() => choose(item)}
				>
					<span>{item.label}</span>{#if item.shortcut}<kbd>{item.shortcut}</kbd>{/if}
				</button>
			{/if}
		{/each}
	</div>
{/if}

<style>
	.k-context-area {
		-webkit-touch-callout: none;
	}
	.k-context-area:focus-visible {
		outline: var(--k-focus-w) solid var(--k-focus);
		outline-offset: var(--k-focus-offset);
	}
	.menu {
		position: fixed;
		z-index: 950;
		box-sizing: border-box;
		min-width: 220px;
		max-width: calc(100vw - 16px);
		max-height: var(--avail-h, calc(100vh - 16px));
		overflow-y: auto;
		padding: var(--k-space-1);
		border: var(--k-border-w) solid var(--k-line-strong);
		border-radius: min(var(--k-radius-overlay), 16px);
		background: var(--k-bg-raised);
		color: var(--k-fg);
		box-shadow: var(--k-shadow-overlay);
		font-family: var(--k-font-sans);
		text-transform: none;
		letter-spacing: 0;
		transform-origin: top left;
		animation: k-ctx var(--k-dur) var(--k-ease);
	}
	.menu:focus-visible {
		outline: var(--k-focus-w) solid var(--k-focus);
		outline-offset: var(--k-focus-offset);
	}
	[role='menuitem'] {
		display: flex;
		width: 100%;
		box-sizing: border-box;
		align-items: center;
		justify-content: space-between;
		gap: var(--k-space-4);
		min-height: max(40px, var(--k-tap-target));
		padding: 0 var(--k-space-3);
		border: 0;
		border-radius: min(var(--k-radius-control), 10px);
		background: transparent;
		color: var(--k-fg);
		font: inherit;
		font-size: var(--k-text-sm);
		text-align: left;
		text-decoration: none;
		cursor: pointer;
	}
	[role='menuitem']:hover,
	[role='menuitem']:focus {
		background: var(--k-selected);
		outline: none;
	}
	[role='menuitem']:focus-visible {
		outline: var(--k-focus-w) solid var(--k-focus);
		outline-offset: calc(var(--k-focus-w) * -1);
	}
	[aria-disabled='true'] {
		color: var(--k-fg-disabled);
		cursor: not-allowed;
	}
	.danger {
		color: var(--k-danger);
	}
	kbd {
		font-family: var(--k-font-mono);
		font-size: var(--k-text-xs);
		color: var(--k-fg-muted);
	}
	.sep {
		height: 0;
		margin: var(--k-space-1) 0;
		border-top: var(--k-border-w) solid var(--k-line);
	}
	.group-label {
		padding: var(--k-space-2) var(--k-space-3) var(--k-space-1);
		font-family: var(--k-label-font);
		font-size: var(--k-text-xs);
		color: var(--k-fg-muted);
		text-transform: var(--k-label-transform);
		letter-spacing: var(--k-label-tracking);
	}
	@keyframes k-ctx {
		from {
			opacity: 0;
			transform: scale(0.97);
		}
	}
</style>
