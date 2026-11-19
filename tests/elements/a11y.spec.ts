/**
 * axe on the element test pages in four themes: no serious or critical violation (#25, #50, #51).
 * The pages cover the parity components (Card list and interactive cards, Button/Link, FileDrop,
 * fields with hint and error, CopyButton, StatusMessage), the feedback components (Progress,
 * Toaster, Modal) and a form of every form element.
 */
import { expect, test } from '@playwright/test';
import { axeViolations } from './axe.js';

const pages = ['parity', 'feedback', 'form'];
const themes = ['stuffcloud', 'stuffcloud-light', 'flower', 'pop-dark'];

for (const name of pages) {
	for (const theme of themes) {
		test(`axe: ${name} page in ${theme} has no serious or critical violation`, async ({ page }) => {
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
			const findings = await axeViolations(page);
			expect(findings, JSON.stringify(findings, null, 2)).toEqual([]);
		});
	}
}
