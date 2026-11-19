<svelte:options customElement={{ tag: 'k-status-dot', props: { status: { type: 'String', reflect: true }, label: { type: 'String' }, labelHidden: { type: 'Boolean', attribute: 'label-hidden' }, statusLabels: { type: 'Object', attribute: 'status-labels' }, size: { type: 'String' }, noPulse: { type: 'Boolean', attribute: 'no-pulse' } } }} />
<script lang="ts">
	import StatusDot from '../lib/components/StatusDot.svelte';
	/* status: ok | warn | down | idle | busy. The slot (or `label`) is the text; the status name is spoken after it. status-labels: JSON, e.g. '{"ok":"In Ordnung"}'. */
	let { status = 'idle', label, labelHidden = false, statusLabels, size, noPulse = false } = $props();
	const host = $host();
	const hasText = (host.textContent ?? '').trim() !== '';
</script>
{#snippet slotted()}{#if hasText}<slot />{/if}{/snippet}
<StatusDot {status} {label} {labelHidden} {statusLabels} {size} pulse={!noPulse} children={hasText ? slotted : undefined} />
<style>
	:host { display: inline-flex; }
</style>
