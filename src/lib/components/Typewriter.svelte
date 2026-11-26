<script lang="ts">
	import Caret from './Caret.svelte';
	import { graphemes, useReducedMotion } from './motion.svelte.js';

	interface Props {
		/** Text to type. With several strings each one is typed, held, erased and replaced by the next. */
		text: string | readonly string[];
		/** Milliseconds per typed character. */
		speed?: number | undefined;
		/** Milliseconds per erased character. Defaults to half of `speed`. */
		eraseSpeed?: number | undefined;
		/** Milliseconds before typing starts. */
		delay?: number | undefined;
		/** Milliseconds a finished string stays before it is erased. */
		hold?: number | undefined;
		/** Keep cycling (and erase the last string too). Without it the last string stays. */
		loop?: boolean | undefined;
		/** Show a caret after the text. */
		caret?: boolean | undefined;
		caretShape?: 'block' | 'bar' | 'underline' | undefined;
		/** Text for assistive technology. Defaults to all strings, joined with ". ". */
		label?: string | undefined;
		/** Fires once when the last string is typed (never with `loop`). */
		oncomplete?: (() => void) | undefined;
		class?: string | undefined;
	}
	let {
		text,
		speed = 60,
		eraseSpeed,
		delay = 0,
		hold = 1600,
		loop = false,
		caret = true,
		caretShape = 'bar',
		label,
		oncomplete,
		class: cls = ''
	}: Props = $props();

	const reduced = useReducedMotion();
	const list = $derived<readonly string[]>(Array.isArray(text) ? (text as readonly string[]) : [text as string]);
	/* What is shown without JS, with reduced motion, and until the animation starts. */
	const finalText = $derived((loop ? list[0] : list[list.length - 1]) ?? '');
	let typed: string | null = $state(null);
	let busy = $state(false);
	const visible = $derived(typed ?? finalText);
	const spoken = $derived(label ?? list.join('. '));

	$effect(() => {
		const strings = list.map(graphemes);
		const typeMs = Math.max(0, speed);
		const eraseMs = Math.max(0, eraseSpeed ?? speed / 2);
		const startMs = Math.max(0, delay);
		const holdMs = Math.max(0, hold);
		const cycle = loop;
		if (reduced.current || strings.length === 0) {
			typed = null;
			busy = false;
			return;
		}

		let stopped = false;
		let timer: ReturnType<typeof setTimeout> | undefined;
		const sleep = (ms: number): Promise<void> =>
			new Promise((resolve) => {
				timer = setTimeout(resolve, ms);
			});

		async function run(): Promise<void> {
			typed = '';
			await sleep(startMs);
			let i = 0;
			while (!stopped) {
				const chars = strings[i] ?? [];
				busy = true;
				for (let n = 1; n <= chars.length; n++) {
					typed = chars.slice(0, n).join('');
					await sleep(typeMs);
					if (stopped) return;
				}
				busy = false;
				if (i === strings.length - 1 && !cycle) {
					oncomplete?.();
					return;
				}
				await sleep(holdMs);
				if (stopped) return;
				busy = true;
				for (let n = chars.length - 1; n >= 0; n--) {
					typed = chars.slice(0, n).join('');
					await sleep(eraseMs);
					if (stopped) return;
				}
				await sleep(Math.min(400, holdMs / 3));
				i = (i + 1) % strings.length;
			}
		}
		void run();

		return () => {
			stopped = true;
			clearTimeout(timer);
			busy = false;
		};
	});
</script>

<span class="k-typewriter {cls}">
	<span class="sr">{spoken}</span>
	<!-- Every string, invisible, in the same grid cell: the box keeps the size of the longest one. -->
	{#each list as item, i (i)}
		<span class="size" aria-hidden="true">
			{item}{#if caret}<span class="gap" data-shape={caretShape}></span>{/if}
		</span>
	{/each}
	<span class="live" aria-hidden="true">
		{visible}{#if caret}<Caret shape={caretShape} blink={!busy} />{/if}
	</span>
</span>

<style>
	.k-typewriter {
		display: inline-grid;
		max-width: 100%;
		vertical-align: bottom;
	}
	.size,
	.live {
		grid-area: 1 / 1;
		white-space: pre-wrap;
		overflow-wrap: anywhere;
	}
	.size {
		visibility: hidden;
	}
	.gap {
		display: inline-block;
		width: 0.6em;
	}
	.gap[data-shape='bar'] {
		width: max(2px, 0.1em);
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
