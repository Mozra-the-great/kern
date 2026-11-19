<svelte:options customElement={{ props: { speed: { type: "Number" }, direction: { type: "String" }, pauseOnHover: { type: 'String', attribute: 'pause-on-hover' }, pausable: { type: "String" }, paused: { type: 'Boolean', reflect: true }, gap: { type: "String" }, height: { type: "String" }, fade: { type: "Boolean" }, label: { type: "String" }, pauseLabel: { type: 'String', attribute: 'pause-label' }, playLabel: { type: 'String', attribute: 'play-label' } } }} />
<script lang="ts">
	import Marquee from '../lib/components/Marquee.svelte';
	/* pause-on-hover and pausable default to on; ="false" turns them off.
	 * gap/height: any CSS length; a bare number means pixels. The light-DOM children loop. */
	let { speed, direction, pauseOnHover, pausable, paused = $bindable(false), gap, height, fade = false, label, pauseLabel, playLabel } = $props();
	const on = (v: unknown, fallback: boolean) => (v === undefined || v === null ? fallback : v !== false && v !== 'false');
	const px = (v: string | null | undefined) => (v !== undefined && v !== null && /^\d+(\.\d+)?$/.test(v) ? Number(v) : (v ?? undefined));
</script>
<Marquee {speed} {direction} pauseOnHover={on(pauseOnHover, true)} pausable={on(pausable, true)} bind:paused gap={px(gap)} height={px(height)} {fade} {label} {pauseLabel} {playLabel}><slot /></Marquee>
<style>
	:host { display: block; min-width: 0; }
</style>
