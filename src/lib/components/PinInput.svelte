<script lang="ts">
	import { strings } from './strings.svelte.js';
	import { tick } from 'svelte';
	import Field from './Field.svelte';
	import Label from './Label.svelte';

	export type PinInputType = 'numeric' | 'alphanumeric';

	interface Props {
		/** Name of the whole group. */
		label?: string | undefined;
		hint?: string | undefined;
		error?: string | undefined;
		/** The entered characters (gaps are left out). */
		value?: string | undefined;
		/** Number of boxes. */
		length?: number | undefined;
		/** `numeric` = digits only (numeric keyboard), `alphanumeric` = letters and digits. */
		type?: PinInputType | undefined;
		/** Hide the characters like a password. */
		mask?: boolean | undefined;
		/** Form field name; a hidden input carries `value`. */
		name?: string | undefined;
		required?: boolean | undefined;
		disabled?: boolean | undefined;
		/** Accessible name of each box; `{index}` and `{length}` are replaced. */
		digitLabel?: string | undefined;
		id?: string | undefined;
		/** Called when the value changes by user input. */
		onchange?: ((value: string) => void) | undefined;
		/** Called when every box is filled. */
		oncomplete?: ((value: string) => void) | undefined;
		class?: string | undefined;
	}
	let {
		label,
		hint,
		error,
		value = $bindable(),
		length = 6,
		type = 'numeric',
		mask = false,
		name,
		required = false,
		disabled = false,
		digitLabel: digitLabelProp,
		id,
		onchange,
		oncomplete,
		class: cls = ''
	}: Props = $props();
	const digitLabel = $derived(digitLabelProp ?? strings().pinInput.digitLabel);

	const uid = $props.id();
	const baseId = $derived(id ?? `${uid}-pin`);
	const count = $derived(Math.max(1, Math.min(32, Math.floor(Number.isFinite(length) ? length : 6))));
	const allowed = $derived(type === 'alphanumeric' ? /[\p{L}\p{N}]/u : /[0-9]/);

	let chars = $state<string[]>([]);
	const boxes: HTMLInputElement[] = $state([]);

	function clean(s: string): string[] {
		// Full-width digits (e.g. from Japanese keyboards) count as digits.
		const t = s.normalize('NFKC');
		return Array.from(t).filter((c) => allowed.test(c));
	}

	// Rebuild the boxes when the value (or the length) changes from outside.
	let syncedKey: string | undefined;
	$effect.pre(() => {
		const key = `${value ?? ''}\u0000${count}\u0000${type}`;
		if (key === syncedKey) return;
		syncedKey = key;
		if (chars.join('') === (value ?? '') && chars.length === count) return;
		const next = clean(value ?? '').slice(0, count);
		chars = Array.from({ length: count }, (_, i) => next[i] ?? '');
	});

	function update(next: string[]) {
		chars = next;
		const joined = next.join('');
		syncedKey = `${joined}\u0000${count}\u0000${type}`;
		if (joined === (value ?? '')) return;
		value = joined;
		onchange?.(joined);
		if (joined.length === count) oncomplete?.(joined);
	}
	async function focusBox(i: number) {
		await tick();
		const el = boxes[Math.max(0, Math.min(count - 1, i))];
		el?.focus();
		el?.select();
	}
	/** Writes characters from box `start` on and moves focus after the last one. */
	function fill(start: number, input: string[]) {
		if (!input.length) return;
		const next = [...chars];
		let i = start;
		for (const c of input) {
			if (i >= count) break;
			next[i++] = c;
		}
		update(next);
		void focusBox(i >= count ? count - 1 : i);
	}

	function oninput(e: Event, i: number) {
		const el = e.currentTarget as HTMLInputElement;
		const old = chars[i];
		let typed = clean(el.value);
		// Typing into a filled box gives old + new character: keep the new one.
		if (typed.length === 2 && old) {
			if (typed[0] === old) typed = [typed[1]];
			else if (typed[1] === old) typed = [typed[0]];
		}
		if (!typed.length) {
			// Deleted (virtual keyboards may skip keydown) or a character that is not allowed.
			if (!el.value && old) update(chars.map((c, k) => (k === i ? '' : c)));
			el.value = el.value ? old : '';
			return;
		}
		el.value = typed[0];
		fill(i, typed);
	}
	function onkeydown(e: KeyboardEvent, i: number) {
		switch (e.key) {
			case 'Backspace':
				e.preventDefault();
				if (chars[i]) update(chars.map((c, k) => (k === i ? '' : c)));
				else if (i > 0) {
					update(chars.map((c, k) => (k === i - 1 ? '' : c)));
					void focusBox(i - 1);
				}
				break;
			case 'Delete':
				e.preventDefault();
				if (chars[i]) update(chars.map((c, k) => (k === i ? '' : c)));
				break;
			case 'ArrowLeft':
				e.preventDefault();
				if (i > 0) void focusBox(i - 1);
				break;
			case 'ArrowRight':
				e.preventDefault();
				if (i < count - 1) void focusBox(i + 1);
				break;
			case 'Home':
				e.preventDefault();
				void focusBox(0);
				break;
			case 'End':
				e.preventDefault();
				void focusBox(count - 1);
				break;
			default:
				// A character that is not allowed never reaches the box.
				if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey && !allowed.test(e.key.normalize('NFKC'))) e.preventDefault();
		}
	}
	function onpaste(e: ClipboardEvent, i: number) {
		e.preventDefault();
		const typed = clean(e.clipboardData?.getData('text') ?? '');
		if (!typed.length) return;
		// A full code fills all boxes from the start; a shorter piece fills from the focused box.
		fill(typed.length >= count ? 0 : i, typed);
	}
	function boxLabel(i: number): string {
		return digitLabel.replaceAll('{index}', String(i + 1)).replaceAll('{length}', String(count));
	}
</script>

<Field {hint} {error} class={cls}>
	{#snippet children({ describedby, invalid })}
		{#if label}<Label id="{baseId}-label" for="{baseId}-0" text={label} {required} />{/if}
		<div class="k-pin" role="group" aria-labelledby={label ? `${baseId}-label` : undefined} aria-describedby={describedby}>
			{#each { length: count } as _, i (i)}
				<input
					bind:this={boxes[i]}
					id="{baseId}-{i}"
					class="box"
					class:filled={!!chars[i]}
					type={mask ? 'password' : 'text'}
					inputmode={type === 'numeric' ? 'numeric' : 'text'}
					autocomplete={i === 0 ? 'one-time-code' : 'off'}
					autocapitalize="off"
					spellcheck="false"
					enterkeyhint={i === count - 1 ? 'done' : 'next'}
					aria-label={boxLabel(i)}
					aria-invalid={invalid || undefined}
					value={chars[i] ?? ''}
					required={required && !chars[i]}
					{disabled}
					oninput={(e) => oninput(e, i)}
					onkeydown={(e) => onkeydown(e, i)}
					onpaste={(e) => onpaste(e, i)}
					onfocus={(e) => e.currentTarget.select()}
				/>
			{/each}
		</div>
		{#if name}<input type="hidden" {name} value={value ?? ''} />{/if}
	{/snippet}
</Field>

<style>
	.k-pin {
		display: flex;
		flex-wrap: wrap;
		gap: var(--k-space-2);
		min-width: 0;
	}
	.box {
		/* Basis 0 + max-width: boxes shrink to 40px before the row wraps. */
		flex: 1 1 0;
		box-sizing: border-box;
		width: 0;
		min-width: max(40px, var(--k-tap-target));
		max-width: var(--k-control-h);
		height: var(--k-control-h);
		margin: 0;
		padding: 0;
		border: var(--k-border-w) solid var(--k-border);
		border-radius: var(--k-radius-field);
		background: var(--k-bg-raised);
		color: var(--k-fg);
		font-family: var(--k-font-mono);
		font-size: var(--k-text-lg);
		font-variant-numeric: tabular-nums;
		text-align: center;
		caret-color: var(--k-accent-mark);
		transition:
			border-color var(--k-dur) var(--k-ease),
			background-color var(--k-dur) var(--k-ease);
	}
	.box:hover:not(:disabled) {
		border-color: var(--k-fg-muted);
	}
	.box:focus-visible {
		outline: var(--k-focus-w) solid var(--k-focus);
		outline-offset: var(--k-focus-offset);
		border-color: var(--k-accent-mark);
	}
	.box.filled {
		border-color: var(--k-fg);
		background: var(--k-bg-raised);
	}
	.box[aria-invalid='true'] {
		border-color: var(--k-danger);
	}
	.box:disabled {
		opacity: 0.55;
		cursor: not-allowed;
	}
	@media (max-width: 360px) {
		.k-pin {
			gap: var(--k-space-1);
		}
	}
	@media (forced-colors: active) {
		.box:focus-visible {
			border-color: Highlight;
		}
		.box[aria-invalid='true'] {
			border-style: double;
			border-width: 3px;
		}
		.box:disabled {
			opacity: 1;
			border-color: GrayText;
			color: GrayText;
		}
	}
</style>
