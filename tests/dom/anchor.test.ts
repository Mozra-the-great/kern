/**
 * anchor.ts: the positioning maths of the overlays (flip, clamp, point placement), `anchorTo` (styles it sets,
 * the listeners it adds and removes) and the focus helpers that also work through shadow roots and slots.
 * jsdom has no layout, so sizes and rectangles are stubbed per test; the real placement on screen is covered by
 * the Playwright overlay suites.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	activeElementOf,
	anchorTo,
	composedContains,
	computePointPosition,
	computePosition,
	deepActiveElement,
	eventWithin,
	focusFirstIn,
	naturalSize,
	placeAtPoint,
	VIEWPORT_MARGIN
} from '../../src/lib/components/anchor.js';

/** jsdom: innerWidth 1024, innerHeight 768, documentElement.clientWidth 0 (so innerWidth is used). */
const VW = 1024;
const VH = 768;

function rect(left: number, top: number, width: number, height: number): DOMRect {
	return { left, top, width, height, right: left + width, bottom: top + height, x: left, y: top, toJSON: () => ({}) } as DOMRect;
}

/** Gives `el` a layout box: offset/client/scroll sizes. */
function sized(el: HTMLElement, width: number, height: number, frame = 0): void {
	Object.defineProperty(el, 'offsetWidth', { configurable: true, value: width });
	Object.defineProperty(el, 'offsetHeight', { configurable: true, value: height });
	Object.defineProperty(el, 'clientHeight', { configurable: true, value: height - frame });
	Object.defineProperty(el, 'scrollHeight', { configurable: true, value: height - frame });
}

/** jsdom reports no client rects, so nothing counts as rendered; this makes every element "visible". */
function visibleRects(): void {
	vi.spyOn(Element.prototype, 'getClientRects').mockImplementation(() => [rect(0, 0, 1, 1)] as unknown as DOMRectList);
}

afterEach(() => {
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
	document.body.replaceChildren();
});

describe('computePosition', () => {
	it('places below the anchor at its start edge by default, with a 6 px gap', () => {
		const pos = computePosition(rect(100, 100, 50, 20), { width: 200, height: 100 });
		expect(pos).toEqual({ top: 126, left: 100, placement: 'bottom-start', maxHeight: VH - 120 - 6 - VIEWPORT_MARGIN });
	});

	it('aligns the end edges for *-end and honours the gap', () => {
		const pos = computePosition(rect(500, 100, 50, 20), { width: 200, height: 100 }, 'bottom-end', 10);
		expect(pos.left).toBe(350);
		expect(pos.top).toBe(130);
		expect(pos.placement).toBe('bottom-end');
	});

	it('flips to the top when there is no room below and more above', () => {
		const pos = computePosition(rect(100, 700, 50, 20), { width: 200, height: 300 });
		expect(pos.placement).toBe('top-start');
		expect(pos.maxHeight).toBe(700 - 6 - VIEWPORT_MARGIN);
		expect(pos.top).toBe(700 - 6 - 300);
	});

	it('stays below when it does not fit but the top has even less room', () => {
		const pos = computePosition(rect(100, 50, 50, 20), { width: 200, height: 2000 });
		expect(pos.placement).toBe('bottom-start');
		expect(pos.maxHeight).toBe(VH - 70 - 6 - VIEWPORT_MARGIN);
	});

	it('keeps a top placement that fits, and flips it down when the bottom has more room', () => {
		expect(computePosition(rect(100, 400, 50, 20), { width: 100, height: 100 }, 'top-start').placement).toBe('top-start');
		const flipped = computePosition(rect(100, 50, 50, 20), { width: 100, height: 100 }, 'top-end');
		expect(flipped.placement).toBe('bottom-end');
		expect(flipped.top).toBe(76);
	});

	it('keeps a top placement that does not fit when the bottom has even less room', () => {
		expect(computePosition(rect(100, 600, 50, 20), { width: 100, height: 900 }, 'top-start').placement).toBe('top-start');
	});

	it('caps the height at the room available and never reports a negative maximum', () => {
		const pos = computePosition(rect(0, -100, 10, 10), { width: 10, height: 50 }, 'top-start');
		expect(pos.maxHeight).toBeGreaterThanOrEqual(0);
		const offscreen = computePosition(rect(0, VH + 100, 10, 10), { width: 10, height: 50 }, 'bottom-start');
		expect(offscreen.placement).toBe('top-start');
		const both = computePosition(rect(0, -50, 10, VH + 100), { width: 10, height: 50 });
		expect(both.maxHeight).toBe(0);
		expect(both.top).toBe(VH + 50 + 6);
	});

	it('clamps horizontally into the viewport and shrinks a panel wider than the viewport', () => {
		expect(computePosition(rect(-50, 100, 20, 20), { width: 100, height: 10 }).left).toBe(VIEWPORT_MARGIN);
		expect(computePosition(rect(1000, 100, 20, 20), { width: 100, height: 10 }).left).toBe(VW - VIEWPORT_MARGIN - 100);
		expect(computePosition(rect(10, 100, 20, 20), { width: 5000, height: 10 }).left).toBe(VIEWPORT_MARGIN);
	});

	it('uses the document width when the layout reports one', () => {
		vi.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(500);
		expect(computePosition(rect(480, 100, 20, 20), { width: 100, height: 10 }).left).toBe(500 - VIEWPORT_MARGIN - 100);
	});
});

describe('computePointPosition', () => {
	it('opens at the point when there is room', () => {
		expect(computePointPosition(100, 100, { width: 200, height: 100 })).toEqual({ left: 100, top: 100, maxHeight: VH - 16 });
	});

	it('opens to the left and upwards near the right and bottom edges', () => {
		expect(computePointPosition(1000, 700, { width: 200, height: 100 })).toEqual({ left: 800, top: 600, maxHeight: VH - 16 });
	});

	it('clamps a panel that fits on neither side', () => {
		const pos = computePointPosition(100, 100, { width: 5000, height: 5000 });
		expect(pos.left).toBe(VIEWPORT_MARGIN);
		expect(pos.top).toBe(VIEWPORT_MARGIN);
	});
});

describe('naturalSize and placeAtPoint', () => {
	it('measures the scroll height plus the frame (border) of the panel', () => {
		const el = document.createElement('div');
		sized(el, 120, 50, 4);
		Object.defineProperty(el, 'scrollHeight', { configurable: true, value: 300 });
		expect(naturalSize(el)).toEqual({ width: 120, height: 304 });
	});

	it('sets top, left and --avail-h at a point', () => {
		const el = document.createElement('div');
		sized(el, 100, 50);
		placeAtPoint(el, 30, 40);
		expect(el.style.top).toBe('40px');
		expect(el.style.left).toBe('30px');
		expect(el.style.getPropertyValue('--avail-h')).toBe(`${VH - 16}px`);
	});
});

describe('anchorTo', () => {
	let anchor: HTMLElement;
	let panel: HTMLElement;
	beforeEach(() => {
		anchor = document.createElement('button');
		panel = document.createElement('div');
		document.body.append(anchor, panel);
		vi.spyOn(anchor, 'getBoundingClientRect').mockReturnValue(rect(100, 100, 80, 20));
		sized(panel, 200, 100);
	});

	it('positions the panel at once with the defaults and does not touch its width', () => {
		const stop = anchorTo(anchor, panel);
		expect(panel.style.top).toBe('126px');
		expect(panel.style.left).toBe('100px');
		expect(panel.style.width).toBe('');
		expect(panel.dataset.placement).toBe('bottom-start');
		expect(panel.style.getPropertyValue('--avail-h')).toBe(`${VH - 120 - 6 - VIEWPORT_MARGIN}px`);
		stop();
	});

	it('takes placement, gap and matchWidth', () => {
		vi.mocked(anchor.getBoundingClientRect).mockReturnValue(rect(100, 400, 80, 20));
		const stop = anchorTo(anchor, panel, { placement: 'top-end', gap: 2, matchWidth: true });
		expect(panel.style.width).toBe('80px');
		expect(panel.dataset.placement).toBe('top-end');
		expect(panel.style.top).toBe(`${400 - 2 - 100}px`);
		stop();
	});

	it('re-positions on scroll, resize, viewport resize and element resize, and stops after cleanup', () => {
		const frames: FrameRequestCallback[] = [];
		vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => frames.push(cb));
		const cancel = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);
		const viewport = new EventTarget();
		vi.stubGlobal('visualViewport', viewport);
		const observed: Element[] = [];
		let resize: (() => void) | undefined;
		let disconnected = false;
		class Observer {
			constructor(cb: () => void) {
				resize = cb;
			}
			observe(el: Element): void {
				observed.push(el);
			}
			unobserve(): void {}
			disconnect(): void {
				disconnected = true;
			}
		}
		vi.stubGlobal('ResizeObserver', Observer);

		const stop = anchorTo(anchor, panel);
		expect(observed).toEqual([anchor, panel]);
		vi.mocked(anchor.getBoundingClientRect).mockReturnValue(rect(300, 200, 80, 20));
		window.dispatchEvent(new Event('scroll'));
		window.dispatchEvent(new Event('resize'));
		viewport.dispatchEvent(new Event('resize'));
		resize?.();
		expect(frames.length).toBeGreaterThanOrEqual(4);
		expect(cancel).toHaveBeenCalledTimes(frames.length);
		frames.at(-1)?.(0);
		expect(panel.style.left).toBe('300px');
		expect(panel.style.top).toBe('226px');

		stop();
		expect(disconnected).toBe(true);
		const scheduled = frames.length;
		window.dispatchEvent(new Event('scroll'));
		window.dispatchEvent(new Event('resize'));
		viewport.dispatchEvent(new Event('resize'));
		expect(frames).toHaveLength(scheduled);
	});

	it('works without ResizeObserver and visualViewport', () => {
		vi.stubGlobal('ResizeObserver', undefined);
		vi.stubGlobal('visualViewport', undefined);
		const stop = anchorTo(anchor, panel);
		expect(panel.style.top).toBe('126px');
		expect(() => stop()).not.toThrow();
	});
});

describe('focus helpers', () => {
	it('activeElementOf reads the document or the shadow root of the node', () => {
		const host = document.createElement('div');
		document.body.append(host);
		const shadow = host.attachShadow({ mode: 'open' });
		const inner = document.createElement('button');
		shadow.append(inner);
		expect(activeElementOf(inner)).toBeNull();
		inner.focus();
		expect(activeElementOf(inner)).toBe(inner);
		expect(activeElementOf(host)).toBe(host);
		expect(deepActiveElement()).toBe(inner);
	});

	it('deepActiveElement is the document focus outside shadow roots', () => {
		const button = document.createElement('button');
		document.body.append(button);
		button.focus();
		expect(deepActiveElement()).toBe(button);
	});

	it('eventWithin follows the composed path and skips missing elements', () => {
		const outer = document.createElement('div');
		const inner = document.createElement('span');
		const other = document.createElement('p');
		outer.append(inner);
		document.body.append(outer, other);
		let within: boolean[] = [];
		inner.addEventListener('click', (e) => {
			within = [eventWithin(e, null, undefined, outer), eventWithin(e, other), eventWithin(e)];
		});
		inner.click();
		expect(within).toEqual([true, false, false]);
	});

	it('composedContains walks parents, slots and shadow hosts', () => {
		const host = document.createElement('div');
		const slotted = document.createElement('span');
		host.append(slotted);
		document.body.append(host);
		const shadow = host.attachShadow({ mode: 'open' });
		const wrapper = document.createElement('div');
		const slot = document.createElement('slot');
		wrapper.append(slot);
		const deep = document.createElement('b');
		shadow.append(wrapper, deep);
		expect(composedContains(wrapper, slotted)).toBe(true);
		expect(composedContains(document.body, deep)).toBe(true);
		expect(composedContains(host, deep)).toBe(true);
		expect(composedContains(wrapper, deep)).toBe(false);
		expect(composedContains(host, null)).toBe(false);
		expect(composedContains(null, slotted)).toBe(false);
	});

	it('focusFirstIn focuses the first visible, enabled, tabbable element', () => {
		visibleRects();
		const box = document.createElement('div');
		const hidden = document.createElement('div');
		hidden.hidden = true;
		hidden.append(document.createElement('button'));
		const inert = document.createElement('div');
		inert.inert = true;
		inert.append(document.createElement('button'));
		const disabled = document.createElement('button');
		disabled.disabled = true;
		const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		const nested = document.createElement('div');
		const target = document.createElement('input');
		nested.append(target);
		const emptySlot = document.createElement('slot');
		emptySlot.append(document.createElement('span'));
		box.append(hidden, inert, disabled, svg, emptySlot, nested);
		document.body.append(box);
		expect(focusFirstIn(box)).toBe(true);
		expect(document.activeElement).toBe(target);
	});

	it('focusFirstIn skips elements without a box and returns false when nothing takes focus', () => {
		const box = document.createElement('div');
		box.append(document.createElement('button'));
		document.body.append(box);
		expect(focusFirstIn(box)).toBe(false);
		expect(document.activeElement).toBe(document.body);
	});

	it('focusFirstIn moves on when an element refuses focus', () => {
		visibleRects();
		const box = document.createElement('div');
		const stubborn = document.createElement('button');
		stubborn.focus = () => undefined;
		const next = document.createElement('a');
		next.href = '#x';
		box.append(stubborn, next);
		document.body.append(box);
		expect(focusFirstIn(box)).toBe(true);
		expect(document.activeElement).toBe(next);
	});

	it('focusFirstIn looks into open shadow roots and slots', () => {
		visibleRects();
		const host = document.createElement('div');
		const light = document.createElement('button');
		light.textContent = 'slotted';
		host.append(light);
		document.body.append(host);
		const shadow = host.attachShadow({ mode: 'open' });
		const slot = document.createElement('slot');
		shadow.append(slot);
		expect(focusFirstIn(host)).toBe(true);
		expect(document.activeElement).toBe(light);

		const empty = document.createElement('div');
		document.body.append(empty);
		const emptyShadow = empty.attachShadow({ mode: 'open' });
		const fallbackSlot = document.createElement('slot');
		const fallback = document.createElement('button');
		fallbackSlot.append(fallback);
		emptyShadow.append(fallbackSlot);
		expect(focusFirstIn(empty)).toBe(true);
		expect(emptyShadow.activeElement).toBe(fallback);
	});

	it('focusFirstIn walks the children of a slot outside a shadow root', () => {
		visibleRects();
		const box = document.createElement('div');
		const slot = document.createElement('slot');
		const child = document.createElement('button');
		slot.append(child);
		box.append(slot);
		document.body.append(box);
		expect(focusFirstIn(box)).toBe(true);
		expect(document.activeElement).toBe(child);
	});

	it('focusFirstIn accepts a host whose focus lands inside its own shadow root', () => {
		visibleRects();
		const box = document.createElement('div');
		const host = document.createElement('div');
		host.tabIndex = 0;
		box.append(host);
		document.body.append(box);
		const shadow = host.attachShadow({ mode: 'open' });
		const inner = document.createElement('button');
		shadow.append(inner);
		host.focus = () => inner.focus();
		// The document reports the shadow host, the helper compares against the element's own root.
		vi.spyOn(host, 'getRootNode').mockReturnValue({ activeElement: null } as unknown as Document);
		expect(focusFirstIn(box)).toBe(true);
		expect(shadow.activeElement).toBe(inner);
	});
});
