/**
 * ScrollArea in jsdom: it is a named, focusable region only while something overflows, measures again on scroll
 * and resize, and sets the fade of each edge that has more to scroll to (top/bottom, start/end mirrored in RTL),
 * only with `fade`. jsdom has no layout: the scroller's sizes and scroll offsets are set per element.
 */
import { render, screen } from '@testing-library/svelte';
import { tick } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ScrollArea from '../../src/lib/components/ScrollArea.svelte';
import { textSnippet } from './helpers.js';

interface Metrics {
	scrollHeight: number;
	clientHeight: number;
	scrollTop: number;
	scrollWidth: number;
	clientWidth: number;
	scrollLeft: number;
}

const observers: { callback: ResizeObserverCallback; observed: Element[] }[] = [];

class RecordingResizeObserver {
	#entry: { callback: ResizeObserverCallback; observed: Element[] };
	constructor(callback: ResizeObserverCallback) {
		this.#entry = { callback, observed: [] };
		observers.push(this.#entry);
	}
	observe(element: Element): void {
		this.#entry.observed.push(element);
	}
	unobserve(): void {}
	disconnect(): void {
		this.#entry.observed.length = 0;
	}
}

beforeEach(() => {
	observers.length = 0;
	vi.stubGlobal('ResizeObserver', RecordingResizeObserver);
});

afterEach(() => {
	vi.unstubAllGlobals();
});

const scroller = (): HTMLElement => document.querySelector<HTMLElement>('.scroller') as HTMLElement;

/** Gives the scroller sizes and offsets, then lets it measure (scroll event) and render. */
async function setMetrics(el: HTMLElement, metrics: Partial<Metrics>): Promise<void> {
	for (const [name, value] of Object.entries(metrics)) Object.defineProperty(el, name, { configurable: true, value });
	el.dispatchEvent(new Event('scroll'));
	await tick();
}

const fades = (el: HTMLElement): string[] => ['t', 'b', 'l', 'r'].map((side) => el.style.getPropertyValue(`--fade-${side}`));
const ON = 'var(--fade-size)';

describe('ScrollArea', () => {
	it('is not a region and not focusable while nothing overflows', () => {
		render(ScrollArea, { children: textSnippet('Short') });
		const el = scroller();
		expect(screen.getByText('Short')).toBeTruthy();
		expect(el.hasAttribute('role')).toBe(false);
		expect(el.hasAttribute('tabindex')).toBe(false);
		expect(el.hasAttribute('aria-label')).toBe(false);
		expect(el.dataset.direction).toBe('vertical');
		expect(el.style.getPropertyValue('--fade-size')).toBe('28px');
		expect(observers[0]?.observed).toEqual([el, document.querySelector('.content')]);
	});

	it('becomes a named, focusable region once the content overflows vertically', async () => {
		render(ScrollArea, { children: textSnippet('Long'), maxHeight: 120 });
		const el = scroller();
		expect(el.style.maxHeight).toBe('120px');
		await setMetrics(el, { scrollHeight: 400, clientHeight: 120, scrollTop: 0 });
		const region = screen.getByRole('region', { name: 'Scrollable content' });
		expect(region).toBe(el);
		expect(el.tabIndex).toBe(0);
		// No fade without the prop, even with more to scroll to.
		expect(fades(el)).toEqual(['0px', '0px', '0px', '0px']);
	});

	it('fades the top and bottom edges that have more content', async () => {
		render(ScrollArea, { children: textSnippet('Long'), fade: true, fadeSize: 12, label: 'Log', maxHeight: '10rem', class: 'extra' });
		const el = scroller();
		expect(el.style.maxHeight).toBe('10rem');
		expect(el.style.getPropertyValue('--fade-size')).toBe('12px');
		expect(document.querySelector('.k-scroll-area')?.classList.contains('fade')).toBe(true);
		expect(document.querySelector('.k-scroll-area')?.classList.contains('extra')).toBe(true);
		await setMetrics(el, { scrollHeight: 400, clientHeight: 100, scrollTop: 0 });
		expect(screen.getByRole('region', { name: 'Log' })).toBe(el);
		expect(fades(el)).toEqual(['0px', ON, '0px', '0px']);
		await setMetrics(el, { scrollTop: 150 });
		expect(fades(el)).toEqual([ON, ON, '0px', '0px']);
		await setMetrics(el, { scrollTop: 300 });
		expect(fades(el)).toEqual([ON, '0px', '0px', '0px']);
	});

	it('a vertical area ignores sideways overflow', async () => {
		render(ScrollArea, { children: textSnippet('Wide'), fade: true });
		const el = scroller();
		await setMetrics(el, { scrollWidth: 500, clientWidth: 100, scrollLeft: 50 });
		expect(el.hasAttribute('role')).toBe(false);
		expect(fades(el)).toEqual(['0px', '0px', '0px', '0px']);
	});

	it('fades the start and end edges of a sideways area, mirrored in RTL', async () => {
		render(ScrollArea, { children: textSnippet('Wide'), fade: true, direction: 'horizontal' });
		const el = scroller();
		expect(el.dataset.direction).toBe('horizontal');
		await setMetrics(el, { scrollHeight: 500, clientHeight: 100 });
		expect(el.hasAttribute('role')).toBe(false);
		await setMetrics(el, { scrollWidth: 500, clientWidth: 100, scrollLeft: 0 });
		expect(el.getAttribute('role')).toBe('region');
		expect(fades(el)).toEqual(['0px', '0px', '0px', ON]);
		await setMetrics(el, { scrollLeft: 200 });
		expect(fades(el)).toEqual(['0px', '0px', ON, ON]);
		el.style.direction = 'rtl';
		await setMetrics(el, { scrollLeft: -400 });
		expect(fades(el)).toEqual(['0px', '0px', '0px', ON]);
		await setMetrics(el, { scrollLeft: 0 });
		expect(fades(el)).toEqual(['0px', '0px', ON, '0px']);
	});

	it('scrolls both axes with direction both', async () => {
		render(ScrollArea, { children: textSnippet('Big'), fade: true, direction: 'both' });
		const el = scroller();
		await setMetrics(el, { scrollHeight: 500, clientHeight: 100, scrollTop: 10, scrollWidth: 500, clientWidth: 100, scrollLeft: 10 });
		expect(fades(el)).toEqual([ON, ON, ON, ON]);
	});

	it('measures again when the observer reports a resize, and stops observing when unmounted', async () => {
		const { unmount } = render(ScrollArea, { children: textSnippet('Grows') });
		const el = scroller();
		for (const [name, value] of Object.entries({ scrollHeight: 300, clientHeight: 100 }))
			Object.defineProperty(el, name, { configurable: true, value });
		observers[0]?.callback([], {} as ResizeObserver);
		await tick();
		expect(el.getAttribute('role')).toBe('region');
		unmount();
		expect(observers[0]?.observed).toEqual([]);
		observers[0]?.callback([], {} as ResizeObserver);
	});

	it('measures once without a ResizeObserver', async () => {
		vi.stubGlobal('ResizeObserver', undefined);
		render(ScrollArea, { children: textSnippet('Plain') });
		const el = scroller();
		await setMetrics(el, { scrollHeight: 300, clientHeight: 100 });
		expect(el.getAttribute('role')).toBe('region');
	});

	it('renders without children', () => {
		render(ScrollArea, {});
		expect(document.querySelector('.content')?.textContent).toBe('');
	});
});
