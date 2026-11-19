<script lang="ts">
	import { tick } from 'svelte';
	import Field from './Field.svelte';
	import { anchorTo, composedContains, eventWithin } from './anchor.js';
	import { describeColor, hsvToRgb, normalizeHex, parseHex, prefersDarkInk, rgbToHsv, toHex, type Hsv } from './color.js';

	export interface ColorSwatch {
		/** Any accepted hex form. */
		value: string;
		/** Accessible name; default: the hex value. */
		label?: string;
	}
	interface Props {
		label?: string;
		hint?: string;
		error?: string;
		/** Hex colour, `#rrggbb` (or `#rrggbbaa` with `alpha`); '' = none. */
		value?: string;
		/** Offer an opacity slider; the value then carries alpha when not opaque. */
		alpha?: boolean;
		/** Preset colours in the panel. */
		swatches?: (string | ColorSwatch)[];
		/** Form field name; a hidden input carries `value`. */
		name?: string;
		required?: boolean;
		disabled?: boolean;
		placeholder?: string;
		/** Name of the swatch button and the panel. */
		pickerLabel?: string;
		/** Name of the saturation/brightness area. */
		areaLabel?: string;
		/** Value text of the area; `{color}`, `{saturation}` and `{brightness}` (percent) are replaced. */
		areaText?: string;
		hueLabel?: string;
		alphaLabel?: string;
		swatchesLabel?: string;
		/** Shown when the typed text is not a hex colour. */
		invalidText?: string;
		/** Names a colour for screen readers; default: short English names ("dark blue"). */
		describe?: (hsv: Hsv) => string;
		id?: string;
		/** Called when the user commits a new colour. */
		onchange?: (value: string) => void;
		class?: string;
	}
	let {
		label,
		hint,
		error,
		value = $bindable(''),
		alpha = false,
		swatches = [],
		name,
		required = false,
		disabled = false,
		placeholder = '#rrggbb',
		pickerLabel = 'Choose color',
		areaLabel = 'Saturation and brightness',
		areaText = '{color}, saturation {saturation}%, brightness {brightness}%',
		hueLabel = 'Hue',
		alphaLabel = 'Opacity',
		swatchesLabel = 'Presets',
		invalidText = 'Enter a color as #rgb, #rrggbb or #rrggbbaa.',
		describe = describeColor,
		id,
		onchange,
		class: cls = ''
	}: Props = $props();

	const uid = $props.id();
	const inputId = $derived(id ?? `${uid}-input`);

	let hsv = $state<Hsv>({ h: 0, s: 0, v: 0 });
	let a = $state(1);
	let text = $state('');
	let invalidInput = $state(false);
	let expanded = $state(false);
	let dragging = false;
	let committed = '';
	let box: HTMLElement | undefined = $state();
	let btn: HTMLButtonElement | undefined = $state();
	let panel: HTMLElement | undefined = $state();
	let area: HTMLElement | undefined = $state();

	const rgb = $derived(hsvToRgb(hsv.h, hsv.s, hsv.v));
	const opaque = $derived(toHex({ ...rgb, a: 1 }));
	const hueColor = $derived(toHex({ ...hsvToRgb(hsv.h, 1, 1), a: 1 }));
	const current = $derived(normalizeHex(value ?? '', alpha));
	const pct = (n: number) => Math.round(n * 100);
	const areaValue = $derived(
		areaText
			.replaceAll('{color}', describe(hsv))
			.replaceAll('{saturation}', String(pct(hsv.s)))
			.replaceAll('{brightness}', String(pct(hsv.v)))
	);
	const items = $derived(
		swatches
			.map((s) => (typeof s === 'string' ? { value: s } : s))
			.map((s) => ({ hex: normalizeHex(s.value, alpha), label: s.label }))
			.filter((s): s is { hex: string; label: string | undefined } => !!s.hex)
	);

	/** Takes a colour into the picker state; keeps hue (and saturation) where the colour has none. */
	function load(hex: string) {
		const c = parseHex(hex);
		if (!c) return;
		const next = rgbToHsv(c.r, c.g, c.b);
		if (next.v === 0) next.s = hsv.s;
		if (next.s === 0 || next.v === 0) next.h = hsv.h;
		hsv = next;
		a = alpha ? c.a : 1;
	}

	// Follow the value when it changes from outside.
	let syncedKey: string | undefined;
	$effect.pre(() => {
		const key = `${value}\u0000${alpha}`;
		if (key === syncedKey) return;
		syncedKey = key;
		const hex = normalizeHex(value ?? '', alpha);
		if (hex) load(hex);
		text = hex ?? (value ?? '');
		invalidInput = false;
		committed = hex ?? '';
	});

	function setValue(hex: string) {
		syncedKey = `${hex}\u0000${alpha}`;
		value = hex;
		text = hex;
		invalidInput = false;
	}
	function commit() {
		const v = current ?? '';
		if (v !== committed) {
			committed = v;
			onchange?.(v);
		}
	}
	/** Writes the picker state into the value. */
	function apply() {
		setValue(toHex({ ...rgb, a }, alpha));
	}

	function commitText() {
		const t = text.trim();
		if (!t) {
			setValue('');
			commit();
			return;
		}
		const hex = normalizeHex(t, alpha);
		if (hex) {
			load(hex);
			setValue(hex);
		} else {
			syncedKey = `\u0000${alpha}`;
			value = '';
			invalidInput = true;
		}
		commit();
	}

	/* ---------- panel ---------- */
	$effect(() => {
		if (!expanded || !box || !panel) return;
		return anchorTo(box, panel, { placement: 'bottom-start' });
	});
	async function openPanel() {
		if (disabled) return;
		expanded = true;
		await tick();
		area?.focus();
	}
	function closePanel(refocus: boolean) {
		if (!expanded) return;
		expanded = false;
		commit();
		if (refocus) btn?.focus();
	}
	function onPanelKey(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			e.preventDefault();
			e.stopPropagation();
			closePanel(true);
		}
	}
	function onFocusOut(e: FocusEvent) {
		// Non-modal: when focus leaves panel and trigger, close quietly.
		const next = e.relatedTarget as Node | null;
		if (!next) return;
		if (composedContains(panel, next) || composedContains(btn, next)) return;
		closePanel(false);
	}
	function onWindowPointer(e: PointerEvent) {
		if (expanded && !eventWithin(e, panel, btn)) closePanel(false);
	}

	/* ---------- saturation / brightness area ---------- */
	function fromPointer(e: PointerEvent) {
		if (!area) return;
		const r = area.getBoundingClientRect();
		const s = r.width ? Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) : 0;
		const v = r.height ? Math.min(1, Math.max(0, 1 - (e.clientY - r.top) / r.height)) : 0;
		hsv = { h: hsv.h, s, v };
		apply();
	}
	function onAreaDown(e: PointerEvent) {
		if (disabled || e.button !== 0) return;
		e.preventDefault();
		area?.focus();
		area?.setPointerCapture(e.pointerId);
		dragging = true;
		fromPointer(e);
	}
	function onAreaMove(e: PointerEvent) {
		if (dragging) fromPointer(e);
	}
	function onAreaUp(e: PointerEvent) {
		if (!dragging) return;
		dragging = false;
		if (area?.hasPointerCapture(e.pointerId)) area.releasePointerCapture(e.pointerId);
		commit();
	}
	function onAreaKey(e: KeyboardEvent) {
		const big = e.shiftKey ? 0.1 : 0.01;
		let { s, v } = hsv;
		switch (e.key) {
			case 'ArrowLeft': s -= big; break;
			case 'ArrowRight': s += big; break;
			case 'ArrowUp': v += big; break;
			case 'ArrowDown': v -= big; break;
			case 'PageUp': v += 0.1; break;
			case 'PageDown': v -= 0.1; break;
			case 'Home': s = 0; break;
			case 'End': s = 1; break;
			default: return;
		}
		e.preventDefault();
		const round = (n: number) => Math.round(Math.min(1, Math.max(0, n)) * 100) / 100;
		hsv = { h: hsv.h, s: round(s), v: round(v) };
		apply();
		commit();
	}

	function onHue(e: Event) {
		hsv = { ...hsv, h: Number((e.currentTarget as HTMLInputElement).value) };
		apply();
	}
	function onAlpha(e: Event) {
		a = Number((e.currentTarget as HTMLInputElement).value) / 100;
		apply();
	}
	function pickSwatch(hex: string) {
		load(hex);
		setValue(hex);
		commit();
	}
	function ink(hex: string): string {
		const c = parseHex(hex);
		return c && c.a > 0.5 && !prefersDarkInk(c.r, c.g, c.b) ? '#ffffff' : '#000000';
	}
</script>

<svelte:window onpointerdown={onWindowPointer} />

<Field {label} {hint} error={error ?? (invalidInput ? invalidText : undefined)} {required} for={inputId} class={cls}>
	{#snippet children({ describedby, invalid })}
		<div class="k-color" class:invalid class:disabled bind:this={box}>
			<button
				bind:this={btn}
				type="button"
				class="swatch-btn"
				aria-label={current ? `${pickerLabel}, ${current}` : pickerLabel}
				aria-haspopup="dialog"
				aria-expanded={expanded}
				aria-controls="{uid}-panel"
				{disabled}
				onclick={() => (expanded ? closePanel(true) : openPanel())}
			>
				<span class="chip" class:empty={!current} style:--chip={current ?? 'transparent'}>
					{#if !current}<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 16L16 4" stroke="currentColor" stroke-width="1.6" /></svg>{/if}
				</span>
			</button>
			<input
				id={inputId}
				type="text"
				bind:value={text}
				{placeholder}
				aria-invalid={invalid || undefined}
				aria-describedby={describedby}
				autocomplete="off"
				autocapitalize="off"
				spellcheck="false"
				maxlength={9}
				{required}
				{disabled}
				onchange={commitText}
				onkeydown={(e) => { if (e.key === 'Enter') commitText(); }}
			/>
			{#if name}<input type="hidden" {name} value={current ?? ''} />{/if}
		</div>
		{#if expanded}
			<div
				class="panel"
				role="dialog"
				id="{uid}-panel"
				aria-label={pickerLabel}
				tabindex="-1"
				bind:this={panel}
				onkeydown={onPanelKey}
				onfocusout={onFocusOut}
			>
				<div
					class="area"
					bind:this={area}
					role="slider"
					tabindex="0"
					aria-label={areaLabel}
					aria-valuemin={0}
					aria-valuemax={100}
					aria-valuenow={pct(hsv.s)}
					aria-valuetext={areaValue}
					style:--hue={hueColor}
					onpointerdown={onAreaDown}
					onpointermove={onAreaMove}
					onpointerup={onAreaUp}
					onpointercancel={onAreaUp}
					onkeydown={onAreaKey}
				>
					<span class="thumb" style:left="{hsv.s * 100}%" style:top="{(1 - hsv.v) * 100}%" style:--c={opaque}></span>
				</div>
				<label class="row">
					<span class="lbl">{hueLabel}</span>
					<input
						class="range hue"
						type="range"
						min="0"
						max="359"
						step="1"
						value={Math.round(hsv.h) % 360}
						aria-valuetext="{Math.round(hsv.h) % 360}°"
						oninput={onHue}
						onchange={commit}
					/>
				</label>
				{#if alpha}
					<label class="row">
						<span class="lbl">{alphaLabel}</span>
						<input
							class="range alpha"
							type="range"
							min="0"
							max="100"
							step="1"
							value={Math.round(a * 100)}
							aria-valuetext="{Math.round(a * 100)}%"
							style:--c={opaque}
							oninput={onAlpha}
							onchange={commit}
						/>
					</label>
				{/if}
				{#if items.length}
					<div class="swatches" role="group" aria-label={swatchesLabel}>
						{#each items as s, i (i)}
							<button
								type="button"
								class="swatch"
								aria-label={s.label ?? s.hex}
								aria-pressed={s.hex === current}
								style:--chip={s.hex}
								style:--ink={ink(s.hex)}
								onclick={() => pickSwatch(s.hex)}
							>
								{#if s.hex === current}<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" stroke-width="2.2" /></svg>{/if}
							</button>
						{/each}
					</div>
				{/if}
			</div>
		{/if}
	{/snippet}
</Field>

<style>
	.k-color {
		--checker: conic-gradient(var(--k-bg-sunken) 25%, var(--k-bg-raised) 0 50%, var(--k-bg-sunken) 0 75%, var(--k-bg-raised) 0) 0 0 / 10px 10px;
		display: flex;
		align-items: center;
		gap: var(--k-space-2);
		min-height: var(--k-control-h);
		padding: 0 var(--k-space-4) 0 var(--k-space-1);
		box-sizing: border-box;
		border: var(--k-border-w) solid var(--k-border);
		border-radius: var(--k-radius-field);
		background: var(--k-bg-raised);
		color: var(--k-fg);
		transition: border-color var(--k-dur) var(--k-ease);
	}
	.k-color:hover { border-color: var(--k-fg-muted); }
	.k-color:has(input:focus-visible) { outline: var(--k-focus-w) solid var(--k-focus); outline-offset: var(--k-focus-offset); border-color: var(--k-accent-mark); }
	.invalid { border-color: var(--k-danger); }
	.disabled { opacity: 0.55; }
	input[type='text'] {
		flex: 1;
		min-width: 0;
		min-height: var(--k-control-h);
		margin-block: calc(var(--k-border-w) * -1);
		padding: 0;
		border: 0;
		outline: 0;
		background: transparent;
		color: inherit;
		font-family: var(--k-font-mono);
		font-size: var(--k-text-md);
		text-transform: lowercase;
	}
	input[type='text']::placeholder { color: var(--k-fg-muted); opacity: 1; }
	input[type='text']:disabled { cursor: not-allowed; }
	.swatch-btn {
		flex: none;
		display: grid;
		place-items: center;
		width: max(40px, var(--k-tap-target));
		height: max(40px, var(--k-tap-target));
		padding: 0;
		border: 0;
		border-radius: var(--k-radius-control);
		background: transparent;
		cursor: pointer;
	}
	.swatch-btn:hover:not(:disabled) { background: var(--k-bg-sunken); }
	.swatch-btn:focus-visible { outline: var(--k-focus-w) solid var(--k-focus); outline-offset: calc(var(--k-focus-w) * -1); }
	.swatch-btn:disabled { cursor: not-allowed; }
	.chip {
		display: grid;
		place-items: center;
		box-sizing: border-box;
		width: 28px;
		height: 28px;
		border: var(--k-border-w) solid var(--k-border);
		border-radius: min(var(--k-radius-badge), 8px);
		background: linear-gradient(var(--chip), var(--chip)), var(--checker);
		color: var(--k-fg-muted);
	}
	.chip svg { width: 20px; height: 20px; }

	.panel {
		--checker: conic-gradient(var(--k-bg-sunken) 25%, var(--k-bg-raised) 0 50%, var(--k-bg-sunken) 0 75%, var(--k-bg-raised) 0) 0 0 / 10px 10px;
		position: fixed;
		z-index: 950;
		box-sizing: border-box;
		display: grid;
		gap: var(--k-space-3);
		width: min(280px, calc(100vw - 16px));
		max-height: var(--avail-h, 70vh);
		overflow: auto;
		padding: var(--k-space-3);
		border: var(--k-border-w) solid var(--k-line-strong);
		border-radius: min(var(--k-radius-overlay), 16px);
		background: var(--k-bg-raised);
		color: var(--k-fg);
		box-shadow: var(--k-shadow-overlay);
		font-family: var(--k-font-sans);
		animation: k-drop var(--k-dur) var(--k-ease);
	}
	.panel:focus-visible { outline: var(--k-focus-w) solid var(--k-focus); outline-offset: var(--k-focus-offset); }
	.area {
		position: relative;
		height: 160px;
		border-radius: min(var(--k-radius-field), 10px);
		background: linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, var(--hue));
		box-shadow: inset 0 0 0 var(--k-border-w) var(--k-line);
		touch-action: none;
		cursor: crosshair;
		outline: none;
	}
	/* White and black rings keep the thumb visible on every colour. */
	.thumb {
		position: absolute;
		width: 20px;
		height: 20px;
		box-sizing: border-box;
		margin: -10px 0 0 -10px;
		border: 2px solid #fff;
		border-radius: 50%;
		background: var(--c);
		box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.7), inset 0 0 0 1px rgba(0, 0, 0, 0.3);
		pointer-events: none;
	}
	.area:focus-visible .thumb {
		outline: var(--k-focus-w) solid var(--k-focus);
		outline-offset: calc(var(--k-focus-offset) + 1px);
		width: 24px;
		height: 24px;
		margin: -12px 0 0 -12px;
	}
	.row { display: grid; gap: var(--k-space-1); }
	.lbl {
		font-family: var(--k-label-font);
		font-size: var(--k-text-xs);
		font-weight: var(--k-weight-label);
		text-transform: var(--k-label-transform);
		letter-spacing: var(--k-label-tracking);
		color: var(--k-fg-muted);
	}
	.range {
		--thumb: 22px;
		--track: 12px;
		appearance: none;
		-webkit-appearance: none;
		width: 100%;
		height: max(40px, var(--k-tap-target));
		margin: 0;
		background: transparent;
		cursor: pointer;
	}
	.range:focus-visible { outline: var(--k-focus-w) solid var(--k-focus); outline-offset: var(--k-focus-offset); border-radius: var(--k-radius-badge); }
	.hue { --bg: linear-gradient(to right, #f00, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00); }
	.alpha { --bg: linear-gradient(to right, transparent, var(--c)), var(--checker); }
	.range::-webkit-slider-runnable-track {
		box-sizing: border-box;
		height: var(--track);
		border: var(--k-border-w) solid var(--k-line);
		border-radius: var(--k-radius-badge);
		background: var(--bg);
	}
	.range::-moz-range-track {
		box-sizing: border-box;
		height: var(--track);
		border: var(--k-border-w) solid var(--k-line);
		border-radius: var(--k-radius-badge);
		background: var(--bg);
	}
	.range::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		box-sizing: border-box;
		width: var(--thumb);
		height: var(--thumb);
		margin-top: calc((var(--track) - var(--thumb)) / 2 - var(--k-border-w));
		border: 2px solid #fff;
		border-radius: var(--k-radius-control);
		background: transparent;
		box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.7);
	}
	.range::-moz-range-thumb {
		box-sizing: border-box;
		width: var(--thumb);
		height: var(--thumb);
		border: 2px solid #fff;
		border-radius: var(--k-radius-control);
		background: transparent;
		box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.7);
	}
	.swatches { display: flex; flex-wrap: wrap; gap: var(--k-space-1); }
	.swatch {
		display: grid;
		place-items: center;
		box-sizing: border-box;
		width: max(40px, var(--k-tap-target));
		height: max(40px, var(--k-tap-target));
		padding: 0;
		border: var(--k-border-w) solid var(--k-border);
		border-radius: min(var(--k-radius-badge), 8px);
		background: linear-gradient(var(--chip), var(--chip)), var(--checker);
		color: var(--ink);
		cursor: pointer;
	}
	.swatch[aria-pressed='true'] { box-shadow: inset 0 0 0 2px var(--k-bg-raised); border: 2px solid var(--k-fg); }
	.swatch:focus-visible { outline: var(--k-focus-w) solid var(--k-focus); outline-offset: var(--k-focus-offset); }
	.swatch svg { width: 18px; height: 18px; }
	@keyframes k-drop { from { opacity: 0; transform: translateY(-4px); } }
</style>
