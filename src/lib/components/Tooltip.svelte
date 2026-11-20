<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		/** Tooltip text. Supplements, never replaces, a visible or accessible name. */
		text: string;
		placement?: 'top' | 'bottom' | 'left' | 'right' | undefined;
		class?: string | undefined;
		/** The trigger. It should be focusable. */
		children: Snippet;
	}
	let { text, placement = 'top', class: cls = '', children }: Props = $props();
	const uid = $props.id();
	let shown = $state(false);
	let wrap: HTMLElement | undefined = $state();

	$effect(() => {
		const trigger = wrap?.querySelector<HTMLElement>('a,button,input,select,textarea,[tabindex]');
		if (!trigger) return;
		const prev = trigger.getAttribute('aria-describedby');
		trigger.setAttribute('aria-describedby', [prev, `${uid}-tip`].filter(Boolean).join(' '));
		return () => {
			if (prev) trigger.setAttribute('aria-describedby', prev);
			else trigger.removeAttribute('aria-describedby');
		};
	});

	// An id reference cannot cross a shadow root. As `<k-tooltip>` the trigger is slotted light DOM (or sits inside the
	// shadow root of another element such as <k-button>), so the effect above finds nothing and the text would never
	// reach assistive technology. While the focus is in such a trigger it gets `aria-description` with the text.
	let described: Element | undefined;
	function onfocusin(e: FocusEvent) {
		shown = true;
		const target = e.composedPath()[0];
		if (target instanceof Element && wrap && target.getRootNode() !== wrap.getRootNode() && !target.hasAttribute('aria-description')) {
			target.setAttribute('aria-description', text);
			described = target;
		}
	}
	function onfocusout() {
		shown = false;
		described?.removeAttribute('aria-description');
		described = undefined;
	}
	$effect(() => () => described?.removeAttribute('aria-description'));
</script>

<span
	class="k-tooltip {cls}"
	bind:this={wrap}
	role="presentation"
	onmouseenter={() => (shown = true)}
	onmouseleave={() => (shown = false)}
	{onfocusin}
	{onfocusout}
	onkeydown={(e) => {
		if (e.key === 'Escape') shown = false;
	}}
>
	{@render children()}
	<span class="tip" id="{uid}-tip" role="tooltip" data-placement={placement} class:shown>{text}</span>
</span>

<style>
	.k-tooltip {
		position: relative;
		display: inline-flex;
	}
	.tip {
		position: absolute;
		z-index: 900;
		width: max-content;
		max-width: 260px;
		padding: var(--k-space-1) var(--k-space-2);
		border-radius: min(var(--k-radius-field), 8px);
		background: var(--k-fg);
		color: var(--k-bg);
		font-family: var(--k-font-sans);
		font-size: var(--k-text-xs);
		font-weight: 500;
		line-height: 1.4;
		text-transform: none;
		letter-spacing: 0;
		pointer-events: none;
		opacity: 0;
		visibility: hidden;
		transition: opacity var(--k-dur) var(--k-ease);
	}
	.shown {
		opacity: 1;
		visibility: visible;
	}
	[data-placement='top'] {
		bottom: calc(100% + 6px);
		left: 50%;
		transform: translateX(-50%);
	}
	[data-placement='bottom'] {
		top: calc(100% + 6px);
		left: 50%;
		transform: translateX(-50%);
	}
	[data-placement='left'] {
		right: calc(100% + 6px);
		top: 50%;
		transform: translateY(-50%);
	}
	[data-placement='right'] {
		left: calc(100% + 6px);
		top: 50%;
		transform: translateY(-50%);
	}
	@media (forced-colors: active) {
		.tip {
			border: 1px solid CanvasText;
			background: Canvas;
			color: CanvasText;
		}
	}
</style>
