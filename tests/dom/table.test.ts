/**
 * Table: caption as accessible name (visible or visually hidden), column alignment and mono cells, sortable
 * headers (button, `aria-sort` none / ascending / descending, numeric and string order, missing values), the
 * custom `cell` snippet, the empty row (default and own text) and the stacked layout switch.
 */
import { render, screen, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import Table, { type Column } from '../../src/lib/components/Table.svelte';
import { mapSnippet } from './helpers.js';

interface Row extends Record<string, unknown> {
	name: string | undefined;
	size: number;
	tag?: string | null | undefined;
}

const columns: Column<Row>[] = [
	{ key: 'name', label: 'Name', sortable: true },
	{ key: 'size', label: 'Size', align: 'end', mono: true, sortable: true },
	{ key: 'tag', label: 'Tag', align: 'center' }
];
const rows: Row[] = [
	{ name: 'file10', size: 30, tag: 'b' },
	{ name: 'file2', size: 5, tag: null },
	{ name: undefined, size: 12 }
];

function column(index: number): string[] {
	return screen
		.getAllByRole('row')
		.slice(1)
		.map((row) => within(row).getAllByRole('cell')[index]?.textContent.trim() ?? '');
}

describe('Table', () => {
	it('is named by its caption and renders headers, cells and alignment', () => {
		render(Table<Row>, { columns, rows, caption: 'Files', class: 'mine' });
		const table = screen.getByRole('table', { name: 'Files' });
		expect(table.querySelector('caption')?.classList.contains('sr')).toBe(false);
		expect(document.querySelector('.k-table')?.classList.contains('mine')).toBe(true);
		expect(document.querySelector('.k-table')?.classList.contains('stack')).toBe(true);
		expect(document.querySelector('.k-table')?.classList.contains('sortable')).toBe(true);
		const headers = screen.getAllByRole('columnheader');
		expect(headers.map((h) => h.getAttribute('data-align'))).toEqual(['start', 'end', 'center']);
		expect(headers.map((h) => h.getAttribute('aria-sort'))).toEqual(['none', 'none', null]);
		expect(within(headers[2] as HTMLElement).queryByRole('button')).toBeNull();
		expect(column(0)).toEqual(['file10', 'file2', '']);
		expect(column(2)).toEqual(['b', '', '']);
		const size = screen.getAllByRole('cell')[1] as HTMLElement;
		expect(size.classList.contains('mono')).toBe(true);
		expect(size.dataset['label']).toBe('Size');
		expect(size.dataset['align']).toBe('end');
	});

	it('hides the caption visually, turns stacking off and has no sortable class without sortable columns', () => {
		render(Table<Row>, {
			columns: [{ key: 'name', label: 'Name' }],
			rows,
			caption: 'Files',
			captionHidden: true,
			stack: false
		});
		expect(screen.getByRole('table', { name: 'Files' }).querySelector('caption')?.classList.contains('sr')).toBe(true);
		const root = document.querySelector('.k-table');
		expect(root?.classList.contains('stack')).toBe(false);
		expect(root?.classList.contains('sortable')).toBe(false);
		expect(screen.getByRole('columnheader').getAttribute('data-align')).toBe('start');
	});

	it('without a caption renders none', () => {
		render(Table<Row>, { columns, rows });
		expect(document.querySelector('caption')).toBeNull();
	});

	it('sorts numbers and strings, toggles the direction and moves between columns', async () => {
		const user = userEvent.setup();
		render(Table<Row>, { columns, rows, caption: 'Files' });
		const sizeButton = screen.getByRole('button', { name: 'Size' });
		const nameButton = screen.getByRole('button', { name: 'Name' });
		const [nameHeader, sizeHeader] = screen.getAllByRole('columnheader') as [HTMLElement, HTMLElement];

		await user.click(sizeButton);
		expect(sizeHeader.getAttribute('aria-sort')).toBe('ascending');
		expect(nameHeader.getAttribute('aria-sort')).toBe('none');
		expect(column(1)).toEqual(['5', '12', '30']);
		expect(sizeButton.querySelector('svg')?.classList.contains('active')).toBe(true);
		expect(sizeButton.querySelector('svg')?.classList.contains('desc')).toBe(false);

		await user.click(sizeButton);
		expect(sizeHeader.getAttribute('aria-sort')).toBe('descending');
		expect(column(1)).toEqual(['30', '12', '5']);
		expect(sizeButton.querySelector('svg')?.classList.contains('desc')).toBe(true);

		await user.click(sizeButton);
		expect(sizeHeader.getAttribute('aria-sort')).toBe('ascending');

		// A new column starts ascending again; strings sort numerically and a missing value sorts first.
		await user.click(nameButton);
		expect(nameHeader.getAttribute('aria-sort')).toBe('ascending');
		expect(sizeHeader.getAttribute('aria-sort')).toBe('none');
		expect(column(0)).toEqual(['', 'file2', 'file10']);
		await user.click(nameButton);
		expect(column(0)).toEqual(['file10', 'file2', '']);
	});

	it('sorts mixed types by their string form', async () => {
		const user = userEvent.setup();
		const mixed: Row[] = [
			{ name: 'b', size: 2, tag: 'x' },
			{ name: 'a', size: 1, tag: undefined },
			{ name: 'c', size: 3, tag: 'a' },
			{ name: 'd', size: 4, tag: null }
		];
		render(Table<Row>, {
			columns: [{ key: 'tag', label: 'Tag', sortable: true }],
			rows: mixed
		});
		await user.click(screen.getByRole('button', { name: 'Tag' }));
		expect(column(0)).toEqual(['', '', 'a', 'x']);
	});

	it('renders cells through the cell snippet', () => {
		render(Table<Row>, {
			columns,
			rows: [{ name: 'a', size: 1, tag: 't' }],
			cell: mapSnippet<{ row: Row; column: Column<Row>; value: unknown }>(({ column: c, value }) => `${c.key}=${String(value)}`)
		});
		expect(column(0)).toEqual(['name=a']);
		expect(column(1)).toEqual(['size=1']);
	});

	it('shows the empty row with the default and with its own text', () => {
		const { unmount } = render(Table<Row>, { columns, rows: [] });
		const cell = screen.getByRole('cell');
		expect(cell.textContent.trim()).toBe('No entries');
		expect(cell.getAttribute('colspan')).toBe('3');
		unmount();
		render(Table<Row>, { columns, rows: [], empty: 'Nothing here' });
		expect(screen.getByRole('cell').textContent.trim()).toBe('Nothing here');
	});
});
