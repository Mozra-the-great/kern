<script lang="ts">
	import type { Snippet } from 'svelte';

	export interface TabItem {
		id: string;
		label: string;
		disabled?: boolean | undefined;
	}
	interface Props {
		tabs: TabItem[];
		/** Id of the active tab. */
		value?: string | undefined;
		/** Accessible name of the tab list. */
		label?: string | undefined;
		/** `line` = underline marker, `pill` = filled segment. */
		look?: 'line' | 'pill' | undefined;
		/** Renders the panel of the given tab id. */
		panel: Snippet<[string]>;
		/** Called when the user picks another tab (click or arrow keys), not when `value` is set from outside. */
		onchange?: ((id: string) => void) | undefined;
		class?: string | undefined;
	}
	let { tabs, value = $bindable(), label, look = 'line', panel, onchange, class: cls = '' }: Props = $props();
	const uid = $props.id();
	const active = $derived(value ?? tabs.find((t) => !t.disabled)?.id ?? '');
	let list: HTMLElement | undefined = $state();

	function select(id: string, focus = false) {
		const changed = id !== active;
		value = id;
		if (changed) onchange?.(id);
		if (focus) list?.querySelector<HTMLElement>(`#${CSS.escape(`${uid}-tab-${id}`)}`)?.focus();
	}
	function onkeydown(e: KeyboardEvent) {
		const enabled = tabs.filter((t) => !t.disabled);
		const i = enabled.findIndex((t) => t.id === active);
		let n = -1;
		if (e.key === 'ArrowRight') n = (i + 1) % enabled.length;
		else if (e.key === 'ArrowLeft') n = (i - 1 + enabled.length) % enabled.length;
		else if (e.key === 'Home') n = 0;
		else if (e.key === 'End') n = enabled.length - 1;
		if (n >= 0) {
			e.preventDefault();
			select(enabled[n].id, true);
		}
	}
</script>

<div class="k-tabs {cls}" data-look={look}>
	<div class="list" role="tablist" aria-label={label} bind:this={list} tabindex="-1" {onkeydown}>
		{#each tabs as t (t.id)}
			<button
				type="button"
				role="tab"
				id="{uid}-tab-{t.id}"
				aria-selected={t.id === active}
				aria-controls="{uid}-panel-{t.id}"
				tabindex={t.id === active ? 0 : -1}
				disabled={t.disabled}
				onclick={() => select(t.id)}
			>
				{t.label}
			</button>
		{/each}
	</div>
	<div class="panel" role="tabpanel" id="{uid}-panel-{active}" aria-labelledby="{uid}-tab-{active}" tabindex="0">
		{@render panel(active)}
	</div>
</div>

<style>
	.k-tabs {
		display: grid;
		gap: var(--k-space-5);
		min-width: 0;
	}
	.list {
		display: flex;
		gap: var(--k-space-1);
		overflow-x: auto;
		scrollbar-width: thin;
		outline: none;
	}
	[data-look='line'] .list {
		border-bottom: var(--k-border-w) solid var(--k-line);
	}
	button {
		flex: none;
		min-height: var(--k-control-h);
		padding: 0 var(--k-space-4);
		border: 0;
		background: transparent;
		color: var(--k-fg-muted);
		font-family: var(--k-label-font);
		font-size: var(--k-label-size);
		font-weight: var(--k-weight-label);
		text-transform: var(--k-label-transform);
		letter-spacing: var(--k-label-tracking);
		cursor: pointer;
		transition:
			color var(--k-dur) var(--k-ease),
			background-color var(--k-dur) var(--k-ease),
			box-shadow var(--k-dur) var(--k-ease);
	}
	button:hover:not(:disabled) {
		color: var(--k-fg);
	}
	button:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}
	button:focus-visible {
		outline: var(--k-focus-w) solid var(--k-focus);
		outline-offset: calc(var(--k-focus-w) * -1);
	}
	[data-look='line'] button {
		margin-bottom: calc(var(--k-border-w) * -1);
		box-shadow: inset 0 -2px 0 transparent;
	}
	[data-look='line'] button[aria-selected='true'] {
		color: var(--k-fg);
		box-shadow: inset 0 -2px 0 var(--k-accent-mark);
	}
	[data-look='pill'] .list {
		padding: var(--k-space-1);
		background: var(--k-bg-sunken);
		border-radius: var(--k-radius-control);
		width: fit-content;
		max-width: 100%;
	}
	[data-look='pill'] button {
		min-height: max(calc(var(--k-control-h) - 8px), var(--k-tap-target));
		border-radius: var(--k-radius-control);
	}
	[data-look='pill'] button[aria-selected='true'] {
		color: var(--k-on-primary);
		background: var(--k-primary);
	}
	.panel:focus-visible {
		outline: var(--k-focus-w) solid var(--k-focus);
		outline-offset: var(--k-focus-offset);
	}
</style>
