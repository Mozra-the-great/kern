/**
 * Marquee in jsdom: the group name, how many hidden copies cover the viewport (measured along the axis, capped,
 * none when nothing was measured), that the copies mirror the content without ids and follow its changes, the
 * pause/play button with `bind:paused` (only while it runs, never under reduced motion), direction, gap, height,
 * fade and hover-pause, the text direction from the page, and slotted content in a shadow root.
 * jsdom has no layout: the size of the content and of the viewport is stubbed.
 */
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { createRawSnippet, tick } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Marquee from '../../src/lib/components/Marquee.svelte';
import { setMedia } from './env.js';
import { flush, textSnippet } from './helpers.js';
import { reactive } from './reactive.svelte.js';

let content = { width: 100, height: 40 };
let room = { width: 350, height: 100 };
const resized: ResizeObserverCallback[] = [];

class RecordingResizeObserver {
	constructor(callback: ResizeObserverCallback) {
		resized.push(callback);
	}
	observe(): void {}
	unobserve(): void {}
	disconnect(): void {}
}

beforeEach(() => {
	content = { width: 100, height: 40 };
	room = { width: 350, height: 100 };
	resized.length = 0;
	vi.stubGlobal('ResizeObserver', RecordingResizeObserver);
	vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
		return this.classList.contains('seq') ? DOMRect.fromRect(content) : DOMRect.fromRect();
	});
	vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function (this: HTMLElement) {
		return this.classList.contains('viewport') ? room.width : 0;
	});
	vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(function (this: HTMLElement) {
		return this.classList.contains('viewport') ? room.height : 0;
	});
});

afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

const root = (): HTMLElement => document.querySelector<HTMLElement>('.k-marquee') as HTMLElement;
const clones = (): HTMLElement[] => Array.from(document.querySelectorAll<HTMLElement>('.clone'));

describe('Marquee', () => {
	it('repeats the content in hidden, inert copies until the viewport is covered and runs', async () => {
		render(Marquee, { children: createRawSnippet(() => ({ render: () => '<span id="news">News</span>' })) });
		await tick();
		expect(root().hasAttribute('role')).toBe(false);
		expect(root().dataset.axis).toBe('x');
		expect(root().classList.contains('running')).toBe(true);
		expect(root().classList.contains('hoverpause')).toBe(true);
		// ceil(350 / 100) + 1 = 5 repeats: the original and 4 copies.
		expect(clones()).toHaveLength(4);
		expect(clones().every((clone) => clone.getAttribute('aria-hidden') === 'true' && clone.hasAttribute('inert'))).toBe(true);
		expect(clones()[0]?.textContent).toBe('News');
		expect(clones()[0]?.querySelector('[id]')).toBeNull();
		expect(screen.getAllByText('News')).toHaveLength(5);
		const track = document.querySelector<HTMLElement>('.track') as HTMLElement;
		expect(track.style.getPropertyValue('--shift')).toBe('100px');
		// 100 px at the default 50 px/s.
		expect(track.style.getPropertyValue('--seconds')).toBe('2s');
		expect(track.classList.contains('reverse')).toBe(false);
		expect(root().style.getPropertyValue('--k-marquee-height')).toBe('16rem');
		expect(root().style.getPropertyValue('--k-marquee-dir')).toBe('ltr');
	});

	it('names the group and uses gap, height, fade, speed and hover-pause it is given', async () => {
		render(Marquee, {
			children: textSnippet('Ticker'),
			label: 'Partners',
			gap: 24,
			height: 200,
			fade: true,
			speed: 1000,
			pauseOnHover: false,
			class: 'extra'
		});
		await tick();
		const group = screen.getByRole('group', { name: 'Partners' });
		expect(group.classList.contains('extra')).toBe(true);
		expect(group.classList.contains('fade')).toBe(true);
		expect(group.classList.contains('hoverpause')).toBe(false);
		expect(group.style.getPropertyValue('--k-marquee-gap')).toBe('24px');
		expect(group.style.getPropertyValue('--k-marquee-height')).toBe('200px');
		// Never faster than half a second per loop.
		expect(document.querySelector<HTMLElement>('.track')?.style.getPropertyValue('--seconds')).toBe('0.5s');
	});

	it('takes CSS lengths for gap and height, and a speed of 0 counts as 1', async () => {
		render(Marquee, { children: textSnippet('Ticker'), gap: '2rem', height: '50vh', speed: 0 });
		await tick();
		expect(root().style.getPropertyValue('--k-marquee-gap')).toBe('2rem');
		expect(root().style.getPropertyValue('--k-marquee-height')).toBe('50vh');
		expect(document.querySelector<HTMLElement>('.track')?.style.getPropertyValue('--seconds')).toBe('100s');
	});

	it('measures along the vertical axis for up and down, and reverses for right and down', async () => {
		const props = reactive<{ children: ReturnType<typeof textSnippet>; direction: 'left' | 'right' | 'up' | 'down' }>({
			children: textSnippet('Item'),
			direction: 'up'
		});
		render(Marquee, { props });
		await tick();
		expect(root().dataset.axis).toBe('y');
		// ceil(100 / 40) + 1 = 4 repeats.
		expect(clones()).toHaveLength(3);
		expect(document.querySelector('.track')?.classList.contains('reverse')).toBe(false);
		props.direction = 'down';
		await tick();
		expect(document.querySelector('.track')?.classList.contains('reverse')).toBe(true);
		props.direction = 'right';
		await tick();
		expect(root().dataset.axis).toBe('x');
		expect(document.querySelector('.track')?.classList.contains('reverse')).toBe(true);
	});

	it('keeps at least two and at most 40 repeats, and none while nothing was measured', async () => {
		content = { width: 1, height: 1 };
		const { unmount } = render(Marquee, { children: textSnippet('Tiny') });
		await tick();
		expect(clones()).toHaveLength(39);
		unmount();
		content = { width: 1000, height: 1000 };
		const big = render(Marquee, { children: textSnippet('Huge') });
		await tick();
		expect(clones()).toHaveLength(1);
		big.unmount();
		content = { width: 0, height: 0 };
		render(Marquee, { children: textSnippet('Empty') });
		await tick();
		expect(clones()).toHaveLength(0);
		expect(root().classList.contains('running')).toBe(false);
		expect(screen.queryByRole('button')).toBeNull();
	});

	it('measures again when the observer reports a resize', async () => {
		render(Marquee, { children: textSnippet('Grows') });
		await tick();
		room = { width: 950, height: 100 };
		for (const callback of resized) callback([], {} as ResizeObserver);
		await tick();
		expect(clones()).toHaveLength(10);
	});

	it('a resize reported after it was unmounted changes nothing', async () => {
		const { unmount } = render(Marquee, { children: textSnippet('Gone') });
		await tick();
		unmount();
		for (const callback of resized) callback([], {} as ResizeObserver);
		await tick();
		expect(document.querySelector('.k-marquee')).toBeNull();
	});

	it('pauses and plays with the button and keeps bind:paused in step', async () => {
		const user = userEvent.setup();
		const props = reactive<{
			children: ReturnType<typeof textSnippet>;
			paused: boolean | undefined;
			pauseLabel: string;
			playLabel: string;
		}>({
			children: textSnippet('Moving'),
			paused: undefined,
			pauseLabel: 'Stop',
			playLabel: 'Go'
		});
		render(Marquee, { props });
		await tick();
		await user.click(screen.getByRole('button', { name: 'Stop' }));
		expect(props.paused).toBe(true);
		expect(root().classList.contains('paused')).toBe(true);
		expect(document.querySelector('.pause path')?.getAttribute('d')).toBe('M5 3l8 5-8 5z');
		await user.click(screen.getByRole('button', { name: 'Go' }));
		expect(props.paused).toBe(false);
		props.paused = true;
		await tick();
		expect(screen.getByRole('button', { name: 'Go' })).toBeTruthy();
	});

	it('uses the catalogue labels, and has no button without pausable or under reduced motion', async () => {
		const props = reactive<{ children: ReturnType<typeof textSnippet>; pausable: boolean }>({
			children: textSnippet('Moving'),
			pausable: true
		});
		render(Marquee, { props });
		await tick();
		await userEvent.setup().click(screen.getByRole('button', { name: 'Pause' }));
		expect(screen.getByRole('button', { name: 'Play' })).toBeTruthy();
		props.pausable = false;
		await tick();
		expect(screen.queryByRole('button')).toBeNull();
		props.pausable = true;
		setMedia('(prefers-reduced-motion: reduce)', true);
		await tick();
		expect(screen.queryByRole('button')).toBeNull();
		expect(root().classList.contains('running')).toBe(false);
	});

	it('reads the text direction of the page', async () => {
		const wrapper = document.createElement('div');
		document.body.append(wrapper);
		render(Marquee, { props: { children: textSnippet('Text') }, target: wrapper });
		root().style.direction = 'rtl';
		for (const callback of resized) callback([], {} as ResizeObserver);
		await tick();
		expect(root().style.getPropertyValue('--k-marquee-dir')).toBe('rtl');
		wrapper.remove();
	});

	it('the copies follow changes of the content', async () => {
		render(Marquee, { children: createRawSnippet(() => ({ render: () => '<span class="live">one</span>' })) });
		await tick();
		const original = document.querySelector('.seq:not(.clone) .live') as HTMLElement;
		original.textContent = 'two';
		await flush();
		expect(clones()[0]?.textContent).toBe('two');
	});

	it('copies slotted content and watches the host inside a shadow root (the custom element)', async () => {
		const host = document.createElement('div');
		document.body.append(host);
		const shadow = host.attachShadow({ mode: 'open' });
		host.innerHTML = '<b>Slotted</b>';
		render(Marquee, {
			props: { children: createRawSnippet(() => ({ render: () => '<slot></slot>' })) },
			target: shadow as unknown as HTMLElement
		});
		await tick();
		const copies = Array.from(shadow.querySelectorAll('.clone'));
		expect(copies.length).toBeGreaterThan(0);
		expect(copies[0]?.textContent).toBe('Slotted');
		host.querySelector('b')?.append(' news');
		await flush();
		expect(shadow.querySelector('.clone')?.textContent).toBe('Slotted news');
		shadow.querySelector('slot')?.dispatchEvent(new Event('slotchange'));
		host.remove();
	});

	it('renders without children', async () => {
		render(Marquee, {});
		await tick();
		expect(document.querySelector('.seq')?.textContent).toBe('');
	});
});
