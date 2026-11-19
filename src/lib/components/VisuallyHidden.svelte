<!--
	Text for assistive technology only (#100): kept in the accessibility tree and read by screen readers,
	but not painted. For an icon-only column header, the words beside a "+" / "-" marker, a status that
	the picture already shows. `focusable` makes it visible while it or something inside has focus
	(a skip link, a "jump to" link). Without a component: the global class `.k-visually-hidden`
	(and `.k-visually-hidden-focusable`) from the theme CSS does the same.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	interface Props extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
		/** Element to render. Default `span` (inline, valid inside buttons, labels and table cells). */
		as?: 'span' | 'div' | 'p' | 'label' | 'h2' | 'h3' | 'h4' | undefined;
		/** Show the content while it or something inside it has focus. Default false. */
		focusable?: boolean | undefined;
		/** The text (or markup) for assistive technology. */
		children?: Snippet | undefined;
	}

	let { as, focusable, children, class: className, ...rest }: Props = $props();
	const tag = $derived(as ?? 'span');
</script>

<svelte:element this={tag} class={['vh', focusable === true && 'focusable', className]} {...rest}>
	{@render children?.()}
</svelte:element>

<style>
	/* The same rule as `.k-visually-hidden` in base.css, scoped so the component works without the theme CSS. */
	.vh:not(.focusable:focus, .focusable:focus-within) {
		position: absolute;
		width: 1px;
		height: 1px;
		margin: -1px;
		padding: 0;
		border: 0;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}
</style>
