<script lang="ts">
	interface Props {
		/** Optional label in the middle of the line. */
		label?: string | undefined;
		vertical?: boolean | undefined;
		class?: string | undefined;
	}
	let { label, vertical = false, class: cls = '' }: Props = $props();
</script>

{#if vertical}
	<span class="k-divider-v {cls}" role="separator" aria-orientation="vertical"></span>
{:else if label}
	<div class="k-divider labelled {cls}" role="separator"><span>{label}</span></div>
{:else}
	<hr class="k-divider {cls}" />
{/if}

<style>
	.k-divider { margin: var(--k-space-4) 0; border: 0; border-top: var(--k-border-w) solid var(--k-line); }
	.labelled { display: flex; align-items: center; gap: var(--k-space-3); border: 0; color: var(--k-fg-muted); font-family: var(--k-label-font); font-size: var(--k-text-xs); text-transform: var(--k-label-transform); letter-spacing: var(--k-label-tracking); }
	.labelled::before, .labelled::after { content: ''; flex: 1; border-top: var(--k-border-w) solid var(--k-line); }
	.k-divider-v { display: inline-block; align-self: stretch; width: 0; min-height: 1em; border-left: var(--k-border-w) solid var(--k-line); }
</style>
