<script lang="ts">
	import Alert from '../../lib/components/Alert.svelte';
	import Button from '../../lib/components/Button.svelte';
	import Kbd from '../../lib/components/Kbd.svelte';
	import Link from '../../lib/components/Link.svelte';
	import Pagination from '../../lib/components/Pagination.svelte';
	import Prose from '../../lib/components/Prose.svelte';
	import Rating from '../../lib/components/Rating.svelte';
	import SegmentedControl from '../../lib/components/SegmentedControl.svelte';
	import Spinner from '../../lib/components/Spinner.svelte';
	import StatusDot from '../../lib/components/StatusDot.svelte';
	import Table from '../../lib/components/Table.svelte';
	import { announce } from '../../lib/components/announcer.js';
	import { de } from '../../lib/components/strings-de.js';
	import { getLang, resetStrings, setStrings } from '../../lib/components/strings.js';

	let language = $state(getLang() === 'de' ? 'de' : 'en');
	let page = $state(3);
	let rating = $state(3);
	let alertOpen = $state(true);
	let announced = $state('');

	function choose(value: string): void {
		language = value;
		if (value === 'de') setStrings(de);
		else resetStrings();
	}
	function say(message: string, politeness: 'polite' | 'assertive'): void {
		announced = `${politeness === 'assertive' ? 'Sofort' : 'Höflich'}: ${message}`;
		announce(message, politeness);
	}

	const legal = `Angaben gemäß § 5 DDG

Mara Lind
Beispielweg 12
12345 Musterstadt

Kontakt: kontakt@example.com oder https://example.com/impressum (Stand: Januar 2026).

Haftung für Inhalte
Alle Inhalte werden mit Sorgfalt erstellt. Eine Gewähr kann nicht übernommen werden, <b>auch nicht für Markup</b>: HTML wird als Text angezeigt.`;
</script>

<section>
	<h2>Texte und Sprache</h2>
	<p class="m0">
		Alle Standardtexte der Komponenten stehen in einem Katalog. <code>setStrings(de)</code> stellt sie für die ganze Seite um, auch für Komponenten,
		die schon angezeigt werden. Props gewinnen immer.
	</p>
	<SegmentedControl
		label="Sprache der Standardtexte"
		value={language}
		onchange={choose}
		options={[
			{ value: 'en', label: 'English' },
			{ value: 'de', label: 'Deutsch' }
		]}
	/>
	<div class="stack">
		{#if alertOpen}
			<Alert title="Gespeichert" ondismiss={() => (alertOpen = false)}>Der Schließen-Knopf kommt aus dem Katalog.</Alert>
		{:else}
			<Button variant="secondary" onclick={() => (alertOpen = true)}>Hinweis wieder zeigen</Button>
		{/if}
		<div class="row">
			<Spinner />
			<StatusDot status="warn" />
			<Rating value={rating} onchange={(v) => (rating = v)} label="Bewertung" />
			<Kbd keys={['shift', 'enter']} />
			<Link href="https://example.com" external>Externer Link</Link>
		</div>
		<Pagination {page} pageCount={9} onchange={(p) => (page = p)} />
		<Table columns={[{ key: 'name', label: 'Name' }]} rows={[]} caption="Leere Tabelle" />
	</div>
</section>

<section>
	<h2>Prose</h2>
	<p class="m0">Reiner Text wird zu Absätzen, Zeilenumbrüchen und Links. Nichts davon wird als HTML gelesen.</p>
	<div class="grid2">
		<Prose text={legal} />
		<Prose>
			<h3>Eigenes Markup</h3>
			<p>Überschriften, Absätze, Listen und <a href="https://example.com">Links</a> erben dieselbe Typografie.</p>
			<ul>
				<li>Zeilenlänge aus <code>--k-prose-measure</code></li>
				<li>Abstände aus <code>--k-prose-gap</code></li>
			</ul>
		</Prose>
	</div>
</section>

<section>
	<h2>Ansagen und Verbindung</h2>
	<p class="m0">
		Die Ansage geht in unsichtbare Live-Regionen (<code>LiveAnnouncer</code>); der Link „Zum Inhalt“ ganz oben ist ein <code>SkipLink</code>
		(Tab drücken).
		<code>OnlineStatus</code> zeigt unter dem Seitenkopf einen Hinweis, sobald der Browser offline ist.
	</p>
	<div class="row">
		<Button variant="secondary" onclick={() => say('Änderungen gespeichert', 'polite')}>Höflich ansagen</Button>
		<Button variant="secondary" onclick={() => say('Verbindung zum Server verloren', 'assertive')}>Sofort ansagen</Button>
	</div>
	<p class="m0 muted">Letzte Ansage: {announced || 'noch keine'}</p>
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
	.row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--k-space-3) var(--k-space-5);
	}
	.stack {
		display: grid;
		gap: var(--k-space-4);
		align-content: start;
		min-width: 0;
	}
	.grid2 {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: var(--k-space-5);
	}
	.m0 {
		margin: 0;
		line-height: 1.7;
	}
	.muted {
		color: var(--k-fg-muted);
	}
	@media (max-width: 760px) {
		.grid2 {
			grid-template-columns: 1fr;
		}
	}
</style>
