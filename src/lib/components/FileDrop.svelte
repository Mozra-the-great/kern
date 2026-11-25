<script lang="ts">
	import { strings } from './strings.svelte.js';
	import { tick } from 'svelte';
	import Field from './Field.svelte';
	import Button from './Button.svelte';
	import { matchesAccept } from './accept.js';
	import { joinIds } from './data-utils.js';

	interface Props {
		label?: string | undefined;
		hint?: string | undefined;
		/** Error text from outside, e.g. a failed upload. Rejected files add their own message. */
		error?: string | undefined;
		/** Same syntax as `<input accept>`: `.pdf`, `image/*`, `image/png`. Also enforced for dropped files. */
		accept?: string | undefined;
		multiple?: boolean | undefined;
		/** Largest allowed file in bytes. */
		maxSize?: number | undefined;
		/**
		 * `field` (default): a form field that keeps the chosen files in a list (remove buttons, `files`,
		 * form value) and adds new ones to it. `dispatch`: hands every pick or drop to `onfiles` and
		 * forgets it (no list, `files` stays empty, no form value, the same file can be picked again),
		 * for tools that process files at once.
		 */
		mode?: 'field' | 'dispatch' | undefined;
		/** The chosen files (`field` mode). */
		files?: File[] | undefined;
		/** `field`: the full list of chosen files after every change. `dispatch`: the files of this pick or drop. */
		onfiles?: ((files: File[]) => void) | undefined;
		/**
		 * Called with the refused files of a pick or drop: type not in `accept`, larger than `maxSize`, or
		 * more than one without `multiple` (all but the first).
		 */
		onreject?: ((files: File[]) => void) | undefined;
		/**
		 * Show and announce a message for refused files (`typeError`, `sizeError`, `countError`). Turn off
		 * when the host reports them itself from `onreject`.
		 */
		rejectMessages?: boolean | undefined;
		/** Form field name; the files are submitted with the form (`field` mode). */
		name?: string | undefined;
		disabled?: boolean | undefined;
		required?: boolean | undefined;
		id?: string | undefined;
		/** Text in the drop zone. */
		dropLabel?: string | undefined;
		/**
		 * Label of a separate button that opens the file picker. Without it the whole zone is the button;
		 * with it the zone is a group (named by `label` and the drop text) that holds this button.
		 */
		buttonLabel?: string | undefined;
		/** Prefix of the remove buttons' accessible names: "Remove report.pdf". */
		removeLabel?: string | undefined;
		/** Accessible name of the list of chosen files. */
		listLabel?: string | undefined;
		/** Message for a file that is too large. `{name}` and `{max}` are replaced. */
		sizeError?: string | undefined;
		/** Message for a file of a type that is not accepted. `{name}` is replaced. */
		typeError?: string | undefined;
		/** Message when several files were offered but only one is allowed. */
		countError?: string | undefined;
		/** Announced after a change. `{count}` is replaced. */
		statusLabel?: string | undefined;
		class?: string | undefined;
	}
	let {
		label,
		hint,
		error,
		accept,
		multiple = false,
		maxSize,
		mode = 'field',
		files = $bindable(),
		onfiles,
		onreject,
		rejectMessages = true,
		name,
		disabled = false,
		required = false,
		id,
		dropLabel,
		buttonLabel,
		removeLabel: removeLabelProp,
		listLabel: listLabelProp,
		sizeError: sizeErrorProp,
		typeError: typeErrorProp,
		countError: countErrorProp,
		statusLabel: statusLabelProp,
		class: cls = ''
	}: Props = $props();
	const removeLabel = $derived(removeLabelProp ?? strings().fileDrop.removeLabel);
	const listLabel = $derived(listLabelProp ?? strings().fileDrop.listLabel);
	const sizeError = $derived(sizeErrorProp ?? strings().fileDrop.sizeError);
	const typeError = $derived(typeErrorProp ?? strings().fileDrop.typeError);
	const countError = $derived(countErrorProp ?? strings().fileDrop.countError);
	const statusLabel = $derived(statusLabelProp ?? strings().fileDrop.statusLabel);
	const uid = $props.id();
	const zoneId = $derived(id ?? `${uid}-zone`);
	const promptId = `${uid}-prompt`;
	const labelId = `${uid}-label`;
	const dispatch = $derived(mode === 'dispatch');
	// `files` has no fallback, so binding `undefined` behaves like leaving the prop out.
	const fileList = $derived(dispatch ? [] : (files ?? []));
	const prompt = $derived(
		dropLabel ??
			(buttonLabel
				? multiple
					? strings().fileDrop.dropMany
					: strings().fileDrop.dropOne
				: multiple
					? strings().fileDrop.dropManyOrChoose
					: strings().fileDrop.dropOneOrChoose)
	);

	let input: HTMLInputElement | undefined = $state();
	let wrap: HTMLDivElement | undefined = $state();
	let listEl: HTMLUListElement | undefined = $state();
	let dragging = $state(false);
	let dragDepth = 0;
	let problems = $state<string[]>([]);
	let status = $state('');
	const shownError = $derived(error || problems.join(' ') || undefined);

	const fill = (tpl: string, vars: Record<string, string>): string => tpl.replace(/\{(\w+)\}/g, (m, k: string) => vars[k] ?? m);

	function formatSize(bytes: number): string {
		const units = ['B', 'KB', 'MB', 'GB'];
		let v = bytes;
		let u = 0;
		while (v >= 1024 && u < units.length - 1) {
			v /= 1024;
			u++;
		}
		return `${u === 0 || v >= 10 ? Math.round(v) : v.toFixed(1)} ${units[u]}`;
	}

	const sameFile = (a: File, b: File): boolean => a.name === b.name && a.size === b.size && a.lastModified === b.lastModified;

	/** The control that opens the picker: the zone, or the separate button. */
	const pickControl = (): HTMLButtonElement | null => wrap?.querySelector<HTMLButtonElement>('[data-pick]') ?? null;

	/** Mirrors `files` into the native input so the form submits them. */
	function syncInput() {
		if (!input || typeof DataTransfer === 'undefined') return;
		const dt = new DataTransfer();
		for (const f of fileList) dt.items.add(f);
		input.files = dt.files;
	}
	$effect(() => {
		void fileList;
		void input;
		syncInput();
	});

	function commit(next: File[]) {
		files = next;
		onfiles?.(next);
	}

	/** Looks at name, type and size only; the content of a file is never read. */
	function add(list: File[]) {
		if (disabled || list.length === 0) return;
		const msgs: string[] = [];
		const refused: File[] = [];
		let ok: File[] = [];
		for (const f of list) {
			if (!matchesAccept(f, accept)) {
				refused.push(f);
				msgs.push(fill(typeError, { name: f.name }));
			} else if (maxSize !== undefined && f.size > maxSize) {
				refused.push(f);
				msgs.push(fill(sizeError, { name: f.name, max: formatSize(maxSize) }));
			} else ok.push(f);
		}
		if (!multiple && ok.length > 1) {
			refused.push(...ok.slice(1));
			msgs.push(countError);
			ok = ok.slice(0, 1);
		}
		// Without rejectMessages the host reports refused files (from onreject).
		const own = rejectMessages ? msgs : [];
		problems = own;
		// Like stuffcloud's dropzone: the refused files are reported first, then the accepted ones.
		if (refused.length) onreject?.(refused);
		if (ok.length === 0) {
			status = own.join(' ');
		} else if (dispatch) {
			status = [fill(statusLabel, { count: String(ok.length) }), ...own].join(' ');
			onfiles?.(ok);
		} else {
			const next = multiple ? [...fileList, ...ok.filter((f) => !fileList.some((g) => sameFile(f, g)))] : ok;
			status = own.length ? own.join(' ') : fill(statusLabel, { count: String(next.length) });
			commit(next);
		}
	}

	function onpick() {
		add(Array.from(input?.files ?? []));
		// Cancelling the picker clears the native input in some browsers. In dispatch mode this empties
		// it, so picking the same file again fires again.
		syncInput();
	}

	/**
	 * Clears the chosen files, the messages and the native input, e.g. after the files were uploaded.
	 * Does not call `onfiles`: that reports user input only.
	 */
	export function reset(): void {
		files = [];
		problems = [];
		status = '';
		dragDepth = 0;
		dragging = false;
		if (input) input.value = '';
	}

	async function remove(i: number) {
		problems = [];
		const next = fileList.filter((_, j) => j !== i);
		status = fill(statusLabel, { count: String(next.length) });
		commit(next);
		await tick();
		const buttons = listEl?.querySelectorAll<HTMLButtonElement>('button.rm');
		(buttons && buttons.length ? buttons[Math.min(i, buttons.length - 1)] : pickControl())?.focus();
	}

	function dragenter(e: DragEvent) {
		e.preventDefault();
		dragDepth++;
		if (!disabled) dragging = true;
	}
	function dragover(e: DragEvent) {
		e.preventDefault();
		if (e.dataTransfer) e.dataTransfer.dropEffect = disabled ? 'none' : 'copy';
		if (!disabled) dragging = true;
	}
	function dragleave() {
		dragDepth = Math.max(0, dragDepth - 1);
		if (dragDepth === 0) dragging = false;
	}
	function drop(e: DragEvent) {
		e.preventDefault();
		dragDepth = 0;
		dragging = false;
		add(Array.from(e.dataTransfer?.files ?? []));
	}
</script>

<Field
	{label}
	{hint}
	error={shownError}
	announce={!!error}
	{required}
	for={buttonLabel ? undefined : zoneId}
	labelId={buttonLabel && label ? labelId : undefined}
	class={cls}
>
	{#snippet children({ describedby, invalid })}
		<div class="k-filedrop" data-mode={mode} bind:this={wrap}>
			{#if buttonLabel}
				<div
					class="drop zone split"
					class:dragging
					class:invalid
					class:disabled
					role="group"
					aria-labelledby={joinIds(label ? labelId : undefined, promptId)}
					ondragenter={dragenter}
					ondragover={dragover}
					ondragleave={dragleave}
					ondrop={drop}
				>
					<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
						<path d="M12 16V4M7 9l5-5 5 5M4 15v4h16v-4" fill="none" stroke="currentColor" stroke-width="2" />
					</svg>
					<span class="prompt" id={promptId}>{prompt}</span>
					<Button
						id={zoneId}
						variant="secondary"
						size="sm"
						data-pick=""
						{disabled}
						aria-describedby={describedby}
						onclick={() => input?.click()}
					>
						{buttonLabel}
					</Button>
					{@render native()}
				</div>
			{:else}
				<div class="drop" role="presentation" ondragenter={dragenter} ondragover={dragover} ondragleave={dragleave} ondrop={drop}>
					<button
						type="button"
						id={zoneId}
						class="zone"
						class:dragging
						class:invalid
						data-pick=""
						{disabled}
						aria-describedby={joinIds(label ? promptId : undefined, describedby)}
						onclick={() => input?.click()}
					>
						<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
							<path d="M12 16V4M7 9l5-5 5 5M4 15v4h16v-4" fill="none" stroke="currentColor" stroke-width="2" />
						</svg>
						<span class="prompt" id={promptId}>{prompt}</span>
					</button>
					{@render native()}
				</div>
			{/if}
			{#if fileList.length}
				<ul class="files" aria-label={listLabel} bind:this={listEl}>
					{#each fileList as f, i (i)}
						<li>
							<span class="fname">{f.name}</span>
							<span class="fsize">{formatSize(f.size)}</span>
							<button type="button" class="rm" {disabled} aria-label="{removeLabel} {f.name}" onclick={() => remove(i)}>
								<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="2" /></svg>
							</button>
						</li>
					{/each}
				</ul>
			{/if}
			<div class="sr" role="status">{status}</div>
		</div>
	{/snippet}
</Field>

{#snippet native()}
	<input
		bind:this={input}
		type="file"
		class="native"
		{accept}
		{multiple}
		name={dispatch ? undefined : name}
		{disabled}
		required={!dispatch && required}
		tabindex="-1"
		aria-hidden="true"
		onchange={onpick}
	/>
{/snippet}

<style>
	.k-filedrop {
		position: relative;
		display: grid;
		gap: var(--k-space-3);
		min-width: 0;
	}
	.drop {
		position: relative;
	}
	.zone {
		display: grid;
		justify-items: center;
		align-content: center;
		gap: var(--k-space-2);
		width: 100%;
		box-sizing: border-box;
		min-height: 140px;
		padding: var(--k-filedrop-pad);
		border: var(--k-border-w) dashed var(--k-line-dashed);
		border-radius: var(--k-radius-card);
		background: var(--k-filedrop-bg);
		color: var(--k-fg);
		font: inherit;
		text-align: center;
		cursor: pointer;
		transition:
			background-color var(--k-dur) var(--k-ease),
			border-color var(--k-dur) var(--k-ease),
			box-shadow var(--k-dur) var(--k-ease);
	}
	button.zone > * {
		pointer-events: none;
	}
	button.zone:hover:not(:disabled) {
		border-color: var(--k-fg);
	}
	.zone:focus-visible {
		outline: var(--k-focus-w) solid var(--k-focus);
		outline-offset: var(--k-focus-offset);
	}
	.zone:disabled {
		opacity: 0.55;
		cursor: not-allowed;
	}
	.zone.invalid {
		border-color: var(--k-danger);
	}
	/* dragging: solid line and inset ring on top of the colour change */
	.zone.dragging {
		border-style: solid;
		border-color: var(--k-accent-mark);
		background: var(--k-surface-selected);
		box-shadow: inset 0 0 0 var(--k-filedrop-drag-ring) var(--k-accent-mark);
	}
	/* Separate picker button: the zone is a group with the drop text and the button. */
	.split {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: var(--k-filedrop-split-gap);
		min-height: 0;
		text-align: start;
		cursor: default;
	}
	.split .icon {
		flex: none;
	}
	.split .prompt {
		flex: 1 1 var(--k-filedrop-prompt-basis);
	}
	.split.disabled {
		opacity: 0.55;
	}
	.icon {
		display: var(--k-filedrop-icon);
		width: 28px;
		height: 28px;
		color: var(--k-fg-hint);
		transition: transform var(--k-dur) var(--k-ease);
	}
	.dragging .icon {
		transform: translateY(-4px);
		color: var(--k-accent-text);
	}
	.prompt {
		font-family: var(--k-filedrop-prompt-font);
		font-size: var(--k-filedrop-prompt-size);
		font-weight: var(--k-filedrop-prompt-weight);
		text-transform: var(--k-filedrop-prompt-transform);
		letter-spacing: var(--k-filedrop-prompt-tracking);
		overflow-wrap: anywhere;
	}
	/* The real input is invisible and stays under the zone, so native validation bubbles point at it. */
	.native {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		opacity: 0;
		pointer-events: none;
	}

	.files {
		display: grid;
		gap: var(--k-space-2);
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.files li {
		display: flex;
		align-items: center;
		gap: var(--k-space-3);
		min-width: 0;
		padding: var(--k-space-1) var(--k-space-1) var(--k-space-1) var(--k-space-3);
		border: var(--k-border-w) solid var(--k-line);
		border-radius: var(--k-radius-field);
		background: var(--k-bg-raised);
	}
	.fname {
		flex: 1;
		min-width: 0;
		overflow-wrap: anywhere;
		font-size: var(--k-text-sm);
	}
	.fsize {
		flex: none;
		font-family: var(--k-font-mono);
		font-size: var(--k-text-xs);
		color: var(--k-fg-muted);
	}
	.rm {
		display: grid;
		place-items: center;
		flex: none;
		width: 40px;
		height: 40px;
		padding: 0;
		border: var(--k-border-w) solid transparent;
		border-radius: var(--k-radius-control);
		background: transparent;
		color: var(--k-fg);
		cursor: pointer;
	}
	.rm svg {
		width: 16px;
		height: 16px;
	}
	.rm:hover:not(:disabled) {
		background: var(--k-bg-sunken);
	}
	.rm:focus-visible {
		outline: var(--k-focus-w) solid var(--k-focus);
		outline-offset: var(--k-focus-offset);
	}
	.rm:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.sr {
		position: absolute;
		width: 1px;
		height: 1px;
		margin: -1px;
		padding: 0;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
		border: 0;
	}
	@media (forced-colors: active) {
		.zone {
			border-color: CanvasText;
		}
		/* Dragging: a solid, heavier Highlight edge (the tint and the inset ring are dropped). */
		.zone.dragging {
			border-width: 3px;
			border-color: Highlight;
		}
		.zone.invalid {
			border-style: double;
			border-width: 3px;
		}
		.zone:disabled,
		.split.disabled {
			opacity: 1;
			border-color: GrayText;
			color: GrayText;
		}
		.icon,
		.dragging .icon {
			color: CanvasText;
		}
		.zone:disabled .icon,
		.split.disabled .icon {
			color: GrayText;
		}
		.rm {
			border-color: ButtonText;
			color: ButtonText;
		}
		.rm:disabled {
			opacity: 1;
			border-color: GrayText;
			color: GrayText;
		}
	}
</style>
