/**
 * Default texts (#58) in the browser, through the built custom elements: the catalogue reaches every
 * element, `kern.strings.set(kern.strings.de)` leaves no English word in the page, a language change
 * reaches elements that are already rendered, attributes win, and a second copy of kern (the
 * per-element entries next to the all-in-one bundle) shares the choice.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { de } from '../../src/lib/components/strings-de.js';
import { en } from '../../src/lib/components/strings.js';

const PAGE = '/tests/elements/pages/strings.html';

type Tree = { [key: string]: Tree | string };
function leaves(tree: Tree): string[] {
	return Object.entries(tree).flatMap(([key, value]) => (key === 'lang' ? [] : typeof value === 'string' ? [value] : leaves(value)));
}
const wordsOf = (text: string): string[] =>
	text
		.replace(/\{\w+\}/g, ' ')
		.toLowerCase()
		.match(/[a-zäöüß]{3,}/g) ?? [];

/** Words that only the English texts use: not in the German texts and not in the page's own German content. */
function englishOnlyWords(): Set<string> {
	const german = new Set(
		[...leaves(de as unknown as Tree), join(import.meta.dirname, 'pages/strings.html')].flatMap((s) =>
			wordsOf(s.endsWith('.html') ? readFileSync(s, 'utf8') : s)
		)
	);
	return new Set(
		leaves(en as unknown as Tree)
			.flatMap(wordsOf)
			.filter((w) => !german.has(w))
	);
}

interface KernStringsApi {
	set(...inputs: unknown[]): void;
	reset(): void;
	de: object;
	en: object;
	setLocale(lang: string | undefined): boolean;
	followLang(root?: Element): () => void;
	lang: string | undefined;
}
interface TestWindow {
	kern: { strings: KernStringsApi; toast: (input: unknown) => number };
	errors: string[];
}

async function ready(page: Page): Promise<void> {
	await page.goto(PAGE);
	await page.waitForFunction(() =>
		[...document.querySelectorAll('*')]
			.filter((el) => el.tagName.startsWith('K-'))
			.every((el) => customElements.get(el.tagName.toLowerCase()) && el.shadowRoot)
	);
}

/**
 * Every text of the page, also those inside what is closed at first: the colour and date pickers
 * (one after the other, they share the focus), the combobox without a match, the drawer, the palette,
 * the dialog and the toasts.
 */
async function strings(page: Page): Promise<string[]> {
	const all = new Set<string>();
	const take = async () => (await snapshot(page)).forEach((t) => all.add(t));
	const setOpen = (ids: string[], open: boolean) =>
		page.evaluate(
			([list, value]) => {
				for (const id of list as string[]) (document.getElementById(id) as HTMLElement & { open: boolean }).open = value as boolean;
			},
			[ids, open]
		);
	await take();
	await page.locator('#color').getByRole('button').first().click();
	await take();
	await page.keyboard.press('Escape');
	await page.locator('#date').getByRole('button').first().click();
	await take();
	await page.keyboard.press('Escape');
	await page.locator('#combo').getByRole('combobox').fill('zzz');
	await take();
	await page.evaluate(() => {
		const { kern } = window as unknown as TestWindow;
		kern.toast({ message: 'Gelöscht', onundo: () => undefined });
		kern.toast({ message: 'Fehler', tone: 'danger', action: { label: 'Wiederholen', onclick: () => undefined } });
	});
	await setOpen(['drawer', 'palette'], true);
	await page.waitForTimeout(100);
	await take();
	await setOpen(['drawer', 'palette'], false);
	await setOpen(['modal'], true);
	await page.waitForTimeout(100);
	await take();
	return [...all];
}

/** Every text, accessible name and placeholder in the page right now, through open shadow roots. */
async function snapshot(page: Page): Promise<string[]> {
	return page.evaluate(() => {
		const out: string[] = [];
		const ATTRS = ['aria-label', 'title', 'placeholder', 'alt', 'aria-valuetext', 'aria-description', 'aria-roledescription'];
		const walk = (root: Node): void => {
			for (const node of Array.from(root.childNodes)) {
				if (node.nodeType === Node.TEXT_NODE) {
					const t = (node.textContent ?? '').replace(/\s+/g, ' ').trim();
					if (t) out.push(t);
				} else if (node instanceof Element) {
					if (['STYLE', 'SCRIPT', 'TITLE'].includes(node.tagName)) continue;
					for (const a of ATTRS) {
						const v = node.getAttribute(a);
						if (v) out.push(v);
					}
					if (node.shadowRoot) walk(node.shadowRoot);
					walk(node);
				}
			}
		};
		walk(document.body);
		return out;
	});
}

test.describe('default texts', () => {
	test('are English until a language is chosen', async ({ page }) => {
		await ready(page);
		await expect(page.locator('#spinner [role=status]')).toContainText('Loading');
		await expect(page.locator('#alert').getByRole('button', { name: 'Dismiss' })).toBeVisible();
		await expect(page.locator('#pagination').getByRole('button', { name: 'Next' })).toBeVisible();
		expect(await page.evaluate(() => (window as unknown as TestWindow).kern.strings.lang)).toBeUndefined();
	});

	test('are German through kern.strings.set(kern.strings.de), with no English word left', async ({ page }) => {
		const english = englishOnlyWords();
		await ready(page);
		const before = (await strings(page)).filter((s) => wordsOf(s).some((w) => english.has(w)));
		expect(before.length, 'the page shows English texts before the switch').toBeGreaterThan(20);

		await ready(page);
		await page.evaluate(() => {
			const { kern } = window as unknown as TestWindow;
			kern.strings.set(kern.strings.de);
		});
		const left = (await strings(page)).filter((s) => wordsOf(s).some((w) => english.has(w)));
		expect(left, 'texts with an English word after kern.strings.set(kern.strings.de)').toEqual([]);

		await expect(page.locator('#spinner [role=status]')).toContainText('Lädt');
		await expect(page.locator('#alert').getByRole('button', { name: 'Schließen' })).toBeVisible();
		await expect(page.locator('#pagination').getByRole('button', { name: 'Weiter' })).toBeVisible();
		await expect(page.locator('#dot')).toContainText('Ausgefallen');
		await expect(page.locator('#kbd')).toContainText('Umschalttaste');
		await expect(page.locator('#link')).toContainText('(öffnet in einem neuen Tab)');
	});

	test('reach elements that are already rendered, in both directions', async ({ page }) => {
		await ready(page);
		const label = () => page.locator('#spinner [role=status]');
		await expect(label()).toContainText('Loading');
		await page.evaluate(() => (window as unknown as TestWindow).kern.strings.set({ spinner: { label: 'Un instant' } }));
		await expect(label()).toContainText('Un instant');
		await page.evaluate(() => (window as unknown as TestWindow).kern.strings.reset());
		await expect(label()).toContainText('Loading');
	});

	test('lose against an attribute', async ({ page }) => {
		await ready(page);
		await page.evaluate(() => {
			(window as unknown as TestWindow).kern.strings.set((window as unknown as TestWindow).kern.strings.de);
			const spinner = document.getElementById('spinner');
			spinner?.setAttribute('label', 'Wird gespeichert');
		});
		await expect(page.locator('#spinner [role=status]')).toContainText('Wird gespeichert');
		await page.evaluate(() => document.getElementById('spinner')?.removeAttribute('label'));
		await expect(page.locator('#spinner [role=status]')).toContainText('Lädt');
	});

	test('take a part of the catalogue and leave the rest English', async ({ page }) => {
		await ready(page);
		await page.evaluate(() => (window as unknown as TestWindow).kern.strings.set({ pagination: { nextLabel: 'Suivant' } }));
		await expect(page.locator('#pagination').getByRole('button', { name: 'Suivant' })).toBeVisible();
		await expect(page.locator('#pagination').getByRole('button', { name: 'Previous' })).toBeVisible();
	});
});

test.describe('language', () => {
	test('setLocale picks the registered bundle, de-AT finds de, an unknown tag keeps English', async ({ page }) => {
		await ready(page);
		const result = await page.evaluate(() => {
			const { strings } = (window as unknown as TestWindow).kern;
			return [strings.setLocale('de-AT'), strings.lang, strings.setLocale('fr'), strings.lang, strings.setLocale(undefined), strings.lang];
		});
		expect(result).toEqual([true, 'de-AT', false, 'fr', false, undefined]);
	});

	test('followLang follows the lang attribute of <html>', async ({ page }) => {
		await ready(page);
		await page.evaluate(() => {
			document.documentElement.lang = 'en';
			(window as unknown as { stop: () => void }).stop = (window as unknown as TestWindow).kern.strings.followLang();
		});
		await expect(page.locator('#spinner [role=status]')).toContainText('Loading');
		await page.evaluate(() => (document.documentElement.lang = 'de'));
		await expect(page.locator('#spinner [role=status]')).toContainText('Lädt');
		await page.evaluate(() => (document.documentElement.lang = 'de-CH'));
		await expect(page.locator('#spinner [role=status]')).toContainText('Lädt');
		await page.evaluate(() => (document.documentElement.lang = 'en'));
		await expect(page.locator('#spinner [role=status]')).toContainText('Loading');
		await page.evaluate(() => {
			(window as unknown as { stop: () => void }).stop();
			document.documentElement.lang = 'de';
		});
		await page.waitForTimeout(50);
		await expect(page.locator('#spinner [role=status]')).toContainText('Loading');
	});

	test('the chosen language sets the number and date format of elements without a locale', async ({ page }) => {
		await ready(page);
		await page.setContent(
			`<script type="module" src="/dist-elements/kern-elements.js"></script><k-count-up id="n" value="1234567.5" start-in-view="false" duration="1"></k-count-up><k-odometer id="o" value="1234.5"></k-odometer>`
		);
		await page.waitForFunction(() => document.getElementById('o')?.shadowRoot);
		const sr = async () => page.locator('#o').evaluate((el) => el.shadowRoot?.querySelector('.sr')?.textContent ?? '');
		await page.evaluate(() => (window as unknown as TestWindow).kern.strings.set({ lang: 'de-DE' }));
		await expect.poll(sr).toBe('1.234,5');
		await page.evaluate(() => (window as unknown as TestWindow).kern.strings.set({ lang: 'en-US' }));
		await expect.poll(sr).toBe('1,234.5');
		await page.evaluate(() => {
			document.getElementById('o')?.setAttribute('locale', 'fr-FR');
		});
		await expect.poll(sr).toMatch(/^1\s234,5$/);
	});
});

test.describe('two copies of kern on one page', () => {
	test('the strings entry shares its choice with the all-in-one bundle', async ({ page }) => {
		await ready(page);
		await page.addScriptTag({
			type: 'module',
			content:
				"import { setStrings, de } from '/dist-elements/elements/strings.js'; window.setFromEntry = () => setStrings(de); window.entryLoaded = true;"
		});
		await page.waitForFunction(() => (window as unknown as { entryLoaded?: boolean }).entryLoaded);
		await expect(page.locator('#spinner [role=status]')).toContainText('Loading');
		await page.evaluate(() => (window as unknown as { setFromEntry: () => void }).setFromEntry());
		await expect(page.locator('#spinner [role=status]')).toContainText('Lädt');
		expect(await page.evaluate(() => (window as unknown as TestWindow).kern.strings.lang)).toBe('de');
	});

	test('a page with only the strings entry still gets window.kern.strings and both bundles', async ({ page }) => {
		await page.goto('/tests/elements/pages/entries.html');
		await page.addScriptTag({
			type: 'module',
			content:
				"import '/dist-elements/elements/spinner.js'; import { setLocale, getStrings } from '/dist-elements/elements/strings.js'; window.result = [setLocale('de'), getStrings().spinner.label, typeof window.kern.strings.set]; window.loaded = true;"
		});
		await page.waitForFunction(() => (window as unknown as { loaded?: boolean }).loaded);
		expect(await page.evaluate(() => (window as unknown as { result: unknown }).result)).toEqual([true, 'Lädt', 'function']);
	});
});
