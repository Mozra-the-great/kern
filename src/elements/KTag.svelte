<svelte:options customElement={{ tag: 'k-tag', props: { removable: { type: "Boolean" }, removeLabel: { type: 'String', attribute: 'remove-label' }, selected: { type: "Boolean" } } }} />
<script lang="ts">
	import Tag from '../lib/components/Tag.svelte';
	import { emit } from './form.js';
	let { removable = false, removeLabel, selected = false } = $props();
	const host = $host();
</script>
<Tag {removeLabel} {selected} onremove={removable ? () => emit(host, 'remove') : undefined}><slot /></Tag>
