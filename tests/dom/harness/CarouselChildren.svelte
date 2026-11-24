<script lang="ts">
	// Carousel with its slides passed as child elements instead of items + slide (tests/dom/carousel.test.ts).
	import Carousel from '../../../src/lib/components/Carousel.svelte';

	let { count = 3, index = $bindable() }: { count?: number; index?: number | undefined } = $props();
</script>

<Carousel label="Children" bind:index>
	{#each Array.from({ length: count }, (_, i) => i) as i (i)}
		<div class="child">Child {i + 1}</div>
	{/each}
</Carousel>
