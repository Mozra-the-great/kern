/**
 * axe on the element test pages in five themes: no serious or critical violation (#25, #50, #51, #58, #64).
 * The pages cover the parity components (Card list and interactive cards, Button/Link, FileDrop,
 * fields with hint and error, CopyButton, StatusMessage), the feedback components (Progress,
 * Toaster, Modal, Drawer), the navigation and content components (Tabs as a tab bar with badges,
 * TabLinks, CodeBlock, Tile/TileGrid), the sortable list and select grid (reorder, also with a selection and a focus ring), a form of every form element, every element with default texts (strings), and the
 * skip link, live announcer, online status and prose (primitives). The primitives page is also
 * checked with the skip link focused and while offline, the states in which those parts are visible.
 */
import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import { axeViolations } from './axe.js';

interface Case {
	name: string;
	/** Puts the page in a state before axe looks at it. */
	prepare?: (page: Page, context: BrowserContext) => Promise<void>;
	label?: string;
}

const cases: Case[] = [
	{ name: 'parity' },
	{ name: 'feedback' },
	{ name: 'form' },
	{ name: 'navigation' },
	{
		name: 'reorder',
		prepare: async (page) => {
			await expect(page.locator('#grid').getByRole('option')).toHaveCount(11);
			await expect(page.locator('#list').getByRole('listitem')).toHaveCount(4);
		}
	},
	{
		name: 'reorder',
		label: 'reorder page with a selection and a focused item',
		prepare: async (page) => {
			await page.locator('#grid').getByRole('option', { name: 'Page 2', exact: true }).click();
			await page.locator('#plain').getByRole('option', { name: 'Page 5', exact: true }).focus();
			await page.locator('#list').getByRole('button', { name: 'Move Invoice.pdf down' }).focus();
		}
	},
	{ name: 'strings' },
	{ name: 'primitives' },
	{
		name: 'primitives',
		label: 'primitives page with the skip link focused and while offline',
		prepare: async (page, context) => {
			await page.keyboard.press('Tab');
			await expect(page.locator('#skip a')).toBeFocused();
			await context.setOffline(true);
			await expect(page.locator('#online .notice')).toBeVisible();
		}
	}
];
const themes = ['code', 'code-light', 'flower', 'pop-dark', 'line'];

for (const { name, prepare, label } of cases) {
	for (const theme of themes) {
		test(`axe: ${label ?? `${name} page`} in ${theme} has no serious or critical violation`, async ({ page, context }) => {
			// Colour transitions would let axe measure mid-fade colours after the theme switch:
			// reduced motion sets --k-dur to 0, and running animations are awaited below as well.
			await page.emulateMedia({ reducedMotion: 'reduce' });
			await page.goto(`/tests/elements/pages/${name}.html`);
			await page.evaluate((t) => (document.documentElement.dataset.theme = t), theme);
			await page.evaluate(async () => {
				await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
				await Promise.all(document.getAnimations({ subtree: true }).map((a) => a.finished.catch(() => undefined)));
			});
			// Every kern element on the page is defined and rendered before axe looks at it.
			await page.waitForFunction(() =>
				[...document.querySelectorAll('*')]
					.filter((el) => el.tagName.startsWith('K-'))
					.every((el) => customElements.get(el.tagName.toLowerCase()) && el.shadowRoot)
			);
			await prepare?.(page, context);
			const findings = await axeViolations(page);
			expect(findings, JSON.stringify(findings, null, 2)).toEqual([]);
		});
	}
}
