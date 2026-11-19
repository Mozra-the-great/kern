<svelte:options customElement={{ props: { value: { type: 'String' }, locale: { type: 'String' }, numeric: { type: 'String' }, formatStyle: { type: 'String', attribute: 'format-style' }, now: { type: 'String' }, fallback: { type: 'String' } } }} />
<script lang="ts">
	import RelativeTime from '../lib/components/RelativeTime.svelte';
	/* value, now: ISO 8601 text or epoch milliseconds. format-style: long | short | narrow (`style` is the HTML style attribute). */
	let { value = '', locale, numeric, formatStyle, now, fallback } = $props();
	/* Plain digits (9 or more) are epoch milliseconds; anything else is date text. */
	const time = (v: unknown): string | number | undefined => {
		if (typeof v !== 'string' || v.trim() === '') return undefined;
		return /^-?\d{9,}$/.test(v.trim()) ? Number(v) : v;
	};
</script>
<RelativeTime value={time(value) ?? ''} {locale} {numeric} style={formatStyle} now={time(now)} {fallback} />
<style>
	:host { display: inline; }
</style>
