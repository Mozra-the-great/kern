/**
 * Carousel in jsdom: names and roles (region, tabpanels "n of total", the tablist of slide buttons), the inert
 * hidden slides, previous/next/dot buttons, the keys of the tablist (wrap) and of the track (no wrap, RTL
 * flipped), `bind:index` from inside and outside (clamped), `onchange`, the live announcement, scrolling by the
 * user (read back from `scrollLeft`), realignment after a width change, and slides passed as children.
 * jsdom has no layout: the track's `clientWidth` and `scrollLeft` are stubbed, `scrollTo` is recorded.
 */
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { tick } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import Carousel from '../../src/lib/components/Carousel.svelte';
import { setMedia } from './env.js';
import CarouselChildren from './harness/CarouselChildren.svelte';
import { flush, mapSnippet2, textSnippet } from './helpers.js';
import { createRawSnippet } from 'svelte';
import { reactive } from './reactive.svelte.js';

const WIDTH = 300;
let width = WIDTH;
const scroll = new WeakMap<Element, number>();
let scrollTo: MockInstance<(this: Element, options?: ScrollToOptions | number, y?: number) => void>;
const resizeCallbacks: ResizeObserverCallback[] = [];

class RecordingResizeObserver {
	constructor(callback: ResizeObserverCallback) {
		resizeCallbacks.push(callback);
	}
	observe(): void {}
	unobserve(): void {}
	disconnect(): void {}
}

beforeEach(() => {
	width = WIDTH;
	resizeCallbacks.length = 0;
	vi.stubGlobal('ResizeObserver', RecordingResizeObserver);
	vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function (this: HTMLElement) {
		return this.classList.contains('track') ? width : 0;
	});
	vi.spyOn(Element.prototype, 'scrollLeft', 'get').mockImplementation(function (this: Element) {
		return scroll.get(this) ?? 0;
	});
	vi.spyOn(Element.prototype, 'scrollLeft', 'set').mockImplementation(function (this: Element, value: number) {
		scroll.set(this, value);
	});
	scrollTo = vi.spyOn(Element.prototype, 'scrollTo').mockImplementation(function (this: Element, options?: ScrollToOptions | number) {
		if (typeof options === 'object' && options.left !== undefined) scroll.set(this, options.left);
	});
});

afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
	vi.useRealTimers();
});

const slide = mapSnippet2<string, number>((item, i) => `${item} #${String(i)}`);
const items = ['Alpha', 'Beta', 'Gamma'];
const track = (): HTMLElement => document.querySelector<HTMLElement>('.track') as HTMLElement;
const panels = (): HTMLElement[] => Array.from(track().children) as HTMLElement[];
const tabs = (): HTMLElement[] => screen.getAllByRole('tab');
const lastScroll = (): ScrollToOptions | undefined => scrollTo.mock.calls.at(-1)?.[0] as ScrollToOptions | undefined;

describe('Carousel', () => {
	it('names the region, the slides and the slide buttons with the catalogue defaults', () => {
		render(Carousel, { items, slide });
		const region = screen.getByRole('region', { name: 'Carousel' });
		expect(region.getAttribute('aria-roledescription')).toBe('carousel');
		expect(screen.getByRole('group', { name: 'Carousel' })).toBe(track());
		expect(track().tabIndex).toBe(0);
		expect(panels().map((p) => p.getAttribute('aria-label'))).toEqual(['1 of 3', '2 of 3', '3 of 3']);
		expect(panels().every((p) => p.getAttribute('role') === 'tabpanel' && p.getAttribute('aria-roledescription') === 'slide')).toBe(true);
		expect(panels().map((p) => p.inert)).toEqual([false, true, true]);
		expect(screen.getByText('Beta #1')).toBeTruthy();
		expect(screen.getByRole('tablist', { name: 'Slides' })).toBeTruthy();
		expect(tabs().map((t) => t.getAttribute('aria-label'))).toEqual(['Go to slide 1', 'Go to slide 2', 'Go to slide 3']);
		expect(tabs()[0]?.getAttribute('aria-selected')).toBe('true');
		expect(tabs()[0]?.getAttribute('aria-controls')).toBe(panels()[0]?.id);
		expect(tabs().map((t) => t.tabIndex)).toEqual([0, -1, -1]);
		expect(screen.getByRole('button', { name: 'Previous slide' }).getAttribute('aria-disabled')).toBe('true');
		expect(screen.getByRole('button', { name: 'Next slide' }).getAttribute('aria-disabled')).toBe('false');
	});

	it('uses the labels it is given', () => {
		render(Carousel, {
			items,
			slide,
			label: 'Gallery',
			prevLabel: 'Back',
			nextLabel: 'Forward',
			dotsLabel: 'Pictures',
			slideLabel: 'Picture',
			ofLabel: 'von',
			roleDescription: 'Karussell',
			slideRoleDescription: 'Bild',
			class: 'extra'
		});
		const region = screen.getByRole('region', { name: 'Gallery' });
		expect(region.classList.contains('extra')).toBe(true);
		expect(region.getAttribute('aria-roledescription')).toBe('Karussell');
		expect(panels()[1]?.getAttribute('aria-label')).toBe('2 von 3');
		expect(panels()[1]?.getAttribute('aria-roledescription')).toBe('Bild');
		expect(screen.getByRole('tablist', { name: 'Pictures' })).toBeTruthy();
		expect(screen.getByRole('tab', { name: 'Picture 2' })).toBeTruthy();
		expect(screen.getByRole('button', { name: 'Back' })).toBeTruthy();
		expect(screen.getByRole('button', { name: 'Forward' })).toBeTruthy();
	});

	it('next, previous and the dots move the slide, scroll the track and report the index', async () => {
		const user = userEvent.setup();
		const onchange = vi.fn<(index: number) => void>();
		const props = reactive<{ items: string[]; slide: typeof slide; index: number | undefined; onchange: typeof onchange }>({
			items,
			slide,
			index: undefined,
			onchange
		});
		render(Carousel, { props });
		await user.click(screen.getByRole('button', { name: 'Next slide' }));
		expect(props.index).toBe(1);
		expect(onchange).toHaveBeenLastCalledWith(1);
		expect(lastScroll()).toEqual({ left: WIDTH, behavior: 'smooth' });
		await tick();
		expect(panels().map((p) => p.inert)).toEqual([true, false, true]);
		expect(tabs()[1]?.getAttribute('aria-selected')).toBe('true');
		await user.click(screen.getByRole('button', { name: 'Next slide' }));
		expect(props.index).toBe(2);
		expect(screen.getByRole('button', { name: 'Next slide' }).getAttribute('aria-disabled')).toBe('true');
		await user.click(screen.getByRole('button', { name: 'Next slide' }));
		expect(props.index).toBe(2);
		await user.click(screen.getByRole('button', { name: 'Previous slide' }));
		expect(props.index).toBe(1);
		await user.click(screen.getByRole('tab', { name: 'Go to slide 1' }));
		expect(props.index).toBe(0);
		await user.click(screen.getByRole('button', { name: 'Previous slide' }));
		expect(props.index).toBe(0);
		await user.click(screen.getByRole('tab', { name: 'Go to slide 1' }));
		expect(onchange).toHaveBeenCalledTimes(4);
	});

	it('scrolls without smoothing under reduced motion or a theme without motion', async () => {
		const user = userEvent.setup();
		setMedia('(prefers-reduced-motion: reduce)', true);
		render(Carousel, { items, slide });
		await user.click(screen.getByRole('button', { name: 'Next slide' }));
		expect(lastScroll()?.behavior).toBe('auto');
		setMedia('(prefers-reduced-motion: reduce)', false);
		track().style.setProperty('--k-dur', '0');
		await user.click(screen.getByRole('button', { name: 'Next slide' }));
		expect(lastScroll()?.behavior).toBe('auto');
	});

	it('the tablist moves with arrows (wrapping), Home and End and keeps the focus on the selected tab', async () => {
		const user = userEvent.setup();
		const props = reactive<{ items: string[]; slide: typeof slide; index: number | undefined }>({ items, slide, index: undefined });
		render(Carousel, { props });
		tabs()[0]?.focus();
		await user.keyboard('{ArrowLeft}');
		expect(props.index).toBe(2);
		expect(document.activeElement).toBe(tabs()[2]);
		await user.keyboard('{ArrowRight}');
		expect(props.index).toBe(0);
		await user.keyboard('{End}');
		expect(props.index).toBe(2);
		await user.keyboard('{Home}');
		expect(props.index).toBe(0);
		await user.keyboard('{ArrowRight}');
		expect(props.index).toBe(1);
		await user.keyboard('{Enter}');
		expect(props.index).toBe(1);
	});

	it('the track moves with arrows, Home and End without wrapping and ignores modified keys', async () => {
		const user = userEvent.setup();
		const props = reactive<{ items: string[]; slide: typeof slide; index: number | undefined }>({ items, slide, index: undefined });
		render(Carousel, { props });
		track().focus();
		await user.keyboard('{ArrowLeft}');
		expect(props.index).toBeUndefined();
		await user.keyboard('{ArrowRight}');
		expect(props.index).toBe(1);
		await user.keyboard('{End}');
		expect(props.index).toBe(2);
		await user.keyboard('{ArrowRight}');
		expect(props.index).toBe(2);
		await user.keyboard('{Home}');
		expect(props.index).toBe(0);
		await user.keyboard('{Alt>}{ArrowRight}{/Alt}');
		await user.keyboard('{Control>}{ArrowRight}{/Control}');
		await user.keyboard('{Meta>}{ArrowRight}{/Meta}');
		await user.keyboard('x');
		expect(props.index).toBe(0);
	});

	it('flips the arrow keys and the scroll direction in RTL', async () => {
		const user = userEvent.setup();
		const props = reactive<{ items: string[]; slide: typeof slide; index: number | undefined }>({ items, slide, index: undefined });
		render(Carousel, { props });
		track().style.direction = 'rtl';
		track().focus();
		await user.keyboard('{ArrowLeft}');
		expect(props.index).toBe(1);
		expect(lastScroll()?.left).toBe(-WIDTH);
		await user.keyboard('{ArrowRight}');
		expect(props.index).toBe(0);
		tabs()[0]?.focus();
		await user.keyboard('{ArrowLeft}');
		expect(props.index).toBe(1);
		await user.keyboard('{ArrowRight}');
		expect(props.index).toBe(0);
	});

	it('an index set from outside scrolls there without onchange and is clamped to a valid slide', async () => {
		const onchange = vi.fn<(index: number) => void>();
		const props = reactive<{ items: string[]; slide: typeof slide; index: number | undefined; onchange: typeof onchange }>({
			items,
			slide,
			index: 2,
			onchange
		});
		render(Carousel, { props });
		await tick();
		expect(lastScroll()?.left).toBe(2 * WIDTH);
		expect(tabs()[2]?.getAttribute('aria-selected')).toBe('true');
		props.index = 9;
		await vi.waitFor(() => expect(props.index).toBe(2));
		props.index = -3;
		await vi.waitFor(() => expect(props.index).toBe(0));
		props.index = 1.6;
		await vi.waitFor(() => expect(props.index).toBe(2));
		props.index = Number.NaN;
		await vi.waitFor(() => expect(props.index).toBe(0));
		expect(onchange).not.toHaveBeenCalled();
	});

	it('announces a new slide once it has settled, but not the first one', async () => {
		vi.useFakeTimers();
		const props = reactive<{ items: string[]; slide: typeof slide; index: number | undefined; ofLabel: string }>({
			items,
			slide,
			index: undefined,
			ofLabel: 'of'
		});
		render(Carousel, { props });
		const live = document.querySelector('[aria-live="polite"]') as HTMLElement;
		await vi.advanceTimersByTimeAsync(500);
		expect(live.textContent).toBe('');
		props.index = 1;
		await vi.advanceTimersByTimeAsync(100);
		props.index = 2;
		await vi.advanceTimersByTimeAsync(500);
		expect(live.textContent).toBe('3 of 3');
		props.index = 1;
		await vi.advanceTimersByTimeAsync(100);
		props.index = 2;
		await vi.advanceTimersByTimeAsync(500);
		expect(live.textContent).toBe('3 of 3');
	});

	it('follows the user scrolling the track, once its own scrolling has settled', async () => {
		vi.useFakeTimers();
		const onchange = vi.fn<(index: number) => void>();
		const props = reactive<{ items: string[]; slide: typeof slide; index: number | undefined; onchange: typeof onchange }>({
			items,
			slide,
			index: undefined,
			onchange
		});
		render(Carousel, { props });
		const el = track();
		// The first scroll event sees a new width: it realigns the current slide instead of reading it.
		el.scrollLeft = 2 * WIDTH;
		el.dispatchEvent(new Event('scroll'));
		expect(el.scrollLeft).toBe(0);
		expect(onchange).not.toHaveBeenCalled();
		// Scroll events while settling only extend the pause.
		el.dispatchEvent(new Event('scroll'));
		await vi.advanceTimersByTimeAsync(200);
		el.scrollLeft = 2 * WIDTH;
		el.dispatchEvent(new Event('scroll'));
		el.dispatchEvent(new Event('scroll'));
		await vi.advanceTimersByTimeAsync(50);
		expect(props.index).toBe(2);
		expect(onchange).toHaveBeenCalledWith(2);
		el.scrollLeft = 99 * WIDTH;
		el.dispatchEvent(new Event('scroll'));
		await vi.advanceTimersByTimeAsync(50);
		expect(props.index).toBe(2);
	});

	it('ignores a frame in which the width changed', async () => {
		vi.useFakeTimers();
		const props = reactive<{ items: string[]; slide: typeof slide; index: number | undefined }>({ items, slide, index: undefined });
		render(Carousel, { props });
		const el = track();
		el.dispatchEvent(new Event('scroll'));
		await vi.advanceTimersByTimeAsync(200);
		el.scrollLeft = WIDTH;
		el.dispatchEvent(new Event('scroll'));
		width = 400;
		await vi.advanceTimersByTimeAsync(50);
		expect(props.index).toBeUndefined();
	});

	it('realigns the visible slide when the track is resized', async () => {
		const props = reactive<{ items: string[]; slide: typeof slide; index: number | undefined }>({ items, slide, index: 1 });
		render(Carousel, { props });
		await tick();
		width = 500;
		for (const callback of resizeCallbacks) callback([], {} as ResizeObserver);
		expect(track().scrollLeft).toBe(500);
	});

	it('a resize reported after it was unmounted is ignored', () => {
		const { unmount } = render(Carousel, { items, slide, index: 1 });
		const el = track();
		const before = el.scrollLeft;
		unmount();
		width = 500;
		for (const callback of resizeCallbacks) callback([], {} as ResizeObserver);
		el.dispatchEvent(new Event('scroll'));
		expect(el.scrollLeft).toBe(before);
	});

	it('trusts the index while the track has no width', async () => {
		width = 0;
		const props = reactive<{ items: string[]; slide: typeof slide; index: number | undefined }>({ items, slide, index: 1 });
		render(Carousel, { props });
		await tick();
		expect(scrollTo).not.toHaveBeenCalled();
		await userEvent.setup().click(screen.getByRole('button', { name: 'Next slide' }));
		expect(lastScroll()).toEqual({ left: 0, behavior: 'smooth' });
	});

	it('cancels a pending frame when it is unmounted', () => {
		const cancel = vi.spyOn(window, 'cancelAnimationFrame');
		const { unmount } = render(Carousel, { items, slide });
		track().dispatchEvent(new Event('scroll'));
		const settled = new Promise((resolve) => setTimeout(resolve, 200));
		return settled.then(() => {
			track().dispatchEvent(new Event('scroll'));
			unmount();
			expect(cancel).toHaveBeenCalled();
		});
	});

	it('a single slide has no controls, no tab stop and no announcement', async () => {
		render(Carousel, { items: ['Only'], slide, index: 0 });
		expect(screen.queryByRole('tablist')).toBeNull();
		expect(screen.queryByRole('button')).toBeNull();
		expect(track().tabIndex).toBe(-1);
		track().focus();
		await userEvent.setup().keyboard('{ArrowRight}');
		expect(panels()[0]?.inert).toBe(false);
	});

	it('an empty list renders nothing to move to', () => {
		render(Carousel, { items: [], slide });
		expect(panels()).toEqual([]);
		expect(screen.queryByRole('tablist')).toBeNull();
	});

	it('takes child elements as slides and counts them as they change', async () => {
		const user = userEvent.setup();
		const props = reactive<{ count: number; index: number | undefined }>({ count: 3, index: undefined });
		render(CarouselChildren, { props });
		expect(panels().map((p) => p.getAttribute('aria-label'))).toEqual(['1 of 3', '2 of 3', '3 of 3']);
		expect(tabs()).toHaveLength(3);
		expect(tabs()[0]?.hasAttribute('aria-controls')).toBe(false);
		await user.click(screen.getByRole('button', { name: 'Next slide' }));
		expect(props.index).toBe(1);
		props.count = 4;
		await vi.waitFor(() => expect(tabs()).toHaveLength(4));
		expect(panels()[3]?.getAttribute('aria-label')).toBe('4 of 4');
	});

	it('reads slides assigned to a slot (the custom element) and renders nothing without slides', async () => {
		render(Carousel, { children: createRawSnippet(() => ({ render: () => '<slot></slot>' })) });
		await flush();
		expect(track().querySelector('slot')).toBeTruthy();
		expect(screen.queryByRole('tablist')).toBeNull();
		const { unmount } = render(Carousel, { children: textSnippet('Single'), label: 'Other' });
		expect(screen.getByText('Single').getAttribute('role')).toBe('tabpanel');
		unmount();
	});
});
