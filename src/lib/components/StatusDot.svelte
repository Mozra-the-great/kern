<script lang="ts" module>
	export type DotStatus = 'ok' | 'warn' | 'down' | 'idle' | 'busy';
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		/** `ok` = circle with check, `warn` = triangle, `down` = square with cross, `idle` = empty ring, `busy` = ring with dot. */
		status: DotStatus;
		/** What the dot belongs to, e.g. "Database". The status name is spoken after it. Defaults to the status name. */
		label?: string | undefined;
		/** Hide the text visually. It stays available to assistive technology. */
		labelHidden?: boolean | undefined;
		/** Names of the five states, for translation. */
		statusLabels?: Partial<Record<DotStatus, string>> | undefined;
		size?: 'sm' | 'md' | undefined;
		/** Pulse while `busy`. Stops when the user asks for less motion. */
		pulse?: boolean | undefined;
		class?: string | undefined;
		/** Replaces `label` as visible text. */
		children?: Snippet | undefined;
	}
	let { status, label, labelHidden = false, statusLabels, size = 'md', pulse = true, class: cls = '', children }: Props = $props();
	const uid = $props.id();

	const names = $derived<Record<DotStatus, string>>({
		ok: 'OK',
		warn: 'Degraded',
		down: 'Down',
		idle: 'Idle',
		busy: 'Busy',
		...statusLabels
	});
	const name = $derived(names[status] ?? status);
	const custom = $derived(!!children || (label !== undefined && label !== ''));
	/* A custom text may not say what the state is; the shape and the colour say it only to the eye. */
	const spokenState = $derived(custom && label !== name);
</script>

<span class="k-status-dot {cls}" data-status={status} data-size={size}>
	<span class="glyph" aria-hidden="true">
		{#if status === 'busy' && pulse}<span class="halo"></span>{/if}
		<svg viewBox="0 0 16 16">
			{#if status === 'ok'}
				<mask id="{uid}-m" maskUnits="userSpaceOnUse" x="0" y="0" width="16" height="16">
					<rect width="16" height="16" fill="#fff" />
					<path d="M4.6 8.3l2.3 2.3 4.5-4.9" fill="none" stroke="#000" stroke-width="1.8" />
				</mask>
				<circle cx="8" cy="8" r="7" fill="currentColor" mask="url(#{uid}-m)" />
			{:else if status === 'warn'}
				<mask id="{uid}-m" maskUnits="userSpaceOnUse" x="0" y="0" width="16" height="16">
					<rect width="16" height="16" fill="#fff" />
					<path d="M8 6.2v3.6M8 11.9v.5" fill="none" stroke="#000" stroke-width="1.7" />
				</mask>
				<path
					d="M8 1.7L14.6 13.5H1.4z"
					fill="currentColor"
					stroke="currentColor"
					stroke-width="1.4"
					stroke-linejoin="round"
					mask="url(#{uid}-m)"
				/>
			{:else if status === 'down'}
				<mask id="{uid}-m" maskUnits="userSpaceOnUse" x="0" y="0" width="16" height="16">
					<rect width="16" height="16" fill="#fff" />
					<path d="M5.4 5.4l5.2 5.2M10.6 5.4l-5.2 5.2" fill="none" stroke="#000" stroke-width="1.8" />
				</mask>
				<rect x="1.5" y="1.5" width="13" height="13" rx="2" fill="currentColor" mask="url(#{uid}-m)" />
			{:else if status === 'busy'}
				<circle cx="8" cy="8" r="6.1" fill="none" stroke="currentColor" stroke-width="1.8" />
				<circle cx="8" cy="8" r="2.6" fill="currentColor" />
			{:else}
				<circle cx="8" cy="8" r="6.1" fill="none" stroke="currentColor" stroke-width="1.8" />
			{/if}
		</svg>
	</span>
	{#if custom}
		<span class="text" class:sr={labelHidden}>
			{#if children}{@render children()}{:else}{label}{/if}
		</span>{#if spokenState}<span class="sr">, {name}</span>{/if}
	{:else}
		<span class="text" class:sr={labelHidden}>{name}</span>
	{/if}
</span>

<style>
	.k-status-dot {
		--c: var(--k-fg-muted);
		--g: 16px;
		position: relative;
		display: inline-flex;
		align-items: center;
		gap: var(--k-space-2);
		color: var(--k-fg);
		font-family: var(--k-label-font);
		font-size: var(--k-text-sm);
		font-weight: var(--k-weight-label);
		letter-spacing: var(--k-label-tracking);
		text-transform: var(--k-label-transform);
		line-height: 1.4;
	}
	[data-size='sm'] {
		--g: 12px;
		gap: var(--k-space-1);
		font-size: var(--k-text-xs);
	}
	[data-status='ok'] {
		--c: var(--k-ok);
	}
	[data-status='warn'] {
		--c: var(--k-warn);
	}
	[data-status='down'] {
		--c: var(--k-danger);
	}
	[data-status='busy'] {
		--c: var(--k-info);
	}
	.glyph {
		position: relative;
		flex: none;
		display: inline-grid;
		width: var(--g);
		height: var(--g);
		color: var(--c);
	}
	svg {
		width: 100%;
		height: 100%;
		overflow: visible;
	}
	.halo {
		position: absolute;
		inset: 0;
		border-radius: 50%;
		background: var(--c);
		opacity: 0;
		animation: k-status-pulse 1.6s var(--k-ease) infinite;
	}
	@keyframes k-status-pulse {
		from {
			opacity: 0.45;
			transform: scale(0.9);
		}
		to {
			opacity: 0;
			transform: scale(1.9);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.halo {
			animation: none;
			display: none;
		}
	}
	.text {
		min-width: 0;
	}
	.sr {
		position: absolute;
		width: 1px;
		height: 1px;
		margin: -1px;
		padding: 0;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
		border: 0;
	}
</style>
