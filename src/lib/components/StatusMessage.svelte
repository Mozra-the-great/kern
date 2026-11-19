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
	}
	let { message, kind = 'status', reserve = true, class: cls = '', ...rest }: Props = $props();
</script>

<p {...rest} class={['k-status-message', cls]} class:reserve data-kind={kind} role={kind === 'alert' ? 'alert' : 'status'}>
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
	[data-kind='alert'] {
		color: var(--k-danger);
	}
</style>
