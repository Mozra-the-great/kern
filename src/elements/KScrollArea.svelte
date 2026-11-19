<svelte:options customElement={{ props: { maxHeight: { type: 'String', attribute: 'max-height' }, direction: { type: 'String' }, fade: { type: 'Boolean' }, fadeSize: { type: 'Number', attribute: 'fade-size' }, label: { type: 'String' } } }} />
<script lang="ts">
	import ScrollArea from '../lib/components/ScrollArea.svelte';
	/* max-height: any CSS length; a bare number means pixels. The light-DOM children scroll. */
	let { maxHeight, direction, fade = false, fadeSize, label } = $props();
	const px = (v: string | null | undefined) => (v !== undefined && v !== null && /^\d+(\.\d+)?$/.test(v) ? Number(v) : (v ?? undefined));
</script>
<ScrollArea maxHeight={px(maxHeight)} {direction} {fade} {fadeSize} {label}><slot /></ScrollArea>
<style>
	:host { display: block; min-width: 0; }
</style>
