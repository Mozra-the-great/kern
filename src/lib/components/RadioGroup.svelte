<script lang="ts">
	export interface RadioOption {
		value: string;
		label: string;
		hint?: string | undefined;
		disabled?: boolean | undefined;
	}
	interface Props {
		/** Group label (legend). */
		label: string;
		options: RadioOption[];
		value?: string | undefined;
		name?: string | undefined;
		/** Lay options out in a row. */
		inline?: boolean | undefined;
		error?: string | undefined;
		/** Called when the user picks an option, not when `value` is set from outside. */
		onchange?: ((value: string) => void) | undefined;
		class?: string | undefined;
	}
	let { label, options, value = $bindable(), name, inline = false, error, onchange, class: cls = '' }: Props = $props();
	const uid = $props.id();
	const groupName = $derived(name ?? `${uid}-radio`);
</script>

<fieldset class="k-radio-group {cls}" class:inline aria-describedby={error ? `${uid}-err` : undefined}>
	<legend>{label}</legend>
	<div class="opts">
		{#each options as o (o.value)}
			<div class="opt">
				<input
					type="radio"
					id="{uid}-{o.value}"
					name={groupName}
					value={o.value}
					bind:group={value}
					onchange={() => onchange?.(o.value)}
					disabled={o.disabled}
					aria-describedby={o.hint ? `${uid}-${o.value}-hint` : undefined}
				/>
				<span class="text">
					<label for="{uid}-{o.value}">{o.label}</label>
					{#if o.hint}<span class="hint" id="{uid}-{o.value}-hint">{o.hint}</span>{/if}
				</span>
			</div>
		{/each}
	</div>
	{#if error}<p class="err" id="{uid}-err">{error}</p>{/if}
</fieldset>

<style>
	.k-radio-group {
		margin: 0;
		padding: 0;
		border: 0;
		min-width: 0;
	}
	legend {
		padding: 0;
		margin-bottom: var(--k-space-3);
		font-family: var(--k-label-font);
		font-size: var(--k-label-size);
		font-weight: var(--k-weight-label);
		text-transform: var(--k-label-transform);
		letter-spacing: var(--k-label-tracking);
	}
	.opts {
		display: grid;
		gap: var(--k-space-3);
	}
	.inline .opts {
		display: flex;
		flex-wrap: wrap;
		gap: var(--k-space-3) var(--k-space-6);
	}
	.opt {
		position: relative;
		display: flex;
		gap: var(--k-space-3);
		align-items: flex-start;
		padding-block: calc(max(0px, var(--k-tap-target) - 24px) / 2);
	}
	input {
		appearance: none;
		flex: none;
		display: grid;
		place-items: center;
		width: 22px;
		height: 22px;
		margin: 1px 0 0;
		border: calc(var(--k-border-w) + 0.5px) solid var(--k-border);
		border-radius: 50%;
		background: var(--k-bg-raised);
		cursor: pointer;
	}
	input::after {
		content: '';
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: var(--k-primary);
		transform: scale(0);
		transition: transform var(--k-dur) var(--k-ease);
	}
	input:checked {
		border-color: var(--k-primary);
	}
	input:checked::after {
		transform: scale(1);
	}
	.opt:hover input:not(:disabled) {
		border-color: var(--k-fg);
	}
	input:focus-visible {
		outline: var(--k-focus-w) solid var(--k-focus);
		outline-offset: var(--k-focus-offset);
	}
	input:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.text {
		display: grid;
		gap: 2px;
	}
	label {
		cursor: pointer;
	}
	/* The whole row, padded to the tap target, toggles the control through its label. */
	label::after {
		content: '';
		position: absolute;
		inset: 0;
	}
	.hint {
		font-size: var(--k-text-sm);
		color: var(--k-fg-muted);
	}
	.err {
		margin: var(--k-space-2) 0 0;
		color: var(--k-danger);
		font-size: var(--k-text-sm);
	}
</style>
