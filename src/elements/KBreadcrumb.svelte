<svelte:options customElement={{ tag: 'k-breadcrumb', props: { items: { type: "Array" }, label: { type: "String" }, max: { type: "Number" }, expandLabel: { type: 'String', attribute: 'expand-label' } } }} />
<script lang="ts">
	import Breadcrumb from '../lib/components/Breadcrumb.svelte';
	/* items: JSON list of { label, href? }; the last item is the current page. */
	let { items = [], label, max, expandLabel } = $props();
</script>
<Breadcrumb {items} {label} {max} {expandLabel} />
