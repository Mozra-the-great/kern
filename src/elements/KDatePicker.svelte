<svelte:options
	customElement={{
		props: {
			label: { type: 'String' },
			hint: { type: 'String' },
			error: { type: 'String' },
			noAnnounce: { type: 'Boolean', attribute: 'no-announce' },
			value: { type: 'String', reflect: true },
			min: { type: 'String' },
			max: { type: 'String' },
			locale: { type: 'String' },
			weekStart: { type: 'Number', attribute: 'week-start' },
			name: { type: 'String', reflect: true },
			required: { type: 'Boolean' },
			disabled: { type: 'Boolean', reflect: true },
			placeholder: { type: 'String' },
			calendarLabel: { type: 'String', attribute: 'calendar-label' },
			prevMonthLabel: { type: 'String', attribute: 'prev-month-label' },
			nextMonthLabel: { type: 'String', attribute: 'next-month-label' },
			invalidText: { type: 'String', attribute: 'invalid-text' }
		},
		extend: formAssociated
	}}
/>

<script lang="ts">
	/**
	 * Date field with a calendar popup. `value`, `min` and `max` are ISO dates (yyyy-mm-dd);
	 * `min`/`max`/`required` are validated.
	 * @event change {string} The chosen ISO date, or "" when cleared.
	 * @prop noAnnounce The error is not announced (no `role="alert"`); use it when the page announces the message itself. The error stays visible and keeps describing the control.
	 */
	import DatePicker from '../lib/components/DatePicker.svelte';
	import { formAssociated, setFormValue, emit } from './form.js';
	import { formControl, inShadow } from './control.svelte.js';
	let {
		label,
		hint,
		error,
		noAnnounce = false,
		value = $bindable(''),
		min,
		max,
		locale,
		weekStart,
		name,
		required = false,
		disabled = false,
		placeholder,
		calendarLabel,
		prevMonthLabel,
		nextMonthLabel,
		invalidText
	} = $props();
	const host = $host();
	const initial = value;
	formControl(host, {
		anchor: () => inShadow<HTMLInputElement>(host, 'input[type="text"]'),
		probe: () => ({ attrs: { type: 'date', min, max, required }, value: value ?? '' }),
		disabled: () => disabled
	});
	$effect(() => setFormValue(host, value ?? ''));
	$effect(() => {
		const r = () => (value = initial);
		host.addEventListener('k-reset', r);
		return () => host.removeEventListener('k-reset', r);
	});
</script>

<DatePicker
	{label}
	{hint}
	{error}
	announce={!noAnnounce}
	bind:value
	{min}
	{max}
	{locale}
	{weekStart}
	{name}
	{required}
	{disabled}
	{placeholder}
	{calendarLabel}
	{prevMonthLabel}
	{nextMonthLabel}
	{invalidText}
	onchange={(v) => emit(host, 'change', v)}
/>
