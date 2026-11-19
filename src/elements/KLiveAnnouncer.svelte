<svelte:options customElement={{ props: {} }} />

<script lang="ts">
	/**
	 * One polite and one assertive live region, visually hidden and present from the first render.
	 * Say something through them with `window.kern.announce(message, politeness)` (also from the
	 * Svelte package's `announce()`: the two share one announcer). Put one on the page, e.g. in the app shell.
	 */
	import LiveAnnouncer from '../lib/components/LiveAnnouncer.svelte';
</script>

<LiveAnnouncer />
