/**
 * `<k-button>` in the footer of `<k-modal>` (#120). Below 520 px the footer is stacked (Modal.svelte; the Code
 * theme also up to 760 px) and every action fills the row, like the Svelte `Button` does: the `<k-button>` host
 * and the button inside it, in all eight theme variants. In a row footer (wide screens) the buttons keep their
 * own width. The actions are the two `<k-button slot="footer">` of `#modal` on tests/elements/pages/visual.html.
 */
import { expect, test, type Page } from '@playwright/test';
import { elementsReady, settle, THEMES } from './a11y-shared.js';

interface Footer {
	/** Content width of the footer. */
	footer: number;
	hosts: { top: number; host: number; inner: number }[];
}

async function openModal(page: Page, theme: string, width: number): Promise<void> {
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await page.setViewportSize({ width, height: 900 });
	await page.goto(`/tests/elements/pages/visual.html?theme=${theme}&overlay=modal`);
	await elementsReady(page);
	await page.evaluate(() => document.getElementById('modal')?.setAttribute('open', ''));
	await expect(page.getByRole('dialog')).toBeVisible();
	await settle(page);
}

/** Runs in the browser. */
function measureFooter(): Footer {
	const modal = document.getElementById('modal');
	const footer = modal?.shadowRoot?.querySelector('footer');
	if (!modal || !footer) throw new Error('the modal has no footer');
	const hosts = [...modal.querySelectorAll<HTMLElement>('k-button[slot="footer"]')].map((host) => {
		const inner = host.shadowRoot?.querySelector('.k-button');
		if (!inner) throw new Error('k-button has not rendered');
		return { top: host.getBoundingClientRect().top, host: host.getBoundingClientRect().width, inner: inner.getBoundingClientRect().width };
	});
	return { footer: footer.getBoundingClientRect().width, hosts };
}

for (const theme of THEMES) {
	test(`320 px: the footer is stacked and each <k-button> fills the row in ${theme}`, async ({ page }) => {
		await openModal(page, theme, 320);
		const { footer, hosts } = await page.evaluate(measureFooter);
		expect(hosts).toHaveLength(2);
		// stacked: one above the other
		expect(hosts[0]?.top).not.toBe(hosts[1]?.top);
		for (const h of hosts) {
			expect(h.host, 'host as wide as the row').toBeCloseTo(footer, 0);
			expect(h.inner, 'button as wide as its host').toBeCloseTo(h.host, 0);
		}
	});

	test(`1280 px: a row footer keeps the width of its <k-button> in ${theme}`, async ({ page }) => {
		await openModal(page, theme, 1280);
		const { footer, hosts } = await page.evaluate(measureFooter);
		// side by side, each as wide as its label and nowhere near the row
		expect(hosts[0]?.top).toBe(hosts[1]?.top);
		for (const h of hosts) {
			expect(h.inner).toBeCloseTo(h.host, 0);
			expect(h.host).toBeLessThan(footer / 2);
		}
	});
}

// 521 to 760 px: only the Code theme stacks its footer there (T's sheet); every other theme keeps the row.
for (const theme of THEMES) {
	const stacked = theme.startsWith('code');
	test(`640 px: the footer is ${stacked ? 'stacked and full width' : 'a row'} in ${theme}`, async ({ page }) => {
		await openModal(page, theme, 640);
		const { footer, hosts } = await page.evaluate(measureFooter);
		if (stacked) {
			expect(hosts[0]?.top).not.toBe(hosts[1]?.top);
			for (const h of hosts) {
				expect(h.host).toBeCloseTo(footer, 0);
				expect(h.inner).toBeCloseTo(footer, 0);
			}
		} else {
			expect(hosts[0]?.top).toBe(hosts[1]?.top);
			for (const h of hosts) expect(h.host).toBeLessThan(footer / 2);
		}
	});
}
