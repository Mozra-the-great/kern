<svelte:options customElement={{ tag: 'k-timeline', props: { items: { type: 'Array' }, label: { type: 'String' }, statusLabels: { type: 'Object', attribute: 'status-labels' }, locale: { type: 'String' } } }} />
<script lang="ts">
	import Timeline from '../lib/components/Timeline.svelte';
	/* The custom `item` snippet of the Svelte component is not available here. */
	let { items = [], label, statusLabels, locale } = $props();
</script>
<Timeline {items} {label} {statusLabels} {locale} />
