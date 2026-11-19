<script lang="ts">
	import Field from './Field.svelte';
	import Label from './Label.svelte';

	export interface SegmentOption {
		value: string;
		label: string;
		disabled?: boolean | undefined;
	}
	interface Props {
		/** Name of the group; omit only when the context names it (then pass `ariaLabel`). */
		label?: string | undefined;
		/** Accessible name without a visible label. */
		ariaLabel?: string | undefined;
		hint?: string | undefined;
		error?: string | undefined;
		options: SegmentOption[];
		/** Value of the chosen option. */
		value?: string | undefined;
		/** Form field name (native radios). */
		name?: string | undefined;
		disabled?: boolean | undefined;
		/** Stretch over the full width, segments share it equally. */
		block?: boolean | undefined;
		/** Called when the user picks an option. */
		onchange?: ((value: string) => void) | undefined;
		class?: string | undefined;
	}
	let {
		label,
		ariaLabel,
		hint,
		error,
		options,
		value = $bindable(),
		name,
		disabled = false,
		block = false,
		onchange,
		class: cls = ''
	}: Props = $props();

	const uid = $props.id();
	const groupName = $derived(name ?? `${uid}-seg`);

	function pick(v: string) {
		if (v === (value ?? '')) return;
		value = v;
		onchange?.(v);
	}
</script>

<Field {hint} {error} class={cls}>
	{#snippet children({ describedby, invalid })}
		{#if label}<Label as="span" id="{uid}-label" text={label} />{/if}
		<div
			class="k-segmented"
			class:block
			class:invalid
			role="radiogroup"
			aria-labelledby={label ? `${uid}-label` : undefined}
			aria-label={label ? undefined : ariaLabel}
			aria-describedby={describedby}
			aria-invalid={invalid || undefined}
			aria-disabled={disabled || undefined}
		>
			{#each options as o, i (o.value)}
				<label class="seg" class:on={o.value === (value ?? '')}>
					<input
						type="radio"
						id="{uid}-{i}"
						name={groupName}
						value={o.value}
						checked={o.value === (value ?? '')}
						disabled={disabled || o.disabled}
						onchange={() => pick(o.value)}
					/>
					<span class="txt">{o.label}</span>
				</label>
			{/each}
		</div>
	{/snippet}
</Field>

<style>
	.k-segmented {
		display: inline-flex;
		flex-wrap: wrap;
		gap: 2px;
		width: fit-content;
		max-width: 100%;
		box-sizing: border-box;
		padding: 3px;
		border: var(--k-border-w) solid var(--k-line);
		border-radius: var(--k-radius-control);
		background: var(--k-bg-sunken);
	}
	.block {
		display: flex;
		width: 100%;
	}
	.invalid {
		border-color: var(--k-danger);
	}
	.seg {
		position: relative;
		flex: 1 0 auto;
		display: grid;
		place-items: center;
		box-sizing: border-box;
		min-width: max(40px, var(--k-tap-target));
		min-height: max(40px, var(--k-tap-target), calc(var(--k-control-h) - 8px));
		padding: 0 var(--k-space-4);
		border: var(--k-border-w) solid transparent;
		border-radius: var(--k-radius-control);
		color: var(--k-fg-muted);
		font-family: var(--k-label-font);
		font-size: var(--k-label-size);
		font-weight: var(--k-weight-label);
		text-transform: var(--k-label-transform);
		letter-spacing: var(--k-label-tracking);
		line-height: 1.2;
		text-align: center;
		cursor: pointer;
		user-select: none;
		transition:
			background-color var(--k-dur) var(--k-ease),
			color var(--k-dur) var(--k-ease),
			box-shadow var(--k-dur) var(--k-ease),
			border-color var(--k-dur) var(--k-ease);
	}
	.block .seg {
		flex: 1 1 auto;
		padding: 0 var(--k-space-2);
	}
	.seg:hover:not(.on):not(:has(input:disabled)) {
		color: var(--k-fg);
	}
	/* Selected: raised surface with an edge (never colour alone) and the theme's raised shadow. */
	.seg.on {
		border-color: var(--k-border);
		background: var(--k-bg-raised);
		color: var(--k-fg);
		box-shadow: var(--k-shadow-raised);
	}
	.seg input {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		margin: 0;
		opacity: 0;
		cursor: inherit;
	}
	.seg:has(input:focus-visible) {
		outline: var(--k-focus-w) solid var(--k-focus);
		outline-offset: var(--k-focus-offset);
		z-index: 1;
	}
	.seg:has(input:disabled) {
		opacity: 0.45;
		cursor: not-allowed;
	}
	.txt {
		padding: var(--k-space-1) 0;
		min-width: 0;
		overflow-wrap: break-word;
		hyphens: auto;
	}
	@media (forced-colors: active) {
		.k-segmented {
			border-color: ButtonText;
		}
		.invalid {
			border-style: double;
			border-width: 3px;
		}
		/* Selected: inverted (Highlight / HighlightText), not only a raised surface. */
		.seg.on {
			forced-color-adjust: none;
			border-color: Highlight;
			background: Highlight;
			color: HighlightText;
		}
		.seg:has(input:disabled) {
			opacity: 1;
			border-color: GrayText;
			color: GrayText;
		}
		.seg.on:has(input:disabled) {
			border-color: GrayText;
			background: GrayText;
			color: Canvas;
		}
	}
</style>
