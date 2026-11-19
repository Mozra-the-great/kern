<svelte:options customElement={{ props: { variant: { type: "String" }, width: { type: "String" }, height: { type: "String" }, lines: { type: "Number" } } }} />
<script lang="ts">
	import Skeleton from '../lib/components/Skeleton.svelte';
	/* width/height: any CSS length ("12rem", "40px"); a bare number means pixels. */
	let { variant, width, height, lines } = $props();
	const px = (v: string | undefined) => (v !== undefined && /^\d+(\.\d+)?$/.test(v) ? Number(v) : v);
</script>
<Skeleton {variant} width={px(width)} height={px(height)} {lines} />
