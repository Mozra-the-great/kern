<script lang="ts">
	import { graphemes, useReducedMotion } from './motion.svelte.js';

	interface Props {
		/** The text that is revealed. It is also what assistive technology reads, never the random glyphs. */
		text: string;
		/** Milliseconds until the last character is resolved. */
		duration?: number | undefined;
		/** Glyphs the unresolved characters cycle through. */
		glyphs?: string | undefined;
		/** Milliseconds between glyph changes. */
		interval?: number | undefined;
		/** Play again on pointer hover. */
		hover?: boolean | undefined;
		/** Fires when the text is fully resolved. */
		oncomplete?: (() => void) | undefined;
		class?: string | undefined;
	}
	let {
		text,
		duration = 900,
		glyphs = '!<>-_\\/[]{}=+*^?#%&$@',
		interval = 45,
		hover = false,
		oncomplete,
		class: cls = ''
	}: Props = $props();

	const reduced = useReducedMotion();
	const chars = $derived(graphemes(text));
	/* Per character: the glyph shown instead of it, or null once it is resolved. */
	let cover: (string | null)[] = $state([]);
	let host: HTMLElement | undefined = $state();
	let replay: (() => void) | undefined;

	$effect(() => {
		const target = chars;
		const pool = graphemes(glyphs);
		const length = Math.max(0, duration);
		const step = Math.max(16, interval);
		if (reduced.current || target.length === 0 || pool.length === 0 || length === 0) {
			cover = [];
			replay = undefined;
			return;
		}

		let frame = 0;
		const play = (): void => {
			cancelAnimationFrame(frame);
			const n = target.length;
			/* When each character resolves: roughly left to right, with some noise. */
			const resolveAt = target.map((ch, i) => (ch.trim() === '' ? 0 : (i / n) * length * 0.6 + Math.random() * length * 0.4));
			const start = performance.now();
			let lastSwap = -Infinity;
			let current: (string | null)[] = [];
			const pick = (): string => pool[Math.floor(Math.random() * pool.length)] ?? '#';

			const tick = (): void => {
				const now = performance.now();
				const elapsed = now - start;
				const swap = now - lastSwap >= step;
				if (swap) lastSwap = now;
				let open = 0;
				const next = target.map((_, i): string | null => {
					if (elapsed >= resolveAt[i]) return null;
					open++;
					return swap || current[i] == null ? pick() : current[i];
				});
				if (open === 0) {
					cover = [];
					oncomplete?.();
					return;
				}
				current = next;
				cover = next;
				frame = requestAnimationFrame(tick);
			};
			tick();
		};
		replay = play;
		play();

		return () => {
			cancelAnimationFrame(frame);
			replay = undefined;
		};
	});

	$effect(() => {
		const el = host;
		if (!el || !hover) return;
		const onEnter = (): void => replay?.();
		el.addEventListener('pointerenter', onEnter);
		return () => el.removeEventListener('pointerenter', onEnter);
	});
</script>

<span class="k-scramble {cls}" bind:this={host}>
	<span class="sr">{text}</span>
	<!-- Each character keeps the room of its real glyph, so the width never changes. -->
	<span class="vis" aria-hidden="true">
		{#each chars as ch, i (i)}<span class="c">
				<span class="f" class:cover={cover[i] != null}>{ch}</span>{#if cover[i] != null}<span class="g">{cover[i]}</span>{/if}
			</span>{/each}
	</span>
</span>

<style>
	.k-scramble {
		display: inline;
	}
	.c {
		position: relative;
	}
	.f.cover {
		visibility: hidden;
	}
	.g {
		position: absolute;
		top: 0;
		left: 50%;
		transform: translateX(-50%);
		color: var(--k-accent-text);
		white-space: pre;
	}
	.sr {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}
</style>
