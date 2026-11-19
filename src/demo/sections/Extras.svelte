<script lang="ts">
	import Skeleton from '../../lib/components/Skeleton.svelte';
	import EmptyState from '../../lib/components/EmptyState.svelte';
	import Breadcrumb from '../../lib/components/Breadcrumb.svelte';
	import Pagination from '../../lib/components/Pagination.svelte';
	import Navbar from '../../lib/components/Navbar.svelte';
	import Slider from '../../lib/components/Slider.svelte';
	import FileDrop from '../../lib/components/FileDrop.svelte';
	import Carousel from '../../lib/components/Carousel.svelte';
	import Card from '../../lib/components/Card.svelte';
	import Button from '../../lib/components/Button.svelte';
	import Switch from '../../lib/components/Switch.svelte';

	let loading = $state(true);
	let page = $state(3);
	let volume = $state(40);
	let price = $state(120);
	let uploads = $state<File[]>([]);
	let slideIndex = $state(0);

	const trail = [
		{ label: 'Start', href: '#main' },
		{ label: 'Sammlung', href: '#main' },
		{ label: 'Lacke', href: '#main' },
		{ label: 'Pastell', href: '#main' },
		{ label: 'Mintgrün Nr. 14' }
	];
	const links = [
		{ label: 'Sammlung', href: '#main', current: true },
		{ label: 'Wunschliste', href: '#main' },
		{ label: 'Tauschbörse', href: '#main' },
		{ label: 'Hilfe', href: '#main' }
	];
	const slides = [
		{ title: 'Mintgrün', text: 'Pastell, deckend in zwei Schichten.' },
		{ title: 'Beerenrot', text: 'Cremig, trocknet glänzend.' },
		{ title: 'Nachtblau', text: 'Mit feinem Schimmer, braucht einen Überlack.' },
		{ title: 'Sandgold', text: 'Metallic, am besten mit dem Fächerpinsel.' }
	];
	const hues = ['var(--k-accent-soft)', 'var(--k-bg-sunken)', 'var(--k-info-soft)', 'var(--k-ok-soft)'];
</script>

<section>
	<h2>Skeleton</h2>
	<Switch label="Lädt noch" bind:checked={loading} />
	<div class="grid2">
		<Card>
			{#if loading}
				<div class="media-row">
					<Skeleton variant="circle" width={48} />
					<div class="grow">
						<Skeleton width="60%" height={14} />
						<div class="gap"></div>
						<Skeleton width="40%" height={12} />
					</div>
				</div>
				<Skeleton lines={3} />
				<Skeleton variant="rect" height={96} />
			{:else}
				<p class="m0"><strong>Mara Lind</strong> hat 14 Lacke hinzugefügt.</p>
				<p class="m0 muted">Pastelltöne, Cremes und ein Glitzer. Alle sind für den Tausch freigegeben, bis auf den letzten.</p>
			{/if}
		</Card>
		<div class="stack">
			<Skeleton lines={4} />
			<div class="row">
				<Skeleton variant="circle" width={32} />
				<Skeleton variant="circle" width={56} />
				<Skeleton variant="rect" width={120} height={40} />
			</div>
		</div>
	</div>
</section>

<section>
	<h2>Empty State</h2>
	<div class="grid2">
		<Card look="outline">
			<EmptyState title="Noch keine Lacke" description="Lege dein erstes Lack an, dann erscheint es hier.">
				{#snippet icon()}
					<svg viewBox="0 0 24 24"><path d="M9 3h6v4H9zM7 7h10l1 14H6z" fill="none" stroke="currentColor" stroke-width="1.8" /></svg>
				{/snippet}
				{#snippet actions()}
					<Button>Lack hinzufügen</Button>
					<Button variant="secondary">Importieren</Button>
				{/snippet}
			</EmptyState>
		</Card>
		<Card look="sunken">
			<EmptyState title="Keine Treffer" description="Probiere es mit einem anderen Suchbegriff oder entferne einen Filter." level={3} />
		</Card>
	</div>
</section>

<section>
	<h2>Breadcrumb</h2>
	<div class="stack">
		<Breadcrumb items={trail} label="Brotkrumen" expandLabel="Ausgeblendete Einträge anzeigen" />
		<Breadcrumb items={trail} max={3} label="Brotkrumen, gekürzt" expandLabel="Ausgeblendete Einträge anzeigen" />
		<div class="narrow">
			<Breadcrumb items={trail} label="Brotkrumen, schmal" expandLabel="Ausgeblendete Einträge anzeigen" />
		</div>
	</div>
</section>

<section>
	<h2>Pagination</h2>
	<div class="stack">
		<Pagination bind:page pageCount={12} label="Seiten" prevLabel="Zurück" nextLabel="Weiter" pageLabel="Seite" ofLabel="von" />
		<p class="m0 muted">Aktuelle Seite: {page}</p>
		<div class="narrow">
			<Pagination pageCount={12} page={3} label="Seiten, schmal" prevLabel="Zurück" nextLabel="Weiter" pageLabel="Seite" ofLabel="von" />
		</div>
		<Pagination pageCount={5} siblings={2} label="Wenige Seiten" prevLabel="Zurück" nextLabel="Weiter" pageLabel="Seite" ofLabel="von" />
	</div>
</section>

<section>
	<h2>Navbar</h2>
	<div class="stack">
		<div class="frame-demo">
			<Navbar items={links} label="Hauptmenü" menuLabel="Menü">
				{#snippet brand()}<a href="#main">nagellacke</a>{/snippet}
				{#snippet actions()}<Button size="sm" variant="secondary">Anmelden</Button>{/snippet}
			</Navbar>
		</div>
		<p class="m0 muted">Unter 720 px Breite klappt die Navigation in ein Menü.</p>
		<div class="frame-demo narrow">
			<Navbar items={links} label="Hauptmenü, schmal" menuLabel="Menü">
				{#snippet brand()}<a href="#main">nagellacke</a>{/snippet}
				{#snippet actions()}<Button size="sm" variant="secondary">Anmelden</Button>{/snippet}
			</Navbar>
		</div>
	</div>
</section>

<section>
	<h2>Slider</h2>
	<div class="grid2">
		<Slider label="Lautstärke" hint="Mit den Pfeiltasten in Einerschritten." bind:value={volume} showValue format={(v) => `${v} %`} />
		<Slider label="Höchstpreis" bind:value={price} min={0} max={500} step={10} showValue format={(v) => `${v} €`} name="price" />
		<Slider label="Helligkeit" error="Bitte wähle mindestens 30." min={0} max={100} value={10} showValue />
		<Slider label="Gesperrt" value={60} disabled showValue />
	</div>
</section>

<section>
	<h2>FileDrop</h2>
	<div class="grid2">
		<FileDrop
			label="Fotos"
			hint="PNG oder JPG, höchstens 2 MB je Datei."
			accept="image/png,image/jpeg"
			multiple
			maxSize={2 * 1024 * 1024}
			bind:files={uploads}
			dropLabel="Fotos hierher ziehen oder klicken"
			removeLabel="Entfernen:"
			listLabel="Gewählte Fotos"
			sizeError={'{name} ist größer als {max}.'}
			typeError={'{name} hat kein erlaubtes Format.'}
			statusLabel={'Ausgewählte Dateien: {count}'}
		/>
		<FileDrop
			label="Rechnung"
			accept=".pdf"
			hint="Eine PDF-Datei."
			dropLabel="PDF hierher ziehen oder klicken"
			removeLabel="Entfernen:"
			countError="Es ist nur eine Datei erlaubt."
		/>
	</div>
	<p class="m0 muted">{uploads.length} Foto(s) gewählt.</p>
</section>

<section>
	<h2>Carousel</h2>
	<div class="carousel-wrap">
		<Carousel
			items={slides}
			bind:index={slideIndex}
			label="Neue Farben"
			prevLabel="Vorherige Folie"
			nextLabel="Nächste Folie"
			dotsLabel="Folien"
			slideLabel="Zu Folie"
			ofLabel="von"
		>
			{#snippet slide(item, i)}
				<div class="slide" style:background={hues[i % hues.length]}>
					<h3 class="m0">{item.title}</h3>
					<p class="m0">{item.text}</p>
					<Button size="sm" variant="secondary">Details</Button>
				</div>
			{/snippet}
		</Carousel>
	</div>
	<p class="m0 muted">Folie {slideIndex + 1} von {slides.length}</p>
</section>

<style>
	section {
		display: grid;
		gap: var(--k-space-5);
		padding: var(--k-space-8) 0;
		border-bottom: var(--k-border-w) solid var(--k-line);
	}
	section:last-child {
		border-bottom: 0;
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
	.m0 {
		margin: 0;
	}
	.muted {
		color: var(--k-fg-muted);
	}
	.media-row {
		display: flex;
		align-items: center;
		gap: var(--k-space-3);
	}
	.grow {
		flex: 1;
		min-width: 0;
	}
	.gap {
		height: var(--k-space-2);
	}
	.narrow {
		max-width: 320px;
	}
	.frame-demo {
		min-height: 64px;
		border: var(--k-border-w) solid var(--k-line);
	}
	.frame-demo.narrow {
		min-height: 240px;
	}
	.carousel-wrap {
		max-width: 560px;
	}
	.slide {
		display: grid;
		gap: var(--k-space-3);
		justify-items: start;
		align-content: center;
		min-height: 200px;
		padding: var(--k-space-6);
		border: var(--k-border-w) solid var(--k-line);
		border-radius: var(--k-radius-card);
		color: var(--k-fg);
	}
	@media (max-width: 760px) {
		.grid2 {
			grid-template-columns: 1fr;
		}
	}
</style>
