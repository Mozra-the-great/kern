<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		/** Meaning. Status tones must still carry a word. */
		tone?: 'neutral' | 'accent' | 'ok' | 'warn' | 'danger' | 'info' | undefined;
		/** `soft` = tinted fill, `outline` = border only, `solid` = filled. */
		look?: 'soft' | 'outline' | 'solid' | undefined;
		class?: string | undefined;
		children?: Snippet | undefined;
	}
	let { tone = 'neutral', look = 'soft', class: cls = '', children }: Props = $props();
</script>

<span class="k-badge {cls}" data-tone={tone} data-look={look}>{@render children?.()}</span>

<style>
	.k-badge {
		--c: var(--k-fg);
		--soft: var(--k-bg-sunken);
		--on: var(--k-bg);
		display: inline-flex;
		align-items: center;
		gap: var(--k-space-1);
		padding: 2px var(--k-space-2);
		border: var(--k-border-w) solid transparent;
		border-radius: var(--k-radius-badge);
		font-family: var(--k-label-font);
		font-size: var(--k-text-xs);
		font-weight: var(--k-weight-label);
		text-transform: var(--k-label-transform);
		letter-spacing: var(--k-label-tracking);
		line-height: 1.5;
		white-space: nowrap;
	}
	[data-tone='accent'] {
		--c: var(--k-accent-text);
		--soft: var(--k-accent-soft);
		--solid: var(--k-accent);
		--on: var(--k-on-accent);
	}
	[data-tone='ok'] {
		--c: var(--k-ok);
		--soft: var(--k-ok-soft);
	}
	[data-tone='warn'] {
		--c: var(--k-warn);
		--soft: var(--k-warn-soft);
	}
	[data-tone='danger'] {
		--c: var(--k-danger);
		--soft: var(--k-danger-soft);
		--solid: var(--k-danger);
		--on: var(--k-on-danger);
	}
	[data-tone='info'] {
		--c: var(--k-info);
		--soft: var(--k-info-soft);
	}
	[data-look='soft'] {
		color: var(--c);
		background: var(--soft);
		border-color: color-mix(in srgb, var(--c) 30%, transparent);
	}
	[data-look='outline'] {
		color: var(--c);
		border-color: var(--c);
	}
	[data-look='solid'] {
		color: var(--on);
		background: var(--solid, var(--c));
	}
</style>
