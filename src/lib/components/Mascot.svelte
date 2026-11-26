<script lang="ts" module>
	import type { CodeArt, MascotName } from './mascots.js';

	/** Motion state on `data-motion`: `running`, `paused` (off-screen or hidden tab) or `still`. */
	export type MascotMotion = 'running' | 'paused' | 'still';
	/** A mascot name (`stuffy`) or the path of any shipped SVG (`tool-stickers/sticker-qr`). */
	export type MascotArt = MascotName | CodeArt;
</script>

<script lang="ts">
	import { artPath, artUrl, mascotSize, normaliseScale, CODE_ART } from './mascots.js';
	import { observeInView } from './motion.svelte.js';

	interface Props {
		/** Shipped art: a mascot name (`stuffy`) or a path under `assets/code/` (`mascots/axo`). Gives the pixel grid, and the URL together with `base`. */
		name?: MascotArt | undefined;
		/** URL of the SVG file (same origin, a file, not a `data:` URI). Wins over `base`. */
		src?: string | undefined;
		/** URL where the `assets/code/` folder is served; with `name` it gives the file URL. */
		base?: string | undefined;
		/** Art pixels across (the SVG `viewBox` width). Needed for art outside the catalogue. */
		cols?: number | undefined;
		/** Art pixels down (the SVG `viewBox` height). */
		rows?: number | undefined;
		/** Whole CSS pixels per art pixel (fractions are cut off, minimum 1). */
		scale?: number | undefined;
		/** Scale on phones (max-width 760px); defaults to `scale`. */
		compactScale?: number | undefined;
		/** `false` shows the still pose only. Reduced-motion users always get the still pose. */
		animated?: boolean | undefined;
		/** Text alternative; leave unset for the usual decorative art (hidden from assistive tech). */
		label?: string | undefined;
		class?: string | undefined;
	}

	let { name, src, base, cols, rows, scale = 8, compactScale, animated = true, label, class: cls = '' }: Props = $props();

	const path = $derived(name === undefined ? undefined : artPath(name));
	const grid = $derived(path === undefined ? undefined : CODE_ART[path]);
	const width = $derived(normaliseScale(cols ?? grid?.cols ?? 0));
	const height = $derived(normaliseScale(rows ?? grid?.rows ?? 0));
	const url = $derived(src ?? (base !== undefined && path !== undefined ? artUrl(base, path) : undefined));
	const factor = $derived(normaliseScale(scale));
	const compactFactor = $derived(compactScale === undefined ? factor : normaliseScale(compactScale));
	// Intrinsic size: reserves the box before any CSS or image arrives (no layout shift).
	const size = $derived(mascotSize({ cols: width, rows: height }, factor));
	// eslint-disable-next-line @typescript-eslint/no-unnecessary-boolean-literal-compare -- plain-JS callers may pass null, which keeps the motion
	const moving = $derived(animated !== false);

	/** `bind:this` sets this to `null` on unmount: guard with `== null`. */
	let host: HTMLSpanElement | null | undefined = $state();
	let inView = $state(true);
	let pageVisible = $state(true);

	// Hidden tab: stop the idle motion (the animation clock must not run for nobody).
	$effect(() => {
		if (!moving) return;
		const sync = (): void => {
			pageVisible = document.visibilityState !== 'hidden';
		};
		sync();
		document.addEventListener('visibilitychange', sync);
		return () => document.removeEventListener('visibilitychange', sync);
	});

	// Off-screen: one observer callback per crossing, nothing per frame. Without
	// IntersectionObserver the art simply keeps running.
	$effect(() => {
		const el = host;
		if (!moving || el == null) return;
		const stop = observeInView(el, (visible) => (inView = visible));
		return () => {
			stop();
			inView = true;
		};
	});

	const motion: MascotMotion = $derived(!moving ? 'still' : inView && pageVisible ? 'running' : 'paused');
</script>

<span
	bind:this={host}
	class="k-mascot {cls}"
	data-mascot={name}
	data-motion={motion}
	style:--cols={width}
	style:--rows={height}
	style:--scale={factor}
	style:--scale-compact={compactFactor}
>
	{#if url !== undefined}
		<img
			src={url}
			alt={label ?? ''}
			aria-hidden={label === undefined ? 'true' : undefined}
			width={size.width}
			height={size.height}
			decoding="async"
			draggable="false"
		/>
	{/if}
</span>

<style>
	.k-mascot {
		display: inline-block;
		flex: none;
		vertical-align: bottom;
		width: calc(var(--cols) * var(--scale) * 1px);
		height: calc(var(--rows) * var(--scale) * 1px);
		line-height: 0;
	}

	img {
		display: block;
		width: 100%;
		height: 100%;
		image-rendering: pixelated;
		user-select: none;
	}

	/* Two poses, switched in one step (stuffcloud ADR 0008). A transform animation runs without
	   layout or paint work and never moves anything else on the page. */
	[data-motion='running'] img,
	[data-motion='paused'] img {
		animation: k-mascot-bob var(--k-mascot-bob-period, 1.2s) steps(1) infinite;
	}

	[data-motion='paused'] img {
		animation-play-state: paused;
	}

	@keyframes k-mascot-bob {
		0%,
		49% {
			transform: translateY(0);
		}

		50%,
		100% {
			transform: translateY(calc(var(--k-mascot-bob-offset, 4px) * -1));
		}
	}

	@media (max-width: 760px) {
		.k-mascot {
			width: calc(var(--cols) * var(--scale-compact) * 1px);
			height: calc(var(--rows) * var(--scale-compact) * 1px);
		}
	}

	/* Everything stops under prefers-reduced-motion (WCAG 2.3.3): the still pose. Decided in CSS,
	   so it follows a change of the setting without a reload. */
	@media (prefers-reduced-motion: reduce) {
		[data-motion] img {
			animation: none;
		}
	}
</style>
