/**
 * The hit target of Checkbox, Switch and RadioGroup (#150). Each has a row-wide `label::after` (the tap target:
 * the whole row toggles the control through its label); the box or the switch itself must stay on top of it, so
 * that in every theme and in forced colors
 *
 * - `elementFromPoint` at the box (centre and four points inside its edges) is the `<input>` itself,
 * - Playwright's `check()` / `uncheck()` work without `force` (they wait until the control receives the click),
 * - the focused control is not obscured by its own row (WCAG 2.4.11 Focus Not Obscured, Minimum),
 * - a click on the label text or at the far end of the row still toggles.
 *
 * `registerHitTargetTests` is used on the custom elements (tests/elements/hit-target.spec.ts: the input is in the
 * shadow root, so `shadowRoot.elementFromPoint`) and on the Svelte demo (tests/targets/hit-target.spec.ts).
 * A canary puts the stacking back to `auto`: the same probe must then fail, so it cannot pass by looking at nothing.
 */
import { expect, test, type Locator, type Page } from '@playwright/test';

/** One `data-theme` id per theme family and scheme: the real ids of src/lib/themes/brands/*.css. */
export const THEMES = ['code', 'code-light', 'flower', 'flower-wald', 'pop', 'pop-dark', 'line', 'line-light'] as const;

export type Role = 'checkbox' | 'switch' | 'radio';

export interface Control {
	role: Role;
	/** Accessible name. */
	name: string;
}

export interface HitTargetSuite {
	/** Prefix of the test titles. */
	title: string;
	/** Opens the page in `theme` and waits until the controls have rendered. */
	open: (page: Page, theme: string) => Promise<void>;
	/** Every control to probe: checkboxes (an indeterminate one too), switches, every enabled radio. */
	controls: readonly Control[];
	/** Checkboxes and switches (any start state): `check()`, `uncheck()`, a click on the text, a click at the row end. */
	toggles: readonly Control[];
	/** Radios that start unchecked: `check()` selects them. */
	radios: readonly Control[];
	/** Two radios of one group: a click on the text of the first, then at the end of the row of the second. */
	pair: readonly [Control, Control];
	/** Whether the inputs live in shadow roots (custom elements): the canary then adopts its style there. */
	shadow: boolean;
}

const locate = (page: Page, c: Control): Locator => page.getByRole(c.role, { name: c.name, exact: true });

/** Fractions of the box: the centre and a point inside each edge (inside the circle of a radio too). */
const POINTS: readonly (readonly [number, number])[] = [
	[0.5, 0.5],
	[0.5, 0.2],
	[0.5, 0.8],
	[0.2, 0.5],
	[0.8, 0.5]
];

/** The points of `control` at which `elementFromPoint` of its own root is not the control. Runs in the browser. */
async function misses(control: Locator): Promise<string[]> {
	await control.scrollIntoViewIfNeeded();
	return control.evaluate((el, points) => {
		const root = el.getRootNode() as Document | ShadowRoot;
		const r = el.getBoundingClientRect();
		const out: string[] = [];
		for (const [fx, fy] of points) {
			const hit = root.elementFromPoint(r.left + r.width * (fx ?? 0), r.top + r.height * (fy ?? 0));
			if (hit !== el) out.push(`(${fx}, ${fy}) -> ${hit ? `${hit.localName}.${hit.className}` : 'nothing'}`);
		}
		return out;
	}, POINTS);
}

/** Clicks the label text of `control`, or the far end of its row (the right edge, the vertical centre of the box). */
async function clickLabelOrRowEnd(page: Page, control: Locator, where: 'text' | 'row-end'): Promise<void> {
	await control.scrollIntoViewIfNeeded();
	const point = await control.evaluate((el, w) => {
		const input = el as HTMLInputElement;
		const label = input.labels?.[0];
		if (!label) throw new Error('the control has no label');
		if (w === 'text') {
			const l = label.getBoundingClientRect();
			return { x: l.left + Math.min(8, l.width / 2), y: l.top + l.height / 2 };
		}
		// the row: the closest ancestor that holds the box and the label side by side
		let row: Element | null = input.parentElement;
		while (row && !row.contains(label)) row = row.parentElement;
		if (!row) throw new Error('the control has no row');
		const box = input.getBoundingClientRect();
		return { x: row.getBoundingClientRect().right - 6, y: box.top + box.height / 2 };
	}, where);
	await page.mouse.click(point.x, point.y);
}

/** Puts the stacking back to `auto` (what the controls had before #150), so the probe has to find the label. */
async function revertStacking(page: Page, shadow: boolean): Promise<void> {
	await page.evaluate((shadow) => {
		const sheet = new CSSStyleSheet();
		sheet.replaceSync('.box, input { z-index: auto !important; }');
		const roots: (Document | ShadowRoot)[] = shadow
			? [...document.querySelectorAll('*')].flatMap((el) => (el.shadowRoot ? [el.shadowRoot] : []))
			: [document];
		for (const root of roots) root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet];
	}, shadow);
}

export function registerHitTargetTests(suite: HitTargetSuite): void {
	for (const forced of [false, true]) {
		for (const theme of THEMES) {
			test.describe(`${suite.title}: ${forced ? `${theme} in forced colors` : theme}`, () => {
				test.beforeEach(async ({ page }) => {
					await page.emulateMedia({ reducedMotion: 'reduce', forcedColors: forced ? 'active' : 'none' });
					await suite.open(page, theme);
				});

				test('the box of every control is hit at its centre and inside its edges', async ({ page }) => {
					for (const c of suite.controls) {
						const control = locate(page, c);
						await expect(control, `${c.role} "${c.name}" is rendered`).toBeVisible();
						expect(await misses(control), `${c.role} "${c.name}": points where the input is not the hit target`).toEqual([]);
					}
				});

				test('check() and uncheck() work without force', async ({ page }) => {
					for (const c of suite.toggles) {
						const control = locate(page, c);
						// whatever it starts as (the demo's switch is on), so that check() and uncheck() below both click
						await control.uncheck({ timeout: 5000 });
						await expect(control).not.toBeChecked();
						await control.check({ timeout: 5000 });
						await expect(control, `${c.role} "${c.name}" after check()`).toBeChecked();
						await control.uncheck({ timeout: 5000 });
						await expect(control, `${c.role} "${c.name}" after uncheck()`).not.toBeChecked();
					}
					for (const c of suite.radios) {
						const control = locate(page, c);
						await expect(control).not.toBeChecked();
						await control.check({ timeout: 5000 });
						await expect(control, `radio "${c.name}" after check()`).toBeChecked();
					}
				});

				test('a click on the label text or at the far end of the row still toggles', async ({ page }) => {
					for (const c of suite.toggles) {
						const control = locate(page, c);
						const before = await control.isChecked();
						await clickLabelOrRowEnd(page, control, 'text');
						await expect(control, `${c.role} "${c.name}" after a click on its text`).toBeChecked({ checked: !before });
						await clickLabelOrRowEnd(page, control, 'row-end');
						await expect(control, `${c.role} "${c.name}" after a click at the end of its row`).toBeChecked({ checked: before });
					}
					const [first, second] = [locate(page, suite.pair[0]), locate(page, suite.pair[1])];
					await clickLabelOrRowEnd(page, first, 'text');
					await expect(first, 'radio after a click on its text').toBeChecked();
					await clickLabelOrRowEnd(page, second, 'row-end');
					await expect(second, 'radio after a click at the end of its row').toBeChecked();
					await expect(first).not.toBeChecked();
				});

				test('the focused control is not obscured: it is the hit target at its centre', async ({ page }) => {
					for (const c of suite.controls) {
						const control = locate(page, c);
						await control.scrollIntoViewIfNeeded();
						// Tab first, so the page is in keyboard modality and the ring shows (:focus-visible)
						await page.keyboard.press('Tab');
						await control.focus();
						await expect(control, `${c.role} "${c.name}" is focused`).toBeFocused();
						expect(await misses(control), `${c.role} "${c.name}" focused: points where it is covered`).toEqual([]);
					}
				});
			});
		}
	}

	test.describe(`${suite.title}: canary`, () => {
		test('without the stacking the row covers the control: the probe finds it and a click on the control hangs', async ({ page }) => {
			await page.emulateMedia({ reducedMotion: 'reduce' });
			await suite.open(page, 'code');
			await revertStacking(page, suite.shadow);
			for (const c of suite.toggles) {
				const control = locate(page, c);
				expect(await misses(control), `${c.role} "${c.name}": the probe must be able to fail`).not.toEqual([]);
				// Playwright waits for the input to receive the click and gives up: the label's ::after intercepts it
				await expect(control.click({ timeout: 1500 })).rejects.toThrow(/intercepts pointer events|Timeout/);
			}
		});
	});
}
