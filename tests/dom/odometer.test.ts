/**
 * Odometer: the formatted number for assistive technology, one rolling column per digit (`--d`) and plain
 * separators, `format`, `locale` (an invalid one falls back), `duration` as a CSS variable, and new leading
 * columns that start at 0 for two frames and then roll to their digit (not with reduced motion, not when the
 * number gets shorter).
 */
import { render } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Odometer from '../../src/lib/components/Odometer.svelte';
import { setMedia } from './env.js';
import { reactive } from './reactive.svelte.js';

function digits(container: HTMLElement): string[] {
	return [...container.querySelectorAll<HTMLElement>('.cells > *')].map((cell) =>
		cell.classList.contains('col') ? cell.style.getPropertyValue('--d') : `sep:${cell.textContent}`
	);
}

beforeEach(() => {
	vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'setTimeout', 'clearTimeout'] });
});
afterEach(() => {
	vi.useRealTimers();
});

describe('Odometer', () => {
	it('renders a column per digit and separators as text', () => {
		const { container } = render(Odometer, { value: 1234.5, locale: 'en', class: 'extra' });
		const root = container.querySelector<HTMLElement>('.k-odometer');
		expect(root?.classList.contains('extra')).toBe(true);
		expect(root?.style.getPropertyValue('--k-odo-dur')).toBe('700ms');
		expect(container.querySelector('.sr')?.textContent).toBe('1,234.5');
		expect(container.querySelector('.cells')?.getAttribute('aria-hidden')).toBe('true');
		expect(digits(container)).toEqual(['1', 'sep:,', '2', '3', '4', 'sep:.', '5']);
		expect(container.querySelectorAll('.col')[0].querySelectorAll('.digit')).toHaveLength(10);
	});

	it('takes format, duration and an invalid locale', () => {
		const { container } = render(Odometer, { value: 7, format: { minimumIntegerDigits: 3 }, duration: -5, locale: 'not a locale!' });
		expect(container.querySelector('.sr')?.textContent).toBe('007');
		expect(container.querySelector<HTMLElement>('.k-odometer')?.style.getPropertyValue('--k-odo-dur')).toBe('0ms');
	});

	it('new leading columns start at 0 and roll in after two frames', async () => {
		const props = reactive<{ value: number; locale: string }>({ value: 9, locale: 'en' });
		const { container } = render(Odometer, { props });
		props.value = 123;
		await vi.advanceTimersByTimeAsync(0);
		expect(digits(container)).toEqual(['0', '0', '3']);
		await vi.advanceTimersByTimeAsync(40);
		expect(digits(container)).toEqual(['1', '2', '3']);
		props.value = 45;
		await vi.advanceTimersByTimeAsync(0);
		expect(digits(container)).toEqual(['4', '5']);
	});

	it('a separator in a new column stays as it is', async () => {
		const props = reactive<{ value: number; locale: string }>({ value: 999, locale: 'en' });
		const { container } = render(Odometer, { props });
		props.value = 12_345;
		await vi.advanceTimersByTimeAsync(0);
		expect(digits(container)).toEqual(['0', '0', 'sep:,', '3', '4', '5']);
	});

	it('a change before the frames ran cancels them', async () => {
		const props = reactive<{ value: number; locale: string }>({ value: 1, locale: 'en' });
		const { container } = render(Odometer, { props });
		props.value = 10;
		await vi.advanceTimersByTimeAsync(0);
		props.value = 200;
		await vi.advanceTimersByTimeAsync(0);
		expect(digits(container)).toEqual(['0', '0', '0']);
		await vi.advanceTimersByTimeAsync(40);
		expect(digits(container)).toEqual(['2', '0', '0']);
	});

	it('with reduced motion new columns show their digit at once', async () => {
		setMedia('(prefers-reduced-motion: reduce)', true);
		const props = reactive<{ value: number; locale: string }>({ value: 1, locale: 'en' });
		const { container } = render(Odometer, { props });
		props.value = 42;
		await vi.advanceTimersByTimeAsync(0);
		expect(digits(container)).toEqual(['4', '2']);
	});
});
