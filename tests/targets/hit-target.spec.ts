/**
 * Hit target of Checkbox, Switch and RadioGroup in the Svelte demo (#150), in the eight theme variants and in
 * forced colors, on the phone of this suite (375 px, touch): the input is what is hit at the box, `check()` works
 * without `force`, the focused control is not obscured by the row-wide label hit area, and the label text and the
 * far end of the row still toggle. The probes are in tests/shared/hit-target.ts (also used on the custom elements by
 * tests/elements/hit-target.spec.ts). The controls are the ones of the form in src/demo/App.svelte.
 */
import { expect } from '@playwright/test';
import { registerHitTargetTests } from '../shared/hit-target.js';

registerHitTargetTests({
	title: 'demo',
	shadow: false,
	open: async (page, theme) => {
		await page.addInitScript((t) => {
			try {
				localStorage.setItem('kern-theme', t);
			} catch {
				/* storage blocked: the demo falls back to code */
			}
		}, theme);
		await page.goto('index.html');
		await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
		await page.evaluate(() => document.fonts.ready);
	},
	controls: [
		{ role: 'checkbox', name: 'Ich habe die Bedingungen gelesen.' },
		{ role: 'checkbox', name: 'Teilweise gewählt' },
		{ role: 'switch', name: 'Neuigkeiten per E-Mail' },
		{ role: 'radio', name: 'Standard' },
		{ role: 'radio', name: 'Express' }
	],
	toggles: [
		{ role: 'checkbox', name: 'Ich habe die Bedingungen gelesen.' },
		{ role: 'switch', name: 'Neuigkeiten per E-Mail' }
	],
	radios: [{ role: 'radio', name: 'Express' }],
	pair: [
		{ role: 'radio', name: 'Express' },
		{ role: 'radio', name: 'Standard' }
	]
});
