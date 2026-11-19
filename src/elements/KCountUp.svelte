<svelte:options
	customElement={{
		props: {
			value: { type: 'Number' },
			from: { type: 'Number' },
			duration: { type: 'Number' },
			format: { type: 'Object' },
			locale: { type: 'String' },
			startInView: { type: 'String', attribute: 'start-in-view' }
		}
	}}
/>

<script lang="ts">
	/**
	 * @prop format {Intl.NumberFormatOptions}
	 * @event complete The count reached `value`.
	 */
	import CountUp from '../lib/components/CountUp.svelte';
	import { emit } from './form.js';
	/* format: Intl.NumberFormat options as JSON, e.g. format='{"style":"currency","currency":"EUR"}'.
	 * start-in-view defaults to on; start-in-view="false" counts right away. */
	let { value = 0, from, duration, format, locale, startInView } = $props();
	const host = $host();
	const on = (v: unknown, fallback: boolean) => (v === undefined || v === null ? fallback : v !== false && v !== 'false');
</script>

<CountUp {value} {from} {duration} {format} {locale} startInView={on(startInView, true)} oncomplete={() => emit(host, 'complete')} />
