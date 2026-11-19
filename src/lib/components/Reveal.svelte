<script lang="ts">
	import type { Snippet } from 'svelte';
	import { observeInView, useReducedMotion } from './motion.svelte.js';

	interface Props {
		/** Direction the content travels while it appears: `up` = it rises into place from below. `none` only fades. */
		direction?: 'up' | 'down' | 'left' | 'right' | 'none' | undefined;
		/** Milliseconds to wait after the content enters the viewport. */
		delay?: number | undefined;
		/** Reveal once. Without it the content hides again when it leaves the viewport and replays. */
		once?: boolean | undefined;
		/** Share of the content that must be visible before it appears (0..1). */
		threshold?: number | undefined;
		class?: string | undefined;
		children?: Snippet | undefined;
	}
	let { direction = 'up', delay = 0, once = true, threshold = 0.15, class: cls = '', children }: Props = $props();

	const reduced = useReducedMotion();
	/* The content starts visible. Only after mount, and only with motion allowed and a working
	 * IntersectionObserver, is it hidden and then revealed, so it can never stay hidden. */
	let phase: 'shown' | 'hidden' = $state('shown');
	/* Side-moving content is clipped until it has arrived, so it cannot widen the page. */
	let settled = $state(true);
	let host: HTMLElement | undefined = $state();

	$effect(() => {
		const el = host;
		const wait = Math.max(0, delay);
		const repeat = !once;
		if (!el || reduced.current || typeof IntersectionObserver === 'undefined') {
			phase = 'shown';
			settled = true;
			return;
		}
		let failsafe: ReturnType<typeof setTimeout> | undefined;
		const show = (): void => {
			phase = 'shown';
			clearTimeout(failsafe);
			failsafe = setTimeout(() => (settled = true), wait + 1500);
		};
		const hide = (): void => {
			clearTimeout(failsafe);
			settled = false;
			phase = 'hidden';
		};
		hide();
		let stop = (): void => {};
		stop = observeInView(
			el,
			(visible) => {
				if (visible) {
					show();
					if (!repeat) stop();
				} else if (repeat) {
					hide();
				}
			},
			{ threshold }
		);
		const onFocus = (): void => {
			show();
			if (!repeat) stop();
		};
		el.addEventListener('focusin', onFocus);
		return () => {
			stop();
			clearTimeout(failsafe);
			el.removeEventListener('focusin', onFocus);
			phase = 'shown';
			settled = true;
		};
	});
</script>

<div class="k-reveal {cls}" bind:this={host} data-dir={direction} data-settled={settled ? '' : undefined}>
	<div
		class="inner"
		data-phase={phase}
		style:transition-delay={phase === 'shown' ? `${Math.max(0, delay)}ms` : '0ms'}
		ontransitionend={(e) => {
			if (e.target === e.currentTarget && phase === 'shown') settled = true;
		}}
	>
		{@render children?.()}
	</div>
</div>

<style>
	.k-reveal {
		display: block;
		min-width: 0;
	}
	.k-reveal:is([data-dir='left'], [data-dir='right']):not([data-settled]) {
		overflow-x: clip;
	}
	.inner {
		transition:
			opacity calc(var(--k-dur) * 4) var(--k-ease),
			transform calc(var(--k-dur) * 4) var(--k-ease);
	}
	[data-dir='up'] {
		--k-reveal-x: 0px;
		--k-reveal-y: var(--k-space-6);
	}
	[data-dir='down'] {
		--k-reveal-x: 0px;
		--k-reveal-y: calc(var(--k-space-6) * -1);
	}
	[data-dir='left'] {
		--k-reveal-x: var(--k-space-6);
		--k-reveal-y: 0px;
	}
	[data-dir='right'] {
		--k-reveal-x: calc(var(--k-space-6) * -1);
		--k-reveal-y: 0px;
	}
	[data-dir='none'] {
		--k-reveal-x: 0px;
		--k-reveal-y: 0px;
	}
	/* Hiding is instant (no fade-out flash on load); only the reveal animates. */
	.inner[data-phase='hidden'] {
		opacity: 0;
		transform: translate3d(var(--k-reveal-x), var(--k-reveal-y), 0);
		transition: none;
	}
	@media (prefers-reduced-motion: reduce) {
		.inner {
			transition: none;
		}
		.inner[data-phase='hidden'] {
			opacity: 1;
			transform: none;
		}
	}
</style>
