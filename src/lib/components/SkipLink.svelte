<script lang="ts">
	import type { HTMLAnchorAttributes } from 'svelte/elements';
	import { strings } from './strings.svelte.js';

	interface Props extends Omit<HTMLAnchorAttributes, 'href' | 'children' | 'onclick' | 'target'> {
		/** Id of the element to jump to, e.g. `main`. It gets focus; it need not be focusable itself. */
		target: string;
		/** Text of the link. Default: "Skip to main content" (see the strings catalogue). */
		label?: string | undefined;
		/** Runs first; `preventDefault()` keeps the link from moving focus. */
		onclick?: ((event: MouseEvent) => void) | undefined;
	}
	let { target, label: labelProp, class: cls = '', onclick, ...rest }: Props = $props();
	const label = $derived(labelProp ?? strings().skipLink.label);

	/** The element with the id: in the link's own tree first (a shadow root), then in the document. */
	function find(from: Element): HTMLElement | null {
		const root = from.getRootNode();
		if ('getElementById' in root) {
			const inRoot = (root as Document | ShadowRoot).getElementById(target);
			if (inRoot) return inRoot;
		}
		return document.getElementById(target);
	}

	/*
	 * Moves focus to the target instead of changing the address bar: single-page apps keep their
	 * route. A target that cannot take focus gets `tabindex="-1"` until focus leaves it. Without a
	 * target the link keeps its normal behaviour (a fragment jump).
	 */
	function jump(event: MouseEvent & { currentTarget: HTMLAnchorElement }): void {
		onclick?.(event);
		if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
		const element = find(event.currentTarget);
		if (!element) return;
		event.preventDefault();
		if (!element.hasAttribute('tabindex')) {
			element.setAttribute('tabindex', '-1');
			element.addEventListener('blur', () => element.removeAttribute('tabindex'), { once: true });
		}
		element.focus();
	}
</script>

<a {...rest} class="k-skip-link {cls}" href="#{target}" onclick={jump}>{label}</a>

<style>
	/* Hidden until it has focus: still the first tab stop and still read by screen readers. */
	.k-skip-link {
		position: fixed;
		inset-block-start: var(--k-space-2);
		inset-inline-start: var(--k-space-2);
		z-index: 1000;
		box-sizing: border-box;
		display: inline-flex;
		align-items: center;
		inline-size: 1px;
		block-size: 1px;
		padding: 0;
		border: 0 solid var(--k-fg);
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
		border-radius: var(--k-radius-control);
		background: var(--k-fg);
		color: var(--k-bg);
		font-family: var(--k-font-sans);
		font-size: var(--k-text-md);
		font-weight: var(--k-weight-label);
		line-height: 1.25;
		text-decoration: underline;
		text-underline-offset: 0.18em;
	}
	.k-skip-link:focus,
	.k-skip-link:focus-visible {
		inline-size: auto;
		block-size: auto;
		min-block-size: var(--k-tap-target, 44px);
		padding: var(--k-space-2) var(--k-space-4);
		border-width: var(--k-border-w);
		overflow: visible;
		clip-path: none;
		outline: var(--k-focus-w) solid var(--k-focus);
		outline-offset: var(--k-focus-offset);
		box-shadow: 0 0 0 calc(var(--k-focus-w) + var(--k-focus-offset)) var(--k-bg);
	}
	@media (forced-colors: active) {
		.k-skip-link:focus,
		.k-skip-link:focus-visible {
			border: 2px solid CanvasText;
			background: Canvas;
			color: LinkText;
			outline: 2px solid Highlight;
			box-shadow: none;
		}
	}
</style>
