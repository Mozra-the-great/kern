<svelte:options
	customElement={{
		props: {
			title: { type: 'String' },
			description: { type: 'String' },
			level: { type: 'Number' },
			look: { type: 'String' },
			href: { type: 'String' }
		}
	}}
/>

<script lang="ts">
	import Card from '../lib/components/Card.svelte';
	import { hasSlot } from './form.js';
	let { title, description, level, look, href } = $props();
	const host = $host();
	const media = hasSlot(host, 'media');
	const footer = hasSlot(host, 'footer');
</script>

{#snippet mediaS()}{#if media}<slot name="media" />{/if}{/snippet}
{#snippet footerS()}{#if footer}<slot name="footer" />{/if}{/snippet}
<Card {title} {description} {level} {look} {href} media={media ? mediaS : undefined} footer={footer ? footerS : undefined}><slot /></Card>
