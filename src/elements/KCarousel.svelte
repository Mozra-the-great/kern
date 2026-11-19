<svelte:options
	customElement={{
		props: {
			index: { type: 'Number', reflect: true },
			label: { type: 'String' },
			prevLabel: { type: 'String', attribute: 'prev-label' },
			nextLabel: { type: 'String', attribute: 'next-label' },
			dotsLabel: { type: 'String', attribute: 'dots-label' },
			slideLabel: { type: 'String', attribute: 'slide-label' },
			ofLabel: { type: 'String', attribute: 'of-label' }
		}
	}}
/>

<script lang="ts">
	/**
	 * @event change {number} Index of the slide the user moved to.
	 */
	import Carousel from '../lib/components/Carousel.svelte';
	import { emit } from './form.js';
	/* Slides are the light-DOM children: one element per slide. */
	let { index = $bindable(0), label, prevLabel, nextLabel, dotsLabel, slideLabel, ofLabel } = $props();
	const host = $host();
</script>

<Carousel bind:index {label} {prevLabel} {nextLabel} {dotsLabel} {slideLabel} {ofLabel} onchange={(i: number) => emit(host, 'change', i)}>
	<slot />
</Carousel>
