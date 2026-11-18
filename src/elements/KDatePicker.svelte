<svelte:options customElement={{ tag: 'k-date-picker', props: { label: { type: "String" }, hint: { type: "String" }, error: { type: "String" }, value: { type: 'String', reflect: true }, min: { type: "String" }, max: { type: "String" }, locale: { type: "String" }, weekStart: { type: 'Number', attribute: 'week-start' }, name: { type: "String" }, required: { type: "Boolean" }, disabled: { type: "Boolean" }, placeholder: { type: "String" }, calendarLabel: { type: 'String', attribute: 'calendar-label' }, prevMonthLabel: { type: 'String', attribute: 'prev-month-label' }, nextMonthLabel: { type: 'String', attribute: 'next-month-label' }, invalidText: { type: 'String', attribute: 'invalid-text' } }, extend: formAssociated }} />
<script lang="ts">
	import DatePicker from '../lib/components/DatePicker.svelte';
	import { formAssociated, setFormValue, emit } from './form.js';
	let { label, hint, error, value = $bindable(''), min, max, locale, weekStart, name, required = false, disabled = false, placeholder, calendarLabel, prevMonthLabel, nextMonthLabel, invalidText } = $props();
	const host = $host();
	const initial = value;
	$effect(() => setFormValue(host, value ?? ''));
	$effect(() => { const r = () => (value = initial); host.addEventListener('k-reset', r); return () => host.removeEventListener('k-reset', r); });
</script>
<DatePicker {label} {hint} {error} bind:value {min} {max} {locale} {weekStart} {name} {required} {disabled} {placeholder} {calendarLabel} {prevMonthLabel} {nextMonthLabel} {invalidText} onchange={(v) => emit(host, 'change', v)} />
