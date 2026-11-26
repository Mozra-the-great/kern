/**
 * Hit target of `<k-checkbox>`, `<k-switch>` and `<k-radio-group>` (#150), in the eight theme variants and in
 * forced colors: the input in the shadow root is what is hit at the box, `check()` works without `force`, the
 * focused control is not obscured by the row-wide label hit area, and the label text and the far end of the row
 * still toggle. The probes are in tests/shared/hit-target.ts (also used on the Svelte demo by tests/targets).
 * The page is tests/elements/pages/hit-target.html.
 */
import { elementsReady, settle } from './a11y-shared.js';
import { registerHitTargetTests } from '../shared/hit-target.js';

registerHitTargetTests({
	title: '<k-*> elements',
	shadow: true,
	open: async (page, theme) => {
		await page.goto(`/tests/elements/pages/hit-target.html?theme=${theme}`);
		await elementsReady(page);
		await settle(page);
	},
	controls: [
		{ role: 'checkbox', name: 'Newsletter' },
		{ role: 'checkbox', name: 'With a hint' },
		{ role: 'checkbox', name: 'Some selected' },
		{ role: 'switch', name: 'Notifications' },
		{ role: 'switch', name: 'Label first' },
		{ role: 'radio', name: 'Standard' },
		{ role: 'radio', name: 'Express' },
		{ role: 'radio', name: 'Pickup' }
	],
	toggles: [
		{ role: 'checkbox', name: 'Newsletter' },
		{ role: 'checkbox', name: 'With a hint' },
		{ role: 'switch', name: 'Notifications' },
		{ role: 'switch', name: 'Label first' }
	],
	radios: [
		{ role: 'radio', name: 'Express' },
		{ role: 'radio', name: 'Pickup' }
	],
	pair: [
		{ role: 'radio', name: 'Express' },
		{ role: 'radio', name: 'Pickup' }
	]
});
