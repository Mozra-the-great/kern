<script lang="ts">
	import { strings } from './strings.svelte.js';
	export interface StepItem {
		id: string;
		label: string;
		description?: string | undefined;
	}
	export type StepState = 'complete' | 'current' | 'upcoming';

	interface Props {
		steps: readonly StepItem[];
		/** Index of the current step (0-based). `steps.length` marks every step complete. */
		current?: number | undefined;
		orientation?: 'horizontal' | 'vertical' | undefined;
		/** Accessible name of the list. */
		label?: string | undefined;
		/** When set, completed steps are buttons that call it with their index. */
		onstep?: ((index: number, step: StepItem) => void) | undefined;
		/** Screen-reader text after a completed step's label. */
		completeLabel?: string | undefined;
		/** Compact text for narrow containers; `{current}`, `{total}` and `{label}` are replaced. */
		compactLabel?: string | undefined;
		/** Compact text once every step is complete; `{total}` is replaced. */
		doneLabel?: string | undefined;
		/** Compact view with `onstep`: button back to the previous step; `{label}` is replaced. */
		backLabel?: string | undefined;
		class?: string | undefined;
	}
	let {
		steps,
		current = 0,
		orientation = 'horizontal',
		label: labelProp,
		onstep,
		completeLabel: completeLabelProp,
		compactLabel: compactLabelProp,
		doneLabel: doneLabelProp,
		backLabel: backLabelProp,
		class: cls = ''
	}: Props = $props();
	const label = $derived(labelProp ?? strings().stepper.label);
	const completeLabel = $derived(completeLabelProp ?? strings().stepper.completeLabel);
	const compactLabel = $derived(compactLabelProp ?? strings().stepper.compactLabel);
	const doneLabel = $derived(doneLabelProp ?? strings().stepper.doneLabel);
	const backLabel = $derived(backLabelProp ?? strings().stepper.backLabel);

	const total = $derived(steps.length);
	const at = $derived(Math.max(0, Math.min(total, Math.floor(Number.isFinite(current) ? current : 0))));
	function stateOf(i: number): StepState {
		return i < at ? 'complete' : i === at ? 'current' : 'upcoming';
	}
	const compact = $derived(
		at >= total
			? doneLabel.replaceAll('{total}', String(total))
			: compactLabel
					.replaceAll('{current}', String(at + 1))
					.replaceAll('{total}', String(total))
					.replaceAll('{label}', steps[at]?.label ?? '')
	);
</script>

<nav class="k-stepper {cls}" data-orientation={orientation} aria-label={label}>
	<ol class="list">
		{#each steps as s, i (s.id)}
			{@const st = stateOf(i)}
			<li class="step" data-state={st} aria-current={st === 'current' ? 'step' : undefined}>
				{#snippet body()}
					<span class="marker" aria-hidden="true">
						{#if st === 'complete'}
							<svg viewBox="0 0 16 16"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" stroke-width="2.2" /></svg>
						{:else}
							{i + 1}
						{/if}
					</span>
					<span class="text">
						<span class="name">
							{s.label}{#if st === 'complete'}<span class="sr">, {completeLabel}</span>{/if}
						</span>
						{#if s.description}<span class="desc">{s.description}</span>{/if}
					</span>
				{/snippet}
				{#if onstep && st === 'complete'}
					<button type="button" class="body link" onclick={() => onstep(i, s)}>{@render body()}</button>
				{:else}
					<span class="body">{@render body()}</span>
				{/if}
			</li>
		{/each}
	</ol>
	<div class="compact">
		<p class="compact-text">{compact}</p>
		<div class="bar" aria-hidden="true">
			{#each steps as s, i (s.id)}<span class="seg" data-state={stateOf(i)}></span>{/each}
		</div>
		{#if onstep && at > 0 && steps[at - 1]}
			{@const prev = steps[at - 1]}
			<button type="button" class="body link back" onclick={() => onstep(at - 1, prev)}>
				<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 4l-4 4 4 4" fill="none" stroke="currentColor" stroke-width="2" /></svg>
				<span class="name">{backLabel.replaceAll('{label}', prev.label)}</span>
			</button>
		{/if}
	</div>
</nav>

<style>
	.k-stepper {
		container-type: inline-size;
		min-width: 0;
	}
	.list {
		display: flex;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.step {
		position: relative;
		flex: 1 1 0;
		min-width: 0;
	}
	.body {
		display: flex;
		gap: var(--k-space-3);
		align-items: flex-start;
		box-sizing: border-box;
		width: 100%;
		margin: 0;
		padding: var(--k-space-1);
		border: 0;
		border-radius: min(var(--k-radius-control), 12px);
		background: transparent;
		color: inherit;
		font: inherit;
		text-align: start;
	}
	.link {
		min-height: max(40px, var(--k-tap-target));
		cursor: pointer;
		transition: background-color var(--k-dur) var(--k-ease);
	}
	.link:hover {
		background: var(--k-bg-sunken);
	}
	.link:hover .name {
		text-decoration: underline;
		text-underline-offset: 3px;
	}
	.link:focus-visible {
		outline: var(--k-focus-w) solid var(--k-focus);
		outline-offset: var(--k-focus-offset);
	}
	.marker {
		flex: none;
		display: grid;
		place-items: center;
		box-sizing: border-box;
		width: 32px;
		height: 32px;
		border: calc(var(--k-border-w) + 0.5px) solid var(--k-border);
		border-radius: var(--k-radius-badge);
		background: var(--k-bg-raised);
		color: var(--k-fg-muted);
		font-family: var(--k-font-mono);
		font-size: var(--k-text-sm);
		font-variant-numeric: tabular-nums;
		position: relative;
		z-index: 1;
	}
	.marker svg {
		width: 16px;
		height: 16px;
	}
	[data-state='complete'] .marker {
		border-color: var(--k-primary);
		background: var(--k-primary);
		color: var(--k-on-primary);
	}
	[data-state='current'] .marker {
		border: 2px solid var(--k-primary);
		color: var(--k-fg);
		font-weight: var(--k-weight-heading);
		box-shadow:
			0 0 0 3px var(--k-bg),
			0 0 0 5px var(--k-accent-mark);
	}
	.text {
		display: grid;
		gap: 2px;
		min-width: 0;
		padding-top: 4px;
	}
	.name {
		font-family: var(--k-label-font);
		font-size: var(--k-label-size);
		font-weight: var(--k-weight-label);
		text-transform: var(--k-label-transform);
		letter-spacing: var(--k-label-tracking);
		color: var(--k-fg-muted);
		overflow-wrap: anywhere;
	}
	[data-state='current'] .name,
	[data-state='complete'] .name {
		color: var(--k-fg);
	}
	[data-state='current'] .name {
		font-weight: var(--k-weight-heading);
	}
	.desc {
		font-size: var(--k-text-sm);
		color: var(--k-fg-muted);
		overflow-wrap: anywhere;
	}

	/* Connectors: a line from each step's marker to the next one. */
	.step:not(:last-child)::after {
		content: '';
		position: absolute;
		background: var(--k-line);
		/* the line runs over the step's link: it must not take the clicks (a taller or shorter link moves it into the middle of the link) */
		pointer-events: none;
	}
	.step[data-state='complete']:not(:last-child)::after {
		background: var(--k-primary);
	}

	[data-orientation='horizontal'] .body {
		flex-direction: column;
		gap: var(--k-space-2);
	}
	[data-orientation='horizontal'] .text {
		padding-top: 0;
		padding-inline-end: var(--k-space-3);
	}
	[data-orientation='horizontal'] .step:not(:last-child)::after {
		top: calc(var(--k-space-1) + 15px);
		left: calc(var(--k-space-1) + 40px);
		right: 8px;
		height: 2px;
	}

	[data-orientation='vertical'] .list {
		flex-direction: column;
	}
	[data-orientation='vertical'] .step {
		flex: none;
		padding-bottom: var(--k-space-4);
	}
	[data-orientation='vertical'] .step:not(:last-child)::after {
		left: calc(var(--k-space-1) + 15px);
		top: calc(var(--k-space-1) + 40px);
		bottom: 4px;
		width: 2px;
	}

	.compact {
		display: none;
	}
	.compact-text {
		margin: 0;
		font-family: var(--k-label-font);
		font-size: var(--k-label-size);
		font-weight: var(--k-weight-label);
		text-transform: var(--k-label-transform);
		letter-spacing: var(--k-label-tracking);
		color: var(--k-fg);
		overflow-wrap: anywhere;
	}
	.bar {
		display: flex;
		gap: 4px;
	}
	.bar .seg {
		flex: 1;
		height: 6px;
		border-radius: var(--k-radius-badge);
		background: var(--k-bg-sunken);
		border: var(--k-border-w) solid var(--k-border);
		box-sizing: border-box;
	}
	.bar .seg[data-state='complete'] {
		background: var(--k-primary);
		border-color: var(--k-primary);
	}
	.bar .seg[data-state='current'] {
		background: var(--k-accent-mark);
		border-color: var(--k-primary);
	}

	/* Narrow container: one line of text plus a progress bar instead of the full row. */
	@container (max-width: 520px) {
		[data-orientation='horizontal'] .list {
			display: none;
		}
		[data-orientation='horizontal'] .compact {
			display: grid;
			gap: var(--k-space-2);
		}
	}
	.compact .back {
		flex-direction: row;
		width: auto;
		justify-self: start;
		align-items: center;
		gap: var(--k-space-2);
		padding: 0 var(--k-space-3) 0 var(--k-space-2);
	}
	.back svg {
		width: 16px;
		height: 16px;
		flex: none;
	}
	.back .name {
		color: var(--k-fg);
	}
	.sr {
		position: absolute;
		width: 1px;
		height: 1px;
		margin: -1px;
		padding: 0;
		overflow: hidden;
		clip: rect(0 0 0 0);
		white-space: nowrap;
		border: 0;
	}
	@media (forced-colors: active) {
		/* Markers, connectors and the compact bar are backgrounds: draw them in system colours. */
		[data-state='complete'] .marker {
			forced-color-adjust: none;
			border-color: Highlight;
			background: Highlight;
			color: HighlightText;
		}
		[data-state='current'] .marker {
			border-width: 4px;
			border-style: double;
			border-color: Highlight;
		}
		.step:not(:last-child)::after {
			forced-color-adjust: none;
			background: CanvasText;
		}
		.step[data-state='complete']:not(:last-child)::after {
			background: Highlight;
		}
		.link .name {
			text-decoration: underline;
			text-underline-offset: 3px;
		}
		.link:hover {
			outline: 1px solid Highlight;
		}
		.bar .seg {
			forced-color-adjust: none;
			border-color: CanvasText;
			background: Canvas;
		}
		.bar .seg[data-state='complete'] {
			border-color: Highlight;
			background: Highlight;
		}
		.bar .seg[data-state='current'] {
			border-color: Highlight;
			background: repeating-linear-gradient(135deg, Highlight 0 2px, Canvas 2px 4px);
		}
	}
</style>
