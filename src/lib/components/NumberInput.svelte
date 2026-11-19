<script lang="ts">
	import Field from './Field.svelte';

	interface Props {
		label?: string | undefined;
		hint?: string | undefined;
		error?: string | undefined;
		/** The number, or null when the field is empty. */
		value?: number | null | undefined;
		min?: number | undefined;
		max?: number | undefined;
		/** Amount of one arrow step; PageUp/PageDown move ten steps. */
		step?: number | undefined;
		/**
		 * Locale-aware display while the field is not focused, e.g.
		 * `{ style: 'currency', currency: 'EUR' }`. While editing, the plain number is shown.
		 */
		format?: Intl.NumberFormatOptions | undefined;
		/** BCP 47 locale for `format` and the decimal separator; default: the browser's. */
		locale?: string | undefined;
		/** Form field name; a hidden input carries the plain number. */
		name?: string | undefined;
		required?: boolean | undefined;
		disabled?: boolean | undefined;
		readonly?: boolean | undefined;
		placeholder?: string | undefined;
		/** Accessible names of the step buttons. */
		decrementLabel?: string | undefined;
		incrementLabel?: string | undefined;
		id?: string | undefined;
		/** Called when the user commits a new value (blur, Enter, step keys or buttons). */
		onchange?: ((value: number | null) => void) | undefined;
		class?: string | undefined;
	}
	let {
		label,
		hint,
		error,
		value = $bindable(),
		min,
		max,
		step = 1,
		format,
		locale,
		name,
		required = false,
		disabled = false,
		readonly = false,
		placeholder,
		decrementLabel = 'Decrease',
		incrementLabel = 'Increase',
		id,
		onchange,
		class: cls = ''
	}: Props = $props();

	const uid = $props.id();
	const inputId = $derived(id ?? `${uid}-input`);

	let text = $state('');
	let focused = $state(false);
	let committed: number | null = null;

	const current = $derived(typeof value === 'number' && Number.isFinite(value) ? value : null);
	const stepSize = $derived(step > 0 && Number.isFinite(step) ? step : 1);
	const lo = $derived(typeof min === 'number' && Number.isFinite(min) ? min : undefined);
	const hi = $derived(typeof max === 'number' && Number.isFinite(max) ? max : undefined);

	const loc = $derived.by(() => {
		try {
			return new Intl.NumberFormat(locale).resolvedOptions().locale;
		} catch {
			return new Intl.NumberFormat().resolvedOptions().locale;
		}
	});
	/** Decimal and group separators of the locale. */
	const seps = $derived.by(() => {
		const parts = new Intl.NumberFormat(loc).formatToParts(12345.6);
		return {
			decimal: parts.find((p) => p.type === 'decimal')?.value ?? '.',
			group: parts.find((p) => p.type === 'group')?.value ?? ','
		};
	});
	const display = $derived.by(() => {
		if (!format) return null;
		try {
			return new Intl.NumberFormat(loc, format);
		} catch {
			return null;
		}
	});

	function decimals(n: number): number {
		if (!Number.isFinite(n)) return 0;
		const s = String(n);
		const e = /e-(\d+)$/.exec(s);
		if (e) return Number(e[1]);
		const dot = s.indexOf('.');
		return dot < 0 ? 0 : s.length - dot - 1;
	}
	function clamp(n: number): number {
		let v = n;
		if (lo !== undefined && v < lo) v = lo;
		if (hi !== undefined && v > hi) v = hi;
		return v;
	}
	/** Plain number for editing: locale decimal separator, no grouping. */
	function plain(n: number | null): string {
		if (n === null) return '';
		const s = String(n);
		return /e/i.test(s) ? s : s.replace('.', seps.decimal);
	}
	function pretty(n: number | null): string {
		if (n === null) return '';
		return display ? display.format(n) : plain(n);
	}
	/**
	 * Reads the typed text: null for empty, undefined for not a number. Accepts the locale's
	 * decimal separator, drops group separators, spaces and a leading "+". Where "." groups
	 * thousands (de-DE), a single "." is still read as decimal point unless exactly three
	 * digits follow it ("3.5" = 3,5 but "1.000" = 1000).
	 */
	function parse(raw: string): number | null | undefined {
		let s = raw.trim().replace(/[\s  ]/g, '');
		if (!s) return null;
		s = s.replace(/^\+/, '').replace(/[−‒–]/g, '-');
		const { decimal, group } = seps;
		const dotIsDecimal = group === '.' && !s.includes(decimal) && /^-?\d*\.\d*$/.test(s) && !/\.\d{3}$/.test(s);
		if (dotIsDecimal) s = s.replace('.', decimal);
		if (group && group !== decimal) s = s.split(group).join('');
		if (decimal !== '.') s = s.split(decimal).join('.');
		if (!/^-?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i.test(s)) return undefined;
		const n = Number(s);
		return Number.isFinite(n) ? n : undefined;
	}

	// Show the formatted value whenever it changes from outside (and while not editing).
	let syncedKey: string | undefined;
	$effect.pre(() => {
		const key = `${current}\u0000${loc}\u0000${JSON.stringify(format ?? null)}`;
		if (key === syncedKey) return;
		syncedKey = key;
		if (!focused) {
			text = pretty(current);
			committed = current;
		}
	});

	function set(n: number | null) {
		syncedKey = `${n}\u0000${loc}\u0000${JSON.stringify(format ?? null)}`;
		value = n;
	}
	function commit() {
		if (current !== committed) {
			committed = current;
			onchange?.(current);
		}
	}
	function stepBy(count: number) {
		if (disabled || readonly) return;
		const base = current ?? clamp(0);
		const places = Math.max(decimals(stepSize), decimals(base));
		const next = clamp(Number((base + count * stepSize).toFixed(Math.min(places, 20))));
		set(next);
		text = focused ? plain(next) : pretty(next);
		commit();
	}
	function toEdge(edge: number | undefined) {
		if (edge === undefined || disabled || readonly) return;
		set(edge);
		text = focused ? plain(edge) : pretty(edge);
		commit();
	}

	function oninput(e: Event) {
		const n = parse((e.currentTarget as HTMLInputElement).value);
		if (n !== undefined) set(n);
	}
	function onfocus() {
		focused = true;
		text = plain(current);
	}
	function onblur() {
		focused = false;
		const n = parse(text);
		// Invalid text falls back to the last valid number; valid numbers are clamped.
		const next = n === undefined ? current : n === null ? null : clamp(n);
		set(next);
		text = pretty(next);
		commit();
	}
	function onkeydown(e: KeyboardEvent) {
		switch (e.key) {
			case 'ArrowUp':
				e.preventDefault();
				stepBy(1);
				break;
			case 'ArrowDown':
				e.preventDefault();
				stepBy(-1);
				break;
			case 'PageUp':
				e.preventDefault();
				stepBy(10);
				break;
			case 'PageDown':
				e.preventDefault();
				stepBy(-10);
				break;
			case 'Home':
				if (lo !== undefined) {
					e.preventDefault();
					toEdge(lo);
				}
				break;
			case 'End':
				if (hi !== undefined) {
					e.preventDefault();
					toEdge(hi);
				}
				break;
			case 'Enter': {
				const n = parse(text);
				const next = n === undefined ? current : n === null ? null : clamp(n);
				set(next);
				text = plain(next);
				commit();
				break;
			}
		}
	}

	const atMin = $derived(lo !== undefined && current !== null && current <= lo);
	const atMax = $derived(hi !== undefined && current !== null && current >= hi);
	const valueText = $derived(current === null ? undefined : display ? display.format(current) : undefined);
</script>

<Field {label} {hint} {error} {required} for={inputId} class={cls}>
	{#snippet children({ describedby, invalid })}
		<div class="k-number" class:invalid class:disabled>
			<button
				type="button"
				class="step"
				tabindex="-1"
				aria-label={decrementLabel}
				aria-controls={inputId}
				disabled={disabled || readonly || atMin}
				onmousedown={(e) => e.preventDefault()}
				onclick={() => stepBy(-1)}
			>
				<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8h9" stroke="currentColor" stroke-width="2" /></svg>
			</button>
			<input
				id={inputId}
				type="text"
				inputmode="decimal"
				role="spinbutton"
				autocomplete="off"
				spellcheck="false"
				aria-valuenow={current ?? undefined}
				aria-valuemin={lo}
				aria-valuemax={hi}
				aria-valuetext={valueText}
				aria-invalid={invalid || undefined}
				aria-describedby={describedby}
				bind:value={text}
				{placeholder}
				{required}
				{disabled}
				{readonly}
				{oninput}
				{onfocus}
				{onblur}
				{onkeydown}
			/>
			<button
				type="button"
				class="step"
				tabindex="-1"
				aria-label={incrementLabel}
				aria-controls={inputId}
				disabled={disabled || readonly || atMax}
				onmousedown={(e) => e.preventDefault()}
				onclick={() => stepBy(1)}
			>
				<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8h9M8 3.5v9" stroke="currentColor" stroke-width="2" /></svg>
			</button>
			{#if name}<input type="hidden" {name} value={current ?? ''} />{/if}
		</div>
	{/snippet}
</Field>

<style>
	.k-number {
		display: flex;
		align-items: center;
		gap: var(--k-space-1);
		min-height: var(--k-control-h);
		padding: 0 var(--k-space-1);
		box-sizing: border-box;
		border: var(--k-border-w) solid var(--k-border);
		border-radius: var(--k-radius-field);
		background: var(--k-bg-raised);
		color: var(--k-fg);
		transition: border-color var(--k-dur) var(--k-ease);
	}
	.k-number:hover {
		border-color: var(--k-fg-muted);
	}
	.k-number:focus-within {
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
		padding: 0 var(--k-space-1);
		border: 0;
		outline: 0;
		background: transparent;
		color: inherit;
		font: inherit;
		font-size: var(--k-text-md);
		font-variant-numeric: tabular-nums;
		text-align: center;
	}
	input::placeholder {
		color: var(--k-fg-muted);
		opacity: 1;
	}
	input:disabled {
		cursor: not-allowed;
	}
	.step {
		flex: none;
		display: grid;
		place-items: center;
		width: max(40px, var(--k-tap-target));
		height: max(40px, var(--k-tap-target));
		padding: 0;
		border: 0;
		border-radius: var(--k-radius-control);
		background: transparent;
		color: var(--k-fg);
		cursor: pointer;
		transition: background-color var(--k-dur) var(--k-ease);
	}
	.step:hover:not(:disabled) {
		background: var(--k-bg-sunken);
	}
	.step:disabled {
		color: var(--k-fg-muted);
		opacity: 0.5;
		cursor: not-allowed;
	}
	.step svg {
		width: 16px;
		height: 16px;
	}
</style>
