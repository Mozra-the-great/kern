<script lang="ts">
	// Navigation and content (#46–#49, #74): app tab bar, tab links, code block, tile grid, drawer.
	import Button from '../../lib/components/Button.svelte';
	import CodeBlock from '../../lib/components/CodeBlock.svelte';
	import Drawer from '../../lib/components/Drawer.svelte';
	import TabLinks from '../../lib/components/TabLinks.svelte';
	import Tabs, { type TabItem } from '../../lib/components/Tabs.svelte';
	import Tile from '../../lib/components/Tile.svelte';
	import TileGrid from '../../lib/components/TileGrid.svelte';
	import { toast } from '../../lib/components/toast.svelte.js';

	let page = $state('lacke');
	let syncError = $state(true);
	let admin = $state(false);
	let section = $state('#konvertieren');
	let plan = $state(false);
	const pages: Record<string, string> = {
		lacke: 'Deine Sammlung: 128 Lacke.',
		sticker: 'Sticker und Nail-Art.',
		tagebuch: 'Tagebuch der Maniküren.',
		statistik: 'Statistiken der Sammlung.',
		mehr: 'Einstellungen, Synchronisierung und Konto.',
		admin: 'Verwaltung der Instanz.'
	};
	const tabs: TabItem[] = $derived([
		{ id: 'lacke', label: 'Lacke', badge: 3, badgeLabel: '3 neu', controls: 'demo-app-page' },
		{ id: 'sticker', label: 'Sticker', controls: 'demo-app-page' },
		{ id: 'tagebuch', label: 'Tagebuch', controls: 'demo-app-page' },
		{ id: 'statistik', label: 'Statistiken', controls: 'demo-app-page' },
		{
			id: 'mehr',
			label: 'Mehr',
			dot: syncError,
			badgeLabel: syncError ? 'Sync-Fehler' : undefined,
			badgeTone: 'danger',
			controls: 'demo-app-page'
		},
		{ id: 'admin', label: 'Admin', hidden: !admin, controls: 'demo-app-page' }
	]);
	const links = $derived(
		[
			{ href: '#konvertieren', label: 'Konvertieren' },
			{ href: '#base64', label: 'Base64' },
			{ href: '#einheiten', label: 'Einheiten', badge: 2 }
		].map((l) => ({ ...l, current: l.href === section }))
	);
</script>

<section>
	<h2>Navigation und Inhalt</h2>
	<p class="m0">App-Navigation wie in nagellacke: Tabs ohne Panel, die Seite darunter wechselt die App selbst.</p>
	<Tabs {tabs} bind:value={page} label="Hauptnavigation" look="pill" />
	<div id="demo-app-page" class="page">{pages[page] ?? ''}</div>
	<div class="row">
		<Button variant="secondary" size="sm" onclick={() => (syncError = !syncError)}>Sync-Fehler {syncError ? 'beheben' : 'auslösen'}</Button>
		<Button variant="secondary" size="sm" onclick={() => (admin = !admin)}>Admin-Tab {admin ? 'ausblenden' : 'zeigen'}</Button>
	</div>

	<TabLinks
		{links}
		label="Werkzeuge"
		onnavigate={(link, e) => {
			e.preventDefault();
			section = link.href;
		}}
	/>

	<CodeBlock
		code="stuffcloud deploy ./dist --expires 7d --name urlaub-2026 --password-protect"
		label="Befehl zum Veröffentlichen"
		copyLabel="Kopieren"
		copiedLabel="Kopiert"
		copyErrorLabel="Kopieren fehlgeschlagen"
		oncopy={(ok) => (ok ? toast.ok('Befehl kopiert') : toast.warn('Kopieren nicht möglich'))}
	/>

	<TileGrid as="ul" aria-label="Werkzeuge">
		<Tile as="li" href="#pdf"><strong>PDF</strong><span class="muted">Zusammenfügen, teilen, drehen</span></Tile>
		<Tile as="li" href="#bilder"><strong>Bilder</strong><span class="muted">Größe ändern und umwandeln</span></Tile>
		<Tile as="li" href="#text"><strong>Text</strong><span class="muted">Zählen, vergleichen, formatieren</span></Tile>
		<Tile as="li"><strong>Bald</strong><span class="muted">Weitere Werkzeuge folgen</span></Tile>
	</TileGrid>

	<div class="row"><Button variant="secondary" onclick={() => (plan = true)}>Drawer, der beantwortet werden muss</Button></div>
</section>

<Drawer bind:open={plan} title="Tarif wählen" side="bottom" dismissible={false} initialFocus="[data-primary]">
	<p class="m0">Escape, Hintergrund und ✕ schließen diesen Drawer nicht; nur eine Wahl.</p>
	{#snippet footer()}
		<Button variant="secondary" onclick={() => (plan = false)}>Später</Button>
		<Button data-primary onclick={() => (plan = false)}>Kostenlos</Button>
	{/snippet}
</Drawer>

<style>
	.page {
		padding: var(--k-space-4);
		border: var(--k-border-w) dashed var(--k-line);
		border-radius: var(--k-radius-card);
		color: var(--k-fg-muted);
	}
	.muted {
		color: var(--k-fg-muted);
		font-size: var(--k-text-sm);
	}
</style>
