<svelte:options customElement={{ props: { variant: { type: 'String' }, size: { type: 'String' }, block: { type: 'Boolean' }, loading: { type: 'Boolean' }, disabled: { type: 'Boolean' }, href: { type: 'String' }, type: { type: 'String' } }, extend: formAssociated }} />
<script lang="ts">
	import Button from '../lib/components/Button.svelte';
	import { formAssociated, type FormHost } from './form.js';
	let { variant, size, block = false, loading = false, disabled = false, href, type = 'button' } = $props();
	const host = $host();
	// The inner <button> lives in the shadow root, so it cannot submit the page's form itself.
	function onclick() {
		const form = (host as FormHost).internals?.form ?? null;
		if (!form) return;
		if (type === 'submit') form.requestSubmit();
		else if (type === 'reset') form.reset();
	}
</script>
<Button {variant} {size} {block} {loading} {disabled} {href} type="button" {onclick}><slot /></Button>
