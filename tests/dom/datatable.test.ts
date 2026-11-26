/**
 * DataTable: caption, the filter field (`bind:query`, every word must match, formatted cell text, back to page
 * 1), the status line (results, filtered, selected, sort order, loading), sortable headers (`bind:sortKey` /
 * `bind:sortDir`, `aria-sort`, `onsort`, numbers and strings), paging (`pageSize`, `bind:page`, the Pagination
 * labels, 0 = all), selection (`selectable`, `bind:selected`, `onselect`, `rowKey`, row labels from
 * `rowLabelKey`, the indeterminate select-all box of the page), loading placeholders, the empty texts, the
 * `cell` snippet and the layout props.
 */
import { render, screen, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import DataTable, { type DataColumn, type DataRowKey, type DataSortDir } from '../../src/lib/components/DataTable.svelte';
import { de } from '../../src/lib/components/strings-de.js';
import { resetStrings, setStrings } from '../../src/lib/components/strings.js';
import { triggerResize } from './env.js';
import { flush, mapSnippet, scrollBox } from './helpers.js';
import { reactive } from './reactive.svelte.js';

interface Row extends Record<string, unknown> {
	id: string;
	name: string;
	size: number;
	owner?: string | null | undefined;
}

const columns: DataColumn<Row>[] = [
	{ key: 'name', label: 'Name', sortable: true },
	{ key: 'size', label: 'Size', align: 'end', mono: true, sortable: true, format: (v) => `${String(v)} KB` },
	{ key: 'owner', label: 'Owner', align: 'center' }
];
const rows: Row[] = [
	{ id: 'r1', name: 'alpha report', size: 30, owner: 'Ada' },
	{ id: 'r2', name: 'beta notes', size: 5, owner: null },
	{ id: 'r3', name: 'gamma report', size: 12 }
];

function bodyRows(): HTMLElement[] {
	const groups = screen.getAllByRole('rowgroup');
	return within(groups[1] as HTMLElement).getAllByRole('row');
}
function column(index: number, offset = 0): string[] {
	return bodyRows().map((r) => r.querySelectorAll('td')[index + offset]?.textContent.trim() ?? '');
}
function status(): string {
	return screen.getAllByRole('status')[0]?.textContent.trim() ?? '';
}

interface State {
	columns: DataColumn<Row>[];
	rows: Row[];
	caption: string;
	query?: string | undefined;
	sortKey?: string | null | undefined;
	sortDir?: DataSortDir | undefined;
	page?: number | undefined;
	pageSize?: number | undefined;
	selected?: DataRowKey[] | undefined;
	selectable?: boolean | undefined;
	rowKey?: 'id' | undefined;
	onselect?: ((keys: DataRowKey[]) => void) | undefined;
	onsort?: ((sort: { key: string; dir: DataSortDir }) => void) | undefined;
	loading?: boolean | undefined;
}

describe('DataTable', () => {
	it('renders the caption, the filter field, formatted cells and the result count', () => {
		render(DataTable<Row>, { columns, rows, caption: 'Files', class: 'mine' });
		const table = screen.getByRole('table', { name: 'Files' });
		expect(table.getAttribute('aria-busy')).toBeNull();
		expect(table.querySelector('caption')?.classList.contains('sr')).toBe(false);
		expect(document.querySelector('.k-datatable')?.classList.contains('mine')).toBe(true);
		expect(document.querySelector('.k-table')?.classList.contains('stack')).toBe(true);
		expect(screen.getByRole('searchbox', { name: 'Filter' }).getAttribute('placeholder')).toBe('');
		expect(column(0)).toEqual(['alpha report', 'beta notes', 'gamma report']);
		expect(column(1)).toEqual(['30 KB', '5 KB', '12 KB']);
		expect(column(2)).toEqual(['Ada', '', '']);
		const size = bodyRows()[0]?.querySelectorAll('td')[1] as HTMLElement;
		expect(size.classList.contains('mono')).toBe(true);
		expect(size.dataset['align']).toBe('end');
		expect(size.dataset['label']).toBe('Size');
		expect(status()).toBe('3 entries');
		const headers = screen.getAllByRole('columnheader');
		expect(headers.map((h) => h.getAttribute('aria-sort'))).toEqual(['none', 'none', null]);
		expect(headers.map((h) => h.dataset['align'])).toEqual(['start', 'end', 'center']);
		expect(screen.queryByRole('navigation')).toBeNull();
	});

	it('hides the caption and the filter field, turns stacking off and uses its own placeholder', () => {
		const { unmount } = render(DataTable<Row>, {
			columns,
			rows,
			caption: 'Files',
			captionHidden: true,
			searchable: false,
			stack: false
		});
		expect(screen.getByRole('table', { name: 'Files' }).querySelector('caption')?.classList.contains('sr')).toBe(true);
		expect(screen.queryByRole('searchbox')).toBeNull();
		expect(document.querySelector('.k-table')?.classList.contains('stack')).toBe(false);
		unmount();
		render(DataTable<Row>, { columns, rows, caption: 'Files', searchPlaceholder: 'Search…', searchLabel: 'Search files' });
		expect(screen.getByRole('searchbox', { name: 'Search files' }).getAttribute('placeholder')).toBe('Search…');
	});

	it('filters by every word over the formatted text, binds the query and resets the page', async () => {
		const user = userEvent.setup();
		const props = reactive<State>({ columns, rows, caption: 'Files', pageSize: 1, page: 2, query: undefined });
		render(DataTable<Row>, { props });
		expect(column(0)).toEqual(['beta notes']);
		await user.type(screen.getByRole('searchbox'), 'REPORT 12');
		expect(props.query).toBe('REPORT 12');
		expect(props.page).toBe(1);
		expect(column(0)).toEqual(['gamma report']);
		expect(status()).toBe('1 of 3 entries');
		await user.type(screen.getByRole('searchbox'), 'x');
		expect(column(0)).toEqual(['No entries match “REPORT 12x”']);
		expect(bodyRows()[0]?.querySelector('td')?.getAttribute('colspan')).toBe('3');
		props.query = 'kb';
		await vi.waitFor(() => expect(status()).toBe('3 of 3 entries'));
	});

	it('uses its own empty and status texts', async () => {
		const props = reactive<State & Record<string, unknown>>({
			columns,
			rows: [],
			caption: 'Files',
			empty: 'Nothing',
			emptyFiltered: 'Nothing for {query}',
			resultsLabel: '{count}/{total}',
			filteredLabel: '{count} hits of {total}'
		});
		render(DataTable<Row>, { props });
		expect(column(0)).toEqual(['Nothing']);
		expect(status()).toBe('0/0');
		props.query = '  zzz  ';
		await vi.waitFor(() => expect(column(0)).toEqual(['Nothing for zzz']));
		expect(status()).toBe('0 hits of 0');
		expect(screen.getByRole('searchbox')).toBeTruthy();
	});

	it('shows the default empty text without rows', () => {
		render(DataTable<Row>, { columns, rows: [], caption: 'Files' });
		expect(column(0)).toEqual(['No entries']);
	});

	it('sorts by a column, toggles the direction, binds it, calls onsort and announces the order', async () => {
		const user = userEvent.setup();
		const onsort = vi.fn();
		const props = reactive<State>({
			columns,
			rows,
			caption: 'Files',
			onsort,
			page: 1,
			pageSize: 2,
			sortKey: undefined,
			sortDir: undefined
		});
		render(DataTable<Row>, { props });
		const [nameHeader, sizeHeader] = screen.getAllByRole('columnheader') as [HTMLElement, HTMLElement];
		const sizeButton = screen.getByRole('button', { name: 'Size' });

		await user.click(sizeButton);
		expect(props.sortKey).toBe('size');
		expect(props.sortDir).toBe('asc');
		expect(onsort).toHaveBeenLastCalledWith({ key: 'size', dir: 'asc' });
		expect(sizeHeader.getAttribute('aria-sort')).toBe('ascending');
		expect(nameHeader.getAttribute('aria-sort')).toBe('none');
		expect(column(1)).toEqual(['5 KB', '12 KB']);
		expect(sizeButton.querySelector('svg')?.classList.contains('active')).toBe(true);
		expect(document.querySelector('.status .sr')?.textContent).toBe('. Sorted by Size, ascending');

		await user.click(screen.getByRole('button', { name: 'Page 2' }));
		expect(props.page).toBe(2);
		await user.click(sizeButton);
		expect(props.sortDir).toBe('desc');
		expect(props.page).toBe(1);
		expect(onsort).toHaveBeenLastCalledWith({ key: 'size', dir: 'desc' });
		expect(sizeHeader.getAttribute('aria-sort')).toBe('descending');
		expect(sizeButton.querySelector('svg')?.classList.contains('desc')).toBe(true);
		expect(column(1)).toEqual(['30 KB', '12 KB']);
		expect(document.querySelector('.status .sr')?.textContent).toBe('. Sorted by Size, descending');

		await user.click(sizeButton);
		expect(props.sortDir).toBe('asc');

		await user.click(screen.getByRole('button', { name: 'Name' }));
		expect(props.sortKey).toBe('name');
		expect(props.sortDir).toBe('asc');
		expect(column(0)).toEqual(['alpha report', 'beta notes']);
	});

	it('sorts from bound props, by the string form of mixed and missing values, with its own labels', async () => {
		const props = reactive<State & Record<string, unknown>>({
			columns,
			rows,
			caption: 'Files',
			sortKey: 'owner',
			sortDir: 'desc',
			sortedLabel: '{column}: {direction}',
			descendingLabel: 'down',
			ascendingLabel: 'up'
		});
		render(DataTable<Row>, { props });
		expect(column(2)).toEqual(['Ada', '', '']);
		expect(document.querySelector('.status .sr')?.textContent).toBe('. Owner: down');
		props.sortDir = undefined;
		await vi.waitFor(() => expect(column(2)).toEqual(['', '', 'Ada']));
		expect(document.querySelector('.status .sr')?.textContent).toBe('. Owner: up');
		// A sort key that is not a column sorts but announces nothing.
		props.sortKey = 'id';
		await vi.waitFor(() => expect(document.querySelector('.status .sr')).toBeNull());
		expect(column(0)).toEqual(['alpha report', 'beta notes', 'gamma report']);
	});

	it('pages the rows with its own pagination labels and clamps the page', async () => {
		const user = userEvent.setup();
		const props = reactive<State & Record<string, unknown>>({
			columns,
			rows,
			caption: 'Files',
			pageSize: 2,
			page: 9,
			paginationLabel: 'Pages',
			prevLabel: 'Back',
			nextLabel: 'On',
			pageLabel: 'P',
			ofLabel: 'von'
		});
		render(DataTable<Row>, { props });
		const nav = screen.getByRole('navigation', { name: 'Pages' });
		expect(column(0)).toEqual(['gamma report']);
		await user.click(within(nav).getByRole('button', { name: 'Back' }));
		expect(props.page).toBe(1);
		expect(column(0)).toEqual(['alpha report', 'beta notes']);
		expect(within(nav).getByRole('button', { name: 'P 1' }).getAttribute('aria-current')).toBe('page');
		await user.click(within(nav).getByRole('button', { name: 'On' }));
		expect(props.page).toBe(2);
		props.pageSize = 0;
		await vi.waitFor(() => expect(screen.queryByRole('navigation')).toBeNull());
		expect(column(0)).toHaveLength(3);
	});

	it('uses the default pagination label and treats an invalid page size as all rows', async () => {
		const props = reactive<State>({ columns, rows, caption: 'Files', pageSize: 2, page: Number.NaN });
		render(DataTable<Row>, { props });
		expect(screen.getByRole('navigation', { name: 'Table pagination' })).toBeTruthy();
		expect(column(0)).toEqual(['alpha report', 'beta notes']);
		props.pageSize = Number.NaN;
		await vi.waitFor(() => expect(column(0)).toHaveLength(3));
	});

	it('selects rows by key, binds the selection, calls onselect and drives the select-all box', async () => {
		const user = userEvent.setup();
		const onselect = vi.fn();
		const props = reactive<State>({
			columns,
			rows,
			caption: 'Files',
			selectable: true,
			rowKey: 'id',
			onselect,
			pageSize: 2,
			selected: undefined
		});
		render(DataTable<Row>, { props });
		const all = screen.getByRole('checkbox', { name: 'Select all rows on this page' }) as HTMLInputElement;
		expect(all.checked).toBe(false);
		expect(all.indeterminate).toBe(false);
		expect(all.disabled).toBe(false);
		const alpha = screen.getByRole('checkbox', { name: 'Select alpha report' });
		await user.click(alpha);
		expect(props.selected).toEqual(['r1']);
		expect(onselect).toHaveBeenLastCalledWith(['r1']);
		expect(alpha.closest('tr')?.classList.contains('selected')).toBe(true);
		expect(all.indeterminate).toBe(true);
		expect(all.parentElement?.querySelector('svg path')?.getAttribute('d')).toBe('M4 8h8');
		expect(status()).toBe('3 entries · 1 selected');

		await user.click(all);
		expect(props.selected).toEqual(['r1', 'r2']);
		expect(all.checked).toBe(true);
		expect(all.indeterminate).toBe(false);

		// The selection is kept across pages; select-all only touches the current page.
		await user.click(screen.getByRole('button', { name: 'Page 2' }));
		expect(all.checked).toBe(false);
		await user.click(all);
		expect(props.selected).toEqual(['r1', 'r2', 'r3']);
		await user.click(all);
		expect(props.selected).toEqual(['r1', 'r2']);

		await user.click(screen.getByRole('button', { name: 'Page 1' }));
		await user.click(screen.getByRole('checkbox', { name: 'Select beta notes' }));
		expect(props.selected).toEqual(['r1']);
	});

	it('keys rows by their position without rowKey and names them by rowLabelKey', async () => {
		const user = userEvent.setup();
		const props = reactive<State & { rowLabelKey: 'owner' }>({
			columns,
			rows,
			caption: 'Files',
			selectable: true,
			rowLabelKey: 'owner',
			selected: [2]
		});
		render(DataTable<Row>, {
			props: Object.assign(props, { selectRowLabel: 'Pick {row}', selectedLabel: '{count} picked', selectAllLabel: 'All' })
		});
		expect(screen.getByRole('checkbox', { name: 'Pick Ada' })).toBeTruthy();
		expect(screen.getAllByRole('checkbox', { name: 'Pick' })).toHaveLength(2);
		expect(status()).toBe('3 entries · 1 picked');
		await user.click(screen.getByRole('checkbox', { name: 'Pick Ada' }));
		expect(props.selected).toEqual([2, 0]);
		await user.click(screen.getByRole('checkbox', { name: 'All' }));
		expect(props.selected).toEqual([2, 0, 1]);
	});

	it('keys rows by a numeric field and names them by their key without columns', async () => {
		const user = userEvent.setup();
		interface Numbered extends Record<string, unknown> {
			n: number;
		}
		const props = reactive<{
			columns: DataColumn<Numbered>[];
			rows: Numbered[];
			caption: string;
			selectable: boolean;
			rowKey: 'n';
			selected?: DataRowKey[] | undefined;
		}>({
			columns: [],
			rows: [{ n: 7 }],
			caption: 'Numbers',
			selectable: true,
			rowKey: 'n',
			selected: undefined
		});
		render(DataTable<Numbered>, { props });
		await user.click(screen.getByRole('checkbox', { name: 'Select 7' }));
		expect(props.selected).toEqual([7]);
		// Selecting a row that is already selected keeps the list as it is.
		const box = screen.getByRole('checkbox', { name: 'Select 7' }) as HTMLInputElement;
		box.checked = true;
		box.dispatchEvent(new Event('change', { bubbles: true }));
		expect(props.selected).toEqual([7]);
	});

	it('disables select-all on an empty page', () => {
		render(DataTable<Row>, { columns, rows: [], caption: 'Files', selectable: true });
		const all = screen.getByRole('checkbox') as HTMLInputElement;
		expect(all.disabled).toBe(true);
		expect(all.checked).toBe(false);
		expect(bodyRows()[0]?.querySelector('td')?.getAttribute('colspan')).toBe('4');
	});

	it('shows placeholder rows while loading', async () => {
		const props = reactive<State & { loadingRows?: number | undefined; loadingLabel?: string | undefined }>({
			columns,
			rows,
			caption: 'Files',
			loading: true,
			selectable: true,
			pageSize: 1
		});
		render(DataTable<Row>, { props });
		expect(screen.getByRole('table').getAttribute('aria-busy')).toBe('true');
		expect(status()).toBe('Loading…');
		const placeholders = document.querySelectorAll('tbody tr[aria-hidden="true"]');
		expect(placeholders).toHaveLength(1);
		expect(placeholders[0]?.querySelectorAll('td')).toHaveLength(4);
		expect(screen.queryByRole('navigation')).toBeNull();
		props.loadingRows = 3;
		props.loadingLabel = 'Fetching';
		props.selectable = false;
		await vi.waitFor(() => expect(document.querySelectorAll('tbody tr[aria-hidden="true"]')).toHaveLength(3));
		expect(status()).toBe('Fetching');
		expect(document.querySelector('tbody td.sel')).toBeNull();
		props.loadingRows = undefined;
		props.pageSize = 0;
		await vi.waitFor(() => expect(document.querySelectorAll('tbody tr[aria-hidden="true"]')).toHaveLength(10));
		props.loading = false;
		await vi.waitFor(() => expect(column(0)).toHaveLength(3));
		expect(screen.getByRole('table').getAttribute('aria-busy')).toBeNull();
	});

	it('renders cells through the cell snippet', () => {
		render(DataTable<Row>, {
			columns,
			rows: rows.slice(0, 1),
			caption: 'Files',
			cell: mapSnippet<{ row: Row; column: DataColumn<Row>; value: unknown }>(({ column: c, value }) => `${c.key}:${String(value)}`)
		});
		expect(column(0)).toEqual(['name:alpha report']);
		expect(column(1)).toEqual(['size:30']);
	});
});

describe('DataTable: a wrapper that scrolls without tabbable content (#137)', () => {
	const plain: DataColumn<Row>[] = [
		{ key: 'name', label: 'Name' },
		{ key: 'size', label: 'Size', align: 'end' }
	];
	const wrapper = (): HTMLElement => {
		const el = document.querySelector<HTMLElement>('.k-table');
		if (el === null) throw new Error('no table wrapper');
		return el;
	};
	/** The wrapper is 400px wide and its table 900px. */
	async function overflow(): Promise<void> {
		scrollBox(wrapper(), { clientWidth: 400, scrollWidth: 900 });
		triggerResize(wrapper());
		await flush();
	}

	afterEach(() => {
		resetStrings();
	});

	it('is a tab stop with role region, named by the caption (also a hidden one), while it scrolls sideways', async () => {
		const { unmount } = render(DataTable<Row>, { columns: plain, rows, caption: 'Files', stack: false });
		expect(wrapper().hasAttribute('tabindex')).toBe(false);
		await overflow();
		await vi.waitFor(() => expect(wrapper().getAttribute('tabindex')).toBe('0'));
		const region = screen.getByRole('region', { name: 'Files' });
		expect(region).toBe(wrapper());
		expect(region.getAttribute('aria-labelledby')).toBe(document.querySelector('caption')?.id);
		expect(region.hasAttribute('aria-label')).toBe(false);
		unmount();
		render(DataTable<Row>, { columns: plain, rows, caption: 'Hidden files', captionHidden: true });
		await overflow();
		await vi.waitFor(() => expect(screen.getByRole('region', { name: 'Hidden files' })).toBe(wrapper()));
	});

	it('is named by the catalogue text when the caption is empty, in English and German', async () => {
		const { unmount } = render(DataTable<Row>, { columns: plain, rows, caption: '' });
		await overflow();
		await vi.waitFor(() => expect(screen.getByRole('region', { name: 'Scrollable table' })).toBe(wrapper()));
		unmount();
		setStrings(de);
		render(DataTable<Row>, { columns: plain, rows, caption: '' });
		await overflow();
		await vi.waitFor(() => expect(screen.getByRole('region', { name: 'Scrollbare Tabelle' })).toBe(wrapper()));
	});

	it('is no stop while the table fits, and none where the content spills (stacked rows)', async () => {
		render(DataTable<Row>, { columns: plain, rows, caption: 'Files' });
		scrollBox(wrapper(), { clientWidth: 400, scrollWidth: 400 });
		triggerResize(wrapper());
		await flush();
		expect(wrapper().hasAttribute('tabindex')).toBe(false);
		scrollBox(wrapper(), { clientWidth: 400, scrollWidth: 900 });
		wrapper().style.overflow = 'visible';
		triggerResize(wrapper());
		await flush();
		expect(wrapper().hasAttribute('tabindex')).toBe(false);
		expect(screen.queryByRole('region')).toBeNull();
	});

	it('adds no stop next to a sortable header or the checkboxes of a selectable table', async () => {
		const { unmount } = render(DataTable<Row>, { columns, rows, caption: 'Files', stack: false });
		await overflow();
		expect(wrapper().hasAttribute('tabindex')).toBe(false);
		unmount();
		render(DataTable<Row>, { columns: plain, rows, caption: 'Files', selectable: true, stack: false });
		await overflow();
		expect(wrapper().hasAttribute('tabindex')).toBe(false);
		expect(screen.queryByRole('region')).toBeNull();
	});

	it('follows the content: selection boxes remove the stop, hiding them brings it back', async () => {
		const props = reactive<State>({ columns: plain, rows, caption: 'Files', selectable: false });
		render(DataTable<Row>, { props });
		await overflow();
		await vi.waitFor(() => expect(wrapper().getAttribute('tabindex')).toBe('0'));
		props.selectable = true;
		await vi.waitFor(() => expect(wrapper().hasAttribute('tabindex')).toBe(false));
		props.selectable = false;
		await vi.waitFor(() => expect(wrapper().getAttribute('tabindex')).toBe('0'));
	});

	it('keeps the focus when the table starts to fit while the stop has it: focusable, but not a stop', async () => {
		render(DataTable<Row>, { columns: plain, rows, caption: 'Files', stack: false });
		await overflow();
		await vi.waitFor(() => expect(wrapper().getAttribute('tabindex')).toBe('0'));
		wrapper().focus();
		scrollBox(wrapper(), { clientWidth: 400, scrollWidth: 400 });
		triggerResize(wrapper());
		await vi.waitFor(() => expect(wrapper().getAttribute('tabindex')).toBe('-1'));
		expect(document.activeElement).toBe(wrapper());
		wrapper().blur();
		await vi.waitFor(() => expect(wrapper().hasAttribute('tabindex')).toBe(false));
	});
});
