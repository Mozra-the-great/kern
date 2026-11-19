<svelte:options customElement={{ props: { name: { type: 'String' }, src: { type: 'String' }, size: { type: 'Number' } } }} />

<script lang="ts">
	import Avatar from '../lib/components/Avatar.svelte';
	let { name = '', src, size } = $props();
</script>

<Avatar {name} {src} {size} />
