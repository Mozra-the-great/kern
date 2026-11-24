/**
 * Heatmap: a calendar grid of days (`role="grid"`, rows of weekdays, columns of weeks) named by `label`.
 * Covered: the range from the data or from `start` / `end` (swapped when reversed, capped at ten years), sums of
 * several entries per day, invalid dates and values skipped, levels against the largest value or `max`, cell
 * texts from the default or own template in the locale, weekday and month labels (a short first month loses its
 * name), `weekStart`, the legend and its texts, the empty text, the roving Tab stop (newest day first), the
 * keyboard (arrows by day and week inside the range, Home/End per row, Ctrl+Home/End to the ends), Enter, Space
 * and click call `onselect`, and the tooltip on focus and hover (hidden on Escape, blur, leave and scroll).
 */
import { fireEvent, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import Heatmap, { type HeatmapDatum } from '../../src/lib/components/Heatmap.svelte';
import { flush } from './helpers.js';
import { reactive } from './reactive.svelte.js';

const dayNumber = (iso: string): number =>
	Date.UTC(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10))) / 86_400_000;

function cell(iso: string): HTMLElement {
	const el = document.querySelector<HTMLElement>(`[data-day="${dayNumber(iso)}"]`);
	if (!el) throw new Error(`no cell for ${iso}`);
	return el;
}
function days(): HTMLElement[] {
	return Array.from(document.querySelectorAll<HTMLElement>('[data-day]'));
}
function tipText(): string | undefined {
	return document.querySelector('.tip')?.textContent;
}

// January 2024 starts on a Monday.
const data: HeatmapDatum[] = [
	{ date: '2024-01-01', value: 1 },
	{ date: '2024-01-03T10:00:00Z', value: 2 },
	{ date: '2024-01-03', value: 2 },
	{ date: '2024-01-10', value: 8 },
	{ date: '2024-01-31', value: 0 },
	{ date: '2024-02-30', value: 50 },
	{ date: 'soon', value: 50 },
	{ date: '2024-01-05', value: Number.NaN }
];

describe('Heatmap', () => {
	it('lays out the days of the data range with levels, texts and labels', () => {
		render(Heatmap, { data, label: 'Activity', locale: 'en-US', class: 'mine' });
		const grid = screen.getByRole('grid', { name: 'Activity' });
		expect(document.querySelector('.k-heatmap')?.classList.contains('mine')).toBe(true);
		expect((document.querySelector('.k-heatmap') as HTMLElement).style.getPropertyValue('--cell')).toBe('16px');
		expect(grid.querySelectorAll('[role="row"]')).toHaveLength(7);
		expect(days()).toHaveLength(31);
		expect(cell('2024-01-01').dataset['level']).toBe('1');
		expect(cell('2024-01-03').dataset['level']).toBe('2');
		expect(cell('2024-01-10').dataset['level']).toBe('4');
		expect(cell('2024-01-31').dataset['level']).toBe('0');
		expect(cell('2024-01-05').dataset['level']).toBe('0');
		expect(cell('2024-01-03').getAttribute('aria-label')).toBe('Wed, Jan 3, 2024: 4');
		// Monday first: the first column starts on Jan 1, so it has no padding before it.
		const firstRow = grid.querySelectorAll('[role="row"]')[0] as HTMLElement;
		expect(firstRow.querySelector('.lead')?.textContent).toBe('Mon');
		expect(Array.from(grid.querySelectorAll('[role="row"] .lead')).map((l) => l.textContent)).toEqual([
			'Mon',
			'',
			'Wed',
			'',
			'Fri',
			'',
			''
		]);
		expect(firstRow.firstElementChild?.nextElementSibling).toBe(cell('2024-01-01'));
		expect(Array.from(document.querySelectorAll('.month')).map((m) => m.textContent)).toEqual(['Jan']);
		expect(Array.from(document.querySelectorAll('.legend > span:not(.sw)')).map((s) => s.textContent)).toEqual(['Less', 'More']);
		expect(document.querySelectorAll('.legend .sw')).toHaveLength(5);
		// The newest day holds the Tab stop.
		expect(days().filter((d) => d.tabIndex === 0)).toEqual([cell('2024-01-31')]);
	});

	it('uses start and end, max, its own texts, weekStart, cell size and no legend', () => {
		render(Heatmap, {
			data,
			label: 'Activity',
			locale: 'en-US',
			start: '2024-01-07',
			end: '2024-01-03',
			max: 16,
			weekStart: 0,
			cellLabel: '{value} on {date}',
			legend: false,
			cellSize: 2
		});
		expect(days()).toHaveLength(5);
		expect(cell('2024-01-03').dataset['level']).toBe('1');
		expect(cell('2024-01-03').getAttribute('aria-label')).toBe('4 on Wed, Jan 3, 2024');
		expect(document.querySelector('.legend')).toBeNull();
		expect((document.querySelector('.k-heatmap') as HTMLElement).style.getPropertyValue('--cell')).toBe('8px');
		// Sunday first: the first row is Sunday and Jan 7 (a Sunday) starts the second column.
		const rows = screen.getAllByRole('row');
		expect(rows[0]?.querySelector('.lead')?.textContent).toBe('Sun');
		expect(rows[0]?.querySelectorAll('[data-day]')).toHaveLength(1);
		expect(document.querySelector('[data-day]')).toBeTruthy();
	});

	it('shows legend texts, the month names and drops a first month that is too short for its name', () => {
		const { unmount } = render(Heatmap, {
			data: [],
			label: 'Activity',
			locale: 'en-US',
			start: '2024-01-01',
			end: '2024-03-10',
			lessLabel: 'Low',
			moreLabel: 'High',
			weekStart: Number.NaN
		});
		expect(Array.from(document.querySelectorAll('.month')).map((m) => m.textContent)).toEqual(['Jan', 'Feb', 'Mar']);
		expect(Array.from(document.querySelectorAll('.legend > span:not(.sw)')).map((s) => s.textContent)).toEqual(['Low', 'High']);
		// Every day is empty, so every level is 0.
		expect(days().every((d) => d.dataset['level'] === '0')).toBe(true);
		expect(screen.getAllByRole('row')[0]?.querySelector('.lead')?.textContent).toBe('Sun');
		unmount();
		render(Heatmap, { data: [], label: 'Activity', locale: 'en-US', start: '2024-01-25', end: '2024-03-10' });
		expect(Array.from(document.querySelectorAll('.month')).map((m) => m.textContent)).toEqual(['Feb', 'Mar']);
	});

	it('caps the range at ten years, counting back from the end', () => {
		render(Heatmap, { data: [], label: 'Activity', start: '2000-01-01', end: '2024-12-31' });
		expect(days()).toHaveLength(3660);
		expect(Math.max(...days().map((d) => Number(d.dataset['day'])))).toBe(dayNumber('2024-12-31'));
		expect(Math.min(...days().map((d) => Number(d.dataset['day'])))).toBe(dayNumber('2024-12-31') - 3659);
	});

	it('shows the empty text without a range', () => {
		const { unmount } = render(Heatmap, { data: [], label: 'Activity' });
		expect(screen.queryByRole('grid')).toBeNull();
		expect(document.querySelector('.empty')?.textContent).toBe('No data');
		unmount();
		const second = render(Heatmap, { data: [], label: 'Activity', start: '2024-01-01', emptyLabel: 'Nothing yet' });
		expect(document.querySelector('.empty')?.textContent).toBe('Nothing yet');
		second.unmount();
		render(Heatmap, { data: undefined as unknown as HeatmapDatum[], label: 'Activity', end: '2024-01-01' });
		expect(document.querySelector('.empty')?.textContent).toBe('No data');
	});

	it('moves through the days with the keyboard and stays inside the range', async () => {
		const user = userEvent.setup();
		// Wed 3 Jan to Tue 23 Jan, weeks start on Monday: three full columns plus a partial fourth.
		render(Heatmap, { data: [], label: 'Activity', start: '2024-01-03', end: '2024-01-23' });
		await user.tab();
		expect(document.activeElement).toBe(cell('2024-01-23'));
		await user.keyboard('{ArrowRight}');
		expect(document.activeElement).toBe(cell('2024-01-23'));
		await user.keyboard('{ArrowDown}');
		expect(document.activeElement).toBe(cell('2024-01-23'));
		await user.keyboard('{ArrowLeft}');
		expect(document.activeElement).toBe(cell('2024-01-16'));
		await user.keyboard('{ArrowUp}');
		expect(document.activeElement).toBe(cell('2024-01-15'));
		await user.keyboard('{Home}');
		// The first column starts on Wednesday: Monday clamps to the first day of the range.
		expect(document.activeElement).toBe(cell('2024-01-03'));
		await user.keyboard('{ArrowUp}');
		expect(document.activeElement).toBe(cell('2024-01-03'));
		await user.keyboard('{ArrowDown}{ArrowDown}');
		expect(document.activeElement).toBe(cell('2024-01-05'));
		await user.keyboard('{End}');
		// The last column ends on Tuesday.
		expect(document.activeElement).toBe(cell('2024-01-23'));
		await user.keyboard('{Control>}{Home}{/Control}');
		expect(document.activeElement).toBe(cell('2024-01-03'));
		await user.keyboard('{Control>}{End}{/Control}');
		expect(document.activeElement).toBe(cell('2024-01-23'));
		await user.keyboard('{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowLeft}');
		expect(document.activeElement).toBe(cell('2024-01-03'));
		expect(cell('2024-01-03').tabIndex).toBe(0);
		// Other keys and modified keys do nothing.
		await user.keyboard('x');
		await user.keyboard('{Alt>}{ArrowRight}{/Alt}');
		await user.keyboard('{Meta>}{ArrowRight}{/Meta}');
		expect(document.activeElement).toBe(cell('2024-01-03'));
	});

	it('Enter, Space and click call onselect with the date and value', async () => {
		const user = userEvent.setup();
		const onselect = vi.fn();
		render(Heatmap, { data, label: 'Activity', onselect });
		await user.click(cell('2024-01-03'));
		expect(onselect).toHaveBeenLastCalledWith({ date: '2024-01-03', value: 4 });
		cell('2024-01-10').focus();
		await user.keyboard('{Enter}');
		expect(onselect).toHaveBeenLastCalledWith({ date: '2024-01-10', value: 8 });
		await user.keyboard(' ');
		expect(onselect).toHaveBeenCalledTimes(3);
		onselect.mockClear();
		// Padding cells and the row labels are not days.
		await user.click(document.querySelector('.cell.pad') as HTMLElement);
		await user.click(document.querySelector('[role="row"] .lead') as HTMLElement);
		fireEvent.keyDown(screen.getByRole('grid'), { key: 'Enter' });
		fireEvent.focusIn(screen.getByRole('grid'));
		expect(onselect).not.toHaveBeenCalled();
	});

	it('works without onselect', async () => {
		const user = userEvent.setup();
		render(Heatmap, { data, label: 'Activity' });
		await user.click(cell('2024-01-03'));
		expect(cell('2024-01-03').tabIndex).toBe(0);
	});

	it('shows the tooltip on focus and hover and hides it on Escape, blur, leave and scroll', async () => {
		const user = userEvent.setup();
		const offset = vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(40);
		render(Heatmap, { data, label: 'Activity', locale: 'en-US' });
		cell('2024-01-03').focus();
		await vi.waitFor(() => expect(tipText()).toBe('Wed, Jan 3, 2024: 4'));
		expect(document.querySelector('.tip')?.getAttribute('aria-hidden')).toBe('true');
		await user.keyboard('{Escape}');
		expect(tipText()).toBeUndefined();
		cell('2024-01-10').focus();
		await vi.waitFor(() => expect(tipText()).toBe('Wed, Jan 10, 2024: 8'));
		cell('2024-01-10').blur();
		await vi.waitFor(() => expect(tipText()).toBeUndefined());

		fireEvent.pointerOver(cell('2024-01-01'));
		await vi.waitFor(() => expect(tipText()).toBe('Mon, Jan 1, 2024: 1'));
		fireEvent.pointerOver(document.querySelector('[role="row"] .lead') as HTMLElement);
		await flush();
		expect(tipText()).toBe('Mon, Jan 1, 2024: 1');
		fireEvent.pointerLeave(screen.getByRole('grid'));
		await vi.waitFor(() => expect(tipText()).toBeUndefined());

		fireEvent.pointerOver(cell('2024-01-01'));
		await vi.waitFor(() => expect(tipText()).toBeDefined());
		fireEvent.scroll(document.querySelector('.scroll') as HTMLElement);
		await vi.waitFor(() => expect(tipText()).toBeUndefined());

		// Hovering a second day before the first tooltip settled shows the second one.
		fireEvent.pointerOver(cell('2024-01-01'));
		fireEvent.pointerOver(cell('2024-01-03'));
		await vi.waitFor(() => expect(tipText()).toBe('Wed, Jan 3, 2024: 4'));
		// A tooltip hidden before it settled stays hidden.
		fireEvent.pointerOver(cell('2024-01-01'));
		fireEvent.pointerLeave(screen.getByRole('grid'));
		await flush();
		expect(tipText()).toBeUndefined();
		offset.mockRestore();
	});

	it('drops the tooltip of a day that leaves the range and shows the empty text when the range goes away', async () => {
		const props = reactive<{ data: HeatmapDatum[]; label: string; start?: string | undefined }>({
			data,
			label: 'Activity',
			start: undefined
		});
		render(Heatmap, { props });
		fireEvent.pointerOver(cell('2024-01-01'));
		await vi.waitFor(() => expect(tipText()).toBeDefined());
		props.start = '2024-01-05';
		await vi.waitFor(() => expect(document.querySelector('[data-day]')).toBeTruthy());
		await vi.waitFor(() => expect(tipText()).toBeUndefined());
		props.start = undefined;
		props.data = [];
		await vi.waitFor(() => expect(document.querySelector('.empty')?.textContent).toBe('No data'));
	});

	it('ignores events from text inside the grid', () => {
		render(Heatmap, { data, label: 'Activity' });
		const text = document.querySelector('[role="row"] .lead')?.firstChild as Text;
		text.dispatchEvent(new Event('pointerover', { bubbles: true }));
		expect(tipText()).toBeUndefined();
	});

	it('scrolls to the newest week', () => {
		const width = vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(500);
		render(Heatmap, { data, label: 'Activity' });
		expect((document.querySelector('.scroll') as HTMLElement).scrollLeft).toBe(500);
		width.mockRestore();
	});
});
