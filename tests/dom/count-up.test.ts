/**
 * CountUp: the final number for assistive technology and as the width reserve, counting from `from` to `value`
 * once in view (or at once with `startInView: false`), whole numbers without fractions, `format` and `locale`,
 * a new value counting on from the shown number, `duration: 0`, reduced motion, `oncomplete`, and stopping
 * when unmounted.
 */
import { render } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CountUp from '../../src/lib/components/CountUp.svelte';
import { setMedia, triggerIntersection } from './env.js';
import { reactive } from './reactive.svelte.js';

function live(container: HTMLElement): string {
	return container.querySelector('.live')?.textContent ?? '';
}
function root(container: HTMLElement): Element {
	const el = container.querySelector('.k-countup');
	if (!el) throw new Error('no countup');
	return el;
}

beforeEach(() => {
	vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame', 'performance', 'Date'] });
});
afterEach(() => {
	vi.useRealTimers();
});

describe('CountUp', () => {
	it('waits at `from` until in view, then counts up and completes', async () => {
		const oncomplete = vi.fn();
		const { container } = render(CountUp, { value: 100, from: 10, duration: 1000, locale: 'en', oncomplete, class: 'extra' });
		expect(root(container).classList.contains('extra')).toBe(true);
		expect(container.querySelector('.sr')?.textContent).toBe('100');
		expect(container.querySelector('.size')?.textContent).toBe('100');
		expect(live(container)).toBe('10');
		triggerIntersection(root(container), false);
		await vi.advanceTimersByTimeAsync(100);
		expect(live(container)).toBe('10');
		triggerIntersection(root(container), true);
		await vi.advanceTimersByTimeAsync(500);
		const mid = Number(live(container));
		expect(mid).toBeGreaterThan(10);
		expect(mid).toBeLessThan(100);
		expect(live(container)).not.toContain('.');
		await vi.advanceTimersByTimeAsync(600);
		expect(live(container)).toBe('100');
		expect(oncomplete).toHaveBeenCalledTimes(1);
	});

	it('startInView=false starts at once; a new value counts on from the shown number', async () => {
		const props = reactive<{ value: number; startInView: boolean; duration: number; locale: string }>({
			value: 50,
			startInView: false,
			duration: 100,
			locale: 'en'
		});
		const { container } = render(CountUp, { props });
		await vi.advanceTimersByTimeAsync(200);
		expect(live(container)).toBe('50');
		props.value = 20;
		await vi.advanceTimersByTimeAsync(50);
		const between = Number(live(container));
		expect(between).toBeLessThan(50);
		expect(between).toBeGreaterThan(20);
		props.value = 30;
		await vi.advanceTimersByTimeAsync(200);
		expect(live(container)).toBe('30');
	});

	it('uses the format and keeps fractions for fractional values', async () => {
		const { container } = render(CountUp, {
			value: 12.5,
			format: { style: 'currency', currency: 'EUR' },
			locale: 'de-DE',
			startInView: false,
			duration: 10
		});
		await vi.advanceTimersByTimeAsync(50);
		expect(live(container).replace(/\s/g, ' ')).toBe('12,50 €');
	});

	it('falls back to the default locale for an invalid one', () => {
		const { container } = render(CountUp, { value: 1234, locale: 'not a locale!', duration: 0, startInView: false });
		expect(container.querySelector('.sr')?.textContent).toMatch(/1.?234/);
	});

	it('duration 0 and an equal start show the value without animating', async () => {
		const oncomplete = vi.fn();
		const zero = render(CountUp, { value: 7, duration: 0, startInView: false, oncomplete });
		await vi.advanceTimersByTimeAsync(0);
		expect(live(zero.container)).toBe('7');
		zero.unmount();
		const same = render(CountUp, { value: 3, from: 3, startInView: false, oncomplete });
		await vi.advanceTimersByTimeAsync(0);
		expect(live(same.container)).toBe('3');
		expect(oncomplete).not.toHaveBeenCalled();
	});

	it('shows the final number with reduced motion', async () => {
		setMedia('(prefers-reduced-motion: reduce)', true);
		const { container } = render(CountUp, { value: 99, startInView: false });
		await vi.advanceTimersByTimeAsync(0);
		expect(live(container)).toBe('99');
	});

	it('stops counting when unmounted', async () => {
		const oncomplete = vi.fn();
		const { unmount } = render(CountUp, { value: 10, startInView: false, duration: 100, oncomplete });
		await vi.advanceTimersByTimeAsync(20);
		unmount();
		await vi.advanceTimersByTimeAsync(500);
		expect(oncomplete).not.toHaveBeenCalled();
	});
});
