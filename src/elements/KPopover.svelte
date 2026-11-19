<svelte:options
	customElement={{
		props: {
			open: { type: 'Boolean', reflect: true },
			label: { type: 'String' },
			placement: { type: 'String' },
			triggerVariant: { type: 'String', attribute: 'trigger-variant' }
		}
	}}
/>

<script lang="ts">
	/**
	 * @event toggle {boolean} Open state after the user opened or closed it.
	 * @event close The user closed the popover.
	 */
	import Popover from '../lib/components/Popover.svelte';
	import { emit, hasSlot } from './form.js';
	/* Default slot = panel content; optional slot "trigger" = content of the trigger button (text/icon, not interactive). */
	let { open = $bindable(false), label = '', placement, triggerVariant } = $props();
	const host = $host();
	const trigger = hasSlot(host, 'trigger');
	function toggled(o: boolean) {
		emit(host, 'toggle', o);
		if (!o) emit(host, 'close');
	}
</script>

{#snippet triggerS()}{#if trigger}<slot name="trigger" />{/if}{/snippet}
<Popover bind:open {label} {placement} {triggerVariant} trigger={trigger ? triggerS : undefined} ontoggle={toggled}><slot /></Popover>
