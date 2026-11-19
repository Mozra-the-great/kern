<svelte:options
	customElement={{
		props: {
			items: { type: 'Array' },
			label: { type: 'String' },
			statusLabels: { type: 'Object', attribute: 'status-labels' },
			locale: { type: 'String' }
		}
	}}
/>

<script lang="ts">
	/**
	 * @prop items {TimelineItem[]}
	 * @prop statusLabels {Partial<Record<TimelineStatus, string>>}
	 */
	import Timeline from '../lib/components/Timeline.svelte';
	/* The custom `item` snippet of the Svelte component is not available here. */
	let { items = [], label, statusLabels, locale } = $props();
</script>

<Timeline {items} {label} {statusLabels} {locale} />
