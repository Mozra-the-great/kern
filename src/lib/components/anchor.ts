/*
 * Positioning and focus helpers shared by kern overlays (Popover, Combobox,
 * DatePicker, ContextMenu, CommandPalette). Floating panels use
 * `position: fixed`, so coordinates are viewport coordinates.
 * The focus helpers work in the Svelte build and inside custom-element shadow roots.
 */

export type Placement = 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';

export interface Size {
	width: number;
	height: number;
}

export interface Position {
	top: number;
	left: number;
	/** Placement after flipping. */
	placement: Placement;
	/** Height available on the chosen side; use it to cap the panel. */
	maxHeight: number;
}

export interface AnchorOptions {
	placement?: Placement;
	/** Distance between anchor and panel in px. */
	gap?: number;
	/** Give the panel the anchor's width (at most the viewport width). */
	matchWidth?: boolean;
}

/** Minimum distance between a panel and the viewport edge. */
export const VIEWPORT_MARGIN = 8;

function viewport(): Size {
	return { width: document.documentElement.clientWidth || window.innerWidth, height: window.innerHeight };
}

function clamp(n: number, min: number, max: number): number {
	return Math.max(min, Math.min(n, max));
}

/**
 * Places a panel of `size` next to `anchor`. Flips to the other side when the
 * preferred side has less room than the panel needs and the other side has more,
 * and clamps horizontally so the panel stays inside the viewport.
 */
export function computePosition(anchor: DOMRect, size: Size, placement: Placement = 'bottom-start', gap = 6): Position {
	const vp = viewport();
	const m = VIEWPORT_MARGIN;
	let [side, align] = placement.split('-') as ['bottom' | 'top', 'start' | 'end'];
	const below = vp.height - anchor.bottom - gap - m;
	const above = anchor.top - gap - m;
	if (side === 'bottom' && size.height > below && above > below) side = 'top';
	else if (side === 'top' && size.height > above && below > above) side = 'bottom';
	const maxHeight = Math.max(0, side === 'bottom' ? below : above);
	const height = Math.min(size.height, maxHeight);
	const top = side === 'bottom' ? anchor.bottom + gap : anchor.top - gap - height;
	const width = Math.min(size.width, vp.width - 2 * m);
	const preferred = align === 'start' ? anchor.left : anchor.right - width;
	const left = clamp(preferred, m, vp.width - m - width);
	return { top, left, placement: `${side}-${align}` as Placement, maxHeight };
}

/** Places a panel with its top-left corner at a point, shifted back into the viewport if needed. */
export function computePointPosition(x: number, y: number, size: Size): { top: number; left: number; maxHeight: number } {
	const vp = viewport();
	const m = VIEWPORT_MARGIN;
	const width = Math.min(size.width, vp.width - 2 * m);
	const height = Math.min(size.height, vp.height - 2 * m);
	let left = x;
	let top = y;
	// Open towards the side with room, like native context menus.
	if (left + width > vp.width - m) left = x - width;
	if (top + height > vp.height - m) top = y - height;
	return {
		left: clamp(left, m, vp.width - m - width),
		top: clamp(top, m, vp.height - m - height),
		maxHeight: vp.height - 2 * m
	};
}

/** Natural size of a panel, ignoring a max-height that clips it. */
export function naturalSize(el: HTMLElement): Size {
	const frame = el.offsetHeight - el.clientHeight;
	return { width: el.offsetWidth, height: el.scrollHeight + frame };
}

/**
 * Positions `floating` next to `anchor` now and whenever the page scrolls,
 * the viewport resizes or either element changes size. Sets `top`, `left`,
 * `data-placement` and the CSS variable `--avail-h` (px) on the panel; cap the
 * panel's height with `max-height: min(<cap>, var(--avail-h))`.
 * Returns a cleanup function.
 */
export function anchorTo(anchor: Element, floating: HTMLElement, options: AnchorOptions = {}): () => void {
	const { placement = 'bottom-start', gap = 6, matchWidth = false } = options;
	let frame = 0;
	const update = () => {
		const rect = anchor.getBoundingClientRect();
		if (matchWidth) floating.style.width = `${Math.min(rect.width, viewport().width - 2 * VIEWPORT_MARGIN)}px`;
		const pos = computePosition(rect, naturalSize(floating), placement, gap);
		floating.style.top = `${pos.top}px`;
		floating.style.left = `${pos.left}px`;
		floating.style.setProperty('--avail-h', `${pos.maxHeight}px`);
		floating.dataset.placement = pos.placement;
	};
	const schedule = () => {
		cancelAnimationFrame(frame);
		frame = requestAnimationFrame(update);
	};
	update();
	window.addEventListener('scroll', schedule, { capture: true, passive: true });
	window.addEventListener('resize', schedule);
	window.visualViewport?.addEventListener('resize', schedule);
	const ro = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(schedule);
	ro?.observe(anchor);
	ro?.observe(floating);
	return () => {
		cancelAnimationFrame(frame);
		window.removeEventListener('scroll', schedule, { capture: true });
		window.removeEventListener('resize', schedule);
		window.visualViewport?.removeEventListener('resize', schedule);
		ro?.disconnect();
	};
}

/** Positions `floating` at a viewport point (context menus). */
export function placeAtPoint(floating: HTMLElement, x: number, y: number): void {
	const pos = computePointPosition(x, y, naturalSize(floating));
	floating.style.top = `${pos.top}px`;
	floating.style.left = `${pos.left}px`;
	floating.style.setProperty('--avail-h', `${pos.maxHeight}px`);
}

/* ---------- focus helpers (Svelte build and shadow DOM) ---------- */

/** The focused element in the same document or shadow root as `node`. */
export function activeElementOf(node: Node): Element | null {
	const root = node.getRootNode() as Document | ShadowRoot;
	return root.activeElement ?? null;
}

/** The focused element, looking through open shadow roots (custom elements). */
export function deepActiveElement(): Element | null {
	let el = document.activeElement;
	while (el?.shadowRoot?.activeElement) el = el.shadowRoot.activeElement;
	return el;
}

/** True when the event passed through one of the given elements (works across shadow roots). */
export function eventWithin(e: Event, ...elements: (Element | null | undefined)[]): boolean {
	const path = e.composedPath();
	return elements.some((el) => !!el && path.includes(el));
}

/** True when `node` is inside `container` in the flattened tree (follows slots and shadow hosts). */
export function composedContains(container: Node | null | undefined, node: Node | null | undefined): boolean {
	let cur: Node | null | undefined = node;
	while (cur) {
		if (cur === container) return true;
		const slot = cur instanceof Element ? cur.assignedSlot : null;
		cur = slot ?? cur.parentNode ?? (cur instanceof ShadowRoot ? cur.host : null);
	}
	return false;
}

const TABBABLE =
	'a[href],area[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),iframe,summary,[contenteditable=""],[contenteditable="true"],[tabindex]:not([tabindex="-1"])';

function* flatChildren(el: Element): Generator<Element> {
	if (el instanceof HTMLSlotElement) {
		const assigned = el.assignedElements({ flatten: true });
		yield* assigned.length ? assigned : Array.from(el.children);
		return;
	}
	const shadow = el.shadowRoot;
	yield* Array.from(shadow ? shadow.children : el.children);
}

function* tabbables(el: Element): Generator<HTMLElement> {
	for (const child of flatChildren(el)) {
		if (!(child instanceof HTMLElement) || child.hidden || child.inert) continue;
		if (child.matches(TABBABLE) && child.getClientRects().length > 0) yield child;
		yield* tabbables(child);
	}
}

/** Focuses the first tabbable element inside `container` (light DOM, slots and open shadow roots). */
export function focusFirstIn(container: HTMLElement): boolean {
	for (const el of tabbables(container)) {
		el.focus();
		if (activeElementOf(el) === el || el.shadowRoot?.activeElement) return true;
	}
	return false;
}
