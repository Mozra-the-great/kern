<script lang="ts">
	import Popover from '../../lib/components/Popover.svelte';
	import Combobox from '../../lib/components/Combobox.svelte';
	import ContextMenu from '../../lib/components/ContextMenu.svelte';
	import CommandPalette from '../../lib/components/CommandPalette.svelte';
	import TreeView from '../../lib/components/TreeView.svelte';
	import DatePicker from '../../lib/components/DatePicker.svelte';
	import Button from '../../lib/components/Button.svelte';
	import Input from '../../lib/components/Input.svelte';
	import Switch from '../../lib/components/Switch.svelte';
	import { toast } from '../../lib/components/toast.svelte.js';
	import type { ComboboxOption } from '../../lib/components/Combobox.svelte';
	import type { Command } from '../../lib/components/CommandPalette.svelte';
	import type { TreeNode } from '../../lib/components/TreeView.svelte';

	let popoverOpen = $state(false);
	let color = $state('');
	let city = $state('koeln');
	let tagText = $state('');
	let paletteOpen = $state(false);
	let selectedNode = $state<string | undefined>('fotos-2026');
	let expandedNodes = $state<string[]>(['fotos']);
	let date = $state('');
	let deadline = $state('2026-11-30');

	const colors: ComboboxOption[] = [
		{ value: 'rose', label: 'Altrosa' },
		{ value: 'bordeaux', label: 'Bordeaux' },
		{ value: 'creme', label: 'Crème brûlée' },
		{ value: 'flieder', label: 'Flieder' },
		{ value: 'glitzer', label: 'Glitzer Gold', disabled: true },
		{ value: 'koralle', label: 'Koralle' },
		{ value: 'mint', label: 'Mint' },
		{ value: 'nude', label: 'Nude' },
		{ value: 'petrol', label: 'Petrol' },
		{ value: 'tuerkis', label: 'Türkis' }
	];
	const cities: ComboboxOption[] = [
		{ value: 'berlin', label: 'Berlin' },
		{ value: 'duesseldorf', label: 'Düsseldorf' },
		{ value: 'hamburg', label: 'Hamburg' },
		{ value: 'koeln', label: 'Köln' },
		{ value: 'muenchen', label: 'München' },
		{ value: 'zuerich', label: 'Zürich' }
	];
	const commands: Command[] = [
		{
			id: 'new-file',
			label: 'Neue Datei',
			group: 'Dateien',
			shortcut: 'Strg+N',
			keywords: ['erstellen', 'anlegen'],
			onselect: () => toast('Neue Datei')
		},
		{ id: 'upload', label: 'Hochladen', group: 'Dateien', keywords: ['import'], onselect: () => toast('Hochladen') },
		{
			id: 'share',
			label: 'Link teilen',
			group: 'Dateien',
			shortcut: 'Strg+L',
			keywords: ['freigabe'],
			onselect: () => toast.ok('Link kopiert')
		},
		{
			id: 'theme',
			label: 'Theme wechseln',
			group: 'Ansicht',
			keywords: ['farbe', 'dunkel', 'hell'],
			onselect: () => toast('Theme oben rechts wählen')
		},
		{ id: 'grid', label: 'Rasteransicht', group: 'Ansicht', onselect: () => toast('Raster') },
		{
			id: 'settings',
			label: 'Einstellungen öffnen',
			group: 'Konto',
			shortcut: 'Strg+,',
			keywords: ['optionen'],
			onselect: () => toast('Einstellungen')
		},
		{ id: 'logout', label: 'Abmelden', group: 'Konto', onselect: () => toast.danger('Abgemeldet') }
	];
	const tree: TreeNode[] = [
		{
			id: 'fotos',
			label: 'Fotos',
			children: [
				{
					id: 'fotos-2025',
					label: '2025',
					children: [
						{ id: 'fotos-2025-urlaub', label: 'Urlaub' },
						{ id: 'fotos-2025-familie', label: 'Familie' }
					]
				},
				{ id: 'fotos-2026', label: '2026' },
				{ id: 'fotos-privat', label: 'Privat (gesperrt)', disabled: true }
			]
		},
		{
			id: 'dokumente',
			label: 'Dokumente',
			children: [
				{ id: 'rechnungen', label: 'Rechnungen', children: [{ id: 'rechnung-0412', label: 'rechnung-0412.pdf' }] },
				{ id: 'vertraege', label: 'Verträge' }
			]
		},
		{ id: 'notizen', label: 'notizen.md' }
	];
	const nodeLabel = (id: string | undefined): string => {
		const find = (list: readonly TreeNode[]): TreeNode | undefined => {
			for (const n of list) {
				if (n.id === id) return n;
				const hit = n.children ? find(n.children) : undefined;
				if (hit) return hit;
			}
			return undefined;
		};
		return find(tree)?.label ?? '–';
	};
	const today = new Date();
	const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
	const minDate = iso(today);
	const maxDate = iso(new Date(today.getFullYear(), today.getMonth() + 3, today.getDate()));
</script>

<section>
	<h2>Popover</h2>
	<div class="row">
		<Popover label="Filter" bind:open={popoverOpen}>
			<div class="stack">
				<Input label="Name enthält" placeholder="z. B. Urlaub" />
				<Switch label="Nur geteilte" />
				<div class="row end"><Button size="sm" onclick={() => (popoverOpen = false)}>Anwenden</Button></div>
			</div>
		</Popover>
		<Popover label="Info zum Speicher" triggerVariant="ghost" placement="bottom-end">
			{#snippet trigger()}<svg class="icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
					<circle cx="10" cy="10" r="8" /><path d="M10 9v5M10 6v.5" />
				</svg>{/snippet}
			<p class="m0">18,2 GB von 50 GB belegt. Der Papierkorb zählt mit.</p>
		</Popover>
		<span class="muted">Status: {popoverOpen ? 'offen' : 'zu'}</span>
	</div>
</section>

<section>
	<h2>Combobox</h2>
	<div class="grid2">
		<Combobox
			label="Farbe"
			options={colors}
			bind:value={color}
			placeholder="Tippen zum Filtern"
			hint="„creme“ findet auch „Crème“."
			noResults="Keine Treffer"
			toggleLabel="Optionen anzeigen"
			name="farbe"
		/>
		<Combobox label="Stadt" options={cities} bind:value={city} noResults="Keine Treffer" toggleLabel="Optionen anzeigen" />
		<Combobox
			label="Schlagwort"
			options={colors}
			bind:value={tagText}
			allowCustom
			placeholder="Eigenes Wort erlaubt"
			noResults="Neues Schlagwort – Enter übernimmt"
			toggleLabel="Optionen anzeigen"
		/>
		<p class="muted">Werte: {color || '–'} · {city || '–'} · {tagText || '–'}</p>
	</div>
</section>

<section>
	<h2>ContextMenu</h2>
	<ContextMenu
		label="Dateiaktionen"
		areaLabel="Datei urlaub-2026.zip"
		items={[
			{ type: 'label', label: 'urlaub-2026.zip' },
			{ id: 'open', label: 'Öffnen', shortcut: 'Enter', onselect: () => toast('Öffnen') },
			{ id: 'rename', label: 'Umbenennen', shortcut: 'F2', onselect: () => toast('Umbenennen') },
			{ id: 'move', label: 'Verschieben', disabled: true },
			{ type: 'separator' },
			{ id: 'delete', label: 'Löschen', danger: true, onselect: () => toast.danger('Gelöscht') }
		]}
	>
		<div class="target">
			<strong>urlaub-2026.zip</strong>
			<span class="muted">Rechtsklick, lange drücken oder Umschalt+F10</span>
		</div>
	</ContextMenu>
</section>

<section>
	<h2>CommandPalette</h2>
	<div class="row">
		<Button variant="secondary" onclick={() => (paletteOpen = true)}>Befehle öffnen</Button>
		<span class="muted">oder <kbd>Strg</kbd>/<kbd>⌘</kbd> + <kbd>K</kbd></span>
	</div>
	<CommandPalette
		bind:open={paletteOpen}
		{commands}
		hotkey="mod+k"
		label="Befehlspalette"
		placeholder="Befehl suchen …"
		empty="Kein passender Befehl"
		closeLabel="Schließen"
	/>
</section>

<section>
	<h2>TreeView</h2>
	<div class="grid2">
		<TreeView nodes={tree} bind:selected={selectedNode} bind:expanded={expandedNodes} label="Ordner" />
		<div class="stack">
			<p class="muted">Gewählt: {nodeLabel(selectedNode)}</p>
			<p class="muted">Pfeiltasten bewegen, Enter wählt, <kbd>*</kbd> klappt Geschwister auf, Buchstaben springen.</p>
			<TreeView nodes={tree} label="Ordner mit Symbolen">
				{#snippet item(node, state)}
					<span class="node">
						<svg class="icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
							{#if state.hasChildren}<path d="M2.5 5.5h5l2 2h8v8.5h-15z" />{:else}<path d="M5 2.5h7l3 3v12H5z" />{/if}
						</svg>
						{node.label}
					</span>
				{/snippet}
			</TreeView>
		</div>
	</div>
</section>

<section>
	<h2>DatePicker</h2>
	<div class="grid2">
		<DatePicker
			label="Datum"
			bind:value={date}
			locale="de-DE"
			placeholder="TT.MM.JJJJ"
			hint="Tippen (18.11.2026 oder 2026-11-18) oder Kalender."
			calendarLabel="Datum wählen"
			prevMonthLabel="Vorheriger Monat"
			nextMonthLabel="Nächster Monat"
			invalidText="Bitte ein gültiges Datum eingeben."
			name="datum"
		/>
		<DatePicker
			label="Frist"
			bind:value={deadline}
			min={minDate}
			max={maxDate}
			locale="de-DE"
			placeholder="TT.MM.JJJJ"
			hint="Nur die nächsten drei Monate."
			calendarLabel="Datum wählen"
			prevMonthLabel="Vorheriger Monat"
			nextMonthLabel="Nächster Monat"
			invalidText="Datum außerhalb des Zeitraums."
		/>
		<p class="muted">ISO-Werte: {date || '–'} · {deadline || '–'}</p>
	</div>
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
		gap: var(--k-space-3);
	}
	.end {
		justify-content: flex-end;
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
		align-items: start;
	}
	.m0 {
		margin: 0;
	}
	.muted {
		color: var(--k-fg-muted);
		margin: 0;
	}
	.icon {
		width: 18px;
		height: 18px;
		flex: none;
	}
	.node {
		display: inline-flex;
		align-items: center;
		gap: var(--k-space-2);
	}
	.target {
		display: grid;
		gap: var(--k-space-1);
		padding: var(--k-space-6);
		border: var(--k-border-w) dashed var(--k-border);
		border-radius: var(--k-radius-card);
		background: var(--k-bg-sunken);
	}
	kbd {
		font-family: var(--k-font-mono);
		font-size: var(--k-text-xs);
		padding: 1px 4px;
		border: var(--k-border-w) solid var(--k-line);
		border-radius: min(var(--k-radius-badge), 4px);
	}
	@media (max-width: 760px) {
		.grid2 {
			grid-template-columns: 1fr;
		}
	}
</style>
