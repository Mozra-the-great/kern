<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAnchorAttributes } from 'svelte/elements';
	import { strings } from './strings.svelte.js';

	interface Props extends HTMLAnchorAttributes {
		/** Opens in a new tab with rel="noopener noreferrer". */
		external?: boolean | undefined;
		/** Read after the text of an `external` link. Default: "(opens in a new tab)" (see the strings catalogue). */
		externalLabel?: string | undefined;
		children?: Snippet; // same type as the inherited HTML attribute
	}
	let { external = false, externalLabel, class: cls = '', children, ...rest }: Props = $props();
</script>

<a class="k-link {cls}" target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined} {...rest}>
	{@render children?.()}{#if external}<span class="ext" aria-hidden="true">↗</span><span class="sr">
			{externalLabel ?? strings().link.externalLabel}
		</span>{/if}
</a>

<style>
	.k-link {
		color: var(--k-link);
		text-decoration: underline;
		text-underline-offset: 0.18em;
		text-decoration-thickness: 1px;
		border-radius: 2px;
	}
	.k-link:hover {
		text-decoration-thickness: 2px;
	}
	.k-link:focus-visible {
		outline: var(--k-focus-w) solid var(--k-focus);
		outline-offset: var(--k-focus-offset);
	}
	.ext {
		margin-left: 0.15em;
		font-size: 0.85em;
	}
	.sr {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip: rect(0 0 0 0);
		white-space: nowrap;
	}
</style>
