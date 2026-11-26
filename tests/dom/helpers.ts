/** Shared helpers of the DOM component tests. */
import { createRawSnippet, type Snippet } from 'svelte';

function escapeHtml(value: string): string {
	return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

/** A `children`-style snippet that renders `<span>text</span>`. */
export function textSnippet(value: string): Snippet {
	return createRawSnippet(() => ({ render: () => `<span>${escapeHtml(value)}</span>` }));
}

/** A snippet with one argument (a row, an item, an id ...) rendered as `<span data-snippet>text</span>`. */
export function mapSnippet<A>(format: (arg: A) => string): Snippet<[A]> {
	return createRawSnippet((arg: () => A) => ({ render: () => `<span data-snippet>${escapeHtml(format(arg()))}</span>` }));
}

/** A snippet with two arguments. */
export function mapSnippet2<A, B>(format: (a: A, b: B) => string): Snippet<[A, B]> {
	return createRawSnippet((a: () => A, b: () => B) => ({ render: () => `<span data-snippet>${escapeHtml(format(a(), b()))}</span>` }));
}

/** Lets queued tasks (native events, timers of 0 ms) run, e.g. before asserting that something did NOT happen. */
export function flush(): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, 0));
}

/** A `File` of `size` bytes without allocating them. */
export function fileOf(name: string, type = '', size?: number): File {
	const file = new File(['content'], name, { type });
	if (size !== undefined) Object.defineProperty(file, 'size', { value: size });
	return file;
}

/** A bubbling, cancelable drag event with the `dataTransfer` jsdom does not provide (it has no DragEvent). */
export function dragEvent(type: string, files: readonly File[] = []): Event {
	const event = new Event(type, { bubbles: true, cancelable: true });
	Object.defineProperty(event, 'dataTransfer', { value: { files, types: files.length > 0 ? ['Files'] : [], dropEffect: 'none' } });
	return event;
}

/** Box sizes of a scroller as jsdom cannot compute them (a missing one equals its client size: nothing overflows there). */
export interface BoxSize {
	scrollHeight?: number;
	clientHeight?: number;
	scrollWidth?: number;
	clientWidth?: number;
}

/** Makes `el` a scroller (`overflow: auto`; jsdom has no UA or component styles) of the given measured size. */
export function scrollBox(el: Element, size: BoxSize): void {
	if (el instanceof HTMLElement) el.style.overflow = 'auto';
	const height = size.clientHeight ?? 100;
	const width = size.clientWidth ?? 100;
	Object.defineProperty(el, 'scrollHeight', { configurable: true, value: size.scrollHeight ?? height });
	Object.defineProperty(el, 'clientHeight', { configurable: true, value: height });
	Object.defineProperty(el, 'scrollWidth', { configurable: true, value: size.scrollWidth ?? width });
	Object.defineProperty(el, 'clientWidth', { configurable: true, value: width });
}
