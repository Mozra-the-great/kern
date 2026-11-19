import { sharedToastQueue, type ToastInput, type ToastItem } from './toast-queue.js';

export type { ToastCloseReason, ToastInput, ToastItem, ToastQueue, ToastTone } from './toast-queue.js';
export { createToastQueue, sharedToastQueue, TOAST_DURATIONS, TOAST_MAX } from './toast-queue.js';

/*
 * The toasts live in one framework-free queue on a well-known global (see `sharedToastQueue`),
 * and every copy of this module mirrors it into its own reactive state. A toast from either copy
 * then shows in every <Toaster /> and <k-toaster> on the page.
 */
const queue = sharedToastQueue();
const mirror = $state<ToastItem[]>([]);
queue.subscribe((items) => mirror.splice(0, mirror.length, ...items));

/** Live, read-only list of toasts. Change it with `toast()` and `dismissToast()`. */
export const toasts: readonly ToastItem[] = mirror;

/** Closes a toast with reason `dismiss` (runs its `oncommit` and `onclose`). */
export function dismissToast(id: number) {
	queue.dismiss(id);
}

/**
 * `input` without the keys whose value is `undefined`, so they keep the queue's defaults
 * (`exactOptionalPropertyTypes` consumers pass `{ duration: undefined }`).
 */
function definedOnly(input: ToastInput): ToastInput {
	const out = { ...input };
	for (const key of Object.keys(out)) {
		if (out[key as keyof ToastInput] === undefined) Reflect.deleteProperty(out, key);
	}
	return out;
}

/** Show a toast. Returns its id. `toast('Saved')` or `toast({ message, tone, ... })`. */
export function toast(input: string | ToastInput): number {
	return queue.add(typeof input === 'string' ? { message: input } : definedOnly(input));
}

toast.ok = (message: string, o: Partial<ToastInput> = {}) => toast({ ...o, message, tone: 'ok' });
toast.warn = (message: string, o: Partial<ToastInput> = {}) => toast({ ...o, message, tone: 'warn' });
toast.danger = (message: string, o: Partial<ToastInput> = {}) => toast({ ...o, message, tone: 'danger' });
/** Closes every toast with reason `cleared` (each runs its `oncommit` and `onclose`). */
toast.clear = (): void => {
	queue.clear();
};
