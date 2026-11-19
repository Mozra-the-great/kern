<script lang="ts" module>
	/** A point in time: a `Date`, epoch milliseconds, or text `Date.parse` understands (ISO 8601). */
	export type TimeInput = Date | number | string;

	const MINUTE = 60;
	const HOUR = 3600;
	const DAY = 86400;
	const MONTH = 30 * DAY;
	const YEAR = 365 * DAY;

	function toMs(input: TimeInput | undefined): number {
		if (input === undefined) return NaN;
		if (input instanceof Date) return input.getTime();
		return typeof input === 'number' ? input : Date.parse(input);
	}

	/** Picks the unit by size and cuts towards zero, so "59 minutes" never rounds up to "60 minutes". */
	function pickUnit(diffSeconds: number): { unit: Intl.RelativeTimeFormatUnit; amount: number } {
		const abs = Math.abs(diffSeconds);
		if (abs < MINUTE) return { unit: 'second', amount: Math.trunc(diffSeconds) };
		if (abs < HOUR) return { unit: 'minute', amount: Math.trunc(diffSeconds / MINUTE) };
		if (abs < DAY) return { unit: 'hour', amount: Math.trunc(diffSeconds / HOUR) };
		if (abs < MONTH) return { unit: 'day', amount: Math.trunc(diffSeconds / DAY) };
		if (abs < YEAR) return { unit: 'month', amount: Math.trunc(diffSeconds / MONTH) };
		return { unit: 'year', amount: Math.trunc(diffSeconds / YEAR) };
	}

	/** How often the text can change: every 10 s while it counts seconds, 30 s for minutes, 5 min beyond. */
	function refreshDelay(diffSeconds: number): number {
		const abs = Math.abs(diffSeconds);
		return abs < MINUTE ? 10_000 : abs < HOUR ? 30_000 : 300_000;
	}

	function relativeFormat(locale: string | undefined, options: Intl.RelativeTimeFormatOptions): Intl.RelativeTimeFormat {
		try {
			return new Intl.RelativeTimeFormat(locale, options);
		} catch {
			return new Intl.RelativeTimeFormat(undefined, options);
		}
	}
</script>

<script lang="ts">
	import { dateFormat } from './data-utils.js';

	interface Props {
		/** The moment to show. Invalid values render `fallback`. */
		value: TimeInput;
		locale?: string | undefined;
		/** `auto` writes "yesterday" and "now", `always` writes "1 day ago". */
		numeric?: 'always' | 'auto' | undefined;
		style?: 'long' | 'short' | 'narrow' | undefined;
		/** Format of the full date in the tooltip and for assistive technology. */
		absoluteFormat?: Intl.DateTimeFormatOptions | undefined;
		/** Fixed "now". The text then never updates; meant for tests and screenshots. */
		now?: TimeInput | undefined;
		/** Text for an invalid `value`. */
		fallback?: string | undefined;
		class?: string | undefined;
	}
	let {
		value,
		locale,
		numeric = 'auto',
		style = 'long',
		absoluteFormat = { dateStyle: 'full', timeStyle: 'medium' },
		now,
		fallback = '',
		class: cls = ''
	}: Props = $props();

	let tick = $state(Date.now());
	const target = $derived(toMs(value));
	const valid = $derived(Number.isFinite(target) && Math.abs(target) <= 8.64e15);
	const fixedNow = $derived(toMs(now));
	const live = $derived(!Number.isFinite(fixedNow));
	const nowMs = $derived(live ? tick : fixedNow);
	const diff = $derived((target - nowMs) / 1000);

	const relative = $derived.by((): string => {
		if (!valid) return fallback;
		const { unit, amount } = pickUnit(diff);
		return relativeFormat(locale, { numeric, style }).format(amount, unit);
	});
	const absolute = $derived(valid ? dateFormat(locale, absoluteFormat).format(target) : '');
	const iso = $derived(valid ? new Date(target).toISOString() : undefined);
	const delay = $derived(refreshDelay(diff));

	/* A new value must not be measured against a stale clock. */
	$effect(() => {
		void target;
		tick = Date.now();
	});

	/* Keeps the text current. Timers exist only in the browser, after mount. */
	$effect(() => {
		if (!valid || !live) return;
		const timer = setInterval(() => (tick = Date.now()), delay);
		const onVisible = (): void => {
			if (document.visibilityState === 'visible') tick = Date.now();
		};
		document.addEventListener('visibilitychange', onVisible);
		return () => {
			clearInterval(timer);
			document.removeEventListener('visibilitychange', onVisible);
		};
	});
</script>

{#if valid}
	<time class="k-relative-time {cls}" datetime={iso} title={absolute}>{relative}<span class="sr">, {absolute}</span></time>
{:else if fallback}
	<span class="k-relative-time {cls}">{fallback}</span>
{/if}

<style>
	.k-relative-time {
		font-variant-numeric: tabular-nums;
	}
	time {
		position: relative;
	}
	@media (hover: hover) {
		time {
			text-decoration: underline dotted;
			text-decoration-color: var(--k-border);
			text-underline-offset: 0.2em;
		}
	}
	.sr {
		position: absolute;
		width: 1px;
		height: 1px;
		margin: -1px;
		padding: 0;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
		border: 0;
	}
</style>
