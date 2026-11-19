<script lang="ts">
	import { formatLocale } from './strings.svelte.js';
	import { untrack } from 'svelte';
	import { makeNumberFormatter, observeInView, useReducedMotion, wholeNumberOptions } from './motion.svelte.js';

	interface Props {
		/** Target number. A new value counts on from the number currently shown. */
		value: number;
		/** Start number of the first run. */
		from?: number | undefined;
		/** Milliseconds the count takes. */
		duration?: number | undefined;
		/** `Intl.NumberFormat` options, e.g. `{ style: 'currency', currency: 'EUR' }`. */
		format?: Intl.NumberFormatOptions | undefined;
		/** BCP 47 locale of the number format. Default: the language chosen with `setStrings`/`setLocale`, else the browser's. */
		locale?: string | undefined;
		/** Wait until the number is scrolled into view. */
		startInView?: boolean | undefined;
		/** Fires when a count reaches its value. */
		oncomplete?: (() => void) | undefined;
		class?: string | undefined;
	}
	let { value, from = 0, duration = 1600, format, locale: localeProp, startInView = true, oncomplete, class: cls = '' }: Props = $props();
	const locale = $derived(formatLocale(localeProp));

	const reduced = useReducedMotion();
	const formatter = $derived(makeNumberFormatter(locale, wholeNumberOptions(format, Number.isInteger(value) && Number.isInteger(from))));
	/* Number shown while counting; null = the final value (also without JS and with reduced motion). */
	let current: number | null = $state(null);
	let started = $state(false);
	let host: HTMLElement | undefined = $state();
	let lastValue: number | undefined;

	const finalText = $derived(formatter.format(value));
	const shownText = $derived(current === null ? finalText : formatter.format(current));

	$effect(() => {
		if (!startInView) {
			started = true;
			return;
		}
		const el = host;
		if (!el) return;
		return observeInView(
			el,
			(visible) => {
				if (visible) started = true;
			},
			{ threshold: 0.1 }
		);
	});

	const easeOut = (t: number): number => 1 - Math.pow(1 - t, 3);

	$effect(() => {
		const to = value;
		const begin = from;
		const ms = Math.max(0, duration);
		if (reduced.current) {
			current = null;
			lastValue = to;
			return;
		}
		if (!started) {
			current = begin;
			return;
		}
		const origin = untrack(() => current) ?? lastValue ?? begin;
		if (origin === to || ms === 0) {
			current = null;
			lastValue = to;
			return;
		}

		const t0 = performance.now();
		let frame = 0;
		const tick = (): void => {
			const progress = Math.min(1, (performance.now() - t0) / ms);
			current = origin + (to - origin) * easeOut(progress);
			if (progress < 1) {
				frame = requestAnimationFrame(tick);
				return;
			}
			current = null;
			lastValue = to;
			oncomplete?.();
		};
		frame = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(frame);
	});
</script>

<span class="k-countup {cls}" bind:this={host}>
	<span class="sr">{finalText}</span>
	<!-- The final number, invisible, reserves the width of the finished count. -->
	<span class="size" aria-hidden="true">{finalText}</span>
	<span class="live" aria-hidden="true">{shownText}</span>
</span>

<style>
	.k-countup {
		display: inline-grid;
		font-variant-numeric: tabular-nums;
		vertical-align: bottom;
	}
	.size,
	.live {
		grid-area: 1 / 1;
		white-space: nowrap;
	}
	.size {
		visibility: hidden;
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
