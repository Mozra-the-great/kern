<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		open?: boolean | undefined;
		/** Items sharing a name behave as a group: one open at a time. */
		name?: string | undefined;
		class?: string | undefined;
		children?: Snippet | undefined;
	}
	let { title, open = $bindable(), name, class: cls = '', children }: Props = $props();
</script>

<details class="k-accordion-item {cls}" {name} bind:open={() => open ?? false, (v) => (open = v)}>
	<summary>
		<span>{title}</span>
		<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" stroke-width="2" /></svg>
	</summary>
	<div class="content">{@render children?.()}</div>
</details>

<style>
	details { border-bottom: var(--k-border-w) solid var(--k-line); }
	summary {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--k-space-4);
		min-height: var(--k-control-h-lg);
		padding: 0 var(--k-space-2);
		font-weight: var(--k-weight-heading);
		cursor: pointer;
		list-style: none;
	}
	summary::-webkit-details-marker { display: none; }
	summary:hover { background: var(--k-bg-sunken); }
	summary:focus-visible { outline: var(--k-focus-w) solid var(--k-focus); outline-offset: calc(var(--k-focus-w) * -1); }
	svg { flex: none; width: 16px; height: 16px; color: var(--k-fg-muted); transition: transform var(--k-dur) var(--k-ease); }
	details[open] svg { transform: rotate(180deg); }
	.content { padding: 0 var(--k-space-2) var(--k-space-5); }
	.content :global(p) { margin: 0 0 var(--k-space-3); }
	.content :global(p:last-child) { margin-bottom: 0; }
</style>
