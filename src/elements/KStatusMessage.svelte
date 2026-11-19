<svelte:options
	customElement={{
		props: {
			message: { type: 'String' },
			kind: { type: 'String' },
			reserve: { type: 'String' }
		}
	}}
/>

<script lang="ts">
	/**
	 * Visible live region for the result of an action: put the element on the page empty and set
	 * `message` later (a region that arrives with its text is not announced by every screen reader).
	 * `kind="status"` is polite, `kind="alert"` assertive (errors). One line of height is kept while it is
	 * empty; `reserve="false"` turns that off.
	 * @prop kind {'status' | 'alert'} `status` (polite) for results, `alert` (assertive) for errors.
	 * @prop reserve {boolean | 'false'} Keep one line of height while empty (default on).
	 */
	import StatusMessage from '../lib/components/StatusMessage.svelte';
	let { message, kind, reserve } = $props();
	const on = (v: unknown, fallback: boolean) => (v === undefined || v === null ? fallback : v !== false && v !== 'false');
</script>

<StatusMessage {message} {kind} reserve={on(reserve, true)} />

<style>
	:host {
		display: block;
	}
</style>
