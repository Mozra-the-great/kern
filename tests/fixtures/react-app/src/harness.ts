/*
 * Test harness of the React 19 app (#35). Everything the Playwright specs read from the page lives on
 * `window.harness`: the kern events seen on the document, what the React handlers received, commit
 * counters, element refs, the listeners on window/document and the mount/unmount switches.
 *
 * Imported first by main.tsx, so the listener tracking is in place before kern or React register anything.
 */
import { useEffect } from 'react';
import type { ComponentType } from 'react';

/** Kern events that bubble to the document; recorded for every `<k-*>` target. */
const KERN_EVENTS = [
	'change',
	'input',
	'select',
	'sort',
	'toggle',
	'close',
	'cancel',
	'files',
	'reject',
	'move',
	'remove',
	'navigate',
	'dismiss',
	'undo',
	'action',
	'step',
	'complete',
	'copy',
	'copy-error'
] as const;

/** A kern event as it reached the document. */
export interface SeenEvent {
	tag: string;
	id: string;
	type: string;
	detail: unknown;
	/** True for native events (a real keystroke's `input`); kern's own events are never trusted. */
	trusted: boolean;
}
/** What a React `on<event>` handler received. */
export interface HandledEvent {
	source: string;
	type: string;
	detail: unknown;
}
export interface Harness {
	events: SeenEvent[];
	handled: HandledEvent[];
	/** Commits per scenario (a `useEffect` without dependencies; StrictMode counts the first mount twice). */
	commits: Record<string, number>;
	/** FormData of every submit, as `[name, value][]`. */
	submissions: [string, string][][];
	/** Values of `onreset` and other plain facts the scenarios want to publish. */
	facts: Record<string, unknown>;
	/** Element refs by name; `null` after the element was detached. */
	refs: Record<string, HTMLElement | null>;
	/** How often each ref callback ran with an element / with null (StrictMode runs it twice on mount). */
	refCalls: Record<string, { attach: number; detach: number }>;
	/** Sorted `type@target` of every listener currently registered on window, document, <html> and <body>. */
	listeners(): string[];
	mount(scenario: string, rootId?: string): void;
	unmount(rootId: string): void;
	/** Loads the kern elements (for `?late`: after React already rendered unknown tags). */
	define(): Promise<void>;
	/** Clears the event logs. */
	reset(): void;
	scenarios: readonly string[];
}

declare global {
	interface Window {
		harness: Harness;
		errors: string[];
	}
}

/** A copy of an event detail that survives `page.evaluate`: files become `{ name, size, type }`. */
export function plain(value: unknown): unknown {
	if (value instanceof File) return { name: value.name, size: value.size, type: value.type };
	if (Array.isArray(value)) return value.map(plain);
	if (value !== null && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, plain(v)]));
	return value;
}

// ── Listener tracking ────────────────────────────────────────────────────────────────────────
const tracked = new Map<EventTarget, Map<string, number>>();
const ids = new WeakMap<object, number>();
let nextId = 1;
const idOf = (fn: object): number => {
	let id = ids.get(fn);
	if (id === undefined) ids.set(fn, (id = nextId++));
	return id;
};
const watching = (target: EventTarget): boolean =>
	target === window || target === document || target === document.documentElement || target === document.body;
const targetName = (target: EventTarget): string =>
	target === window ? 'window' : target === document ? 'document' : target === document.documentElement ? 'html' : 'body';
function listenerKey(
	type: string,
	listener: EventListenerOrEventListenerObject | null,
	options?: boolean | AddEventListenerOptions | EventListenerOptions
): string | null {
	if (!listener) return null;
	const capture = typeof options === 'boolean' ? options : !!options?.capture;
	if (typeof options === 'object' && 'once' in options && (options.once || options.signal)) return null;
	return `${type}${capture ? ':capture' : ''}#${idOf(listener)}`;
}
const originalAdd = EventTarget.prototype.addEventListener;
const originalRemove = EventTarget.prototype.removeEventListener;
EventTarget.prototype.addEventListener = function (
	this: EventTarget,
	type: string,
	listener: EventListenerOrEventListenerObject | null,
	options?: boolean | AddEventListenerOptions
) {
	if (watching(this)) {
		const key = listenerKey(type, listener, options);
		if (key) {
			const map = tracked.get(this) ?? new Map<string, number>();
			map.set(key, 1);
			tracked.set(this, map);
		}
	}
	originalAdd.call(this, type, listener, options);
};
EventTarget.prototype.removeEventListener = function (
	this: EventTarget,
	type: string,
	listener: EventListenerOrEventListenerObject | null,
	options?: boolean | EventListenerOptions
) {
	if (watching(this)) {
		const key = listenerKey(type, listener, options);
		if (key) tracked.get(this)?.delete(key);
	}
	originalRemove.call(this, type, listener, options);
};
function listeners(): string[] {
	const out: string[] = [];
	for (const [target, map] of tracked) {
		for (const key of map.keys()) {
			const type = key.slice(0, key.indexOf('#'));
			// React adds one `selectionchange` listener per document the first time it renders and keeps it.
			if (type === 'selectionchange') continue;
			out.push(`${type}@${targetName(target)}`);
		}
	}
	return out.sort();
}

// ── Harness ──────────────────────────────────────────────────────────────────────────────────
const roots = new Map<string, { unmount(): void }>();

export const harness: Harness = {
	events: [],
	handled: [],
	commits: {},
	submissions: [],
	facts: {},
	refs: {},
	refCalls: {},
	listeners,
	mount: () => undefined,
	unmount: () => undefined,
	define: () => Promise.resolve(),
	reset() {
		harness.events.length = 0;
		harness.handled.length = 0;
	},
	scenarios: []
};
window.harness = harness;
window.errors = [];
window.addEventListener('error', (e) => window.errors.push(e.message));
window.addEventListener('unhandledrejection', (e) => window.errors.push(String(e.reason)));

for (const type of KERN_EVENTS) {
	document.addEventListener(
		type,
		(e) => {
			const target = e.target;
			if (!(target instanceof Element) || !target.tagName.startsWith('K-')) return;
			harness.events.push({
				tag: target.tagName.toLowerCase(),
				id: target.id,
				type,
				detail: plain(e instanceof CustomEvent ? e.detail : undefined),
				trusted: e.isTrusted
			});
		},
		true
	);
}

/** Records what an `on<event>` prop of React received. */
export function handled(source: string, type: string, detail?: unknown): void {
	harness.handled.push({ source, type, detail: plain(detail) });
}

/** A commit counter for one scenario: runs after every commit of the component that calls it. */
export function useCommits(name: string): void {
	useEffect(() => {
		harness.commits[name] = (harness.commits[name] ?? 0) + 1;
	});
}

const trackers = new Map<string, (el: HTMLElement | null) => () => void>();

/**
 * Callback ref that publishes the element as `harness.refs[name]` and counts attaches and detaches. The
 * function is the same on every call for a name: a new ref callback per render would be detached and
 * attached again by React on every commit.
 */
export function track<E extends HTMLElement>(name: string): (el: E | null) => () => void {
	const known = trackers.get(name);
	if (known) return known;
	const callback = (el: HTMLElement | null): (() => void) => {
		const calls = (harness.refCalls[name] ??= { attach: 0, detach: 0 });
		if (el) {
			calls.attach++;
			harness.refs[name] = el;
		}
		// React 19 runs the returned cleanup instead of calling the ref with null.
		return () => {
			calls.detach++;
			harness.refs[name] = null;
		};
	};
	trackers.set(name, callback);
	return callback;
}

/** Wires the scenarios to `mount`/`unmount`; called once by main.tsx. */
export function install(
	scenarios: Record<string, ComponentType<{ rid: string }>>,
	render: (container: HTMLElement, Scenario: ComponentType<{ rid: string }>, rid: string) => { unmount(): void }
): void {
	(harness as { scenarios: readonly string[] }).scenarios = Object.keys(scenarios);
	harness.mount = (scenario, rootId = scenario) => {
		const Scenario = scenarios[scenario];
		if (!Scenario) throw new Error(`unknown scenario ${scenario}`);
		if (roots.has(rootId)) throw new Error(`root ${rootId} is mounted`);
		const container = document.createElement('section');
		container.id = `root-${rootId}`;
		document.getElementById('app')?.append(container);
		roots.set(rootId, render(container, Scenario, rootId));
	};
	harness.unmount = (rootId) => {
		roots.get(rootId)?.unmount();
		roots.delete(rootId);
		document.getElementById(`root-${rootId}`)?.remove();
	};
}
