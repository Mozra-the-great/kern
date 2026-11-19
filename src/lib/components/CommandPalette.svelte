<script lang="ts">
	export interface Command {
		id: string;
		label: string;
		/** Heading the command is listed under. */
		group?: string;
		/** Extra search terms. */
		keywords?: string[];
		/** Shortcut hint shown on the right, e.g. "Ctrl+S". */
		shortcut?: string;
		onselect?: () => void;
	}
	interface Props {
		open?: boolean;
		commands: Command[];
		/** Accessible name of the dialog and the search field. */
		label?: string;
		placeholder?: string;
		/** Shown when nothing matches. */
		empty?: string;
		closeLabel?: string;
		/** Global shortcut that toggles the palette, e.g. "mod+k" (mod = Ctrl, or Cmd on Apple). Off by default. */
		hotkey?: string;
		/** Called after a command was chosen and the palette closed. */
		onselect?: (id: string) => void;
		onclose?: () => void;
	}
	let {
		open = $bindable(false),
		commands,
		label = 'Command palette',
		placeholder = 'Type a command or search…',
		empty = 'No matching commands',
		closeLabel = 'Close',
		hotkey,
		onselect,
		onclose
	}: Props = $props();

	const uid = $props.id();
	let dialog: HTMLDialogElement | undefined = $state();
	let input: HTMLInputElement | undefined = $state();
	let list: HTMLElement | undefined = $state();
	let query = $state('');
	let active = $state(0);

	function norm(s: string): string {
		return s.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase();
	}
	/** 3 = prefix, 2 = word start, 1 = substring, 0 = no match. */
	function tier(text: string, term: string): number {
		const t = norm(text);
		const at = t.indexOf(term);
		if (at < 0) return 0;
		if (at === 0) return 3;
		const words = t.split(/[^\p{L}\p{N}]+/u);
		return words.some((w) => w.startsWith(term)) ? 2 : 1;
	}
	/** Every term must match the label or a keyword; label hits rank above keyword hits. */
	function score(c: Command, terms: string[], whole: string): number {
		let total = 0;
		for (const term of terms) {
			const onLabel = tier(c.label, term) * 2;
			const onKeyword = Math.max(0, ...(c.keywords ?? []).map((k) => tier(k, term) * 2 - 1));
			const best = Math.max(onLabel, onKeyword);
			if (best <= 0) return 0;
			total += best;
		}
		if (terms.length > 1) total += tier(c.label, whole) * 2;
		return total;
	}

	interface Group {
		name: string;
		items: { cmd: Command; index: number }[];
	}
	const results = $derived.by(() => {
		const whole = norm(query.trim());
		const terms = whole.split(/\s+/).filter(Boolean);
		if (!terms.length) return commands;
		return commands
			.map((cmd, order) => ({ cmd, order, s: score(cmd, terms, whole) }))
			.filter((r) => r.s > 0)
			.sort((a, b) => b.s - a.s || a.order - b.order)
			.map((r) => r.cmd);
	});
	// Groups appear in the order of their best result; `index` is the position in navigation order.
	const groups = $derived.by(() => {
		const map = new Map<string, Command[]>();
		for (const c of results) {
			const key = c.group ?? '';
			if (!map.has(key)) map.set(key, []);
			map.get(key)?.push(c);
		}
		let index = 0;
		const out: Group[] = [];
		for (const [name, cmds] of map) out.push({ name, items: cmds.map((cmd) => ({ cmd, index: index++ })) });
		return out;
	});
	const flat = $derived(groups.flatMap((g) => g.items.map((i) => i.cmd)));
	const activeId = $derived(flat.length ? `${uid}-opt-${active}` : undefined);

	$effect(() => {
		if (!dialog) return;
		if (open && !dialog.open) {
			query = '';
			active = 0;
			dialog.showModal();
			input?.focus();
		} else if (!open && dialog.open) dialog.close();
	});
	$effect(() => {
		// New query: start again at the top.
		void query;
		active = 0;
	});
	$effect(() => {
		if (!activeId || !list) return;
		list.querySelector<HTMLElement>(`#${CSS.escape(activeId)}`)?.scrollIntoView({ block: 'nearest' });
	});

	// Global hotkey, e.g. "mod+k", "ctrl+shift+p".
	$effect(() => {
		if (!hotkey) return;
		const parts = hotkey.toLowerCase().split('+').map((p) => p.trim());
		const key = parts[parts.length - 1];
		const mods = new Set(parts.slice(0, -1));
		const onKey = (e: KeyboardEvent) => {
			const mod = e.ctrlKey || e.metaKey;
			if (mods.has('mod') ? !mod : e.ctrlKey !== mods.has('ctrl') || e.metaKey !== (mods.has('meta') || mods.has('cmd'))) return;
			if (e.shiftKey !== mods.has('shift') || e.altKey !== mods.has('alt')) return;
			if (e.key.toLowerCase() !== key) return;
			e.preventDefault();
			open = !open;
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	});

	function run(cmd: Command) {
		dialog?.close();
		cmd.onselect?.();
		onselect?.(cmd.id);
	}
	function onkeydown(e: KeyboardEvent) {
		const n = flat.length;
		if (e.key === 'ArrowDown') { e.preventDefault(); if (n) active = (active + 1) % n; }
		else if (e.key === 'ArrowUp') { e.preventDefault(); if (n) active = (active - 1 + n) % n; }
		else if ((e.key === 'Home' || e.key === 'End') && e.ctrlKey) { e.preventDefault(); if (n) active = e.key === 'Home' ? 0 : n - 1; }
		else if (e.key === 'PageDown') { e.preventDefault(); if (n) active = Math.min(n - 1, active + 8); }
		else if (e.key === 'PageUp') { e.preventDefault(); if (n) active = Math.max(0, active - 8); }
		else if (e.key === 'Enter') {
			e.preventDefault();
			const cmd = flat[active];
			if (cmd) run(cmd);
		}
	}
	/** Pointer shortcuts on the list; keyboard users stay in the search field. */
	$effect(() => {
		const el = list;
		if (!el) return;
		const at = (e: Event) => {
			const opt = (e.target as Element).closest<HTMLElement>('[role="option"]');
			return opt ? Number(opt.dataset.index) : -1;
		};
		const down = (e: MouseEvent) => e.preventDefault();
		const click = (e: MouseEvent) => { const i = at(e); if (i >= 0 && flat[i]) run(flat[i]); };
		const hover = (e: PointerEvent) => { const i = at(e); if (i >= 0) active = i; };
		el.addEventListener('mousedown', down);
		el.addEventListener('click', click);
		el.addEventListener('pointermove', hover);
		return () => {
			el.removeEventListener('mousedown', down);
			el.removeEventListener('click', click);
			el.removeEventListener('pointermove', hover);
		};
	});
	function onDialogClick(e: MouseEvent) {
		if (e.target === dialog) dialog?.close();
	}
</script>

<dialog
	bind:this={dialog}
	class="k-command-palette"
	aria-label={label}
	onclose={() => { open = false; onclose?.(); }}
	onclick={onDialogClick}
>
	<div class="search">
		<svg class="glass" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="9" cy="9" r="6" /><path d="M14 14l4 4" /></svg>
		<input
			bind:this={input}
			bind:value={query}
			type="text"
			role="combobox"
			aria-label={label}
			aria-expanded="true"
			aria-controls="{uid}-list"
			aria-autocomplete="list"
			aria-activedescendant={activeId}
			autocomplete="off"
			autocapitalize="off"
			spellcheck="false"
			enterkeyhint="go"
			{placeholder}
			{onkeydown}
		/>
		<button type="button" class="x" aria-label={closeLabel} onclick={() => dialog?.close()}>
			<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="2" /></svg>
		</button>
	</div>
	<div class="list" class:none={flat.length === 0} role="listbox" id="{uid}-list" aria-label={label} bind:this={list}>
		{#each groups as g (g.name)}
			<div role="group" aria-labelledby={g.name ? `${uid}-g-${g.items[0].index}` : undefined}>
				{#if g.name}<div class="group-label" id="{uid}-g-{g.items[0].index}" role="presentation">{g.name}</div>{/if}
				{#each g.items as { cmd, index } (cmd.id)}
					<div
						class="option"
						role="option"
						id="{uid}-opt-{index}"
						data-index={index}
						aria-selected={index === active}
						class:active={index === active}
					>
						<span>{cmd.label}</span>
						{#if cmd.shortcut}<kbd>{cmd.shortcut}</kbd>{/if}
					</div>
				{/each}
			</div>
		{/each}
	</div>
	{#if flat.length === 0}<p class="empty" aria-hidden="true">{empty}</p>{/if}
	<span class="sr" role="status">{flat.length === 0 && query.trim() ? empty : ''}</span>
</dialog>

<style>
	.k-command-palette {
		box-sizing: border-box;
		width: min(640px, calc(100vw - 16px));
		max-height: min(560px, calc(100dvh - 16px));
		margin: max(8px, 12vh) auto auto;
		padding: 0;
		overflow: hidden;
		flex-direction: column;
		border: var(--k-border-w) solid var(--k-line-strong);
		border-radius: var(--k-radius-overlay);
		background: var(--k-bg-raised);
		color: var(--k-fg);
		box-shadow: var(--k-shadow-overlay);
		font-family: var(--k-font-sans);
	}
	.k-command-palette[open] { display: flex; animation: k-pop var(--k-dur) var(--k-ease); }
	.k-command-palette::backdrop { background: var(--k-backdrop); }
	.search {
		flex: none;
		display: flex;
		align-items: center;
		gap: var(--k-space-2);
		padding: var(--k-space-2) var(--k-space-2) var(--k-space-2) var(--k-space-4);
		border-bottom: var(--k-border-w) solid var(--k-line);
	}
	.glass { flex: none; width: 18px; height: 18px; color: var(--k-fg-muted); }
	input {
		flex: 1;
		min-width: 0;
		min-height: var(--k-control-h);
		padding: 0;
		border: 0;
		outline: 0;
		background: transparent;
		color: inherit;
		font: inherit;
		font-size: var(--k-text-md);
	}
	input::placeholder { color: var(--k-fg-muted); opacity: 1; }
	.search:focus-within { box-shadow: inset 0 calc(var(--k-focus-w) * -1) 0 var(--k-focus); }
	.x { flex: none; display: grid; place-items: center; width: max(40px, var(--k-tap-target)); height: max(40px, var(--k-tap-target)); padding: 0; border: 0; border-radius: var(--k-radius-control); background: transparent; color: var(--k-fg-muted); cursor: pointer; }
	.x:hover { color: var(--k-fg); background: var(--k-bg-sunken); }
	.x:focus-visible { outline: var(--k-focus-w) solid var(--k-focus); outline-offset: 0; }
	.x svg { width: 16px; height: 16px; }
	.list { flex: 1 1 auto; min-height: 0; overflow-y: auto; padding: var(--k-space-1); overscroll-behavior: contain; }
	.list.none { display: none; }
	.group-label { padding: var(--k-space-3) var(--k-space-3) var(--k-space-1); font-family: var(--k-label-font); font-size: var(--k-text-xs); color: var(--k-fg-muted); text-transform: var(--k-label-transform); letter-spacing: var(--k-label-tracking); }
	.option {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--k-space-4);
		min-height: max(40px, var(--k-tap-target));
		padding: var(--k-space-2) var(--k-space-3);
		box-sizing: border-box;
		border-radius: min(var(--k-radius-control), 10px);
		font-size: var(--k-text-sm);
		cursor: pointer;
	}
	.option.active { background: var(--k-selected); outline: var(--k-focus-w) solid var(--k-focus); outline-offset: calc(var(--k-focus-w) * -1); }
	kbd { flex: none; font-family: var(--k-font-mono); font-size: var(--k-text-xs); color: var(--k-fg-muted); }
	.empty { margin: 0; padding: var(--k-space-6) var(--k-space-4); color: var(--k-fg-muted); font-size: var(--k-text-sm); text-align: center; }
	.sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
	@keyframes k-pop { from { opacity: 0; transform: translateY(8px) scale(0.98); } }
</style>
