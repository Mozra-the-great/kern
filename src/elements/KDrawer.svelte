<svelte:options
	customElement={{
		props: {
			open: { type: 'Boolean', reflect: true },
			title: { type: 'String' },
			side: { type: 'String' },
			closeLabel: { type: 'String', attribute: 'close-label' }
		}
	}}
/>

<script lang="ts">
	/**
	 * @event close The drawer was closed by the user.
	 */
	import Drawer from '../lib/components/Drawer.svelte';
	import { emit, hasSlot } from './form.js';
	let { open = $bindable(false), title = '', side, closeLabel } = $props();
	const host = $host();
	const footer = hasSlot(host, 'footer');
</script>

{#snippet footerS()}{#if footer}<slot name="footer" />{/if}{/snippet}
<Drawer bind:open {title} {side} {closeLabel} onclose={() => emit(host, 'close')} footer={footer ? footerS : undefined}><slot /></Drawer>
