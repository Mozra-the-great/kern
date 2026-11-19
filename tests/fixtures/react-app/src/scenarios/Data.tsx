import { useState } from 'react';
import type { DataRowKey, DataSortDir, TableColumn } from '@mozra-the-great/kern/elements';
import { handled, useCommits } from '../harness';

const COLUMNS: TableColumn[] = [
	{ key: 'name', label: 'Name', sortable: true },
	{ key: 'brand', label: 'Brand', sortable: true },
	{ key: 'qty', label: 'Qty', align: 'end', mono: true, sortable: true }
];
const ROWS = [
	{ id: 1, name: 'Mint', brand: 'Essie', qty: 3 },
	{ id: 2, name: 'Berry', brand: 'OPI', qty: 1 },
	{ id: 3, name: 'Night', brand: 'Essie', qty: 5 },
	{ id: 4, name: 'Cloud', brand: 'Zoya', qty: 2 },
	{ id: 5, name: 'Rose', brand: 'OPI', qty: 4 }
];
const MORE_ROWS = [...ROWS, { id: 6, name: 'Sand', brand: 'Zoya', qty: 6 }];

/** A sortable, selectable, paged table and a standalone pagination, both controlled by React state. */
export function Data() {
	const [rows, setRows] = useState(ROWS);
	const [selected, setSelected] = useState<DataRowKey[]>([]);
	const [sort, setSort] = useState<{ key: string | null; dir: DataSortDir }>({ key: null, dir: 'asc' });
	const [page, setPage] = useState(1);
	useCommits('data');

	return (
		<div>
			<k-data-table
				id="table"
				caption="Polishes"
				columns={COLUMNS}
				rows={rows}
				rowKey="id"
				selectable
				selected={selected}
				rowLabelKey="name"
				sortKey={sort.key}
				sortDir={sort.dir}
				pageSize={3}
				onselect={(e) => {
					handled('table', e.type, e.detail);
					setSelected(e.detail);
				}}
				onsort={(e) => {
					handled('table', e.type, e.detail);
					setSort(e.detail);
				}}
			/>
			<k-pagination
				id="pager"
				page={page}
				pageCount={5}
				onchange={(e) => {
					handled('pager', e.type, e.detail);
					setPage(e.detail);
				}}
			/>
			<button id="more-rows" type="button" onClick={() => setRows(MORE_ROWS)}>
				Replace rows
			</button>
			<button id="select-from-react" type="button" onClick={() => setSelected([2, 3])}>
				Select from React
			</button>
			<button id="sort-from-react" type="button" onClick={() => setSort({ key: 'qty', dir: 'desc' })}>
				Sort from React
			</button>
			<button id="page-from-react" type="button" onClick={() => setPage(4)}>
				Page 4 from React
			</button>
			<output id="data-state">{JSON.stringify({ selected, sort, page, rows: rows.length })}</output>
		</div>
	);
}
