<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAnchorAttributes } from 'svelte/elements';

	interface Props extends HTMLAnchorAttributes {
		/** Opens in a new tab with rel="noopener noreferrer". */
		external?: boolean;
		children?: Snippet;
	}
	let { external = false, class: cls = '', children, ...rest }: Props = $props();
</script>

<a
	class="k-link {cls}"
	target={external ? '_blank' : undefined}
	rel={external ? 'noopener noreferrer' : undefined}
	{...rest}
>
	{@render children?.()}{#if external}<span class="ext" aria-hidden="true">↗</span><span class="sr">(opens in a new tab)</span>{/if}
</a>

<style>
	.k-link {
		color: var(--k-link);
		text-decoration: underline;
		text-underline-offset: 0.18em;
		text-decoration-thickness: 1px;
		border-radius: 2px;
	}
	.k-link:hover { text-decoration-thickness: 2px; }
	.k-link:focus-visible { outline: var(--k-focus-w) solid var(--k-focus); outline-offset: var(--k-focus-offset); }
	.ext { margin-left: 0.15em; font-size: 0.85em; }
	.sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
</style>
