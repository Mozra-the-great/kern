<svelte:options
	customElement={{
		props: {
			position: { type: 'String' },
			dismissLabel: { type: 'String', attribute: 'dismiss-label' },
			undoLabel: { type: 'String', attribute: 'undo-label' },
			label: { type: 'String' },
			max: { type: 'Number' }
		}
	}}
/>

<script lang="ts">
	/**
	 * Renders the page-wide toasts of `window.kern.toast()`. Callbacks such as `oncommit` belong
	 * in the toast options; the events report what the user pressed in this toaster.
	 * @prop position {'bottom-right' | 'bottom-left' | 'bottom-center' | 'top-right' | 'top-left' | 'top-center'}
	 * @prop max {number} Most toasts open at once (default 5); sets the limit of the page-wide queue.
	 * @event dismiss {ToastEventDetail} The user pressed a toast's dismiss button.
	 * @event undo {ToastEventDetail} The user pressed a toast's undo button.
	 * @event action {ToastEventDetail} The user pressed a toast's action button.
	 */
	import Toaster from '../lib/components/Toaster.svelte';
	import type { ToastItem } from '../lib/components/toast-queue.js';
	import { emit } from './form.js';
	let { position, dismissLabel, undoLabel, label, max } = $props();
	const host = $host();
	const detail = (t: ToastItem) => ({ id: t.id, key: t.key });
</script>

<Toaster
	position={position ?? undefined}
	dismissLabel={dismissLabel ?? undefined}
	undoLabel={undoLabel ?? undefined}
	label={label ?? undefined}
	max={max ?? undefined}
	ondismiss={(t) => emit(host, 'dismiss', detail(t))}
	onundo={(t) => emit(host, 'undo', detail(t))}
	onaction={(t) => emit(host, 'action', detail(t))}
/>
