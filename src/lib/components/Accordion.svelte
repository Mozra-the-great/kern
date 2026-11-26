<script lang="ts">
	import type { Snippet } from 'svelte';
	import AccordionItem from './AccordionItem.svelte';

	export interface AccordionEntry {
		id: string;
		title: string;
		open?: boolean | undefined;
	}
	interface Props {
		/** Data-driven items; or pass <AccordionItem> children instead. */
		items?: readonly AccordionEntry[] | undefined;
		/** Only one item open at a time (applies to `items`). */
		single?: boolean | undefined;
		/** Renders the content of the given item id. */
		content?: Snippet<[string]> | undefined;
		class?: string | undefined;
		children?: Snippet | undefined;
	}
	let { items, single = false, content, class: cls = '', children }: Props = $props();
	const uid = $props.id();
</script>

<div class="k-accordion {cls}">
	{#if items}
		{#each items as item (item.id)}
			<AccordionItem title={item.title} open={item.open} name={single ? `${uid}-acc` : undefined}>
				{@render content?.(item.id)}
			</AccordionItem>
		{/each}
	{/if}
	{@render children?.()}
</div>

<style>
	.k-accordion {
		border-top: var(--k-border-w) solid var(--k-line);
	}
</style>
