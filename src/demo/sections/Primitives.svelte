<script lang="ts">
	import Code from '../../lib/components/Code.svelte';
	import CopyButton from '../../lib/components/CopyButton.svelte';
	import Kbd from '../../lib/components/Kbd.svelte';
	import RelativeTime from '../../lib/components/RelativeTime.svelte';
	import StatusDot from '../../lib/components/StatusDot.svelte';
	import type { DotStatus } from '../../lib/components/StatusDot.svelte';
	import Card from '../../lib/components/Card.svelte';
	import Switch from '../../lib/components/Switch.svelte';

	const snippet = `import '@mozra-the-great/kern/themes.css';
import { Button, toast } from '@mozra-the-great/kern';

// Ein Klick, ein Toast.
function speichern(): void {
	toast.ok('Gespeichert.');
}`;
	const longLine =
		'curl -fsSL https://example.com/install.sh | sh -s -- --prefix /usr/local --with-completions --without-telemetry --channel stable --verbose';

	const statuses: DotStatus[] = ['ok', 'warn', 'down', 'idle', 'busy'];
	const germanLabels: Record<DotStatus, string> = { ok: 'In Ordnung', warn: 'Eingeschränkt', down: 'Ausfall', idle: 'Inaktiv', busy: 'Beschäftigt' };

	const base = Date.now();
	const second = 1000;
	const minute = 60 * second;
	const hour = 60 * minute;
	const day = 24 * hour;
	const samples: { label: string; at: number }[] = [
		{ label: 'vor 5 Sekunden', at: base - 5 * second },
		{ label: 'vor 3 Minuten', at: base - 3 * minute },
		{ label: 'vor 2 Stunden', at: base - 2 * hour },
		{ label: 'gestern', at: base - day },
		{ label: 'in 2 Tagen', at: base + 2 * day + hour },
		{ label: 'vor 5 Monaten', at: base - 150 * day },
		{ label: 'in einem Jahr', at: base + 400 * day }
	];
	const fixedNow = Date.parse('2026-11-19T12:00:00Z');

	let lastCopied = $state('');
	let pulse = $state(true);

	async function fail(): Promise<string> {
		throw new Error('Quelle nicht erreichbar');
	}
</script>

<section>
	<h2>Code</h2>
	<p class="m0">
		Mit <Code>npm i @mozra-the-great/kern</Code> installierst du das Paket, <Code>--save-dev</Code> ist nicht nötig. Ein sehr langer Ausdruck im Fließtext wie
		<Code>document.querySelector('[data-theme]').getAttribute('data-theme-variant-with-a-long-name')</Code> bricht um.
	</p>
	<div class="grid2">
		<Code block language="TypeScript" lineNumbers copy code={snippet} copyLabel="Kopieren" copiedLabel="Kopiert" copyErrorLabel="Kopieren fehlgeschlagen" />
		<div class="stack">
			<Code block language="bash" copy code={longLine} copyLabel="Kopieren" copiedLabel="Kopiert" copyErrorLabel="Kopieren fehlgeschlagen" />
			<Code block code={'<k-button>Speichern</k-button>'} />
			<Code block lineNumbers startLine={42} code={'const a = 1;\nconst b = 2;\nconsole.log(a + b);'} label="Beispiel ab Zeile 42" />
		</div>
	</div>
</section>

<section>
	<h2>CopyButton</h2>
	<div class="row">
		<CopyButton value="npm i @mozra-the-great/kern" label="Installationsbefehl kopieren" copiedLabel="Kopiert" oncopy={(t) => (lastCopied = t)} />
		<CopyButton value="@mozra-the-great/kern" variant="secondary" label="Paketnamen kopieren" copiedLabel="Kopiert" oncopy={(t) => (lastCopied = t)} />
		<CopyButton value="@mozra-the-great/kern" variant="secondary" size="sm" label="Paketnamen kopieren, klein" copiedLabel="Kopiert" />
		<CopyButton getValue={() => new Date().toISOString()} label="Zeitstempel kopieren" copiedLabel="Kopiert" oncopy={(t) => (lastCopied = t)} />
		<CopyButton getValue={fail} label="Fehlschlag simulieren" errorLabel="Kopieren fehlgeschlagen" variant="secondary" />
		<CopyButton value="gesperrt" label="Kopieren" disabled />
	</div>
	<p class="m0 muted" aria-live="off">Zuletzt kopiert: {lastCopied || 'noch nichts'}</p>
</section>

<section>
	<h2>Kbd</h2>
	<p class="m0">
		Befehlspalette: <Kbd keys={['mod', 'K']} />. Speichern mit <Kbd keys={['mod', 'S']} size="sm" />, schließen mit <Kbd>Esc</Kbd>.
	</p>
	<div class="row">
		<Kbd keys={['mod', 'shift', 'P']} />
		<Kbd keys={['ctrl', 'alt', 'delete']} />
		<Kbd keys={['up']} />
		<Kbd keys={['shift', 'enter']} separator="" />
		<Kbd keys={['g', 'i']} separator="dann" />
		<Kbd keys={['mod', 'K']} platform="mac" labels={{ mod: 'Befehlstaste' }} />
		<Kbd keys={['mod', 'K']} platform="other" labels={{ mod: 'Strg-Taste' }} />
	</div>
</section>

<section>
	<h2>RelativeTime</h2>
	<div class="grid2">
		<ul class="list">
			{#each samples as s (s.label)}
				<li><span class="muted">{s.label}</span> <RelativeTime value={s.at} locale="de-DE" /></li>
			{/each}
		</ul>
		<ul class="list">
			<li><span class="muted">Englisch, kurz</span> <RelativeTime value={base - 3 * minute} locale="en" style="short" /></li>
			<li><span class="muted">Englisch, immer Zahl</span> <RelativeTime value={base - day} locale="en" numeric="always" /></li>
			<li><span class="muted">Französisch, knapp</span> <RelativeTime value={base + 3 * hour} locale="fr" style="narrow" /></li>
			<li><span class="muted">Fester Zeitpunkt (<code>now</code>)</span> <RelativeTime value="2026-11-19T11:55:00Z" now={fixedNow} locale="de" /></li>
			<li><span class="muted">Ungültig</span> <RelativeTime value="kein Datum" fallback="unbekannt" /></li>
		</ul>
	</div>
	<p class="m0 muted">Der Text aktualisiert sich selbst: Sekunden alle 10 s, Minuten alle 30 s, Stunden und mehr alle 5 min.</p>
</section>

<section>
	<h2>StatusDot</h2>
	<Switch label="Puls bei „Beschäftigt“" bind:checked={pulse} />
	<div class="grid2">
		<Card title="Mit Beschriftung">
			<ul class="list">
				{#each statuses as s (s)}
					<li><StatusDot status={s} {pulse} statusLabels={germanLabels} /></li>
				{/each}
			</ul>
		</Card>
		<Card title="Dienste, Status gesprochen">
			<ul class="list">
				<li><StatusDot status="ok" statusLabels={germanLabels} {pulse} label="Datenbank" /></li>
				<li><StatusDot status="warn" statusLabels={germanLabels} {pulse} label="Warteschlange" /></li>
				<li><StatusDot status="down" statusLabels={germanLabels} {pulse} label="Suche" /></li>
				<li><StatusDot status="busy" statusLabels={germanLabels} {pulse} label="Backup" size="sm" /></li>
			</ul>
		</Card>
	</div>
	<div class="row">
		<span class="inline">
			<StatusDot status="ok" statusLabels={germanLabels} labelHidden /> Beschriftung nur für Screenreader
		</span>
		{#each statuses as s (s)}
			<StatusDot status={s} size="sm" {pulse} labelHidden statusLabels={germanLabels} />
		{/each}
	</div>
</section>

<style>
	section { display: grid; gap: var(--k-space-5); padding: var(--k-space-8) 0; border-bottom: var(--k-border-w) solid var(--k-line); }
	h2 { margin: 0; font-family: var(--k-label-font); font-size: var(--k-label-size); font-weight: var(--k-weight-label); text-transform: var(--k-label-transform); letter-spacing: var(--k-label-tracking); color: var(--k-fg-muted); }
	.row { display: flex; flex-wrap: wrap; align-items: center; gap: var(--k-space-3) var(--k-space-5); }
	.stack { display: grid; gap: var(--k-space-4); align-content: start; min-width: 0; }
	.grid2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--k-space-5); }
	.m0 { margin: 0; line-height: 1.9; }
	.muted { color: var(--k-fg-muted); }
	.list { display: grid; gap: var(--k-space-3); margin: 0; padding: 0; list-style: none; }
	.inline { display: inline-flex; align-items: center; gap: var(--k-space-2); }
	@media (max-width: 760px) {
		.grid2 { grid-template-columns: 1fr; }
	}
</style>
