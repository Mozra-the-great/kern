<svelte:options
	customElement={{
		props: {
			offlineTitle: { type: 'String', attribute: 'offline-title' },
			offlineText: { type: 'String', attribute: 'offline-text' },
			onlineText: { type: 'String', attribute: 'online-text' },
			announce: { type: 'String' },
			politeness: { type: 'String' }
		}
	}}
/>

<script lang="ts">
	/**
	 * Shows a non-blocking notice while the browser is offline (`navigator.onLine`, the `online` and
	 * `offline` events) and says the changes through the page's `<k-live-announcer>`. Without one on the
	 * page the notice is its own live region. Nothing is shown while online.
	 * @prop announce {boolean | 'false'} Say the changes through the announcer (default on).
	 * @prop politeness {'polite' | 'assertive'} How urgent the offline announcement is (default `polite`).
	 * @event change {OnlineChangeDetail} The connection was lost or came back (not fired when the element loads).
	 */
	import OnlineStatus from '../lib/components/OnlineStatus.svelte';
	import { emit } from './form.js';
	let { offlineTitle, offlineText, onlineText, announce, politeness } = $props();
	const host = $host();
	const on = (v: unknown, fallback: boolean) => (v === undefined || v === null ? fallback : v !== false && v !== 'false');
</script>

<OnlineStatus
	offlineTitle={offlineTitle ?? undefined}
	offlineText={offlineText ?? undefined}
	onlineText={onlineText ?? undefined}
	announce={on(announce, true)}
	politeness={politeness === 'assertive' ? 'assertive' : 'polite'}
	onchange={(online: boolean) => emit(host, 'change', { online })}
/>

<style>
	:host {
		display: block;
	}
</style>
