<script lang="ts">
	/* Tool stickers (#182): the 42 Code stickers through <Sticker>, grouped by category. The SVGs come in as
	 * file URLs (`?url`; vite.config.ts never inlines them as data: URIs, as a strict CSP needs). */
	import Sticker from '../../lib/components/Sticker.svelte';
	import {
		STICKER_CATEGORIES,
		stickerPath,
		stickersOfCategory,
		type StickerCategory,
		type StickerName
	} from '../../lib/components/stickers.js';

	const files = import.meta.glob<string>('../../../assets/code/tool-stickers/*.svg', { eager: true, query: '?url', import: 'default' });
	function urlOf(name: StickerName): string | undefined {
		return files[`../../../assets/code/${stickerPath(name)}.svg`];
	}

	const titles: Record<StickerCategory, string> = {
		pdf: 'PDF',
		images: 'Bilder',
		convert: 'Umwandeln',
		time: 'Zeit und Agenten',
		network: 'Netzwerk',
		text: 'Text und Generatoren',
		dev: 'Entwicklung',
		hosting: 'Hosting und Sonstiges'
	};
	const scales = [2, 4, 8];
</script>

<section>
	<h2>Sticker</h2>
	<p class="lead">
		<code>&lt;Sticker&gt;</code> zeigt einen der 42 Tool-Sticker über seinen Namen. Die Farben gehören der Grafik, nicht dem Theme: Sie
		bleiben in jedem Theme gleich. Ohne <code>label</code> ist ein Sticker Dekoration, mit <code>label</code> ein benanntes Bild.
	</p>
	<div class="row">
		{#each scales as scale (scale)}
			<span class="tile"><Sticker name="qr" src={urlOf('qr')} {scale} /></span>
		{/each}
		<span class="tile"><Sticker name="pdf-merge" src={urlOf('pdf-merge')} scale={6} compactScale={4} label="PDFs zusammenfügen" /></span>
		<span class="muted">Skala 2, 4 und 8, dann 6 mit <code>label</code> (auf dem Handy 4)</span>
	</div>
	{#each STICKER_CATEGORIES as category (category)}
		<h3>{titles[category]}</h3>
		<ul class="cast">
			{#each stickersOfCategory(category) as name (name)}
				<li>
					<span class="tile"><Sticker {name} src={urlOf(name)} scale={4} /></span>
					<span class="name">{name}</span>
				</li>
			{/each}
		</ul>
	{/each}
</section>

<style>
	section {
		display: grid;
		gap: var(--k-space-5);
		padding: var(--k-space-8) 0;
		border-bottom: var(--k-border-w) solid var(--k-line);
	}
	h2 {
		margin: 0;
		font-family: var(--k-label-font);
		font-size: var(--k-label-size);
		font-weight: var(--k-weight-label);
		text-transform: var(--k-label-transform);
		letter-spacing: var(--k-label-tracking);
		color: var(--k-fg-muted);
	}
	h3 {
		margin: 0;
		font-size: var(--k-text-sm);
		color: var(--k-fg);
	}
	.lead {
		margin: 0;
		max-width: 60ch;
		color: var(--k-fg-muted);
	}
	code {
		font-family: var(--k-font-mono);
		font-size: 0.9em;
	}
	.muted {
		color: var(--k-fg-muted);
		font-size: var(--k-text-sm);
	}
	.row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--k-space-3);
	}
	.cast {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(88px, 1fr));
		gap: var(--k-space-3);
		margin: 0;
		padding: 0;
		list-style: none;
	}
	li {
		display: grid;
		gap: var(--k-space-1);
		align-content: start;
		justify-items: center;
		min-width: 0;
		text-align: center;
	}
	.tile {
		display: grid;
		place-items: center;
		min-width: 0;
		padding: var(--k-space-3);
		border: var(--k-border-w) solid var(--k-line);
		border-radius: min(var(--k-radius-card), 16px);
		/* Fixed dark panel on purpose, as in the asset gallery: the art is drawn for the Code theme's
		 * dark panel and its colours do not follow the theme. */
		background: #17171a;
	}
	li .tile {
		width: 100%;
		box-sizing: border-box;
		height: 80px;
		padding: var(--k-space-2);
	}
	.name {
		max-width: 100%;
		overflow-wrap: anywhere;
		font-family: var(--k-font-mono);
		font-size: var(--k-text-xs);
		color: var(--k-fg-muted);
	}
</style>
