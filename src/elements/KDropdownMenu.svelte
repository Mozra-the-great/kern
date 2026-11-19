<svelte:options customElement={{ props: { label: { type: "String" }, items: { type: "Array" }, align: { type: "String" }, triggerVariant: { type: 'String', attribute: 'trigger-variant' } } }} />
<script lang="ts">
	/**
	 * @prop items {MenuEntry[]}
	 * @event select {string} Id of the chosen item.
	 */
	import DropdownMenu from '../lib/components/DropdownMenu.svelte';
	import type { MenuEntry } from '../lib/components/DropdownMenu.svelte';
	import { emit } from './form.js';
	/* items: JSON list like the Svelte prop; choosing an item fires "select" with its id. */
	let { label = '', items = [], align, triggerVariant } = $props();
	const host = $host();
	const wired = $derived(items.map((i: MenuEntry) => (i.type === 'separator' || i.type === 'label' ? i : { ...i, onselect: () => emit(host, 'select', i.id) })));
</script>
<DropdownMenu {label} items={wired} {align} {triggerVariant} />
