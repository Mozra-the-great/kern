<svelte:options customElement={{ tag: 'k-tree-view', props: { nodes: { type: "Array" }, selected: { type: 'String', reflect: true }, expanded: { type: "Array" }, label: { type: "String" } } }} />
<script lang="ts">
	import TreeView from '../lib/components/TreeView.svelte';
	import { emit } from './form.js';
	/* nodes: JSON tree [{id,label,children?,disabled?}]. Fires "select" (detail = id) and "toggle" (detail = {id, expanded}). */
	let { nodes = [], selected = $bindable(), expanded = $bindable([]), label } = $props();
	const host = $host();
</script>
<TreeView {nodes} bind:selected bind:expanded {label} onselect={(id) => emit(host, 'select', id)} ontoggle={(id, open) => emit(host, 'toggle', { id, expanded: open })} />
