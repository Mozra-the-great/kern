<svelte:options
	customElement={{
		props: {
			value: { type: 'Number' },
			max: { type: 'Number' },
			label: { type: 'String' },
			showValue: { type: 'Boolean', attribute: 'show-value' },
			hideLabel: { type: 'Boolean', attribute: 'hide-label' },
			tone: { type: 'String' },
			valueText: { type: 'String', attribute: 'value-text' }
		}
	}}
/>

<script lang="ts">
	/**
	 * Progress bar. Without `value` it is indeterminate (stripes, still under reduced motion).
	 * @prop tone {'default' | 'warn'} `warn` draws the bar in the warning colour.
	 * @prop value {number | null} Clamped to 0..max; NaN counts as 0; none or null: indeterminate.
	 */
	import Progress from '../lib/components/Progress.svelte';
	let { value, max, label = '', showValue = false, hideLabel = false, tone, valueText } = $props();
</script>

<Progress value={value ?? undefined} max={max ?? undefined} {label} {showValue} {hideLabel} {tone} {valueText} />
