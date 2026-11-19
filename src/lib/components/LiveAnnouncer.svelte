<script lang="ts">
	import { sharedAnnouncer, type Announcer } from './announcer.js';

	interface Props {
		/** Announcer to show. Default: the page-wide one behind `announce()`. */
		announcer?: Announcer | undefined;
		class?: string | undefined;
	}
	let { announcer, class: cls = '' }: Props = $props();

	const source = $derived(announcer ?? sharedAnnouncer());
	let polite = $state('');
	let assertive = $state('');

	/* Both regions are in the page from the first render and stay: a live region that arrives together
	 * with its text is not spoken by every screen reader. Only the first LiveAnnouncer on a page fills
	 * its regions, so a second one (the other build) does not make every message sound twice. */
	$effect(() => {
		const a = source;
		const host = a.attach();
		const off = a.subscribe(() => {
			polite = host.primary ? a.polite : '';
			assertive = host.primary ? a.assertive : '';
		});
		return () => {
			off();
			host.release();
			polite = '';
			assertive = '';
		};
	});
</script>

<div class="k-live-announcer {cls}">
	<div class="region" role="status" aria-live="polite" aria-atomic="true">{polite}</div>
	<div class="region" role="alert" aria-live="assertive" aria-atomic="true">{assertive}</div>
</div>

<style>
	/* Visually hidden, still in the accessibility tree. */
	.k-live-announcer,
	.region {
		position: absolute;
		inline-size: 1px;
		block-size: 1px;
		margin: -1px;
		padding: 0;
		border: 0;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}
</style>
