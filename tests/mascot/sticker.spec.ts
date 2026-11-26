/**
 * Sticker (#182) in a real browser, against the built <k-sticker>: integer scale (also on phones), crisp
 * rendering, decorative vs labelled, nothing focusable, still (no animation, whatever the motion setting), the
 * art's own colours in every theme, and a strict CSP (same-origin files, no data: URIs, no violations).
 */
import { expect, test, type Page } from '@playwright/test';

interface Snapshot {
	sticker: string | null;
	src: string | null;
	alt: string | null;
	hidden: string | null;
	width: number;
	height: number;
	imgWidth: string | null;
	imgHeight: string | null;
	rendering: string;
	animations: number;
	loaded: boolean;
	focusable: number;
	text: string;
}

async function open(page: Page): Promise<void> {
	await page.goto('/tests/mascot/pages/sticker.html');
	await page.waitForFunction(() => (window as unknown as { ready?: boolean }).ready === true);
}

async function snap(page: Page, id: string): Promise<Snapshot> {
	return page.evaluate((elementId) => {
		const host = document.getElementById(elementId);
		const box = host?.shadowRoot?.querySelector<HTMLElement>('.k-sticker');
		if (!host || !box) throw new Error(`no sticker #${elementId}`);
		const img = box.querySelector('img');
		const rect = box.getBoundingClientRect();
		return {
			sticker: box.dataset['sticker'] ?? null,
			src: img?.getAttribute('src') ?? null,
			alt: img?.getAttribute('alt') ?? null,
			hidden: img?.getAttribute('aria-hidden') ?? null,
			width: rect.width,
			height: rect.height,
			imgWidth: img?.getAttribute('width') ?? null,
			imgHeight: img?.getAttribute('height') ?? null,
			rendering: img ? getComputedStyle(img).imageRendering : '',
			animations: img?.getAnimations().length ?? 0,
			loaded: !!img && img.complete && img.naturalWidth > 0,
			focusable: box.querySelectorAll('a, button, input, [tabindex]').length,
			text: (box.textContent ?? '').trim()
		};
	}, id);
}

async function add(page: Page, attrs: Record<string, string>): Promise<string> {
	return page.evaluate((attributes) => {
		const el = document.createElement('k-sticker');
		const id = `s${String(document.querySelectorAll('k-sticker').length)}`;
		el.id = id;
		for (const [k, v] of Object.entries(attributes)) el.setAttribute(k, v);
		document.body.prepend(el);
		return id;
	}, attrs);
}

test('draws the svg file decoratively at an integer scale, crisp and still', async ({ page }) => {
	await open(page);
	await expect.poll(async () => (await snap(page, 'main')).loaded).toBe(true);
	const s = await snap(page, 'main');
	expect(s).toMatchObject({
		sticker: 'qr',
		src: '/assets/code/tool-stickers/sticker-qr.svg',
		alt: '',
		hidden: 'true',
		text: '',
		focusable: 0,
		animations: 0
	});
	// qr is 9 x 9 art pixels; scale 6 → 54 x 54, reserved by attributes and CSS.
	expect([s.imgWidth, s.imgHeight, s.width, s.height]).toEqual(['54', '54', 54, 54]);
	expect(s.rendering).toMatch(/pixelated|crisp-edges/);
});

test('a label makes it a named image', async ({ page }) => {
	await open(page);
	const s = await snap(page, 'named');
	expect([s.alt, s.hidden]).toEqual(['Merge PDFs', null]);
	await expect(page.getByRole('img', { name: 'Merge PDFs' })).toBeVisible();
	// The decorative one is not in the accessibility tree.
	await expect(page.getByRole('img')).toHaveCount(1);
});

test('cuts fractional and invalid scales to whole pixels, default scale 4', async ({ page }) => {
	await open(page);
	const fractional = await snap(page, await add(page, { name: 'qr', base: '/assets/code', scale: '5.8' }));
	expect([fractional.imgWidth, fractional.width]).toEqual(['45', 45]);
	const invalid = await snap(page, await add(page, { name: 'qr', base: '/assets/code', scale: '-2' }));
	expect([invalid.imgWidth, invalid.width]).toEqual(['9', 9]);
	const fallback = await snap(page, await add(page, { name: 'qr', base: '/assets/code' }));
	expect(fallback.width).toBe(36);
});

test('uses the compact scale on phones', async ({ page }) => {
	await page.setViewportSize({ width: 375, height: 812 });
	await open(page);
	const s = await snap(page, 'main');
	// compact-scale 3 → 27 x 27; the attributes keep the desktop size, CSS draws the box.
	expect([s.width, s.height]).toEqual([27, 27]);
	expect(s.imgWidth).toBe('54');
});

test('draws nothing for an unknown name and nothing without a source', async ({ page }) => {
	await open(page);
	const unknown = await snap(page, await add(page, { name: 'mascots/axo', base: '/assets/code' }));
	expect([unknown.src, unknown.sticker, unknown.width]).toEqual([null, null, 0]);
	const bare = await snap(page, await add(page, { name: 'qr' }));
	expect([bare.src, bare.sticker]).toEqual([null, 'qr']);
});

test('keeps the art in its own colours in every theme: no filter, blend or opacity from a token', async ({ page }) => {
	await open(page);
	await expect.poll(async () => (await snap(page, 'main')).loaded).toBe(true);
	const look = (): Promise<string[]> =>
		page.evaluate(() => {
			const img = document.getElementById('main')?.shadowRoot?.querySelector('img');
			const box = document.getElementById('main')?.shadowRoot?.querySelector('.k-sticker');
			if (!img || !box) throw new Error('no sticker');
			const style = getComputedStyle(img);
			return [style.filter, style.mixBlendMode, style.opacity, style.imageRendering, String(box.getBoundingClientRect().width)];
		});
	const first = await look();
	expect(first.slice(0, 3)).toEqual(['none', 'normal', '1']);
	for (const theme of ['code-light', 'flower', 'pop-dark', 'line-light']) {
		await page.evaluate((t) => (document.documentElement.dataset['theme'] = t), theme);
		expect(await look()).toEqual(first);
	}
});

test('works under a strict CSP: same-origin files, no data: URIs, no violations', async ({ page }) => {
	await open(page);
	await page.waitForFunction(() =>
		[...document.querySelectorAll('k-sticker')].every((m) => {
			const img = m.shadowRoot?.querySelector('img');
			return !!img && img.complete && img.naturalWidth > 0;
		})
	);
	const result = await page.evaluate(() => {
		const w = window as unknown as { violations: string[]; errors: string[] };
		const srcs = [...document.querySelectorAll('k-sticker')].map((m) => m.shadowRoot?.querySelector('img')?.src ?? '');
		return { violations: w.violations, errors: w.errors, srcs, sameOrigin: srcs.every((s) => new URL(s).origin === location.origin) };
	});
	expect(result.violations).toEqual([]);
	expect(result.errors).toEqual([]);
	expect(result.sameOrigin).toBe(true);
	expect(result.srcs.some((s) => s.startsWith('data:'))).toBe(false);
});
