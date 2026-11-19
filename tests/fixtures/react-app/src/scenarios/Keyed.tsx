import { useState } from 'react';
import { handled, useCommits } from '../harness';

interface Row {
	id: string;
	value: string;
}

/** A keyed list of controlled fields: React reorders the DOM nodes (disconnect + reconnect) and drops rows. */
export function Keyed() {
	const [rows, setRows] = useState<Row[]>([
		{ id: 'a', value: 'first' },
		{ id: 'b', value: 'second' },
		{ id: 'c', value: 'third' }
	]);
	const [show, setShow] = useState(true);
	useCommits('keyed');

	return (
		<div>
			{show && <k-checkbox id="toggle" label="Toggle" checked onchange={(e) => handled('toggle', e.type, e.detail)} />}
			<ul id="keyed">
				{rows.map((row) => (
					<li key={row.id} id={`row-${row.id}`}>
						<k-input
							id={`field-${row.id}`}
							label={`Field ${row.id}`}
							value={row.value}
							onchange={(e) => {
								handled(`field-${row.id}`, e.type, e.detail);
								setRows((list) => list.map((r) => (r.id === row.id ? { ...r, value: e.detail } : r)));
							}}
						/>
					</li>
				))}
			</ul>
			<button id="reverse" type="button" onClick={() => setRows((list) => [...list].reverse())}>
				Reverse
			</button>
			<button id="drop-first" type="button" onClick={() => setRows((list) => list.slice(1))}>
				Drop first
			</button>
			<button id="hide-toggle" type="button" onClick={() => setShow((s) => !s)}>
				Toggle visibility
			</button>
			<output id="keyed-state">{JSON.stringify(rows)}</output>
		</div>
	);
}
