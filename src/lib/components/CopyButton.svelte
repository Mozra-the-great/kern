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
	interface Props {
		/** Text to copy. */
		value?: string | undefined;
		/** Reads the text at click time. Wins over `value`; may be async. */
		getValue?: (() => string | Promise<string>) | undefined;
		/** Accessible name of the button. */
		label?: string | undefined;
		/** Spoken after a successful copy. */
		copiedLabel?: string | undefined;
		/** Spoken when copying fails. */
		errorLabel?: string | undefined;
		variant?: 'ghost' | 'secondary' | undefined;
		size?: 'sm' | 'md' | undefined;
		/** Milliseconds the success or error state stays before it resets. */
		resetAfter?: number | undefined;
		disabled?: boolean | undefined;
		/** Called with the copied text after a successful copy. */
		oncopy?: ((text: string) => void) | undefined;
		/** Called when reading or writing the text failed. */
		onerror?: ((error: unknown) => void) | undefined;
		class?: string | undefined;
	}
	let {
		value,
		getValue,
		label = 'Copy',
		copiedLabel = 'Copied',
		errorLabel = 'Copy failed',
		variant = 'ghost',
		size = 'md',
		resetAfter = 2000,
		disabled = false,
		oncopy,
		onerror,
		class: cls = ''
	}: Props = $props();

	let status = $state<CopyStatus>('idle');
	let button: HTMLButtonElement | undefined = $state();
	let timer: ReturnType<typeof setTimeout> | undefined;
	$effect(() => () => clearTimeout(timer));

	const announcement = $derived(status === 'copied' ? copiedLabel : status === 'error' ? errorLabel : '');

	function settle(next: CopyStatus): void {
		status = next;
		clearTimeout(timer);
		timer = setTimeout(() => (status = 'idle'), Math.max(0, resetAfter));
	}

	async function copy(): Promise<void> {
		let text: string;
		try {
			text = getValue ? await getValue() : (value ?? '');
		} catch (error) {
			settle('error');
			onerror?.(error);
			return;
		}
		if (await copyText(text, button)) {
			settle('copied');
			oncopy?.(text);
		} else {
			settle('error');
			onerror?.(new Error('Copying to the clipboard failed'));
		}
	}
</script>

<span class="k-copy-button {cls}">
	<button
		bind:this={button}
		type="button"
		class="btn"
		data-variant={variant}
		data-size={size}
		data-status={status}
		aria-label={label}
		title={label}
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
	</button>
	<span class="sr" role="status" aria-live="polite" aria-atomic="true">{announcement}</span>
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
	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.btn[data-status='copied'] {
		color: var(--k-ok);
	}
	.btn[data-status='error'] {
		color: var(--k-danger);
	}
	svg {
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
</style>
