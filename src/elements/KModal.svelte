<svelte:options
	customElement={{
		props: {
			open: { type: 'Boolean', reflect: true },
			title: { type: 'String' },
			description: { type: 'String' },
			size: { type: 'String' },
			closeOnBackdrop: { type: 'Boolean', attribute: 'close-on-backdrop' },
			dismissible: { type: 'String' },
			initialFocus: { type: 'String', attribute: 'initial-focus' },
			alert: { type: 'Boolean' },
			closeLabel: { type: 'String', attribute: 'close-label' }
		}
	}}
/>

<script lang="ts">
	/**
	 * @prop dismissible {boolean | 'true' | 'false'} `false` (property or attribute): Escape, the backdrop and the close button (hidden) do nothing; only setting `open` to false closes it. Default true.
	 * @prop initialFocus {string} CSS selector of the element that gets focus on open, looked up in the children (light DOM). Default: the browser's choice.
	 * @prop alert {boolean} role="alertdialog", for confirmations that interrupt the user.
	 * @event cancel The user asked to close (Escape, close button, backdrop); cancelable: `preventDefault()` keeps it open.
	 * @event close The user closed the modal (Escape, close button, backdrop); not fired when `open` is set to false from code.
	 */
	import Modal from '../lib/components/Modal.svelte';
	import { emit, hasSlot } from './form.js';
	let {
		open = $bindable(false),
		title = '',
		description,
		size,
		closeOnBackdrop,
		dismissible,
		initialFocus,
		alert = false,
		closeLabel
	} = $props();
	const host = $host();
	const footer = hasSlot(host, 'footer');
	const canDismiss = $derived(dismissible === undefined || dismissible === null || (dismissible !== false && dismissible !== 'false'));
</script>

{#snippet footerS()}{#if footer}<slot name="footer" />{/if}{/snippet}
<Modal
	bind:open
	{title}
	{description}
	{size}
	closeOnBackdrop={closeOnBackdrop ?? true}
	dismissible={canDismiss}
	initialFocus={initialFocus ?? undefined}
	{alert}
	{closeLabel}
	oncancel={(e) => {
		if (!emit(host, 'cancel', null, true)) e.preventDefault();
	}}
	onclose={() => emit(host, 'close')}
	footer={footer ? footerS : undefined}
>
	<slot />
</Modal>
