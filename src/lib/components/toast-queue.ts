/*
 * Framework-free toast queue: timers that pause while a toast is hovered or focused (WCAG 2.2.1),
 * per-tone default durations, a limit on open toasts, and close callbacks that run exactly once
 * with the reason (undo vs. commit, nagellacke's Snackbar contract). `toast.svelte.ts` mirrors the
 * shared queue into Svelte state; <Toaster queue={…}> renders an isolated one.
 */

export type ToastTone = 'info' | 'ok' | 'warn' | 'danger';

/**
 * Why a toast closed. `timeout`: its time ran out; `dismiss`: the dismiss button or `dismiss(id)`;
 * `action`: its action button; `undo`: its undo button; `replaced`: a newer toast took its place
 * (same `key`, or the oldest one above the limit); `cleared`: `clear()`.
 */
export type ToastCloseReason = 'timeout' | 'dismiss' | 'action' | 'undo' | 'replaced' | 'cleared';

export interface ToastItem {
	id: number;
	message: string;
	title?: string | undefined;
	tone: ToastTone;
	/** Milliseconds; 0 keeps it until dismissed. */
	duration: number;
	action?: { label: string; onclick: () => void } | undefined;
	/** A new toast with the same key replaces this one (reason `replaced`). */
	key?: string | undefined;
	/** Shows an undo button (label: the Toaster's `undoLabel`); runs when it is pressed. */
	onundo?: (() => void) | undefined;
	/** Runs once when the toast closes for any reason except undo: the place to commit a deletion. */
	oncommit?: (() => void) | undefined;
	/** Runs once when the toast closes, with the reason. */
	onclose?: ((reason: ToastCloseReason) => void) | undefined;
}

export interface ToastInput {
	message: string;
	title?: string | undefined;
	/** Default `info`. */
	tone?: ToastTone | undefined;
	/** Milliseconds; 0 keeps it until dismissed. Default per tone: info/ok 6000, warn 10000, danger 0. */
	duration?: number | undefined;
	action?: ToastItem['action'];
	key?: ToastItem['key'];
	onundo?: ToastItem['onundo'];
	oncommit?: ToastItem['oncommit'];
	onclose?: ToastItem['onclose'];
}

/** Default durations; danger (errors) stays until dismissed: no time limit on what has to be read and acted on. */
export const TOAST_DURATIONS: Readonly<Record<ToastTone, number>> = { info: 6000, ok: 6000, warn: 10_000, danger: 0 };

/** Default limit of open toasts; the oldest closes (reason `replaced`) when a toast goes over it. */
export const TOAST_MAX = 5;

export interface ToastQueue {
	/** Shape version of the shared queue (see `sharedToastQueue`). */
	readonly version: 2;
	/** Open toasts, oldest first. */
	readonly items: readonly ToastItem[];
	/** Most toasts open at once (default 5, `Infinity` for no limit); lowering it closes the oldest. */
	max: number;
	/** Shows a toast and returns its id. */
	add(input: string | ToastInput): number;
	/** Closes a toast with reason `dismiss`. Unknown ids are ignored. */
	dismiss(id: number): void;
	/** Runs the toast's `onundo` and closes it with reason `undo` (no `oncommit`). */
	undo(id: number): void;
	/** Runs the toast's action and closes it with reason `action`. */
	runAction(id: number): void;
	/** Closes every toast with reason `cleared`. */
	clear(): void;
	/** Stops the countdown (hover, focus, hidden tab). Pauses nest: each `pause` needs a `resume`. */
	pause(id: number): void;
	/** Continues the countdown with the time that was left once every pause is resumed. */
	resume(id: number): void;
	/** Calls `fn` now and after every change. Returns the unsubscribe function. */
	subscribe(fn: (items: readonly ToastItem[]) => void): () => void;
}

const TONES: readonly ToastTone[] = ['info', 'ok', 'warn', 'danger'];

interface Timer {
	handle: ReturnType<typeof setTimeout> | undefined;
	remaining: number;
	startedAt: number;
	holds: number;
}

/** Reports an error from a consumer callback without breaking the queue or the other callbacks. */
function report(error: unknown): void {
	if (typeof reportError === 'function') reportError(error);
	else console.error(error);
}

function call(fn: () => void): void {
	try {
		fn();
	} catch (error) {
		report(error);
	}
}

function duration(value: unknown, tone: ToastTone): number {
	if (typeof value !== 'number' || Number.isNaN(value)) return TOAST_DURATIONS[tone];
	if (value === Infinity || value <= 0) return 0;
	return value;
}

/** A new, independent toast queue, e.g. for an isolated <Toaster queue={…}> or for tests. */
export function createToastQueue(options: { max?: number | undefined } = {}): ToastQueue {
	let next = 1;
	let items: readonly ToastItem[] = [];
	let max = validMax(options.max) ?? TOAST_MAX;
	const timers = new Map<number, Timer>();
	const listeners = new Set<(items: readonly ToastItem[]) => void>();

	function validMax(value: unknown): number | undefined {
		return typeof value === 'number' && value >= 1 ? Math.floor(value) : undefined;
	}

	function start(id: number, timer: Timer): void {
		timer.startedAt = Date.now();
		timer.handle = setTimeout(() => {
			timer.handle = undefined;
			close([[id, 'timeout']]);
		}, timer.remaining);
	}

	/** Removes the toasts, notifies once, then runs their callbacks (state is consistent by then). */
	function close(list: readonly (readonly [number, ToastCloseReason])[], before?: () => void): void {
		const closed: [ToastItem, ToastCloseReason][] = [];
		for (const [id, reason] of list) {
			const item = items.find((t) => t.id === id);
			if (!item) continue;
			const timer = timers.get(id);
			if (timer?.handle !== undefined) clearTimeout(timer.handle);
			timers.delete(id);
			items = items.filter((t) => t.id !== id);
			closed.push([item, reason]);
		}
		if (closed.length === 0) return;
		before?.();
		notify();
		for (const [item, reason] of closed) {
			const { onundo, oncommit, onclose, action } = item;
			if (reason === 'undo') {
				if (onundo) call(onundo);
			} else {
				if (reason === 'action' && action) call(action.onclick);
				if (oncommit) call(oncommit);
			}
			if (onclose) call(() => onclose(reason));
		}
	}

	function overflow(): [number, ToastCloseReason][] {
		return items.slice(0, Math.max(0, items.length - max)).map((t) => [t.id, 'replaced']);
	}

	function notify(): void {
		for (const fn of [...listeners]) call(() => fn(items));
	}

	const queue: ToastQueue = {
		version: 2,
		get items() {
			return items;
		},
		get max() {
			return max;
		},
		set max(value: number) {
			const valid = validMax(value);
			if (valid === undefined) return;
			max = valid;
			close(overflow());
		},
		add(input) {
			const o: ToastInput = typeof input === 'string' ? { message: input } : input;
			const tone: ToastTone = TONES.includes(o.tone as ToastTone) ? (o.tone as ToastTone) : 'info';
			const item: ToastItem = { id: next++, message: o.message, tone, duration: duration(o.duration, tone) };
			if (o.title !== undefined) item.title = o.title;
			if (o.action !== undefined) item.action = o.action;
			if (o.key !== undefined) item.key = o.key;
			if (o.onundo !== undefined) item.onundo = o.onundo;
			if (o.oncommit !== undefined) item.oncommit = o.oncommit;
			if (o.onclose !== undefined) item.onclose = o.onclose;
			// The toasts it replaces commit first (nagellacke: the outgoing snackbar commits on replace).
			const replaced: [number, ToastCloseReason][] =
				item.key === undefined ? [] : items.filter((t) => t.key === item.key).map((t) => [t.id, 'replaced']);
			let added = false;
			const insert = () => {
				items = [...items, item];
				added = true;
				if (item.duration > 0) {
					const timer: Timer = { handle: undefined, remaining: item.duration, startedAt: 0, holds: 0 };
					timers.set(item.id, timer);
					start(item.id, timer);
				}
			};
			const extra = Math.max(0, items.length - replaced.length + 1 - max);
			const oldest = items
				.filter((t) => !replaced.some(([id]) => id === t.id))
				.slice(0, extra)
				.map((t): [number, ToastCloseReason] => [t.id, 'replaced']);
			close([...replaced, ...oldest], insert);
			if (!added) {
				insert();
				notify();
			}
			return item.id;
		},
		dismiss(id) {
			close([[id, 'dismiss']]);
		},
		undo(id) {
			close([[id, 'undo']]);
		},
		runAction(id) {
			close([[id, 'action']]);
		},
		clear() {
			close(items.map((t) => [t.id, 'cleared']));
		},
		pause(id) {
			const timer = timers.get(id);
			if (!timer) return;
			timer.holds++;
			if (timer.holds === 1 && timer.handle !== undefined) {
				clearTimeout(timer.handle);
				timer.handle = undefined;
				timer.remaining = Math.max(0, timer.remaining - (Date.now() - timer.startedAt));
			}
		},
		resume(id) {
			const timer = timers.get(id);
			if (!timer || timer.holds === 0) return;
			timer.holds--;
			if (timer.holds === 0 && timer.handle === undefined) start(id, timer);
		},
		subscribe(fn) {
			listeners.add(fn);
			fn(items);
			return () => {
				listeners.delete(fn);
			};
		}
	};
	return queue;
}

function isQueue(v: unknown): v is ToastQueue {
	return typeof v === 'object' && v !== null && (v as { version?: unknown }).version === 2;
}

const KEY = Symbol.for('kern.toasts');
let own: ToastQueue | undefined;

/**
 * The page-wide queue behind `toast()`, <Toaster /> and <k-toaster>. The Svelte package (dist/) and
 * the custom-elements bundle each compile their own copy of this module, so the queue lives on a
 * well-known global and every copy uses the same one. A queue of another shape (an older kern copy)
 * stays untouched; this copy then keeps its own.
 */
export function sharedToastQueue(): ToastQueue {
	if (own) return own;
	const g = globalThis as typeof globalThis & { [KEY]?: unknown };
	const existing = g[KEY];
	if (isQueue(existing)) return (own = existing);
	own = createToastQueue();
	if (existing === undefined) g[KEY] = own;
	return own;
}
