<svelte:options customElement={{ tag: 'k-tabs', props: { tabs: { type: "Array" }, value: { type: 'String', reflect: true }, label: { type: "String" }, look: { type: "String" } } }} />
<script lang="ts">
	import Tabs from '../lib/components/Tabs.svelte';
	import { emit } from './form.js';
	/* Panels are light-DOM children with data-tab="<id>"; only the active one is shown. */
	let { tabs = [], value = $bindable(), label, look } = $props();
	const host = $host();
	let last: string | undefined;
	function sync(active: string) {
		for (const el of host.querySelectorAll<HTMLElement>(':scope > [data-tab]')) el.hidden = el.dataset.tab !== active;
		if (last !== undefined && last !== active) emit(host, 'change', active);
		last = active;
		return '';
	}
</script>
<Tabs {tabs} bind:value {label} {look}>
	{#snippet panel(active)}{sync(active)}<slot />{/snippet}
</Tabs>
