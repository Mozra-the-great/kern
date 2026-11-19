// Type-level fixture (never run): a strict React 19 app using kern custom elements.
// Checked by `npm run test:types` in CI. `@ts-expect-error` lines prove the typings reject misuse.
import { useRef, useState } from 'react';
import '@mozra-the-great/kern/elements';
import '@mozra-the-great/kern/elements/button';
import { toast, dismissToast } from '@mozra-the-great/kern/elements/toaster';
import type {} from '@mozra-the-great/kern/elements/react';
import type { KInputElement, KTabsEvents, TabItem } from '@mozra-the-great/kern/elements';

const tabs: TabItem[] = [
	{ id: 'a', label: 'A' },
	{ id: 'b', label: 'B', disabled: true }
];

export function App() {
	const [name, setName] = useState('');
	const [open, setOpen] = useState(false);
	const [tab, setTab] = useState('a');
	const input = useRef<KInputElement>(null);

	const onTab = (e: KTabsEvents['change']) => setTab(e.detail);

	return (
		<form onSubmit={(e) => e.preventDefault()}>
			<k-input
				ref={input}
				name="name"
				label="Name"
				value={name}
				required
				maxlength={60}
				pattern="[A-Za-z ]+"
				autocomplete="username"
				onchange={(e) => setName(e.detail)}
				oninput={() => input.current?.checkValidity()}
			/>
			<k-modal open={open} title="Delete?" onclose={() => setOpen(false)}>
				<p>Body</p>
				<div slot="footer">
					<k-button variant="danger" onclick={() => setOpen(false)}>
						OK
					</k-button>
				</div>
			</k-modal>
			<k-tabs tabs={tabs} value={tab} onchange={onTab}>
				<div data-tab="a">A</div>
			</k-tabs>
			<k-select options={[{ value: 's', label: 'Small' }]} onchange={(e) => setName(e.detail)} />
			<k-number-input value={null} min={0} onchange={(e) => console.log(e.detail?.toFixed(2))} />
			<k-tree-view nodes={[{ id: 'root', label: 'Root' }]} ontoggle={(e) => console.log(e.detail.id, e.detail.expanded)} />
			<k-copy-button value="x" oncopy-error={() => toast.warn('Copy failed')} />
			<k-button type="submit" onclick={() => dismissToast(toast('Saved'))}>
				Save
			</k-button>
			{/* @ts-expect-error tabs must be TabItem[] (or a JSON string) */}
			<k-tabs tabs={[{ nope: 1 }]} />
			{/* @ts-expect-error the change detail of <k-input> is a string */}
			<k-input onchange={(e) => e.detail.toFixed()} />
			{/* @ts-expect-error kern's change event is `onchange`; React's `onChange` would not get it */}
			<k-input onChange={() => undefined} />
			{/* @ts-expect-error unknown prop */}
			<k-button nope="1" />
		</form>
	);
}

// DOM side: the tag map and typed listeners.
const el = document.createElement('k-date-picker');
el.value = '2026-11-19';
el.addEventListener('change', (e) => console.log(e.detail.slice(0, 4)));
const box = document.querySelector('k-checkbox');
box?.addEventListener('change', (e) => console.log(e.detail === true));
window.kern?.toast.ok('Hi');
