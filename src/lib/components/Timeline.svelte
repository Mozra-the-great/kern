<script lang="ts" module>
	export type TimelineStatus = 'done' | 'current' | 'upcoming' | 'error';

	export interface TimelineItem {
		id: string;
		title: string;
		/** ISO date or date-time (rendered as `<time>`), or free text. */
		time?: string | undefined;
		description?: string | undefined;
		/** Default `done`. */
		status?: TimelineStatus | undefined;
	}
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import { dateFormat } from './data-utils.js';

	interface Props {
		items: TimelineItem[];
		/** Accessible name of the list. */
		label?: string | undefined;
		/** Spoken status before each title. */
		statusLabels?: Partial<Record<TimelineStatus, string>> | undefined;
		/** Locale of the dates. */
		locale?: string | undefined;
		/** Custom body of an entry, replacing title, time and description. */
		item?: Snippet<[{ item: TimelineItem; index: number }]> | undefined;
		class?: string | undefined;
	}
	let { items, label, statusLabels, locale, item, class: cls = '' }: Props = $props();

	const names = $derived<Record<TimelineStatus, string>>({
		done: 'Done',
		current: 'Current',
		upcoming: 'Upcoming',
		error: 'Failed',
		...statusLabels
	});

	const ISO = /^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/;
	interface Stamp {
		text: string;
		iso: string | null;
	}
	function stamp(t: string | undefined): Stamp | null {
		if (!t) return null;
		if (!ISO.test(t)) return { text: t, iso: null };
		const dateOnly = t.length === 10;
		const d = new Date(dateOnly ? `${t}T00:00:00Z` : t.replace(' ', 'T'));
		if (Number.isNaN(d.getTime())) return { text: t, iso: null };
		const fmt = dateOnly
			? dateFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' })
			: dateFormat(locale, { dateStyle: 'medium', timeStyle: 'short' });
		return { text: fmt.format(d), iso: t.replace(' ', 'T') };
	}
</script>

<ol class="k-timeline {cls}" aria-label={label}>
	{#each items as it, i (it.id)}
		{@const status = it.status ?? 'done'}
		{@const when = stamp(it.time)}
		<li data-status={status} aria-current={status === 'current' ? 'step' : undefined}>
			<span class="marker" aria-hidden="true">
				<svg viewBox="0 0 16 16">
					{#if status === 'done'}<path d="M3.5 8.5l3 3 6-7" />
					{:else if status === 'error'}<path d="M4.5 4.5l7 7M11.5 4.5l-7 7" />
					{:else if status === 'current'}<circle cx="8" cy="8" r="3" class="fill" />
					{/if}
				</svg>
			</span>
			<div class="body">
				<span class="sr">{names[status]}: </span>
				{#if item}
					{@render item({ item: it, index: i })}
				{:else}
					<p class="title">{it.title}</p>
					{#if when}
						{#if when.iso}<time class="time" datetime={when.iso}>{when.text}</time>{:else}<span class="time">{when.text}</span>{/if}
					{/if}
					{#if it.description}<p class="desc">{it.description}</p>{/if}
				{/if}
			</div>
		</li>
	{/each}
</ol>

<style>
	.k-timeline {
		--size: 28px;
		margin: 0;
		padding: 0;
		list-style: none;
		color: var(--k-fg);
	}
	li {
		position: relative;
		display: grid;
		grid-template-columns: var(--size) minmax(0, 1fr);
		gap: var(--k-space-4);
		padding-bottom: var(--k-space-6);
	}
	li:last-child {
		padding-bottom: 0;
	}
	/* Connector to the next entry: solid after finished steps, dashed before open ones. */
	li:not(:last-child)::before {
		content: '';
		position: absolute;
		top: var(--size);
		bottom: 0;
		left: calc(var(--size) / 2 - 1px);
		width: 0;
		border-left: 2px solid var(--k-line);
	}
	li[data-status='done']:not(:last-child)::before {
		border-left-color: var(--k-ok);
	}
	li[data-status='current']:not(:last-child)::before,
	li[data-status='upcoming']:not(:last-child)::before {
		border-left-style: dashed;
		border-left-color: var(--k-border);
	}
	li[data-status='error']:not(:last-child)::before {
		border-left-color: var(--k-danger);
	}
	.marker {
		position: relative;
		display: grid;
		place-items: center;
		width: var(--size);
		height: var(--size);
		border: calc(var(--k-border-w) + 0.5px) solid var(--c, var(--k-border));
		border-radius: var(--k-radius-badge);
		background: var(--k-bg-raised);
		color: var(--c, var(--k-border));
	}
	.marker svg {
		width: 16px;
		height: 16px;
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
		stroke-linecap: square;
	}
	.marker .fill {
		fill: currentColor;
		stroke: none;
	}
	[data-status='done'] {
		--c: var(--k-ok);
	}
	[data-status='current'] {
		--c: var(--k-accent-text);
	}
	[data-status='error'] {
		--c: var(--k-danger);
	}
	[data-status='upcoming'] {
		--c: var(--k-fg-muted);
	}
	[data-status='upcoming'] .marker {
		border-style: dashed;
	}
	[data-status='current'] .marker {
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--k-accent) 28%, transparent);
	}
	.body {
		display: grid;
		gap: var(--k-space-1);
		align-content: start;
		min-width: 0;
		padding-top: 2px;
	}
	.title {
		margin: 0;
		font-weight: var(--k-weight-heading);
		line-height: 1.4;
		overflow-wrap: anywhere;
	}
	[data-status='upcoming'] .title {
		color: var(--k-fg-muted);
	}
	.time {
		color: var(--k-fg-muted);
		font-family: var(--k-font-mono);
		font-size: var(--k-text-xs);
		font-variant-numeric: tabular-nums;
	}
	.desc {
		margin: 0;
		color: var(--k-fg-muted);
		font-size: var(--k-text-sm);
		line-height: 1.5;
		text-wrap: pretty;
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
