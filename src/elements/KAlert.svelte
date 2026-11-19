<svelte:options
	customElement={{
		props: {
			tone: { type: 'String' },
			title: { type: 'String' },
			dismissible: { type: 'Boolean' },
			dismissLabel: { type: 'String', attribute: 'dismiss-label' }
		}
	}}
/>

<script lang="ts">
	/**
	 * @event dismiss The user dismissed the alert (`dismissible`); the element then removes itself.
	 */
	import Alert from '../lib/components/Alert.svelte';
	import { emit, hasSlot } from './form.js';
	let { tone, title, dismissible = false, dismissLabel } = $props();
	const host = $host();
	const actions = hasSlot(host, 'actions');
	function dismiss() {
		emit(host, 'dismiss');
		host.remove();
	}
</script>

{#snippet actionsS()}{#if actions}<slot name="actions" />{/if}{/snippet}
<Alert {tone} {title} {dismissLabel} ondismiss={dismissible ? dismiss : undefined} actions={actions ? actionsS : undefined}><slot /></Alert>
