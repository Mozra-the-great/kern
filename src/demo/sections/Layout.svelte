<script lang="ts">
	import ThemeToggle from '../../lib/components/ThemeToggle.svelte';
	import ProgressRing from '../../lib/components/ProgressRing.svelte';
	import Collapsible from '../../lib/components/Collapsible.svelte';
	import Resizable, { type ResizablePanel } from '../../lib/components/Resizable.svelte';
	import ScrollArea from '../../lib/components/ScrollArea.svelte';
	import Slider from '../../lib/components/Slider.svelte';
	import Badge from '../../lib/components/Badge.svelte';
	import Button from '../../lib/components/Button.svelte';
	import Switch from '../../lib/components/Switch.svelte';
	import { themes } from '../themes.js';

	// ThemeToggle: each demo box carries its own data-theme, so the page-wide picker stays untouched.
	let boxA: HTMLElement | undefined = $state();
	let boxB: HTMLElement | undefined = $state();
	let themeA = $state<string | undefined>();
	let themeB = $state<string | undefined>();

	// ProgressRing
	let percent = $state(64);
	let files = $state(3);
	let fades = $state(true);

	// Collapsible
	let faqOpen = $state(true);
	let moreOpen = $state(false);

	// Resizable
	const columns: ResizablePanel[] = [
		{ id: 'nav', label: 'Navigation', min: 15, max: 40 },
		{ id: 'main', label: 'Inhalt', min: 30 },
		{ id: 'aside', label: 'Details', min: 15, max: 40 }
	];
	let columnSizes = $state<number[]>([22, 56, 22]);
	const rows: ResizablePanel[] = [
		{ id: 'editor', label: 'Editor', min: 20 },
		{ id: 'log', label: 'Protokoll', min: 10, max: 60 }
	];
	let rowSizes = $state<number[]>([60, 40]);

	// ScrollArea
	const polishes = Array.from({ length: 24 }, (_, i) => `Lack Nr. ${i + 1}`);
	const chips = ['Mintgrün', 'Beerenrot', 'Nachtblau', 'Sandgold', 'Altrosa', 'Pfirsich', 'Salbei', 'Lavendel', 'Petrol', 'Kupfer', 'Elfenbein', 'Anthrazit'];
</script>

<section>
	<h2>ThemeToggle</h2>
	<p class="muted">Jede Fläche trägt ihr eigenes <code>data-theme</code>, die Umschalter wirken nur darauf.</p>
	<div class="grid2">
		<div class="theme-box" bind:this={boxA} data-theme="flower">
			<div class="row between">
				<strong>Hell / Dunkel</strong>
				<ThemeToggle target={boxA ?? null} bind:value={themeA} persist="kern-demo-theme-a" followSystem />
			</div>
			<p class="m0">Zwei Themen der aktuellen Marke, gemerkt im Browser; folgt dem System, bis du wählst.</p>
			<p class="m0 muted">Aktiv: <code>{themeA ?? '…'}</code></p>
			<div class="row"><Button size="sm">Speichern</Button><Badge tone="accent">Neu</Badge></div>
		</div>
		<div class="theme-box" bind:this={boxB} data-theme="stuffcloud">
			<div class="row between">
				<strong>Alle Themen</strong>
				<ThemeToggle target={boxB ?? null} themes={themes} bind:value={themeB} label="Theme dieser Fläche" />
			</div>
			<p class="m0">Ab drei Themen wird das Umschalten zu einer Auswahl.</p>
			<p class="m0 muted">Aktiv: <code>{themeB ?? '…'}</code></p>
			<div class="row"><Button size="sm" variant="secondary">Abbrechen</Button><Badge tone="ok">Verfügbar</Badge></div>
		</div>
	</div>
</section>

<section>
	<h2>ProgressRing</h2>
	<div class="grid2">
		<div class="stack">
			<Slider label="Fortschritt" bind:value={percent} min={0} max={100} showValue format={(v) => `${v} %`} />
			<div class="row">
				<ProgressRing label="Speicher" value={percent} size={40} thickness={4} />
				<ProgressRing label="Speicher" value={percent} showValue />
				<ProgressRing label="Speicher" value={percent} size={96} thickness={10} showValue />
			</div>
		</div>
		<div class="stack">
			<Slider label="Dateien" bind:value={files} min={0} max={5} showValue />
			<div class="row">
				<ProgressRing label="Dateien hochgeladen" value={files} max={5} size={80} valueText="{files} von 5 Dateien">
					<span class="centre-text">{files}/5</span>
				</ProgressRing>
				<ProgressRing label="Wird geladen" size={80} loadingText="Lädt" />
				<ProgressRing label="Wird geladen" size={32} thickness={4} />
			</div>
			<p class="muted m0">Mit „Bewegung reduzieren“ steht der unbestimmte Ring still und zeigt den Text.</p>
		</div>
	</div>
</section>

<section>
	<h2>Collapsible</h2>
	<div class="grid2">
		<div class="stack">
			<Collapsible label="Wie lange bleiben Links gültig?" bind:open={faqOpen}>
				<p>Sieben Tage. Danach wird die Freigabe automatisch beendet, die Dateien bleiben erhalten.</p>
			</Collapsible>
			<Collapsible label="Kann ich ein Passwort setzen?" look="plain" bind:open={moreOpen}>
				<p>Ja, in den Einstellungen der Freigabe. Das Passwort lässt sich jederzeit ändern.</p>
			</Collapsible>
			<p class="muted m0">Offen: Karte {faqOpen ? 'ja' : 'nein'}, Linie {moreOpen ? 'ja' : 'nein'}</p>
		</div>
		<div class="stack">
			<Collapsible>
				{#snippet trigger()}<span class="trigger-rich">Versand <Badge tone="info">2 neu</Badge></span>{/snippet}
				<p>Eigener Inhalt im Knopf: Text, Badge oder Icon.</p>
				<Button size="sm" variant="secondary">Verfolgen</Button>
			</Collapsible>
			<Collapsible label="Gesperrt" disabled><p>Nicht erreichbar.</p></Collapsible>
		</div>
	</div>
</section>

<section>
	<h2>Resizable</h2>
	<p class="muted">Griffe mit der Maus oder per Tab fokussieren: Pfeiltasten ändern um 2 %, Umschalt + Pfeil um 10 %, Pos1/Ende springen an die Grenzen, Enter klappt zu und wieder auf. Unter 520 px Breite stapeln sich die Spalten und die Griffe verschwinden.</p>
	<Resizable panels={columns} bind:sizes={columnSizes} height={240}>
		{#snippet panel(p)}
			<div class="pane"><strong>{p.label}</strong><p class="m0 muted">{p.min ?? 10} bis {p.max ?? 100} %</p></div>
		{/snippet}
	</Resizable>
	<p class="muted m0">Größen: {columnSizes.map((s) => `${Math.round(s)} %`).join(' · ')}</p>
	<Resizable panels={rows} direction="vertical" bind:sizes={rowSizes} height={300}>
		{#snippet panel(p)}
			<div class="pane"><strong>{p.label}</strong><p class="m0 muted">Stapel: Pfeil hoch/runter ändert die Höhe.</p></div>
		{/snippet}
	</Resizable>
</section>

<section>
	<h2>ScrollArea</h2>
	<Switch label="Verlauf an den Rändern" bind:checked={fades} />
	<div class="grid2">
		<div class="stack">
			<ScrollArea maxHeight={180} fade={fades} label="Lackliste">
				<ul class="list">
					{#each polishes as name (name)}<li>{name}</li>{/each}
				</ul>
			</ScrollArea>
			<p class="muted m0">Mit Tab fokussieren, dann mit Pfeiltasten scrollen.</p>
		</div>
		<div class="stack">
			<ScrollArea direction="horizontal" fade={fades} label="Farben">
				<div class="chips">
					{#each chips as c (c)}<span class="chip">{c}</span>{/each}
				</div>
			</ScrollArea>
			<ScrollArea maxHeight={72} label="Kurzer Inhalt"><p class="m0">Passt der Inhalt, wird nichts scrollbar und nichts fokussierbar.</p></ScrollArea>
		</div>
	</div>
</section>

<style>
	section { display: grid; gap: var(--k-space-5); padding: var(--k-space-8) 0; border-bottom: var(--k-border-w) solid var(--k-line); }
	section:last-child { border-bottom: 0; }
	h2 { margin: 0; font-family: var(--k-label-font); font-size: var(--k-label-size); font-weight: var(--k-weight-label); text-transform: var(--k-label-transform); letter-spacing: var(--k-label-tracking); color: var(--k-fg-muted); }
	.row { display: flex; flex-wrap: wrap; align-items: center; gap: var(--k-space-3); }
	.between { justify-content: space-between; }
	.stack { display: grid; gap: var(--k-space-4); align-content: start; min-width: 0; }
	.grid2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--k-space-5); }
	.m0 { margin: 0; }
	.muted { color: var(--k-fg-muted); margin: 0; }
	code { font-family: var(--k-font-mono); font-size: 0.9em; }
	.theme-box { display: grid; gap: var(--k-space-3); align-content: start; min-width: 0; padding: var(--k-space-5); border: var(--k-border-w) solid var(--k-line); border-radius: var(--k-radius-card); }
	.centre-text { font-family: var(--k-font-mono); font-size: var(--k-text-sm); }
	.trigger-rich { display: inline-flex; align-items: center; gap: var(--k-space-2); }
	.pane { display: grid; gap: var(--k-space-2); align-content: start; padding: var(--k-space-4); }
	.list { margin: 0; padding: var(--k-space-2) var(--k-space-4) var(--k-space-2) var(--k-space-6); }
	.list li { padding: var(--k-space-2) 0; border-bottom: var(--k-border-w) solid var(--k-line); }
	.chips { display: flex; gap: var(--k-space-3); padding: var(--k-space-2) 0 var(--k-space-3); }
	.chip { flex: none; padding: var(--k-space-2) var(--k-space-4); border: var(--k-border-w) solid var(--k-border); border-radius: var(--k-radius-badge); background: var(--k-bg-raised); }
	@media (max-width: 760px) {
		.grid2 { grid-template-columns: 1fr; }
	}
</style>
