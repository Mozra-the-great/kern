<svelte:options customElement={{ props: { label: { type: 'String' }, value: { type: 'String' }, unit: { type: 'String' }, delta: { type: 'Number' }, deltaUnit: { type: 'String', attribute: 'delta-unit' }, deltaLabel: { type: 'String', attribute: 'delta-label' }, risingIsBad: { type: 'Boolean', attribute: 'rising-is-bad' }, upLabel: { type: 'String', attribute: 'up-label' }, downLabel: { type: 'String', attribute: 'down-label' }, flatLabel: { type: 'String', attribute: 'flat-label' }, description: { type: 'String' }, locale: { type: 'String' }, look: { type: 'String' } } }} />
<script lang="ts">
	import Stat from '../lib/components/Stat.svelte';
	import { hasSlot } from './form.js';
	/* A numeric `value` is formatted with `locale`; any other text is shown as it is. Slot "spark": a <k-sparkline>. */
	let { label = '', value = '', unit, delta, deltaUnit, deltaLabel, risingIsBad = false, upLabel, downLabel, flatLabel, description, locale, look } = $props();
	const host = $host();
	const spark = hasSlot(host, 'spark');
	const shown = $derived(typeof value === 'string' && value.trim() !== '' && String(Number(value)) === value.trim() ? Number(value) : value);
</script>
{#snippet sparkS()}{#if spark}<slot name="spark" />{/if}{/snippet}
<Stat {label} value={shown} {unit} {delta} {deltaUnit} {deltaLabel} positiveIsGood={!risingIsBad} {upLabel} {downLabel} {flatLabel} {description} {locale} {look} spark={spark ? sparkS : undefined} />
