/**
 * axe over every custom element in every theme (#25): tests/elements/pages/forced-colors.html has all of them on
 * one page, closed and then in each open state (overlays, menus, pickers, toasts, invalid fields) in the eight
 * theme variants (code, code-light, flower, flower-wald, pop, pop-dark, line, line-light). Serious and critical
 * violations fail. A new element that is not on the page fails the coverage test, as in forced-colors.spec.ts.
 *
 * The other pages are checked by a11y.spec.ts, and forced colors by forced-colors.spec.ts (#27).
 */
import { expect, test } from '@playwright/test';
import { axeViolations } from './axe.js';
import { ALL, elementTags, openPage, STATES, THEMES } from './a11y-shared.js';

/** Elements whose main part exists only while they are open: each needs an open state in STATES. */
const OVERLAYS = [
	'k-color-picker',
	'k-combobox',
	'k-command-palette',
	'k-context-menu',
	'k-date-picker',
	'k-drawer',
	'k-dropdown-menu',
	'k-modal',
	'k-popover',
	'k-tag-input',
	'k-toaster',
	'k-tooltip'
];

test.describe('every element is checked', () => {
	test('the page has every element, and every overlay has an open state', async ({ page }) => {
		const tags = await elementTags();
		expect(tags.length).toBeGreaterThan(80);
		await openPage(page, ALL);
		const missing = await page.evaluate((list) => list.filter((t) => !document.querySelector(t)), tags);
		expect(missing, `${ALL}.html must contain every element`).toEqual([]);
		const shown = new Set(Object.values(STATES).flatMap((s) => s.tags));
		for (const tag of OVERLAYS) expect(shown.has(tag), `${tag} has an open state in a11y-shared.ts`).toBe(true);
		for (const tag of shown) expect(tags, `${tag} of a state is an element`).toContain(tag);
	});
});

test('axe finds a violation (the matrix is not vacuous)', async ({ page }) => {
	await openPage(page, ALL);
	await page.evaluate(() =>
		document.querySelector('main')?.insertAdjacentHTML('beforeend', '<img src="data:," width="10" height="10"><button></button>')
	);
	const ids = (await axeViolations(page)).map((f) => f.id);
	expect(ids).toEqual(expect.arrayContaining(['image-alt', 'button-name']));
});

test('axe finds a scrolling region the keyboard cannot reach, whatever its impact rating (#132)', async ({ page }) => {
	await openPage(page, ALL);
	await page.evaluate(() =>
		document
			.querySelector('main')
			?.insertAdjacentHTML(
				'beforeend',
				'<div style="height:40px;overflow:auto"><p>Text only</p><p>Text only</p><p>Text only</p><p>Text only</p><p>Text only</p></div>'
			)
	);
	const ids = (await axeViolations(page)).map((f) => f.id);
	expect(ids).toContain('scrollable-region-focusable');
});

for (const theme of THEMES) {
	test(`axe: every element in ${theme}`, async ({ page }) => {
		await openPage(page, ALL, { theme });
		const findings = await axeViolations(page);
		expect(findings, JSON.stringify(findings, null, 2)).toEqual([]);
	});

	for (const [name, state] of Object.entries(STATES)) {
		test(`axe: ${name} open in ${theme}`, async ({ page }) => {
			// the narrow states are the ones only a phone shows
			await openPage(page, ALL, { theme, ...(state.narrow ? { width: 320, height: 640 } : {}) });
			await state.prepare(page);
			const findings = await axeViolations(page);
			expect(findings, JSON.stringify(findings, null, 2)).toEqual([]);
		});
	}
}
