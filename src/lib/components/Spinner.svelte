<script lang="ts">
	import { strings } from './strings.svelte.js';
	interface Props {
		/** Accessible label, read by screen readers. */
		label?: string | undefined;
		size?: number | undefined;
		class?: string | undefined;
	}
	let { label: labelProp, size = 20, class: cls = '' }: Props = $props();
	const label = $derived(labelProp ?? strings().spinner.label);
</script>

<span class="k-spinner {cls}" role="status" style:--size="{size}px">
	<span class="ring" aria-hidden="true"></span>
	<span class="sr">{label}</span>
</span>

<style>
	.k-spinner {
		display: inline-flex;
		color: var(--k-accent-text);
	}
	.ring {
		width: var(--size);
		height: var(--size);
		border: 2px solid var(--k-line);
		border-top-color: currentColor;
		border-radius: 50%;
		animation: k-spin 0.7s linear infinite;
	}
	.sr {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip: rect(0 0 0 0);
		white-space: nowrap;
	}
	@keyframes k-spin {
		to {
			transform: rotate(360deg);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.ring {
			animation-duration: 2s;
		}
	}
</style>
