// The harness comes first: it patches addEventListener before kern or React register anything.
import { harness, install } from './harness';
import type {} from '@mozra-the-great/kern/elements/react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { scenarios } from './scenarios';

// One React root per scenario, always in StrictMode. `?s=forms,nav` picks the scenarios (default: all but
// `toasts`); `?late` renders before the kern elements are defined (they load on `harness.define()`).
const params = new URLSearchParams(location.search);

install(scenarios, (container, Scenario, rid) => {
	const root = createRoot(container);
	root.render(
		<StrictMode>
			<Scenario rid={rid} />
		</StrictMode>
	);
	return root;
});
harness.define = async () => {
	await import('./kern');
};

if (!params.has('late')) await harness.define();
const wanted = params.get('s')?.split(',') ?? Object.keys(scenarios).filter((name) => name !== 'toasts' && name !== 'example');
for (const name of wanted) if (name) harness.mount(name);
