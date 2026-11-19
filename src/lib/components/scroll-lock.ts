/*
 * Page scroll lock for modal overlays. Counted on <html> itself (not in module state), so nested
 * modals and the separate copies of kern in the Svelte package and the custom-elements bundle
 * share one count: the page scrolls again when the last lock is released.
 */
const COUNT = 'data-k-scroll-lock';
const PREV = 'data-k-scroll-lock-prev';

/** Locks page scrolling; returns the release function (safe to call more than once). */
export function lockScroll(): () => void {
	if (typeof document === 'undefined') return () => undefined;
	const html = document.documentElement;
	const count = Number(html.getAttribute(COUNT)) || 0;
	if (count === 0) {
		html.setAttribute(PREV, JSON.stringify([html.style.overflow, html.style.scrollbarGutter]));
		// Keep the scrollbar's room so the page does not shift sideways while it is locked.
		if (window.innerWidth > html.clientWidth) html.style.scrollbarGutter = 'stable';
		html.style.overflow = 'hidden';
	}
	html.setAttribute(COUNT, String(count + 1));
	let released = false;
	return () => {
		if (released) return;
		released = true;
		const left = (Number(html.getAttribute(COUNT)) || 1) - 1;
		if (left > 0) {
			html.setAttribute(COUNT, String(left));
			return;
		}
		let prev: unknown;
		try {
			prev = JSON.parse(html.getAttribute(PREV) ?? '[]');
		} catch {
			prev = [];
		}
		const [overflow, gutter] = Array.isArray(prev) ? (prev as unknown[]) : [];
		html.style.overflow = typeof overflow === 'string' ? overflow : '';
		html.style.scrollbarGutter = typeof gutter === 'string' ? gutter : '';
		html.removeAttribute(COUNT);
		html.removeAttribute(PREV);
	};
}
