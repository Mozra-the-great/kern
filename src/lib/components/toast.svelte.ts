export type ToastTone = 'info' | 'ok' | 'warn' | 'danger';

export interface ToastItem {
	id: number;
	message: string;
	title?: string | undefined;
	tone: ToastTone;
	/** Milliseconds; 0 keeps it until dismissed. */
	duration: number;
	action?: { label: string; onclick: () => void } | undefined;
}

export type ToastInput = Partial<Omit<ToastItem, 'id' | 'message'>> & { message: string };

/*
 * The Svelte package (dist/) and the custom-elements bundle each compile their own copy
 * of this module and of the Svelte runtime. So the toasts live in one framework-free store
 * on a well-known global, and every copy mirrors it into its own reactive state. A toast
 * from either copy then shows in every <Toaster /> and <k-toaster> on the page.
 */
interface ToastStore {
	readonly version: 1;
	items: readonly ToastItem[];
	add(input: ToastInput): number;
	dismiss(id: number): void;
	subscribe(fn: (items: readonly ToastItem[]) => void): () => void;
}

const KEY = Symbol.for('kern.toasts');

function createStore(): ToastStore {
	let next = 1;
	const timers = new Map<number, ReturnType<typeof setTimeout>>();
	const listeners = new Set<(items: readonly ToastItem[]) => void>();
	const store: ToastStore = {
		version: 1,
		items: [],
		add(input) {
			const item: ToastItem = { id: next++, tone: 'info', duration: 5000, ...input };
			store.items = [...store.items, item];
			if (item.duration > 0) timers.set(item.id, setTimeout(() => store.dismiss(item.id), item.duration));
			notify();
			return item.id;
		},
		dismiss(id) {
			clearTimeout(timers.get(id));
			timers.delete(id);
			if (!store.items.some((t) => t.id === id)) return;
			store.items = store.items.filter((t) => t.id !== id);
			notify();
		},
		subscribe(fn) {
			listeners.add(fn);
			fn(store.items);
			return () => listeners.delete(fn);
		}
	};
	function notify() {
		for (const fn of [...listeners]) fn(store.items);
	}
	return store;
}

function isStore(v: unknown): v is ToastStore {
	return typeof v === 'object' && v !== null && (v as { version?: unknown }).version === 1;
}

function sharedStore(): ToastStore {
	const g = globalThis as typeof globalThis & { [KEY]?: unknown };
	const existing = g[KEY];
	if (isStore(existing)) return existing;
	const store = createStore();
	// An incompatible store from another kern version stays untouched; this copy then works on its own.
	if (existing === undefined) g[KEY] = store;
	return store;
}

const store = sharedStore();
const mirror = $state<ToastItem[]>([]);
store.subscribe((items) => mirror.splice(0, mirror.length, ...items));

/** Live, read-only list of toasts, read by <Toaster />. Change it with `toast()` and `dismissToast()`. */
export const toasts: readonly ToastItem[] = mirror;

export function dismissToast(id: number) {
	store.dismiss(id);
}

/** Show a toast. Returns its id. `toast('Saved')` or `toast({ message, tone, ... })`. */
export function toast(input: string | ToastInput): number {
	return store.add(typeof input === 'string' ? { message: input } : input);
}

toast.ok = (message: string, o: Partial<ToastInput> = {}) => toast({ ...o, message, tone: 'ok' });
toast.warn = (message: string, o: Partial<ToastInput> = {}) => toast({ ...o, message, tone: 'warn' });
toast.danger = (message: string, o: Partial<ToastInput> = {}) => toast({ ...o, message, tone: 'danger', duration: o.duration ?? 0 });
