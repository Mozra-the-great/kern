/**
 * jsdom setup for the DOM component tests (tests/dom). jsdom implements the DOM, not the platform
 * around it, so the few browser APIs the components rely on get a small, faithful stand-in here.
 * Rendering that needs real layout (overlay position, scroll, touch targets) stays in the Playwright
 * suites (tests/elements, tests/targets).
 */
import { configure } from '@testing-library/dom';
import { afterEach } from 'vitest';

/** The elements a modal dialog can focus first: what a browser looks for after `autofocus`. */
const FOCUSABLE =
	'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const modals: HTMLDialogElement[] = [];

/**
 * `<dialog>`: jsdom has no showModal()/close(). The stand-in opens it, moves focus into it like a
 * browser does, fires `close` (only when it was open) and lets Escape raise the cancelable `cancel`
 * event that closes a modal dialog unless the page prevents it.
 */
function installDialog(): void {
	const proto = HTMLDialogElement.prototype;
	Object.defineProperty(proto, 'show', {
		configurable: true,
		writable: true,
		value(this: HTMLDialogElement): void {
			this.setAttribute('open', '');
		}
	});
	Object.defineProperty(proto, 'showModal', {
		configurable: true,
		writable: true,
		value(this: HTMLDialogElement): void {
			if (this.hasAttribute('open')) throw new DOMException('The dialog is already open.', 'InvalidStateError');
			this.setAttribute('open', '');
			modals.push(this);
			const target = this.querySelector<HTMLElement>('[autofocus]') ?? this.querySelector<HTMLElement>(FOCUSABLE);
			target?.focus();
		}
	});
	Object.defineProperty(proto, 'close', {
		configurable: true,
		writable: true,
		value(this: HTMLDialogElement, returnValue?: string): void {
			if (!this.hasAttribute('open')) return;
			this.removeAttribute('open');
			if (returnValue !== undefined) this.returnValue = returnValue;
			const at = modals.indexOf(this);
			if (at >= 0) modals.splice(at, 1);
			// Like the platform, the event is queued: it arrives after the code that called close().
			queueMicrotask(() => this.dispatchEvent(new Event('close')));
		}
	});
	document.addEventListener('keydown', (event) => {
		if (event.key !== 'Escape') return;
		const dialog = modals[modals.length - 1];
		if (!dialog?.isConnected) return;
		const cancel = new Event('cancel', { cancelable: true });
		dialog.dispatchEvent(cancel);
		if (!cancel.defaultPrevented) dialog.close();
	});
}

/** A `matchMedia` whose answers a test can set; everything defaults to "does not match". */
const mediaMatches = new Map<string, boolean>();
const mediaListeners = new Map<string, Set<() => void>>();

/** Makes `(prefers-reduced-motion: reduce)` and friends answer `matches` and tells the subscribers. */
export function setMedia(query: string, matches: boolean): void {
	mediaMatches.set(query, matches);
	for (const listener of mediaListeners.get(query) ?? []) listener();
}

function installMatchMedia(): void {
	Object.defineProperty(window, 'matchMedia', {
		configurable: true,
		writable: true,
		value: (query: string): MediaQueryList => {
			const listeners = mediaListeners.get(query) ?? new Set<() => void>();
			mediaListeners.set(query, listeners);
			const list = {
				media: query,
				onchange: null,
				get matches(): boolean {
					return mediaMatches.get(query) ?? false;
				},
				addEventListener: (_type: string, listener: () => void): void => void listeners.add(listener),
				removeEventListener: (_type: string, listener: () => void): void => void listeners.delete(listener),
				addListener: (listener: () => void): void => void listeners.add(listener),
				removeListener: (listener: () => void): void => void listeners.delete(listener),
				dispatchEvent: (): boolean => true
			};
			return list as unknown as MediaQueryList;
		}
	});
}

/** Observers that never fire on their own; a test calls `triggerIntersection` to report visibility. */
const intersections = new Set<{ callback: IntersectionObserverCallback; elements: Set<Element> }>();

/** Reports `isIntersecting` for `element` to the observers that watch it. */
export function triggerIntersection(element: Element, isIntersecting: boolean): void {
	for (const observer of intersections) {
		if (!observer.elements.has(element)) continue;
		observer.callback([{ target: element, isIntersecting } as IntersectionObserverEntry], {} as IntersectionObserver);
	}
}

class FakeIntersectionObserver {
	readonly root = null;
	readonly rootMargin = '0px';
	readonly thresholds: readonly number[] = [0];
	#entry: { callback: IntersectionObserverCallback; elements: Set<Element> };
	constructor(callback: IntersectionObserverCallback) {
		this.#entry = { callback, elements: new Set() };
		intersections.add(this.#entry);
	}
	observe(element: Element): void {
		this.#entry.elements.add(element);
	}
	unobserve(element: Element): void {
		this.#entry.elements.delete(element);
	}
	disconnect(): void {
		this.#entry.elements.clear();
		intersections.delete(this.#entry);
	}
	takeRecords(): IntersectionObserverEntry[] {
		return [];
	}
}

/** Resize observers that never fire on their own; a test calls `triggerResize` after it changed a measurement. */
const resizes = new Set<{ callback: ResizeObserverCallback; elements: Set<Element> }>();

/** Tells the resize observers that watch `element` that it changed size. */
export function triggerResize(element: Element): void {
	for (const observer of [...resizes]) {
		if (!observer.elements.has(element)) continue;
		observer.callback([{ target: element } as ResizeObserverEntry], {} as ResizeObserver);
	}
}

class FakeResizeObserver {
	#entry: { callback: ResizeObserverCallback; elements: Set<Element> };
	constructor(callback: ResizeObserverCallback) {
		this.#entry = { callback, elements: new Set() };
		resizes.add(this.#entry);
	}
	observe(element: Element): void {
		this.#entry.elements.add(element);
	}
	unobserve(element: Element): void {
		this.#entry.elements.delete(element);
	}
	disconnect(): void {
		this.#entry.elements.clear();
		resizes.delete(this.#entry);
	}
}

function define(target: object, name: string, value: unknown): void {
	Object.defineProperty(target, name, { configurable: true, writable: true, value });
}

installDialog();
installMatchMedia();
define(globalThis, 'IntersectionObserver', FakeIntersectionObserver);
define(globalThis, 'ResizeObserver', FakeResizeObserver);
// jsdom logs "not implemented" for scrolling; the components only ask for it.
define(window, 'scrollTo', (): void => undefined);
define(Element.prototype, 'scrollTo', (): void => undefined);
define(Element.prototype, 'scrollIntoView', (): void => undefined);
// Pointer capture, used by the sliders and resizers.
define(Element.prototype, 'setPointerCapture', (): void => undefined);
define(Element.prototype, 'releasePointerCapture', (): void => undefined);
define(Element.prototype, 'hasPointerCapture', (): boolean => false);

afterEach(() => {
	mediaMatches.clear();
	modals.length = 0;
});

configure({ asyncUtilTimeout: 2000 });
