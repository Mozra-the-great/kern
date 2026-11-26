<script lang="ts">
	// Forms and content parity (#50–#54, #72): stuffcloud/nagellacke patterns built from kern.
	import Button from '../../lib/components/Button.svelte';
	import Card from '../../lib/components/Card.svelte';
	import CopyButton from '../../lib/components/CopyButton.svelte';
	import FileDrop from '../../lib/components/FileDrop.svelte';
	import Input from '../../lib/components/Input.svelte';
	import StatusMessage from '../../lib/components/StatusMessage.svelte';
	import { toast } from '../../lib/components/toast.svelte.js';

	interface Polish {
		id: number;
		name: string;
		brand: string;
		color: string;
		count: number;
		empty: boolean;
		photo: boolean;
	}
	let polishes = $state<Polish[]>([
		{ id: 1, name: 'Rubinrot', brand: 'Essie', color: '#b3123f', count: 2, empty: false, photo: false },
		{ id: 2, name: 'Meeresgrün', brand: 'OPI', color: '#2f8f83', count: 1, empty: true, photo: false },
		{ id: 3, name: 'Sandbeige', brand: 'Catrice', color: '#d8b48a', count: 1, empty: false, photo: false }
	]);

	let password = $state('');
	const passwordError = $derived(password.length > 0 && password.length < 8 ? 'Zu kurz.' : undefined);

	let picked = $state('');
	let refused = $state('');
	const hex = '#FF4F8B';
</script>

<section>
	<h2>Buttons wie stuffcloud</h2>
	<div class="stack narrow">
		<Button wide variant="secondary">Weiter zum Werkzeug <span aria-hidden="true">→</span></Button>
		<Button wide href="#main">Alle Werkzeuge <span aria-hidden="true">→</span></Button>
	</div>
	<div class="row">
		<Button size="sm" variant="secondary">Kompakt</Button>
		<Button size="icon" variant="secondary" aria-label="Hinzufügen">
			<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M10 4v12M4 10h12" /></svg>
		</Button>
		<Button href="#main" disabled variant="ghost">Gesperrter Link</Button>
	</div>
</section>

<section>
	<h2>Karten in einer Liste</h2>
	<ul class="cards" aria-label="Lacke">
		{#each polishes as p (p.id)}
			<Card
				as="li"
				title={p.name}
				description={p.brand}
				look="outline"
				muted={p.empty}
				actionLabel="{p.name} bearbeiten"
				actionHaspopup="dialog"
				onclick={() => toast(`${p.name} öffnen`)}
			>
				{#snippet media()}<div class="swatch" class:photo={p.photo} style:background-color={p.color}></div>{/snippet}
				{#snippet badges()}
					{#if p.empty}<span class="badge">Leer</span>{/if}
					{#if p.count > 1}<span class="badge">{p.count}×</span>{/if}
				{/snippet}
				{#snippet footer()}
					<Button size="sm" variant="secondary" aria-pressed={p.photo} onclick={() => (p.photo = !p.photo)}>Foto</Button>
					<Button
						size="sm"
						variant="danger"
						aria-label="{p.name} löschen"
						onclick={() => (polishes = polishes.filter((x) => x.id !== p.id))}
					>
						Löschen
					</Button>
				{/snippet}
			</Card>
		{/each}
	</ul>
</section>

<section>
	<h2>Werkzeug-Eingaben</h2>
	<div class="grid2">
		<div class="stack">
			<FileDrop
				label="Palette laden"
				mode="dispatch"
				accept=".json,application/json"
				buttonLabel="Datei wählen"
				dropLabel="JSON-Datei hierher ziehen"
				rejectMessages={false}
				onfiles={(files) => {
					refused = '';
					picked = `${files.map((f) => f.name).join(', ')} geladen.`;
				}}
				onreject={(files) => (refused = `${files.map((f) => f.name).join(', ')}: nur JSON-Dateien.`)}
			/>
			<StatusMessage message={picked} tone="ok" />
			<StatusMessage message={refused} kind="alert" />
		</div>
		<div class="stack">
			<Input
				label="Passwort"
				type="password"
				bind:value={password}
				hint="Mindestens 8 Zeichen."
				error={passwordError}
				keepHint
				autocomplete="new-password"
			/>
			<div class="row">
				<code>{hex}</code>
				<CopyButton text={hex} label="HEX kopieren" showLabel copiedLabel="{hex} kopiert" errorLabel="Kopieren fehlgeschlagen" />
			</div>
		</div>
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
	.stack {
		display: grid;
		gap: var(--k-space-4);
		align-content: start;
	}
	.narrow {
		max-width: 420px;
	}
	.grid2 {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: var(--k-space-6);
	}
	.cards {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
		gap: var(--k-space-5);
		margin: 0;
		padding: 0;
	}
	.swatch {
		height: 96px;
	}
	/* Stand-in for a photo: stripes over the colour. */
	.swatch.photo {
		background-image: repeating-linear-gradient(135deg, rgb(255 255 255 / 0.35) 0 8px, transparent 8px 16px);
	}
	.badge {
		padding: 2px var(--k-space-2);
		border: var(--k-border-w) solid var(--k-line-strong);
		border-radius: var(--k-radius-control);
		background: var(--k-bg-raised);
		color: var(--k-fg);
		font-family: var(--k-label-font);
		font-size: var(--k-text-xs);
	}
	code {
		font-family: var(--k-font-mono);
	}
	@media (max-width: 720px) {
		.grid2 {
			grid-template-columns: 1fr;
		}
	}
</style>
