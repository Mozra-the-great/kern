import { useState } from 'react';
import type { KFileDropElement, SelectGridItem, SortableItem } from '@mozra-the-great/kern/elements';
import { handled, track, useCommits } from '../harness';

const FILES: SortableItem[] = [
	{ id: 'report', label: 'Report.pdf', description: '1 page' },
	{ id: 'invoice', label: 'Invoice.pdf' },
	{ id: 'contract', label: 'Contract.pdf' }
];
const PICTURES: SelectGridItem[] = [
	{ id: 1, label: 'Mint' },
	{ id: 2, label: 'Berry' },
	{ id: 3, label: 'Night' },
	{ id: 4, label: 'Cloud' }
];

/** Moves the item at `from` so that it ends up at `to`, as a new array (the element never reorders itself). */
function moved<T>(list: readonly T[], from: number, to: number): T[] {
	const next = [...list];
	const [item] = next.splice(from, 1);
	if (item !== undefined) next.splice(to, 0, item);
	return next;
}

/** Sortable list, select grid and file drop; React owns `items`, `selected` and the file list. */
export function Lists() {
	const [files, setFiles] = useState(FILES);
	const [pictures, setPictures] = useState(PICTURES);
	const [selected, setSelected] = useState<(string | number)[]>([]);
	const [picked, setPicked] = useState<{ name: string; size: number }[]>([]);
	useCommits('lists');

	return (
		<div>
			<k-sortable-list
				id="list"
				label="Files"
				items={files}
				onmove={(e) => {
					handled('list', e.type, e.detail);
					setFiles((list) => moved(list, e.detail.from, e.detail.to));
				}}
				onremove={(e) => {
					handled('list', e.type, e.detail);
					setFiles((list) => list.filter((_, i) => i !== e.detail.index));
				}}
			/>
			<k-select-grid
				id="grid"
				label="Polishes"
				items={pictures}
				selected={selected}
				reorderable
				onchange={(e) => {
					handled('grid', e.type, e.detail);
					setSelected(e.detail);
				}}
				onmove={(e) => {
					handled('grid', e.type, e.detail);
					setPictures((list) => moved(list, e.detail.from, e.detail.to));
				}}
			/>
			<k-file-drop
				id="drop"
				ref={track<KFileDropElement>('drop')}
				name="docs"
				label="Documents"
				multiple
				onfiles={(e) => {
					handled('drop', e.type, e.detail);
					setPicked(e.detail.map((f) => ({ name: f.name, size: f.size })));
				}}
				onreject={(e) => handled('drop', e.type, e.detail)}
			/>
			<button id="select-from-react" type="button" onClick={() => setSelected([2, 4])}>
				Select from React
			</button>
			<button id="reverse-files" type="button" onClick={() => setFiles((list) => [...list].reverse())}>
				Reverse files
			</button>
			<button id="clear-files" type="button" onClick={() => (document.getElementById('drop') as KFileDropElement).reset()}>
				Clear files
			</button>
			<output id="lists-state">
				{JSON.stringify({ files: files.map((f) => f.id), pictures: pictures.map((p) => p.id), selected, picked })}
			</output>
		</div>
	);
}
