<script lang="ts">
	/* Pixel-art runtime (#55): the stuffcloud cast through <Mascot>. The SVGs come in as file URLs
	 * (`?url`; vite.config.ts never inlines them as data: URIs, as a strict CSP needs). */
	import Mascot from '../../lib/components/Mascot.svelte';
	import Switch from '../../lib/components/Switch.svelte';
	import { MASCOT_NAMES, MASCOT_SOURCES, artPath, type MascotName } from '../../lib/components/mascots.js';
	import type { MascotArt } from '../../lib/components/Mascot.svelte';

	const files = import.meta.glob<string>('../../../assets/stuffcloud/*/*.svg', { eager: true, query: '?url', import: 'default' });
	function urlOf(name: MascotArt): string | undefined {
		const path = artPath(name);
		return path === undefined ? undefined : files[`../../../assets/stuffcloud/${path}.svg`];
	}

	const animals: Record<MascotName, string> = {
		stuffy: 'Axolotl',
		mochi: 'Katze',
		hop: 'Frosch',
		bun: 'Hase',
		bloop: 'Qualle',
		waddle: 'Pinguin',
		ember: 'Fuchs',
		boo: 'Geist',
		cumulo: 'Wolke'
	};
	const stickers: MascotArt[] = ['tool-stickers/sticker-qr', 'tool-stickers/sticker-shield', 'tool-stickers/sticker-pdf-merge', 'seasonal/deco-sun'];

	let animated = $state(true);
</script>

<section>
	<h2>Maskottchen</h2>
	<p class="lead">
		<code>&lt;Mascot&gt;</code> zeigt jede Stuffcloud-Pixel-Art als <code>&lt;img&gt;</code> in ganzzahligen
		Skalen. Das Wippen ist nur <code>transform</code> mit <code>steps(1)</code>, pausiert außerhalb des Bildes
		und in Hintergrund-Tabs und steht bei reduzierter Bewegung still.
	</p>
	<Switch label="Bewegung" bind:checked={animated} />
	<ul class="cast">
		{#each MASCOT_NAMES as name (name)}
			<li>
				<span class="tile"><Mascot {name} src={urlOf(name)} scale={5} compactScale={4} {animated} /></span>
				<span class="name">{name}</span>
				<span class="file">{MASCOT_SOURCES[name].file}.svg</span>
				<span class="animal">{animals[name]}</span>
			</li>
		{/each}
	</ul>
	<div class="row">
		<span class="tile wide">
			<Mascot name="stuffy" src={urlOf('stuffy')} scale={16} compactScale={10} {animated} label="Stuffy, das Axolotl" />
		</span>
		<div class="stack">
			<span class="muted">Skala 16, auf dem Handy 10 · mit <code>label</code> ein benanntes Bild</span>
			<div class="row">
				{#each stickers as art (art)}
					<span class="tile"><Mascot name={art} src={urlOf(art)} scale={5} animated={false} /></span>
				{/each}
			</div>
			<span class="muted">Sticker und Deko über ihren Pfad, still (<code>animated=&#123;false&#125;</code>)</span>
		</div>
	</div>
</section>

<style>
	section { display: grid; gap: var(--k-space-5); padding: var(--k-space-8) 0; border-bottom: var(--k-border-w) solid var(--k-line); }
	h2 { margin: 0; font-family: var(--k-label-font); font-size: var(--k-label-size); font-weight: var(--k-weight-label); text-transform: var(--k-label-transform); letter-spacing: var(--k-label-tracking); color: var(--k-fg-muted); }
	.lead { margin: 0; max-width: 60ch; color: var(--k-fg-muted); }
	code { font-family: var(--k-font-mono); font-size: 0.9em; }
	.muted { color: var(--k-fg-muted); font-size: var(--k-text-sm); }
	.row { display: flex; flex-wrap: wrap; align-items: center; gap: var(--k-space-3); }
	.stack { display: grid; gap: var(--k-space-3); align-content: start; min-width: 0; }
	.cast { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: var(--k-space-3); margin: 0; padding: 0; list-style: none; }
	li { display: grid; gap: var(--k-space-1); align-content: start; justify-items: center; min-width: 0; text-align: center; }
	.tile {
		display: grid;
		place-items: center;
		min-width: 0;
		padding: var(--k-space-4);
		border: var(--k-border-w) solid var(--k-line);
		border-radius: min(var(--k-radius-card), 16px);
		/* Fixed dark panel on purpose, as in the asset gallery: the art is drawn for stuffcloud's
		 * dark panel and its colours do not follow the theme. */
		background: #17171a;
	}
	li .tile { width: 100%; box-sizing: border-box; height: 96px; padding: var(--k-space-2); }
	.wide { padding: var(--k-space-6); }
	.name { font-family: var(--k-font-mono); font-size: var(--k-text-sm); color: var(--k-fg); }
	.file { max-width: 100%; overflow-wrap: anywhere; font-family: var(--k-font-mono); font-size: var(--k-text-xs); color: var(--k-fg-muted); }
	.animal { font-size: var(--k-text-xs); color: var(--k-fg-muted); }
</style>
