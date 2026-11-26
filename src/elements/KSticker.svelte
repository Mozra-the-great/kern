<svelte:options
	customElement={{
		props: {
			name: { type: 'String' },
			src: { type: 'String' },
			base: { type: 'String' },
			scale: { type: 'Number' },
			compactScale: { type: 'Number', attribute: 'compact-scale' },
			label: { type: 'String' }
		}
	}}
/>

<script lang="ts">
	/**
	 * One tool sticker (pixel art) through <img>, at whole-number scales, in the art's own colours.
	 * Still, decorative by default.
	 * @prop name The sticker (qr, pdf-merge, json, ...); the 42 names of STICKER_NAMES.
	 * @prop src URL of the SVG file (same origin); wins over base.
	 * @prop base URL where the assets/code/ folder is served; with name it gives the file URL.
	 * @prop scale Whole CSS pixels per art pixel (default 4).
	 * @prop compactScale Scale at max-width 760px; defaults to scale.
	 * @prop label Text alternative; without it the sticker is decorative (alt="", aria-hidden).
	 */
	import Sticker from '../lib/components/Sticker.svelte';
	import type { StickerName } from '../lib/components/stickers.js';
	let { name, src, base, scale, compactScale, label } = $props();
	const art = $derived((name || '') as StickerName);
</script>

<Sticker
	name={art}
	src={src || undefined}
	base={base || undefined}
	scale={scale ?? undefined}
	compactScale={compactScale ?? undefined}
	label={label ?? undefined}
/>

<style>
	:host {
		display: inline-block;
		line-height: 0;
		vertical-align: bottom;
	}
</style>
