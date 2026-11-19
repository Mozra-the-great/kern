<svelte:options
	customElement={{
		props: {
			direction: { type: 'String' },
			sizes: { type: 'Array' },
			panels: { type: 'Array' },
			height: { type: 'String' },
			step: { type: 'Number' },
			largeStep: { type: 'Number', attribute: 'large-step' },
			handleLabel: { type: 'String', attribute: 'handle-label' }
		}
	}}
/>

<script lang="ts">
	/**
	 * @prop sizes {number[]}
	 * @prop panels {ResizablePanel[]}
	 * @event change {number[]} Panel sizes in % after the user moved a handle.
	 * @slot - The panels: children with data-panel="<id>" (up to 8).
	 */
	import Resizable from '../lib/components/Resizable.svelte';
	import { emit } from './form.js';
	/* Panels are the light-DOM children with data-panel="<id>" (up to 8, in order); optional
	 * data-label, data-min and data-max (in %). Or pass the panels as a JSON attribute and
	 * keep one child per panel. sizes: JSON list of percentages. height: CSS length or bare px. */
	let { direction, sizes = $bindable(), panels, height, step, largeStep, handleLabel } = $props();
	const host = $host();
	const MAX_PANELS = 8;
	let found: { id: string; label?: string; min?: number; max?: number }[] = $state([]);
	const px = (v: string | null | undefined) => (v !== undefined && v !== null && /^\d+(\.\d+)?$/.test(v) ? Number(v) : (v ?? undefined));
	const num = (v: string | undefined) => (v === undefined || v === '' || Number.isNaN(Number(v)) ? undefined : Number(v));

	function scan() {
		const marked = Array.from(host.querySelectorAll<HTMLElement>(':scope > [data-panel]'));
		const els = (marked.length > 0 ? marked : (Array.from(host.children) as HTMLElement[])).slice(0, MAX_PANELS);
		const seen = new Set<string>();
		const next = els.map((el, i) => {
			el.slot = `p${i}`;
			let id = el.dataset.panel || `panel-${i}`;
			if (seen.has(id)) id = `${id}-${i}`;
			seen.add(id);
			return { id, label: el.dataset.label, min: num(el.dataset.min), max: num(el.dataset.max) };
		});
		if (JSON.stringify(next) !== JSON.stringify(found)) found = next;
	}
	$effect(() => {
		scan();
		const observer = new MutationObserver(scan);
		observer.observe(host, { childList: true });
		return () => observer.disconnect();
	});
	const list = $derived(panels ?? found);
</script>

<!-- A <slot> needs a static name, so the panels use p0..p7. The snippet reads `list` so Svelte keeps it in the component (a hoisted snippet cannot hold a slot). -->
{#snippet panelS(_p: unknown, i: number)}
	{#if i >= list.length}{:else if i === 0}<slot name="p0" />{:else if i === 1}<slot name="p1" />{:else if i === 2}<slot
			name="p2"
		/>{:else if i === 3}<slot name="p3" />{:else if i === 4}<slot name="p4" />{:else if i === 5}<slot name="p5" />{:else if i === 6}<slot
			name="p6"
		/>{:else if i === 7}<slot name="p7" />{/if}
{/snippet}
<Resizable
	panels={list}
	bind:sizes
	{direction}
	height={px(height)}
	{step}
	{largeStep}
	{handleLabel}
	panel={panelS}
	onchange={(s: number[]) => emit(host, 'change', s)}
/>

<style>
	:host {
		display: block;
		min-width: 0;
	}
</style>
