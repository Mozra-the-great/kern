<script lang="ts" module>
	export type DownloadStatus = 'idle' | 'busy' | 'started' | 'error';
	/** What a `getContent` function returns: the file's text or its bytes, directly or as a promise. */
	export type DownloadContent = string | Blob;
</script>

<script lang="ts">
	import Button from './Button.svelte';
	import StatusMessage from './StatusMessage.svelte';
	import { isBlob, saveBlob, saveText, type DownloadError, type DownloadOk, type DownloadResult } from './download.js';
	import { strings } from './strings.svelte.js';
	import { tick } from 'svelte';

	interface Props {
		/** Text to save (UTF-8). Used when neither `getContent` nor `blob` is set. */
		text?: string | undefined;
		/** Bytes to save. Wins over `text`. A `File` works too. */
		blob?: Blob | undefined;
		/**
		 * Makes the content at click time: a string or a `Blob`, directly or as a promise. Wins over `blob` and
		 * `text`. While a promise is pending the button shows a spinner and ignores clicks. A function that throws
		 * or rejects, or returns something else, shows `errorLabel` and calls `onerror` with code `content`.
		 */
		getContent?: (() => DownloadContent | Promise<DownloadContent>) | undefined;
		/** File name, e.g. `report.csv`. Cleaned before use (no path, control or direction characters). Default: the catalogue's `fallbackName`. */
		name?: string | undefined;
		/**
		 * MIME type. For text it defaults to `text/plain` (`;charset=utf-8` is added). For a `Blob` it replaces the
		 * blob's own type when set.
		 */
		type?: string | undefined;
		/**
		 * Name of the button, e.g. "Download report". Icon-only by default (it is the `aria-label` and the tooltip); with
		 * `showLabel` it is the visible text and, without `accessibleLabel`, also the accessible name.
		 */
		label?: string | undefined;
		/** Show `label` as text next to the icon instead of an icon-only button. */
		showLabel?: boolean | undefined;
		/**
		 * Accessible name when it should say more than `label`, e.g. `label` "Download" and `accessibleLabel` "Download report.csv"
		 * in a list of files. It is the button's `aria-label`, with and without `showLabel` (icon-only: also the tooltip), and
		 * wins over `label` as the name; `label` stays the visible text. WCAG 2.5.3 (Label in Name): with `showLabel` it must
		 * contain the visible `label`, ideally at the start, so voice control ("click Download") still finds the button.
		 * Empty, whitespace-only or `null` (an untyped caller, a removed element attribute) counts as not set. The status texts (`startedLabel`, `errorLabel`) are not affected.
		 */
		accessibleLabel?: string | undefined;
		/**
		 * Spoken when the download was handed to the browser, in a polite live region. It is set fresh on every
		 * click and stays until the next click.
		 */
		startedLabel?: string | undefined;
		/** Shown and announced (assertive) when the content could not be produced or the browser refused. */
		errorLabel?: string | undefined;
		/** Show the spoken text as a visible line under the button. Errors are always visible. */
		showStatus?: boolean | undefined;
		/** Default `ghost` for the icon-only button and `secondary` with a visible label. */
		variant?: 'primary' | 'secondary' | 'ghost' | 'accent' | 'danger' | undefined;
		/** Height of the button with a visible label; the icon-only button is the theme's icon-button size. */
		size?: 'sm' | 'md' | 'lg' | undefined;
		/** Milliseconds the check or cross icon stays before it resets. The message stays. */
		resetAfter?: number | undefined;
		disabled?: boolean | undefined;
		/** Called after the download was handed to the browser (the file name actually used, size and type). */
		ondownload?: ((result: DownloadOk) => void) | undefined;
		/** Called when there was nothing to save or the browser refused; `error.code` says which. */
		onerror?: ((error: DownloadError) => void) | undefined;
		class?: string | undefined;
	}
	let {
		text,
		blob,
		getContent,
		name,
		type,
		label: labelProp,
		showLabel = false,
		accessibleLabel,
		startedLabel: startedLabelProp,
		errorLabel: errorLabelProp,
		showStatus = false,
		variant: variantProp,
		size = 'md',
		resetAfter = 2000,
		disabled = false,
		ondownload,
		onerror,
		class: cls = ''
	}: Props = $props();
	const label = $derived(labelProp ?? strings().downloadButton.label);
	/** `accessibleLabel` when it has text; whitespace only counts as not set. */
	const customName = $derived(typeof accessibleLabel === 'string' && accessibleLabel.trim() !== '' ? accessibleLabel : undefined);
	/** The accessible name: `accessibleLabel`, else `label`. */
	const accessibleName = $derived(customName ?? label);
	const startedLabel = $derived(startedLabelProp ?? strings().downloadButton.startedLabel);
	const errorLabel = $derived(errorLabelProp ?? strings().downloadButton.errorLabel);
	const fallbackName = $derived(strings().downloadButton.fallbackName);
	const variant = $derived(variantProp ?? (showLabel ? 'secondary' : 'ghost'));

	let status = $state<DownloadStatus>('idle');
	let host: HTMLSpanElement | undefined = $state();
	let timer: ReturnType<typeof setTimeout> | undefined;
	let gone = false;
	$effect(() => {
		gone = false;
		return () => {
			gone = true;
			clearTimeout(timer);
		};
	});

	/** The two live messages: emptied when a click starts, one of them filled with that click's result, kept until the next click. */
	let started = $state('');
	let problem = $state('');
	/** Counts clicks, so a slow earlier one cannot overwrite the result of a later one. */
	let run = 0;

	/** Resets the icon (not the messages) after `resetAfter`. */
	function settle(next: 'started' | 'error'): void {
		status = next;
		clearTimeout(timer);
		timer = setTimeout(() => (status = 'idle'), Math.max(0, resetAfter));
	}

	/**
	 * Shows the result of click `id`. The regions were emptied when the click started; the text is set after the
	 * empty state has been rendered and a short pause, so screen readers see a change even when the result is the
	 * same as last time.
	 */
	function report(id: number, next: 'started' | 'error'): void {
		settle(next);
		void tick()
			.then(() => new Promise((resolve) => setTimeout(resolve, 50)))
			.then(() => {
				if (id !== run || gone) return;
				if (next === 'started') started = startedLabel;
				else problem = errorLabel;
			});
	}

	function contentError(message: string, cause?: unknown): DownloadError {
		return cause === undefined ? { code: 'content', message } : { code: 'content', message, cause };
	}

	/** Saves what the producer made. */
	function save(content: unknown): DownloadResult | DownloadError {
		const options = { fallbackName };
		if (typeof content === 'string') return saveText(name ?? '', content, type, options);
		if (isBlob(content)) {
			return saveBlob(name ?? '', type !== undefined && type !== '' ? content.slice(0, content.size, type) : content, options);
		}
		if (content === undefined) return contentError('Nothing to download: set `text`, `blob` or `getContent`.');
		return contentError('`getContent` must return a string or a Blob.');
	}

	async function download(): Promise<void> {
		if (status === 'busy') return;
		const id = ++run;
		started = '';
		problem = '';
		const refocus = host !== undefined && isFocusInside(host);
		let content: unknown;
		try {
			content = typeof getContent === 'function' ? getContent() : (blob ?? text);
			if (isPromise(content)) {
				// A reset timer from the previous click must not end this busy state early.
				clearTimeout(timer);
				status = 'busy';
				content = await content;
			}
		} catch (error) {
			finish(id, contentError(error instanceof Error ? error.message : String(error), error), refocus);
			return;
		}
		finish(id, save(content), refocus);
	}

	function finish(id: number, outcome: DownloadResult | DownloadError, refocus: boolean): void {
		if (gone) return;
		const result: DownloadResult = 'ok' in outcome ? outcome : { ok: false, error: outcome };
		// A button that was disabled while the content was made loses the focus; give it back.
		const restoreFocus = refocus && status === 'busy';
		if (id === run) report(id, result.ok ? 'started' : 'error');
		if (restoreFocus) void tick().then(() => host?.querySelector('button')?.focus({ preventScroll: true }));
		if (result.ok) ondownload?.(result);
		else onerror?.(result.error);
	}

	function isPromise(value: unknown): value is PromiseLike<unknown> {
		return typeof value === 'object' && value !== null && typeof (value as { then?: unknown }).then === 'function';
	}

	/** True when focus is on something inside `root` (also inside a shadow root). */
	function isFocusInside(root: HTMLElement): boolean {
		const scope = root.getRootNode();
		const active = 'activeElement' in scope ? (scope as Document | ShadowRoot).activeElement : null;
		return active !== null && root.contains(active);
	}
</script>

<div bind:this={host} class="k-download-button {cls}" data-status={status} data-variant={variant}>
	<Button
		{variant}
		size={showLabel ? size : 'icon'}
		{disabled}
		loading={status === 'busy'}
		aria-label={showLabel && customName === undefined ? undefined : accessibleName}
		title={showLabel ? undefined : accessibleName}
		onclick={download}
	>
		{#if status !== 'busy'}
			<svg viewBox="0 0 20 20" aria-hidden="true">
				{#if status === 'started'}
					<path d="M4 10.5l4 4 8-9" />
				{:else if status === 'error'}
					<path d="M5 5l10 10M15 5L5 15" />
				{:else}
					<path d="M10 3v10M5.5 8.5L10 13l4.5-4.5M3 17h14" />
				{/if}
			</svg>
		{/if}
		{#if showLabel}<span class="text">{label}</span>{/if}
	</Button>
	<div class="line" class:sr={!showStatus} class:has={showStatus && started !== ''}>
		<StatusMessage message={started} reserve={false} />
	</div>
	<div class="line" class:has={problem !== ''}>
		<StatusMessage message={problem} kind="alert" reserve={false} />
	</div>
</div>

<style>
	.k-download-button {
		position: relative;
		display: inline-flex;
		flex-direction: column;
		align-items: flex-start;
		flex: none;
		max-width: 100%;
	}
	svg {
		flex: none;
		width: 20px;
		height: 20px;
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
		stroke-linecap: square;
		stroke-linejoin: miter;
	}
	/* The result colours the icon only where the button has no filled background that would hide it. */
	[data-variant='ghost'][data-status='started'] svg,
	[data-variant='secondary'][data-status='started'] svg {
		color: var(--k-ok);
	}
	[data-variant='ghost'][data-status='error'] svg,
	[data-variant='secondary'][data-status='error'] svg {
		color: var(--k-danger);
	}
	.line {
		display: block;
		max-width: 24em;
	}
	.line.has {
		margin-block-start: var(--k-space-1);
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
		/* The icon is an SVG: the result colours (ok, danger) would stay as authored; the label text carries the result. */
		svg,
		[data-variant='ghost'][data-status='started'] svg,
		[data-variant='secondary'][data-status='started'] svg,
		[data-variant='ghost'][data-status='error'] svg,
		[data-variant='secondary'][data-status='error'] svg {
			color: ButtonText;
		}
	}
</style>
