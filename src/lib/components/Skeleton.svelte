<script lang="ts">
	interface Props {
		/** `text` = one or more lines, `rect` = block, `circle` = round (avatar). */
		variant?: 'text' | 'rect' | 'circle' | undefined;
		/** CSS length, or a number of pixels. */
		width?: string | number | undefined;
		/** CSS length, or a number of pixels. For `text` it is the height of each line. */
		height?: string | number | undefined;
		/** Number of lines of the `text` variant. The last of several lines is shorter. */
		lines?: number | undefined;
		class?: string | undefined;
	}
	let { variant = 'text', width, height, lines = 1, class: cls = '' }: Props = $props();

	const css = (v: string | number | undefined): string | undefined => (typeof v === 'number' ? `${v}px` : v);
	const count = $derived(Math.max(1, Math.floor(lines) || 1));
	const rows = $derived(Array.from({ length: count }, (_, i) => i));
	const boxW = $derived(css(width) ?? (variant === 'circle' ? '40px' : '100%'));
	const boxH = $derived(css(height) ?? (variant === 'circle' ? boxW : '120px'));
</script>

{#if variant === 'text'}
	<span class="k-skeleton text {cls}" aria-hidden="true" style:width={css(width)}>
		{#each rows as i (i)}
			<span class="shape line" class:last={count > 1 && i === count - 1} style:height={css(height)}></span>
		{/each}
	</span>
{:else}
	<span class="k-skeleton shape {variant} {cls}" aria-hidden="true" style:width={boxW} style:height={boxH}></span>
{/if}

<style>
	.k-skeleton {
		display: block;
		max-width: 100%;
	}
	.text {
		display: grid;
		gap: var(--k-space-2);
	}
	.shape {
		display: block;
		background-color: color-mix(in srgb, var(--k-fg-muted) 22%, var(--k-bg-raised));
		background-image: linear-gradient(100deg, transparent 35%, color-mix(in srgb, var(--k-fg) 10%, transparent) 50%, transparent 65%);
		background-repeat: no-repeat;
		background-size: 250% 100%;
		background-position: 100% 0;
		/* --k-dur: 0 (reduced motion) makes the duration 0, so nothing moves. */
		animation: k-shimmer calc(var(--k-dur) * 12) var(--k-ease) infinite;
	}
	.line {
		height: 0.9em;
		min-height: 10px;
		border-radius: var(--k-radius-badge);
	}
	.line.last {
		width: 60%;
	}
	.rect {
		border-radius: var(--k-radius-field);
	}
	.circle {
		flex: none;
		border-radius: 50%;
	}
	@keyframes k-shimmer {
		to {
			background-position: 0% 0;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.shape {
			animation: none;
		}
	}
	@media (forced-colors: active) {
		/* A placeholder is only a shape: show it as a dashed outline, without the shimmer. */
		.shape {
			box-sizing: border-box;
			border: 1px dashed GrayText;
			background-image: none;
			animation: none;
		}
	}
</style>
