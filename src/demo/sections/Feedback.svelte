<script lang="ts">
	import Button from '../../lib/components/Button.svelte';
	import Modal from '../../lib/components/Modal.svelte';
	import Progress from '../../lib/components/Progress.svelte';
	import { toast } from '../../lib/components/toast.svelte.js';

	let files = $state(3);
	let blocking = $state(false);
	let confirming = $state(false);
	let trash = $state<string[]>([]);
	let removed = $state(0);

	// nagellacke's Snackbar: delete now, undo for a while, commit once the toast is gone.
	function remove(name: string) {
		trash = [...trash, name];
		toast({
			message: `„${name}“ gelöscht`,
			key: 'undo',
			onundo: () => (trash = trash.filter((n) => n !== name)),
			oncommit: () => removed++
		});
	}
</script>

<section>
	<h2>Rückmeldung</h2>
	<div class="grid">
		<Progress label="Speicher voll" value={100} tone="warn" showValue />
		<Progress label="Dateien" value={files} max={12} valueText="{files} von 12 Dateien" showValue />
		<Progress label="Wird synchronisiert" />
		<Progress label="Speicher fast voll, Synchronisierung läuft" tone="warn" />
		<Progress label="Upload ohne sichtbare Beschriftung" value={40} hideLabel />
	</div>
	<div class="row">
		<Button variant="secondary" onclick={() => (files = (files % 12) + 1)}>Nächste Datei</Button>
		<Button variant="secondary" onclick={() => remove(`Lack ${trash.length + 1}`)}>Löschen mit Rückgängig</Button>
		<Button variant="secondary" onclick={() => toast.warn('Speicher fast voll')}>Warnung (10 s)</Button>
		<Button variant="secondary" onclick={() => toast.danger('Synchronisierung fehlgeschlagen')}>Fehler (bleibt)</Button>
		<Button variant="ghost" onclick={() => toast.clear()}>Alle schließen</Button>
	</div>
	<p class="m0">Im Papierkorb: {trash.length}, endgültig gelöscht: {removed}. Hovern oder Fokus hält den Toast an.</p>
	<div class="row">
		<Button onclick={() => (blocking = true)}>Blockierender Dialog</Button>
		<Button variant="danger" onclick={() => (confirming = true)}>Bestätigung (alertdialog)</Button>
	</div>
</section>

<Modal bind:open={blocking} title="Lokale Daten übernehmen?" dismissible={false} initialFocus="[data-primary]">
	<p class="m0">Bis du dich entscheidest, wird nichts synchronisiert. Escape, Hintergrund und ✕ schließen diesen Dialog nicht.</p>
	{#snippet footer()}
		<Button variant="secondary" onclick={() => (blocking = false)}>Später</Button>
		<Button
			data-primary
			onclick={() => {
				blocking = false;
				toast.ok('Übernommen');
			}}
		>
			Übernehmen
		</Button>
	{/snippet}
</Modal>

<Modal bind:open={confirming} title="Änderungen verwerfen?" alert size="sm" initialFocus="[data-keep]" closeLabel="Schließen">
	<p class="m0">Deine Änderungen gehen verloren.</p>
	{#snippet footer()}
		<Button variant="secondary" data-keep onclick={() => (confirming = false)}>Weiter bearbeiten</Button>
		<Button
			variant="danger"
			onclick={() => {
				confirming = false;
				toast('Verworfen');
			}}
		>
			Verwerfen
		</Button>
	{/snippet}
</Modal>

<style>
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
		gap: var(--k-space-4);
	}
	.row {
		display: flex;
		flex-wrap: wrap;
		gap: var(--k-space-3);
		margin-top: var(--k-space-4);
	}
	.m0 {
		margin: var(--k-space-4) 0 0;
	}
</style>
