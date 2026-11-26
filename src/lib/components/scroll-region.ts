/*
 * Keyboard access to a scrolling body (axe `scrollable-region-focusable`, WCAG 2.1.1). A box that scrolls
 * but holds nothing that can take focus cannot be scrolled with the keyboard: arrow keys and PageDown act
 * on the focused element's scroll container, and without a focus target there is none. The fix is a tab
 * stop on the box itself, but only when it is needed: while the content overflows and contains no tabbable
 * element. Otherwise the box would add a pointless stop (or a second one next to the first control).
 */

/** What a browser can focus by itself (not told apart: an `inert` ancestor outside a shadow root, a second `summary`); `isTabbable` narrows it to what Tab reaches right now. */
const CANDIDATES =
	'a[href], area[href], button, input:not([type="hidden"]), select, textarea, summary, iframe, audio[controls], video[controls], [contenteditable]:not([contenteditable="false"]), [tabindex]';

function isTabbable(el: Element): boolean {
	if (!(el instanceof HTMLElement || el instanceof SVGElement)) return false;
	if (el.matches(':disabled') || el.closest('[inert]')) return false;
	// `tabIndex` is -1 for natively focusable elements without the attribute too (contenteditable), so only the attribute decides.
	const declared = el.getAttribute('tabindex');
	if (declared !== null) {
		const index = Number.parseInt(declared, 10);
		if (index < 0 || (Number.isNaN(index) && el.tabIndex < 0)) return false;
	}
	// `display: none`, `hidden` and `visibility: hidden` take an element out of the tab order (jsdom has no checkVisibility).
	return typeof el.checkVisibility !== 'function' || el.checkVisibility({ visibilityProperty: true });
}

/**
 * True when Tab can reach something inside `root` other than `except`. Looks through open shadow roots (a `<k-button>` in the
 * body is a tab stop) and through slots (in a custom element the content lives in the host's light DOM, so
 * it is not a descendant of the body).
 */
export function hasTabbable(root: ParentNode, except?: Element): boolean {
	for (const el of root.querySelectorAll('*')) if (offersFocus(el, except)) return true;
	return false;
}

/** The element itself (unless it is `except`), its open shadow root, or (for a slot) what it shows. */
function offersFocus(el: Element, except: Element | undefined): boolean {
	if (el !== except && el.matches(CANDIDATES) && isTabbable(el)) return true;
	if (el.shadowRoot && hasTabbable(el.shadowRoot, except)) return true;
	if (el instanceof HTMLSlotElement) {
		for (const assigned of el.assignedElements({ flatten: true })) {
			if (offersFocus(assigned, except) || hasTabbable(assigned, except)) return true;
		}
	}
	return false;
}

/** True when `el` has the focus (also inside a shadow root, where `document.activeElement` is the host). */
export function hasFocus(el: Element): boolean {
	const root = el.getRootNode();
	return (root instanceof Document || root instanceof ShadowRoot) && root.activeElement === el;
}

/** True when the box has more content than it shows, in either direction. */
function overflows(node: HTMLElement): boolean {
	return node.scrollHeight - node.clientHeight > 1 || node.scrollWidth - node.clientWidth > 1;
}

/** The things the layout of `node` depends on: its children, with slots replaced by what they show. */
function layoutChildren(node: HTMLElement): Element[] {
	const out: Element[] = [];
	for (const child of node.children) {
		if (child instanceof HTMLSlotElement) out.push(...child.assignedElements({ flatten: true }));
		else out.push(child);
	}
	return out;
}

/**
 * Watches a scrolling box and reports `true` while it needs a tab stop of its own (it overflows and holds
 * nothing tabbable) and `false` otherwise. The tab stop is the box itself, or `stop`, an element inside it
 * that the caller makes tabbable while the report is `true` (a dialog scrolls as a whole, so its stop is its
 * content wrapper); `stop` does not count as the tabbable content it replaces. Reports the current state at once and then only changes.
 * Re-measures when the box or its content resizes, when the content, its attributes or (in a custom
 * element) the host's light DOM change, and when web fonts load. Returns the cleanup.
 */
export function watchScrollRegion(node: HTMLElement, report: (needsFocus: boolean) => void, stop?: Element): () => void {
	let last: boolean | undefined;
	let stopped = false;
	const update = (): void => {
		if (stopped) return;
		const needs = overflows(node) && !hasTabbable(node, stop);
		if (needs === last) return;
		last = needs;
		report(needs);
	};
	update();

	const cleanups: (() => void)[] = [];
	const root = node.getRootNode();
	// In a custom element the slotted content is the host's light DOM; the observers on the box do not see it change.
	const watched: Node[] = root instanceof ShadowRoot ? [node, root.host] : [node];
	node.addEventListener('slotchange', update);
	cleanups.push(() => node.removeEventListener('slotchange', update));

	if (typeof MutationObserver !== 'undefined') {
		// The box's own `style` changes when a component positions it (Popover on every scroll frame): not a reason to re-measure.
		const mutation = new MutationObserver((records) => {
			if (records.some((r) => !(r.target === node && r.attributeName === 'style'))) update();
		});
		for (const target of watched) {
			mutation.observe(target, {
				childList: true,
				subtree: true,
				characterData: true,
				attributes: true,
				attributeFilter: ['tabindex', 'disabled', 'hidden', 'inert', 'href', 'contenteditable', 'style', 'class']
			});
		}
		cleanups.push(() => mutation.disconnect());
	}
	if (typeof ResizeObserver !== 'undefined') {
		const resize = new ResizeObserver(() => {
			update();
			sync();
		});
		const observed = new Set<Element>();
		// New children (and the ones a slot starts to show) join the observed set; gone ones leave it.
		const sync = (): void => {
			const now = new Set([node, ...layoutChildren(node)]);
			for (const el of observed) {
				if (now.has(el)) continue;
				resize.unobserve(el);
				observed.delete(el);
			}
			for (const el of now) {
				if (observed.has(el)) continue;
				resize.observe(el);
				observed.add(el);
			}
		};
		sync();
		const mutation = typeof MutationObserver !== 'undefined' ? new MutationObserver(sync) : undefined;
		mutation?.observe(node, { childList: true });
		node.addEventListener('slotchange', sync);
		cleanups.push(() => {
			mutation?.disconnect();
			node.removeEventListener('slotchange', sync);
			resize.disconnect();
		});
	}
	// Web fonts change the height of the text once they load.
	if (typeof document !== 'undefined') void document.fonts?.ready.then(update);

	return () => {
		stopped = true;
		for (const cleanup of cleanups) cleanup();
	};
}
