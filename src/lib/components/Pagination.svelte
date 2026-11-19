<script lang="ts" module>
	export type PaginationSlot = { type: 'page'; page: number } | { type: 'gap'; key: string };
</script>

<script lang="ts">
	interface Props {
		/** Current page, 1-based. */
		page?: number;
		pageCount: number;
		/** Pages shown on each side of the current one. */
		siblings?: number;
		/** Accessible name of the navigation landmark. */
		label?: string;
		prevLabel?: string;
		nextLabel?: string;
		/** Prefix of the page buttons' accessible names: "Page 3". */
		pageLabel?: string;
		/** The word between current page and total in the compact view: "Page 3 of 12". */
		ofLabel?: string;
		onchange?: (page: number) => void;
		class?: string;
	}
	let {
		page = $bindable(1),
		pageCount,
		siblings = 1,
		label = 'Pagination',
		prevLabel = 'Previous',
		nextLabel = 'Next',
		pageLabel = 'Page',
		ofLabel = 'of',
		onchange,
		class: cls = ''
	}: Props = $props();

	const total = $derived(Math.max(1, Math.floor(pageCount) || 1));
	const current = $derived(Math.min(total, Math.max(1, Math.floor(page) || 1)));
	const range = (from: number, to: number): PaginationSlot[] =>
		Array.from({ length: Math.max(0, to - from + 1) }, (_, i) => ({ type: 'page', page: from + i }));

	const slots = $derived.by((): PaginationSlot[] => {
		const sib = Math.max(0, Math.floor(siblings) || 0);
		// first + last + current + 2 siblings sides + 2 gaps keep the width constant.
		if (total <= sib * 2 + 5) return range(1, total);
		const left = Math.max(current - sib, 1);
		const right = Math.min(current + sib, total);
		const gapLeft = left > 2;
		const gapRight = right < total - 1;
		const edge = 3 + 2 * sib;
		if (!gapLeft && gapRight) return [...range(1, edge), { type: 'gap', key: 'gr' }, ...range(total, total)];
		if (gapLeft && !gapRight) return [...range(1, 1), { type: 'gap', key: 'gl' }, ...range(total - edge + 1, total)];
		return [...range(1, 1), { type: 'gap', key: 'gl' }, ...range(left, right), { type: 'gap', key: 'gr' }, ...range(total, total)];
	});

	function go(p: number) {
		const next = Math.min(total, Math.max(1, p));
		if (next === current) return;
		page = next;
		onchange?.(next);
	}
</script>

<nav class="k-pagination {cls}" aria-label={label}>
	<ul>
		<li class="edge">
			<button type="button" class="btn step" aria-disabled={current <= 1} onclick={() => go(current - 1)}>
				<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3L5 8l5 5" fill="none" stroke="currentColor" stroke-width="1.8" /></svg>
				<span>{prevLabel}</span>
			</button>
		</li>
		{#each slots as s (s.type === 'page' ? `p${s.page}` : s.key)}
			{#if s.type === 'page'}
				<li class="num">
					<button
						type="button"
						class="btn page"
						aria-label="{pageLabel} {s.page}"
						aria-current={s.page === current ? 'page' : undefined}
						onclick={() => go(s.page)}
					>{s.page}</button>
				</li>
			{:else}
				<li class="num gap" aria-hidden="true">…</li>
			{/if}
		{/each}
		<li class="compact">
			<span aria-hidden="true">{current} / {total}</span>
			<span class="sr">{pageLabel} {current} {ofLabel} {total}</span>
		</li>
		<li class="edge">
			<button type="button" class="btn step" aria-disabled={current >= total} onclick={() => go(current + 1)}>
				<span>{nextLabel}</span>
				<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.8" /></svg>
			</button>
		</li>
	</ul>
</nav>

<style>
	.k-pagination { container-type: inline-size; min-width: 0; }
	ul { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: var(--k-space-1); margin: 0; padding: 0; list-style: none; }
	li { display: inline-flex; }
	.btn {
		display: inline-flex;
		box-sizing: border-box;
		align-items: center;
		justify-content: center;
		gap: var(--k-space-2);
		min-width: max(40px, var(--k-tap-target));
		min-height: max(40px, var(--k-tap-target));
		padding: 0 var(--k-space-3);
		border: var(--k-border-w) solid transparent;
		border-radius: var(--k-radius-control);
		background: transparent;
		color: var(--k-fg);
		font-family: var(--k-label-font);
		font-size: var(--k-label-size);
		font-weight: var(--k-weight-label);
		text-transform: var(--k-label-transform);
		letter-spacing: var(--k-label-tracking);
		line-height: 1.2;
		cursor: pointer;
		transition: background-color var(--k-dur) var(--k-ease), color var(--k-dur) var(--k-ease), border-color var(--k-dur) var(--k-ease);
	}
	.btn svg { flex: none; width: 14px; height: 14px; }
	.btn:hover:not([aria-disabled='true']) { background: var(--k-bg-sunken); border-color: var(--k-border); }
	.btn:focus-visible { outline: var(--k-focus-w) solid var(--k-focus); outline-offset: var(--k-focus-offset); }
	.step { border-color: var(--k-border); }
	.step[aria-disabled='true'] { opacity: 0.5; cursor: not-allowed; }
	.page[aria-current='page'] { background: var(--k-primary); border-color: var(--k-primary); color: var(--k-on-primary); font-weight: var(--k-weight-display); text-decoration: underline; text-underline-offset: 4px; }
	.page[aria-current='page']:hover { background: var(--k-primary-hover); border-color: var(--k-primary-hover); color: var(--k-on-primary-hover); }
	.gap { min-width: 24px; justify-content: center; align-items: center; color: var(--k-fg-muted); }
	.compact { display: none; min-width: 64px; justify-content: center; padding: 0 var(--k-space-2); font-family: var(--k-font-mono); font-size: var(--k-text-sm); }
	.sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0; }
	@container (max-width: 520px) {
		ul { flex-wrap: nowrap; justify-content: space-between; }
		.num { display: none; }
		.compact { display: inline-flex; flex: 1; }
	}
</style>
