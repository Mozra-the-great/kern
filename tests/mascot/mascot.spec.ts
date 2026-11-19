/**
 * Pixel-art runtime (#55) in a real browser, against the built <k-mascot>: the behaviour of
 * stuffcloud's ADR 0008 and the component tests of stuffcloud's `mascot.test.ts` (markup,
 * integer scale, motion states, off-screen and hidden-tab pause, observer teardown), plus what
 * stuffcloud checked by hand (`bench/run.ts verify`): one steps(1) transform animation,
 * reduced motion, no layout shift, a strict CSP without data: URIs.
 */
import { expect, test, type Page } from '@playwright/test';

interface Snapshot {
	motion: string | null;
	mascot: string | null;
	width: number;
	height: number;
	src: string | null;
	alt: string | null;
	hidden: string | null;
	draggable: string | null;
	imgWidth: string | null;
	imgHeight: string | null;
	text: string;
	animations: { name: string; playState: string; easing: string; properties: string[] }[];
}

async function open(page: Page): Promise<void> {
	await page.goto('/tests/mascot/pages/mascot.html');
	await page.waitForFunction(() => (window as unknown as { ready?: boolean }).ready === true);
}

/** State of one <k-mascot> (by id): its inner box, image and running animations. */
async function snap(page: Page, id: string): Promise<Snapshot> {
	return page.evaluate((elementId) => {
		const host = document.getElementById(elementId);
		const box = host?.shadowRoot?.querySelector<HTMLElement>('.k-mascot');
		if (!host || !box) throw new Error(`no mascot #${elementId}`);
		const img = box.querySelector('img');
		const rect = box.getBoundingClientRect();
		return {
			motion: box.dataset['motion'] ?? null,
			mascot: box.dataset['mascot'] ?? null,
			width: rect.width,
			height: rect.height,
			src: img?.getAttribute('src') ?? null,
			alt: img?.getAttribute('alt') ?? null,
			hidden: img?.getAttribute('aria-hidden') ?? null,
			draggable: img?.getAttribute('draggable') ?? null,
			imgWidth: img?.getAttribute('width') ?? null,
			imgHeight: img?.getAttribute('height') ?? null,
			text: (box.textContent ?? '').trim(),
			animations: (img?.getAnimations() ?? []).map((a) => {
				const effect = a.effect as KeyframeEffect | null;
				const frames = effect?.getKeyframes() ?? [];
				const skip = new Set(['offset', 'easing', 'composite', 'computedOffset']);
				return {
					name: (a as CSSAnimation).animationName ?? '',
					playState: a.playState,
					easing: String(effect?.getTiming().easing ?? ''),
					properties: [...new Set(frames.flatMap((f) => Object.keys(f).filter((k) => !skip.has(k))))]
				};
			})
		};
	}, id);
}

/** Adds a <k-mascot> with the given attributes to the top of the page and returns its id. */
async function add(page: Page, attrs: Record<string, string>): Promise<string> {
	return page.evaluate((attributes) => {
		const el = document.createElement('k-mascot');
		const id = `m${String(document.querySelectorAll('k-mascot').length)}`;
		el.id = id;
		for (const [k, v] of Object.entries(attributes)) el.setAttribute(k, v);
		document.body.prepend(el);
		return id;
	}, attrs);
}

const setVisibility = (page: Page, state: 'hidden' | 'visible'): Promise<void> =>
	page.evaluate((s) => {
		Object.defineProperty(document, 'visibilityState', { configurable: true, value: s });
		document.dispatchEvent(new Event('visibilitychange'));
	}, state);

test.describe('markup', () => {
	test('draws the svg file decoratively, without text, at an integer scale', async ({ page }) => {
		await open(page);
		const s = await snap(page, 'main');
		expect(s).toMatchObject({
			mascot: 'stuffy',
			src: '/assets/stuffcloud/mascots/axo.svg',
			alt: '',
			hidden: 'true',
			draggable: 'false',
			text: ''
		});
		// stuffy is 16 x 11 art pixels; scale 16 → 256 x 176, reserved by attributes and CSS.
		expect([s.imgWidth, s.imgHeight, s.width, s.height]).toEqual(['256', '176', 256, 176]);
		const far = await snap(page, 'far');
		expect(far.src).toBe('/assets/stuffcloud/mascots/mascot-ghost.svg');
	});

	test('a label makes it a named image', async ({ page }) => {
		await open(page);
		const id = await add(page, { name: 'boo', base: '/assets/stuffcloud', label: 'Page expired' });
		const s = await snap(page, id);
		expect([s.alt, s.hidden]).toEqual(['Page expired', null]);
		await expect(page.getByRole('img', { name: 'Page expired' })).toBeVisible();
	});

	test('takes any shipped file by path, and src wins over base', async ({ page }) => {
		await open(page);
		const sticker = await snap(page, await add(page, { name: 'tool-stickers/sticker-qr', base: '/assets/stuffcloud', scale: '3' }));
		expect(sticker.src).toBe('/assets/stuffcloud/tool-stickers/sticker-qr.svg');
		const own = await snap(page, await add(page, { src: '/assets/stuffcloud/seasonal/deco-sun.svg', cols: '11', rows: '11', scale: '2' }));
		expect([own.src, own.width, own.height]).toEqual(['/assets/stuffcloud/seasonal/deco-sun.svg', 22, 22]);
	});

	test('cuts fractional and invalid scales to whole pixels', async ({ page }) => {
		await open(page);
		const fractional = await snap(page, await add(page, { name: 'cumulo', base: '/assets/stuffcloud', scale: '5.8' }));
		expect([fractional.imgWidth, fractional.width]).toEqual(['70', 70]);
		const invalid = await snap(page, await add(page, { name: 'cumulo', base: '/assets/stuffcloud', scale: '-2' }));
		expect([invalid.imgWidth, invalid.width]).toEqual(['14', 14]);
		const fallback = await snap(page, await add(page, { name: 'bun', base: '/assets/stuffcloud' }));
		expect(fallback.width).toBe(96); // default scale 8
	});

	test('uses the compact scale on phones', async ({ page }) => {
		await page.setViewportSize({ width: 375, height: 812 });
		await open(page);
		const s = await snap(page, 'main');
		// compact-scale 10 → 160 x 110; the attributes keep the desktop size, CSS draws the box.
		expect([s.width, s.height]).toEqual([160, 110]);
		const same = await snap(page, await add(page, { name: 'hop', base: '/assets/stuffcloud', scale: '6' }));
		expect(same.width).toBe(84);
	});
});

test.describe('motion', () => {
	test('runs one steps(1) transform-only animation', async ({ page }) => {
		await open(page);
		const s = await snap(page, 'main');
		expect(s.motion).toBe('running');
		expect(s.animations).toHaveLength(1);
		expect(s.animations[0]).toMatchObject({ playState: 'running', properties: ['transform'] });
		const timing = await page.evaluate(() => {
			const img = document.getElementById('main')?.shadowRoot?.querySelector('img');
			return img ? getComputedStyle(img).animationTimingFunction + ' ' + getComputedStyle(img).animationDuration : '';
		});
		expect(timing).toBe('steps(1) 1.2s');
	});

	test('period and offset follow the --k-mascot-bob-* tokens', async ({ page }) => {
		await open(page);
		const duration = await page.evaluate(() => {
			document.documentElement.style.setProperty('--k-mascot-bob-period', '2s');
			const img = document.getElementById('main')?.shadowRoot?.querySelector('img');
			return img ? getComputedStyle(img).animationDuration : '';
		});
		expect(duration).toBe('2s');
	});

	test('pauses off-screen and runs again in view', async ({ page }) => {
		await open(page);
		await expect.poll(async () => (await snap(page, 'far')).motion).toBe('paused');
		expect((await snap(page, 'far')).animations[0]?.playState).toBe('paused');
		await page.evaluate(() => document.getElementById('far')?.scrollIntoView());
		await expect.poll(async () => (await snap(page, 'far')).motion).toBe('running');
		await expect.poll(async () => (await snap(page, 'main')).motion).toBe('paused');
		expect((await snap(page, 'main')).animations[0]?.playState).toBe('paused');
	});

	test('pauses while the tab is hidden, also when it is in view', async ({ page }) => {
		await open(page);
		await setVisibility(page, 'hidden');
		await expect.poll(async () => (await snap(page, 'main')).motion).toBe('paused');
		await setVisibility(page, 'visible');
		await expect.poll(async () => (await snap(page, 'main')).motion).toBe('running');
	});

	test('starts paused when the tab is already hidden', async ({ page }) => {
		await page.addInitScript(() => Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' }));
		await open(page);
		expect((await snap(page, 'main')).motion).toBe('paused');
	});

	test('shows the still pose under prefers-reduced-motion, following a change of the setting', async ({ page }) => {
		await page.emulateMedia({ reducedMotion: 'reduce' });
		await open(page);
		expect((await snap(page, 'main')).animations).toEqual([]);
		await page.emulateMedia({ reducedMotion: 'no-preference' });
		await expect.poll(async () => (await snap(page, 'main')).animations.length).toBe(1);
		await page.emulateMedia({ reducedMotion: 'reduce' });
		await expect.poll(async () => (await snap(page, 'main')).animations.length).toBe(0);
	});

	test('animated="false" is still and never observes or listens', async ({ page }) => {
		await page.addInitScript(() => {
			const w = window as unknown as { observed: number; listeners: number };
			w.observed = 0;
			w.listeners = 0;
			const Native = window.IntersectionObserver;
			window.IntersectionObserver = class extends Native {
				override observe(target: Element): void {
					w.observed += 1;
					super.observe(target);
				}
			};
			const add = document.addEventListener.bind(document);
			document.addEventListener = ((type: string, ...rest: [EventListenerOrEventListenerObject, (boolean | AddEventListenerOptions)?]) => {
				if (type === 'visibilitychange') w.listeners += 1;
				add(type, ...rest);
			}) as typeof document.addEventListener;
		});
		await open(page);
		const before = await page.evaluate(() => {
			const w = window as unknown as { observed: number; listeners: number };
			return [w.observed, w.listeners];
		});
		const s = await snap(page, await add(page, { name: 'stuffy', base: '/assets/stuffcloud', animated: 'false' }));
		expect([s.motion, s.animations.length]).toEqual(['still', 0]);
		expect(
			await page.evaluate(() => {
				const w = window as unknown as { observed: number; listeners: number };
				return [w.observed, w.listeners];
			})
		).toEqual(before);
	});
});

test.describe('observer (stubbed IntersectionObserver)', () => {
	test.beforeEach(async ({ page }) => {
		await page.addInitScript(() => {
			type Callback = (entries: { isIntersecting: boolean }[]) => void;
			const state: { callback: Callback; observed: Element[]; disconnected: boolean }[] = [];
			(window as unknown as { observers: typeof state }).observers = state;
			window.IntersectionObserver = class {
				private readonly s: (typeof state)[number];
				constructor(callback: Callback) {
					this.s = { callback, observed: [], disconnected: false };
					state.push(this.s);
				}
				observe(el: Element): void {
					this.s.observed.push(el);
				}
				disconnect(): void {
					this.s.disconnected = true;
				}
			} as unknown as typeof IntersectionObserver;
		});
		await open(page);
	});

	const fire = (page: Page, index: number, entries: boolean[]): Promise<void> =>
		page.evaluate(
			([i, list]) => {
				const observers = (window as unknown as { observers: { callback: (e: { isIntersecting: boolean }[]) => void }[] }).observers;
				observers[i]?.callback(list.map((isIntersecting) => ({ isIntersecting })));
			},
			[index, entries] as const
		);

	test('observes its own box, one observer per mascot', async ({ page }) => {
		expect(
			await page.evaluate(() => {
				const observers = (window as unknown as { observers: { observed: Element[] }[] }).observers;
				const main = document.getElementById('main')?.shadowRoot?.querySelector('.k-mascot');
				return [observers.length, observers[0]?.observed.length, observers[0]?.observed[0] === main];
			})
		).toEqual([2, 1, true]);
	});

	test('follows the latest entry and ignores an empty call', async ({ page }) => {
		await fire(page, 0, [false]);
		await expect.poll(async () => (await snap(page, 'main')).motion).toBe('paused');
		await fire(page, 0, [false, true]);
		await expect.poll(async () => (await snap(page, 'main')).motion).toBe('running');
		await fire(page, 0, [true, false]);
		await expect.poll(async () => (await snap(page, 'main')).motion).toBe('paused');
		await fire(page, 0, []);
		expect((await snap(page, 'main')).motion).toBe('paused');
	});

	test('stays paused while hidden even in view', async ({ page }) => {
		await setVisibility(page, 'hidden');
		await fire(page, 0, [true]);
		await expect.poll(async () => (await snap(page, 'main')).motion).toBe('paused');
		await setVisibility(page, 'visible');
		await expect.poll(async () => (await snap(page, 'main')).motion).toBe('running');
	});

	test('disconnects the observer when it leaves the page', async ({ page }) => {
		expect(
			await page.evaluate(async () => {
				document.getElementById('main')?.remove();
				await new Promise((r) => setTimeout(r, 50));
				return (window as unknown as { observers: { disconnected: boolean }[] }).observers[0]?.disconnected;
			})
		).toBe(true);
	});
});

test('keeps running where IntersectionObserver does not exist', async ({ page }) => {
	await page.addInitScript(() => {
		Reflect.deleteProperty(window, 'IntersectionObserver');
	});
	await open(page);
	expect((await snap(page, 'main')).motion).toBe('running');
	expect((await snap(page, 'far')).motion).toBe('running');
});

test('reserves its box: the image arriving moves nothing', async ({ page }) => {
	let release: () => void = () => {};
	const gate = new Promise<void>((r) => (release = r));
	await page.route('**/assets/stuffcloud/mascots/axo.svg', async (route) => {
		await gate;
		await route.continue();
	});
	await page.goto('/tests/mascot/pages/mascot.html');
	await page.waitForFunction(() => (window as unknown as { ready?: boolean }).ready === true);
	const before = await page.evaluate(async () => {
		await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
		const w = window as unknown as { shifts: number; since: number };
		w.shifts = 0;
		w.since = performance.now();
		new PerformanceObserver((list) => {
			for (const e of list.getEntries() as (PerformanceEntry & { value: number })[]) if (e.startTime >= w.since) w.shifts += e.value;
		}).observe({ type: 'layout-shift', buffered: true });
		const img = document.getElementById('main')?.shadowRoot?.querySelector('img');
		return { complete: img?.complete, after: document.getElementById('after')?.getBoundingClientRect().top };
	});
	expect(before.complete).toBe(false);
	release();
	await page.waitForFunction(() => {
		const img = document.getElementById('main')?.shadowRoot?.querySelector('img');
		return !!img && img.complete && img.naturalWidth > 0;
	});
	const after = await page.evaluate(async () => {
		await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
		return {
			after: document.getElementById('after')?.getBoundingClientRect().top,
			shifts: (window as unknown as { shifts: number }).shifts
		};
	});
	expect(after.after).toBe(before.after);
	expect(after.shifts).toBe(0);
});

test('works under a strict CSP: same-origin files, no data: URIs, no violations', async ({ page }) => {
	await open(page);
	await page.evaluate(() => document.getElementById('far')?.scrollIntoView());
	await page.waitForFunction(() =>
		[...document.querySelectorAll('k-mascot')].every((m) => {
			const img = m.shadowRoot?.querySelector('img');
			return !!img && img.complete && img.naturalWidth > 0;
		})
	);
	const result = await page.evaluate(() => {
		const w = window as unknown as { violations: string[]; errors: string[] };
		const srcs = [...document.querySelectorAll('k-mascot')].map((m) => m.shadowRoot?.querySelector('img')?.src ?? '');
		return { violations: w.violations, errors: w.errors, srcs, sameOrigin: srcs.every((s) => new URL(s).origin === location.origin) };
	});
	expect(result.violations).toEqual([]);
	expect(result.errors).toEqual([]);
	expect(result.sameOrigin).toBe(true);
	expect(result.srcs.some((s) => s.startsWith('data:'))).toBe(false);
});
