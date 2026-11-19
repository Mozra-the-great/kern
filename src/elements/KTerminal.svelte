<svelte:options customElement={{ props: { lines: { type: "Array" }, title: { type: "String" }, prompt: { type: "String" }, typewriter: { type: "Boolean" }, speed: { type: "Number" }, delay: { type: "Number" }, linePause: { type: 'Number', attribute: 'line-pause' }, startInView: { type: 'String', attribute: 'start-in-view' }, copy: { type: "Boolean" }, copyLabel: { type: 'String', attribute: 'copy-label' }, copiedLabel: { type: 'String', attribute: 'copied-label' }, label: { type: "String" } } }} />
<script lang="ts">
	/**
	 * @prop lines {TerminalLine[]}
	 * @event complete The typewriter finished the last line.
	 */
	import Terminal from '../lib/components/Terminal.svelte';
	import { emit } from './form.js';
	/* lines: JSON, e.g. lines='[{"text":"npm i @mozra-the-great/kern","output":"added 1 package"}]'. start-in-view defaults to on. */
	let { lines = [], title, prompt, typewriter = false, speed, delay, linePause, startInView, copy = false, copyLabel, copiedLabel, label } = $props();
	const host = $host();
	const on = (v: unknown, fallback: boolean) => (v === undefined || v === null ? fallback : v !== false && v !== 'false');
</script>
<Terminal {lines} {title} {prompt} {typewriter} {speed} {delay} {linePause} startInView={on(startInView, true)} {copy} {copyLabel} {copiedLabel} {label} oncomplete={() => emit(host, 'complete')} />
<style>
	:host { display: block; min-width: 0; }
</style>
