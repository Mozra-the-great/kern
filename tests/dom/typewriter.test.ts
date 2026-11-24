/**
 * Typewriter: the spoken text (all strings or `label`), the final text without animation (reduced motion), typing
 * with `delay` and `speed`, holding, erasing with `eraseSpeed`, cycling with `loop`, `oncomplete` once at the
 * end, the caret (shape, blinking only while idle, off) and stopping when unmounted.
 */
import { render } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Typewriter from '../../src/lib/components/Typewriter.svelte';
import { setMedia } from './env.js';
import { reactive } from './reactive.svelte.js';

const REDUCE = '(prefers-reduced-motion: reduce)';

function live(container: HTMLElement): string {
	return container.querySelector('.live')?.textContent ?? '';
}
function caretBlinks(container: HTMLElement): boolean | undefined {
	return container.querySelector('.live .k-caret')?.classList.contains('blink');
}

beforeEach(() => {
	vi.useFakeTimers();
});
afterEach(() => {
	vi.useRealTimers();
});

describe('Typewriter', () => {
	it('types one string after the delay, then completes once and keeps it', async () => {
		const oncomplete = vi.fn();
		const { container } = render(Typewriter, { text: 'Hi!', speed: 100, delay: 50, oncomplete, class: 'extra' });
		expect(container.querySelector('.k-typewriter')?.classList.contains('extra')).toBe(true);
		expect(container.querySelector('.sr')?.textContent).toBe('Hi!');
		expect(live(container)).toBe('');
		await vi.advanceTimersByTimeAsync(50);
		expect(live(container)).toBe('H');
		expect(caretBlinks(container)).toBe(false);
		await vi.advanceTimersByTimeAsync(100);
		expect(live(container)).toBe('Hi');
		await vi.advanceTimersByTimeAsync(200);
		expect(live(container)).toBe('Hi!');
		expect(oncomplete).toHaveBeenCalledTimes(1);
		expect(caretBlinks(container)).toBe(true);
		await vi.advanceTimersByTimeAsync(10_000);
		expect(live(container)).toBe('Hi!');
		expect(oncomplete).toHaveBeenCalledTimes(1);
	});

	it('types, holds, erases and replaces several strings; the last one stays', async () => {
		const oncomplete = vi.fn();
		const { container } = render(Typewriter, { text: ['ab', 'cd'], speed: 10, eraseSpeed: 5, hold: 300, oncomplete, label: 'Greeting' });
		expect(container.querySelector('.sr')?.textContent).toBe('Greeting');
		expect([...container.querySelectorAll('.size')].map((s) => s.textContent)).toEqual(['ab', 'cd']);
		await vi.advanceTimersByTimeAsync(20);
		expect(live(container)).toBe('ab');
		await vi.advanceTimersByTimeAsync(299);
		expect(live(container)).toBe('ab');
		await vi.advanceTimersByTimeAsync(1);
		expect(live(container)).toBe('a');
		await vi.advanceTimersByTimeAsync(10);
		expect(live(container)).toBe('');
		await vi.advanceTimersByTimeAsync(100 + 20);
		expect(live(container)).toBe('cd');
		expect(oncomplete).toHaveBeenCalledTimes(1);
	});

	it('loop cycles forever, erases at half the speed by default, and never completes', async () => {
		const oncomplete = vi.fn();
		const { container } = render(Typewriter, { text: ['x', 'y'], speed: 20, hold: 30, loop: true, oncomplete });
		expect(container.querySelector('.sr')?.textContent).toBe('x. y');
		await vi.advanceTimersByTimeAsync(20);
		expect(live(container)).toBe('x');
		await vi.advanceTimersByTimeAsync(30);
		expect(live(container)).toBe('');
		await vi.advanceTimersByTimeAsync(10 + 10 + 20);
		expect(live(container)).toBe('y');
		await vi.advanceTimersByTimeAsync(30 + 10 + 10 + 20);
		expect(live(container)).toBe('x');
		expect(oncomplete).not.toHaveBeenCalled();
	});

	it('with reduced motion shows the final text at once (the first one with loop)', async () => {
		setMedia(REDUCE, true);
		const one = render(Typewriter, { text: ['first', 'last'] });
		expect(live(one.container)).toBe('last');
		one.unmount();
		const looped = render(Typewriter, { text: ['first', 'last'], loop: true });
		expect(live(looped.container)).toBe('first');
		looped.unmount();
		const empty = render(Typewriter, { text: [] });
		expect(live(empty.container)).toBe('');
	});

	it('jumps to the final text when reduced motion is switched on while typing', async () => {
		const { container } = render(Typewriter, { text: 'hello', speed: 100 });
		await vi.advanceTimersByTimeAsync(100);
		expect(live(container)).toBe('he');
		setMedia(REDUCE, true);
		await vi.advanceTimersByTimeAsync(0);
		expect(live(container)).toBe('hello');
	});

	it('restarts with a new text and clamps negative timings', async () => {
		const props = reactive<{ text: string; speed: number; delay: number; hold: number; eraseSpeed: number }>({
			text: 'ab',
			speed: -5,
			delay: -5,
			hold: -5,
			eraseSpeed: -5
		});
		const { container } = render(Typewriter, { props });
		await vi.runAllTimersAsync();
		expect(live(container)).toBe('ab');
		props.text = 'cde';
		await vi.runAllTimersAsync();
		expect(live(container)).toBe('cde');
	});

	it('the caret takes a shape and can be turned off', () => {
		const shaped = render(Typewriter, { text: 'a', caretShape: 'block' });
		expect(shaped.container.querySelector('.live .k-caret')?.getAttribute('data-shape')).toBe('block');
		expect(shaped.container.querySelector('.size .gap')?.getAttribute('data-shape')).toBe('block');
		shaped.unmount();
		const none = render(Typewriter, { text: 'a', caret: false });
		expect(none.container.querySelector('.k-caret')).toBeNull();
		expect(none.container.querySelector('.gap')).toBeNull();
	});

	it('stops typing when unmounted', async () => {
		const oncomplete = vi.fn();
		const a = render(Typewriter, { text: 'abc', speed: 10, oncomplete });
		await vi.advanceTimersByTimeAsync(10);
		a.unmount();
		await vi.advanceTimersByTimeAsync(1000);
		expect(oncomplete).not.toHaveBeenCalled();
	});

	it('stops while holding and while erasing when unmounted', async () => {
		const holding = render(Typewriter, { text: ['a', 'b'], speed: 10, hold: 100 });
		await vi.advanceTimersByTimeAsync(20);
		holding.unmount();
		await vi.advanceTimersByTimeAsync(1000);
		const erasing = render(Typewriter, { text: ['abc', 'b'], speed: 10, eraseSpeed: 50, hold: 10 });
		await vi.advanceTimersByTimeAsync(30 + 10 + 10);
		expect(live(erasing.container)).toBe('ab');
		erasing.unmount();
		await vi.advanceTimersByTimeAsync(1000);
	});
});
