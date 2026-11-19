<script lang="ts">
	interface Props {
		/** `block` = full cell like a terminal, `bar` = thin line like a text field, `underline` = DOS style. */
		shape?: 'block' | 'bar' | 'underline' | undefined;
		/** Blink. Turn it off while text is being typed. */
		blink?: boolean | undefined;
		/** Blink cycles before the caret stays solid (WCAG 2.2.2: blinking over 5 s needs a way to stop). 0 = blink forever. */
		cycles?: number | undefined;
		class?: string | undefined;
	}
	let { shape = 'block', blink = true, cycles = 4, class: cls = '' }: Props = $props();
	const iterations = $derived(cycles > 0 ? String(Math.floor(cycles)) : 'infinite');
</script>

<span class="k-caret {cls}" data-shape={shape} class:blink aria-hidden="true" style:--k-caret-cycles={iterations}></span>

<style>
	.k-caret {
		display: inline-block;
		flex: none;
		background: currentColor;
		vertical-align: -0.2em;
	}
	[data-shape='block'] {
		width: 0.6em;
		height: 1.1em;
	}
	[data-shape='bar'] {
		width: max(2px, 0.1em);
		height: 1.1em;
	}
	[data-shape='underline'] {
		width: 0.6em;
		height: max(2px, 0.12em);
		vertical-align: baseline;
	}
	/* Hard on/off, as a caret does. After the last cycle it stays visible. */
	.blink {
		animation: k-caret-blink 1.2s step-end var(--k-caret-cycles, 4);
	}
	@keyframes k-caret-blink {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.blink {
			animation: none;
		}
	}
</style>
