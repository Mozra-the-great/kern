<svelte:options
	customElement={{ props: { items: { type: 'Array' }, label: { type: 'String' }, menuLabel: { type: 'String', attribute: 'menu-label' } } }}
/>

<script lang="ts">
	/**
	 * @prop items {NavbarItem[]}
	 */
	import Navbar from '../lib/components/Navbar.svelte';
	import { hasSlot } from './form.js';
	/* items: JSON list of { label, href, current? }, optional: without items (missing or []) only the brand and actions
	 * render, no menu button and no nav. Slots: brand, actions. */
	let { items = [], label, menuLabel } = $props();
	const host = $host();
	const brand = hasSlot(host, 'brand');
	const actions = hasSlot(host, 'actions');
</script>

{#snippet brandS()}{#if brand}<slot name="brand" />{/if}{/snippet}
{#snippet actionsS()}{#if actions}<slot name="actions" />{/if}{/snippet}
<Navbar {items} {label} {menuLabel} brand={brand ? brandS : undefined} actions={actions ? actionsS : undefined} />
