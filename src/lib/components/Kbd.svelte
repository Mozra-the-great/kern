<script lang="ts" module>
	/** A key as drawn (`glyph`) and as spoken (`text`). */
	export interface KbdKey {
		glyph: string;
		text: string;
	}

	/** True on macOS, iOS and iPadOS. False where there is no `navigator` (SSR). */
	function isApple(): boolean {
		if (typeof navigator === 'undefined') return false;
		const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
		const platform = nav.userAgentData?.platform ?? navigator.platform ?? '';
		return /mac|iphone|ipad|ipod/i.test(platform) || /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent ?? '');
	}

	/** Maps a key name ("mod", "shift", "up", "K") to what is drawn and what is spoken. */
	function describeKey(key: string, mac: boolean, labels: Record<string, string> | undefined): KbdKey {
		const name = key.trim();
		const id = name.toLowerCase();
		let glyph = name;
		let text = name;
		switch (id) {
			case 'mod':
				[glyph, text] = mac ? ['⌘', 'Command'] : ['Ctrl', 'Control'];
				break;
			case 'cmd':
			case 'command':
				[glyph, text] = ['⌘', 'Command'];
				break;
			case 'meta':
				[glyph, text] = mac ? ['⌘', 'Command'] : ['Win', 'Windows'];
				break;
			case 'ctrl':
			case 'control':
				[glyph, text] = mac ? ['⌃', 'Control'] : ['Ctrl', 'Control'];
				break;
			case 'alt':
			case 'option':
			case 'opt':
				[glyph, text] = mac ? ['⌥', 'Option'] : ['Alt', 'Alt'];
				break;
			case 'shift':
				[glyph, text] = mac ? ['⇧', 'Shift'] : ['Shift', 'Shift'];
				break;
			case 'enter':
			case 'return':
				[glyph, text] = ['↵', 'Enter'];
				break;
			case 'esc':
			case 'escape':
				[glyph, text] = ['Esc', 'Escape'];
				break;
			case 'backspace':
				[glyph, text] = ['⌫', 'Backspace'];
				break;
			case 'delete':
			case 'del':
				[glyph, text] = ['Del', 'Delete'];
				break;
			case 'up':
			case 'arrowup':
				[glyph, text] = ['↑', 'Up arrow'];
				break;
			case 'down':
			case 'arrowdown':
				[glyph, text] = ['↓', 'Down arrow'];
				break;
			case 'left':
			case 'arrowleft':
				[glyph, text] = ['←', 'Left arrow'];
				break;
			case 'right':
			case 'arrowright':
				[glyph, text] = ['→', 'Right arrow'];
				break;
		}
		const spoken = labels?.[id] ?? labels?.[name];
		return { glyph, text: spoken ?? text };
	}
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		/**
		 * The keys of one shortcut, e.g. `['mod', 'K']`. Names like `mod`, `ctrl`, `alt`, `shift`,
		 * `enter`, `esc`, `up` become symbols with a spoken name; anything else is shown as it is.
		 */
		keys?: string[];
		/** Drawn between the keys. Empty string for none. */
		separator?: string;
		size?: 'sm' | 'md';
		/** `auto` reads the platform in the browser; `mac` and `other` force it (`mod` = ⌘ or Ctrl). */
		platform?: 'auto' | 'mac' | 'other';
		/** Spoken names by key name (lower case), e.g. `{ mod: 'Befehl' }`. */
		labels?: Record<string, string>;
		class?: string;
		/** A single key, used when `keys` is not set. */
		children?: Snippet;
	}
	let { keys, separator = '+', size = 'md', platform = 'auto', labels, class: cls = '', children }: Props = $props();

	/* The platform is read after mount, so server and first client render agree. */
	let detected = $state(false);
	$effect(() => {
		detected = isApple();
	});
	const mac = $derived(platform === 'mac' || (platform === 'auto' && detected));
	const parts = $derived((keys ?? []).filter((k) => k.trim() !== '').map((k) => describeKey(k, mac, labels)));
</script>

<kbd class="k-kbd {cls}" data-size={size}>
	{#if parts.length > 0}
		{#each parts as part, i (i)}
			{#if i > 0 && separator}<span class="sep">{separator}</span>{/if}
			<kbd class="key">{#if part.glyph === part.text}{part.glyph}{:else}<span aria-hidden="true">{part.glyph}</span><span class="sr">{part.text}</span>{/if}</kbd>
		{/each}
	{:else}
		<kbd class="key">{@render children?.()}</kbd>
	{/if}
</kbd>

<style>
	.k-kbd {
		display: inline-flex;
		align-items: center;
		gap: var(--k-space-1);
		vertical-align: baseline;
		font-family: var(--k-font-mono);
		font-size: var(--k-text-sm);
		line-height: 1;
		white-space: nowrap;
	}
	[data-size='sm'] { font-size: var(--k-text-xs); }
	.key {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 2em;
		min-height: 2em;
		padding: 0 0.6em;
		border: var(--k-border-w) solid var(--k-border);
		border-bottom-width: calc(var(--k-border-w) + 2px);
		border-radius: var(--k-radius-badge);
		background: var(--k-bg-raised);
		color: var(--k-fg);
		font: inherit;
		font-variant-emoji: text;
		font-weight: var(--k-weight-label);
		letter-spacing: var(--k-label-tracking);
		text-transform: var(--k-label-transform);
	}
	.sep { color: var(--k-fg-muted); font-family: var(--k-font-sans); }
	.sr {
		position: absolute;
		width: 1px;
		height: 1px;
		margin: -1px;
		padding: 0;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
		border: 0;
	}
</style>
