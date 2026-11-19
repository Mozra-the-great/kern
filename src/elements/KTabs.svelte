<svelte:options customElement={{ tag: 'k-tabs', props: { tabs: { type: "Array" }, value: { type: 'String', reflect: true }, label: { type: "String" }, look: { type: "String" } } }} />
<script lang="ts">
	import Tabs, { type TabItem } from '../lib/components/Tabs.svelte';
	import { emit } from './form.js';
	/* Panels are light-DOM children with data-tab="<id>"; only the active one is shown.
	   "change" fires for user input only: never during render, never when value/tabs are set. */
	let { tabs = [], value = $bindable(), label, look } = $props();
	const host = $host();
	const list = $derived<TabItem[]>(Array.isArray(tabs) ? tabs : []);
	const active = $derived<string>(value ?? list.find((t) => !t.disabled)?.id ?? '');
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
			if (records.some((r) => r.target === host || (r.type === 'attributes' && r.target.parentNode === host))) hidePanels(id);
		});
		mo.observe(host, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-tab'] });
		return () => mo.disconnect();
	});
</script>
<Tabs tabs={list} bind:value {label} {look} onchange={(id: string) => emit(host, 'change', id)}>
	{#snippet panel()}{#if list}<slot />{/if}{/snippet}
</Tabs>
