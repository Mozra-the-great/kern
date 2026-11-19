<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLInputAttributes } from 'svelte/elements';

	interface Props extends Omit<HTMLInputAttributes, 'type'> {
		checked?: boolean | undefined;
		indeterminate?: boolean | undefined;
		/** Label text; or pass children for richer content. */
		label?: string | undefined;
		hint?: string | undefined;
		children?: Snippet; // same type as the inherited HTML attribute
	}
	let { checked = $bindable(), indeterminate = $bindable(), label, hint, id, class: cls = '', children, ...rest }: Props = $props();
	const uid = $props.id();
	const boxId = $derived(id ?? `${uid}-cb`);
</script>

<div class="k-check {cls}">
	<span class="box">
		<input
			type="checkbox"
			id={boxId}
			bind:checked={() => checked ?? false, (v: boolean) => (checked = v)}
			bind:indeterminate={() => indeterminate ?? false, (v: boolean) => (indeterminate = v)}
			aria-describedby={hint ? `${boxId}-hint` : undefined}
			{...rest}
		/>
		<svg viewBox="0 0 16 16" aria-hidden="true">
			{#if indeterminate}<path d="M4 8h8" stroke="currentColor" stroke-width="2.2" />{:else}<path
					d="M3.5 8.5l3 3 6-7"
					fill="none"
					stroke="currentColor"
					stroke-width="2.2"
				/>{/if}
		</svg>
	</span>
	<span class="text">
		<label for={boxId}>
			{#if label}{label}{:else}{@render children?.()}{/if}
		</label>
		{#if hint}<span class="hint" id="{boxId}-hint">{hint}</span>{/if}
	</span>
</div>

<style>
	.k-check {
		position: relative;
		display: flex;
		gap: var(--k-check-gap);
		align-items: flex-start;
		padding-block: calc(max(0px, var(--k-tap-target) - 24px) / 2);
	}
	.box {
		position: relative;
		display: grid;
		flex: none;
		width: 22px;
		height: 22px;
		margin-top: 1px;
	}
	input {
		appearance: none;
		grid-area: 1 / 1;
		width: 22px;
		height: 22px;
		margin: 0;
		border: calc(var(--k-border-w) + 0.5px) solid var(--k-border);
		border-radius: min(var(--k-radius-field), 6px);
		background: var(--k-bg-raised);
		cursor: pointer;
		transition:
			background-color var(--k-dur) var(--k-ease),
			border-color var(--k-dur) var(--k-ease);
	}
	.k-check:hover input:not(:disabled) {
		border-color: var(--k-fg);
	}
	input:checked,
	input:indeterminate {
		background: var(--k-check-checked);
		border-color: var(--k-check-checked);
	}
	input:focus-visible {
		outline: var(--k-focus-w) solid var(--k-focus);
		outline-offset: var(--k-focus-offset);
	}
	input:disabled {
		opacity: var(--k-check-disabled-opacity);
		cursor: not-allowed;
	}
	svg {
		grid-area: 1 / 1;
		width: 16px;
		height: 16px;
		place-self: center;
		color: var(--k-check-mark);
		opacity: 0;
		pointer-events: none;
	}
	input:checked + svg,
	input:indeterminate + svg {
		opacity: 1;
	}
	.text {
		display: grid;
		gap: 2px;
	}
	label {
		cursor: pointer;
		font-size: var(--k-check-label-size);
		line-height: 1.5;
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
</style>
