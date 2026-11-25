<script lang="ts">
	/* Brand asset gallery: every SVG under assets/, bundled into the demo by Vite. */
	const files = import.meta.glob<string>('../../../assets/*/*/*.svg', { eager: true, query: '?url', import: 'default' });

	interface Asset {
		brand: string;
		group: string;
		name: string;
		url: string;
	}
	const assets: Asset[] = Object.entries(files)
		.map(([path, url]) => {
			const [brand, group, file] = path.split('/').slice(-3);
			return { brand, group, name: file.replace(/\.svg$/, ''), url };
		})
		.sort((a, b) => (a.brand + a.group + a.name).localeCompare(b.brand + b.group + b.name));

	interface Brand {
		id: string;
		title: string;
		text: string;
	}
	const brands: Brand[] = [
		{
			id: 'code',
			title: 'Code',
			text: 'Pixel-Art aus den Stuffcloud-Moodboards. Immer in ganzzahligen Vielfachen zeigen, dann bleiben die Pixel scharf.'
		},
		{
			id: 'pop',
			title: 'Pop',
			text: 'Vektor-Maskottchen, Outfits, Accessoires und Tool-Icons aus dem Pop-Designsystem, dazu Saison-Abzeichen aus dem Moodboard. Feste Farben, auch im Dunkelmodus.'
		},
		{
			id: 'line',
			title: 'Line',
			text: 'Strichzeichnungen aus dem Line-Designsystem und vom Line-Canvas. Die Figuren haben einen weißen Rand, damit sie auch auf dunklem Grund lesbar bleiben.'
		},
		{
			id: 'flower',
			title: 'Flower',
			text: 'Botanische Motive aus den Flower-Designs: Blüten, Blätter und Bäume in festen Farben, gemacht für einen cremefarbenen Grund. Dazu das Flower-Banner als Bild ohne Text: Pflanzen von allen Rändern, die Mitte bleibt frei. Es bringt seinen cremefarbenen Grund selbst mit.'
		}
	];

	const groupNames: Record<string, string> = {
		logo: 'Logo',
		mascots: 'Maskottchen',
		marks: 'Zeichen',
		'tool-stickers': 'Tool-Sticker',
		'tool-icons': 'Tool-Icons',
		outfits: 'Outfits',
		accessories: 'Accessoires',
		seasonal: 'Saison',
		illustrations: 'Illustrationen',
		blossoms: 'Blüten',
		leaves: 'Blätter und Zweige',
		trees: 'Bäume und Büsche',
		banners: 'Banner'
	};

	/** Groups of wide pictures: shown one per row at full width, in the size of their `viewBox`. */
	const wideGroups: Record<string, { width: number; height: number }> = {
		banners: { width: 1536, height: 650 }
	};

	const sections = $derived(
		brands.map((b) => {
			const mine = assets.filter((a) => a.brand === b.id);
			return {
				...b,
				count: mine.length,
				groups: [...new Set(mine.map((a) => a.group))].map((group) => ({
					group,
					label: groupNames[group] ?? group,
					wide: wideGroups[group],
					items: mine.filter((a) => a.group === group)
				}))
			};
		})
	);

	/** Twins drawn for a dark ground (Pop's `-dark` floaters, Line's `-white` mark) sit on a dark tile. */
	const darkTwin = (a: Asset): boolean => a.name.endsWith('-white') || (a.brand === 'pop' && a.name.endsWith('-dark'));
</script>

<section>
	<h2>Marken-Assets</h2>
	<p class="lead">
		Die Grafiken der Marken, im Paket unter <code>@mozra-the-great/kern/assets/&lt;marke&gt;/…</code>. Über
		<code>&lt;img alt=""&gt;</code> einbinden: Deko verdeckt keinen Inhalt und bekommt keinen Fokus. Die Farben folgen dem Theme nicht, deshalb
		liegt jede Marke hier auf ihrem eigenen Grund.
	</p>
	{#each sections as b (b.id)}
		<div class="brand" data-brand={b.id}>
			<h3>{b.title} <span class="count">· {b.count}</span></h3>
			<p class="text">{b.text}</p>
			{#each b.groups as g (g.group)}
				<div class="group">
					<h4>{g.label} <span class="count">· {g.items.length}</span></h4>
					<ul class="grid" class:wide={g.wide !== undefined}>
						{#each g.items as a (a.url)}
							<li>
								<span class="tile" class:dark={darkTwin(a)}>
									<img src={a.url} alt="" width={g.wide?.width} height={g.wide?.height} loading="lazy" decoding="async" />
								</span>
								<span class="name">{a.name}</span>
							</li>
						{/each}
					</ul>
				</div>
			{/each}
		</div>
	{/each}
</section>

<style>
	section {
		display: grid;
		gap: var(--k-space-6);
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
	.lead,
	.text {
		margin: 0;
		max-width: 60ch;
		color: var(--k-fg-muted);
	}
	code {
		font-family: var(--k-font-mono);
		font-size: 0.9em;
	}
	.brand,
	.group {
		display: grid;
		gap: var(--k-space-3);
		min-width: 0;
	}
	.brand {
		gap: var(--k-space-4);
	}
	h3 {
		margin: 0;
		font-size: var(--k-text-lg);
		font-weight: var(--k-weight-heading);
	}
	h4 {
		margin: 0;
		font-size: var(--k-text-md);
		font-weight: var(--k-weight-heading);
	}
	.count {
		color: var(--k-fg-muted);
		font-weight: 400;
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
		gap: var(--k-space-3);
		margin: 0;
		padding: 0;
		list-style: none;
	}
	li {
		display: grid;
		gap: var(--k-space-1);
		justify-items: center;
		min-width: 0;
	}
	/* Fixed grounds on purpose: the art keeps its colours in every theme, so each brand sits on
	 * the ground it was drawn for (Code's dark panel, Pop's light ground, Line's paper,
	 * Flower's cream); dark twins get a dark tile. */
	.tile {
		display: grid;
		place-items: center;
		width: 100%;
		aspect-ratio: 1;
		border: var(--k-border-w) solid var(--k-line);
		border-radius: min(var(--k-radius-card), 16px);
		background: #17171a;
	}
	[data-brand='pop'] .tile {
		background: #f3f4f1;
	}
	[data-brand='line'] .tile {
		background: #ffffff;
	}
	[data-brand='flower'] .tile {
		background: #f6f0e0;
	}
	[data-brand] .tile.dark {
		background: #0e100d;
	}
	img {
		width: 72px;
		height: 72px;
		object-fit: contain;
	}
	[data-brand='code'] img {
		width: 64px;
		height: 64px;
		image-rendering: pixelated;
	}
	/* A banner is one picture per row; it keeps its own ratio and fills the tile. */
	.grid.wide {
		grid-template-columns: minmax(0, 1fr);
	}
	.wide .tile {
		aspect-ratio: auto;
		overflow: hidden;
	}
	.wide img {
		width: 100%;
		height: auto;
	}
	.name {
		max-width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-family: var(--k-font-mono);
		font-size: var(--k-text-xs);
		color: var(--k-fg-muted);
	}
</style>
