<script lang="ts">
	import Label from '../../lib/components/Label.svelte';
	import NumberInput from '../../lib/components/NumberInput.svelte';
	import PinInput from '../../lib/components/PinInput.svelte';
	import Rating from '../../lib/components/Rating.svelte';
	import SegmentedControl from '../../lib/components/SegmentedControl.svelte';
	import Stepper from '../../lib/components/Stepper.svelte';
	import TagInput from '../../lib/components/TagInput.svelte';
	import ColorPicker from '../../lib/components/ColorPicker.svelte';
	import Button from '../../lib/components/Button.svelte';
	import { toast } from '../../lib/components/toast.svelte.js';
	import type { SegmentOption } from '../../lib/components/SegmentedControl.svelte';
	import type { StepItem } from '../../lib/components/Stepper.svelte';

	let note = $state('');
	let amount = $state<number | null>(2);
	let price = $state<number | null>(12.5);
	let code = $state('');
	let codeDone = $state(false);
	let stars = $state(4);
	let view = $state('grid');
	let period = $state('month');
	let step = $state(1);
	let labels = $state(['Gel', 'Pastell']);
	let colors = $state<string[]>([]);
	let color = $state('#2c4f38');
	let tint = $state('#ff79b0cc');
	let formOut = $state('');

	const views: SegmentOption[] = [
		{ value: 'grid', label: 'Raster' },
		{ value: 'list', label: 'Liste' },
		{ value: 'map', label: 'Karte' }
	];
	const periods: SegmentOption[] = [
		{ value: 'day', label: 'Tag' },
		{ value: 'week', label: 'Woche' },
		{ value: 'month', label: 'Monat' },
		{ value: 'year', label: 'Jahr', disabled: true }
	];
	const steps: StepItem[] = [
		{ id: 'cart', label: 'Warenkorb', description: '3 Artikel' },
		{ id: 'address', label: 'Adresse', description: 'Lieferung und Rechnung' },
		{ id: 'pay', label: 'Zahlung' },
		{ id: 'done', label: 'Bestätigung' }
	];
	const swatches = ['#2c4f38', '#d77b6f', '#f5c518', '#3f2a8c', '#10a916', '#ff79b0', '#101012', '#ffffff'];
	const suggestions = ['Gel', 'Matt', 'Pastell', 'Glitzer', 'Holo', 'Neon', 'Nude', 'Crème', 'Chrom', 'Magnet'];

	function submit(e: SubmitEvent) {
		e.preventDefault();
		const data = new FormData(e.currentTarget as HTMLFormElement);
		const out: Record<string, string | string[]> = {};
		for (const key of new Set(data.keys())) {
			const all = data.getAll(key).map(String);
			out[key] = all.length > 1 ? all : all[0];
		}
		formOut = JSON.stringify(out);
	}
</script>

<section>
	<h2>Label</h2>
	<div class="grid2">
		<div class="stack">
			<Label for="demo-note" required>Notiz zum Lack</Label>
			<textarea id="demo-note" class="native" bind:value={note} rows="2" required></textarea>
		</div>
		<p class="muted">Eigenständiges Label im Look von Field, für eigene Layouts.</p>
	</div>
</section>

<section>
	<h2>NumberInput</h2>
	<div class="grid2">
		<NumberInput label="Menge" bind:value={amount} min={0} max={20} hint="0 bis 20 · Pfeile, Bild auf/ab (×10), Pos1/Ende" decrementLabel="Weniger" incrementLabel="Mehr" name="menge" />
		<NumberInput label="Preis" bind:value={price} min={0} step={0.5} locale="de-DE" format={{ style: 'currency', currency: 'EUR' }} hint="Formatiert, solange das Feld keinen Fokus hat." decrementLabel="Weniger" incrementLabel="Mehr" />
		<p class="muted">Werte: {amount ?? '–'} · {price ?? '–'}</p>
	</div>
</section>

<section>
	<h2>PinInput</h2>
	<div class="grid2">
		<PinInput
			label="Bestätigungscode"
			bind:value={code}
			hint="Sechs Ziffern aus der SMS. Einfügen füllt alle Felder."
			digitLabel="Ziffer {'{index}'} von {'{length}'}"
			error={codeDone && code !== '123456' ? 'Der Code stimmt nicht (Demo: 123456).' : undefined}
			onchange={() => (codeDone = false)}
			oncomplete={(v) => { codeDone = true; if (v === '123456') toast.ok('Code bestätigt'); }}
			name="code"
		/>
		<PinInput label="Gutschein" type="alphanumeric" length={4} mask digitLabel="Zeichen {'{index}'} von {'{length}'}" hint="Buchstaben und Ziffern, verdeckt." />
	</div>
</section>

<section>
	<h2>Rating</h2>
	<div class="grid2">
		<Rating label="Deine Bewertung" bind:value={stars} starLabel="{'{value}'} von {'{max}'} Sternen" hint="Pfeiltasten ändern die Wahl." />
		<div class="stack">
			<Rating label="Durchschnitt" value={3.6} readonly starLabel="{'{value}'} von {'{max}'} Sternen" />
			<p class="muted">Gewählt: {stars} von 5</p>
		</div>
	</div>
</section>

<section>
	<h2>SegmentedControl</h2>
	<div class="grid2">
		<SegmentedControl label="Ansicht" options={views} bind:value={view} />
		<SegmentedControl label="Zeitraum" options={periods} bind:value={period} block hint="„Jahr“ ist gesperrt." />
		<p class="muted">Ansicht: {view} · Zeitraum: {period}</p>
	</div>
</section>

<section>
	<h2>Stepper</h2>
	<Stepper
		{steps}
		current={step}
		label="Bestellfortschritt"
		completeLabel="erledigt"
		compactLabel="Schritt {'{current}'} von {'{total}'}: {'{label}'}"
		doneLabel="Alle {'{total}'} Schritte erledigt"
		backLabel="Zurück zu {'{label}'}"
		onstep={(i) => (step = i)}
	/>
	<div class="row">
		<Button variant="secondary" size="sm" disabled={step === 0} onclick={() => (step = Math.max(0, step - 1))}>Zurück</Button>
		<Button size="sm" disabled={step >= steps.length} onclick={() => (step = Math.min(steps.length, step + 1))}>Weiter</Button>
		<span class="muted">Erledigte Schritte sind anklickbar. Schmal: kompakte Zeile.</span>
	</div>
	<div class="narrow">
		<Stepper {steps} current={step} orientation="vertical" label="Bestellfortschritt (vertikal)" completeLabel="erledigt" />
	</div>
</section>

<section>
	<h2>TagInput</h2>
	<div class="grid2">
		<TagInput
			label="Schlagwörter"
			bind:value={labels}
			{suggestions}
			max={6}
			placeholder="Wort, dann Enter"
			hint="Enter oder Komma fügt hinzu, Einfügen mit Kommas teilt auf. Höchstens 6."
			removeLabel="{'{tag}'} entfernen"
			instructions="Enter oder Komma fügt ein Schlagwort hinzu. Rücktaste im leeren Feld entfernt das letzte."
			addedText="{'{tag}'} hinzugefügt"
			removedText="{'{tag}'} entfernt"
			duplicateText="{'{tag}'} ist schon dabei"
			maxText="Höchstens {'{max}'} Schlagwörter"
			name="tags"
		/>
		<TagInput
			label="Farben (Groß/Klein zählt)"
			bind:value={colors}
			caseSensitive
			placeholder="z. B. Rot, rot"
			removeLabel="{'{tag}'} entfernen"
			instructions="Enter oder Komma fügt eine Farbe hinzu."
			addedText="{'{tag}'} hinzugefügt"
			removedText="{'{tag}'} entfernt"
			duplicateText="{'{tag}'} ist schon dabei"
		/>
		<p class="muted">Werte: {labels.join(', ') || '–'} · {colors.join(', ') || '–'}</p>
	</div>
</section>

<section>
	<h2>ColorPicker</h2>
	<form class="grid2" onsubmit={submit}>
		<ColorPicker
			label="Lackfarbe"
			bind:value={color}
			{swatches}
			name="farbe"
			hint="#rgb, #rrggbb oder Feld öffnen. Pfeile bewegen, Umschalt = große Schritte."
			pickerLabel="Farbe wählen"
			areaLabel="Sättigung und Helligkeit"
			areaText="Sättigung {'{saturation}'} %, Helligkeit {'{brightness}'} %"
			hueLabel="Farbton"
			swatchesLabel="Vorlagen"
			invalidText="Bitte eine Farbe wie #rgb, #rrggbb oder #rrggbbaa eingeben."
		/>
		<ColorPicker
			label="Akzent mit Deckkraft"
			bind:value={tint}
			alpha
			name="akzent"
			pickerLabel="Farbe wählen"
			areaLabel="Sättigung und Helligkeit"
			areaText="Sättigung {'{saturation}'} %, Helligkeit {'{brightness}'} %"
			hueLabel="Farbton"
			alphaLabel="Deckkraft"
			invalidText="Bitte eine Farbe wie #rgb, #rrggbb oder #rrggbbaa eingeben."
		/>
		<div class="row">
			<span class="dot" style:background={color} aria-hidden="true"></span>
			<span class="dot" style:background={tint} aria-hidden="true"></span>
			<span class="muted">{color || '–'} · {tint || '–'}</span>
		</div>
		<div class="row">
			<Button type="submit" variant="secondary" size="sm">Formular lesen</Button>
			<output class="muted">{formOut}</output>
		</div>
	</form>
</section>

<style>
	section { display: grid; gap: var(--k-space-5); padding: var(--k-space-8) 0; border-bottom: var(--k-border-w) solid var(--k-line); }
	h2 { margin: 0; font-family: var(--k-label-font); font-size: var(--k-label-size); font-weight: var(--k-weight-label); text-transform: var(--k-label-transform); letter-spacing: var(--k-label-tracking); color: var(--k-fg-muted); }
	.row { display: flex; flex-wrap: wrap; align-items: center; gap: var(--k-space-3); }
	.stack { display: grid; gap: var(--k-space-2); align-content: start; }
	.grid2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--k-space-5); align-items: start; }
	.narrow { max-width: 360px; }
	.muted { color: var(--k-fg-muted); margin: 0; overflow-wrap: anywhere; }
	.native {
		box-sizing: border-box;
		width: 100%;
		padding: var(--k-space-2) var(--k-space-4);
		border: var(--k-border-w) solid var(--k-border);
		border-radius: var(--k-radius-field);
		background: var(--k-bg-raised);
		color: var(--k-fg);
		font: inherit;
		resize: vertical;
	}
	.native:focus-visible { outline: var(--k-focus-w) solid var(--k-focus); outline-offset: var(--k-focus-offset); border-color: var(--k-accent); }
	.dot { width: 24px; height: 24px; border: var(--k-border-w) solid var(--k-border); border-radius: var(--k-radius-badge); }
	@media (max-width: 760px) { .grid2 { grid-template-columns: 1fr; } }
</style>
