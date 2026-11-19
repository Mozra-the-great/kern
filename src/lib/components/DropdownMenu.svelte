<script lang="ts">
	import type { Snippet } from 'svelte';

	export type MenuEntry =
		| { type?: 'item'; id: string; label: string; onselect?: () => void; href?: string; danger?: boolean; disabled?: boolean; shortcut?: string }
		| { type: 'separator' }
		| { type: 'label'; label: string };

	interface Props {
		/** Text of the trigger button. */
		label: string;
		items: MenuEntry[];
		align?: 'start' | 'end';
		/** Custom trigger content; `label` stays the accessible name. */
		trigger?: Snippet;
		triggerVariant?: 'secondary' | 'ghost';
		class?: string;
	}
	let { label, items, align = 'start', trigger, triggerVariant = 'secondary', class: cls = '' }: Props = $props();
	const uid = $props.id();
	let open = $state(false);
	let btn: HTMLButtonElement | undefined = $state();
	let menu: HTMLElement | undefined = $state();

	const entries = () => Array.from(menu?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])') ?? []);

	function openMenu(focus: 'first' | 'last' = 'first') {
		open = true;
		queueMicrotask(() => {
			const list = entries();
			(focus === 'first' ? list[0] : list[list.length - 1])?.focus();
		});
	}
	function close(refocus = true) {
		open = false;
		if (refocus) btn?.focus();
	}
	function onTriggerKey(e: KeyboardEvent) {
		if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openMenu('first'); }
		else if (e.key === 'ArrowUp') { e.preventDefault(); openMenu('last'); }
	}
	function onMenuKey(e: KeyboardEvent) {
		const list = entries();
		const i = list.indexOf(document.activeElement as HTMLElement);
		if (e.key === 'ArrowDown') { e.preventDefault(); list[(i + 1) % list.length]?.focus(); }
		else if (e.key === 'ArrowUp') { e.preventDefault(); list[(i - 1 + list.length) % list.length]?.focus(); }
		else if (e.key === 'Home') { e.preventDefault(); list[0]?.focus(); }
		else if (e.key === 'End') { e.preventDefault(); list[list.length - 1]?.focus(); }
		else if (e.key === 'Escape') { e.preventDefault(); close(); }
		else if (e.key === 'Tab') close(false);
		else if (e.key.length === 1) {
			const k = e.key.toLowerCase();
			const hit = [...list.slice(i + 1), ...list.slice(0, i + 1)].find((el) => el.textContent?.trim().toLowerCase().startsWith(k));
			hit?.focus();
		}
	}
	function choose(item: Extract<MenuEntry, { id: string }>) {
		if (item.disabled) return;
		item.onselect?.();
		close();
	}
	function onWindowClick(e: MouseEvent) {
		if (open && !btn?.contains(e.target as Node) && !menu?.contains(e.target as Node)) close(false);
	}
</script>

<svelte:window onclick={onWindowClick} />

<div class="k-dropdown {cls}">
	<button
		bind:this={btn}
		type="button"
		class="trigger"
		data-variant={triggerVariant}
		aria-haspopup="menu"
		aria-expanded={open}
		aria-controls="{uid}-menu"
		aria-label={trigger ? label : undefined}
		onclick={() => (open ? close() : openMenu())}
		onkeydown={onTriggerKey}
	>
		{#if trigger}{@render trigger()}{:else}{label}<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" stroke-width="2" /></svg>{/if}
	</button>
	{#if open}
		<div class="menu" role="menu" id="{uid}-menu" tabindex="-1" aria-label={label} data-align={align} bind:this={menu} onkeydown={onMenuKey}>
			{#each items as item, i (i)}
				{#if item.type === 'separator'}
					<div class="sep" role="separator"></div>
				{:else if item.type === 'label'}
					<div class="group-label" role="presentation">{item.label}</div>
				{:else if item.href}
					<a role="menuitem" tabindex="-1" href={item.href} class:danger={item.danger} aria-disabled={item.disabled || undefined} onclick={() => close(false)}>
						<span>{item.label}</span>{#if item.shortcut}<kbd>{item.shortcut}</kbd>{/if}
					</a>
				{:else}
					<button type="button" role="menuitem" tabindex="-1" class:danger={item.danger} aria-disabled={item.disabled || undefined} onclick={() => choose(item)}>
						<span>{item.label}</span>{#if item.shortcut}<kbd>{item.shortcut}</kbd>{/if}
					</button>
				{/if}
			{/each}
		</div>
	{/if}
</div>

<style>
	.k-dropdown { position: relative; display: inline-block; }
	.trigger {
		display: inline-flex;
		box-sizing: border-box;
		align-items: center;
		gap: var(--k-space-2);
		min-height: var(--k-control-h);
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
	.trigger svg { width: 14px; height: 14px; }
	.menu {
		position: absolute;
		z-index: 950;
		top: calc(100% + 6px);
		min-width: 220px;
		padding: var(--k-space-1);
		border: var(--k-border-w) solid var(--k-line-strong);
		border-radius: min(var(--k-radius-overlay), 16px);
		background: var(--k-bg-raised);
		box-shadow: var(--k-shadow-overlay);
		animation: k-drop var(--k-dur) var(--k-ease);
	}
	[data-align='start'] { left: 0; }
	[data-align='end'] { right: 0; }
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
	[role='menuitem']:hover, [role='menuitem']:focus { background: var(--k-selected); outline: none; }
	[role='menuitem']:focus-visible { outline: var(--k-focus-w) solid var(--k-focus); outline-offset: calc(var(--k-focus-w) * -1); }
	[aria-disabled='true'] { color: var(--k-fg-disabled); cursor: not-allowed; }
	.danger { color: var(--k-danger); }
	kbd { font-family: var(--k-font-mono); font-size: var(--k-text-xs); color: var(--k-fg-muted); }
	.sep { height: 0; margin: var(--k-space-1) 0; border-top: var(--k-border-w) solid var(--k-line); }
	.group-label { padding: var(--k-space-2) var(--k-space-3) var(--k-space-1); font-family: var(--k-label-font); font-size: var(--k-text-xs); color: var(--k-fg-muted); text-transform: var(--k-label-transform); letter-spacing: var(--k-label-tracking); }
	@keyframes k-drop { from { opacity: 0; transform: translateY(-4px); } }
</style>
