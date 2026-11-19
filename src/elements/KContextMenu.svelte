<svelte:options
	customElement={{
		props: {
			items: { type: 'Array' },
			label: { type: 'String' },
			areaLabel: { type: 'String', attribute: 'area-label' },
			focusable: { type: 'String' },
			longPress: { type: 'Number', attribute: 'long-press' },
			disabled: { type: 'Boolean' }
		}
	}}
/>

<script lang="ts">
	/**
	 * @prop items {MenuEntry[]}
	 * @event select {string} Id of the chosen item.
	 */
	import ContextMenu from '../lib/components/ContextMenu.svelte';
	import type { MenuEntry } from '../lib/components/DropdownMenu.svelte';
	import { emit } from './form.js';
	/* Default slot = target area. items: JSON list like k-dropdown-menu; choosing an item fires "select" with its id.
	   focusable="false" takes the area out of the tab order (when the slotted content is focusable itself). */
	let { items = [], label, areaLabel, focusable, longPress, disabled = false } = $props();
	const host = $host();
	const wired = $derived(
		items.map((i: MenuEntry) => (i.type === 'separator' || i.type === 'label' ? i : { ...i, onselect: () => emit(host, 'select', i.id) }))
	);
</script>

<ContextMenu items={wired} {label} {areaLabel} focusable={focusable !== 'false' && focusable !== false} {longPress} {disabled}>
	<slot />
</ContextMenu>
