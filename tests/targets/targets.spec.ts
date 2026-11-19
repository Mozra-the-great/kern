/**
 * Touch targets (issue #40, WCAG 2.5.5): every interactive part of every component in
 * the demo must be operable over at least 44 x 44 px. The test probes the real hit
 * area with elementFromPoint at the centre and 21px left, right, above and below it,
 * so an invisible hit area (::after) counts and an overlapping neighbour does not.
 *
 * Exempt, as WCAG allows: disabled controls, text links (no padding, the size of
 * their line of text: WCAG's "inline" exception), cells of the data charts Heatmap and HistoryBar (their size is the data:
 * WCAG's "essential" exception; the keyboard reaches every cell), content that moves
 * (Marquee; its pause button is measured), and focusable regions that are not
 * controls (tab panels, scroll areas). Visually hidden inputs are measured through
 * their label; controls inside a visually hidden box (1px clip) are skipped.
 */
import { expect, test, type Page } from '@playwright/test';

interface Miss {
	what: string;
	where: string;
	size: string;
	misses: string[];
}

const TAP = 44;

async function openDemo(page: Page, theme: string): Promise<void> {
	await page.addInitScript((t) => {
		try {
			localStorage.setItem('kern-theme', t);
		} catch {
			/* storage blocked: the demo falls back to stuffcloud */
		}
	}, theme);
	await page.goto('index.html');
	await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
	await page.evaluate(() => document.fonts.ready);
}

/** Probes every interactive element under `root` (a CSS selector). */
async function scan(page: Page, root: string): Promise<Miss[]> {
	return page.evaluate(
		async ({ root, tap }) => {
			const SELECTOR = [
				'a[href]',
				'button',
				'input:not([type="hidden"])',
				'select',
				'textarea',
				'summary',
				'[contenteditable="true"]',
				'[tabindex]:not([tabindex="-1"])',
				...[
					'button',
					'link',
					'tab',
					'option',
					'menuitem',
					'menuitemcheckbox',
					'menuitemradio',
					'checkbox',
					'radio',
					'switch',
					'slider',
					'spinbutton',
					'treeitem',
					'gridcell'
				].map((r) => `[role="${r}"]`),
				'[role="separator"][tabindex]'
			].join(',');
			const CONTROL = SELECTOR.replace('[tabindex]:not([tabindex="-1"]),', '');
			const EXEMPT = '.k-heatmap [role="gridcell"], .k-history [role="gridcell"]';
			const scope = document.querySelector(root);
			if (!scope) throw new Error(`No ${root}`);
			// Let opening transitions (dialog pop, drawer slide) finish; endless ones keep running.
			await Promise.all(
				scope
					.getAnimations({ subtree: true })
					.filter((a) => a.effect?.getComputedTiming().iterations !== Infinity)
					.map((a) => a.finished.catch(() => undefined))
			);
			const half = tap / 2 - 1;
			const misses: Miss[] = [];
			const seen = new Set<Element>();

			const describe = (el: Element): string => {
				const label = el.getAttribute('aria-label') ?? (el as HTMLElement).innerText?.trim().slice(0, 30) ?? '';
				const cls =
					typeof el.className === 'string'
						? el.className
								.split(/\s+/)
								.filter((c) => c && !c.startsWith('svelte-'))
								.join('.')
						: '';
				return `<${el.tagName.toLowerCase()}${cls ? '.' + cls : ''}${el.getAttribute('role') ? ` role=${el.getAttribute('role')}` : ''}> ${JSON.stringify(label)}`;
			};
			const section = (el: Element): string => {
				let node: Element | null = el;
				while (node && node !== document.body) {
					const h = node.closest('section')?.querySelector('h2, h3');
					if (h) return h.textContent?.trim() ?? '';
					node = node.parentElement;
				}
				return el.closest('dialog') ? 'dialog' : el.closest('[role="menu"]') ? 'menu' : '';
			};
			// Inside a visually hidden box (the 1px clip pattern): not a pointer target at all.
			const isClippedAway = (el: Element): boolean => {
				for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
					const r = a.getBoundingClientRect();
					if ((r.width <= 2 || r.height <= 2) && getComputedStyle(a).overflow !== 'visible') return true;
				}
				return false;
			};
			const isDisabled = (el: Element): boolean =>
				el.matches(':disabled') || el.closest('[aria-disabled="true"], fieldset:disabled, [inert]') !== null;

			for (const found of scope.querySelectorAll(SELECTOR)) {
				let el: Element = found;
				if (isDisabled(el)) continue;
				// Focusable but not a control (tab panel, scroll area), or an exempt chart cell.
				if (!el.matches(CONTROL) || el.matches(EXEMPT)) continue;
				// Moving content: it cannot be measured, and the user pauses it first.
				if (el.closest('.k-marquee .track')) continue;
				const style = getComputedStyle(el);
				if (!el.checkVisibility({ visibilityProperty: true })) continue;
				if (style.pointerEvents === 'none' || isClippedAway(el)) continue;
				let rect = el.getBoundingClientRect();
				// Visually hidden native input: the label (or the wrapping label) is the target.
				if ((rect.width <= 2 || rect.height <= 2 || style.opacity === '0') && el instanceof HTMLInputElement) {
					const label = el.labels?.[0] ?? el.closest('label');
					if (!label) continue;
					el = label;
					rect = el.getBoundingClientRect();
				}
				if (rect.width === 0 || rect.height === 0) continue;
				// Text links are exempt (WCAG 2.5.5 "Inline"): an anchor without padding is as tall as its line.
				if (
					el.tagName === 'A' &&
					parseFloat(style.paddingTop) + parseFloat(style.paddingBottom) === 0 &&
					style.backgroundColor === 'rgba(0, 0, 0, 0)'
				)
					continue;
				if (seen.has(el)) continue;
				seen.add(el);

				el.scrollIntoView({ block: 'center', inline: 'center' });
				rect = el.getBoundingClientRect();
				// A checkbox or radio is operated through its labels as well: the target is their union.
				if (el instanceof HTMLInputElement && (el.type === 'checkbox' || el.type === 'radio') && el.labels) {
					for (const l of el.labels) {
						const r = l.getBoundingClientRect();
						const left = Math.min(rect.left, r.left),
							top = Math.min(rect.top, r.top);
						rect = new DOMRect(left, top, Math.max(rect.right, r.right) - left, Math.max(rect.bottom, r.bottom) - top);
					}
				}
				const cx = rect.left + rect.width / 2;
				const cy = rect.top + rect.height / 2;
				const points: [string, number, number][] = [
					['centre', cx, cy],
					['left', cx - half, cy],
					['right', cx + half, cy],
					['top', cx, cy - half],
					['bottom', cx, cy + half]
				];
				const target = el;
				const owns = (hit: Element | null): boolean => {
					if (!hit) return false;
					if (hit === target || target.contains(hit)) return true;
					const label = hit.closest('label');
					if (label && (label === target || (label as HTMLLabelElement).control === target || label.contains(target))) return true;
					return false;
				};
				const bad = points
					.map(([name, x, y]) => [name, document.elementFromPoint(x, y)] as const)
					.filter(([, hit]) => !owns(hit))
					.map(([name, hit]) => `${name}${hit ? ` (hits ${describe(hit)})` : ''}`);
				if (bad.length) {
					misses.push({
						what: describe(el),
						where: section(el),
						size: `${Math.round(rect.width)}x${Math.round(rect.height)}`,
						misses: bad
					});
				}
			}
			window.scrollTo(0, 0);
			return misses;
		},
		{ root, tap: TAP }
	);
}

const format = (misses: Miss[]): string =>
	misses.map((m) => `${m.where} | ${m.what} | ${m.size} | misses ${m.misses.join(',')}`).join('\n');

async function check(page: Page): Promise<void> {
	const misses = await scan(page, 'main');

	// Overlays are closed on load: open the ones with their own controls and probe them.
	await page.getByRole('button', { name: 'Dialog öffnen' }).first().click();
	const dialog = page.locator('dialog.k-modal[open]');
	await expect(dialog).toBeVisible();
	misses.push(...(await scan(page, 'dialog.k-modal[open]')));
	await page.keyboard.press('Escape');
	await expect(dialog).toHaveCount(0);

	await page.getByRole('button', { name: 'Seitenleiste' }).first().click();
	const drawer = page.locator('dialog.k-drawer[open]');
	await expect(drawer).toBeVisible();
	misses.push(...(await scan(page, 'dialog.k-drawer[open]')));
	await page.keyboard.press('Escape');
	await expect(drawer).toHaveCount(0);

	await page.getByRole('button', { name: 'Mehr' }).first().click();
	await expect(page.getByRole('menu').first()).toBeVisible();
	misses.push(...(await scan(page, '[role="menu"]')));
	await page.getByRole('menuitem', { name: 'Löschen' }).click();
	await expect(page.locator('.k-toaster .toast').first()).toBeVisible();
	misses.push(...(await scan(page, '.k-toaster')));

	expect(misses, `Targets smaller than ${TAP}px:\n${format(misses)}`).toEqual([]);
}

test.describe('touch (pointer: coarse, 375px)', () => {
	for (const theme of ['stuffcloud', 'flower', 'pop', 'line', 'line-light']) {
		test(`every target is >= ${TAP}px in ${theme}`, async ({ page }) => {
			await openDemo(page, theme);
			expect(await page.evaluate(() => matchMedia('(pointer: coarse)').matches)).toBe(true);
			await check(page);
		});
	}
});

test.describe('mouse (pointer: fine, 1280px), themes whose design sets 44px for every pointer', () => {
	test.use({ isMobile: false, hasTouch: false, viewport: { width: 1280, height: 900 } });
	for (const theme of ['stuffcloud', 'pop', 'line', 'line-light']) {
		test(`every target is >= ${TAP}px in ${theme}`, async ({ page }) => {
			await openDemo(page, theme);
			expect(await page.evaluate(() => matchMedia('(pointer: fine)').matches)).toBe(true);
			await check(page);
		});
	}
});

/** Heights of the first default and small button and the size of the first icon button in the demo. */
async function buttonSizes(page: Page): Promise<{ md: number; sm: number; icon: [number, number] }> {
	const box = async (selector: string): Promise<{ width: number; height: number }> => {
		const b = await page.locator(selector).first().boundingBox();
		if (!b) throw new Error(`${selector} is not rendered`);
		return b;
	};
	const icon = await box('main .k-icon-button[data-size="md"]');
	return {
		md: (await box('main .k-button[data-size="md"]')).height,
		sm: (await box('main .k-button[data-size="sm"]')).height,
		icon: [icon.width, icon.height]
	};
}

test.describe('sizes of the design', () => {
	test('stuffcloud on a phone: button 56px, compact 44px, icon 48px', async ({ page }) => {
		await openDemo(page, 'stuffcloud');
		expect(await buttonSizes(page)).toEqual({ md: 56, sm: 44, icon: [48, 48] });
	});
	test('pop on a phone: button 56px, compact 44px, icon 48px', async ({ page }) => {
		await openDemo(page, 'pop');
		expect(await buttonSizes(page)).toEqual({ md: 56, sm: 44, icon: [48, 48] });
	});
	test('line on a phone: button 52px, compact 44px, icon 44px', async ({ page }) => {
		await openDemo(page, 'line');
		expect(await buttonSizes(page)).toEqual({ md: 52, sm: 44, icon: [44, 44] });
	});
	test.describe('desktop', () => {
		test.use({ isMobile: false, hasTouch: false, viewport: { width: 1280, height: 900 } });
		test('stuffcloud: button 52px, compact 44px, icon 48px', async ({ page }) => {
			await openDemo(page, 'stuffcloud');
			expect(await buttonSizes(page)).toEqual({ md: 52, sm: 44, icon: [48, 48] });
		});
		test('line: button 52px, compact 44px, icon 44px', async ({ page }) => {
			await openDemo(page, 'line');
			expect(await buttonSizes(page)).toEqual({ md: 52, sm: 44, icon: [44, 44] });
		});
		test('flower keeps 44px buttons and 34px compact ones for the mouse', async ({ page }) => {
			await openDemo(page, 'flower');
			expect(await buttonSizes(page)).toEqual({ md: 44, sm: 34, icon: [44, 44] });
		});
	});
});
