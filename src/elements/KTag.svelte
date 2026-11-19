<svelte:options
	customElement={{
		props: { removable: { type: 'Boolean' }, removeLabel: { type: 'String', attribute: 'remove-label' }, selected: { type: 'Boolean' } }
	}}
/>

<script lang="ts">
	/**
	 * @event remove The user clicked the remove button (`removable`).
	 */
	import Tag from '../lib/components/Tag.svelte';
	import { emit } from './form.js';
	let { removable = false, removeLabel, selected = false } = $props();
	const host = $host();
</script>

<Tag {removeLabel} {selected} onremove={removable ? () => emit(host, 'remove') : undefined}><slot /></Tag>
