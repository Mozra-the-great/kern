/** Hidden content before (`start`) or after (`end`) the visible part of a sideways scrolling strip. */
export interface ScrollFade {
	start: boolean;
	end: boolean;
}

/**
 * Watches a sideways scrolling strip (Tabs, TabLinks) and reports whether there is hidden content
 * before / after the visible part, so the component can fade that edge as a hint that the strip
 * scrolls. Logical: "start" is the right edge in RTL. Returns the cleanup.
 */
export function watchScrollFade(node: HTMLElement, report: (fade: ScrollFade) => void): () => void {
	let last = '';
	let stopped = false;
	const update = (): void => {
		if (stopped) return;
		const max = node.scrollWidth - node.clientWidth;
		// RTL strips report 0 … -max; the distance from the start is the absolute value.
		const pos = Math.abs(node.scrollLeft);
		const fade = { start: max > 1 && pos > 1, end: max > 1 && pos < max - 1 };
		const key = `${String(fade.start)}${String(fade.end)}`;
		if (key === last) return;
		last = key;
		report(fade);
	};
	update();
	node.addEventListener('scroll', update, { passive: true });
	let resize: ResizeObserver | undefined;
	let mutation: MutationObserver | undefined;
	if (typeof ResizeObserver !== 'undefined') {
		resize = new ResizeObserver(update);
		resize.observe(node);
	}
	if (typeof MutationObserver !== 'undefined') {
		// Tabs added, removed or relabelled change the scroll width without resizing the strip.
		mutation = new MutationObserver(update);
		mutation.observe(node, { childList: true, subtree: true, characterData: true });
	}
	// Web fonts change the width of the labels once they load.
	if (typeof document !== 'undefined') void document.fonts?.ready.then(update);
	return () => {
		stopped = true;
		node.removeEventListener('scroll', update);
		resize?.disconnect();
		mutation?.disconnect();
	};
}
