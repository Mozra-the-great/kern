<svelte:options
	customElement={{
		props: {
			variant: { type: 'String' },
			size: { type: 'String' },
			block: { type: 'Boolean' },
			wide: { type: 'Boolean' },
			loading: { type: 'Boolean' },
			loadingLabel: { type: 'String', attribute: 'loading-label' },
			disabled: { type: 'Boolean', reflect: true },
			href: { type: 'String' },
			target: { type: 'String' },
			rel: { type: 'String' },
			download: { type: 'String' },
			type: { type: 'String' },
			label: { type: 'String' }
		},
		extend: formAssociated
	}}
/>

<script lang="ts">
	/**
	 * Button, or a link with `href` (also `target`, `rel`, `download`). A disabled or loading link stays
	 * a link without href and with `aria-disabled="true"`. `size="icon"` is a square for an icon: give
	 * it a `label`. While `loading`, a polite status text is announced (`loading-label`, default "Loading").
	 * @prop label Accessible name of the inner button or link, for content that is only an icon.
	 */
	import Button from '../lib/components/Button.svelte';
	import { formAssociated, type FormHost } from './form.js';
	let {
		variant,
		size,
		block = false,
		wide = false,
		loading = false,
		loadingLabel,
		disabled = false,
		href,
		target,
		rel,
		download,
		type = 'button',
		label
	} = $props();
	const host = $host();
	// The inner <button> lives in the shadow root, so it cannot submit the page's form itself.
	function onclick() {
		const form = (host as FormHost).internals?.form ?? null;
		if (!form) return;
		// Through the prototype: a form control named `reset` or `submit` (id or name) shadows the method on the form.
		if (type === 'submit') HTMLFormElement.prototype.requestSubmit.call(form);
		else if (type === 'reset') HTMLFormElement.prototype.reset.call(form);
	}
</script>

<Button
	{variant}
	{size}
	{block}
	{wide}
	{loading}
	{loadingLabel}
	{disabled}
	{href}
	{target}
	{rel}
	{download}
	type="button"
	aria-label={label}
	{onclick}
>
	<slot />
</Button>

<style>
	/* A full-width button needs a block host. */
	:host([block]),
	:host([wide]) {
		display: block;
	}
	/* In a stacked <k-modal> footer the host is as wide as the row (KModal); the button fills it. Unset elsewhere. */
	:global(.k-button) {
		width: var(--k-modal-action-fill, auto);
	}
</style>
