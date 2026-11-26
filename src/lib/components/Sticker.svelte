<script lang="ts">
	import { normaliseScale } from './mascots.js';
	import { isStickerName, stickerGrid, stickerUrl, type StickerName } from './stickers.js';

	interface Props {
		/** The sticker: one of `STICKER_NAMES` (`qr`, `pdf-merge`). Anything else draws nothing. */
		name: StickerName;
		/** URL of the SVG file (same origin, a file, not a `data:` URI). Wins over `base`. */
		src?: string | undefined;
		/** URL where the `assets/code/` folder is served; with `name` it gives the file URL. */
		base?: string | undefined;
		/** Whole CSS pixels per art pixel (fractions are cut off, minimum 1). */
		scale?: number | undefined;
		/** Scale on phones (max-width 760px); defaults to `scale`. */
		compactScale?: number | undefined;
		/** Text alternative; leave unset for the usual decorative sticker (hidden from assistive tech). */
		label?: string | undefined;
		class?: string | undefined;
	}

	let { name, src, base, scale = 4, compactScale, label, class: cls = '' }: Props = $props();

	// A plain-JS caller may pass a name that is not a sticker: nothing is drawn, nothing throws.
	const known = $derived(isStickerName(name));
	const grid = $derived(known ? stickerGrid(name) : undefined);
	const url = $derived(src ?? (known && base !== undefined ? stickerUrl(base, name) : undefined));
	const factor = $derived(normaliseScale(scale));
	const compactFactor = $derived(compactScale === undefined ? factor : normaliseScale(compactScale));
	const cols = $derived(grid?.cols ?? 0);
	const rows = $derived(grid?.rows ?? 0);
	const decorative = $derived(label === undefined || label === '');
</script>

<span
	class="k-sticker {cls}"
	data-sticker={known ? name : undefined}
	style:--cols={cols}
	style:--rows={rows}
	style:--scale={factor}
	style:--scale-compact={compactFactor}
>
	{#if url !== undefined && known}
		<img
			src={url}
			alt={decorative ? '' : label}
			aria-hidden={decorative ? 'true' : undefined}
			width={cols * factor}
			height={rows * factor}
			decoding="async"
			draggable="false"
		/>
	{/if}
</span>

<style>
	/* The art keeps its own colours (it is drawn for a dark panel and never follows the theme): no
	   token is read here. A sticker is a picture, never a control: no focus, no pointer behaviour. */
	.k-sticker {
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

	@media (max-width: 760px) {
		.k-sticker {
			width: calc(var(--cols) * var(--scale-compact) * 1px);
			height: calc(var(--rows) * var(--scale-compact) * 1px);
		}
	}
</style>
