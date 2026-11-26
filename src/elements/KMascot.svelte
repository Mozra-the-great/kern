<svelte:options
	customElement={{
		props: {
			name: { type: 'String' },
			src: { type: 'String' },
			base: { type: 'String' },
			cols: { type: 'Number' },
			rows: { type: 'Number' },
			scale: { type: 'Number' },
			compactScale: { type: 'Number', attribute: 'compact-scale' },
			animated: { type: 'String' },
			label: { type: 'String' }
		}
	}}
/>

<script lang="ts">
	/**
	 * Code pixel art (a mascot or any shipped SVG) through <img>, at whole-number scales,
	 * with a transform-only idle bob that pauses off-screen, in hidden tabs and under reduced motion.
	 * @prop name A mascot name (stuffy, mochi, hop, bun, bloop, waddle, ember, boo, cumulo), an alias (axo, axolotl, cat, frog, bunny, jelly, jellyfish, penguin, fox, ghost, cloudy, cloud) or a path under assets/code/ without .svg (tool-stickers/sticker-qr).
	 * @prop src URL of the SVG file (same origin); wins over base.
	 * @prop base URL where the assets/code/ folder is served; with name it gives the file URL.
	 * @prop cols Art pixels across (viewBox width); needed for art outside the catalogue.
	 * @prop rows Art pixels down (viewBox height).
	 * @prop scale Whole CSS pixels per art pixel (default 8).
	 * @prop compactScale Scale at max-width 760px; defaults to scale.
	 * @prop animated animated="false" shows the still pose only.
	 * @prop label Text alternative; without it the art is decorative (alt="", aria-hidden).
	 */
	import Mascot, { type MascotArt } from '../lib/components/Mascot.svelte';
	let { name, src, base, cols, rows, scale, compactScale, animated, label } = $props();
	const art = $derived((name || undefined) as MascotArt | undefined);
	const moving = $derived(animated === undefined || animated === null || (animated !== false && animated !== 'false'));
</script>

<Mascot
	name={art}
	src={src || undefined}
	base={base || undefined}
	cols={cols ?? undefined}
	rows={rows ?? undefined}
	scale={scale ?? undefined}
	compactScale={compactScale ?? undefined}
	animated={moving}
	label={label ?? undefined}
/>

<style>
	:host {
		display: inline-block;
		line-height: 0;
		vertical-align: bottom;
	}
</style>
