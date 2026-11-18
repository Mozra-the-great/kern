<svelte:options customElement={{ tag: 'k-odometer', props: { value: { type: 'Number', reflect: true }, duration: { type: "Number" }, format: { type: "Object" }, locale: { type: "String" } } }} />
<script lang="ts">
	import Odometer from '../lib/components/Odometer.svelte';
	/* format: Intl.NumberFormat options as JSON, e.g. format='{"minimumIntegerDigits":4}'. */
	let { value = 0, duration, format, locale } = $props();
</script>
<Odometer {value} {duration} {format} {locale} />
