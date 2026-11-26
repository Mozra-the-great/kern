<svelte:options
	customElement={{
		props: {
			values: { type: 'Array' },
			variant: { type: 'String' },
			min: { type: 'Number' },
			max: { type: 'Number' },
			label: { type: 'String' },
			emptyLabel: { type: 'String', attribute: 'empty-label' },
			noLastDot: { type: 'Boolean', attribute: 'no-last-dot' },
			height: { type: 'Number' },
			width: { type: 'String' },
			locale: { type: 'String' }
		}
	}}
/>

<script lang="ts">
	/**
	 * @prop values {readonly number[]}
	 */
	import Sparkline from '../lib/components/Sparkline.svelte';
	let { values = [], variant, min, max, label, emptyLabel, noLastDot = false, height, width, locale } = $props();
</script>

<Sparkline {values} {variant} {min} {max} {label} {emptyLabel} showLast={!noLastDot} {height} {width} {locale} />
