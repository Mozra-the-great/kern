<svelte:options customElement={{ props: { title: { type: 'String' }, description: { type: 'String' }, level: { type: 'Number' } } }} />

<script lang="ts">
	import EmptyState from '../lib/components/EmptyState.svelte';
	import { hasSlot } from './form.js';
	/* Slots: icon, actions. */
	let { title = '', description, level } = $props();
	const host = $host();
	const icon = hasSlot(host, 'icon');
	const actions = hasSlot(host, 'actions');
</script>

{#snippet iconS()}{#if icon}<slot name="icon" />{/if}{/snippet}
{#snippet actionsS()}{#if actions}<slot name="actions" />{/if}{/snippet}
<EmptyState {title} {description} {level} icon={icon ? iconS : undefined} actions={actions ? actionsS : undefined} />
