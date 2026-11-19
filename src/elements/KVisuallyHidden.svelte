<svelte:options customElement={{ props: {} }} />

<script lang="ts">
	/*
	 * <k-visually-hidden>: the slotted text stays in the accessibility tree but is not painted (#100).
	 * The attribute `focusable` shows it while something inside has focus (a skip link). The host
	 * itself is hidden, so the slotted light-DOM text keeps the page's language and styles.
	 */
</script>

<slot />

<style>
	:host(:not([focusable]:focus-within)) {
		position: absolute;
		width: 1px;
		height: 1px;
		margin: -1px;
		padding: 0;
		border: 0;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}
	:host {
		display: inline;
	}
</style>
