<svelte:options customElement={{ tag: 'k-history-bar', props: { items: { type: 'Array' }, label: { type: 'String' }, summaryLabel: { type: 'String', attribute: 'summary-label' }, noDataLabel: { type: 'String', attribute: 'no-data-label' }, statusLabels: { type: 'Object', attribute: 'status-labels' }, noLegend: { type: 'Boolean', attribute: 'no-legend' }, startLabel: { type: 'String', attribute: 'start-label' }, endLabel: { type: 'String', attribute: 'end-label' }, locale: { type: 'String' } } }} />
<script lang="ts">
	import HistoryBar from '../lib/components/HistoryBar.svelte';
	let { items = [], label = '', summaryLabel, noDataLabel, statusLabels, noLegend = false, startLabel, endLabel, locale } = $props();
</script>
<HistoryBar {items} {label} {summaryLabel} {noDataLabel} {statusLabels} legend={!noLegend} {startLabel} {endLabel} {locale} />
