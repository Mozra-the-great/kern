export type ToastTone = 'info' | 'ok' | 'warn' | 'danger';

export interface ToastItem {
	id: number;
	message: string;
	title?: string;
	tone: ToastTone;
	/** Milliseconds; 0 keeps it until dismissed. */
	duration: number;
	action?: { label: string; onclick: () => void };
}

export type ToastInput = Partial<Omit<ToastItem, 'id' | 'message'>> & { message: string };

let next = 1;
const timers = new Map<number, ReturnType<typeof setTimeout>>();

/** Live list of toasts, read by <Toaster />. */
export const toasts = $state<ToastItem[]>([]);

export function dismissToast(id: number) {
	const i = toasts.findIndex((t) => t.id === id);
	if (i >= 0) toasts.splice(i, 1);
	clearTimeout(timers.get(id));
	timers.delete(id);
}

/** Show a toast. Returns its id. `toast('Saved')` or `toast({ message, tone, ... })`. */
export function toast(input: string | ToastInput): number {
	const t: ToastInput = typeof input === 'string' ? { message: input } : input;
	const item: ToastItem = { id: next++, tone: 'info', duration: 5000, ...t };
	toasts.push(item);
	if (item.duration > 0) timers.set(item.id, setTimeout(() => dismissToast(item.id), item.duration));
	return item.id;
}

toast.ok = (message: string, o: Partial<ToastInput> = {}) => toast({ ...o, message, tone: 'ok' });
toast.warn = (message: string, o: Partial<ToastInput> = {}) => toast({ ...o, message, tone: 'warn' });
toast.danger = (message: string, o: Partial<ToastInput> = {}) => toast({ ...o, message, tone: 'danger', duration: o.duration ?? 0 });
