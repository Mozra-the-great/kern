<script lang="ts">
	import Field from './Field.svelte';
	import Label from './Label.svelte';

	interface Props {
		/** Name of the group. */
		label?: string;
		hint?: string;
		error?: string;
		/** Number of stars chosen, 0 = none. In `readonly` mode fractions show partly filled stars. */
		value?: number;
		/** Number of stars. */
		max?: number;
		/** Show the value as an image with text instead of a control. */
		readonly?: boolean;
		disabled?: boolean;
		/** Form field name (native radios). */
		name?: string;
		required?: boolean;
		/** Name of each star and of the readonly image; `{value}` and `{max}` are replaced. */
		starLabel?: string;
		/** Called when the user picks a value. */
		onchange?: (value: number) => void;
		class?: string;
	}
	let {
		label,
		hint,
		error,
		value = $bindable(0),
		max = 5,
		readonly = false,
		disabled = false,
		name,
		required = false,
		starLabel = '{value} of {max} stars',
		onchange,
		class: cls = ''
	}: Props = $props();

	const uid = $props.id();
	const count = $derived(Math.max(1, Math.min(20, Math.floor(Number.isFinite(max) ? max : 5))));
	const current = $derived(Math.max(0, Math.min(count, Number.isFinite(value) ? value : 0)));
	const groupName = $derived(name ?? `${uid}-rating`);
	let hover = $state(0);
	let group: HTMLElement | undefined = $state();
	// Hover preview ends when the pointer leaves the stars.
	$effect(() => {
		const el = group;
		if (!el) return;
		const leave = () => (hover = 0);
		el.addEventListener('pointerleave', leave);
		return () => el.removeEventListener('pointerleave', leave);
	});
	const shown = $derived(hover || current);

	function text(v: number): string {
		const n = Math.round(v * 10) / 10;
		return starLabel.replaceAll('{value}', String(n)).replaceAll('{max}', String(count));
	}
	function pick(v: number) {
		if (disabled || readonly) return;
		if (v !== value) {
			value = v;
			onchange?.(v);
		}
	}
	/** Fill of star `i` (1-based) between 0 and 1. */
	function fillOf(i: number, v: number): number {
		return Math.max(0, Math.min(1, v - (i - 1)));
	}
	const STAR = 'M12 2.6l2.83 6.07 6.65.8-4.9 4.56 1.27 6.58L12 17.3l-5.85 3.31 1.27-6.58-4.9-4.56 6.65-.8z';
</script>

<Field {hint} {error} class={cls}>
	{#snippet children({ describedby, invalid })}
		{#if label}<Label as="span" id="{uid}-label" text={label} required={required && !readonly} />{/if}
		{#if readonly}
			<span class="k-rating readonly" role="img" aria-label={label ? `${label}: ${text(current)}` : text(current)} aria-describedby={describedby}>
				{#each { length: count } as _, k (k)}
					{@const f = fillOf(k + 1, current)}
					<span class="star" aria-hidden="true">
						<svg viewBox="0 0 24 24"><path d={STAR} class="outline" /></svg>
						{#if f > 0}
							<svg viewBox="0 0 24 24" class="full" style:clip-path="inset(0 {100 - f * 100}% 0 0)"><path d={STAR} /></svg>
						{/if}
					</span>
				{/each}
			</span>
		{:else}
			<div
				class="k-rating"
				class:disabled
				role="radiogroup"
				aria-labelledby={label ? `${uid}-label` : undefined}
				aria-describedby={describedby}
				aria-invalid={invalid || undefined}
				aria-required={required || undefined}
				bind:this={group}
			>
				{#each { length: count } as _, k (k)}
					{@const n = k + 1}
					<label class="star" class:on={n <= shown} onpointerenter={() => { if (!disabled) hover = n; }}>
						<input
							type="radio"
							name={groupName}
							value={n}
							checked={n === current}
							{disabled}
							{required}
							onchange={() => pick(n)}
						/>
						<span class="sr">{text(n)}</span>
						<svg viewBox="0 0 24 24" aria-hidden="true"><path d={STAR} /></svg>
					</label>
				{/each}
			</div>
		{/if}
	{/snippet}
</Field>

<style>
	.k-rating { display: flex; flex-wrap: wrap; align-items: center; gap: 0; width: fit-content; max-width: 100%; }
	.star {
		position: relative;
		display: grid;
		place-items: center;
		width: max(40px, var(--k-tap-target));
		height: max(40px, var(--k-tap-target));
		border-radius: var(--k-radius-control);
		color: var(--k-accent-text);
		cursor: pointer;
	}
	.star svg { grid-area: 1 / 1; width: 28px; height: 28px; overflow: visible; }
	.star path { fill: transparent; stroke: var(--k-border); stroke-width: 1.6; stroke-linejoin: round; transition: fill var(--k-dur) var(--k-ease), stroke var(--k-dur) var(--k-ease); }
	.star.on path { fill: currentColor; stroke: currentColor; }
	.k-rating:not(.readonly):not(.disabled) .star:hover:not(.on) path { stroke: var(--k-fg); }
	.star input {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		margin: 0;
		opacity: 0;
		cursor: inherit;
	}
	.star:has(input:focus-visible) { outline: var(--k-focus-w) solid var(--k-focus); outline-offset: calc(var(--k-focus-w) * -1); }
	.disabled .star { cursor: not-allowed; opacity: 0.5; }
	[aria-invalid='true'] .star:not(.on) path { stroke: var(--k-danger); }
	.readonly .star { width: 28px; height: 28px; cursor: default; }
	.readonly .star svg { width: 24px; height: 24px; }
	.readonly .full path { fill: currentColor; stroke: currentColor; }
	.sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
</style>
