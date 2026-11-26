<svelte:options
	customElement={{
		props: {
			open: { type: 'Boolean', reflect: true },
			commands: { type: 'Array' },
			label: { type: 'String' },
			placeholder: { type: 'String' },
			empty: { type: 'String' },
			closeLabel: { type: 'String', attribute: 'close-label' },
			hotkey: { type: 'String' }
		}
	}}
/>

<script lang="ts">
	/**
	 * @prop commands {readonly Command[]}
	 * @event select {string} Id of the command the user ran.
	 * @event close The palette was closed by the user.
	 */
	import CommandPalette from '../lib/components/CommandPalette.svelte';
	import { emit } from './form.js';
	/* commands: JSON list [{id,label,group?,keywords?,shortcut?}]; running one fires "select" with its id. */
	let { open = $bindable(false), commands = [], label, placeholder, empty, closeLabel, hotkey } = $props();
	const host = $host();
</script>

<CommandPalette
	bind:open
	{commands}
	{label}
	{placeholder}
	{empty}
	{closeLabel}
	{hotkey}
	onselect={(id) => emit(host, 'select', id)}
	onclose={() => emit(host, 'close')}
/>
