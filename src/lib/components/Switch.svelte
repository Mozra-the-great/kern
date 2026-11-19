<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	interface Props extends Omit<HTMLInputAttributes, 'type'> {
		checked?: boolean | undefined;
		label: string;
		hint?: string | undefined;
		/** Put the label before the switch. */
		labelFirst?: boolean | undefined;
	}
	let { checked = $bindable(), label, hint, labelFirst = false, id, class: cls = '', ...rest }: Props = $props();
	const uid = $props.id();
	const swId = $derived(id ?? `${uid}-sw`);
</script>

<div class="k-switch {cls}" class:labelFirst>
	<input type="checkbox" role="switch" id={swId} bind:checked={() => checked ?? false, (v: boolean) => (checked = v)} aria-checked={checked ?? false} aria-describedby={hint ? `${swId}-hint` : undefined} {...rest} />
	<span class="text">
		<label for={swId}>{label}</label>
		{#if hint}<span class="hint" id="{swId}-hint">{hint}</span>{/if}
	</span>
</div>

<style>
	.k-switch { position: relative; display: flex; gap: var(--k-space-3); align-items: flex-start; padding-block: calc(max(0px, var(--k-tap-target) - 26px) / 2); }
	.labelFirst { flex-direction: row-reverse; justify-content: space-between; }
	input {
		appearance: none;
		position: relative;
		flex: none;
		width: 44px;
		height: 26px;
		margin: 0;
		border: calc(var(--k-border-w) + 0.5px) solid var(--k-border);
		border-radius: max(var(--k-radius-control), 0px);
		background: var(--k-bg-sunken);
		cursor: pointer;
		transition: background-color var(--k-dur) var(--k-ease), border-color var(--k-dur) var(--k-ease);
	}
	input::after {
		content: '';
		position: absolute;
		top: 3px;
		left: 3px;
		width: 18px;
		height: 18px;
		border-radius: inherit;
		background: var(--k-fg-muted);
		transition: transform var(--k-dur) var(--k-ease), background-color var(--k-dur) var(--k-ease);
	}
	input:checked { background: var(--k-primary); border-color: var(--k-primary); }
	input:checked::after { transform: translateX(18px); background: var(--k-on-primary); }
	input:focus-visible { outline: var(--k-focus-w) solid var(--k-focus); outline-offset: var(--k-focus-offset); }
	input:disabled { opacity: 0.5; cursor: not-allowed; }
	.text { display: grid; gap: 2px; padding-top: 1px; }
	label { cursor: pointer; }
	/* The whole row, padded to the tap target, toggles the control through its label. */
	label::after { content: ''; position: absolute; inset: 0; }
	.hint { font-size: var(--k-text-sm); color: var(--k-fg-muted); }
</style>
