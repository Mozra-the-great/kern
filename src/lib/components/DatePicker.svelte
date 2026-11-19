<script lang="ts">
	import { formatLocale, strings } from './strings.svelte.js';
	import { tick } from 'svelte';
	import Field from './Field.svelte';
	import { anchorTo, activeElementOf, eventWithin } from './anchor.js';

	interface Props {
		label?: string | undefined;
		hint?: string | undefined;
		error?: string | undefined;
		/** Selected date as ISO `yyyy-mm-dd`, or ''. */
		value?: string | undefined;
		/** Earliest selectable date, ISO. */
		min?: string | undefined;
		/** Latest selectable date, ISO. */
		max?: string | undefined;
		/** BCP 47 locale for names and the typed format; default: the language chosen with `setStrings`/`setLocale`, else the browser's. */
		locale?: string | undefined;
		/** First day of the week, 0 = Sunday … 6 = Saturday; default: from the locale, else Monday. */
		weekStart?: number | undefined;
		/** Form field name; a hidden input carries the ISO value. */
		name?: string | undefined;
		required?: boolean | undefined;
		disabled?: boolean | undefined;
		/** Default: the locale's date pattern, e.g. dd.mm.yyyy. */
		placeholder?: string | undefined;
		/** Name of the calendar button and dialog. */
		calendarLabel?: string | undefined;
		prevMonthLabel?: string | undefined;
		nextMonthLabel?: string | undefined;
		/** Shown when the typed text is not a date or is out of range. */
		invalidText?: string | undefined;
		id?: string | undefined;
		/** Called when the user commits a new value. */
		onchange?: ((value: string) => void) | undefined;
		class?: string | undefined;
	}
	let {
		label,
		hint,
		error,
		value = $bindable(),
		min,
		max,
		locale: localeProp,
		weekStart,
		name,
		required = false,
		disabled = false,
		placeholder,
		calendarLabel: calendarLabelProp,
		prevMonthLabel: prevMonthLabelProp,
		nextMonthLabel: nextMonthLabelProp,
		invalidText: invalidTextProp,
		id,
		onchange,
		class: cls = ''
	}: Props = $props();
	const locale = $derived(formatLocale(localeProp));
	const calendarLabel = $derived(calendarLabelProp ?? strings().datePicker.calendarLabel);
	const prevMonthLabel = $derived(prevMonthLabelProp ?? strings().datePicker.prevMonthLabel);
	const nextMonthLabel = $derived(nextMonthLabelProp ?? strings().datePicker.nextMonthLabel);
	const invalidText = $derived(invalidTextProp ?? strings().datePicker.invalidText);

	const uid = $props.id();
	const inputId = $derived(id ?? `${uid}-input`);
	const DAY = 86_400_000;

	/* ---------- dates (UTC midnight, so DST never shifts a day) ---------- */
	function utc(y: number, m: number, d: number): Date {
		const date = new Date(Date.UTC(2000, 0, 1));
		date.setUTCFullYear(y, m, d);
		return date;
	}
	function daysIn(y: number, m: number): number {
		return utc(y, m + 1, 0).getUTCDate();
	}
	function valid(y: number, m: number, d: number): Date | null {
		if (y < 1 || y > 9999 || m < 0 || m > 11 || d < 1 || d > daysIn(y, m)) return null;
		return utc(y, m, d);
	}
	function parseIso(s: string | undefined): Date | null {
		const r = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s ?? '');
		return r ? valid(+r[1], +r[2] - 1, +r[3]) : null;
	}
	function toIso(d: Date): string {
		return `${String(d.getUTCFullYear()).padStart(4, '0')}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
	}
	function addDays(d: Date, n: number): Date {
		return new Date(d.getTime() + n * DAY);
	}
	function addMonths(d: Date, n: number): Date {
		const total = d.getUTCFullYear() * 12 + d.getUTCMonth() + n;
		const y = Math.floor(total / 12);
		const m = total - y * 12;
		return utc(y, m, Math.min(d.getUTCDate(), daysIn(y, m)));
	}
	function sameDay(a: Date | null, b: Date | null): boolean {
		return !!a && !!b && a.getTime() === b.getTime();
	}
	function today(): Date {
		const now = new Date();
		return utc(now.getFullYear(), now.getMonth(), now.getDate());
	}

	/* ---------- locale ---------- */
	interface WeekInfo {
		firstDay: number;
	}
	type LocaleWithWeek = Intl.Locale & { getWeekInfo?: (() => WeekInfo) | undefined; weekInfo?: WeekInfo | undefined };

	const loc = $derived.by(() => {
		try {
			return new Intl.DateTimeFormat(locale).resolvedOptions().locale;
		} catch {
			return new Intl.DateTimeFormat().resolvedOptions().locale;
		}
	});
	const base: Intl.DateTimeFormatOptions = { timeZone: 'UTC', calendar: 'gregory', numberingSystem: 'latn' };
	const shortFmt = $derived(new Intl.DateTimeFormat(loc, { ...base, day: '2-digit', month: '2-digit', year: 'numeric' }));
	const fullFmt = $derived(new Intl.DateTimeFormat(loc, { ...base, dateStyle: 'full' }));
	const monthFmt = $derived(new Intl.DateTimeFormat(loc, { ...base, month: 'long', year: 'numeric' }));
	/** Order of day, month and year in the locale's short format. */
	const order = $derived(
		shortFmt
			.formatToParts(utc(2033, 10, 22))
			.map((p) => p.type)
			.filter((t): t is 'day' | 'month' | 'year' => t === 'day' || t === 'month' || t === 'year')
	);
	const pattern = $derived.by(() => {
		const parts = strings().datePicker.pattern;
		return shortFmt
			.formatToParts(utc(2033, 10, 22))
			.map((p) =>
				p.type === 'day'
					? parts.day
					: p.type === 'month'
						? parts.month
						: p.type === 'year'
							? parts.year
							: p.type === 'literal'
								? p.value
								: ''
			)
			.join('');
	});
	const firstDay = $derived.by(() => {
		if (weekStart !== undefined && Number.isInteger(weekStart)) return ((weekStart % 7) + 7) % 7;
		try {
			const l = new Intl.Locale(loc) as LocaleWithWeek;
			const info = typeof l.getWeekInfo === 'function' ? l.getWeekInfo() : l.weekInfo;
			if (info) return info.firstDay % 7;
		} catch {
			/* Intl.Locale without week data: fall through to Monday. */
		}
		return 1;
	});
	const weekdays = $derived.by(() => {
		const short = new Intl.DateTimeFormat(loc, { ...base, weekday: 'short' });
		const long = new Intl.DateTimeFormat(loc, { ...base, weekday: 'long' });
		// 2023-01-01 is a Sunday.
		return Array.from({ length: 7 }, (_, k) => {
			const d = utc(2023, 0, 1 + ((firstDay + k) % 7));
			return { short: short.format(d), long: long.format(d) };
		});
	});

	function format(d: Date | null): string {
		return d ? shortFmt.format(d) : '';
	}
	/** Reads ISO yyyy-mm-dd or the locale's numeric short format (2-digit years → 20xx). */
	function parseText(text: string): Date | null {
		const s = text.trim();
		const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s);
		if (iso) return valid(+iso[1], +iso[2] - 1, +iso[3]);
		let groups: string[] = s.match(/\d+/g) ?? [];
		if (groups.length === 1 && groups[0].length === 8) {
			// 8 digits without separators, in locale order.
			const g = groups[0];
			let at = 0;
			groups = order.map((t) => {
				const len = t === 'year' ? 4 : 2;
				const part = g.slice(at, at + len);
				at += len;
				return part;
			});
		}
		if (groups.length !== 3 || order.length !== 3) return null;
		const parts: Record<'day' | 'month' | 'year', string> = { day: '', month: '', year: '' };
		order.forEach((t, i) => (parts[t] = groups[i]));
		let y = +parts.year;
		if (parts.year.length <= 2) y += 2000;
		return valid(y, +parts.month - 1, +parts.day);
	}

	/* ---------- state ---------- */
	const minDate = $derived(parseIso(min));
	const maxDate = $derived(parseIso(max));
	const selectedDate = $derived(parseIso(value));
	function inRange(d: Date): boolean {
		return (!minDate || d >= minDate) && (!maxDate || d <= maxDate);
	}
	function clampDate(d: Date): Date {
		if (minDate && d < minDate) return minDate;
		if (maxDate && d > maxDate) return maxDate;
		return d;
	}

	let text = $state('');
	let invalidInput = $state(false);
	let expanded = $state(false);
	let focusDate = $state(today());
	let box: HTMLElement | undefined = $state();
	let calBtn: HTMLButtonElement | undefined = $state();
	let dialog: HTMLElement | undefined = $state();
	let grid: HTMLElement | undefined = $state();
	let prevBtn: HTMLButtonElement | undefined = $state();
	let nextBtn: HTMLButtonElement | undefined = $state();

	// Show the formatted value when the value or the locale changes.
	let syncedKey: string | undefined;
	$effect.pre(() => {
		const key = `${value ?? ''}\u0000${loc}`;
		if (key === syncedKey) return;
		syncedKey = key;
		text = format(parseIso(value));
		invalidInput = false;
	});

	const viewYear = $derived(focusDate.getUTCFullYear());
	const viewMonth = $derived(focusDate.getUTCMonth());
	const weeks = $derived.by(() => {
		const offset = (utc(viewYear, viewMonth, 1).getUTCDay() - firstDay + 7) % 7;
		const count = daysIn(viewYear, viewMonth);
		const cells: (Date | null)[] = [];
		for (let i = 0; i < offset; i++) cells.push(null);
		for (let d = 1; d <= count; d++) cells.push(utc(viewYear, viewMonth, d));
		while (cells.length % 7) cells.push(null);
		const rows: (Date | null)[][] = [];
		for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
		return rows;
	});
	const canPrev = $derived(!minDate || utc(viewYear, viewMonth, 1) > minDate);
	const canNext = $derived(!maxDate || utc(viewYear, viewMonth, daysIn(viewYear, viewMonth)) < maxDate);
	const todayDate = $derived(expanded ? today() : null);

	$effect(() => {
		if (!expanded || !box || !dialog) return;
		return anchorTo(box, dialog, { placement: 'bottom-start' });
	});

	function setValue(v: string) {
		if (v === (value ?? '')) return;
		// The text was set by the caller; keep the sync effect from overwriting it.
		syncedKey = `${v}\u0000${loc}`;
		value = v;
		onchange?.(v);
	}
	function commitText() {
		if (!text.trim()) {
			invalidInput = false;
			setValue('');
			return;
		}
		const d = parseText(text);
		if (d && inRange(d)) {
			invalidInput = false;
			setValue(toIso(d));
			text = format(d);
		} else {
			invalidInput = true;
			setValue('');
		}
	}
	async function focusCell() {
		await tick();
		grid?.querySelector<HTMLElement>('[tabindex="0"]')?.focus();
	}
	function openCalendar() {
		if (disabled) return;
		const typed = parseText(text);
		focusDate = clampDate(selectedDate ?? (typed && inRange(typed) ? typed : today()));
		expanded = true;
		void focusCell();
	}
	function closeCalendar(refocus: boolean) {
		if (!expanded) return;
		expanded = false;
		if (refocus) calBtn?.focus();
	}
	function pick(d: Date) {
		if (!inRange(d)) return;
		invalidInput = false;
		setValue(toIso(d));
		text = format(d);
		closeCalendar(true);
	}
	function moveFocus(d: Date) {
		focusDate = clampDate(d);
		void focusCell();
	}
	function showMonth(n: number) {
		focusDate = clampDate(addMonths(focusDate, n));
	}

	function onGridKey(e: KeyboardEvent) {
		const d = focusDate;
		const dow = (d.getUTCDay() - firstDay + 7) % 7;
		let next: Date;
		switch (e.key) {
			case 'ArrowLeft':
				next = addDays(d, -1);
				break;
			case 'ArrowRight':
				next = addDays(d, 1);
				break;
			case 'ArrowUp':
				next = addDays(d, -7);
				break;
			case 'ArrowDown':
				next = addDays(d, 7);
				break;
			case 'Home':
				next = addDays(d, -dow);
				break;
			case 'End':
				next = addDays(d, 6 - dow);
				break;
			case 'PageUp':
				next = addMonths(d, e.shiftKey ? -12 : -1);
				break;
			case 'PageDown':
				next = addMonths(d, e.shiftKey ? 12 : 1);
				break;
			case 'Enter':
			case ' ':
				e.preventDefault();
				pick(d);
				return;
			default:
				return;
		}
		e.preventDefault();
		moveFocus(next);
	}
	function onDialogKey(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			e.preventDefault();
			e.stopPropagation();
			closeCalendar(true);
		} else if (e.key === 'Tab' && dialog) {
			// Modal dialog: keep Tab inside (prev, next, the focused day).
			const stops = [prevBtn, nextBtn, grid?.querySelector<HTMLElement>('[tabindex="0"]')].filter(
				(el): el is HTMLElement => !!el && !(el instanceof HTMLButtonElement && el.disabled)
			);
			if (!stops.length) return;
			const i = stops.indexOf(activeElementOf(dialog) as HTMLElement);
			const n = stops.length;
			e.preventDefault();
			stops[i < 0 ? 0 : (i + (e.shiftKey ? -1 : 1) + n) % n].focus();
		}
	}
	function onInputKey(e: KeyboardEvent) {
		if (e.key === 'Enter') commitText();
		else if (e.key === 'ArrowDown' && e.altKey) {
			e.preventDefault();
			openCalendar();
		}
	}
	function onWindowPointer(e: PointerEvent) {
		if (expanded && !eventWithin(e, dialog, calBtn)) closeCalendar(false);
	}
</script>

<svelte:window onpointerdown={onWindowPointer} />

<Field {label} {hint} error={error ?? (invalidInput ? invalidText : undefined)} {required} for={inputId} class={cls}>
	{#snippet children({ describedby, invalid })}
		<div class="k-date" class:invalid class:disabled bind:this={box}>
			<input
				id={inputId}
				type="text"
				bind:value={text}
				placeholder={placeholder ?? pattern}
				aria-invalid={invalid || undefined}
				aria-describedby={describedby}
				autocomplete="off"
				spellcheck="false"
				{required}
				{disabled}
				onchange={commitText}
				onkeydown={onInputKey}
			/>
			<button
				bind:this={calBtn}
				type="button"
				class="cal"
				aria-label={selectedDate ? `${calendarLabel}, ${fullFmt.format(selectedDate)}` : calendarLabel}
				aria-haspopup="dialog"
				aria-expanded={expanded}
				aria-controls="{uid}-dialog"
				{disabled}
				onclick={() => (expanded ? closeCalendar(true) : openCalendar())}
			>
				<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
					<rect x="3" y="4.5" width="14" height="12.5" rx="1.5" /><path d="M3 8.5h14M7 2.5v4M13 2.5v4" />
				</svg>
			</button>
			{#if name}<input type="hidden" {name} value={value ?? ''} />{/if}
		</div>
		{#if expanded}
			<div
				class="dialog"
				role="dialog"
				aria-modal="true"
				aria-label={calendarLabel}
				id="{uid}-dialog"
				tabindex="-1"
				bind:this={dialog}
				onkeydown={onDialogKey}
			>
				<div class="head">
					<button
						bind:this={prevBtn}
						type="button"
						class="nav"
						aria-label={prevMonthLabel}
						disabled={!canPrev}
						onclick={() => showMonth(-1)}
					>
						<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 4l-4 4 4 4" fill="none" stroke="currentColor" stroke-width="2" /></svg>
					</button>
					<h2 id="{uid}-month" aria-live="polite">{monthFmt.format(utc(viewYear, viewMonth, 1))}</h2>
					<button
						bind:this={nextBtn}
						type="button"
						class="nav"
						aria-label={nextMonthLabel}
						disabled={!canNext}
						onclick={() => showMonth(1)}
					>
						<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 4l4 4-4 4" fill="none" stroke="currentColor" stroke-width="2" /></svg>
					</button>
				</div>
				<table role="grid" aria-labelledby="{uid}-month" bind:this={grid}>
					<thead>
						<tr>
							{#each weekdays as w (w.long)}<th scope="col" abbr={w.long}>{w.short}</th>{/each}
						</tr>
					</thead>
					<tbody>
						{#each weeks as week, r (r)}
							<tr>
								{#each week as day, c (c)}
									{#if day}
										{@const off = !inRange(day)}
										<td
											role="gridcell"
											tabindex={sameDay(day, focusDate) ? 0 : -1}
											aria-label={fullFmt.format(day)}
											aria-selected={sameDay(day, selectedDate) || undefined}
											aria-disabled={off || undefined}
											aria-current={sameDay(day, todayDate) ? 'date' : undefined}
											onclick={() => {
												focusDate = day;
												pick(day);
											}}
											onkeydown={onGridKey}
										>
											{day.getUTCDate()}
										</td>
									{:else}
										<td class="blank"></td>
									{/if}
								{/each}
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	{/snippet}
</Field>

<style>
	.k-date {
		display: flex;
		align-items: center;
		gap: var(--k-space-1);
		min-height: var(--k-control-h);
		padding: 0 var(--k-space-1) 0 var(--k-space-4);
		box-sizing: border-box;
		border: var(--k-border-w) solid var(--k-border);
		border-radius: var(--k-radius-field);
		background: var(--k-bg-raised);
		color: var(--k-fg);
		transition: border-color var(--k-dur) var(--k-ease);
	}
	.k-date:hover {
		border-color: var(--k-fg-muted);
	}
	.k-date:has(input:focus-visible) {
		outline: var(--k-focus-w) solid var(--k-focus);
		outline-offset: var(--k-focus-offset);
		border-color: var(--k-accent-mark);
	}
	.invalid {
		border-color: var(--k-danger);
	}
	.disabled {
		opacity: 0.55;
	}
	input {
		flex: 1;
		min-width: 0;
		min-height: var(--k-control-h);
		margin-block: calc(var(--k-border-w) * -1);
		padding: 0;
		border: 0;
		outline: 0;
		background: transparent;
		color: inherit;
		font: inherit;
		font-size: var(--k-text-md);
		font-variant-numeric: tabular-nums;
	}
	input::placeholder {
		color: var(--k-fg-muted);
		opacity: 1;
	}
	input:disabled {
		cursor: not-allowed;
	}
	button {
		position: relative;
		flex: none;
		display: grid;
		place-items: center;
		width: 40px;
		height: 40px;
		padding: 0;
		border: 0;
		border-radius: var(--k-radius-control);
		background: transparent;
		color: var(--k-fg-muted);
		cursor: pointer;
	}
	button::after {
		content: '';
		position: absolute;
		inset: min(0px, calc((100% - var(--k-tap-target)) / 2));
	}
	button:hover:not(:disabled) {
		color: var(--k-fg);
		background: var(--k-bg-sunken);
	}
	button:focus-visible {
		outline: var(--k-focus-w) solid var(--k-focus);
		outline-offset: calc(var(--k-focus-w) * -1);
	}
	button:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
	.cal svg {
		width: 20px;
		height: 20px;
	}
	.nav svg {
		width: 16px;
		height: 16px;
	}
	.dialog {
		position: fixed;
		z-index: 950;
		box-sizing: border-box;
		width: min(320px, calc(100vw - 16px));
		max-height: var(--avail-h, 70vh);
		overflow: auto;
		padding: var(--k-space-2);
		border: var(--k-border-w) solid var(--k-line-strong);
		border-radius: min(var(--k-radius-overlay), 16px);
		background: var(--k-bg-raised);
		color: var(--k-fg);
		box-shadow: var(--k-shadow-overlay);
		font-family: var(--k-font-sans);
		animation: k-drop var(--k-dur) var(--k-ease);
	}
	.dialog:focus-visible {
		outline: var(--k-focus-w) solid var(--k-focus);
		outline-offset: var(--k-focus-offset);
	}
	.head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--k-space-2);
		margin-bottom: var(--k-space-1);
	}
	h2 {
		flex: 1;
		margin: 0;
		text-align: center;
		font-family: var(--k-label-font);
		font-size: var(--k-label-size);
		font-weight: var(--k-weight-heading);
		text-transform: var(--k-label-transform);
		letter-spacing: var(--k-label-tracking);
	}
	table {
		width: 100%;
		table-layout: fixed;
		border-collapse: collapse;
	}
	th {
		height: 32px;
		padding: 0;
		font-family: var(--k-label-font);
		font-size: var(--k-text-xs);
		font-weight: var(--k-weight-label);
		text-transform: var(--k-label-transform);
		letter-spacing: var(--k-label-tracking);
		color: var(--k-fg-muted);
		overflow: hidden;
		text-overflow: clip;
		white-space: nowrap;
	}
	td {
		height: 40px;
		padding: 0;
		text-align: center;
	}
	[role='gridcell'] {
		position: relative;
		border-radius: min(var(--k-radius-control), 10px);
		font-size: var(--k-text-sm);
		font-variant-numeric: tabular-nums;
		cursor: pointer;
		outline: none;
		transition: background-color var(--k-dur) var(--k-ease);
	}
	[role='gridcell']:hover {
		background: var(--k-bg-sunken);
	}
	[role='gridcell']:focus-visible {
		outline: var(--k-focus-w) solid var(--k-focus);
		outline-offset: calc(var(--k-focus-w) * -1);
	}
	[role='gridcell'][aria-current='date'] {
		font-weight: var(--k-weight-heading);
		text-decoration: underline;
		text-decoration-thickness: 2px;
		text-underline-offset: 4px;
	}
	[role='gridcell'][aria-selected='true'] {
		background: var(--k-primary);
		color: var(--k-on-primary);
		font-weight: var(--k-weight-heading);
	}
	[role='gridcell'][aria-disabled='true'] {
		color: var(--k-fg-muted);
		opacity: 0.5;
		text-decoration-line: line-through;
		cursor: not-allowed;
	}
	[role='gridcell'][aria-disabled='true']:hover {
		background: transparent;
	}
	@keyframes k-drop {
		from {
			opacity: 0;
			transform: translateY(-4px);
		}
	}
	@media (forced-colors: active) {
		.k-date:has(input:focus-visible) {
			border-color: Highlight;
		}
		.invalid {
			border-style: double;
			border-width: 3px;
		}
		.disabled {
			opacity: 1;
			border-color: GrayText;
			color: GrayText;
		}
		button {
			border: 1px solid ButtonText;
			color: ButtonText;
		}
		button:disabled {
			opacity: 1;
			border-color: GrayText;
			color: GrayText;
		}
		/* Selected day: inverted; today keeps its underline; unavailable days stay struck through in GrayText. */
		[role='gridcell'][aria-selected='true'] {
			forced-color-adjust: none;
			background: Highlight;
			color: HighlightText;
		}
		[role='gridcell'][aria-selected='true']:focus-visible {
			outline-color: HighlightText;
		}
		[role='gridcell']:hover:not([aria-selected='true']):not([aria-disabled='true']) {
			outline: 1px solid Highlight;
			outline-offset: -1px;
		}
		[role='gridcell'][aria-disabled='true'] {
			opacity: 1;
			color: GrayText;
		}
		th {
			color: CanvasText;
		}
		input::placeholder {
			color: GrayText;
		}
	}
</style>
