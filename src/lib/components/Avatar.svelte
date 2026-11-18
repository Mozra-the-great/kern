<script lang="ts">
	interface Props {
		/** Person or item name: used for alt text and initials. */
		name: string;
		src?: string;
		size?: number;
		class?: string;
	}
	let { name, src, size = 40, class: cls = '' }: Props = $props();
	let failed = $state(false);
	const initials = $derived(
		name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('')
	);
</script>

<span class="k-avatar {cls}" style:--size="{size}px" role="img" aria-label={name}>
	{#if src && !failed}
		<img {src} alt="" onerror={() => (failed = true)} />
	{:else}
		<span aria-hidden="true">{initials}</span>
	{/if}
</span>

<style>
	.k-avatar {
		display: inline-grid;
		place-items: center;
		flex: none;
		width: var(--size);
		height: var(--size);
		overflow: hidden;
		border-radius: var(--k-radius-avatar);
		background: var(--k-bg-sunken);
		color: var(--k-fg);
		border: var(--k-border-w) solid var(--k-line);
		font-family: var(--k-label-font);
		font-weight: var(--k-weight-label);
		font-size: calc(var(--size) * 0.38);
		line-height: 1;
	}
	img { width: 100%; height: 100%; object-fit: cover; }
</style>
