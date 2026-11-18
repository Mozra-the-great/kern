<script lang="ts">
	import { makeNumberFormatter, useReducedMotion } from './motion.svelte.js';

	interface Props {
		/** The number shown. When it changes the digits roll, up or down. */
		value: number;
		/** Milliseconds a digit takes to roll. */
		duration?: number;
		/** `Intl.NumberFormat` options, e.g. `{ minimumIntegerDigits: 4 }`. Only the digits 0-9 roll. */
		format?: Intl.NumberFormatOptions;
		/** BCP 47 locale of the number format. Defaults to the browser's. */
		locale?: string;
		class?: string;
	}
	let { value, duration = 700, format, locale, class: cls = '' }: Props = $props();

	const DIGITS: readonly number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
	const reduced = useReducedMotion();
	const text = $derived(makeNumberFormatter(locale, format).format(value));
	/* Staging text for columns that were just added: they start at 0 and roll to their digit. */
	let staged: string | null = $state(null);
	const cells = $derived(Array.from(staged ?? text));
	let previous: string | undefined;

	$effect(() => {
		const next = text;
		const before = previous;
		previous = next;
		staged = null;
		if (before === undefined || reduced.current || next.length <= before.length) return;
		/* The number got longer: new digit columns start at 0 and roll in. */
		const grown = next.length - before.length;
		staged = Array.from(next, (ch, i) => (i < grown && /[0-9]/.test(ch) ? '0' : ch)).join('');
		let outer = 0;
		let inner = 0;
		/* Two frames, so the browser paints the 0 state before the real digit is set. */
		outer = requestAnimationFrame(() => {
			inner = requestAnimationFrame(() => {
				staged = null;
			});
		});
		return () => {
			cancelAnimationFrame(outer);
			cancelAnimationFrame(inner);
			staged = null;
		};
	});
</script>

<span class="k-odometer {cls}" style:--k-odo-dur="{Math.max(0, duration)}ms">
	<span class="sr">{text}</span>
	<span class="cells" aria-hidden="true">
		{#each cells as ch, i (cells.length - 1 - i)}
			{#if /[0-9]/.test(ch)}
				<span class="col" style:--d={Number(ch)}>
					<span class="strip">{#each DIGITS as d (d)}<span class="digit">{d}</span>{/each}</span>
				</span>
			{:else}
				<span class="sep">{ch}</span>
			{/if}
		{/each}
	</span>
</span>

<style>
	.k-odometer {
		display: inline-block;
		font-family: var(--k-font-mono);
		font-variant-numeric: tabular-nums;
		line-height: 1.2;
		vertical-align: bottom;
		white-space: nowrap;
	}
	.cells { display: inline-flex; }
	.col { display: block; width: 1ch; height: 1.2em; overflow: hidden; }
	.sep { display: block; height: 1.2em; white-space: pre; }
	.strip {
		display: block;
		transform: translateY(calc(var(--d) * -1.2em));
		transition: transform var(--k-odo-dur) var(--k-ease);
	}
	.digit { display: block; height: 1.2em; text-align: center; }
	.sr {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}
	@media (prefers-reduced-motion: reduce) { .strip { transition: none; } }
</style>
