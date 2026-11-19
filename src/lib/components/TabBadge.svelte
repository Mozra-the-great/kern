<script lang="ts" module>
	/** Badge fields shared by `TabItem` (Tabs) and `TabLinkItem` (TabLinks). */
	export interface TabBadgeFields {
		/** Short visible text after the label, e.g. a count. */
		badge?: string | number | undefined;
		/** A small dot after the label, e.g. for a sync error. Ignored when `badge` is set. */
		dot?: boolean | undefined;
		/**
		 * Spoken after the label instead of the badge text, e.g. "3 unread" or "Sync error". With a
		 * `badge` it should start with the badge text (voice control). A dot without it is decorative.
		 */
		badgeLabel?: string | undefined;
		/** Colour of the badge or dot. Default `accent`. */
		badgeTone?: 'accent' | 'danger' | undefined;
	}

	/**
	 * Accessible name of a tab or tab link with a badge, "Inbox 3 unread": the label first and the
	 * visible text in order, so voice control finds it (WCAG 2.5.3). Undefined when there is nothing
	 * to add and the content is the name. An aria-label rather than hidden text, which would get
	 * stray spaces from the flex layout.
	 */
	export function tabName(label: string, item: TabBadgeFields): string | undefined {
		let extra = '';
		if (item.badgeLabel !== undefined && item.badgeLabel !== '') extra = item.badgeLabel;
		else if (item.badge !== undefined && item.badge !== '') extra = String(item.badge);
		return extra ? `${label} ${extra}` : undefined;
	}
</script>

<script lang="ts">
	// Internal, not exported: the badge or dot of a tab or tab link, hidden from assistive technology.
	// Its meaning is spoken through the tab's name (`tabName()`).
	let { item }: { item: Pick<TabBadgeFields, 'badge' | 'dot' | 'badgeTone'> } = $props();
	const tone = $derived(item.badgeTone === 'danger' ? 'danger' : 'accent');
	const hasBadge = $derived(item.badge !== undefined && item.badge !== '');
</script>

{#if hasBadge}
	<span class="k-tab-badge" data-tone={tone} aria-hidden="true">{item.badge}</span>
{:else if item.dot}
	<span class="k-tab-dot" data-tone={tone} aria-hidden="true"></span>
{/if}

<style>
	.k-tab-badge {
		display: inline-grid;
		place-items: center;
		box-sizing: border-box;
		min-width: 1.6em;
		height: 1.6em;
		padding: 0 0.45em;
		border-radius: 999px;
		background: var(--k-accent);
		color: var(--k-on-accent);
		font-family: var(--k-font-sans);
		font-size: 0.8em;
		font-weight: 700;
		line-height: 1;
		letter-spacing: 0;
		text-transform: none;
		font-variant-numeric: tabular-nums;
	}
	.k-tab-badge[data-tone='danger'] {
		background: var(--k-danger);
		color: var(--k-on-danger);
	}
	.k-tab-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--k-accent);
		flex: none;
	}
	.k-tab-dot[data-tone='danger'] {
		background: var(--k-danger);
	}
	@media (forced-colors: active) {
		.k-tab-badge {
			border: 1px solid CanvasText;
		}
		.k-tab-dot {
			forced-color-adjust: none;
			background: CanvasText;
		}
	}
</style>
