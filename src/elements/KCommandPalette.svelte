<svelte:options customElement={{ tag: 'k-command-palette', props: { open: { type: 'Boolean', reflect: true }, commands: { type: "Array" }, label: { type: "String" }, placeholder: { type: "String" }, empty: { type: "String" }, closeLabel: { type: 'String', attribute: 'close-label' }, hotkey: { type: "String" } } }} />
<script lang="ts">
	import CommandPalette from '../lib/components/CommandPalette.svelte';
	import { emit } from './form.js';
	/* commands: JSON list [{id,label,group?,keywords?,shortcut?}]; running one fires "select" with its id. */
	let { open = $bindable(false), commands = [], label, placeholder, empty, closeLabel, hotkey } = $props();
	const host = $host();
</script>
<CommandPalette bind:open {commands} {label} {placeholder} {empty} {closeLabel} {hotkey} onselect={(id) => emit(host, 'select', id)} onclose={() => emit(host, 'close')} />
