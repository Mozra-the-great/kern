import { useState } from 'react';
import type { KModalElement } from '@mozra-the-great/kern/elements';
import { handled, track, useCommits } from '../harness';

/** Modal, drawer and popover whose `open` is React state; the page reacts to `close`/`toggle` only. */
export function Overlays() {
	const [modal, setModal] = useState(false);
	const [text, setText] = useState('');
	const [blocking, setBlocking] = useState(false);
	const [guarded, setGuarded] = useState(false);
	const [sticky, setSticky] = useState(false);
	const [drawer, setDrawer] = useState(false);
	const [pop, setPop] = useState(false);
	const [cancels, setCancels] = useState(0);
	useCommits('overlays');

	return (
		<div>
			<k-button id="open-modal" onclick={() => setModal(true)}>
				Open modal
			</k-button>
			<k-button id="open-blocking" onclick={() => setBlocking(true)}>
				Open blocking
			</k-button>
			<k-button id="open-guarded" onclick={() => setGuarded(true)}>
				Open guarded
			</k-button>
			<k-button id="open-drawer" onclick={() => setDrawer(true)}>
				Open drawer
			</k-button>
			<button id="close-modal-from-react" type="button" onClick={() => setModal(false)}>
				Close modal from React
			</button>
			<button id="close-drawer-from-react" type="button" onClick={() => setDrawer(false)}>
				Close drawer from React
			</button>

			<k-modal
				id="modal"
				ref={track<KModalElement>('modal')}
				open={modal}
				title="Delete polish?"
				description="This cannot be undone."
				initialFocus="#modal-input"
				onclose={() => {
					handled('modal', 'close');
					setModal(false);
				}}
				oncancel={() => handled('modal', 'cancel')}
			>
				{/* React-rendered light DOM inside the dialog: a controlled native input and a footer slot. */}
				<input id="modal-input" aria-label="Reason" value={text} onChange={(e) => setText(e.target.value)} />
				<button id="modal-confirm" type="button" onClick={() => setModal(false)}>
					Confirm
				</button>
				<div slot="footer">
					<k-button id="modal-cancel" onclick={() => setModal(false)}>
						Cancel
					</k-button>
				</div>
			</k-modal>

			<k-modal
				id="blocking"
				open={blocking}
				dismissible={false}
				alert
				title="Sync conflict"
				onclose={() => {
					handled('blocking', 'close');
					setBlocking(false);
				}}
				oncancel={() => handled('blocking', 'cancel')}
			>
				<button id="blocking-resolve" type="button" onClick={() => setBlocking(false)}>
					Resolve
				</button>
			</k-modal>

			<k-modal
				id="guarded"
				open={guarded}
				title="Unsaved changes"
				onclose={() => {
					handled('guarded', 'close');
					setGuarded(false);
				}}
				oncancel={(e) => {
					handled('guarded', 'cancel');
					e.preventDefault();
					setCancels((n) => n + 1);
				}}
			>
				<p>
					Asked to close <output id="guarded-cancels">{cancels}</output> times.
				</p>
				<button id="guarded-discard" type="button" onClick={() => setGuarded(false)}>
					Discard
				</button>
			</k-modal>

			{/* The backdrop does not close it: `closeOnBackdrop={false}` is a property; `close-on-backdrop={false}` would only remove an attribute. */}
			<k-modal id="sticky" open={sticky} closeOnBackdrop={false} title="Sticky" onclose={() => setSticky(false)}>
				<button id="sticky-close" type="button" onClick={() => setSticky(false)}>
					Close
				</button>
			</k-modal>
			<k-button id="open-sticky" onclick={() => setSticky(true)}>
				Open sticky
			</k-button>

			<k-drawer
				id="drawer"
				open={drawer}
				title="Filter"
				side="right"
				onclose={() => {
					handled('drawer', 'close');
					setDrawer(false);
				}}
			>
				<button id="drawer-apply" type="button" onClick={() => setDrawer(false)}>
					Apply
				</button>
			</k-drawer>

			<k-popover
				id="pop"
				open={pop}
				label="Details"
				ontoggle={(e) => {
					handled('pop', 'toggle', e.detail);
					setPop(e.detail);
				}}
			>
				<p id="pop-body">Popover text</p>
			</k-popover>
			<button id="open-pop-from-react" type="button" onClick={() => setPop(true)}>
				Open popover from React
			</button>
			<output id="overlay-state">{JSON.stringify({ modal, blocking, guarded, drawer, pop })}</output>
		</div>
	);
}
