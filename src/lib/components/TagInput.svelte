<script lang="ts">
	import { tick } from 'svelte';
	import Field from './Field.svelte';
	import { anchorTo } from './anchor.js';

	interface Props {
		label?: string | undefined;
		hint?: string | undefined;
		error?: string | undefined;
		/** The tags. */
		value?: string[] | undefined;
		placeholder?: string | undefined;
		/** Form field name; one hidden input per tag (repeated name). */
		name?: string | undefined;
		/** At least one tag is needed. */
		required?: boolean | undefined;
		disabled?: boolean | undefined;
		/** Most tags allowed. */
		max?: number | undefined;
		/** Treat "Gel" and "gel" as different tags. Default: duplicates are found ignoring case. */
		caseSensitive?: boolean | undefined;
		/** Offered while typing (listbox autocomplete); free text stays allowed. */
		suggestions?: string[] | undefined;
		/** Turn leftover text into a tag when the field loses focus. */
		addOnBlur?: boolean | undefined;
		/** Accessible name of each remove button; `{tag}` is replaced. */
		removeLabel?: string | undefined;
		/** Screen-reader instructions for the text field. */
		instructions?: string | undefined;
		/** Announcements (polite live region); `{tag}` and `{max}` are replaced. */
		addedText?: string | undefined;
		removedText?: string | undefined;
		duplicateText?: string | undefined;
		maxText?: string | undefined;
		/** Accessible name of the tag list. */
		listLabel?: string | undefined;
		id?: string | undefined;
		/** Called with the new list after every add or remove. */
		onchange?: ((value: string[]) => void) | undefined;
		class?: string | undefined;
	}
	let {
		label,
		hint,
		error,
		value = $bindable(),
		placeholder,
		name,
		required = false,
		disabled = false,
		max,
		caseSensitive = false,
		suggestions = [],
		addOnBlur = true,
		removeLabel = 'Remove {tag}',
		instructions = 'Press Enter or comma to add a tag. Backspace in the empty field removes the last tag.',
		addedText = 'Added {tag}',
		removedText = 'Removed {tag}',
		duplicateText = '{tag} is already added',
		maxText = 'At most {max} tags',
		listLabel,
		id,
		onchange,
		class: cls = ''
	}: Props = $props();

	const uid = $props.id();
	const inputId = $derived(id ?? `${uid}-input`);
	const listId = `${uid}-list`;
	const helpId = `${uid}-help`;

	const tags = $derived(Array.isArray(value) ? value : []);
	const limit = $derived(typeof max === 'number' && max > 0 ? Math.floor(max) : Infinity);
	const full = $derived(tags.length >= limit);

	let text = $state('');
	let expanded = $state(false);
	let active = $state(-1);
	let message = $state('');
	let messageId = $state(0);
	let box: HTMLElement | undefined = $state();
	let popup: HTMLElement | undefined = $state();
	let list: HTMLElement | undefined = $state();
	let input: HTMLInputElement | undefined = $state();
	let tagList: HTMLElement | undefined = $state();

	function key(s: string): string {
		return caseSensitive ? s : s.toLocaleLowerCase();
	}
	/** Lower case, without diacritics, for matching suggestions. */
	function norm(s: string): string {
		return s.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase();
	}
	function has(t: string): boolean {
		const k = key(t);
		return tags.some((v) => key(v) === k);
	}
	function fill(template: string, tag: string): string {
		return template.replaceAll('{tag}', tag).replaceAll('{max}', String(limit));
	}
	function announce(msg: string) {
		message = msg;
		messageId++;
	}

	const filtered = $derived.by(() => {
		if (!suggestions.length) return [];
		const q = norm(text.trim());
		return [...new Set(suggestions)].filter((s) => !has(s) && (!q || norm(s).includes(q)));
	});
	const hasList = $derived(suggestions.length > 0);
	const open = $derived(expanded && filtered.length > 0);
	const activeId = $derived(open && active >= 0 && active < filtered.length ? `${uid}-opt-${active}` : undefined);

	$effect(() => {
		if (!open || !box || !popup) return;
		return anchorTo(box, popup, { matchWidth: true, gap: 4 });
	});
	$effect(() => {
		if (!activeId || !list) return;
		list.querySelector<HTMLElement>(`#${CSS.escape(activeId)}`)?.scrollIntoView({ block: 'nearest' });
	});

	/** Adds the given entries and announces the result; true when every non-empty entry was added. */
	function addAll(entries: string[]): boolean {
		const next = [...tags];
		const said: string[] = [];
		let addedAny = false;
		let rejected = false;
		for (const raw of entries) {
			const t = raw.trim();
			if (!t) continue;
			const k = key(t);
			if (next.some((v) => key(v) === k)) { said.push(fill(duplicateText, t)); rejected = true; continue; }
			if (next.length >= limit) { said.push(fill(maxText, t)); rejected = true; break; }
			next.push(t);
			said.push(fill(addedText, t));
			addedAny = true;
		}
		if (said.length) announce(said.join('. '));
		if (addedAny) {
			value = next;
			onchange?.(next);
		}
		return addedAny && !rejected;
	}
	function addText() {
		if (!text.trim()) return;
		if (addAll([text])) text = '';
		closeList();
	}
	async function removeAt(i: number, refocus: 'next' | 'prev' | 'none' = 'next') {
		const t = tags[i];
		if (t === undefined || disabled) return;
		const next = tags.filter((_, k) => k !== i);
		value = next;
		onchange?.(next);
		announce(fill(removedText, t));
		if (refocus === 'none') return;
		await tick();
		const buttons = removeButtons();
		const target = refocus === 'prev' ? buttons[i - 1] ?? buttons[0] : buttons[i];
		(target ?? input)?.focus();
	}
	function removeButtons(): HTMLButtonElement[] {
		return tagList ? Array.from(tagList.querySelectorAll<HTMLButtonElement>('button')) : [];
	}

	function openList(focus: 'none' | 'first' | 'last') {
		if (!hasList || disabled) return;
		expanded = true;
		active = focus === 'first' ? 0 : focus === 'last' ? filtered.length - 1 : -1;
	}
	function closeList() {
		expanded = false;
		active = -1;
	}
	function move(stepBy: 1 | -1) {
		const n = filtered.length;
		if (!n) return;
		active = active < 0 ? (stepBy === 1 ? 0 : n - 1) : (active + stepBy + n) % n;
	}
	function choose(s: string) {
		if (addAll([s])) text = '';
		closeList();
		input?.focus();
	}

	function onkeydown(e: KeyboardEvent) {
		const el = e.currentTarget as HTMLInputElement;
		switch (e.key) {
			case 'Enter':
				if (open && active >= 0) {
					e.preventDefault();
					choose(filtered[active]);
				} else if (text.trim()) {
					e.preventDefault();
					addText();
				}
				break;
			case ',':
				e.preventDefault();
				addText();
				break;
			case 'Backspace':
				if (!text && tags.length && el.selectionStart === 0 && el.selectionEnd === 0) {
					e.preventDefault();
					void removeAt(tags.length - 1, 'none');
				}
				break;
			case 'ArrowLeft':
				if (!open && tags.length && el.selectionStart === 0 && el.selectionEnd === 0) {
					e.preventDefault();
					removeButtons().at(-1)?.focus();
				}
				break;
			case 'ArrowDown':
				if (!hasList) break;
				e.preventDefault();
				if (!open) openList(e.altKey ? 'none' : 'first');
				else move(1);
				break;
			case 'ArrowUp':
				if (!hasList) break;
				e.preventDefault();
				if (!open) openList('last');
				else move(-1);
				break;
			case 'Escape':
				if (open) {
					e.preventDefault();
					e.stopPropagation();
					closeList();
				} else if (text) {
					e.preventDefault();
					text = '';
				}
				break;
		}
	}
	function onpaste(e: ClipboardEvent) {
		const pasted = e.clipboardData?.getData('text') ?? '';
		if (!/[,;\n\t]/.test(pasted)) return;
		e.preventDefault();
		const el = e.currentTarget as HTMLInputElement;
		const before = text.slice(0, el.selectionStart ?? text.length);
		const after = text.slice(el.selectionEnd ?? text.length);
		const parts = `${before}${pasted}${after}`.split(/[,;\n\t]+/);
		const ok = addAll(parts);
		text = ok ? '' : parts.filter((p) => p.trim() && !has(p.trim())).join(', ');
		closeList();
	}
	function oninput() {
		active = -1;
		if (hasList) expanded = true;
	}
	function onblur() {
		if (addOnBlur && text.trim()) addText();
		else closeList();
	}
	function onTagKey(e: KeyboardEvent, i: number) {
		const buttons = removeButtons();
		switch (e.key) {
			case 'ArrowLeft':
				e.preventDefault();
				buttons[i - 1]?.focus();
				break;
			case 'ArrowRight':
				e.preventDefault();
				(buttons[i + 1] ?? input)?.focus();
				break;
			case 'Home':
				e.preventDefault();
				buttons[0]?.focus();
				break;
			case 'End':
				e.preventDefault();
				input?.focus();
				break;
			case 'Backspace':
				e.preventDefault();
				void removeAt(i, 'prev');
				break;
			case 'Delete':
				e.preventDefault();
				void removeAt(i, 'next');
				break;
		}
	}

	// Pointer shortcuts: clicking the empty field area focuses the input; the list never takes focus.
	$effect(() => {
		const el = box;
		if (!el) return;
		const click = (e: MouseEvent) => { if (e.target === el || e.target === tagList) input?.focus(); };
		el.addEventListener('click', click);
		return () => el.removeEventListener('click', click);
	});
	$effect(() => {
		const el = popup;
		if (!el) return;
		const down = (e: MouseEvent) => e.preventDefault();
		const click = (e: MouseEvent) => {
			const opt = (e.target as Element).closest<HTMLElement>('[role="option"]');
			if (opt) choose(filtered[Number(opt.dataset.index)]);
		};
		const hover = (e: PointerEvent) => {
			const opt = (e.target as Element).closest<HTMLElement>('[role="option"]');
			if (opt) active = Number(opt.dataset.index);
		};
		el.addEventListener('mousedown', down);
		el.addEventListener('click', click);
		el.addEventListener('pointermove', hover);
		return () => {
			el.removeEventListener('mousedown', down);
			el.removeEventListener('click', click);
			el.removeEventListener('pointermove', hover);
		};
	});
</script>

<Field {label} {hint} {error} {required} for={inputId} class={cls}>
	{#snippet children({ describedby, invalid })}
		<div class="k-tags" class:invalid class:disabled bind:this={box}>
			{#if tags.length}
				<ul class="list" aria-label={listLabel ?? label} bind:this={tagList}>
					{#each tags as t, i (i)}
						<li class="tag">
							<span class="txt">{t}</span>
							<button
								type="button"
								class="x"
								aria-label={fill(removeLabel, t)}
								{disabled}
								onclick={() => removeAt(i)}
								onkeydown={(e) => onTagKey(e, i)}
							>
								<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="2" /></svg>
							</button>
						</li>
					{/each}
				</ul>
			{/if}
			<input
				bind:this={input}
				id={inputId}
				type="text"
				role={hasList ? 'combobox' : undefined}
				aria-autocomplete={hasList ? 'list' : undefined}
				aria-expanded={hasList ? open : undefined}
				aria-controls={hasList ? listId : undefined}
				aria-activedescendant={activeId}
				aria-invalid={invalid || undefined}
				aria-describedby={[describedby, helpId].filter(Boolean).join(' ')}
				bind:value={text}
				placeholder={full ? undefined : placeholder}
				required={required && tags.length === 0}
				{disabled}
				autocomplete="off"
				autocapitalize="off"
				spellcheck="false"
				enterkeyhint="enter"
				{onkeydown}
				{onpaste}
				{oninput}
				{onblur}
			/>
			{#if name}
				{#each tags as t, i (i)}<input type="hidden" {name} value={t} />{/each}
			{/if}
		</div>
		<span class="sr" id={helpId}>{instructions}</span>
		{#if hasList}
			<div class="popup" hidden={!open} bind:this={popup}>
				<ul class="options" role="listbox" id={listId} aria-label={label} bind:this={list}>
					{#if open}
						{#each filtered as s, i (s)}
							<li id="{uid}-opt-{i}" role="option" aria-selected={i === active} data-index={i} class:active={i === active}>{s}</li>
						{/each}
					{/if}
				</ul>
			</div>
		{/if}
		<span class="sr" role="status">{#key messageId}<span>{message}</span>{/key}</span>
	{/snippet}
</Field>

<style>
	.k-tags {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		/* Rows stay far enough apart that the remove buttons' hit areas do not reach the next row. */
		gap: max(var(--k-space-1), calc(var(--k-tap-target) - 32px)) var(--k-space-2);
		min-height: var(--k-control-h);
		padding: var(--k-space-1) var(--k-space-3);
		box-sizing: border-box;
		border: var(--k-border-w) solid var(--k-border);
		border-radius: var(--k-radius-field);
		background: var(--k-bg-raised);
		color: var(--k-fg);
		cursor: text;
		transition: border-color var(--k-dur) var(--k-ease);
	}
	.k-tags:hover { border-color: var(--k-fg-muted); }
	.k-tags:has(input:focus-visible) { outline: var(--k-focus-w) solid var(--k-focus); outline-offset: var(--k-focus-offset); border-color: var(--k-accent-mark); }
	.invalid { border-color: var(--k-danger); }
	.disabled { opacity: 0.55; cursor: not-allowed; }
	.list { display: flex; flex-wrap: wrap; gap: max(var(--k-space-1), calc(var(--k-tap-target) - 32px)) var(--k-space-1); min-width: 0; max-width: 100%; margin: 0; padding: 0; list-style: none; }
	.tag {
		display: inline-flex;
		align-items: center;
		gap: 2px;
		max-width: 100%;
		min-height: 32px;
		padding: 0 0 0 var(--k-space-3);
		box-sizing: border-box;
		border: var(--k-border-w) solid var(--k-border);
		border-radius: var(--k-radius-badge);
		background: var(--k-bg-sunken);
		color: var(--k-fg);
		font-family: var(--k-label-font);
		font-size: var(--k-text-sm);
		font-weight: var(--k-weight-label);
		text-transform: var(--k-label-transform);
		letter-spacing: var(--k-label-tracking);
		cursor: default;
	}
	.txt { min-width: 0; overflow-wrap: anywhere; }
	.x {
		position: relative;
		flex: none;
		display: grid;
		place-items: center;
		width: 30px;
		height: 30px;
		padding: 0;
		border: 0;
		border-radius: var(--k-radius-badge);
		background: transparent;
		color: var(--k-fg-muted);
		cursor: pointer;
	}
	/* The visible button is small; the hit area reaches 40px (the tap target where larger). */
	.x::after { content: ''; position: absolute; inset: min(-5px, calc((100% - var(--k-tap-target)) / 2)); }
	.x:hover:not(:disabled) { color: var(--k-fg); background: var(--k-bg-raised); }
	.x:focus-visible { outline: var(--k-focus-w) solid var(--k-focus); outline-offset: calc(var(--k-focus-w) * -1); color: var(--k-fg); }
	.x:disabled { cursor: not-allowed; }
	.x svg { width: 12px; height: 12px; }
	input {
		flex: 1 1 8rem;
		min-width: 6rem;
		min-height: max(36px, var(--k-tap-target));
		padding: 0 var(--k-space-1);
		border: 0;
		outline: 0;
		background: transparent;
		color: inherit;
		font: inherit;
		font-size: var(--k-text-md);
	}
	input::placeholder { color: var(--k-fg-muted); opacity: 1; }
	input:disabled { cursor: not-allowed; }
	.popup {
		position: fixed;
		z-index: 950;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		max-height: min(280px, var(--avail-h, 280px));
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
	.options { flex: 1 1 auto; min-height: 0; overflow-y: auto; margin: 0; padding: 0; list-style: none; overscroll-behavior: contain; }
	[role='option'] {
		display: flex;
		align-items: center;
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
	.sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
	@keyframes k-drop { from { opacity: 0; transform: translateY(-4px); } }
</style>
