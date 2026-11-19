<script lang="ts" generics="T">
	import { untrack, type Snippet } from 'svelte';

	interface Props {
		/** Data of the slides; each one is rendered with the `slide` snippet. */
		items?: T[] | undefined;
		slide?: Snippet<[T, number]> | undefined;
		/** Alternative to `items`/`slide`: slides as direct child elements, one element per slide. */
		children?: Snippet | undefined;
		/** Index of the visible slide. */
		index?: number | undefined;
		/** Accessible name of the carousel (`aria-roledescription="carousel"`). */
		label?: string | undefined;
		prevLabel?: string | undefined;
		nextLabel?: string | undefined;
		/** Accessible name of the row of slide buttons. */
		dotsLabel?: string | undefined;
		/** Prefix of the slide buttons' accessible names: "Go to slide 2". */
		slideLabel?: string | undefined;
		/** The word in each slide's name: "2 of 5". */
		ofLabel?: string | undefined;
		/** Called when the user moves to another slide (buttons, dots, keys, swipe), not when `index` is set from outside. */
		onchange?: ((index: number) => void) | undefined;
		class?: string | undefined;
	}
	let {
		items,
		slide,
		children,
		index = $bindable(),
		label = 'Carousel',
		prevLabel = 'Previous slide',
		nextLabel = 'Next slide',
		dotsLabel = 'Slides',
		slideLabel = 'Go to slide',
		ofLabel = 'of',
		onchange,
		class: cls = ''
	}: Props = $props();
	const uid = $props.id();

	let track: HTMLElement | undefined = $state();
	let tablist: HTMLElement | undefined = $state();
	let slotted = $state(0);
	// No fallback in $bindable(): `bind:index={undefined}` must behave like an omitted prop.
	const current = $derived(index ?? 0);
	const total = $derived(items ? items.length : slotted);
	const dots = $derived(Array.from({ length: total }, (_, i) => i));

	let settling = false;
	let settleTimer: ReturnType<typeof setTimeout> | undefined;
	let frame = 0;
	let lastWidth = 0;
	/** Text of the live region: the active slide, set once the slide has settled. */
	let announcement = $state('');

	const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

	/** The slide elements, whether rendered here, slotted (custom element) or passed as children. */
	function slideEls(): HTMLElement[] {
		if (!track) return [];
		const slot = track.querySelector('slot');
		return (slot ? slot.assignedElements({ flatten: true }) : Array.from(track.children)) as HTMLElement[];
	}
	function sign(): number {
		return track && getComputedStyle(track).direction === 'rtl' ? -1 : 1;
	}
	function scrolledIndex(): number {
		if (!track || !track.clientWidth || total === 0) return current;
		return clamp(Math.round(Math.abs(track.scrollLeft) / track.clientWidth), 0, total - 1);
	}
	function reducedMotion(): boolean {
		if (!track) return true;
		const dur = parseFloat(getComputedStyle(track).getPropertyValue('--k-dur'));
		return dur === 0 || matchMedia('(prefers-reduced-motion: reduce)').matches;
	}
	/** Ignore scroll events caused by our own scrolling until they stop. */
	function settle(ms: number) {
		settling = true;
		clearTimeout(settleTimer);
		settleTimer = setTimeout(() => (settling = false), ms);
	}
	function setIndex(i: number) {
		if (i === current) return;
		index = i;
		onchange?.(i);
	}
	function goTo(i: number) {
		if (!track || total === 0) return;
		const target = clamp(i, 0, total - 1);
		settle(160);
		setIndex(target);
		track.scrollTo({ left: sign() * target * track.clientWidth, behavior: reducedMotion() ? 'auto' : 'smooth' });
	}
	/** Puts the visible slide back in place after the width changed. */
	function realign() {
		if (!track) return;
		lastWidth = track.clientWidth;
		settle(120);
		track.scrollLeft = sign() * current * lastWidth;
	}
	function onscroll() {
		if (!track) return;
		// A scroll caused by a width change says nothing about the slide the user wants.
		if (track.clientWidth !== lastWidth) return realign();
		if (settling) {
			settle(120);
			return;
		}
		if (frame) return;
		frame = requestAnimationFrame(() => {
			frame = 0;
			if (track && track.clientWidth === lastWidth) setIndex(scrolledIndex());
		});
	}
	function onTabKey(e: KeyboardEvent) {
		const flip = sign();
		let n = -1;
		if (e.key === 'ArrowRight') n = flip === 1 ? current + 1 : current - 1;
		else if (e.key === 'ArrowLeft') n = flip === 1 ? current - 1 : current + 1;
		else if (e.key === 'Home') n = 0;
		else if (e.key === 'End') n = total - 1;
		else return;
		e.preventDefault();
		n = (n + total) % total;
		goTo(n);
		tablist?.querySelectorAll<HTMLElement>('[role="tab"]')[n]?.focus();
	}
	/** The focusable track: arrow keys, Home and End move one slide (no wrap-around). */
	function onTrackKey(e: KeyboardEvent) {
		if (total < 2 || e.altKey || e.ctrlKey || e.metaKey) return;
		const flip = sign();
		let n = -1;
		if (e.key === 'ArrowRight') n = current + flip;
		else if (e.key === 'ArrowLeft') n = current - flip;
		else if (e.key === 'Home') n = 0;
		else if (e.key === 'End') n = total - 1;
		else return;
		e.preventDefault();
		goTo(clamp(n, 0, total - 1));
	}

	/* Slides built from children: keep the count in sync. */
	$effect(() => {
		const el = track;
		if (!el || items) return;
		const count = () => (slotted = slideEls().length);
		count();
		const mo = new MutationObserver(count);
		mo.observe(el, { childList: true });
		const slot = el.querySelector('slot');
		slot?.addEventListener('slotchange', count);
		return () => {
			mo.disconnect();
			slot?.removeEventListener('slotchange', count);
		};
	});

	/* Roles, names and hiding of the slides that are not visible. */
	$effect(() => {
		const els = slideEls();
		const n = total;
		const active = current;
		els.forEach((el, i) => {
			el.setAttribute('role', 'tabpanel');
			el.setAttribute('aria-roledescription', 'slide');
			el.setAttribute('aria-label', `${i + 1} ${ofLabel} ${n}`);
			el.inert = i !== active;
		});
	});

	/* An index set from outside scrolls the track to that slide. */
	$effect(() => {
		const i = current;
		if (!track || total === 0) return;
		if (i > total - 1 || i < 0 || !Number.isInteger(i)) {
			index = clamp(Number.isFinite(i) ? Math.round(i) : 0, 0, total - 1);
			return;
		}
		if (untrack(scrolledIndex) !== i) goTo(i);
	});

	/* Announce the active slide once it has settled, not every step of a swipe. */
	let announced = -1;
	$effect(() => {
		const i = current;
		const n = total;
		const of = ofLabel;
		if (n < 2) return;
		if (announced === -1) {
			// The first slide is not news; only later changes are announced.
			announced = i;
			return;
		}
		const t = setTimeout(() => {
			if (announced === i) return;
			announced = i;
			announcement = `${i + 1} ${of} ${n}`;
		}, 400);
		return () => clearTimeout(t);
	});

	/* Keep the visible slide aligned when the width changes. */
	$effect(() => {
		const el = track;
		if (!el) return;
		const ro = new ResizeObserver(() => untrack(realign));
		ro.observe(el);
		return () => {
			ro.disconnect();
			clearTimeout(settleTimer);
			if (frame) cancelAnimationFrame(frame);
		};
	});
</script>

<section class="k-carousel {cls}" aria-roledescription="carousel" aria-label={label}>
	<!-- The track scrolls, so it must be reachable by keyboard whenever it can overflow
	     (WCAG 2.1.1, axe scrollable-region-focusable); its keys move between slides. -->
	<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
	<div
		class="track"
		role="group"
		aria-label={label}
		bind:this={track}
		{onscroll}
		onkeydown={onTrackKey}
		tabindex={total > 1 ? 0 : -1}
	>
		{#if items && slide}
			{#each items as item, i (i)}
				<div id="{uid}-slide-{i}">{@render slide(item, i)}</div>
			{/each}
		{:else}
			{@render children?.()}
		{/if}
	</div>
	<div class="sr" aria-live="polite" aria-atomic="true">{announcement}</div>
	{#if total > 1}
		<div class="controls">
			<button type="button" class="nav" aria-label={prevLabel} aria-disabled={current <= 0} onclick={() => current > 0 && goTo(current - 1)}>
				<svg class="chev" viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3L5 8l5 5" fill="none" stroke="currentColor" stroke-width="1.8" /></svg>
			</button>
			<div class="dots" role="tablist" aria-label={dotsLabel} tabindex="-1" bind:this={tablist} onkeydown={onTabKey}>
				{#each dots as i (i)}
					<button
						type="button"
						role="tab"
						class="tab"
						aria-label="{slideLabel} {i + 1}"
						aria-selected={i === current}
						aria-controls={items ? `${uid}-slide-${i}` : undefined}
						tabindex={i === current ? 0 : -1}
						onclick={() => goTo(i)}
					><span class="dot"></span></button>
				{/each}
			</div>
			<button type="button" class="nav" aria-label={nextLabel} aria-disabled={current >= total - 1} onclick={() => current < total - 1 && goTo(current + 1)}>
				<svg class="chev" viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.8" /></svg>
			</button>
		</div>
	{/if}
</section>

<style>
	.k-carousel { position: relative; display: grid; gap: var(--k-space-3); min-width: 0; }
	.track {
		display: flex;
		overflow-x: auto;
		overscroll-behavior-x: contain;
		scroll-snap-type: x mandatory;
		scrollbar-width: none;
		outline: none;
		border-radius: var(--k-radius-card);
	}
	.track::-webkit-scrollbar { display: none; }
	.track:focus-visible { outline: var(--k-focus-w) solid var(--k-focus); outline-offset: var(--k-focus-offset); }
	.sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0; }
	.track > :global(*) {
		flex: 0 0 100%;
		min-width: 0;
		box-sizing: border-box;
		scroll-snap-align: start;
		scroll-snap-stop: always;
	}
	.track :global(::slotted(*)) {
		flex: 0 0 100%;
		min-width: 0;
		box-sizing: border-box;
		scroll-snap-align: start;
		scroll-snap-stop: always;
	}
	.controls { display: flex; align-items: center; justify-content: space-between; gap: var(--k-space-2); }
	.nav {
		display: inline-grid;
		place-items: center;
		flex: none;
		width: var(--k-control-h);
		height: var(--k-control-h);
		padding: 0;
		border: var(--k-border-w) solid var(--k-border);
		border-radius: var(--k-radius-control);
		background: transparent;
		color: var(--k-fg);
		cursor: pointer;
		transition: background-color var(--k-dur) var(--k-ease);
	}
	.nav:hover:not([aria-disabled='true']) { background: var(--k-bg-sunken); }
	.nav[aria-disabled='true'] { opacity: 0.5; cursor: not-allowed; }
	.chev { width: 16px; height: 16px; }
	.k-carousel:dir(rtl) .chev { transform: scaleX(-1); }
	.dots { display: flex; flex: 1; flex-wrap: wrap; align-items: center; justify-content: center; min-width: 0; outline: none; }
	.tab {
		display: inline-grid;
		place-items: center;
		width: max(40px, var(--k-tap-target));
		height: max(40px, var(--k-tap-target));
		padding: 0;
		border: 0;
		border-radius: var(--k-radius-control);
		background: transparent;
		cursor: pointer;
	}
	.dot {
		display: block;
		width: 10px;
		height: 10px;
		border: var(--k-border-w) solid var(--k-fg-muted);
		border-radius: var(--k-radius-badge);
		background: transparent;
		transition: width var(--k-dur) var(--k-ease), background-color var(--k-dur) var(--k-ease), border-color var(--k-dur) var(--k-ease);
	}
	.tab:hover .dot { border-color: var(--k-fg); }
	.tab[aria-selected='true'] .dot { width: 24px; border-color: var(--k-primary); background: var(--k-primary); }
	.nav:focus-visible, .tab:focus-visible { outline: var(--k-focus-w) solid var(--k-focus); outline-offset: var(--k-focus-offset); }
</style>
