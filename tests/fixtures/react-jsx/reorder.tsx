// Type-level fixture (never run): <k-sortable-list> and <k-select-grid> (#68) as a strict React 19 app
// sees them. Checked by `npm run test:types`.
import { useState } from 'react';
import '@mozra-the-great/kern/elements';
import { announce } from '@mozra-the-great/kern/elements/live-announcer';
import type {} from '@mozra-the-great/kern/elements/react';
import type { KSelectGridEvents, KSortableListEvents, SelectGridItem, SortableItem } from '@mozra-the-great/kern/elements';

function moved<T>(items: T[], from: number, to: number): T[] {
	const next = [...items];
	const [item] = next.splice(from, 1);
	if (item !== undefined) next.splice(to, 0, item);
	return next;
}

export function Reorder() {
	const [files, setFiles] = useState<SortableItem[]>([
		{ id: 'a', label: 'Report.pdf', description: '3 pages' },
		{ id: 2, label: 'Invoice.pdf' }
	]);
	const [pages, setPages] = useState<SelectGridItem[]>([
		{ id: 1, label: 'Page 1', src: '/p1.png' },
		{ id: 'two', label: 'Page 2', description: 'turned' }
	]);
	const [selected, setSelected] = useState<Array<string | number>>([1]);

	const onMove = (e: KSortableListEvents['move']) => {
		const { from, to } = e.detail;
		setFiles(moved(files, from, to));
		announce(`${files[from]?.label ?? ''} moved to position ${to + 1} of ${files.length}`);
	};
	const onRemove = (e: KSortableListEvents['remove']) => setFiles(files.filter((_, i) => i !== e.detail.index));
	const onChange = (e: KSelectGridEvents['change']) => setSelected(e.detail);

	return (
		<div>
			<k-sortable-list items={files} label="Files" onmove={onMove} onremove={onRemove} />
			<k-sortable-list
				items={files}
				up-text="Nach oben"
				down-text="Nach unten"
				remove-text="Entfernen"
				up-label="{name} nach oben verschieben"
				down-label="{name} nach unten verschieben"
				remove-label="{name} entfernen"
				removable="false"
				drag-drop={'false'}
			/>
			<k-select-grid
				items={pages}
				selected={selected}
				label="Pages"
				min="120px"
				reorderable
				caption="false"
				reorder-hint="Alt plus arrow keys move the item"
				onchange={onChange}
				onmove={(e) => setPages(moved(pages, e.detail.from, e.detail.to))}
			/>
			{/* @ts-expect-error an item needs an id */}
			<k-sortable-list items={[{ label: 'No id' }]} />
			{/* @ts-expect-error selected lists ids (string or number) */}
			<k-select-grid items={pages} selected={[true]} />
			{/* @ts-expect-error the change detail is the list of ids */}
			<k-select-grid onchange={(e) => e.detail.from} />
			{/* @ts-expect-error the remove detail has an index */}
			<k-sortable-list onremove={(e) => e.detail.from} />
		</div>
	);
}
