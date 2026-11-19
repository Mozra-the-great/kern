<script lang="ts">
	// Reorder and select (#68): SortableList (buttons, drag and drop as an extra, announcements by the host)
	// and SelectGrid (multi-select listbox of pictures, optional reordering).
	import Button from '../../lib/components/Button.svelte';
	import SelectGrid, { type SelectGridItem } from '../../lib/components/SelectGrid.svelte';
	import SortableList, { type SortableItem } from '../../lib/components/SortableList.svelte';
	import { announce } from '../../lib/components/announcer.js';
	import { moveItem, type ItemKey } from '../../lib/components/reorder.js';

	let files: SortableItem[] = $state([
		{ id: 1, label: 'Rechnung-Mai.pdf', description: '3 Seiten, 120 KB' },
		{ id: 2, label: 'Vertrag.pdf', description: '12 Seiten, 1,4 MB' },
		{ id: 3, label: 'Anlage-A-sehr-langer-Dateiname-fuer-den-Umbruch-auf-schmalen-Bildschirmen.pdf', description: '1 Seite, 40 KB' },
		{ id: 4, label: 'Notizen.pdf', description: '2 Seiten, 18 KB' }
	]);
	let last = $state('');

	// The list never reorders itself; the app does, and says what happened (the focus stays on the button).
	function moveFile(from: number, to: number): void {
		const name = files[from]?.label ?? '';
		files = moveItem(files, from, to);
		last = `${name}: Position ${to + 1} von ${files.length}`;
		announce(`${name} verschoben, Position ${to + 1} von ${files.length}`);
	}
	function removeFile(index: number): void {
		const name = files[index]?.label ?? '';
		files = files.filter((_, i) => i !== index);
		last = `${name} entfernt`;
		announce(`${name} entfernt, ${files.length} Dateien übrig`);
	}

	const tones = ['#f5c518', '#5b3fc4', '#2d9d78', '#d6455d', '#2f7fc1', '#e07b39', '#7a5c3e', '#4a4a58'];
	/** A page-like picture as an SVG data URL, so the demo needs no files. */
	function page(number: number): string {
		const tone = tones[(number - 1) % tones.length] ?? '#888';
		const svg =
			`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 120"><rect width="90" height="120" fill="#fff" stroke="#888"/>` +
			`<rect x="10" y="12" width="40" height="8" fill="${tone}"/>` +
			[34, 46, 58, 70, 82].map((y) => `<rect x="10" y="${y}" width="${70 - (y % 3) * 10}" height="4" fill="#bbb"/>`).join('') +
			`</svg>`;
		return `data:image/svg+xml,${encodeURIComponent(svg)}`;
	}
	let pages: SelectGridItem[] = $state(Array.from({ length: 11 }, (_, i) => ({ id: i + 1, label: `Seite ${i + 1}`, src: page(i + 1) })));
	let selected: ItemKey[] = $state([2, 3]);
	let moved = $state('');

	function movePage(from: number, to: number): void {
		pages = moveItem(pages, from, to);
		moved = `${pages[to]?.label ?? ''} an Position ${to + 1}`;
		announce(`${pages[to]?.label ?? ''} verschoben, Position ${to + 1} von ${pages.length}`);
	}
</script>

<section>
	<h2>Sortieren und Auswählen</h2>
	<p class="m0">
		<code>SortableList</code>: Hoch, Runter und Entfernen als Knöpfe, deren Name den Eintrag nennt. Nach einer Verschiebung bleibt der Fokus
		auf dem gedrückten Knopf, am Listenende wechselt er zum Partner. Ziehen mit der Maus geht zusätzlich. Die Ansage („verschoben, Position
		2 von 4“) macht die App mit <code>announce()</code>.
	</p>
	<SortableList items={files} label="Dateien zum Zusammenfügen" onmove={moveFile} onremove={removeFile} />
	<p class="m0 muted">{last === '' ? 'Letzte Aktion: keine' : `Letzte Aktion: ${last}`}</p>
	{#if files.length === 0}
		<Button variant="secondary" size="sm" onclick={() => (files = [{ id: 1, label: 'Neu.pdf', description: '1 Seite, 9 KB' }])}>
			Eine Datei hinzufügen
		</Button>
	{/if}

	<p class="m0">
		<code>SelectGrid</code>: Bilder als Mehrfachauswahl mit einem Tab-Stopp. Pfeiltasten (Zeile aus dem Layout), Pos1/Ende, Bild auf/ab,
		Leertaste wählt, Umschalt erweitert, Strg+A alles, Esc leert. Mit <code>reorderable</code> verschiebt Alt+Pfeil die Seite.
	</p>
	<SelectGrid items={pages} bind:selected label="Seiten" reorderable onmove={movePage} min="110px" />
	<div class="row">
		<Button variant="secondary" size="sm" onclick={() => (selected = pages.map((p) => p.id))}>Alle wählen</Button>
		<Button variant="secondary" size="sm" disabled={selected.length === 0} onclick={() => (selected = [])}>Auswahl leeren</Button>
		<Button
			variant="secondary"
			size="sm"
			disabled={selected.length === 0}
			onclick={() => {
				pages = pages.filter((p) => !selected.includes(p.id));
				selected = [];
			}}
		>
			Gewählte entfernen
		</Button>
	</div>
	<p class="m0 muted">
		Gewählt: {selected.length === 0 ? 'keine' : selected.join(', ')}{moved === '' ? '' : `. Zuletzt verschoben: ${moved}`}
	</p>
</section>

<style>
	.muted {
		color: var(--k-fg-muted);
		font-size: var(--k-text-sm);
	}
</style>
