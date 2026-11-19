<script lang="ts">
	import {
		Button,
		IconButton,
		Link,
		Badge,
		Tag,
		Avatar,
		Spinner,
		Progress,
		Divider,
		Input,
		Textarea,
		Select,
		Checkbox,
		RadioGroup,
		Switch,
		Card,
		Alert,
		Toaster,
		Modal,
		Drawer,
		Tabs,
		Accordion,
		AccordionItem,
		Tooltip,
		DropdownMenu,
		Table,
		SkipLink,
		LiveAnnouncer,
		OnlineStatus,
		toast
	} from '../lib/index.js';
	import { themes } from './themes.js';
	import Extras from './sections/Extras.svelte';
	import Widgets from './sections/Widgets.svelte';
	import FormsMore from './sections/FormsMore.svelte';
	import FormsContent from './sections/FormsContent.svelte';
	import NavContent from './sections/NavContent.svelte';
	import Reorder from './sections/Reorder.svelte';
	import Effects from './sections/Effects.svelte';
	import Primitives from './sections/Primitives.svelte';
	import Layout from './sections/Layout.svelte';
	import Assets from './sections/Assets.svelte';
	import Mascots from './sections/Mascots.svelte';
	import Data from './sections/Data.svelte';
	import Feedback from './sections/Feedback.svelte';
	import Texts from './sections/Texts.svelte';

	let theme = $state(readTheme());
	function readTheme() {
		try {
			return localStorage.getItem('kern-theme') ?? 'stuffcloud';
		} catch {
			return 'stuffcloud';
		}
	}
	$effect(() => {
		document.documentElement.dataset.theme = theme;
		try {
			localStorage.setItem('kern-theme', theme);
		} catch {
			/* storage blocked: the choice is just not remembered */
		}
	});

	let name = $state('');
	let email = $state('nicht-gültig');
	let note = $state('');
	let size = $state('m');
	let shipping = $state('standard');
	let terms = $state(false);
	let news = $state(true);
	let modalOpen = $state(false);
	let drawerOpen = $state(false);
	let tab = $state('files');
	let tags = $state(['Gel', 'Matt', 'Pastell', 'Glitzer']);
	const progress = $state(64);

	const rows = [
		{ name: 'urlaub-2026.zip', type: 'Archiv', size: 482.1, date: '2026-11-02' },
		{ name: 'rechnung-0412.pdf', type: 'PDF', size: 0.3, date: '2026-11-14' },
		{ name: 'banner-flower.svg', type: 'Bild', size: 1.8, date: '2026-10-28' },
		{ name: 'notizen.md', type: 'Text', size: 0.02, date: '2026-11-17' }
	];
</script>

<SkipLink target="main" label="Zum Inhalt" />

<header class="top">
	<div class="frame bar">
		<span class="mark">kern</span>
		<a class="switch" href="./elements.html">Custom Elements</a>
		<label class="theme">
			<span>Theme</span>
			<select bind:value={theme}>
				{#each themes as t (t.id)}<option value={t.id}>{t.label}</option>{/each}
			</select>
		</label>
	</div>
</header>

<OnlineStatus />

<main id="main" class="frame">
	<section class="hero">
		<h1>Ein Kern, viele Marken.</h1>
		<p>Svelte-5-Komponenten. Das Theme setzt Farbe, Form, Tiefe und Schrift über CSS-Variablen.</p>
		<div class="row">
			<Button onclick={() => toast.ok('Gespeichert.')}>Speichern</Button>
			<Button variant="secondary" onclick={() => (modalOpen = true)}>Dialog öffnen</Button>
			<Button variant="ghost" onclick={() => (drawerOpen = true)}>Seitenleiste</Button>
		</div>
	</section>

	<section>
		<h2>Aktionen</h2>
		<div class="row">
			<Button>Primär</Button>
			<Button variant="secondary">Sekundär</Button>
			<Button variant="ghost">Ghost</Button>
			<Button variant="accent">Akzent</Button>
			<Button variant="danger">Löschen</Button>
			<Button loading>Lädt</Button>
			<Button disabled>Gesperrt</Button>
		</div>
		<div class="row">
			<Button size="sm">Klein</Button>
			<Button size="lg">Groß</Button>
			<Tooltip text="Datei hochladen">
				<IconButton label="Hochladen" variant="secondary">
					<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 14V3M5 8l5-5 5 5M3 17h14" /></svg>
				</IconButton>
			</Tooltip>
			<DropdownMenu
				label="Mehr"
				items={[
					{ type: 'label', label: 'Datei' },
					{ id: 'rename', label: 'Umbenennen', shortcut: 'F2', onselect: () => toast('Umbenennen gewählt') },
					{ id: 'share', label: 'Teilen', onselect: () => toast('Link kopiert') },
					{ id: 'move', label: 'Verschieben', disabled: true },
					{ type: 'separator' },
					{
						id: 'delete',
						label: 'Löschen',
						danger: true,
						onselect: () => toast.danger('Datei gelöscht', { action: { label: 'Rückgängig', onclick: () => toast('Wiederhergestellt') } })
					}
				]}
			/>
			<Link href="#main">Ein Link im Text</Link>
			<Link href="https://example.com" external>Extern</Link>
		</div>
	</section>

	<section>
		<h2>Status</h2>
		<div class="row">
			<Badge>Neutral</Badge>
			<Badge tone="accent">Neu</Badge>
			<Badge tone="ok">Verfügbar</Badge>
			<Badge tone="warn">Fast voll</Badge>
			<Badge tone="danger">Fehler</Badge>
			<Badge tone="info" look="outline">Info</Badge>
			<Badge tone="accent" look="solid">Solid</Badge>
		</div>
		<div class="row">
			{#each tags as t (t)}
				<Tag onremove={() => (tags = tags.filter((x) => x !== t))} removeLabel="{t} entfernen">{t}</Tag>
			{/each}
			<Tag selected>Ausgewählt</Tag>
		</div>
		<div class="row">
			<Avatar name="Mara Lind" />
			<Avatar name="Jo Becker" size={48} />
			<Avatar name="Kai" size={32} />
			<Spinner />
			<Spinner label="Synchronisiert" size={28} />
		</div>
		<div class="grid2">
			<Progress label="Speicher" value={progress} showValue />
			<Progress label="Hochladen" />
		</div>
		<Divider label="oder" />
	</section>

	<section>
		<h2>Formulare</h2>
		<form
			class="grid2"
			onsubmit={(e) => {
				e.preventDefault();
				toast.ok(`Danke, ${name || 'du'}.`);
			}}
		>
			<Input label="Name" bind:value={name} placeholder="Mara Lind" required autocomplete="name" />
			<Input label="E-Mail" type="email" bind:value={email} error={email.includes('@') ? undefined : 'Die Adresse braucht ein @.'} />
			<Input label="Suche" placeholder="Dateien suchen" hint="Sucht in Namen und Inhalt.">
				{#snippet leading()}<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
						<circle cx="9" cy="9" r="6" /><path d="M14 14l4 4" />
					</svg>{/snippet}
			</Input>
			<Select
				label="Größe"
				bind:value={size}
				options={[
					{ value: 's', label: 'Klein' },
					{ value: 'm', label: 'Mittel' },
					{ value: 'l', label: 'Groß' }
				]}
			/>
			<Textarea label="Notiz" bind:value={note} hint="Höchstens 500 Zeichen." maxlength={500} />
			<div class="stack">
				<RadioGroup
					label="Versand"
					bind:value={shipping}
					options={[
						{ value: 'standard', label: 'Standard', hint: '3–5 Werktage' },
						{ value: 'express', label: 'Express', hint: 'Nächster Werktag' },
						{ value: 'pickup', label: 'Abholung', disabled: true }
					]}
				/>
			</div>
			<div class="stack">
				<Checkbox bind:checked={terms} label="Ich habe die Bedingungen gelesen." />
				<Checkbox indeterminate label="Teilweise gewählt" />
				<Switch bind:checked={news} label="Neuigkeiten per E-Mail" hint="Höchstens einmal im Monat." />
			</div>
			<div class="row end"><Button type="submit" disabled={!terms}>Absenden</Button></div>
		</form>
	</section>

	<section>
		<h2>Inhalt</h2>
		<div class="grid3">
			<Card title="Fotos" description="1.204 Dateien · 18,2 GB">
				<p class="m0">Zuletzt geändert vor 2 Stunden.</p>
				{#snippet footer()}<Button size="sm" variant="secondary">Öffnen</Button>{/snippet}
			</Card>
			<Card title="Nagellacke" description="Herbstkollektion" look="sunken" href="#main">
				<p class="m0">Die ganze Karte ist ein Link.</p>
			</Card>
			<Card title="Freigaben" look="outline">
				<div class="row"><Badge tone="ok">3 aktiv</Badge><Badge tone="warn">1 läuft ab</Badge></div>
			</Card>
		</div>
		<div class="stack">
			<Alert title="Hinweis">Die Synchronisierung läuft im Hintergrund.</Alert>
			<Alert tone="ok" title="Hochgeladen">Alle 12 Dateien sind gespeichert.</Alert>
			<Alert tone="warn" title="Speicher fast voll" ondismiss={() => toast('Ausgeblendet')}>
				Noch 1,2 GB frei.
				{#snippet actions()}<Button size="sm" variant="secondary">Platz schaffen</Button>{/snippet}
			</Alert>
			<Alert tone="danger" title="Upload fehlgeschlagen">Die Datei ist größer als 2 GB.</Alert>
		</div>
	</section>

	<section>
		<h2>Navigation</h2>
		<Tabs
			label="Bereiche"
			bind:value={tab}
			tabs={[
				{ id: 'files', label: 'Dateien' },
				{ id: 'shared', label: 'Geteilt' },
				{ id: 'trash', label: 'Papierkorb' },
				{ id: 'locked', label: 'Archiv', disabled: true }
			]}
		>
			{#snippet panel(id)}
				{#if id === 'files'}
					<Table
						caption="Dateien"
						captionHidden
						columns={[
							{ key: 'name', label: 'Name', sortable: true },
							{ key: 'type', label: 'Typ', sortable: true },
							{ key: 'size', label: 'Größe (MB)', align: 'end', mono: true, sortable: true },
							{ key: 'date', label: 'Geändert', mono: true, sortable: true }
						]}
						{rows}
					/>
				{:else if id === 'shared'}
					<p>Noch nichts geteilt.</p>
				{:else}
					<p>Der Papierkorb ist leer.</p>
				{/if}
			{/snippet}
		</Tabs>
		<Tabs
			label="Ansicht"
			look="pill"
			tabs={[
				{ id: 'grid', label: 'Raster' },
				{ id: 'list', label: 'Liste' }
			]}
		>
			{#snippet panel(id)}<p class="muted">Ansicht: {id === 'grid' ? 'Raster' : 'Liste'}</p>{/snippet}
		</Tabs>
		<Accordion>
			<AccordionItem title="Wie lange bleiben Links gültig?" open><p>Sieben Tage, wenn du nichts anderes einstellst.</p></AccordionItem>
			<AccordionItem title="Kann ich ein Passwort setzen?"><p>Ja, beim Teilen unter „Schutz“.</p></AccordionItem>
			<AccordionItem title="Was passiert im Papierkorb?"><p>Dateien werden nach 30 Tagen gelöscht.</p></AccordionItem>
		</Accordion>
	</section>

	<Feedback />
	<Extras />
	<Widgets />
	<FormsMore />
	<FormsContent />
	<NavContent />
	<Reorder />
	<Data />
	<Primitives />
	<Layout />
	<Effects />
	<Mascots />
	<Assets />
	<Texts />
</main>

<Modal bind:open={modalOpen} title="Ordner löschen?" description="„Urlaub 2026“ und 214 Dateien werden in den Papierkorb gelegt.">
	<Checkbox label="Auch geteilte Links widerrufen" />
	{#snippet footer()}
		<Button variant="secondary" onclick={() => (modalOpen = false)}>Abbrechen</Button>
		<Button
			variant="danger"
			onclick={() => {
				modalOpen = false;
				toast.ok('In den Papierkorb gelegt');
			}}
		>
			Löschen
		</Button>
	{/snippet}
</Modal>

<Drawer bind:open={drawerOpen} title="Filter">
	<div class="stack">
		<Select
			label="Typ"
			placeholder="Alle"
			options={[
				{ value: 'img', label: 'Bilder' },
				{ value: 'doc', label: 'Dokumente' }
			]}
		/>
		<Switch label="Nur geteilte" />
		<Checkbox label="Mit Papierkorb" />
	</div>
	{#snippet footer()}<Button block onclick={() => (drawerOpen = false)}>Anwenden</Button>{/snippet}
</Drawer>

<Toaster label="Benachrichtigungen" dismissLabel="Schließen" undoLabel="Rückgängig" />
<LiveAnnouncer />

<style>
	.frame {
		width: 100%;
		max-width: 1120px;
		margin: 0 auto;
		padding: 0 var(--k-space-6);
	}
	.top {
		border-bottom: var(--k-border-w) solid var(--k-line);
	}
	.bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--k-space-4);
		min-height: 64px;
	}
	.mark {
		font-family: var(--k-font-display);
		font-weight: var(--k-weight-display);
		font-size: 20px;
	}
	.switch {
		margin-right: auto;
		color: var(--k-link);
		font-family: var(--k-label-font);
		font-size: var(--k-label-size);
		text-transform: var(--k-label-transform);
		letter-spacing: var(--k-label-tracking);
	}
	.switch:focus-visible {
		outline: var(--k-focus-w) solid var(--k-focus);
		outline-offset: var(--k-focus-offset);
	}
	.theme {
		display: flex;
		align-items: center;
		gap: var(--k-space-2);
		font-family: var(--k-label-font);
		font-size: var(--k-label-size);
		text-transform: var(--k-label-transform);
		letter-spacing: var(--k-label-tracking);
	}
	.theme select {
		min-height: 40px;
		padding: 0 var(--k-space-3);
		border: var(--k-border-w) solid var(--k-border);
		border-radius: var(--k-radius-field);
		background: var(--k-bg-raised);
		color: var(--k-fg);
		font: inherit;
		text-transform: none;
	}
	.theme select:focus-visible {
		outline: var(--k-focus-w) solid var(--k-focus);
		outline-offset: var(--k-focus-offset);
	}
	section {
		display: grid;
		gap: var(--k-space-5);
		padding: var(--k-space-8) 0;
		border-bottom: var(--k-border-w) solid var(--k-line);
	}
	section:last-child {
		border-bottom: 0;
	}
	.hero {
		padding: var(--k-space-9) 0;
	}
	h1 {
		margin: 0;
		font-family: var(--k-font-display);
		font-weight: var(--k-weight-display);
		font-size: clamp(32px, 6vw, 56px);
		line-height: 1.05;
		letter-spacing: -0.02em;
	}
	.hero p {
		margin: 0;
		max-width: 56ch;
		color: var(--k-fg-muted);
		font-size: var(--k-text-lg);
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
	.row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--k-space-3);
	}
	.end {
		justify-content: flex-end;
		grid-column: 1 / -1;
	}
	.stack {
		display: grid;
		gap: var(--k-space-4);
		align-content: start;
	}
	.grid2 {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: var(--k-space-5);
	}
	.grid3 {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: var(--k-space-5);
	}
	.m0 {
		margin: 0;
	}
	.muted {
		color: var(--k-fg-muted);
		margin: 0;
	}
	@media (max-width: 760px) {
		.frame {
			padding: 0 var(--k-space-4);
		}
		.grid2,
		.grid3 {
			grid-template-columns: 1fr;
		}
		.bar {
			flex-wrap: wrap;
			padding: var(--k-space-2) 0;
		}
	}
</style>
