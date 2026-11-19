<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		open?: boolean;
		/** Text of the trigger button. Use `trigger` for richer content. */
		label?: string;
		/** Content of the trigger button; replaces `label`. */
		trigger?: Snippet;
		disabled?: boolean;
		/** `boxed` = bordered surface, `plain` = only a line below. */
		look?: 'boxed' | 'plain';
		/** Called when the user opens or closes it. */
		ontoggle?: (open: boolean) => void;
		class?: string;
		children?: Snippet;
	}
	let { open = $bindable(false), label, trigger, disabled = false, look = 'boxed', ontoggle, class: cls = '', children }: Props = $props();
	const uid = $props.id();

	function toggle(): void {
		open = !open;
		ontoggle?.(open);
	}
</script>

<div class="k-collapsible {cls}" data-look={look} class:open>
	<button type="button" class="trigger" id="{uid}-trigger" aria-expanded={open} aria-controls="{uid}-content" {disabled} onclick={toggle}>
		<span class="text">{#if trigger}{@render trigger()}{:else}{label}{/if}</span>
		<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" stroke-width="2" /></svg>
	</button>
	<!-- Height animates through the grid row (0fr to 1fr); `inert` keeps closed content out of the tab order. -->
	<div class="panel" id="{uid}-content" role="group" aria-labelledby="{uid}-trigger">
		<div class="clip" inert={!open}>
			<div class="content">{@render children?.()}</div>
		</div>
	</div>
</div>

<style>
	.k-collapsible { min-width: 0; color: var(--k-fg); }
	[data-look='boxed'] {
		overflow: hidden;
		border: var(--k-border-w) solid var(--k-line);
		border-radius: var(--k-radius-field);
		background: var(--k-bg-raised);
	}
	[data-look='plain'] { border-bottom: var(--k-border-w) solid var(--k-line); }
	.trigger {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--k-space-4);
		box-sizing: border-box;
		width: 100%;
		min-height: max(44px, var(--k-control-h));
		margin: 0;
		padding: var(--k-space-2) var(--k-space-4);
		border: 0;
		border-radius: 0;
		background: transparent;
		color: inherit;
		font-family: var(--k-label-font);
		font-size: var(--k-label-size);
		font-weight: var(--k-weight-heading);
		text-transform: var(--k-label-transform);
		letter-spacing: var(--k-label-tracking);
		text-align: start;
		cursor: pointer;
	}
	[data-look='plain'] > .trigger { padding-inline: var(--k-space-2); }
	.trigger:hover:not(:disabled) { background: var(--k-bg-sunken); }
	.trigger:focus-visible { outline: var(--k-focus-w) solid var(--k-focus); outline-offset: calc(var(--k-focus-w) * -1); }
	.trigger:disabled { opacity: 0.5; cursor: not-allowed; }
	.text { min-width: 0; overflow-wrap: anywhere; }
	.trigger > svg { flex: none; width: 16px; height: 16px; color: var(--k-fg-muted); transition: transform var(--k-dur) var(--k-ease); }
	.open > .trigger > svg { transform: rotate(180deg); }

	.panel {
		display: grid;
		grid-template-rows: 0fr;
		visibility: hidden;
		transition: grid-template-rows var(--k-dur) var(--k-ease), visibility 0s linear var(--k-dur);
	}
	.open > .panel { grid-template-rows: 1fr; visibility: visible; transition-delay: 0s; }
	.clip { min-height: 0; overflow: hidden; }
	.content { padding: var(--k-space-3) var(--k-space-4) var(--k-space-5); border-top: var(--k-border-w) solid var(--k-line); }
	[data-look='plain'] > .panel > .clip > .content { padding-inline: var(--k-space-2); border-top: 0; }
	.content :global(p) { margin: 0 0 var(--k-space-3); }
	.content :global(p:last-child) { margin-bottom: 0; }

	@media (prefers-reduced-motion: reduce) {
		.trigger > svg, .panel { transition: none; }
	}
</style>
