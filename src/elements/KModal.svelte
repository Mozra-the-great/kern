<svelte:options
	customElement={{
		props: {
			open: { type: 'Boolean', reflect: true },
			title: { type: 'String' },
			description: { type: 'String' },
			size: { type: 'String' },
			closeOnBackdrop: { type: 'Boolean', attribute: 'close-on-backdrop' },
			closeLabel: { type: 'String', attribute: 'close-label' }
		}
	}}
/>

<script lang="ts">
	/**
	 * @event close The modal was closed by the user (Escape, close button, backdrop).
	 */
	import Modal from '../lib/components/Modal.svelte';
	import { emit, hasSlot } from './form.js';
	let { open = $bindable(false), title = '', description, size, closeOnBackdrop, closeLabel } = $props();
	const host = $host();
	const footer = hasSlot(host, 'footer');
</script>

{#snippet footerS()}{#if footer}<slot name="footer" />{/if}{/snippet}
<Modal
	bind:open
	{title}
	{description}
	{size}
	closeOnBackdrop={closeOnBackdrop ?? true}
	{closeLabel}
	onclose={() => emit(host, 'close')}
	footer={footer ? footerS : undefined}
>
	<slot />
</Modal>
