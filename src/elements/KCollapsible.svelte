<svelte:options customElement={{ props: { open: { type: 'Boolean', reflect: true }, label: { type: 'String' }, disabled: { type: 'Boolean' }, look: { type: 'String' } } }} />
<script lang="ts">
	/**
	 * @event toggle {boolean} Open state after the user toggled it.
	 */
	import Collapsible from '../lib/components/Collapsible.svelte';
	import { emit, hasSlot } from './form.js';
	/* Default slot = content. Slot "trigger" replaces the label inside the trigger button. */
	let { open = $bindable(false), label, disabled = false, look } = $props();
	const host = $host();
	const trigger = hasSlot(host, 'trigger');
</script>
{#snippet triggerS()}{#if trigger}<slot name="trigger" />{/if}{/snippet}
<Collapsible bind:open {label} {disabled} {look} ontoggle={(o: boolean) => emit(host, 'toggle', o)} trigger={trigger ? triggerS : undefined}><slot /></Collapsible>
<style>
	:host { display: block; min-width: 0; }
</style>
