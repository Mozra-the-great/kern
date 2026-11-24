/**
 * HistoryBar: the uptime summary (truncated percentage, placeholders, no-data text, locale), the legend,
 * the start and end texts, the grid of bars with spoken names and a roving tab stop on the newest bar,
 * arrow/Home/End navigation, the tooltip on focus and hover (hidden by Escape, blur, pointer leave and
 * scrolling), status-name overrides and scrolling to the newest period.
 */
import { fireEvent } from '@testing-library/dom';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import HistoryBar, { type HistoryItem } from '../../src/lib/components/HistoryBar.svelte';
import { flush } from './helpers.js';
import { reactive } from './reactive.svelte.js';

afterEach(() => {
	vi.restoreAllMocks();
});

function days(): HistoryItem[] {
	return [
		{ label: 'Mon', status: 'ok' },
		{ label: 'Tue', status: 'warn', detail: '2 min slow' },
		{ label: 'Wed', status: 'down' },
		{ label: 'Thu', status: 'none' },
		{ label: 'Fri', status: 'ok' }
	];
}

function cells(): HTMLElement[] {
	return screen.getAllByRole('gridcell');
}
function tip(): HTMLElement | null {
	return document.querySelector('.tip');
}

describe('HistoryBar', () => {
	it('summarises the periods with data and names the grid', () => {
		render(HistoryBar, { items: days(), label: 'Uptime', locale: 'en' });
		const grid = screen.getByRole('grid', { name: 'Uptime' });
		const summary = document.querySelector('.summary');
		expect(summary?.textContent).toBe('50.0 % ok');
		expect(grid.getAttribute('aria-describedby')).toBe(summary?.id);
		expect(cells().map((c) => c.getAttribute('aria-label'))).toEqual([
			'Mon: OK',
			'Tue: Degraded, 2 min slow',
			'Wed: Down',
			'Thu: No data',
			'Fri: OK'
		]);
		expect(cells().map((c) => c.dataset.status)).toEqual(['ok', 'warn', 'down', 'none', 'ok']);
		expect(cells().map((c) => c.tabIndex)).toEqual([-1, -1, -1, -1, 0]);
		expect(Array.from(document.querySelectorAll('.legend li')).map((li) => li.textContent)).toEqual(['OK', 'Degraded', 'Down', 'No data']);
		expect(document.querySelector('.ends')).toBeNull();
		expect(tip()).toBeNull();
	});

	it('truncates so one failure never shows 100 %', () => {
		const items: HistoryItem[] = Array.from({ length: 1000 }, (_, i) => ({ label: `d${i}`, status: i === 0 ? 'down' : 'ok' }));
		render(HistoryBar, { items, label: 'Uptime', locale: 'en' });
		expect(document.querySelector('.summary')?.textContent).toBe('99.9 % ok');
	});

	it('uses the custom summary, no-data text, status names, ends, locale and class', () => {
		const props = reactive<{ items: HistoryItem[]; label: string }>({ items: days(), label: 'Uptime' });
		render(HistoryBar, {
			props: Object.assign(props, {
				summaryLabel: '{ok} of {total} ({percent} %) {unknown}',
				noDataLabel: 'Nothing yet',
				statusLabels: { ok: 'Fine', down: undefined },
				startLabel: '5 days ago',
				endLabel: 'Today',
				legend: false,
				locale: 'de',
				class: 'extra'
			})
		});
		expect(document.querySelector('.summary')?.textContent).toBe('2 of 4 (50,0 %) {unknown}');
		expect(document.querySelector('.legend')).toBeNull();
		expect(document.querySelector('.k-history')?.classList.contains('extra')).toBe(true);
		expect(document.querySelector('.ends')?.textContent).toBe('5 days agoToday');
		expect(cells()[0].getAttribute('aria-label')).toBe('Mon: Fine');
		expect(cells()[2].getAttribute('aria-label')).toBe('Wed: Down');
	});

	it('shows one end text alone', () => {
		render(HistoryBar, { items: days(), label: 'Uptime', endLabel: 'Today' });
		expect(document.querySelector('.ends')?.textContent).toBe('Today');
	});

	it('shows only the start text', () => {
		render(HistoryBar, { items: days(), label: 'Uptime', startLabel: 'Then' });
		expect(document.querySelector('.ends')?.textContent).toBe('Then');
	});

	it('says when no period has data, by default and with a custom text', async () => {
		const props = reactive<{ items: HistoryItem[]; label: string; noDataLabel?: string | undefined }>({
			items: [{ label: 'Mon', status: 'none' }],
			label: 'Uptime',
			noDataLabel: undefined
		});
		render(HistoryBar, { props });
		expect(document.querySelector('.summary')?.textContent).toBe('No data');
		props.noDataLabel = 'Empty';
		await vi.waitFor(() => expect(document.querySelector('.summary')?.textContent).toBe('Empty'));
	});

	it('renders no tab stop without items', () => {
		render(HistoryBar, { items: [], label: 'Uptime' });
		expect(screen.queryAllByRole('gridcell')).toHaveLength(0);
		expect(document.querySelector('.summary')?.textContent).toBe('No data');
	});

	it('moves between bars with the arrow keys, Home and End, clamped at the ends', async () => {
		const user = userEvent.setup();
		render(HistoryBar, { items: days(), label: 'Uptime' });
		await user.tab();
		expect(document.activeElement).toBe(cells()[4]);
		await user.keyboard('{ArrowRight}');
		expect(document.activeElement).toBe(cells()[4]);
		await user.keyboard('{ArrowLeft}');
		expect(document.activeElement).toBe(cells()[3]);
		expect(cells()[3].tabIndex).toBe(0);
		expect(cells()[4].tabIndex).toBe(-1);
		await user.keyboard('{Home}');
		expect(document.activeElement).toBe(cells()[0]);
		await user.keyboard('{ArrowLeft}');
		expect(document.activeElement).toBe(cells()[0]);
		await user.keyboard('{End}');
		expect(document.activeElement).toBe(cells()[4]);
	});

	it('ignores modified keys, other keys and keys outside a bar', () => {
		render(HistoryBar, { items: days(), label: 'Uptime' });
		const last = cells()[4];
		last.focus();
		for (const mod of ['altKey', 'ctrlKey', 'metaKey'] as const) expect(fireEvent.keyDown(last, { key: 'Home', [mod]: true })).toBe(true);
		expect(fireEvent.keyDown(last, { key: 'a' })).toBe(true);
		expect(fireEvent.keyDown(screen.getByRole('row'), { key: 'Home' })).toBe(true);
		expect(document.activeElement).toBe(last);
	});

	it('shows the tooltip of the focused bar; Escape and blur hide it', async () => {
		const user = userEvent.setup();
		render(HistoryBar, { items: days(), label: 'Uptime' });
		await user.tab();
		await user.keyboard('{Home}{ArrowRight}');
		await flush();
		expect(tip()?.textContent).toContain('Tue');
		expect(tip()?.querySelector('.detail')?.textContent).toBe('2 min slow');
		expect(tip()?.getAttribute('aria-hidden')).toBe('true');
		await user.keyboard('{Escape}');
		expect(tip()).toBeNull();
		await user.keyboard('{ArrowLeft}');
		await flush();
		expect(tip()?.textContent).toContain('Mon');
		expect(tip()?.querySelector('.detail')).toBeNull();
		await user.tab();
		expect(tip()).toBeNull();
	});

	it('places the tooltip at the bar, clamped inside the component', async () => {
		vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
			const i = this.dataset.i;
			const left = i === undefined ? 0 : Number(i) * 20;
			const width = i === undefined ? 100 : 20;
			return { left, right: left + width, width, top: i === undefined ? 0 : 30, bottom: 50, height: 20, x: left, y: 0, toJSON: () => ({}) };
		});
		vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(60);
		render(HistoryBar, { items: days(), label: 'Uptime' });
		cells()[2].focus();
		await vi.waitFor(() => expect(tip()?.style.left).toBe('50px'));
		expect(tip()?.style.top).toBe('30px');
		cells()[4].focus();
		await vi.waitFor(() => expect(tip()?.style.left).toBe('70px'));
	});

	it('shows the tooltip on hover and hides it when the pointer leaves or the bars scroll', async () => {
		render(HistoryBar, { items: days(), label: 'Uptime' });
		const grid = screen.getByRole('grid');
		fireEvent.pointerOver(cells()[2].querySelector('.fill') ?? cells()[2]);
		await vi.waitFor(() => expect(tip()?.textContent).toContain('Wed'));
		fireEvent.pointerLeave(grid);
		await flush();
		expect(tip()).toBeNull();
		fireEvent.pointerOver(screen.getByRole('row'));
		await flush();
		expect(tip()).toBeNull();
		fireEvent.pointerOver(cells()[0]);
		await vi.waitFor(() => expect(tip()).not.toBeNull());
		fireEvent.scroll(document.querySelector('.scroll') ?? grid);
		await flush();
		expect(tip()).toBeNull();
	});

	it('focus on the grid itself shows no tooltip', async () => {
		render(HistoryBar, { items: days(), label: 'Uptime' });
		fireEvent.focusIn(screen.getByRole('row'));
		await flush();
		expect(tip()).toBeNull();
	});

	it('a tooltip for a bar that is gone is dropped; a newer one wins over an older one', async () => {
		const props = reactive<{ items: HistoryItem[]; label: string }>({ items: days(), label: 'Uptime' });
		render(HistoryBar, { props });
		fireEvent.pointerOver(cells()[4]);
		fireEvent.pointerOver(cells()[1]);
		await vi.waitFor(() => expect(tip()?.textContent).toContain('Tue'));
		fireEvent.pointerOver(cells()[4]);
		fireEvent.pointerLeave(screen.getByRole('grid'));
		await flush();
		expect(tip()).toBeNull();
		fireEvent.pointerOver(cells()[4]);
		await vi.waitFor(() => expect(tip()?.textContent).toContain('Fri'));
		props.items = days().slice(0, 2);
		await vi.waitFor(() => expect(tip()).toBeNull());
		expect(cells()[1].tabIndex).toBe(0);
	});

	it('scrolls to the newest period when the items change', async () => {
		vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(500);
		const props = reactive<{ items: HistoryItem[]; label: string }>({ items: days(), label: 'Uptime' });
		render(HistoryBar, { props });
		const scroller = document.querySelector<HTMLElement>('.scroll');
		expect(scroller?.scrollLeft).toBe(500);
		if (scroller) scroller.scrollLeft = 0;
		props.items = [...days(), { label: 'Sat', status: 'ok' }];
		await vi.waitFor(() => expect(scroller?.scrollLeft).toBe(500));
	});
});
