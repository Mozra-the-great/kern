/**
 * RelativeTime: unit choice (seconds to years, cut towards zero), `numeric`, `style`, `locale` (an invalid one
 * falls back to the default), the inputs (Date, epoch ms, ISO text), the `<time>` element with `datetime`, the
 * full date in the title and for assistive technology, `fallback` for invalid values, and the live clock
 * (interval per unit, refresh when the tab becomes visible, a new value measured against a fresh clock).
 */
import { render } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import RelativeTime from '../../src/lib/components/RelativeTime.svelte';
import { reactive } from './reactive.svelte.js';

const NOW = Date.UTC(2026, 0, 15, 12, 0, 0);
const S = 1000;
const MIN = 60 * S;
const H = 60 * MIN;
const D = 24 * H;

function shown(container: HTMLElement): string {
	const time = container.querySelector('time');
	return time?.firstChild?.textContent ?? '';
}

afterEach(() => {
	vi.useRealTimers();
	vi.restoreAllMocks();
});

describe('RelativeTime units', () => {
	it.each([
		[NOW - 5 * S, '5 seconds ago'],
		[NOW, 'now'],
		[NOW - 59 * MIN - 59 * S, '59 minutes ago'],
		[NOW + 2 * H, 'in 2 hours'],
		[NOW - D, 'yesterday'],
		[NOW - 3 * D, '3 days ago'],
		[NOW - 65 * D, '2 months ago'],
		[NOW + 800 * D, 'in 2 years']
	])('%s', (value, text) => {
		const { container } = render(RelativeTime, { value, now: NOW, locale: 'en' });
		expect(shown(container)).toBe(text);
	});
});

describe('RelativeTime output', () => {
	it('renders a <time> with the ISO datetime, the full date as title and for screen readers', () => {
		const { container } = render(RelativeTime, {
			value: new Date(NOW - 2 * D),
			now: new Date(NOW),
			locale: 'en-GB',
			absoluteFormat: { dateStyle: 'short', timeZone: 'UTC' },
			class: 'extra'
		});
		const time = container.querySelector('time');
		expect(time?.classList.contains('k-relative-time')).toBe(true);
		expect(time?.classList.contains('extra')).toBe(true);
		expect(time?.getAttribute('datetime')).toBe(new Date(NOW - 2 * D).toISOString());
		expect(time?.getAttribute('title')).toBe('13/01/2026');
		expect(time?.querySelector('.sr')?.textContent).toBe(', 13/01/2026');
	});

	it('numeric="always" and a short style', () => {
		const { container } = render(RelativeTime, { value: NOW - D, now: NOW, locale: 'en', numeric: 'always', style: 'short' });
		expect(shown(container)).toBe('1 day ago');
	});

	it('reads ISO text and a locale', () => {
		const { container } = render(RelativeTime, { value: '2026-01-15T11:00:00Z', now: '2026-01-15T12:00:00Z', locale: 'de' });
		expect(shown(container)).toBe('vor 1 Stunde');
	});

	it('falls back to the default locale for an invalid one', () => {
		const { container } = render(RelativeTime, { value: NOW - 3 * D, now: NOW, locale: 'not a locale!' });
		expect(shown(container)).toMatch(/3/);
	});

	it('shows the fallback for an invalid value, nothing without one', () => {
		const { container, unmount } = render(RelativeTime, { value: 'garbage', fallback: 'unknown', class: 'x' });
		const span = container.querySelector('span.k-relative-time');
		expect(span?.textContent).toBe('unknown');
		expect(span?.classList.contains('x')).toBe(true);
		expect(container.querySelector('time')).toBeNull();
		unmount();
		const empty = render(RelativeTime, { value: 8.64e15 + 1 });
		expect(empty.container.querySelector('.k-relative-time')).toBeNull();
	});
});

describe('RelativeTime live clock', () => {
	it.each([
		['seconds', 5 * S, 10_000],
		['minutes', 5 * MIN, 30_000],
		['hours', 5 * H, 300_000]
	])('refreshes in step with the unit (%s)', async (_name, ago, step) => {
		vi.useFakeTimers({ now: NOW });
		const { container } = render(RelativeTime, { value: NOW - ago, locale: 'en', numeric: 'always' });
		const before = shown(container);
		vi.advanceTimersByTime(step - 1);
		await vi.advanceTimersByTimeAsync(0);
		expect(shown(container)).toBe(before);
		await vi.advanceTimersByTimeAsync(step * 12);
		expect(shown(container)).not.toBe(before);
	});

	it('refreshes when the tab becomes visible, not when it is hidden', async () => {
		vi.useFakeTimers({ now: NOW });
		const { container } = render(RelativeTime, { value: NOW - 5 * S, locale: 'en' });
		expect(shown(container)).toBe('5 seconds ago');
		vi.setSystemTime(NOW + 2 * D);
		const state = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
		document.dispatchEvent(new Event('visibilitychange'));
		await vi.advanceTimersByTimeAsync(0);
		expect(shown(container)).toBe('5 seconds ago');
		state.mockReturnValue('visible');
		document.dispatchEvent(new Event('visibilitychange'));
		await vi.advanceTimersByTimeAsync(0);
		expect(shown(container)).toBe('2 days ago');
	});

	it('measures a new value against a fresh clock and stops for an invalid one', async () => {
		vi.useFakeTimers({ now: NOW });
		const props = reactive<{ value: number | string; locale: string }>({ value: NOW - 5 * S, locale: 'en' });
		const { container } = render(RelativeTime, { props });
		vi.setSystemTime(NOW + H);
		props.value = NOW + H - 2 * MIN;
		await vi.advanceTimersByTimeAsync(0);
		expect(shown(container)).toBe('2 minutes ago');
		props.value = 'nope';
		await vi.advanceTimersByTimeAsync(0);
		expect(container.querySelector('time')).toBeNull();
	});

	it('a fixed now sets no timer', () => {
		const interval = vi.spyOn(globalThis, 'setInterval');
		render(RelativeTime, { value: NOW, now: NOW });
		expect(interval).not.toHaveBeenCalled();
	});
});
