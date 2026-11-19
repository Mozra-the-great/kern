<svelte:options
	customElement={{
		props: { tabs: { type: 'Array' }, value: { type: 'String', reflect: true }, label: { type: 'String' }, look: { type: 'String' } }
	}}
/>

<script lang="ts">
	/**
	 * Tabs. Panels are children with `data-tab="<id>"`; only the active one is shown. Without children
	 * the element is only the tab bar (app navigation): no tabpanel, the page swaps its content on
	 * `change`. Items may carry `badge`, `dot`, `badgeLabel`, `badgeTone`, `hidden` and `disabled`.
	 * @prop tabs {TabItem[]}
	 * @prop look {'line' | 'pill'}
	 * @event change {string} Id of the tab the user picked.
	 */
	import Tabs, { type TabItem } from '../lib/components/Tabs.svelte';
	import { emit } from './form.js';
	/* "change" fires for user input only: never during render, never when value/tabs are set. */
	let { tabs = [], value = $bindable(), label, look } = $props();
	const host = $host();
	const list = $derived<TabItem[]>(Array.isArray(tabs) ? tabs : []);
	const active = $derived<string>(value ?? list.find((t) => !t.disabled && !t.hidden)?.id ?? '');
	/** True while the element has children (panels); without any it renders no tabpanel. */
	const hasContent = (): boolean =>
		[...host.childNodes].some(
			(n) => n.nodeType === Node.ELEMENT_NODE || (n.nodeType === Node.TEXT_NODE && (n.textContent ?? '').trim() !== '')
		);
	let panels = $state(hasContent());
	function hidePanels(id: string) {
		for (const el of host.querySelectorAll<HTMLElement>(':scope > [data-tab]')) {
			const hidden = el.dataset.tab !== id;
			if (el.hidden !== hidden) el.hidden = hidden;
		}
	}
	$effect(() => {
		const id = active;
		hidePanels(id);
		// Panels added or retargeted later (e.g. rendered by a framework after upgrade) follow too.
		const mo = new MutationObserver((records) => {
			panels = hasContent();
			if (records.some((r) => r.target === host || (r.type === 'attributes' && r.target.parentNode === host))) hidePanels(id);
		});
		mo.observe(host, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-tab'], characterData: true });
		return () => mo.disconnect();
	});
</script>

{#snippet panelS()}{#if list}<slot />{/if}{/snippet}
<Tabs tabs={list} bind:value {label} {look} panel={panels ? panelS : undefined} onchange={(id: string) => emit(host, 'change', id)} />
