<script lang="ts">
	import { untrack } from 'svelte';
	import { sharedAnnouncer, type Announcer, type Politeness } from './announcer.js';
	import { strings } from './strings.svelte.js';

	interface Props {
		/**
		 * Whether the browser reports a connection. Read it with `bind:online`; it is set after mount
		 * and follows the `online` and `offline` events. `navigator.onLine` is a hint, not a guarantee:
		 * it says whether there is a network, not whether the server answers.
		 */
		online?: boolean | undefined;
		/** Heading of the notice, also announced when the connection is lost. Default: "You are offline". */
		offlineTitle?: string | undefined;
		/** Second line of the notice. `''` leaves it out. Default: see the strings catalogue. */
		offlineText?: string | undefined;
		/** Announced when the connection returns. `''` announces nothing. Default: "Back online". */
		onlineText?: string | undefined;
		/** Say the changes through the live-region announcer (`announce()`). Without a mounted one the notice speaks for itself. Default true. */
		announce?: boolean | undefined;
		/** How urgent the offline announcement is. Default `polite`. */
		politeness?: Politeness | undefined;
		/** Announcer to use. Default: the page-wide one behind `announce()`. */
		announcer?: Announcer | undefined;
		/** The connection was lost or came back (not at mount). */
		onchange?: ((online: boolean) => void) | undefined;
		class?: string | undefined;
	}
	let {
		online = $bindable(),
		offlineTitle: offlineTitleProp,
		offlineText: offlineTextProp,
		onlineText: onlineTextProp,
		announce = true,
		politeness = 'polite',
		announcer,
		onchange,
		class: cls = ''
	}: Props = $props();
	const offlineTitle = $derived(offlineTitleProp ?? strings().onlineStatus.offlineTitle);
	const offlineText = $derived(offlineTextProp ?? strings().onlineStatus.offlineText);
	const onlineText = $derived(onlineTextProp ?? strings().onlineStatus.onlineText);

	const source = $derived(announcer ?? sharedAnnouncer());
	/** Until mounted the page is assumed online: the server cannot know, and the first render must match it. */
	let offline = $state(false);
	let hosts = $state(0);

	/* No announcer on the page: the notice is its own live region. The region itself is always there;
	 * only its content comes and goes, so the change is spoken. */
	const speaksItself = $derived(!announce || hosts === 0);

	$effect(() => {
		const a = source;
		return a.subscribe(() => {
			hosts = a.hosts;
		});
	});

	$effect(() => {
		let last: boolean | undefined;
		const read = (): void => {
			const now = window.navigator.onLine;
			const previous = last;
			last = now;
			untrack(() => {
				online = now;
				offline = !now;
				const changed = previous !== undefined && previous !== now;
				if (changed) onchange?.(now);
				// A page that starts offline is announced; coming back is announced only after a loss.
				if (!announce || source.hosts === 0) return;
				if (!now) source.announce(offlineTitle, politeness);
				else if (changed && onlineText !== '') source.announce(onlineText, politeness);
			});
		};
		read();
		window.addEventListener('online', read);
		window.addEventListener('offline', read);
		return () => {
			window.removeEventListener('online', read);
			window.removeEventListener('offline', read);
		};
	});
</script>

<div class="k-online-status {cls}" role={speaksItself ? 'status' : undefined}>
	{#if offline}
		<div class="notice" data-tone="warn">
			<strong class="title">{offlineTitle}</strong>
			{#if offlineText}<span class="text">{offlineText}</span>{/if}
		</div>
	{/if}
</div>

<style>
	.k-online-status {
		display: block;
	}
	.notice {
		display: flex;
		flex-wrap: wrap;
		gap: var(--k-space-2) var(--k-space-4);
		align-items: baseline;
		padding: var(--k-space-3) var(--k-space-6);
		border-block-end: var(--k-border-w) solid var(--k-warn);
		background: var(--k-surface-warn);
		color: var(--k-fg);
		font-family: var(--k-font-sans);
		font-size: var(--k-text-md);
		line-height: 1.5;
	}
	.title {
		font-weight: var(--k-weight-heading);
	}
	@media (max-width: 760px) {
		.notice {
			padding-inline: var(--k-space-4);
		}
	}
	@media (forced-colors: active) {
		.notice {
			border: 1px solid CanvasText;
			background: Canvas;
			color: CanvasText;
		}
	}
</style>
