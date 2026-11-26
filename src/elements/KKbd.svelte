<svelte:options
	customElement={{
		props: {
			keys: { type: 'Array' },
			separator: { type: 'String' },
			size: { type: 'String' },
			platform: { type: 'String' },
			labels: { type: 'Object' }
		}
	}}
/>

<script lang="ts">
	/**
	 * @prop keys {readonly string[]}
	 * @prop labels {Record<string, string>}
	 */
	import Kbd from '../lib/components/Kbd.svelte';
	/* keys: JSON, e.g. keys='["mod","K"]'. Without keys the slot is one key. labels: JSON, spoken names by key, e.g. labels='{"mod":"Befehl"}'. */
	let { keys, separator, size, platform, labels } = $props();
	const single = $derived(!Array.isArray(keys) || keys.length === 0);
</script>

{#snippet slotted()}{#if single}<slot />{/if}{/snippet}
<Kbd {keys} {separator} {size} {platform} {labels} children={single ? slotted : undefined} />

<style>
	:host {
		display: inline;
	}
</style>
