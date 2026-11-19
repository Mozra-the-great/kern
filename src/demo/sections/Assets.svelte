<script lang="ts">
	/* Brand asset gallery: every SVG under assets/, bundled into the demo by Vite. */
	const files = import.meta.glob<string>('../../../assets/*/*/*.svg', { eager: true, query: '?url', import: 'default' });

	interface Asset { brand: string; group: string; name: string; url: string }
	const assets: Asset[] = Object.entries(files)
		.map(([path, url]) => {
			const [brand, group, file] = path.split('/').slice(-3);
			return { brand, group, name: file.replace(/\.svg$/, ''), url };
		})
		.sort((a, b) => (a.brand + a.group + a.name).localeCompare(b.brand + b.group + b.name));

	const groupNames: Record<string, string> = {
		logo: 'Logo',
		mascots: 'Maskottchen',
		marks: 'Zeichen',
		'tool-stickers': 'Tool-Sticker',
		seasonal: 'Saison-Deko'
	};
	const groups = $derived(
		[...new Set(assets.map((a) => `${a.brand}/${a.group}`))].map((key) => ({
			key,
			brand: key.split('/')[0],
			label: groupNames[key.split('/')[1]] ?? key.split('/')[1],
			items: assets.filter((a) => `${a.brand}/${a.group}` === key)
		}))
	);
</script>

<section>
	<h2>Marken-Assets</h2>
	<p class="lead">
		Pixel-Art aus den Stuffcloud-Moodboards, im Paket unter <code>@mozra-the-great/kern/assets/stuffcloud/…</code>.
		Immer über <code>&lt;img&gt;</code> und in ganzzahligen Vielfachen zeigen, dann bleiben die Pixel scharf.
	</p>
	{#each groups as g (g.key)}
		<div class="group">
			<h3>{g.label} <span class="count">· {g.brand} · {g.items.length}</span></h3>
			<ul class="grid">
				{#each g.items as a (a.url)}
					<li>
						<span class="tile"><img src={a.url} alt="" loading="lazy" /></span>
						<span class="name">{a.name}</span>
					</li>
				{/each}
			</ul>
		</div>
	{/each}
</section>

<style>
	section { display: grid; gap: var(--k-space-5); padding: var(--k-space-8) 0; border-bottom: var(--k-border-w) solid var(--k-line); }
	h2 { margin: 0; font-family: var(--k-label-font); font-size: var(--k-label-size); font-weight: var(--k-weight-label); text-transform: var(--k-label-transform); letter-spacing: var(--k-label-tracking); color: var(--k-fg-muted); }
	.lead { margin: 0; max-width: 60ch; color: var(--k-fg-muted); }
	code { font-family: var(--k-font-mono); font-size: 0.9em; }
	.group { display: grid; gap: var(--k-space-3); }
	h3 { margin: 0; font-size: var(--k-text-md); font-weight: var(--k-weight-heading); }
	.count { color: var(--k-fg-muted); font-weight: 400; }
	.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(96px, 1fr)); gap: var(--k-space-3); margin: 0; padding: 0; list-style: none; }
	li { display: grid; gap: var(--k-space-1); justify-items: center; min-width: 0; }
	.tile {
		display: grid;
		place-items: center;
		width: 100%;
		aspect-ratio: 1;
		border: var(--k-border-w) solid var(--k-line);
		border-radius: min(var(--k-radius-card), 16px);
		/* Fixed dark panel on purpose: the pixel art is drawn for stuffcloud's dark `panel`
		 * (white pixels would vanish on light themes); its colours do not follow the theme either. */
		background: #17171a;
	}
	img { width: 64px; height: 64px; object-fit: contain; image-rendering: pixelated; }
	.name { max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-family: var(--k-font-mono); font-size: var(--k-text-xs); color: var(--k-fg-muted); }
</style>
