/**
 * Timeline: an ordered list named by `label`, one entry per item with its status (default `done`, spoken status
 * from the default or own labels, `aria-current="step"` on the current one, marker per status), the time as a
 * `<time>` for ISO dates and date-times or as plain text otherwise (also for an invalid ISO-like date), the
 * description and the custom `item` snippet.
 */
import { render, screen, within } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Timeline, { type TimelineItem } from '../../src/lib/components/Timeline.svelte';
import { mapSnippet } from './helpers.js';

const items: TimelineItem[] = [
	{ id: 'a', title: 'Ordered', time: '2024-03-05', description: 'Payment received' },
	{ id: 'b', title: 'Shipped', time: '2024-03-06 14:30', status: 'current' },
	{ id: 'c', title: 'Delivered', time: 'tomorrow', status: 'upcoming' },
	{ id: 'd', title: 'Returned', time: '2024-13-45', status: 'error' },
	{ id: 'e', title: 'Archived', status: 'done' }
];

describe('Timeline', () => {
	it('renders a named list with status, time and description', () => {
		render(Timeline, { items, label: 'Order history', locale: 'en-US', class: 'mine' });
		const list = screen.getByRole('list', { name: 'Order history' });
		expect(list.classList.contains('mine')).toBe(true);
		const entries = within(list).getAllByRole('listitem');
		expect(entries.map((e) => e.dataset['status'])).toEqual(['done', 'current', 'upcoming', 'error', 'done']);
		expect(entries.map((e) => e.getAttribute('aria-current'))).toEqual([null, 'step', null, null, null]);
		expect(entries.map((e) => e.querySelector('.sr')?.textContent)).toEqual(['Done:', 'Current:', 'Upcoming:', 'Failed:', 'Done:']);
		const [a, b, c, d, e] = entries as [HTMLElement, HTMLElement, HTMLElement, HTMLElement, HTMLElement];
		expect(a.querySelector('time')?.getAttribute('datetime')).toBe('2024-03-05');
		expect(a.querySelector('time')?.textContent).toBe('Mar 5, 2024');
		expect(a.querySelector('.desc')?.textContent).toBe('Payment received');
		expect(b.querySelector('time')?.getAttribute('datetime')).toBe('2024-03-06T14:30');
		expect(b.querySelector('time')?.textContent).toMatch(/^Mar 6, 2024/);
		expect(b.querySelector('.desc')).toBeNull();
		expect(c.querySelector('time')).toBeNull();
		expect(c.querySelector('span.time')?.textContent).toBe('tomorrow');
		expect(d.querySelector('time')).toBeNull();
		expect(d.querySelector('span.time')?.textContent).toBe('2024-13-45');
		expect(e.querySelector('.time')).toBeNull();
		// One marker per status: check, cross, dot, nothing for upcoming.
		expect(a.querySelector('svg path')).not.toBeNull();
		expect(b.querySelector('svg circle')).not.toBeNull();
		expect(c.querySelector('svg')?.children.length).toBe(0);
		expect(d.querySelector('svg path')?.getAttribute('d')).toBe('M4.5 4.5l7 7M11.5 4.5l-7 7');
	});

	it('uses own status labels and keeps the defaults for the others', () => {
		render(Timeline, { items, statusLabels: { done: 'Finished', error: undefined } });
		const spoken = screen.getAllByRole('listitem').map((e) => e.querySelector('.sr')?.textContent);
		expect(spoken[0]).toBe('Finished:');
		expect(spoken[3]).toBe('Failed:');
		expect(screen.getByRole('list').getAttribute('aria-label')).toBeNull();
	});

	it('renders entries through the item snippet, keeping the spoken status', () => {
		render(Timeline, {
			items: items.slice(0, 2),
			item: mapSnippet<{ item: TimelineItem; index: number }>(({ item, index }) => `${index}: ${item.title}`)
		});
		const entries = screen.getAllByRole('listitem');
		expect(entries.map((e) => e.querySelector('[data-snippet]')?.textContent)).toEqual(['0: Ordered', '1: Shipped']);
		expect(entries[0]?.querySelector('.title')).toBeNull();
		expect(entries[1]?.querySelector('.sr')?.textContent).toBe('Current:');
	});
});
