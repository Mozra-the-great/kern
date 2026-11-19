import { expect, test, type Page } from '@playwright/test';

// Feedback and overlay parity (#42 Progress, #43 Toaster, #44 toast lifecycle, #45 Modal), in the
// browser through the built custom elements, which render the same Svelte components.

interface ToastApi {
	(input: string | Record<string, unknown>): number;
	clear(): void;
}
interface TestWindow {
	kern: { toast: ToastApi; dismissToast(id: number): void };
	log: string[];
	errors: string[];
}

async function ready(page: Page) {
	await page.waitForFunction(
		() => customElements.get('k-toaster') && document.querySelector('#toaster')?.shadowRoot?.querySelector('section')
	);
}

test.describe('Progress (#42)', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/tests/elements/pages/feedback.html');
		await ready(page);
	});

	test('aria values are right for normal, clamped and invalid inputs', async ({ page }) => {
		const aria = (name: string) =>
			page
				.getByRole('progressbar', { name, exact: true })
				.evaluate((el) => ['aria-valuemin', 'aria-valuemax', 'aria-valuenow', 'aria-valuetext'].map((a) => el.getAttribute(a)));
		expect(await aria('Upload')).toEqual(['0', '100', '40', null]);
		expect(await aria('Files')).toEqual(['0', '12', '3', '3 of 12 files']);
		expect(await aria('Clamped')).toEqual(['0', '100', '100', null]);
		expect(await aria('Bad max')).toEqual(['0', '100', '50', null]);
		expect(await aria('Negative')).toEqual(['0', '100', '0', null]);
		expect(await aria('Working')).toEqual(['0', '100', null, null]);
		await expect(page.locator('#p-files .val')).toHaveText('25%');
		await expect(page.locator('#p-files .bar')).toHaveAttribute('style', /width: 25%/);

		// NaN through the property, then back to indeterminate with null.
		await page.evaluate(() => Object.assign(document.getElementById('p-det') as HTMLElement, { value: Number.NaN }));
		expect(await aria('Upload')).toEqual(['0', '100', '0', null]);
		await page.evaluate(() => Object.assign(document.getElementById('p-det') as HTMLElement, { value: null }));
		expect(await aria('Upload')).toEqual(['0', '100', null, null]);
	});

	test('hide-label keeps the name for screen readers only', async ({ page }) => {
		await expect(page.getByRole('progressbar', { name: 'Hidden label' })).toBeVisible();
		await expect(page.locator('#p-hidden .label')).toHaveCount(0);
		await expect(page.locator('#p-det .label')).toHaveText('Upload');
	});

	test('the indeterminate bar animates only transform, in steps, with stripes (stuffcloud)', async ({ page }) => {
		const info = await page.locator('#p-ind .bar').evaluate((bar) => {
			const anims = bar.getAnimations();
			const cs = getComputedStyle(bar);
			return {
				count: anims.length,
				properties: anims.flatMap((a) =>
					(a.effect as KeyframeEffect)
						.getKeyframes()
						.flatMap((k) => Object.keys(k).filter((p) => !['offset', 'easing', 'composite', 'computedOffset'].includes(p)))
				),
				timing: cs.animationTimingFunction,
				image: cs.backgroundImage,
				widthVsTrack: bar.getBoundingClientRect().width - (bar.parentElement?.getBoundingClientRect().width ?? 0)
			};
		});
		expect(info.count).toBe(1);
		expect(new Set(info.properties)).toEqual(new Set(['transform']));
		expect(info.timing).toBe('steps(4)');
		expect(info.image).toContain('repeating-linear-gradient');
		// One period (32px) wider than the track (minus the track's two 1px borders).
		expect(Math.round(info.widthVsTrack)).toBe(30);
	});

	test('no animation or transition runs under prefers-reduced-motion', async ({ page }) => {
		await page.emulateMedia({ reducedMotion: 'reduce' });
		await page.evaluate(() => Object.assign(document.getElementById('p-det') as HTMLElement, { value: 90 }));
		const running = await page.evaluate(
			() =>
				[...document.querySelectorAll('k-progress')].flatMap((el) =>
					[...(el.shadowRoot?.querySelectorAll('*') ?? [])].flatMap((n) => n.getAnimations())
				).length
		);
		expect(running).toBe(0);
		// Stripes stay as a static pattern.
		await expect(page.locator('#p-ind .bar')).toHaveCSS('background-image', /repeating-linear-gradient/);
		await expect(page.locator('#p-det .bar')).toHaveAttribute('style', /width: 90%/);
	});

	test('forced colours keep the fill visible in Highlight (determinate, indeterminate, warn)', async ({ page }) => {
		await page.emulateMedia({ forcedColors: 'active' });
		const system = await page.evaluate(() => {
			const probe = document.createElement('div');
			probe.style.cssText = 'forced-color-adjust:none;background:Highlight;color:CanvasText';
			document.body.append(probe);
			const cs = getComputedStyle(probe);
			const out = { highlight: cs.backgroundColor, text: cs.color };
			probe.remove();
			return out;
		});
		for (const id of ['p-det', 'p-warn']) {
			await expect(page.locator(`#${id} .bar`)).toHaveCSS('background-color', system.highlight);
			await expect(page.locator(`#${id} .track`)).toHaveCSS('border-top-color', system.text);
		}
		for (const id of ['p-ind', 'p-warn-ind']) {
			const image = await page.locator(`#${id} .bar`).evaluate((el) => getComputedStyle(el).backgroundImage);
			expect(image).toContain('repeating-linear-gradient');
			expect(image).toContain(system.highlight);
		}
		await page.locator('#p-det').screenshot({ path: test.info().outputPath('forced-colors-progress.png') });
	});
});

test.describe('Toaster and toast lifecycle (#43, #44)', () => {
	test.beforeEach(async ({ page }) => {
		await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
		await page.goto('/tests/elements/pages/feedback.html');
		await ready(page);
		// Frozen: only runFor() moves time, so the remaining-time checks are exact.
		await page.clock.pauseAt(new Date('2026-01-01T00:01:00Z'));
		await page.evaluate(() => {
			const w = window as unknown as TestWindow;
			w.log = [];
			for (const type of ['dismiss', 'undo', 'action'])
				document
					.getElementById('toaster')
					?.addEventListener(type, (e) => w.log.push(`${type}:${JSON.stringify((e as CustomEvent).detail)}`));
		});
	});

	const region = (page: Page) => page.getByRole('region', { name: 'Benachrichtigungen' });

	test('both live regions exist before the first toast; danger goes to the alert region', async ({ page }) => {
		const status = region(page).getByRole('status');
		const alert = region(page).getByRole('alert');
		await expect(status).toHaveCount(1);
		await expect(alert).toHaveCount(1);
		await expect(status).toHaveAttribute('aria-atomic', 'false');
		await expect(alert).toHaveAttribute('aria-atomic', 'false');
		await expect(status).toBeEmpty();
		await page.evaluate(() => {
			const { toast } = (window as unknown as TestWindow).kern;
			toast({ message: 'saved', tone: 'ok' });
			toast({ message: 'heads up', tone: 'warn' });
			toast('note');
			toast({ message: 'broken', tone: 'danger' });
		});
		await expect(alert).toContainText('broken');
		await expect(status).toContainText('saved');
		await expect(status).toContainText('heads up');
		await expect(status).toContainText('note');
		await expect(status).not.toContainText('broken');
		await expect(alert).not.toContainText('saved');
	});

	test('pauses on hover and resumes with the time that was left', async ({ page }) => {
		await page.evaluate(() => (window as unknown as TestWindow).kern.toast({ message: 'hold', duration: 1000 }));
		const toast = region(page).locator('.toast', { hasText: 'hold' });
		await page.clock.runFor(400);
		await toast.hover();
		await page.clock.runFor(10_000);
		await expect(toast).toBeVisible();
		await page.mouse.move(1, 1);
		await page.clock.runFor(599);
		await expect(toast).toBeVisible();
		await page.clock.runFor(2);
		await expect(toast).toHaveCount(0);
	});

	test('pauses while a button inside has focus, also when focus moves within the toast', async ({ page }) => {
		await page.evaluate(() =>
			(window as unknown as TestWindow).kern.toast({ message: 'focus me', duration: 1000, onundo: () => undefined })
		);
		const toast = region(page).locator('.toast', { hasText: 'focus me' });
		await toast.getByRole('button', { name: 'Rückgängig' }).focus();
		await page.keyboard.press('Tab');
		await expect(toast.getByRole('button', { name: 'Schließen' })).toBeFocused();
		await page.clock.runFor(5000);
		await expect(toast).toBeVisible();
		await page.locator('#opener').focus();
		await page.clock.runFor(1001);
		await expect(toast).toHaveCount(0);
	});

	test('nagellacke sequence: undo never commits, timeout commits once, a replaced toast commits once', async ({ page }) => {
		await page.evaluate(() => {
			const w = window as unknown as TestWindow;
			w.kern.toast({
				message: 'A deleted',
				key: 'undo',
				duration: 3000,
				onundo: () => w.log.push('A undo'),
				oncommit: () => w.log.push('A commit'),
				onclose: (r: string) => w.log.push(`A close ${r}`)
			});
		});
		// Undo: no commit.
		await region(page).getByRole('button', { name: 'Rückgängig' }).click();
		await page.clock.runFor(10_000);
		expect(await page.evaluate(() => (window as unknown as TestWindow).log)).toEqual([
			'A undo',
			'A close undo',
			expect.stringMatching(/^undo:\{"id":\d+,"key":"undo"\}$/)
		]);

		// Hover, then timeout: commit once. Then A and B with the same key: A commits on replace.
		await page.evaluate(() => {
			const w = window as unknown as TestWindow;
			w.log = [];
			for (const name of ['B', 'C'])
				w.kern.toast({
					message: `${name} deleted`,
					key: 'undo',
					duration: 3000,
					onundo: () => w.log.push(`${name} undo`),
					oncommit: () => w.log.push(`${name} commit`)
				});
		});
		await expect(region(page).locator('.toast')).toHaveCount(1);
		const c = region(page).locator('.toast', { hasText: 'C deleted' });
		await c.hover();
		await page.clock.runFor(10_000);
		await page.mouse.move(1, 1);
		await page.clock.runFor(3001);
		await page.evaluate(() => (window as unknown as TestWindow).kern.toast.clear());
		expect(await page.evaluate(() => (window as unknown as TestWindow).log)).toEqual(['B commit', 'C commit']);
	});

	test('dismiss button commits, fires the dismiss event and keyboard focus moves to the next toast', async ({ page }) => {
		await page.evaluate(() => {
			const w = window as unknown as TestWindow;
			w.kern.toast({ message: 'first', duration: 0, oncommit: () => w.log.push('first commit') });
			w.kern.toast({ message: 'second', duration: 0 });
		});
		const first = region(page).locator('.toast', { hasText: 'first' });
		await page.locator('#opener').focus();
		await first.getByRole('button', { name: 'Schließen' }).focus();
		await page.keyboard.press('Enter');
		await expect(first).toHaveCount(0);
		await expect(region(page).locator('.toast', { hasText: 'second' }).getByRole('button', { name: 'Schließen' })).toBeFocused();
		await page.keyboard.press('Enter');
		await expect(page.locator('#opener')).toBeFocused();
		const log = await page.evaluate(() => (window as unknown as TestWindow).log);
		expect(log[0]).toBe('first commit');
		expect(log.filter((l) => l.startsWith('dismiss:'))).toHaveLength(2);
	});

	test('the max attribute limits open toasts; bottom-left sits at the left edge', async ({ page }) => {
		await page.evaluate(() => {
			const t = document.getElementById('toaster') as HTMLElement & { max: number; position: string };
			t.max = 2;
			t.position = 'bottom-left';
			for (const m of ['m1', 'm2', 'm3']) (window as unknown as TestWindow).kern.toast({ message: m, duration: 0 });
		});
		await expect(region(page).locator('.toast')).toHaveText([/m2/, /m3/]);
		const box = await region(page).boundingBox();
		expect(box?.x).toBe(0);
		await page.evaluate(() => {
			(document.getElementById('toaster') as HTMLElement & { max: number }).max = 5;
			(window as unknown as TestWindow).kern.toast.clear();
		});
	});
});

test.describe('Modal (#45)', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/tests/elements/pages/feedback.html');
		await ready(page);
		await page.evaluate(() => {
			const w = window as unknown as TestWindow;
			w.log = [];
			for (const id of ['block', 'normal'])
				for (const type of ['cancel', 'close']) document.getElementById(id)?.addEventListener(type, () => w.log.push(`${id} ${type}`));
		});
	});

	const setOpen = (page: Page, id: string, open: boolean) =>
		page.evaluate(([id, open]) => Object.assign(document.getElementById(id as string) as HTMLElement, { open }), [id, open] as const);

	test('dismissible="false": Escape and backdrop do nothing, no close button, focus stays inside', async ({ page }) => {
		await page.locator('#opener').focus();
		await setOpen(page, 'block', true);
		const dialog = page.getByRole('dialog', { name: 'Adopt local data?' });
		await expect(dialog).toBeVisible();
		await expect(page.locator('#adopt')).toBeFocused();
		await expect(dialog.getByRole('button', { name: 'Close' })).toHaveCount(0);
		for (let i = 0; i < 3; i++) await page.keyboard.press('Escape');
		await page.mouse.click(3, 3);
		await expect(dialog).toBeVisible();
		await expect(page.locator('#block')).toHaveAttribute('open', '');
		// Tab cycles through the dialog (and the browser's own UI, as with any modal <dialog>), never the page.
		const reached = new Set<string>();
		for (let i = 0; i < 8; i++) {
			await page.keyboard.press('Tab');
			reached.add(
				await page.evaluate(() => {
					const host = document.getElementById('block');
					const active = document.activeElement;
					if (!active || active === document.body) return 'outside the page';
					if (active === host) return 'close button';
					return host?.contains(active) ? active.id : `page:${active.id || active.tagName}`;
				})
			);
		}
		expect([...reached].filter((r) => r.startsWith('page:'))).toEqual([]);
		expect(reached).toContain('adopt');
		expect(reached).toContain('later');
		expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe('hidden');
		// Only the app closes it; focus returns to the opener and the page scrolls again.
		await setOpen(page, 'block', false);
		await expect(dialog).toBeHidden();
		await expect(page.locator('#opener')).toBeFocused();
		await expect.poll(() => page.evaluate(() => document.documentElement.style.overflow)).toBe('');
		await expect.poll(() => page.evaluate(() => (window as unknown as TestWindow).log)).toEqual(['block close']);
	});

	test('dismissible works as a property too (React sets properties)', async ({ page }) => {
		await page.evaluate(() => Object.assign(document.getElementById('normal') as HTMLElement, { dismissible: false, open: true }));
		const dialog = page.getByRole('dialog', { name: 'Delete folder?' });
		await expect(dialog.getByRole('button', { name: 'Close' })).toHaveCount(0);
		await page.keyboard.press('Escape');
		await expect(dialog).toBeVisible();
		await page.evaluate(() => Object.assign(document.getElementById('normal') as HTMLElement, { dismissible: true }));
		await expect(dialog.getByRole('button', { name: 'Close' })).toBeVisible();
		await page.keyboard.press('Escape');
		await expect(dialog).toBeHidden();
	});

	test('the cancel event is cancelable and keeps a dismissible modal open', async ({ page }) => {
		await page.evaluate(() => document.getElementById('normal')?.addEventListener('cancel', (e) => e.preventDefault()));
		await setOpen(page, 'normal', true);
		const dialog = page.getByRole('dialog', { name: 'Delete folder?' });
		await page.keyboard.press('Escape');
		await page.keyboard.press('Escape');
		await dialog.getByRole('button', { name: 'Close' }).click();
		await page.mouse.click(3, 3);
		await expect(dialog).toBeVisible();
		expect(await page.evaluate(() => (window as unknown as TestWindow).log)).toEqual([
			'normal cancel',
			'normal cancel',
			'normal cancel',
			'normal cancel'
		]);
	});

	test('a dismissible modal closes by Escape, close button and backdrop, firing cancel then close', async ({ page }) => {
		await page.locator('#opener2').focus();
		const dialog = page.getByRole('dialog', { name: 'Delete folder?' });
		await setOpen(page, 'normal', true);
		await page.keyboard.press('Escape');
		await expect(dialog).toBeHidden();
		await expect(page.locator('#opener2')).toBeFocused();
		await setOpen(page, 'normal', true);
		await dialog.getByRole('button', { name: 'Close' }).click();
		await expect(dialog).toBeHidden();
		await setOpen(page, 'normal', true);
		await page.mouse.click(3, 3);
		await expect(dialog).toBeHidden();
		expect(await page.evaluate(() => (window as unknown as TestWindow).log)).toEqual([
			'normal cancel',
			'normal close',
			'normal cancel',
			'normal close',
			'normal cancel',
			'normal close'
		]);
	});

	test('alert gives role="alertdialog" and initial-focus picks the primary action', async ({ page }) => {
		await setOpen(page, 'alertish', true);
		await expect(page.getByRole('alertdialog', { name: 'Discard changes?' })).toBeVisible();
		await expect(page.locator('#keep')).toBeFocused();
	});

	test('nested modals keep the page locked until the last one closes', async ({ page }) => {
		await setOpen(page, 'block', true);
		await setOpen(page, 'normal', true);
		await expect(page.getByRole('dialog', { name: 'Delete folder?' })).toBeVisible();
		await page.keyboard.press('Escape');
		await expect(page.getByRole('dialog', { name: 'Delete folder?' })).toBeHidden();
		await expect(page.getByRole('dialog', { name: 'Adopt local data?' })).toBeVisible();
		expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe('hidden');
		await setOpen(page, 'block', false);
		await expect.poll(() => page.evaluate(() => document.documentElement.style.overflow)).toBe('');
	});

	test('long content scrolls inside the dialog at 320px', async ({ page }) => {
		await page.setViewportSize({ width: 320, height: 480 });
		await page.evaluate(() => {
			const p = document.querySelector('#normal p') as HTMLElement;
			p.textContent = 'Lorem ipsum dolor sit amet. '.repeat(200);
		});
		await setOpen(page, 'normal', true);
		const dlg = page.locator('#normal dialog');
		const m = await dlg.evaluate((d) => ({ sh: d.scrollHeight, ch: d.clientHeight, rect: d.getBoundingClientRect().toJSON() as DOMRect }));
		expect(m.sh).toBeGreaterThan(m.ch);
		expect(m.rect.left).toBeGreaterThanOrEqual(0);
		expect(m.rect.right).toBeLessThanOrEqual(320);
		expect(m.rect.bottom).toBeLessThanOrEqual(480);
		await dlg.evaluate((d) => d.scrollTo(0, d.scrollHeight));
		await expect(page.locator('#cancel-btn')).toBeInViewport();
	});
});
