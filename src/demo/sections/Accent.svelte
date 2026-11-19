<script lang="ts">
	import Badge from '../../lib/components/Badge.svelte';
	import Button from '../../lib/components/Button.svelte';
	import Checkbox from '../../lib/components/Checkbox.svelte';
	import Input from '../../lib/components/Input.svelte';
	import Progress from '../../lib/components/Progress.svelte';
	import Switch from '../../lib/components/Switch.svelte';
	import { installAccent, removeAccent, type AccentAdjustment, type AccentCssResult } from '../../lib/components/accent.js';

	/** Presets that stress the contrast: light, saturated, dark and neutral colours. */
	const presets: { name: string; hex: string }[] = [
		{ name: 'Gelb', hex: '#ffe600' },
		{ name: 'Hellrosa', hex: '#ffc8e6' },
		{ name: 'Dunkelblau', hex: '#0a1a5c' },
		{ name: 'Grau', hex: '#808080' }
	];

	let value = $state('');
	let active = $state(false);
	let result = $state<AccentCssResult | undefined>(undefined);

	const typed = $derived(value.trim());
	const invalid = $derived(typed !== '' && !/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(typed));
	let theme = $state(currentTheme());
	const moved = $derived<readonly AccentAdjustment[]>(result?.ok ? (result.themes[theme]?.adjustments ?? []) : []);

	function currentTheme(): string {
		return document.documentElement.dataset['theme'] ?? 'code';
	}

	// The report follows the theme picker in the header.
	$effect(() => {
		const watcher = new MutationObserver(() => (theme = currentTheme()));
		watcher.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
		return () => watcher.disconnect();
	});

	// An invalid colour leaves the page as it is; an empty field removes the accent.
	$effect(() => {
		if (typed === '') {
			removeAccent();
			result = undefined;
			active = false;
			return;
		}
		if (invalid) return;
		const next = installAccent(typed);
		result = next;
		active = next.ok;
	});

	function choose(hex: string): void {
		value = hex;
	}
</script>

<section>
	<h2>Eigene Akzentfarbe</h2>
	<p class="m0">
		Eine Farbe auf jedem Standard-Theme: kern leitet daraus Primär-, Akzent- und Fokusfarben samt Text-, Hover- und Soft-Werten ab und
		verschiebt nur die Helligkeit, wo die Farbe ihren Kontrast (Text 4,5:1, Flächen und Marker 3:1) verfehlen würde. Das Theme wird nicht
		umgebaut. Wechsle oben das Theme: die Regeln gelten für alle.
	</p>
	<div class="row">
		<Input label="Akzentfarbe (#rgb oder #rrggbb)" bind:value error={invalid ? 'Keine Farbe im Format #rgb oder #rrggbb.' : undefined} />
		{#each presets as p (p.hex)}
			<Button variant="secondary" size="sm" onclick={() => choose(p.hex)}>{p.name}</Button>
		{/each}
		<Button variant="ghost" size="sm" onclick={() => choose('')}>Zurücksetzen</Button>
	</div>
	<div class="row">
		<Button>Primär</Button>
		<Button variant="accent">Akzent</Button>
		<Badge tone="accent">Neu</Badge>
		<Checkbox label="Checkbox" checked />
		<Switch label="Schalter" checked />
		<div style="min-width: 12rem"><Progress label="Fortschritt" value={64} /></div>
	</div>
	<p class="m0" aria-live="polite">
		{#if !active}
			Kein Akzent gesetzt, das Theme zeigt seine eigenen Farben.
		{:else if result?.ok}
			{#if moved.length === 0}
				Im aktuellen Theme war nichts anzupassen.
			{:else}
				Im aktuellen Theme angepasst: {moved.map((m) => `${m.token} ${m.from} → ${m.to}`).join(', ')}.
			{/if}
		{/if}
	</p>
</section>
