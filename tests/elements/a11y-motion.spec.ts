/**
 * Reduced motion (WCAG 2.3.3, #25): with `prefers-reduced-motion: reduce` nothing on a page moves.
 * `document.getAnimations()` (and the same call on every shadow root, which the document call does not
 * include) must hold no running CSS animation or transition that lasts longer than a frame, on every page, in every
 * theme, in every open state, and right after hovering, focusing and operating the controls (that is when
 * transitions start). Smooth scrolling is off too, and the effect components (typewriter, scramble, count-up,
 * odometer, carousel) show their final state at once.
 *
 * One documented exception: the two spinners (`<k-spinner>` and the loading mark of `<k-button loading>`). A
 * loading indicator that stands still tells nobody that work is going on (the motion is essential, WCAG 2.3.3),
 * so it keeps turning, once every 2 s instead of every 0.8 s, and nothing else may.
 */
import { expect, test, type Page } from '@playwright/test';
import { ALL, openPage, PAGES, STATES, THEMES } from './a11y-shared.js';

// A page load can stall on a busy machine (see load() in a11y-shared.ts): leave room for its retries.
test.describe.configure({ timeout: 90_000 });

/** Runs in the browser. Returns a description of every animation or transition that is running and longer than a frame. */
function runningAnimations(): string[] {
	const found = new Set<Animation>(document.getAnimations());
	const walk = (root: Document | ShadowRoot): void => {
		for (const el of root.querySelectorAll('*')) {
			if (!el.shadowRoot) continue;
			for (const a of el.shadowRoot.getAnimations()) found.add(a);
			walk(el.shadowRoot);
		}
	};
	walk(document);
	const FRAME = 20;
	const out: string[] = [];
	for (const a of found) {
		if (a.playState === 'finished' || a.playState === 'idle') continue;
		const timing = a.effect?.getComputedTiming();
		if (!timing || (timing.endTime as number) <= FRAME) continue;
		const target = (a.effect as KeyframeEffect).target;
		const name = (a as CSSAnimation).animationName ?? (a as CSSTransition).transitionProperty;
		const cls = typeof target?.className === 'string' ? target.className.trim().split(/\s+/)[0] : '';
		const essential =
			a instanceof CSSAnimation &&
			/-k-spin$/.test(a.animationName) &&
			(cls === 'ring' || cls === 'spin') &&
			Number(timing.duration) >= 2000;
		if (essential) continue;
		out.push(`${a.constructor.name} ${name} on ${target?.tagName.toLowerCase()}.${cls} lasts ${timing.endTime}ms`);
	}
	return out;
}

/** Runs in the browser. Elements that scroll smoothly. */
function smoothScrollers(): string[] {
	const out: string[] = [];
	const walk = (root: Document | ShadowRoot): void => {
		for (const el of root.querySelectorAll('*')) {
			if (getComputedStyle(el).scrollBehavior === 'smooth')
				out.push(`${el.tagName.toLowerCase()}.${typeof el.className === 'string' ? el.className : ''}`);
			if (el.shadowRoot) walk(el.shadowRoot);
		}
	};
	walk(document);
	if (getComputedStyle(document.documentElement).scrollBehavior === 'smooth') out.push('html');
	return out;
}

async function expectStill(page: Page): Promise<void> {
	expect(await page.evaluate(runningAnimations), 'running animations and transitions').toEqual([]);
	expect(await page.evaluate(smoothScrollers), 'elements with smooth scrolling').toEqual([]);
}

test('the check sees a running animation and lets the slowed spinner through (it is not vacuous)', async ({ page }) => {
	await openPage(page, ALL);
	expect(await page.evaluate(runningAnimations)).toEqual([]);
	await page.evaluate(() => {
		document.head.insertAdjacentHTML('beforeend', '<style>@keyframes zz{to{opacity:.5}} #zz{animation:zz 1s infinite}</style>');
		document.body.insertAdjacentHTML('beforeend', '<div id="zz">x</div>');
	});
	expect((await page.evaluate(runningAnimations)).join()).toContain('zz');
	// the spinners do run: in forced-colors.html there is a <k-spinner> and a loading button
	const spinning = await page.evaluate(() => {
		const spin = (sel: string): number => {
			const el = document.querySelector(sel)?.shadowRoot?.querySelector('.ring, .spin');
			return el ? el.getAnimations().filter((a) => a.playState === 'running').length : 0;
		};
		return [spin('#spinner'), spin('#btn-loading')];
	});
	expect(spinning).toEqual([1, 1]);
});

for (const theme of THEMES) {
	for (const name of PAGES) {
		test(`reduced motion: ${name} page in ${theme}`, async ({ page }) => {
			await openPage(page, name, { theme });
			await expectStill(page);
		});
	}
	// the open states in the two themes with their own motion (Code steps, Flower eases); the pages above run in all eight
	for (const [name, state] of theme === 'code' || theme === 'flower' ? Object.entries(STATES) : []) {
		test(`reduced motion: ${name} open in ${theme}`, async ({ page }) => {
			await openPage(page, ALL, { theme, ...(state.narrow ? { width: 320, height: 640 } : {}) });
			// no wait: a transition that the opening started is still running now
			await state.prepare(page);
			await expectStill(page);
		});
	}

	test(`reduced motion: hovering, focusing and operating the controls in ${theme}`, async ({ page }) => {
		test.setTimeout(120_000);
		await openPage(page, ALL, { theme });
		const seen = new Set<string>();
		const look = async (what: string): Promise<void> => {
			for (const f of await page.evaluate(runningAnimations)) seen.add(`${f} (after ${what})`);
			for (const f of await page.evaluate(smoothScrollers)) seen.add(`smooth scrolling on ${f} (after ${what})`);
		};
		// hover every control
		const controls = page.locator(
			'button:visible, a[href]:visible, summary:visible, [role=tab]:visible, [role=switch]:visible, input:visible, select:visible'
		);
		const count = await controls.count();
		expect(count).toBeGreaterThan(60);
		for (let i = 0; i < count; i++) {
			const box = await controls.nth(i).evaluate((el) => {
				el.scrollIntoView({ block: 'center', behavior: 'instant' });
				const r = el.getBoundingClientRect();
				return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width };
			});
			if (box.w < 2) continue;
			await page.mouse.move(box.x, box.y);
			await look(`hovering control ${i}`);
		}
		// focus every tab stop with the keyboard
		await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
		await page.evaluate(() => window.scrollTo(0, 0));
		for (let i = 0; i < 160; i++) {
			await page.keyboard.press('Tab');
			await look(`Tab ${i + 1}`);
		}
		// operate the parts that change state: disclosure, tabs, toggles, carousel, theme toggle, sorting
		const operate = [
			'#accordion summary >> nth=1',
			'#collapsible-closed summary',
			'#tabs [role=tab] >> nth=1',
			'#switch-off',
			'#check-off',
			'#radio input >> nth=1',
			'#carousel .nav >> nth=1',
			'#theme-toggle button',
			'#datatable thead button >> nth=0',
			'#pagination button >> nth=2',
			'#alert-warn .x'
		];
		for (const selector of operate) {
			const target = page.locator(selector).first();
			if ((await target.count()) === 0 || !(await target.isVisible())) continue;
			await target.click({ timeout: 3000 }).catch(() => undefined);
			await look(`operating ${selector}`);
		}
		expect([...seen]).toEqual([]);
	});
}

test.describe('reduced motion: the effect components show their final state at once', () => {
	test('typewriter, scramble, count-up, odometer and carousel', async ({ page }) => {
		await openPage(page, ALL, { reducedMotion: 'reduce' });
		const text = (sel: string): Promise<string> =>
			page.locator(sel).evaluate((el) => (el.shadowRoot?.textContent ?? el.textContent ?? '').replace(/\s+/g, ' ').trim());
		expect(await text('#typewriter')).toContain('Collect colours.');
		expect(await text('#scramble')).toContain('Mint 14');
		expect(await text('#countup')).toContain('1,248');
		expect(await text('#odometer')).toContain('2026');
		// the carousel moves in one step, not in a smooth scroll
		const track = page.locator('#carousel .track');
		await page.locator('#carousel .nav[aria-disabled=false]').click();
		const left = await track.evaluate((el) => el.scrollLeft);
		expect(left, 'one click scrolls at once').toBeGreaterThan(0);
	});
});
