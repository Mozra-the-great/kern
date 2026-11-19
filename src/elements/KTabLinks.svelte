<svelte:options customElement={{ props: { links: { type: 'Array' }, label: { type: 'String' }, look: { type: 'String' } } }} />

<script lang="ts">
	/**
	 * Navigation tabs as links (stuffcloud's TabLinks): a `<nav>` landmark named by `label`, links styled
	 * like `<k-tabs>`, the current one with `aria-current="page"`. Plain links: Tab moves between them,
	 * no arrow keys. Links in a shadow root are invisible to client-side routers; listen to `navigate`
	 * and call `preventDefault()` to route yourself.
	 * @prop links {TabLinkItem[]}
	 * @prop look {'line' | 'pill'}
	 * @event navigate {TabLinkItem} The user follows a link with a plain primary click; cancelable: `preventDefault()` stops the page load (client-side routing).
	 */
	import TabLinks, { type TabLinkItem } from '../lib/components/TabLinks.svelte';
	import { emit } from './form.js';
	let { links = [], label = '', look } = $props();
	const host = $host();
	const list = $derived<TabLinkItem[]>(Array.isArray(links) ? links : []);
</script>

<TabLinks
	links={list}
	{label}
	{look}
	onnavigate={(link: TabLinkItem, e: MouseEvent) => {
		if (!emit(host, 'navigate', link, true)) e.preventDefault();
	}}
/>

<style>
	:host {
		display: block;
		min-width: 0;
	}
</style>
