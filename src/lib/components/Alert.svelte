<script lang="ts">
	import { strings } from './strings.svelte.js';
	import type { Snippet } from 'svelte';

	interface Props {
		tone?: 'info' | 'ok' | 'warn' | 'danger' | undefined;
		title?: string | undefined;
		/** Shows a close button that calls it. */
		ondismiss?: (() => void) | undefined;
		dismissLabel?: string | undefined;
		/** Buttons or links under the text. */
		actions?: Snippet | undefined;
		class?: string | undefined;
		children?: Snippet | undefined;
	}
	let { tone = 'info', title, ondismiss, dismissLabel: dismissLabelProp, actions, class: cls = '', children }: Props = $props();
	const dismissLabel = $derived(dismissLabelProp ?? strings().alert.dismissLabel);
	const icons: Record<string, string> = {
		info: 'M8 7v4.5M8 4.6v.8',
		ok: 'M4.5 8.2l2.3 2.3 4.7-5',
		warn: 'M8 4.5v4M8 10.8v.8',
		danger: 'M5.5 5.5l5 5M10.5 5.5l-5 5'
	};
</script>

<div class="k-alert {cls}" data-tone={tone} role={tone === 'danger' || tone === 'warn' ? 'alert' : 'status'}>
	<svg class="icon" viewBox="0 0 16 16" aria-hidden="true">
		<circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" stroke-width="1.6" />
		<path d={icons[tone]} fill="none" stroke="currentColor" stroke-width="1.8" />
	</svg>
	<div class="content">
		{#if title}<p class="title">{title}</p>{/if}
		{#if children}<div class="text">{@render children()}</div>{/if}
		{#if actions}<div class="actions">{@render actions()}</div>{/if}
	</div>
	{#if ondismiss}
		<button type="button" class="x" aria-label={dismissLabel} onclick={ondismiss}>
			<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="2" /></svg>
		</button>
	{/if}
</div>

<style>
	.k-alert {
		--c: var(--k-info);
		--soft: var(--k-surface-info);
		display: flex;
		gap: var(--k-space-3);
		align-items: flex-start;
		padding: var(--k-space-4);
		border: var(--k-border-w) solid var(--c);
		border-radius: var(--k-radius-field);
		background: var(--soft);
		color: var(--k-fg);
	}
	[data-tone='ok'] {
		--c: var(--k-ok);
		--soft: var(--k-surface-ok);
	}
	[data-tone='warn'] {
		--c: var(--k-warn);
		--soft: var(--k-surface-warn);
	}
	[data-tone='danger'] {
		--c: var(--k-danger);
		--soft: var(--k-surface-danger);
	}
	.icon {
		flex: none;
		width: 20px;
		height: 20px;
		color: var(--c);
		margin-top: 1px;
	}
	.content {
		flex: 1;
		display: grid;
		gap: var(--k-space-1);
		min-width: 0;
	}
	.title {
		margin: 0;
		font-weight: var(--k-weight-heading);
		color: var(--c);
	}
	.text {
		font-size: var(--k-text-sm);
	}
	.text :global(p) {
		margin: 0;
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--k-space-2);
		margin-top: var(--k-space-2);
	}
	.x {
		position: relative;
		flex: none;
		display: grid;
		place-items: center;
		width: 32px;
		height: 32px;
		margin: -6px -6px 0 0;
		padding: 0;
		border: 0;
		border-radius: var(--k-radius-control);
		background: transparent;
		color: var(--k-fg-muted);
		cursor: pointer;
	}
	.x::after {
		content: '';
		position: absolute;
		inset: min(0px, calc((100% - var(--k-tap-target)) / 2));
	}
	.x:hover {
		color: var(--k-fg);
		background: var(--k-bg-sunken);
	}
	.x:focus-visible {
		outline: var(--k-focus-w) solid var(--k-focus);
		outline-offset: 0;
	}
	.x svg {
		width: 14px;
		height: 14px;
	}
</style>
