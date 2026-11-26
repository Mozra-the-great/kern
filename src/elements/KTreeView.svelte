<svelte:options
	customElement={{
		props: { nodes: { type: 'Array' }, selected: { type: 'String', reflect: true }, expanded: { type: 'Array' }, label: { type: 'String' } }
	}}
/>

<script lang="ts">
	/**
	 * @prop nodes {readonly TreeNode[]}
	 * @prop expanded {string[]}
	 * @event select {string} Id of the node the user selected.
	 * @event toggle {{ id: string; expanded: boolean }} A node the user expanded or collapsed.
	 */
	import TreeView from '../lib/components/TreeView.svelte';
	import { emit } from './form.js';
	/* nodes: JSON tree [{id,label,children?,disabled?}]. Fires "select" (detail = id) and "toggle" (detail = {id, expanded}). */
	let { nodes = [], selected = $bindable(), expanded = $bindable([]), label } = $props();
	const host = $host();
</script>

<TreeView
	{nodes}
	bind:selected
	bind:expanded
	{label}
	onselect={(id) => emit(host, 'select', id)}
	ontoggle={(id, open) => emit(host, 'toggle', { id, expanded: open })}
/>
