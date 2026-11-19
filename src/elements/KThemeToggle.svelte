<svelte:options customElement={{ props: { themes: { type: 'Array' }, value: { type: 'String', reflect: true }, target: { type: 'String' }, persist: { type: 'String' }, followSystem: { type: 'Boolean', attribute: 'follow-system' }, label: { type: 'String' } } }} />
<script lang="ts">
	/**
	 * @prop themes {ThemeOption[]}
	 * @event change {string} Id of the theme the user picked.
	 */
	import ThemeToggle from '../lib/components/ThemeToggle.svelte';
	import { emit } from './form.js';
	/* themes: JSON list of {id,label}; default = light/dark pair of the current brand.
	 * target: CSS selector of the element whose data-theme is switched (default <html>). */
	let { themes, value = $bindable(), target, persist, followSystem = false, label } = $props();
	const host = $host();
</script>
<ThemeToggle {themes} bind:value {target} {persist} {followSystem} {label} onchange={(id: string) => emit(host, 'change', id)} />
