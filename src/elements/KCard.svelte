<svelte:options
	customElement={{
		props: {
			title: { type: 'String' },
			description: { type: 'String' },
			level: { type: 'Number' },
			look: { type: 'String' },
			as: { type: 'String' },
			href: { type: 'String' },
			clickable: { type: 'Boolean' },
			actionLabel: { type: 'String', attribute: 'action-label' },
			actionHaspopup: { type: 'String', attribute: 'action-haspopup' },
			muted: { type: 'Boolean' }
		}
	}}
/>

<script lang="ts">
	/**
	 * Card. `clickable` turns the title into a button that covers the card and fires `action`; controls
	 * in the `footer` and `badges` slots and in the content stay separate and clickable. `as="li"` gives
	 * the element the role `listitem`, for cards directly inside a `<ul>`.
	 * @prop as {'article' | 'section' | 'div' | 'li'} Root element; `li` sets `role="listitem"` on the element itself.
	 * @prop clickable The card opens something: fires `action` on click, Enter or Space.
	 * @event action The user activated the card's button or link (`clickable`).
	 */
	import Card from '../lib/components/Card.svelte';
	import { emit, hasSlot } from './form.js';
	let { title, description, level, look, as, href, clickable = false, actionLabel, actionHaspopup, muted = false } = $props();
	const host = $host();
	const media = hasSlot(host, 'media');
	const footer = hasSlot(host, 'footer');
	const badges = hasSlot(host, 'badges');
	// Inside a shadow root an <li> has no list around it; the host is the list item instead.
	const root = $derived(as === 'li' ? 'div' : as);
	$effect(() => {
		if (as !== 'li' || host.hasAttribute('role')) return;
		host.setAttribute('role', 'listitem');
		return () => host.removeAttribute('role');
	});
	const onclick = $derived(clickable ? () => emit(host, 'action') : undefined);
</script>

{#snippet mediaS()}{#if media}<slot name="media" />{/if}{/snippet}
{#snippet footerS()}{#if footer}<slot name="footer" />{/if}{/snippet}
{#snippet badgesS()}{#if badges}<slot name="badges" />{/if}{/snippet}
<Card
	{title}
	{description}
	{level}
	{look}
	as={root}
	{href}
	{onclick}
	{actionLabel}
	{actionHaspopup}
	{muted}
	media={media ? mediaS : undefined}
	footer={footer ? footerS : undefined}
	badges={badges ? badgesS : undefined}
>
	<slot />
</Card>

<style>
	/* Controls placed directly in the content stay clickable above the card's hit area. */
	:global(slot:not([name])::slotted(:is(a[href], button, input, select, textarea, label, summary, [tabindex]))) {
		position: relative;
		z-index: 1;
	}
	:host([as='li']) {
		display: block;
		list-style: none;
	}
</style>
