<svelte:options customElement={{ props: { for: { type: 'String' }, required: { type: 'Boolean' } } }} />
<script lang="ts">
	import Label from '../lib/components/Label.svelte';
	/* A <label for> inside a shadow root cannot reach a control outside it. So the element
	   names its target via aria-labelledby (the host's id) and forwards clicks like a native label. */
	let { for: forId, required = false } = $props();
	const host = $host();
	const uid = $props.id();
	function target(): HTMLElement | null {
		if (!forId) return null;
		const root = host.getRootNode() as Document | ShadowRoot;
		const el = root.getElementById(forId);
		return el instanceof HTMLElement ? el : null;
	}
	$effect(() => {
		const el = target();
		if (!el) return;
		if (!host.id) host.id = `${uid}-k-label`;
		const hostId = host.id;
		const ids = (el.getAttribute('aria-labelledby') ?? '').split(/\s+/).filter(Boolean);
		if (ids.includes(hostId)) return;
		el.setAttribute('aria-labelledby', [...ids, hostId].join(' '));
		return () => {
			const left = (el.getAttribute('aria-labelledby') ?? '').split(/\s+/).filter((x) => x && x !== hostId);
			if (left.length) el.setAttribute('aria-labelledby', left.join(' '));
			else el.removeAttribute('aria-labelledby');
		};
	});
	$effect(() => {
		const click = () => {
			const el = target();
			if (!el) return;
			if (el instanceof HTMLInputElement && (el.type === 'checkbox' || el.type === 'radio')) el.click();
			else el.focus();
		};
		host.addEventListener('click', click);
		return () => host.removeEventListener('click', click);
	});
</script>
<Label as="span" {required}><slot /></Label>
