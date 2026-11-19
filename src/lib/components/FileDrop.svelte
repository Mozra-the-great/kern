<script lang="ts">
	import { tick } from 'svelte';
	import Field from './Field.svelte';

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
		/** The chosen files. */
		files?: File[] | undefined;
		/** Called with the full list of chosen files after every change. */
		onfiles?: ((files: File[]) => void) | undefined;
		/** Form field name; the files are submitted with the form. */
		name?: string | undefined;
		disabled?: boolean | undefined;
		required?: boolean | undefined;
		id?: string | undefined;
		/** Text in the drop zone. */
		dropLabel?: string | undefined;
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
		files = $bindable(),
		onfiles,
		name,
		disabled = false,
		required = false,
		id,
		dropLabel,
		removeLabel = 'Remove',
		listLabel = 'Selected files',
		sizeError = '{name} is larger than {max}.',
		typeError = '{name} is not an accepted file type.',
		countError = 'Only one file can be selected.',
		statusLabel = 'Files selected: {count}',
		class: cls = ''
	}: Props = $props();
	const uid = $props.id();
	const zoneId = $derived(id ?? `${uid}-zone`);
	const promptId = $derived(`${uid}-prompt`);
	// `files` has no fallback, so binding `undefined` behaves like leaving the prop out.
	const fileList = $derived(files ?? []);
	const prompt = $derived(dropLabel ?? (multiple ? 'Drop files here or click to choose' : 'Drop a file here or click to choose'));

	let input: HTMLInputElement | undefined = $state();
	let zone: HTMLButtonElement | undefined = $state();
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

	function accepted(file: File): boolean {
		const tokens = (accept ?? '')
			.split(',')
			.map((t) => t.trim().toLowerCase())
			.filter(Boolean);
		if (!tokens.length) return true;
		const fileName = file.name.toLowerCase();
		const type = file.type.toLowerCase();
		return tokens.some((t) => (t.startsWith('.') ? fileName.endsWith(t) : t.endsWith('/*') ? type.startsWith(t.slice(0, -1)) : type === t));
	}

	const sameFile = (a: File, b: File): boolean => a.name === b.name && a.size === b.size && a.lastModified === b.lastModified;

	/** Mirrors `files` into the native input so the form submits them. */
	function syncInput() {
		if (!input || typeof DataTransfer === 'undefined') return;
		const dt = new DataTransfer();
		for (const f of fileList) dt.items.add(f);
		input.files = dt.files;
	}
	$effect(() => {
		void files;
		void input;
		syncInput();
	});

	function commit(next: File[]) {
		files = next;
		onfiles?.(next);
	}

	function add(list: File[]) {
		if (disabled || list.length === 0) return;
		const msgs: string[] = [];
		let ok: File[] = [];
		for (const f of list) {
			if (!accepted(f)) msgs.push(fill(typeError, { name: f.name }));
			else if (maxSize !== undefined && f.size > maxSize) msgs.push(fill(sizeError, { name: f.name, max: formatSize(maxSize) }));
			else ok.push(f);
		}
		if (!multiple && ok.length > 1) {
			msgs.push(countError);
			ok = ok.slice(0, 1);
		}
		problems = msgs;
		if (ok.length === 0) {
			status = msgs.join(' ');
			return;
		}
		const next = multiple ? [...fileList, ...ok.filter((f) => !fileList.some((g) => sameFile(f, g)))] : ok;
		status = msgs.length ? msgs.join(' ') : fill(statusLabel, { count: String(next.length) });
		commit(next);
	}

	function onpick() {
		add(Array.from(input?.files ?? []));
		// Cancelling the picker clears the native input in some browsers.
		syncInput();
	}

	async function remove(i: number) {
		problems = [];
		const next = fileList.filter((_, j) => j !== i);
		status = fill(statusLabel, { count: String(next.length) });
		commit(next);
		await tick();
		const buttons = listEl?.querySelectorAll<HTMLButtonElement>('button.rm');
		(buttons && buttons.length ? buttons[Math.min(i, buttons.length - 1)] : zone)?.focus();
	}

	function dragenter(e: DragEvent) {
		e.preventDefault();
		dragDepth++;
		if (!disabled) dragging = true;
	}
	function dragover(e: DragEvent) {
		e.preventDefault();
		if (e.dataTransfer) e.dataTransfer.dropEffect = disabled ? 'none' : 'copy';
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

<Field {label} {hint} error={shownError} {required} for={zoneId} class={cls}>
	{#snippet children({ describedby, invalid })}
		<div class="k-filedrop">
			<div class="drop" role="presentation" ondragenter={dragenter} ondragover={dragover} ondragleave={dragleave} ondrop={drop}>
				<button
					type="button"
					bind:this={zone}
					id={zoneId}
					class="zone"
					class:dragging
					class:invalid
					{disabled}
					aria-describedby={[label ? promptId : undefined, describedby].filter(Boolean).join(' ') || undefined}
					onclick={() => input?.click()}
				>
					<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
						<path d="M12 16V4M7 9l5-5 5 5M4 15v4h16v-4" fill="none" stroke="currentColor" stroke-width="2" />
					</svg>
					<span class="prompt" id={promptId}>{prompt}</span>
				</button>
				<input
					bind:this={input}
					type="file"
					class="native"
					{accept}
					{multiple}
					{name}
					{disabled}
					{required}
					tabindex="-1"
					aria-hidden="true"
					onchange={onpick}
				/>
			</div>
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
		min-height: 140px;
		padding: var(--k-space-6) var(--k-space-4);
		border: var(--k-border-w) dashed var(--k-line-dashed);
		border-radius: var(--k-radius-card);
		background: var(--k-bg-sunken);
		color: var(--k-fg);
		font: inherit;
		text-align: center;
		cursor: pointer;
		transition:
			background-color var(--k-dur) var(--k-ease),
			border-color var(--k-dur) var(--k-ease),
			box-shadow var(--k-dur) var(--k-ease);
	}
	.zone > * {
		pointer-events: none;
	}
	.zone:hover:not(:disabled) {
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
		box-shadow: inset 0 0 0 var(--k-border-w) var(--k-accent-mark);
	}
	.icon {
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
		font-family: var(--k-label-font);
		font-size: var(--k-label-size);
		font-weight: var(--k-weight-label);
		text-transform: var(--k-label-transform);
		letter-spacing: var(--k-label-tracking);
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
</style>
