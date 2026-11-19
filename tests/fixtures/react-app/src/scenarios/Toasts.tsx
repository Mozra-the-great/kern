import { handled, useCommits } from '../harness';

/** A toaster and the buttons that raise toasts through `window.kern.toast` (the page-wide store). */
export function Toasts({ rid }: { rid: string }) {
	useCommits(rid);
	const id = (name: string): string => (rid === 'toasts' ? name : `${rid}-${name}`);

	return (
		<div>
			<k-toaster
				id={id('toaster')}
				position={rid === 'toasts' ? 'bottom-left' : 'top-right'}
				max={3}
				onundo={(e) => handled(id('toaster'), 'undo', e.detail)}
				ondismiss={(e) => handled(id('toaster'), 'dismiss', e.detail)}
				onaction={(e) => handled(id('toaster'), 'action', e.detail)}
			/>
			<button id={id('toast-plain')} type="button" onClick={() => window.kern?.toast({ message: `Saved by ${rid}`, duration: 0 })}>
				Toast
			</button>
			<button
				id={id('toast-undo')}
				type="button"
				onClick={() =>
					window.kern?.toast({
						message: `Deleted by ${rid}`,
						key: 'delete',
						duration: 0,
						onundo: () => handled(rid, 'toast-onundo'),
						oncommit: () => handled(rid, 'toast-oncommit'),
						onclose: (reason) => handled(rid, 'toast-onclose', reason)
					})
				}
			>
				Toast with undo
			</button>
			<button
				id={id('toast-action')}
				type="button"
				onClick={() =>
					window.kern?.toast({
						message: `Archived by ${rid}`,
						duration: 0,
						action: { label: 'Open', onclick: () => handled(rid, 'toast-action') }
					})
				}
			>
				Toast with action
			</button>
			<button id={id('toast-clear')} type="button" onClick={() => window.kern?.toast.clear()}>
				Clear toasts
			</button>
		</div>
	);
}
