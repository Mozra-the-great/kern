<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';

	interface Props extends Omit<HTMLAttributes<HTMLParagraphElement>, 'role' | 'children'> {
		/**
		 * The text; empty until there is something to say. Render the component from the start and
		 * change only this: a live region that appears together with its text is not announced by
		 * every screen reader.
		 */
		message?: string | null | undefined;
		/** `status` (polite, `role="status"`) for results; `alert` (assertive, `role="alert"`) for errors. */
		kind?: 'status' | 'alert' | undefined;
		/** Keep one line of height while empty, so the layout does not jump when the text arrives. */
		reserve?: boolean | undefined;
		/**
		 * `ok` draws the text in the success colour (`--k-ok`) for a result line ("Copied", "3 matches").
		 * Only `kind="status"` takes it: an alert keeps its danger colour. The text says what happened, the
		 * colour only reinforces it, so `ok` needs no icon. `undefined` is `default` (`--k-fg`).
		 */
		tone?: 'default' | 'ok' | undefined;
	}
	let { message, kind = 'status', reserve = true, tone = 'default', class: cls = '', ...rest }: Props = $props();
</script>

<p
	{...rest}
	class={['k-status-message', cls]}
	class:reserve
	data-kind={kind}
	data-tone={tone === 'ok' && kind !== 'alert' ? 'ok' : undefined}
	role={kind === 'alert' ? 'alert' : 'status'}
>
	{message ?? ''}
</p>

<style>
	.k-status-message {
		margin: 0;
		font-family: var(--k-font-mono);
		font-size: var(--k-text-sm);
		line-height: 1.5;
		color: var(--k-fg);
		overflow-wrap: anywhere;
	}
	.reserve {
		min-height: 1.5em;
	}
	[data-tone='ok'] {
		color: var(--k-ok);
	}
	[data-kind='alert'] {
		color: var(--k-danger);
	}
	@media (forced-colors: active) {
		/* An alert is not only red: mark it with a heavy edge and weight. */
		[data-kind='alert'] {
			padding-inline-start: 0.6em;
			border-inline-start: 4px solid CanvasText;
			font-weight: 700;
		}
	}
</style>
