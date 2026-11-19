<svelte:options
	customElement={{
		props: {
			value: { type: 'Number' },
			max: { type: 'Number' },
			label: { type: 'String' },
			size: { type: 'Number' },
			thickness: { type: 'Number' },
			showValue: { type: 'Boolean', attribute: 'show-value' },
			valueText: { type: 'String', attribute: 'value-text' },
			loadingText: { type: 'String', attribute: 'loading-text' }
		}
	}}
/>

<script lang="ts">
	import ProgressRing from '../lib/components/ProgressRing.svelte';
	/* Without value the ring is indeterminate. Light-DOM children show in the centre. */
	let { value, max, label = '', size, thickness, showValue = false, valueText, loadingText } = $props();
	const host = $host();
	const centre = (host.textContent ?? '').trim() !== '' || host.children.length > 0;
</script>

{#snippet centreS()}{#if centre}<slot />{/if}{/snippet}
<ProgressRing {value} {max} {label} {size} {thickness} {showValue} {valueText} {loadingText} children={centre ? centreS : undefined} />
