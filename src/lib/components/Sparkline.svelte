<script lang="ts">
	import { formatLocale, strings } from './strings.svelte.js';
	import { fill, numberFormat } from './data-utils.js';

	interface Props {
		values: number[];
		/** `line`, `area` (line with a filled area) or `bar`. */
		variant?: 'line' | 'area' | 'bar' | undefined;
		/** Lower end of the scale. Default: the smallest value (bars: 0 or the smallest value if negative). */
		min?: number | undefined;
		/** Upper end of the scale. Default: the largest value. */
		max?: number | undefined;
		/** Accessible summary. Placeholders: {first} {last} {min} {max} {count}. */
		label?: string | undefined;
		/** Accessible text when there are no values. */
		emptyLabel?: string | undefined;
		/** Mark the last value with a dot (line and area). */
		showLast?: boolean | undefined;
		/** Height in pixels. The width fills the container unless `width` is set. */
		height?: number | undefined;
		/** CSS length, or a number of pixels. */
		width?: string | number | undefined;
		/** Locale of the numbers in the summary. Default: the chosen strings language, else the browser's. */
		locale?: string | undefined;
		class?: string | undefined;
	}
	let {
		values,
		variant = 'line',
		min,
		max,
		label: labelProp,
		emptyLabel: emptyLabelProp,
		showLast = true,
		height = 32,
		width,
		locale: localeProp,
		class: cls = ''
	}: Props = $props();
	const locale = $derived(formatLocale(localeProp));
	const label = $derived(labelProp ?? strings().sparkline.label);
	const emptyLabel = $derived(emptyLabelProp ?? strings().sparkline.emptyLabel);

	const data = $derived((values ?? []).filter((v) => typeof v === 'number' && Number.isFinite(v)));
	const lo = $derived.by((): number => {
		if (typeof min === 'number' && Number.isFinite(min)) return min;
		const m = Math.min(...data);
		return variant === 'bar' ? Math.min(0, m) : m;
	});
	const hi = $derived.by((): number => {
		if (typeof max === 'number' && Number.isFinite(max)) return max;
		return Math.max(...data);
	});
	/** 0 = bottom, 100 = top. A flat series sits in the middle. */
	function pos(v: number): number {
		const span = hi - lo;
		if (!(span > 0)) return 50;
		return Math.max(0, Math.min(100, ((v - lo) / span) * 100));
	}
	const xs = (i: number): number => (data.length > 1 ? (i / (data.length - 1)) * 100 : 50);

	const linePath = $derived.by((): string => {
		if (data.length === 0) return '';
		if (data.length === 1) return `M0 ${100 - pos(data[0])}L100 ${100 - pos(data[0])}`;
		return data.map((v, i) => `${i === 0 ? 'M' : 'L'}${xs(i).toFixed(2)} ${(100 - pos(v)).toFixed(2)}`).join('');
	});
	const areaPath = $derived(linePath ? `${linePath}L100 100L0 100Z` : '');
	const bars = $derived.by(() => {
		const slot = 100 / Math.max(1, data.length);
		return data.map((v, i) => {
			const h = Math.max(2, pos(v));
			return { x: i * slot + slot * 0.15, w: slot * 0.7, y: 100 - h, h };
		});
	});
	const lastTop = $derived(data.length ? 100 - pos(data[data.length - 1]) : 0);

	const accessibleName = $derived.by((): string => {
		if (data.length === 0) return emptyLabel;
		const nf = numberFormat(locale, { maximumFractionDigits: 2 });
		return fill(label, {
			first: nf.format(data[0]),
			last: nf.format(data[data.length - 1]),
			min: nf.format(Math.min(...data)),
			max: nf.format(Math.max(...data)),
			count: data.length
		});
	});
	const css = (v: string | number | undefined): string | undefined => (typeof v === 'number' ? `${v}px` : v);
</script>

<span class="k-sparkline {cls}" data-variant={variant} style:height="{Math.max(8, height)}px" style:width={css(width)}>
	<svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label={accessibleName}>
		{#if variant === 'bar'}
			{#each bars as b, i (i)}
				<rect x={b.x} y={b.y} width={b.w} height={b.h} />
			{/each}
		{:else}
			{#if variant === 'area' && areaPath}<path class="area" d={areaPath} />{/if}
			{#if linePath}<path class="line" d={linePath} />{/if}
		{/if}
	</svg>
	{#if showLast && variant !== 'bar' && data.length > 0}
		<span class="dot" style:top="calc({lastTop}% - 3px)" aria-hidden="true"></span>
	{/if}
</span>

<style>
	.k-sparkline {
		position: relative;
		display: block;
		max-width: 100%;
		color: var(--k-accent-text, var(--k-fg));
	}
	svg {
		display: block;
		width: 100%;
		height: 100%;
		overflow: visible;
	}
	[data-variant='line'] svg,
	[data-variant='area'] svg {
		width: calc(100% - 6px);
		margin-inline: 3px;
	}
	.line {
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
		stroke-linejoin: round;
		stroke-linecap: round;
		vector-effect: non-scaling-stroke;
	}
	.area {
		fill: color-mix(in srgb, currentColor 22%, transparent);
		stroke: none;
	}
	rect {
		fill: currentColor;
	}
	.dot {
		position: absolute;
		right: 0;
		width: 6px;
		height: 6px;
		border-radius: var(--k-radius-avatar);
		background: currentColor;
		box-shadow: 0 0 0 2px var(--k-bg-raised);
	}
	@media (forced-colors: active) {
		.line {
			stroke: CanvasText;
		}
		.area {
			fill: CanvasText;
			fill-opacity: 0.25;
		}
		rect {
			fill: CanvasText;
		}
		.dot {
			forced-color-adjust: none;
			background: CanvasText;
			box-shadow: none;
		}
	}
</style>
