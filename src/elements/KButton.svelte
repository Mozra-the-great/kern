<svelte:options
	customElement={{
		props: {
			variant: { type: 'String' },
			size: { type: 'String' },
			block: { type: 'Boolean' },
			wide: { type: 'Boolean' },
			loading: { type: 'Boolean' },
			disabled: { type: 'Boolean' },
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
	 * it a `label`.
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
		if (type === 'submit') form.requestSubmit();
		else if (type === 'reset') form.reset();
	}
</script>

<Button {variant} {size} {block} {wide} {loading} {disabled} {href} {target} {rel} {download} type="button" aria-label={label} {onclick}>
	<slot />
</Button>

<style>
	/* A full-width button needs a block host. */
	:host([block]),
	:host([wide]) {
		display: block;
	}
</style>
