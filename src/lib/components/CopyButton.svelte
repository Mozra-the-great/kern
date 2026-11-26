<script lang="ts" module>
	export type CopyStatus = 'idle' | 'copied' | 'error';

	/**
	 * Writes `text` to the clipboard. Uses the async Clipboard API and falls back to a temporary
	 * textarea (insecure contexts, blocked permission). Keyboard focus returns to `returnFocus`.
	 */
	async function copyText(text: string, returnFocus: HTMLElement | undefined): Promise<boolean> {
		if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
			try {
				await navigator.clipboard.writeText(text);
				return true;
			} catch {
				/* Permission denied or document not focused: try the fallback below. */
			}
		}
		if (typeof document === 'undefined') return false;
		const root = returnFocus?.getRootNode();
		const hadFocus = !!returnFocus && !!root && 'activeElement' in root && (root as Document | ShadowRoot).activeElement === returnFocus;
		const area = document.createElement('textarea');
		area.value = text;
		area.setAttribute('readonly', '');
		area.setAttribute('aria-hidden', 'true');
		area.tabIndex = -1;
		area.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;padding:0;border:0;opacity:0;pointer-events:none';
		document.body.append(area);
		area.select();
		area.setSelectionRange(0, text.length);
		let ok: boolean;
		try {
			// eslint-disable-next-line @typescript-eslint/no-deprecated -- fallback where the async Clipboard API is missing or blocked
			ok = document.execCommand('copy');
		} catch {
			ok = false;
		}
		area.remove();
		if (hadFocus) returnFocus?.focus({ preventScroll: true });
		return ok;
	}
</script>

<script lang="ts">
	import { strings } from './strings.svelte.js';
	import { tick } from 'svelte';

	interface Props {
		/** Text to copy. Same as `value`; wins when both are set. */
		text?: string | undefined;
		/** Text to copy. */
		value?: string | undefined;
		/** Reads the text at click time. Wins over `text` and `value`; may be async. */
		getValue?: (() => string | Promise<string>) | undefined;
		/**
		 * Name of the button, e.g. "Copy HEX". Icon-only by default (the label is the `aria-label` and tooltip);
		 * with `showLabel` it is the visible text and, without `accessibleLabel`, also the accessible name.
		 */
		label?: string | undefined;
		/** Show `label` as text next to the icon instead of an icon-only button. */
		showLabel?: boolean | undefined;
		/**
		 * Accessible name when it should say more than `label`, e.g. `label` "Copy" and `accessibleLabel` "Copy SHA-256" in a
		 * list of values. It is the button's `aria-label`, with and without `showLabel` (icon-only: also the tooltip), and
		 * wins over `label` as the name; `label` stays the visible text. WCAG 2.5.3 (Label in Name): with `showLabel` it must
		 * contain the visible `label`, ideally at the start, so voice control ("click Copy") still finds the button.
		 * Empty, whitespace-only or `null` (an untyped caller, a removed element attribute) counts as not set. The spoken results (`copiedLabel`, `errorLabel`) are not affected.
		 */
		accessibleLabel?: string | undefined;
		/**
		 * Spoken after a successful copy, in a polite live region. It is set fresh on every click (so a
		 * repeated result is announced again) and stays until the next click.
		 */
		copiedLabel?: string | undefined;
		/** Spoken when copying fails (no clipboard outside a secure context, permission denied …). */
		errorLabel?: string | undefined;
		variant?: 'ghost' | 'secondary' | undefined;
		size?: 'sm' | 'md' | undefined;
		/** Milliseconds the success or error icon stays before it resets. The spoken message stays. */
		resetAfter?: number | undefined;
		disabled?: boolean | undefined;
		/** Called with the copied text after a successful copy. */
		oncopy?: ((text: string) => void) | undefined;
		/** Called when reading or writing the text failed. */
		onerror?: ((error: unknown) => void) | undefined;
		class?: string | undefined;
	}
	let {
		text: textProp,
		value,
		getValue,
		label: labelProp,
		showLabel = false,
		accessibleLabel,
		copiedLabel: copiedLabelProp,
		errorLabel: errorLabelProp,
		variant = 'ghost',
		size = 'md',
		resetAfter = 2000,
		disabled = false,
		oncopy,
		onerror,
		class: cls = ''
	}: Props = $props();
	const label = $derived(labelProp ?? strings().copyButton.label);
	/** `accessibleLabel` when it has text; whitespace only counts as not set. */
	const customName = $derived(typeof accessibleLabel === 'string' && accessibleLabel.trim() !== '' ? accessibleLabel : undefined);
	/** The accessible name: `accessibleLabel`, else `label`. */
	const accessibleName = $derived(customName ?? label);
	const copiedLabel = $derived(copiedLabelProp ?? strings().copyButton.copiedLabel);
	const errorLabel = $derived(errorLabelProp ?? strings().copyButton.errorLabel);

	let status = $state<CopyStatus>('idle');
	let button: HTMLButtonElement | undefined = $state();
	let timer: ReturnType<typeof setTimeout> | undefined;
	$effect(() => () => clearTimeout(timer));

	/** The live message: emptied when a click starts, filled with that click's result, kept until the next click. */
	let message = $state('');
	/** Counts clicks, so a slow earlier copy cannot overwrite the result of a later one. */
	let run = 0;

	/** Resets the icon (not the message) after `resetAfter`. */
	function settle(next: CopyStatus): void {
		status = next;
		clearTimeout(timer);
		timer = setTimeout(() => (status = 'idle'), Math.max(0, resetAfter));
	}

	/**
	 * Shows the result of click `id`. The region was emptied when the click started; the text is set
	 * after the empty state has been rendered and a short pause, so screen readers see a change even
	 * when the result is the same as last time.
	 */
	function report(id: number, next: CopyStatus): void {
		settle(next);
		const text = next === 'copied' ? copiedLabel : errorLabel;
		void tick()
			.then(() => new Promise((resolve) => setTimeout(resolve, 50)))
			.then(() => {
				if (id === run) message = text;
			});
	}

	async function copy(): Promise<void> {
		const id = ++run;
		message = '';
		let text: string;
		try {
			text = getValue ? await getValue() : (textProp ?? value ?? '');
		} catch (error) {
			report(id, 'error');
			onerror?.(error);
			return;
		}
		if (await copyText(text, button)) {
			report(id, 'copied');
			oncopy?.(text);
		} else {
			report(id, 'error');
			onerror?.(new Error('Copying to the clipboard failed'));
		}
	}
</script>

<span class="k-copy-button {cls}">
	<button
		bind:this={button}
		type="button"
		class="btn"
		class:labelled={showLabel}
		data-variant={variant}
		data-size={size}
		data-status={status}
		aria-label={showLabel && customName === undefined ? undefined : accessibleName}
		title={showLabel ? undefined : accessibleName}
		{disabled}
		onclick={copy}
	>
		<svg viewBox="0 0 20 20" aria-hidden="true">
			{#if status === 'copied'}
				<path d="M4 10.5l4 4 8-9" />
			{:else if status === 'error'}
				<path d="M5 5l10 10M15 5L5 15" />
			{:else}
				<path d="M7 7h10v10H7zM13 7V3H3v10h4" />
			{/if}
		</svg>
		{#if showLabel}<span class="text">{label}</span>{/if}
	</button>
	<span class="sr" role="status" aria-live="polite" aria-atomic="true">{message}</span>
</span>

<style>
	.k-copy-button {
		position: relative;
		display: inline-flex;
		flex: none;
	}
	.btn {
		display: inline-grid;
		place-items: center;
		box-sizing: border-box;
		width: var(--k-tap-icon);
		height: var(--k-tap-icon);
		min-width: var(--k-tap-target);
		min-height: var(--k-tap-target);
		padding: 0;
		border: var(--k-border-w) solid transparent;
		border-radius: var(--k-radius-control);
		background: transparent;
		color: var(--k-fg);
		cursor: pointer;
		transition:
			background-color var(--k-dur) var(--k-ease),
			color var(--k-dur) var(--k-ease),
			border-color var(--k-dur) var(--k-ease);
	}
	.btn[data-size='sm'] {
		width: max(var(--k-control-h-sm), 40px);
		height: max(var(--k-control-h-sm), 40px);
	}
	.btn[data-variant='secondary'] {
		border-color: var(--k-border);
	}
	.btn:hover:not(:disabled) {
		background: var(--k-bg-sunken);
	}
	.btn:focus-visible {
		outline: var(--k-focus-w) solid var(--k-focus);
		outline-offset: var(--k-focus-offset);
	}
	/* Visible label: a compact text button, at least as tall as the icon-only one. */
	.btn.labelled {
		display: inline-flex;
		gap: var(--k-space-2);
		width: auto;
		min-width: var(--k-tap-icon);
		padding: 0 var(--k-space-3);
		font-family: var(--k-label-font);
		font-size: var(--k-label-size);
		font-weight: var(--k-weight-label);
		text-transform: var(--k-label-transform);
		letter-spacing: var(--k-label-tracking);
		white-space: nowrap;
	}
	.btn.labelled[data-size='sm'] {
		width: auto;
	}
	.btn:disabled {
		opacity: var(--k-disabled-opacity);
		cursor: not-allowed;
	}
	/* Only the icon changes colour; a visible label keeps the text colour. */
	.btn[data-status='copied'] svg {
		color: var(--k-ok);
	}
	.btn[data-status='error'] svg {
		color: var(--k-danger);
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
		.btn {
			border-color: ButtonText;
		}
		.btn:disabled {
			opacity: 1;
			border-color: GrayText;
			color: GrayText;
		}
	}
</style>
