<script lang="ts">
	import { untrack } from 'svelte';
	import { strings } from './strings.svelte.js';
	import { pickBySystem, readStoredTheme, themePair, toggleRoles, writeStoredTheme, isDarkTheme, type ThemeOption } from './theme.js';

	interface Props {
		/**
		 * Themes to switch between. Two entries give a toggle button, more give a menu.
		 * Default: the light/dark pair of the family of the current `data-theme`.
		 */
		themes?: readonly ThemeOption[] | undefined;
		/** Id of the active theme (`data-theme` of the target). */
		value?: string | undefined;
		/**
		 * Element whose `data-theme` is switched: an element, or a CSS selector looked up in
		 * the document. Default `document.documentElement`; `null` = none yet (waits).
		 */
		target?: HTMLElement | string | null | undefined;
		/** localStorage key that remembers the user's choice. Pair it with `themeScript`. */
		persist?: string | undefined;
		/** Until the user chooses, follow the system light/dark setting. */
		followSystem?: boolean | undefined;
		/** Accessible name. Default: "Dark mode" (toggle) or "Theme" (menu). */
		label?: string | undefined;
		/** Called when the user picks a theme (not when the system or the page changes it). */
		onchange?: ((id: string) => void) | undefined;
		class?: string | undefined;
	}
	let { themes, value = $bindable(), target, persist, followSystem = false, label, onchange, class: cls = '' }: Props = $props();

	const list = $derived<readonly ThemeOption[]>(themes ?? themePair(value));
	const roles = $derived(toggleRoles(list));
	const pressed = $derived(
		roles !== undefined && value !== undefined && (value === roles.on.id || (value !== roles.off.id && isDarkTheme(value)))
	);

	let el: HTMLElement | undefined = $state();
	let initialised = false;
	let chosen = false;

	function resolveTarget(t: HTMLElement | string | null | undefined): HTMLElement | undefined {
		if (typeof document === 'undefined' || t === null) return undefined;
		if (t === undefined) return document.documentElement;
		if (typeof t === 'string') return document.querySelector<HTMLElement>(t) ?? undefined;
		return t;
	}
	function systemDark(): boolean | undefined {
		return typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: dark)').matches : undefined;
	}

	/** Picks the starting theme: stored choice, then the `value` prop, then the system, then the page. */
	function init(node: HTMLElement): void {
		const attr = node.getAttribute('data-theme') ?? undefined;
		const options = themes ?? themePair(value ?? attr);
		const stored = persist ? readStoredTheme(persist) : null;
		let next: string | undefined;
		if (stored !== null && options.some((t) => t.id === stored)) {
			next = stored;
			chosen = true;
		} else if (!initialised && value) {
			next = value;
			chosen = true;
		} else {
			const dark = followSystem && !chosen ? systemDark() : undefined;
			next = (dark === undefined ? undefined : pickBySystem(options, dark)?.id) ?? attr ?? value;
		}
		initialised = true;
		value = next;
	}

	function choose(id: string): void {
		value = id;
		chosen = true;
		if (persist) writeStoredTheme(persist, id);
		onchange?.(id);
	}

	$effect(() => {
		el = resolveTarget(target);
	});
	// Start up per target, and follow changes that other code makes to its data-theme.
	$effect(() => {
		const node = el;
		if (!node) return;
		untrack(() => init(node));
		const observer = new MutationObserver(() => {
			const current = node.getAttribute('data-theme');
			if (current && current !== value) value = current;
		});
		observer.observe(node, { attributes: true, attributeFilter: ['data-theme'] });
		return () => observer.disconnect();
	});
	$effect(() => {
		if (el && value && el.getAttribute('data-theme') !== value) el.setAttribute('data-theme', value);
	});
	$effect(() => {
		if (!followSystem || typeof matchMedia !== 'function') return;
		const query = matchMedia('(prefers-color-scheme: dark)');
		const onSystemChange = (): void => {
			if (chosen) return;
			const next = pickBySystem(list, query.matches);
			if (next) value = next.id;
		};
		query.addEventListener('change', onSystemChange);
		return () => query.removeEventListener('change', onSystemChange);
	});
</script>

{#if list.length > 2}
	<div class="k-theme-toggle menu {cls}">
		<svg class="lead" viewBox="0 0 20 20" aria-hidden="true">
			<path
				d="M10 2.5a7.5 7.5 0 1 0 0 15c1.2 0 1.8-.8 1.8-1.7 0-1.3-1.1-1.5-1.1-2.6 0-.9.7-1.5 1.6-1.5h1.8a3.4 3.4 0 0 0 3.4-3.4C17.5 5.5 14.1 2.5 10 2.5Z"
				fill="none"
				stroke="currentColor"
				stroke-width="1.6"
				stroke-linejoin="round"
			/>
			<circle cx="6.3" cy="9.2" r="1" fill="currentColor" />
			<circle cx="8.6" cy="5.9" r="1" fill="currentColor" />
			<circle cx="12.4" cy="5.9" r="1" fill="currentColor" />
		</svg>
		<select aria-label={label ?? strings().themeToggle.menuLabel} value={value ?? ''} onchange={(e) => choose(e.currentTarget.value)}>
			{#each list as t (t.id)}<option value={t.id}>{t.label}</option>{/each}
		</select>
		<svg class="chevron" viewBox="0 0 16 16" aria-hidden="true">
			<path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" stroke-width="2" />
		</svg>
	</div>
{:else if roles}
	<button
		type="button"
		class="k-theme-toggle switch {cls}"
		aria-pressed={pressed}
		aria-label={label ?? strings().themeToggle.toggleLabel}
		onclick={() => choose(pressed ? roles.off.id : roles.on.id)}
	>
		<span class="seg" class:on={!pressed}>
			<svg viewBox="0 0 20 20" aria-hidden="true">
				<circle cx="10" cy="10" r="3.6" fill="none" stroke="currentColor" stroke-width="1.8" />
				<path
					d="M10 2.2v2M10 15.8v2M2.2 10h2M15.8 10h2M4.5 4.5l1.4 1.4M14.1 14.1l1.4 1.4M4.5 15.5l1.4-1.4M14.1 5.9l1.4-1.4"
					stroke="currentColor"
					stroke-width="1.8"
					stroke-linecap="round"
				/>
			</svg>
		</span>
		<span class="seg" class:on={pressed}>
			<svg viewBox="0 0 20 20" aria-hidden="true">
				<path
					d="M16.5 11.6A6.8 6.8 0 0 1 8.4 3.5a6.8 6.8 0 1 0 8.1 8.1Z"
					fill="none"
					stroke="currentColor"
					stroke-width="1.8"
					stroke-linejoin="round"
				/>
			</svg>
		</span>
	</button>
{/if}

<style>
	/* Two-state: a track with a sun and a moon, the active one raised and filled. */
	.switch {
		display: inline-flex;
		flex: none;
		gap: 2px;
		box-sizing: border-box;
		margin: 0;
		padding: 3px;
		border: var(--k-border-w) solid var(--k-border);
		border-radius: var(--k-radius-control);
		background: var(--k-bg-sunken);
		color: var(--k-fg-muted);
		font: inherit;
		cursor: pointer;
		-webkit-tap-highlight-color: transparent;
	}
	.switch:hover {
		border-color: var(--k-fg-muted);
	}
	.switch:focus-visible {
		outline: var(--k-focus-w) solid var(--k-focus);
		outline-offset: var(--k-focus-offset);
	}
	.seg {
		display: grid;
		place-items: center;
		box-sizing: border-box;
		width: max(40px, var(--k-tap-target), calc(var(--k-control-h) - 12px));
		height: max(36px, var(--k-tap-target), calc(var(--k-control-h) - 12px));
		border-radius: var(--k-radius-control);
		transition:
			background-color var(--k-dur) var(--k-ease),
			color var(--k-dur) var(--k-ease);
	}
	.seg.on {
		background: var(--k-primary);
		color: var(--k-on-primary);
		box-shadow: var(--k-shadow-raised);
	}
	.seg svg {
		width: 20px;
		height: 20px;
	}

	/* Menu: a native select, so the list works with every input method. */
	.menu {
		position: relative;
		display: inline-flex;
		align-items: center;
		max-width: 100%;
	}
	select {
		appearance: none;
		box-sizing: border-box;
		max-width: 100%;
		min-height: max(44px, var(--k-control-h));
		padding: 0 calc(var(--k-space-4) + 24px) 0 calc(var(--k-space-4) + 28px);
		border: var(--k-border-w) solid var(--k-border);
		border-radius: var(--k-radius-control);
		background: var(--k-bg-raised);
		color: var(--k-fg);
		font-family: var(--k-label-font);
		font-size: var(--k-label-size);
		font-weight: var(--k-weight-label);
		text-transform: var(--k-label-transform);
		letter-spacing: var(--k-label-tracking);
		cursor: pointer;
	}
	select:hover {
		border-color: var(--k-fg-muted);
	}
	select:focus-visible {
		outline: var(--k-focus-w) solid var(--k-focus);
		outline-offset: var(--k-focus-offset);
	}
	.menu svg {
		position: absolute;
		top: 50%;
		width: 18px;
		height: 18px;
		transform: translateY(-50%);
		pointer-events: none;
		color: var(--k-fg-muted);
	}
	.lead {
		inset-inline-start: var(--k-space-4);
	}
	.menu .chevron {
		inset-inline-end: var(--k-space-4);
		width: 16px;
		height: 16px;
	}

	@media (prefers-reduced-motion: reduce) {
		.seg {
			transition: none;
		}
	}
	@media (forced-colors: active) {
		.seg.on {
			forced-color-adjust: none;
			background: Highlight;
			color: HighlightText;
			box-shadow: none;
		}
		.seg svg {
			color: inherit;
		}
		.menu svg {
			color: CanvasText;
		}
		select:focus-visible {
			outline-color: Highlight;
		}
	}
</style>
