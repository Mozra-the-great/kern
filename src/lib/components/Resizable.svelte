<script lang="ts">
	import type { Snippet } from 'svelte';

	export interface ResizablePanel {
		/** Unique within the group. */
		id: string;
		/** Name of the panel, used in the label of its handle. Default: the id. */
		label?: string;
		/** Smallest size in % of the group. Default 10. */
		min?: number;
		/** Largest size in %. Default 100. */
		max?: number;
	}
	interface Props {
		/** The panels in order; a handle sits between each two neighbours. */
		panels: ResizablePanel[];
		/** Sizes in %, one per panel, summing to 100. Default: equal shares. */
		sizes?: number[];
		/** `horizontal` = panels side by side, `vertical` = stacked. */
		direction?: 'horizontal' | 'vertical';
		/** Height of the group: px as a number, or any CSS length. Stacked groups need one (default 20rem). */
		height?: number | string;
		/** Size change of an Arrow key, in % of the group. */
		step?: number;
		/** Size change of Shift + Arrow key. */
		largeStep?: number;
		/** Label of a handle. `{panel}` is replaced with the label of the panel before it. */
		handleLabel?: string;
		/** Called when the user finished a change (drag released, key pressed) with the new sizes. */
		onchange?: (sizes: number[]) => void;
		/** Renders one panel. */
		panel: Snippet<[ResizablePanel, number]>;
		class?: string;
	}
	let {
		panels,
		sizes = $bindable(),
		direction = 'horizontal',
		height,
		step = 2,
		largeStep = 10,
		handleLabel = 'Resize {panel}',
		onchange,
		panel,
		class: cls = ''
	}: Props = $props();
	const uid = $props.id();

	const DEFAULT_MIN = 10;
	const EPSILON = 1e-6;
	const clamp = (n: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, n));
	const round2 = (n: number): number => Math.round(n * 100) / 100;

	const mins = $derived(panels.map((p) => clamp(p.min ?? Math.min(DEFAULT_MIN, 100 / panels.length), 0, 100)));
	const maxs = $derived(panels.map((p, i) => Math.max(mins[i], clamp(p.max ?? 100, 0, 100))));

	/** Brings `input` into shape: one entry per panel, summing to 100, inside every min/max. */
	function fit(input: number[] | undefined, lo: number[], hi: number[]): number[] {
		const n = lo.length;
		if (n === 0) return [];
		let s = input && input.length === n && input.every((v) => Number.isFinite(v) && v >= 0) ? input.slice() : new Array<number>(n).fill(100 / n);
		const total = s.reduce((a, b) => a + b, 0);
		s = total > 0 ? s.map((v) => (v * 100) / total) : new Array<number>(n).fill(100 / n);
		for (let pass = 0; pass <= n; pass++) {
			let excess = 0;
			s = s.map((v, i) => {
				const c = clamp(v, lo[i], hi[i]);
				excess += v - c;
				return c;
			});
			if (Math.abs(excess) < EPSILON) break;
			const takers = s.map((v, i) => i).filter((i) => (excess > 0 ? s[i] < hi[i] - EPSILON : s[i] > lo[i] + EPSILON));
			if (takers.length === 0) break;
			for (const i of takers) s[i] += excess / takers.length;
		}
		return s;
	}
	const current = $derived(fit(sizes, mins, maxs));

	/** Range the size of panel `i` may take while only it and its next neighbour change. */
	function bounds(i: number, s: number[]): [number, number] {
		const total = s[i] + s[i + 1];
		const lo = Math.max(mins[i], total - maxs[i + 1]);
		const hi = Math.min(maxs[i], total - mins[i + 1]);
		return lo > hi ? [s[i], s[i]] : [lo, hi];
	}
	/** Sizes after panel `i` is set to `target` (clamped); its neighbour takes the difference. */
	function resized(i: number, target: number, base: number[]): number[] {
		const [lo, hi] = bounds(i, base);
		const next = round2(clamp(target, lo, hi));
		const out = base.slice();
		out[i] = next;
		out[i + 1] = round2(base[i] + base[i + 1] - next);
		return out;
	}
	function same(a: number[], b: number[]): boolean {
		return a.length === b.length && a.every((v, i) => Math.abs(v - b[i]) < EPSILON);
	}
	function apply(next: number[]): boolean {
		if (same(next, current)) return false;
		sizes = next;
		return true;
	}

	let group: HTMLElement | undefined = $state();
	let active: number | undefined = $state();
	const heightCss = $derived(typeof height === 'number' ? `${height}px` : height);
	const horizontal = $derived(direction === 'horizontal');
	/** Sizes before a handle was collapsed, so Enter can restore them. */
	const memo = new Map<number, number>();

	function isRtl(): boolean {
		return group !== undefined && getComputedStyle(group).direction === 'rtl';
	}

	function onkeydown(e: KeyboardEvent, i: number): void {
		const inc = e.shiftKey ? largeStep : step;
		const [lo, hi] = bounds(i, current);
		let next: number[] | undefined;
		switch (e.key) {
			case 'ArrowLeft':
			case 'ArrowRight': {
				if (!horizontal) return;
				// Right grows the panel before the handle, except in right-to-left layouts.
				const grow = (e.key === 'ArrowRight') !== isRtl();
				next = resized(i, current[i] + (grow ? inc : -inc), current);
				break;
			}
			case 'ArrowUp':
			case 'ArrowDown':
				if (horizontal) return;
				next = resized(i, current[i] + (e.key === 'ArrowDown' ? inc : -inc), current);
				break;
			case 'Home':
				next = resized(i, lo, current);
				break;
			case 'End':
				next = resized(i, hi, current);
				break;
			case 'Enter': {
				if (current[i] > lo + EPSILON) {
					memo.set(i, current[i]);
					next = resized(i, lo, current);
				} else {
					const before = memo.get(i);
					next = resized(i, before !== undefined && before > lo + EPSILON ? before : (lo + hi) / 2, current);
				}
				break;
			}
			default:
				return;
		}
		e.preventDefault();
		if (apply(next)) onchange?.(next);
	}

	interface Drag {
		pointerId: number;
		index: number;
		start: number;
		/** Sizes at pointer-down; every move is computed from them, so nothing drifts. */
		base: number[];
		/** Combined size of all panels in px: what 100 % is. */
		extent: number;
		sign: 1 | -1;
		moved: boolean;
	}
	let drag: Drag | undefined;

	function onpointerdown(e: PointerEvent, i: number): void {
		if (e.pointerType === 'mouse' && e.button !== 0) return;
		const handle = e.currentTarget as HTMLElement;
		const panelEls = group ? Array.from(group.querySelectorAll<HTMLElement>(':scope > .panel')) : [];
		const extent = panelEls.reduce((sum, el) => sum + (horizontal ? el.getBoundingClientRect().width : el.getBoundingClientRect().height), 0);
		if (extent <= 0) return;
		e.preventDefault();
		handle.focus({ preventScroll: true });
		handle.setPointerCapture(e.pointerId);
		drag = { pointerId: e.pointerId, index: i, start: horizontal ? e.clientX : e.clientY, base: current.slice(), extent, sign: horizontal && isRtl() ? -1 : 1, moved: false };
		active = i;
	}
	function onpointermove(e: PointerEvent): void {
		if (!drag || e.pointerId !== drag.pointerId) return;
		const delta = (((horizontal ? e.clientX : e.clientY) - drag.start) * drag.sign * 100) / drag.extent;
		if (apply(resized(drag.index, drag.base[drag.index] + delta, drag.base))) drag.moved = true;
	}
	function onpointerend(e: PointerEvent): void {
		if (!drag || e.pointerId !== drag.pointerId) return;
		const finished = drag;
		drag = undefined;
		active = undefined;
		if (finished.moved) onchange?.(current.slice());
	}

	function nameOf(i: number): string {
		return handleLabel.replace('{panel}', panels[i].label ?? panels[i].id);
	}
</script>

<div class="k-resizable {cls}" style:--rz-height={heightCss}>
	<div class="group" class:dragging={active !== undefined} data-direction={direction} bind:this={group}>
		{#each panels as p, i (p.id)}
			<div class="panel" id="{uid}-p{i}" style:flex-grow={current[i]}>{@render panel(p, i)}</div>
			{#if i < panels.length - 1}
				{@const [lo, hi] = bounds(i, current)}
				<!-- A focusable separator is the WAI-ARIA window splitter (a widget), which svelte does not know. -->
				<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
				<div
					class="handle"
					class:active={active === i}
					role="separator"
					tabindex="0"
					aria-label={nameOf(i)}
					aria-orientation={horizontal ? 'vertical' : 'horizontal'}
					aria-controls="{uid}-p{i}"
					aria-valuenow={Math.round(current[i] * 10) / 10}
					aria-valuemin={Math.round(lo * 10) / 10}
					aria-valuemax={Math.round(hi * 10) / 10}
					aria-valuetext="{Math.round(current[i])}%"
					onkeydown={(e) => onkeydown(e, i)}
					onpointerdown={(e) => onpointerdown(e, i)}
					onpointermove={onpointermove}
					onpointerup={onpointerend}
					onpointercancel={onpointerend}
					onlostpointercapture={onpointerend}
				>
					<span class="grip" aria-hidden="true"></span>
				</div>
			{/if}
		{/each}
	</div>
</div>

<style>
	/* The container query below stacks a horizontal group when its own width is under 520px. */
	.k-resizable { container-type: inline-size; min-width: 0; }
	.group {
		display: flex;
		box-sizing: border-box;
		overflow: hidden;
		border: var(--k-border-w) solid var(--k-line);
		border-radius: var(--k-radius-field);
		background: var(--k-bg-raised);
		color: var(--k-fg);
	}
	.group[data-direction='horizontal'] { flex-direction: row; height: var(--rz-height, auto); }
	.group[data-direction='vertical'] { flex-direction: column; height: var(--rz-height, 20rem); }
	.group.dragging { user-select: none; -webkit-user-select: none; }
	.group.dragging[data-direction='horizontal'] { cursor: col-resize; }
	.group.dragging[data-direction='vertical'] { cursor: row-resize; }
	/* Basis 0 and grow = size: panels share the room left by the handles in proportion to their size. */
	.panel { flex: 1 1 0; min-width: 0; min-height: 0; overflow: auto; }

	.handle {
		position: relative;
		flex: none;
		display: grid;
		place-items: center;
		z-index: 1;
		touch-action: none;
		outline: none;
		background: transparent;
	}
	.group[data-direction='horizontal'] > .handle { width: 12px; cursor: col-resize; }
	.group[data-direction='vertical'] > .handle { height: 12px; cursor: row-resize; }
	/* The divider line. */
	.handle::before { content: ''; position: absolute; inset: 0; margin: auto; background: var(--k-line); transition: background-color var(--k-dur) var(--k-ease); }
	.group[data-direction='horizontal'] > .handle::before { width: var(--k-border-w); height: 100%; }
	.group[data-direction='vertical'] > .handle::before { height: var(--k-border-w); width: 100%; }
	/* An invisible extension makes the handle at least 40px (the tap target where larger) wide to hit. */
	.handle::after { content: ''; position: absolute; }
	.group[data-direction='horizontal'] > .handle::after { inset-block: 0; inset-inline: min(-14px, calc((12px - var(--k-tap-target)) / 2)); }
	.group[data-direction='vertical'] > .handle::after { inset-inline: 0; inset-block: min(-14px, calc((12px - var(--k-tap-target)) / 2)); }
	/* The grip stays visible at all times, so the handle never relies on hover or colour. */
	.grip { position: relative; border-radius: var(--k-radius-badge); background: var(--k-border); transition: background-color var(--k-dur) var(--k-ease); }
	.group[data-direction='horizontal'] .grip { width: 4px; height: 32px; }
	.group[data-direction='vertical'] .grip { width: 32px; height: 4px; }
	.handle:hover .grip, .handle.active .grip { background: var(--k-accent-text); }
	.handle:hover::before, .handle.active::before { background: var(--k-accent-text); }
	/* Focus: the line takes the focus colour and the grip gets the focus ring. */
	.handle:focus-visible::before { background: var(--k-focus); }
	.handle:focus-visible .grip { background: var(--k-focus); outline: var(--k-focus-w) solid var(--k-focus); outline-offset: var(--k-focus-offset); }

	@container (max-width: 519.98px) {
		.group[data-direction='horizontal'] { flex-direction: column; height: auto; }
		.group[data-direction='horizontal'] > .panel { flex: none !important; }
		.group[data-direction='horizontal'] > .handle { display: none; }
	}
	@media (prefers-reduced-motion: reduce) {
		.handle::before, .grip { transition: none; }
	}
</style>
