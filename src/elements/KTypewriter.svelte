<svelte:options customElement={{ tag: 'k-typewriter', props: { text: { type: "String" }, speed: { type: "Number" }, eraseSpeed: { type: 'Number', attribute: 'erase-speed' }, delay: { type: "Number" }, hold: { type: "Number" }, loop: { type: "Boolean" }, caret: { type: "String" }, caretShape: { type: 'String', attribute: 'caret-shape' }, label: { type: "String" } } }} />
<script lang="ts">
	import Typewriter from '../lib/components/Typewriter.svelte';
	import { emit } from './form.js';
	/* text: a string, or a JSON array of strings to cycle (text='["a","b"]'). Without the attribute the element's own text is used.
	 * caret defaults to on; caret="false" turns it off. */
	let { text, speed, eraseSpeed, delay, hold, loop = false, caret, caretShape, label } = $props();
	const host = $host();
	const on = (v: unknown, fallback: boolean) => (v === undefined || v === null ? fallback : v !== false && v !== 'false');
	const list = (v: unknown): string | string[] => {
		if (Array.isArray(v)) return v.map(String);
		if (typeof v === 'string' && v.trim().startsWith('[')) {
			try {
				const parsed: unknown = JSON.parse(v);
				if (Array.isArray(parsed)) return parsed.map(String);
			} catch {}
		}
		return typeof v === 'string' ? v : (host.textContent ?? '').trim();
	};
</script>
<Typewriter text={list(text)} {speed} {eraseSpeed} {delay} {hold} {loop} caret={on(caret, true)} {caretShape} {label} oncomplete={() => emit(host, 'complete')} />
