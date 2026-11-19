<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		/** Maximum height before the content scrolls: px as a number, or any CSS length. */
		maxHeight?: number | string | undefined;
		/** Which axes may scroll. */
		direction?: 'vertical' | 'horizontal' | 'both' | undefined;
		/** Fades the content out at the edges that have more to scroll to. */
		fade?: boolean | undefined;
		/** Size of the fade in px. */
		fadeSize?: number | undefined;
		/** Accessible name, used while the area scrolls (it is then a focusable region). */
		label?: string | undefined;
		class?: string | undefined;
		children?: Snippet | undefined;
	}
	let { maxHeight, direction = 'vertical', fade = false, fadeSize = 28, label = 'Scrollable content', class: cls = '', children }: Props = $props();

	let scroller: HTMLElement | undefined = $state();
	let content: HTMLElement | undefined = $state();
	let scrollable = $state(false);
	let before = $state(false);
	let after = $state(false);
	let startSide = $state(false);
	let endSide = $state(false);
	let rtl = $state(false);

	const vertical = $derived(direction !== 'horizontal');
	const horizontal = $derived(direction !== 'vertical');
	const height = $derived(typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight);

	/** Reads the scroll position and overflow; called on scroll, resize and prop changes. */
	function measure(): void {
		const el = scroller;
		if (!el) return;
		const slack = 1;
		rtl = getComputedStyle(el).direction === 'rtl';
		const overflowY = vertical && el.scrollHeight - el.clientHeight > slack;
		const overflowX = horizontal && el.scrollWidth - el.clientWidth > slack;
		scrollable = overflowY || overflowX;
		before = overflowY && el.scrollTop > slack;
		after = overflowY && el.scrollTop + el.clientHeight < el.scrollHeight - slack;
		// scrollLeft is negative in right-to-left layouts; |scrollLeft| is the distance from the start.
		const travelled = Math.abs(el.scrollLeft);
		startSide = overflowX && travelled > slack;
		endSide = overflowX && travelled + el.clientWidth < el.scrollWidth - slack;
	}

	$effect(() => {
		const el = scroller;
		if (!el) return;
		measure();
		if (typeof ResizeObserver === 'undefined') return;
		const observer = new ResizeObserver(measure);
		observer.observe(el);
		if (content) observer.observe(content);
		return () => observer.disconnect();
	});

	const fadeLeft = $derived(rtl ? endSide : startSide);
	const fadeRight = $derived(rtl ? startSide : endSide);
</script>

<div class="k-scroll-area {cls}" class:fade>
	<!-- A scrolling area is a focusable region so keyboard users can scroll it; it is not focusable when nothing scrolls. -->
	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<div
		class="scroller"
		bind:this={scroller}
		data-direction={direction}
		role={scrollable ? 'region' : undefined}
		aria-label={scrollable ? label : undefined}
		tabindex={scrollable ? 0 : undefined}
		style:max-height={height}
		style:--fade-size="{fadeSize}px"
		style:--fade-t={fade && before ? 'var(--fade-size)' : '0px'}
		style:--fade-b={fade && after ? 'var(--fade-size)' : '0px'}
		style:--fade-l={fade && fadeLeft ? 'var(--fade-size)' : '0px'}
		style:--fade-r={fade && fadeRight ? 'var(--fade-size)' : '0px'}
		onscroll={measure}
	>
		<div class="content" bind:this={content}>{@render children?.()}</div>
	</div>
</div>

<style>
	.k-scroll-area { min-width: 0; max-width: 100%; }
	/* The focus ring sits on the wrapper: a mask on the scroller would clip an outside outline. */
	.k-scroll-area:has(.scroller:focus-visible) { outline: var(--k-focus-w) solid var(--k-focus); outline-offset: var(--k-focus-offset); border-radius: var(--k-radius-field); }
	.scroller {
		overflow: auto;
		overscroll-behavior: contain;
		scrollbar-width: thin;
		scrollbar-color: var(--k-border) var(--k-bg-sunken);
		outline: none;
	}
	.scroller[data-direction='vertical'] { overflow-x: hidden; }
	.scroller[data-direction='horizontal'] { overflow-y: hidden; }
	.content { min-width: 0; }
	.scroller:not([data-direction='vertical']) > .content { width: max-content; min-width: 100%; }

	.fade .scroller[data-direction='vertical'] {
		mask-image: linear-gradient(to bottom, transparent 0, #000 var(--fade-t), #000 calc(100% - var(--fade-b)), transparent 100%);
	}
	.fade .scroller[data-direction='horizontal'] {
		mask-image: linear-gradient(to right, transparent 0, #000 var(--fade-l), #000 calc(100% - var(--fade-r)), transparent 100%);
	}
	.fade .scroller[data-direction='both'] {
		mask-image:
			linear-gradient(to bottom, transparent 0, #000 var(--fade-t), #000 calc(100% - var(--fade-b)), transparent 100%),
			linear-gradient(to right, transparent 0, #000 var(--fade-l), #000 calc(100% - var(--fade-r)), transparent 100%);
		mask-composite: intersect;
	}

	/* Browsers without scrollbar-color/-width (older Safari) get a styled WebKit scrollbar instead. */
	@supports not (scrollbar-width: thin) {
		.scroller::-webkit-scrollbar { width: 10px; height: 10px; }
		.scroller::-webkit-scrollbar-track { background: var(--k-bg-sunken); }
		.scroller::-webkit-scrollbar-thumb { border: 2px solid var(--k-bg-sunken); border-radius: var(--k-radius-badge); background: var(--k-border); }
	}
</style>
