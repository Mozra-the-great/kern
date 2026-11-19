<script lang="ts">
	import type { Snippet } from 'svelte';
	import { observeInView, useReducedMotion } from './motion.svelte.js';

	interface Props {
		/** Draw the marker when the text is scrolled into view. Without it, right after mount. */
		inView?: boolean | undefined;
		/** Milliseconds before the marker is drawn. */
		delay?: number | undefined;
		class?: string | undefined;
		children?: Snippet | undefined;
	}
	let { inView = true, delay = 0, class: cls = '', children }: Props = $props();

	const reduced = useReducedMotion();
	/* Starts drawn (no JS, SSR). The marker is only retracted after mount, when it can be drawn again. */
	let drawn = $state(true);
	let host: HTMLElement | undefined = $state();

	$effect(() => {
		const el = host;
		const wait = Math.max(0, delay);
		const onView = inView;
		if (!el || reduced.current) {
			drawn = true;
			return;
		}
		drawn = false;
		let timer: ReturnType<typeof setTimeout> | undefined;
		let outer = 0;
		let inner = 0;
		let stop = (): void => {};
		const draw = (): void => {
			timer = setTimeout(() => (drawn = true), wait);
		};
		if (onView && typeof IntersectionObserver !== 'undefined') {
			stop = observeInView(
				el,
				(visible) => {
					if (!visible) return;
					stop();
					draw();
				},
				{ threshold: 0.5 }
			);
		} else {
			/* Two frames, so the retracted state is painted before the marker is drawn. */
			outer = requestAnimationFrame(() => {
				inner = requestAnimationFrame(draw);
			});
		}
		return () => {
			stop();
			clearTimeout(timer);
			cancelAnimationFrame(outer);
			cancelAnimationFrame(inner);
			drawn = true;
		};
	});
</script>

<span class="k-highlight {cls}" bind:this={host} data-drawn={drawn}>{@render children?.()}</span>

<style>
	/* Marker stripe behind the lower part of the text. Override the colour with --k-highlight. */
	.k-highlight {
		padding: 0 0.15em;
		margin: 0 -0.15em;
		background-image: linear-gradient(
			var(--k-highlight, color-mix(in srgb, var(--k-accent) 38%, var(--k-accent-soft))),
			var(--k-highlight, color-mix(in srgb, var(--k-accent) 38%, var(--k-accent-soft)))
		);
		background-repeat: no-repeat;
		background-position: 0 88%;
		background-size: 100% 0.62em;
		-webkit-box-decoration-break: clone;
		box-decoration-break: clone;
		color: inherit;
		transition: background-size calc(var(--k-dur) * 6) var(--k-ease);
	}
	[data-drawn='false'] { background-size: 0% 0.62em; }
	@media (prefers-reduced-motion: reduce) {
		.k-highlight { transition: none; }
		[data-drawn='false'] { background-size: 100% 0.62em; }
	}
</style>
