<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		/** `grid` = lines, `dots` = a dot at each crossing. */
		variant?: 'grid' | 'dots' | undefined;
		/** Cell size in pixels. */
		size?: number | undefined;
		/** Fade the pattern out towards the edges (radial mask). */
		fade?: boolean | undefined;
		class?: string | undefined;
		/** Content that sits on top of the pattern. */
		children?: Snippet | undefined;
	}
	let { variant = 'grid', size = 32, fade = false, class: cls = '', children }: Props = $props();
</script>

<!-- The pattern is a decoration layer: hidden from assistive technology, never focusable. -->
<div class="k-grid-bg {cls}" style:--k-grid-size="{Math.max(4, size)}px">
	<div class="pattern" data-variant={variant} class:fade aria-hidden="true"></div>
	{@render children?.()}
</div>

<style>
	/* Pattern colour: --k-line, or --k-grid-color to override it. */
	.k-grid-bg { position: relative; isolation: isolate; min-width: 0; }
	.pattern {
		position: absolute;
		inset: 0;
		z-index: -1;
		border-radius: inherit;
		pointer-events: none;
		--c: var(--k-grid-color, var(--k-line));
		background-size: var(--k-grid-size) var(--k-grid-size);
	}
	[data-variant='grid'] {
		background-image: linear-gradient(to right, var(--c) 1px, transparent 1px), linear-gradient(to bottom, var(--c) 1px, transparent 1px);
	}
	[data-variant='dots'] {
		background-image: radial-gradient(circle at center, var(--c) 1.5px, transparent 2px);
	}
	.fade {
		-webkit-mask-image: radial-gradient(ellipse 75% 75% at 50% 50%, #000 15%, transparent 100%);
		mask-image: radial-gradient(ellipse 75% 75% at 50% 50%, #000 15%, transparent 100%);
	}
</style>
