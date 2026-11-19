<script lang="ts">
	import type { Snippet } from 'svelte';
	import { useReducedMotion } from './motion.svelte.js';

	interface Props {
		/** The content that loops. It is shown once to assistive technology; the repeats are hidden from it. */
		children?: Snippet | undefined;
		/** Pixels per second. */
		speed?: number | undefined;
		/** Direction the content moves. `up` and `down` make a vertical marquee. */
		direction?: 'left' | 'right' | 'up' | 'down' | undefined;
		/** Pause while the pointer is over the marquee. Keyboard focus inside always pauses it. */
		pauseOnHover?: boolean | undefined;
		/** Show a pause/play button (WCAG 2.2.2: moving content that lasts over 5 s needs one). */
		pausable?: boolean | undefined;
		/** Paused by the button. Bindable. */
		paused?: boolean | undefined;
		/** Space between the repeats. CSS length, or a number of pixels. */
		gap?: string | number | undefined;
		/** Height of a vertical marquee. CSS length, or a number of pixels. */
		height?: string | number | undefined;
		/** Fade the content out at both ends. */
		fade?: boolean | undefined;
		/** Accessible name of the region. Without it the marquee is not announced as a group. */
		label?: string | undefined;
		pauseLabel?: string | undefined;
		playLabel?: string | undefined;
		class?: string | undefined;
	}
	let {
		children,
		speed = 50,
		direction = 'left',
		pauseOnHover = true,
		pausable = true,
		paused = $bindable(),
		gap,
		height = '16rem',
		fade = false,
		label,
		pauseLabel = 'Pause',
		playLabel = 'Play',
		class: cls = ''
	}: Props = $props();

	const reduced = useReducedMotion();
	const css = (v: string | number | undefined): string | undefined => (typeof v === 'number' ? `${v}px` : v);
	const vertical = $derived(direction === 'up' || direction === 'down');
	const reverse = $derived(direction === 'right' || direction === 'down');

	let root: HTMLElement | undefined = $state();
	let viewport: HTMLElement | undefined = $state();
	let origin: HTMLElement | undefined = $state();
	/* Length of one repeat (content + gap) along the axis; the loop distance. */
	let shift = $state(0);
	let copies = $state(1);
	let textDir: 'ltr' | 'rtl' = $state('ltr');
	const running = $derived(shift > 0 && !reduced.current);
	const clones = $derived(Array.from({ length: Math.max(0, copies - 1) }, (_, i) => i));
	const seconds = $derived(Math.max(0.5, shift / Math.max(1, speed)));

	/* Measure one repeat and how many are needed to cover the viewport without a gap. */
	$effect(() => {
		const box = viewport;
		const first = origin;
		const axisY = vertical;
		if (!box || !first) return;
		const measure = (): void => {
			const rect = first.getBoundingClientRect();
			const length = axisY ? rect.height : rect.width;
			const room = axisY ? box.clientHeight : box.clientWidth;
			shift = length;
			/* Capped, so a tiny or unbounded measurement cannot create thousands of copies. */
			copies = length > 0 ? Math.min(40, Math.max(2, Math.ceil(room / length) + 1)) : 1;
			if (root) textDir = getComputedStyle(root).direction === 'rtl' ? 'rtl' : 'ltr';
		};
		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(box);
		observer.observe(first);
		return () => observer.disconnect();
	});

	/* The repeats are copies of the real content. A cloned DOM works for children rendered here
	 * and for slotted ones (custom element), where a second <slot> would stay empty. */
	$effect(() => {
		void copies;
		const first = origin;
		if (!first) return;
		const slot = first.querySelector('slot');
		const owner = first.getRootNode();
		const host = owner instanceof ShadowRoot ? owner.host : null;
		const sync = (): void => {
			const source: Node[] = slot ? slot.assignedNodes({ flatten: true }) : Array.from(first.childNodes);
			for (const clone of first.parentElement?.querySelectorAll<HTMLElement>(':scope > .clone') ?? []) {
				clone.replaceChildren(...source.map((node) => node.cloneNode(true)));
				for (const el of clone.querySelectorAll('[id]')) el.removeAttribute('id');
			}
		};
		sync();
		const watch = new MutationObserver(sync);
		const options: MutationObserverInit = { childList: true, subtree: true, characterData: true, attributes: true };
		watch.observe(first, options);
		if (host) watch.observe(host, options);
		slot?.addEventListener('slotchange', sync);
		return () => {
			watch.disconnect();
			slot?.removeEventListener('slotchange', sync);
		};
	});
</script>

<div
	class="k-marquee {cls}"
	bind:this={root}
	role={label ? 'group' : undefined}
	aria-label={label}
	data-axis={vertical ? 'y' : 'x'}
	class:running
	class:paused
	class:hoverpause={pauseOnHover}
	class:fade
	style:--k-marquee-gap={css(gap)}
	style:--k-marquee-height={css(height)}
	style:--k-marquee-dir={textDir}
>
	<div class="viewport" bind:this={viewport}>
		<div
			class="track"
			class:reverse
			style:--shift="{shift}px"
			style:--seconds="{seconds}s"
		>
			<div class="seq" bind:this={origin}>{@render children?.()}</div>
			{#each clones as c (c)}
				<div class="seq clone" aria-hidden="true" inert></div>
			{/each}
		</div>
	</div>
	{#if pausable && running}
		<button
			type="button"
			class="pause"
			aria-label={paused ? playLabel : pauseLabel}
			onclick={() => (paused = !paused)}
		>
			{#if paused}
				<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3l8 5-8 5z" fill="currentColor" /></svg>
			{:else}
				<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 3h3v10H4zM9 3h3v10H9z" fill="currentColor" /></svg>
			{/if}
		</button>
	{/if}
</div>

<style>
	.k-marquee {
		display: flex;
		align-items: center;
		gap: var(--k-space-3);
		min-width: 0;
		max-width: 100%;
	}
	/* The scrolling box clips at its own edges and never widens the page. */
	.viewport { flex: 1; min-width: 0; overflow: hidden; direction: ltr; }
	.track { display: flex; width: max-content; }
	.seq {
		display: flex;
		flex: none;
		align-items: center;
		gap: var(--k-marquee-gap, var(--k-space-6));
		padding-inline-end: var(--k-marquee-gap, var(--k-space-6));
		direction: var(--k-marquee-dir, ltr);
	}
	[data-axis='y'] { align-items: flex-start; }
	[data-axis='y'] .viewport { height: var(--k-marquee-height); }
	[data-axis='y'] .track { flex-direction: column; width: auto; }
	[data-axis='y'] .seq { flex-direction: column; align-items: stretch; padding-inline-end: 0; padding-block-end: var(--k-marquee-gap, var(--k-space-6)); }

	.running .track { animation: k-marquee-x var(--seconds) linear infinite; }
	.running[data-axis='y'] .track { animation-name: k-marquee-y; }
	.running .track.reverse { animation-direction: reverse; }
	@keyframes k-marquee-x { to { transform: translate3d(calc(var(--shift) * -1), 0, 0); } }
	@keyframes k-marquee-y { to { transform: translate3d(0, calc(var(--shift) * -1), 0); } }

	.paused .track,
	.hoverpause .viewport:hover .track,
	.viewport:focus-within .track { animation-play-state: paused; }

	.running.fade .viewport {
		-webkit-mask-image: linear-gradient(to right, transparent, #000 var(--k-space-8), #000 calc(100% - var(--k-space-8)), transparent);
		mask-image: linear-gradient(to right, transparent, #000 var(--k-space-8), #000 calc(100% - var(--k-space-8)), transparent);
	}
	.running.fade[data-axis='y'] .viewport {
		-webkit-mask-image: linear-gradient(to bottom, transparent, #000 var(--k-space-8), #000 calc(100% - var(--k-space-8)), transparent);
		mask-image: linear-gradient(to bottom, transparent, #000 var(--k-space-8), #000 calc(100% - var(--k-space-8)), transparent);
	}

	/* Without motion (not measured yet, no JS, reduced motion) everything is shown at rest, wrapped. */
	.k-marquee:not(.running) .viewport { overflow: visible; height: auto; }
	.k-marquee:not(.running) .track { display: block; width: auto; }
	.k-marquee:not(.running) .seq { flex-wrap: wrap; padding: 0; row-gap: var(--k-space-2); }
	.k-marquee:not(.running) .clone { display: none; }
	@media (prefers-reduced-motion: reduce) {
		.track { animation: none !important; transform: none; display: block; width: auto; }
		.viewport { overflow: visible; height: auto !important; -webkit-mask-image: none; mask-image: none; }
		.seq { flex-wrap: wrap; padding: 0; row-gap: var(--k-space-2); }
		.clone, .pause { display: none; }
	}

	.pause {
		display: inline-grid;
		box-sizing: border-box;
		place-items: center;
		flex: none;
		width: max(var(--k-control-h-sm), var(--k-tap-target));
		height: max(var(--k-control-h-sm), var(--k-tap-target));
		padding: 0;
		border: var(--k-border-w) solid var(--k-border);
		border-radius: var(--k-radius-control);
		background: transparent;
		color: var(--k-fg);
		cursor: pointer;
		transition: background-color var(--k-dur) var(--k-ease);
	}
	.pause:hover { background: var(--k-bg-sunken); }
	.pause:focus-visible { outline: var(--k-focus-w) solid var(--k-focus); outline-offset: var(--k-focus-offset); }
	.pause svg { width: 14px; height: 14px; }
</style>
