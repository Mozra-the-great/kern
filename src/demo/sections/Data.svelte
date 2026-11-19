<script lang="ts">
	import DataTable from '../../lib/components/DataTable.svelte';
	import type { DataColumn, DataRowKey } from '../../lib/components/DataTable.svelte';
	import Stat from '../../lib/components/Stat.svelte';
	import Sparkline from '../../lib/components/Sparkline.svelte';
	import Heatmap from '../../lib/components/Heatmap.svelte';
	import HistoryBar from '../../lib/components/HistoryBar.svelte';
	import type { HistoryItem } from '../../lib/components/HistoryBar.svelte';
	import Timeline from '../../lib/components/Timeline.svelte';
	import type { TimelineItem } from '../../lib/components/Timeline.svelte';
	import Badge from '../../lib/components/Badge.svelte';
	import Switch from '../../lib/components/Switch.svelte';

	/** Small seeded generator, so the demo looks the same on every load. */
	function rng(seed: number): () => number {
		let a = seed;
		return () => {
			a = (a + 0x6d2b79f5) | 0;
			let t = Math.imul(a ^ (a >>> 15), 1 | a);
			t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
			return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
		};
	}
	const DAY = 86_400_000;
	const iso = (ms: number): string => new Date(ms).toISOString().slice(0, 10);

	/* DataTable */
	type Polish = { name: string; brand: string; finish: string; price: number; stock: number; added: string };
	const names = [
		'Mintgrün',
		'Beerenrot',
		'Nachtblau',
		'Sandgold',
		'Altrosa',
		'Pfirsich',
		'Lavendel',
		'Smaragd',
		'Koralle',
		'Graphit',
		'Perlweiß',
		'Honig'
	];
	const brands = ['Lacque', 'Petal & Co', 'Nordglanz'];
	const finishes = ['Creme', 'Glitzer', 'Matt', 'Metallic', 'Gel'];
	const random = rng(7);
	const polishes: Polish[] = Array.from({ length: 27 }, (_, i) => ({
		name: `${names[i % names.length]} Nr. ${i + 1}`,
		brand: brands[Math.floor(random() * brands.length)],
		finish: finishes[Math.floor(random() * finishes.length)],
		price: Math.round((3 + random() * 14) * 10) / 10,
		stock: Math.floor(random() * 12),
		added: iso(Date.UTC(2026, 10, 18) - Math.floor(random() * 200) * DAY)
	}));
	const columns: DataColumn<Polish>[] = [
		{ key: 'name', label: 'Name', sortable: true },
		{ key: 'brand', label: 'Marke', sortable: true },
		{ key: 'finish', label: 'Finish', sortable: true },
		{
			key: 'price',
			label: 'Preis',
			align: 'end',
			mono: true,
			sortable: true,
			format: (v) => `${Number(v).toFixed(2).replace('.', ',')} €`
		},
		{ key: 'stock', label: 'Bestand', align: 'end', mono: true, sortable: true },
		{ key: 'added', label: 'Hinzugefügt', mono: true, sortable: true }
	];
	const texts = {
		searchLabel: 'Lacke filtern',
		searchPlaceholder: 'Name, Marke, Finish …',
		empty: 'Keine Lacke vorhanden',
		emptyFiltered: 'Kein Lack passt zu „{query}“',
		resultsLabel: '{count} Lacke',
		filteredLabel: '{count} von {total} Lacken',
		selectedLabel: '{count} gewählt',
		sortedLabel: 'Sortiert nach {column}, {direction}',
		ascendingLabel: 'aufsteigend',
		descendingLabel: 'absteigend',
		loadingLabel: 'Lädt …',
		selectAllLabel: 'Alle Zeilen dieser Seite wählen',
		selectRowLabel: '{row} wählen',
		paginationLabel: 'Seiten der Tabelle',
		prevLabel: 'Zurück',
		nextLabel: 'Weiter',
		pageLabel: 'Seite',
		ofLabel: 'von'
	};
	let selected = $state<DataRowKey[]>(['Mintgrün Nr. 1']);
	let loading = $state(false);
	let lastSort = $state('noch nicht sortiert');

	/* Stat and Sparkline */
	const walk = (seed: number, n: number, start: number, drift: number): number[] => {
		const r = rng(seed);
		let v = start;
		return Array.from({ length: n }, () => (v = Math.max(1, v + (r() - 0.5) * 10 + drift)));
	};
	const visits = walk(3, 30, 40, 0.8);
	const orders = walk(11, 30, 60, 0.3);
	const errors = walk(21, 30, 30, -0.7);
	const latency = walk(5, 30, 80, 0);
	const trend30 = (what: string): string => `${what}, letzte 30 Tage: von {first} auf {last}, Tief {min}, Hoch {max}`;
	const trendLabel = 'Verlauf: Start {first}, Ende {last}, Tief {min}, Hoch {max}';
	const errorUp = 'gestiegen um {value}';
	const errorDown = 'gesunken um {value}';

	/* Heatmap */
	const heatEnd = Date.UTC(2026, 10, 18);
	const heatRandom = rng(99);
	const activity = Array.from({ length: 365 }, (_, i) => {
		const day = heatEnd - (364 - i) * DAY;
		const wd = new Date(day).getUTCDay();
		const busy = wd === 0 || wd === 6 ? 0.25 : 0.8;
		const burst = Math.sin(i / 23) > 0.2 ? 1.6 : 0.6;
		return { date: iso(day), value: heatRandom() < busy ? Math.round(heatRandom() * 9 * burst) : 0 };
	});
	const heatCell = '{date}: {value} Beiträge';
	const heatCellShort = '{date}: {value}';
	let picked = $state('Noch kein Tag gewählt.');

	/* HistoryBar */
	const hbRandom = rng(41);
	const history: HistoryItem[] = Array.from({ length: 90 }, (_, i): HistoryItem => {
		const label = new Date(heatEnd - (89 - i) * DAY).toLocaleDateString('de-DE', { day: 'numeric', month: 'short', timeZone: 'UTC' });
		const r = hbRandom();
		if (i < 6) return { label, status: 'none' };
		if (i === 61 || i === 62) return { label, status: 'down', detail: 'Ausfall: 38 Minuten' };
		if (r > 0.985) return { label, status: 'down', detail: 'Ausfall: 4 Minuten' };
		if (r > 0.93) return { label, status: 'warn', detail: 'Antwortzeiten erhöht' };
		return { label, status: 'ok' };
	});
	const steady: HistoryItem[] = Array.from({ length: 30 }, (_, i): HistoryItem => ({ label: `Tag ${i + 1}`, status: 'ok' }));
	const available = '{percent} % verfügbar';
	const okLabel = '{percent} % in Ordnung';
	const historyNames = { ok: 'In Ordnung', warn: 'Eingeschränkt', down: 'Ausfall', none: 'Keine Daten' };

	/* Timeline */
	const timelineNames = { done: 'Erledigt', current: 'Aktuell', upcoming: 'Ausstehend', error: 'Fehlgeschlagen' };
	const order: TimelineItem[] = [
		{ id: 'o1', title: 'Bestellung eingegangen', time: '2026-11-14T09:12', description: 'Zahlung per Rechnung bestätigt.', status: 'done' },
		{
			id: 'o2',
			title: 'Lack verpackt',
			time: '2026-11-15T14:40',
			description: 'Drei Fläschchen, mit Seidenpapier gepolstert.',
			status: 'done'
		},
		{ id: 'o3', title: 'Beim Paketdienst', time: '2026-11-17', description: 'Zustellung heute zwischen 14 und 18 Uhr.', status: 'current' },
		{ id: 'o4', title: 'Zugestellt', time: 'voraussichtlich 18. November', status: 'upcoming' }
	];
	const deploy: TimelineItem[] = [
		{ id: 'd1', title: 'Build gestartet', time: '2026-11-18T08:00', status: 'done' },
		{
			id: 'd2',
			title: 'Tests fehlgeschlagen',
			time: '2026-11-18T08:06',
			description: '2 von 148 Tests sind rot. Die Veröffentlichung ist angehalten.',
			status: 'error'
		},
		{ id: 'd3', title: 'Veröffentlichung', status: 'upcoming' }
	];
</script>

<section>
	<h2>DataTable</h2>
	<div class="row">
		<Switch label="Lädt noch" bind:checked={loading} />
	</div>
	<DataTable
		caption="Nagellacke"
		{columns}
		rows={polishes}
		rowKey="name"
		selectable
		bind:selected
		pageSize={6}
		{loading}
		{...texts}
		onsort={(s) => (lastSort = `${s.key}, ${s.dir === 'asc' ? 'aufsteigend' : 'absteigend'}`)}
	>
		{#snippet cell({ row, column, value })}
			{#if column.key === 'finish'}
				<Badge tone={value === 'Glitzer' ? 'accent' : 'neutral'}>{value}</Badge>
			{:else if column.key === 'stock'}
				{#if Number(value) === 0}<Badge tone="danger">leer</Badge>{:else if Number(value) < 3}<Badge tone="warn">
						{value}
					</Badge>{:else}{value}{/if}
			{:else if column.format}
				{column.format(value, row)}
			{:else}
				{value}
			{/if}
		{/snippet}
	</DataTable>
	<p class="muted m0">Gewählt: {selected.length} · Sortierung: {lastSort}</p>
</section>

<section>
	<h2>Stat</h2>
	<div class="grid4">
		<Stat label="Besuche" value={12480} delta={12.4} deltaLabel="zur Vorwoche" locale="de-DE">
			{#snippet spark()}<Sparkline values={visits} variant="area" label={trend30('Besuche')} locale="de-DE" />{/snippet}
		</Stat>
		<Stat label="Bestellungen" value={348} delta={-3.1} deltaLabel="zur Vorwoche" locale="de-DE">
			{#snippet spark()}<Sparkline values={orders} variant="bar" label={trend30('Bestellungen')} locale="de-DE" />{/snippet}
		</Stat>
		<Stat
			label="Fehlerrate"
			value="0,8"
			unit="%"
			delta={0.3}
			deltaUnit="Pkt."
			positiveIsGood={false}
			deltaLabel="zur Vorwoche"
			upLabel={errorUp}
			downLabel={errorDown}
			locale="de-DE"
		>
			{#snippet spark()}<Sparkline values={errors} label={trend30('Fehlerrate')} locale="de-DE" />{/snippet}
		</Stat>
		<Stat
			label="Antwortzeit"
			value={182}
			unit="ms"
			delta={0}
			deltaLabel="zur Vorwoche"
			flatLabel="unverändert"
			description="Median über alle Anfragen."
			locale="de-DE"
		>
			{#snippet spark()}<Sparkline values={latency} label={trend30('Antwortzeit')} locale="de-DE" />{/snippet}
		</Stat>
	</div>
</section>

<section>
	<h2>Sparkline</h2>
	<div class="grid3">
		<div class="stack">
			<p class="muted m0">Linie</p>
			<Sparkline values={visits} locale="de-DE" label={trendLabel} />
		</div>
		<div class="stack">
			<p class="muted m0">Fläche, 56 px hoch</p>
			<Sparkline values={orders} variant="area" height={56} locale="de-DE" label={trendLabel} />
		</div>
		<div class="stack">
			<p class="muted m0">Balken</p>
			<Sparkline values={latency.slice(0, 14)} variant="bar" locale="de-DE" label={trendLabel} />
		</div>
		<div class="stack">
			<p class="muted m0">Ein Wert</p>
			<Sparkline values={[4]} label={trendLabel} />
		</div>
		<div class="stack">
			<p class="muted m0">Keine Daten</p>
			<Sparkline values={[]} emptyLabel="Keine Daten" />
		</div>
		<div class="stack">
			<p class="muted m0">Feste Skala von 0 bis 200</p>
			<Sparkline values={latency} min={0} max={200} locale="de-DE" label={trendLabel} />
		</div>
	</div>
</section>

<section>
	<h2>Heatmap</h2>
	<Heatmap
		data={activity}
		label="Aktivität der letzten zwölf Monate"
		locale="de-DE"
		cellLabel={heatCell}
		lessLabel="Weniger"
		moreLabel="Mehr"
		onselect={(d) => (picked = `Gewählt: ${d.date} mit ${d.value} Beiträgen`)}
	/>
	<p class="muted m0" aria-live="polite">{picked}</p>
	<h3>Sonntag als Wochenstart, kurzer Zeitraum</h3>
	<div class="narrow">
		<Heatmap
			data={activity.slice(-40)}
			label="Die letzten 40 Tage"
			locale="de-DE"
			weekStart={0}
			cellSize={20}
			cellLabel={heatCellShort}
			lessLabel="Weniger"
			moreLabel="Mehr"
		/>
	</div>
</section>

<section>
	<h2>HistoryBar</h2>
	<HistoryBar
		items={history}
		label="Verfügbarkeit der letzten 90 Tage"
		locale="de-DE"
		summaryLabel={available}
		noDataLabel="Keine Daten"
		statusLabels={historyNames}
		startLabel="vor 90 Tagen"
		endLabel="heute"
	/>
	<HistoryBar items={steady} label="Verfügbarkeit des Testsystems" legend={false} summaryLabel={okLabel} locale="de-DE" />
</section>

<section>
	<h2>Timeline</h2>
	<div class="grid2">
		<Timeline items={order} label="Verlauf der Bestellung" statusLabels={timelineNames} locale="de-DE" />
		<Timeline items={deploy} label="Verlauf der Veröffentlichung" statusLabels={timelineNames} locale="de-DE">
			{#snippet item({ item })}
				<p class="tl-title">{item.title}</p>
				{#if item.description}<p class="muted m0">{item.description}</p>{/if}
			{/snippet}
		</Timeline>
	</div>
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
	h3 {
		margin: 0;
		font-size: var(--k-text-md);
		font-weight: var(--k-weight-heading);
	}
	.row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--k-space-3);
	}
	.stack {
		display: grid;
		gap: var(--k-space-2);
		align-content: start;
		min-width: 0;
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
	.grid4 {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: var(--k-space-4);
	}
	.m0 {
		margin: 0;
	}
	.muted {
		color: var(--k-fg-muted);
		font-size: var(--k-text-sm);
	}
	.narrow {
		max-width: 360px;
	}
	.tl-title {
		margin: 0;
		font-weight: var(--k-weight-heading);
	}
	@media (max-width: 1000px) {
		.grid4 {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
	@media (max-width: 760px) {
		.grid2,
		.grid3,
		.grid4 {
			grid-template-columns: 1fr;
		}
	}
</style>
