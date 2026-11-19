<script lang="ts">
	import Field from './Field.svelte';
	import { anchorTo } from './anchor.js';

	export interface ComboboxOption {
		value: string;
		label: string;
		disabled?: boolean;
	}
	interface Props {
		label?: string;
		hint?: string;
		error?: string;
		/** Value of the selected option ('' = none). With `allowCustom`, any typed text. */
		value?: string;
		options: ComboboxOption[];
		placeholder?: string;
		/** Form field name; a hidden input carries `value`. */
		name?: string;
		required?: boolean;
		disabled?: boolean;
		/** Accept free text that matches no option. */
		allowCustom?: boolean;
		/** Shown when the filter matches nothing. */
		noResults?: string;
		/** Accessible name of the button that opens the list. */
		toggleLabel?: string;
		autocomplete?: HTMLInputElement['autocomplete'];
		id?: string;
		/** Called when the user commits a new value. */
		onchange?: (value: string) => void;
		class?: string;
	}
	let {
		label,
		hint,
		error,
		value = $bindable(''),
		options,
		placeholder,
		name,
		required = false,
		disabled = false,
		allowCustom = false,
		noResults = 'No results',
		toggleLabel = 'Show options',
		autocomplete = 'off',
		id,
		onchange,
		class: cls = ''
	}: Props = $props();

	const uid = $props.id();
	const inputId = $derived(id ?? `${uid}-input`);
	const listId = `${uid}-list`;

	let query = $state('');
	let expanded = $state(false);
	let filtering = $state(false);
	let active = $state(-1);
	let box: HTMLElement | undefined = $state();
	let popup: HTMLElement | undefined = $state();
	let list: HTMLElement | undefined = $state();
	let input: HTMLInputElement | undefined = $state();

	/** Lower case, without diacritics: "Café" matches "cafe". */
	function norm(s: string): string {
		return s.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase();
	}
	function labelFor(v: string): string {
		return options.find((o) => o.value === v)?.label ?? (allowCustom ? v : '');
	}

	const filtered = $derived.by(() => {
		const q = norm(query.trim());
		if (!filtering || !q) return options;
		return options.filter((o) => norm(o.label).includes(q));
	});
	const activeId = $derived(expanded && active >= 0 && active < filtered.length ? `${uid}-opt-${active}` : undefined);

	// Show the label of the current value whenever the value (or its label) changes from outside.
	let syncedKey: string | undefined;
	$effect.pre(() => {
		const key = `${value}\u0000${labelFor(value)}`;
		if (key === syncedKey) return;
		syncedKey = key;
		query = labelFor(value);
		filtering = false;
	});

	$effect(() => {
		if (!expanded || !box || !popup) return;
		return anchorTo(box, popup, { matchWidth: true, gap: 4 });
	});
	$effect(() => {
		if (!activeId || !list) return;
		list.querySelector<HTMLElement>(`#${CSS.escape(activeId)}`)?.scrollIntoView({ block: 'nearest' });
	});

	function setValue(v: string) {
		if (v === value) return;
		value = v;
		onchange?.(v);
	}
	function openList(focus: 'none' | 'first' | 'last' | 'selected' = 'none') {
		if (disabled) return;
		expanded = true;
		const enabled = filtered.map((o, i) => (o.disabled ? -1 : i)).filter((i) => i >= 0);
		if (focus === 'first') active = enabled[0] ?? -1;
		else if (focus === 'last') active = enabled[enabled.length - 1] ?? -1;
		else if (focus === 'selected') {
			const i = filtered.findIndex((o) => o.value === value && !o.disabled);
			active = i >= 0 ? i : (enabled[0] ?? -1);
		} else active = -1;
	}
	function closeList() {
		expanded = false;
		active = -1;
	}
	function choose(o: ComboboxOption) {
		if (o.disabled) return;
		setValue(o.value);
		query = o.label;
		filtering = false;
		closeList();
	}
	/** Turns the typed text into a value: exact label match, free text, or back to the last value. */
	function reconcile() {
		const text = query.trim();
		if (!text) setValue('');
		else {
			const hit = options.find((o) => !o.disabled && norm(o.label) === norm(text));
			if (hit) setValue(hit.value);
			else if (allowCustom) setValue(text);
		}
		query = labelFor(value);
		filtering = false;
		closeList();
	}
	function move(step: 1 | -1) {
		const n = filtered.length;
		if (!n) return;
		let i = active;
		for (let k = 0; k < n; k++) {
			i = i < 0 ? (step === 1 ? 0 : n - 1) : (i + step + n) % n;
			if (!filtered[i].disabled) { active = i; return; }
		}
	}
	function edge(which: 'first' | 'last') {
		const idx = filtered.map((o, i) => (o.disabled ? -1 : i)).filter((i) => i >= 0);
		active = (which === 'first' ? idx[0] : idx[idx.length - 1]) ?? -1;
	}

	function onkeydown(e: KeyboardEvent) {
		switch (e.key) {
			case 'ArrowDown':
				e.preventDefault();
				if (!expanded) openList(e.altKey ? 'none' : filtering ? 'first' : 'selected');
				else move(1);
				break;
			case 'ArrowUp':
				e.preventDefault();
				if (!expanded) openList('last');
				else move(-1);
				break;
			case 'Home':
			case 'End':
				// With an option focused, jump in the list; otherwise move the caret.
				if (expanded && active >= 0) {
					e.preventDefault();
					edge(e.key === 'Home' ? 'first' : 'last');
				}
				break;
			case 'Enter':
				if (expanded && active >= 0) {
					e.preventDefault();
					choose(filtered[active]);
				} else if (expanded || filtering) {
					e.preventDefault();
					reconcile();
				}
				break;
			case 'Escape':
				if (expanded) {
					e.preventDefault();
					e.stopPropagation();
					closeList();
				} else if (query) {
					e.preventDefault();
					query = '';
					filtering = false;
					setValue('');
				}
				break;
			case 'Tab':
				if (expanded && active >= 0) choose(filtered[active]);
				else if (expanded || filtering) reconcile();
				break;
			case 'ArrowLeft':
			case 'ArrowRight':
				active = -1;
				break;
		}
	}
	/** The option under a pointer or click event inside the list. */
	function optionAt(e: Event): ComboboxOption | undefined {
		const el = (e.target as Element).closest<HTMLElement>('[role="option"]');
		return el ? filtered[Number(el.dataset.index)] : undefined;
	}
	// Pointer shortcuts on the list. Keyboard users stay in the input (aria-activedescendant),
	// so the list itself never takes focus; mousedown is cancelled to keep focus in the input.
	$effect(() => {
		const el = popup;
		if (!el) return;
		const down = (e: MouseEvent) => e.preventDefault();
		const click = (e: MouseEvent) => { const o = optionAt(e); if (o) choose(o); };
		const hover = (e: PointerEvent) => { const o = optionAt(e); if (o && !o.disabled) active = filtered.indexOf(o); };
		el.addEventListener('mousedown', down);
		el.addEventListener('click', click);
		el.addEventListener('pointermove', hover);
		return () => {
			el.removeEventListener('mousedown', down);
			el.removeEventListener('click', click);
			el.removeEventListener('pointermove', hover);
		};
	});
	function oninput() {
		filtering = true;
		openList('none');
	}
	function onblur() {
		if (expanded || filtering) reconcile();
	}
	function toggle() {
		if (expanded) closeList();
		else {
			filtering = false;
			openList('selected');
		}
		input?.focus();
	}
</script>

<Field {label} {hint} {error} {required} for={inputId} class={cls}>
	{#snippet children({ describedby, invalid })}
		<div class="k-combobox" class:invalid class:disabled bind:this={box}>
			<input
				bind:this={input}
				id={inputId}
				type="text"
				role="combobox"
				aria-autocomplete="list"
				aria-expanded={expanded}
				aria-controls={listId}
				aria-activedescendant={activeId}
				aria-invalid={invalid || undefined}
				aria-describedby={describedby}
				bind:value={query}
				{placeholder}
				{required}
				{disabled}
				{autocomplete}
				autocapitalize="off"
				spellcheck="false"
				{oninput}
				{onkeydown}
				{onblur}
			/>
			<button
				type="button"
				class="toggle"
				tabindex="-1"
				aria-label={toggleLabel}
				aria-expanded={expanded}
				aria-controls={listId}
				{disabled}
				onmousedown={(e) => e.preventDefault()}
				onclick={toggle}
			>
				<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" stroke-width="2" /></svg>
			</button>
			{#if name}<input type="hidden" {name} {value} />{/if}
		</div>
		<div class="popup" hidden={!expanded} bind:this={popup}>
			<ul
				class="list"
				role="listbox"
				id={listId}
				aria-label={label}
				bind:this={list}
			>
				{#if expanded}
					{#each filtered as o, i (o.value)}
						<li
							id="{uid}-opt-{i}"
							role="option"
							aria-selected={i === active}
							aria-disabled={o.disabled || undefined}
							data-index={i}
							class:active={i === active}
						>
							<span>{o.label}</span>
							{#if o.value === value}
								<svg class="check" viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" stroke-width="2" /></svg>
							{/if}
						</li>
					{/each}
				{/if}
			</ul>
			{#if expanded && filtered.length === 0}<p class="empty" aria-hidden="true">{noResults}</p>{/if}
		</div>
		<span class="sr" role="status">{expanded && filtered.length === 0 ? noResults : ''}</span>
	{/snippet}
</Field>

<style>
	.k-combobox {
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
	.k-combobox:hover { border-color: var(--k-fg-muted); }
	.k-combobox:focus-within { outline: var(--k-focus-w) solid var(--k-focus); outline-offset: var(--k-focus-offset); border-color: var(--k-accent-mark); }
	.invalid { border-color: var(--k-danger); }
	.disabled { opacity: 0.55; }
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
	}
	input::placeholder { color: var(--k-fg-muted); opacity: 1; }
	input:disabled { cursor: not-allowed; }
	.toggle {
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
	.toggle::after { content: ''; position: absolute; inset: min(0px, calc((100% - var(--k-tap-target)) / 2)); }
	.toggle:hover:not(:disabled) { color: var(--k-fg); background: var(--k-bg-sunken); }
	.toggle:disabled { cursor: not-allowed; }
	.toggle svg { width: 16px; height: 16px; transition: transform var(--k-dur) var(--k-ease); }
	.toggle[aria-expanded='true'] svg { transform: rotate(180deg); }
	.popup {
		position: fixed;
		z-index: 950;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		max-height: min(320px, var(--avail-h, 320px));
		padding: var(--k-space-1);
		border: var(--k-border-w) solid var(--k-line-strong);
		border-radius: min(var(--k-radius-overlay), 16px);
		background: var(--k-bg-raised);
		color: var(--k-fg);
		box-shadow: var(--k-shadow-overlay);
		font-family: var(--k-font-sans);
		animation: k-drop var(--k-dur) var(--k-ease);
	}
	.popup[hidden] { display: none; }
	.list { flex: 1 1 auto; min-height: 0; overflow-y: auto; margin: 0; padding: 0; list-style: none; overscroll-behavior: contain; }
	[role='option'] {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--k-space-3);
		min-height: max(40px, var(--k-tap-target));
		padding: var(--k-space-2) var(--k-space-3);
		box-sizing: border-box;
		border-radius: min(var(--k-radius-control), 10px);
		font-size: var(--k-text-sm);
		cursor: pointer;
	}
	[role='option'].active {
		background: var(--k-selected);
		outline: var(--k-focus-w) solid var(--k-focus);
		outline-offset: calc(var(--k-focus-w) * -1);
	}
	[role='option'][aria-disabled='true'] { color: var(--k-fg-disabled); cursor: not-allowed; }
	.check { flex: none; width: 16px; height: 16px; color: var(--k-accent-text); }
	.empty { margin: 0; padding: var(--k-space-2) var(--k-space-3); color: var(--k-fg-muted); font-size: var(--k-text-sm); }
	.sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
	@keyframes k-drop { from { opacity: 0; transform: translateY(-4px); } }
</style>
