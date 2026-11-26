<svelte:options
	customElement={{
		props: {
			items: { type: 'Array' },
			label: { type: 'String' },
			max: { type: 'Number' },
			expandLabel: { type: 'String', attribute: 'expand-label' }
		}
	}}
/>

<script lang="ts">
	/**
	 * @prop items {readonly BreadcrumbItem[]}
	 */
	import Breadcrumb from '../lib/components/Breadcrumb.svelte';
	/* items: JSON list of { label, href? }; the last item is the current page. */
	let { items = [], label, max, expandLabel } = $props();
</script>

<Breadcrumb {items} {label} {max} {expandLabel} />
