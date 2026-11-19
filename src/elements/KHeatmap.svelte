<svelte:options customElement={{ props: { data: { type: 'Array' }, label: { type: 'String' }, start: { type: 'String' }, end: { type: 'String' }, weekStart: { type: 'Number', attribute: 'week-start' }, locale: { type: 'String' }, max: { type: 'Number' }, cellLabel: { type: 'String', attribute: 'cell-label' }, noLegend: { type: 'Boolean', attribute: 'no-legend' }, lessLabel: { type: 'String', attribute: 'less-label' }, moreLabel: { type: 'String', attribute: 'more-label' }, emptyLabel: { type: 'String', attribute: 'empty-label' }, cellSize: { type: 'Number', attribute: 'cell-size' } } }} />
<script lang="ts">
	/**
	 * @prop data {HeatmapDatum[]}
	 * @event select {HeatmapDatum} The day the user picked (Enter, Space or click).
	 */
	import Heatmap from '../lib/components/Heatmap.svelte';
	import { emit } from './form.js';
	/* Event "select" on Enter, Space or click: detail = {date, value}. */
	let { data = [], label = '', start, end, weekStart, locale, max, cellLabel, noLegend = false, lessLabel, moreLabel, emptyLabel, cellSize } = $props();
	const host = $host();
</script>
<Heatmap {data} {label} {start} {end} {weekStart} {locale} {max} {cellLabel} legend={!noLegend} {lessLabel} {moreLabel} {emptyLabel} {cellSize} onselect={(d: { date: string; value: number }) => emit(host, 'select', d)} />
