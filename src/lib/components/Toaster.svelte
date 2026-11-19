<script lang="ts">
	import { toasts, dismissToast } from './toast.svelte.js';

	interface Props {
		position?: 'bottom-right' | 'bottom-center' | 'top-right' | 'top-center';
		dismissLabel?: string;
		/** Accessible name of the notification region. */
		label?: string;
	}
	let { position = 'bottom-right', dismissLabel = 'Dismiss', label = 'Notifications' }: Props = $props();
</script>

<section class="k-toaster" data-pos={position} aria-label={label}>
	<ol>
		{#each toasts as t (t.id)}
			<li class="toast" data-tone={t.tone} role={t.tone === 'danger' ? 'alert' : 'status'}>
				<span class="dot" aria-hidden="true"></span>
				<div class="content">
					{#if t.title}<p class="title">{t.title}</p>{/if}
					<p class="msg">{t.message}</p>
				</div>
				{#if t.action}
					<button type="button" class="act" onclick={() => { t.action?.onclick(); dismissToast(t.id); }}>{t.action.label}</button>
				{/if}
				<button type="button" class="x" aria-label={dismissLabel} onclick={() => dismissToast(t.id)}>
					<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="2" /></svg>
				</button>
			</li>
		{/each}
	</ol>
</section>

<style>
	.k-toaster { position: fixed; z-index: 1000; pointer-events: none; padding: var(--k-space-4); width: min(400px, 100vw); box-sizing: border-box; }
	[data-pos='bottom-right'] { right: 0; bottom: 0; }
	[data-pos='top-right'] { right: 0; top: 0; }
	[data-pos='bottom-center'] { left: 50%; bottom: 0; transform: translateX(-50%); }
	[data-pos='top-center'] { left: 50%; top: 0; transform: translateX(-50%); }
	ol { display: flex; flex-direction: column; gap: var(--k-space-2); margin: 0; padding: 0; list-style: none; }
	[data-pos^='bottom'] ol { flex-direction: column-reverse; }
	.toast {
		--c: var(--k-info);
		pointer-events: auto;
		display: flex;
		gap: var(--k-space-3);
		align-items: flex-start;
		padding: var(--k-space-3) var(--k-space-3) var(--k-space-3) var(--k-space-4);
		border: var(--k-border-w) solid var(--k-line-strong);
		border-radius: var(--k-radius-overlay);
		background: var(--k-bg-raised);
		color: var(--k-fg);
		box-shadow: var(--k-shadow-sm);
		animation: k-in var(--k-dur) var(--k-ease);
	}
	[data-tone='ok'] { --c: var(--k-ok); }
	[data-tone='warn'] { --c: var(--k-warn); background: var(--k-surface-warn); }
	[data-tone='danger'] { --c: var(--k-danger); border-color: var(--k-danger); background: var(--k-surface-danger); }
	.dot { flex: none; width: 10px; height: 10px; margin-top: 7px; border-radius: var(--k-radius-badge); background: var(--c); }
	.content { flex: 1; min-width: 0; padding-top: 2px; }
	.title { margin: 0; font-weight: var(--k-weight-heading); }
	.msg { margin: 0; font-size: var(--k-text-sm); }
	.act { position: relative; flex: none; min-height: 32px; padding: 0 var(--k-space-3); border: var(--k-border-w) solid var(--k-border); border-radius: var(--k-radius-control); background: transparent; color: var(--k-fg); font: inherit; font-size: var(--k-text-sm); font-weight: var(--k-weight-label); cursor: pointer; }
	.act:hover { background: var(--k-bg-sunken); }
	.x { position: relative; flex: none; display: grid; place-items: center; width: 32px; height: 32px; padding: 0; border: 0; border-radius: var(--k-radius-control); background: transparent; color: var(--k-fg-muted); cursor: pointer; }
	.x:hover { color: var(--k-fg); background: var(--k-bg-sunken); }
	.act::after, .x::after { content: ''; position: absolute; inset: min(0px, calc((100% - var(--k-tap-target)) / 2)); }
	.x svg { width: 14px; height: 14px; }
	button:focus-visible { outline: var(--k-focus-w) solid var(--k-focus); outline-offset: 0; }
	@keyframes k-in { from { opacity: 0; transform: translateY(8px); } }
</style>
