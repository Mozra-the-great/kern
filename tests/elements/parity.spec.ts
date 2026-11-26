import { expect, test, type Page } from '@playwright/test';

// Forms and content parity in a browser (#50–#54, #72): the built custom elements run the Svelte
// components, so clicks, keyboard, drops and live regions are checked here once for both. The
// markup-level cases (ids, roles, element choice) are in tests/components/forms-content.test.ts.

declare global {
	interface Window {
		events: string[];
	}
}

/** Records `type` events of the element `id` as "id:type:detail" in window.events. */
async function listen(page: Page, id: string, ...types: string[]) {
	await page.evaluate(
		([id, types]) => {
			const el = document.getElementById(id);
			for (const type of types)
				el?.addEventListener(type, (e) => {
					const detail = (e as CustomEvent<unknown>).detail;
					const shown = Array.isArray(detail)
						? detail.map((f) => (f instanceof File ? f.name : String(f))).join(',')
						: String(detail ?? '');
					window.events.push(`${id}:${type}:${shown}`);
				});
		},
		[id, types] as const
	);
}

/** Drops files (name, MIME type, size in bytes) on the drop target inside the element `id`. */
async function dropFiles(page: Page, id: string, files: [string, string, number][], target = '.drop') {
	await page.evaluate(
		([id, files, target]) => {
			const zone = document.getElementById(id)?.shadowRoot?.querySelector(target);
			if (!zone) throw new Error(`no ${target} in #${id}`);
			const dt = new DataTransfer();
			for (const [name, type, size] of files) dt.items.add(new File(['x'.repeat(size)], name, { type }));
			zone.dispatchEvent(new DragEvent('dragenter', { dataTransfer: dt, bubbles: true, cancelable: true }));
			zone.dispatchEvent(new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true }));
		},
		[id, files, target] as const
	);
}

/** Describes the focused element across shadow roots: "<host id>/<tag>". */
function focused(page: Page) {
	return page.evaluate(() => {
		let el: Element | null = document.activeElement;
		let host = '';
		while (el?.shadowRoot?.activeElement) {
			host = el.id || host;
			el = el.shadowRoot.activeElement;
		}
		return `${host}/${el?.tagName.toLowerCase() ?? ''}`;
	});
}

test.beforeEach(async ({ page }) => {
	await page.goto('/tests/elements/pages/parity.html');
	await page.waitForFunction(
		() => document.querySelector('#problem')?.shadowRoot?.querySelector('p') && document.querySelector('#c1')?.getAttribute('role')
	);
	await page.evaluate(() => (window.events = []));
});

test('no interactive element is nested in another, and the card list is a valid list (#50, #51)', async ({ page }) => {
	const nested = await page.evaluate(() => {
		const SELECTOR = 'a[href], button, input, select, textarea, [role="button"], [role="link"], [tabindex]:not([tabindex="-1"])';
		const parentOf = (el: Element): Element | null => el.parentElement ?? ((el.getRootNode() as ShadowRoot).host || null);
		const out: string[] = [];
		const walk = (root: Document | ShadowRoot) => {
			for (const el of root.querySelectorAll('*')) {
				if (el.shadowRoot) walk(el.shadowRoot);
				if (!el.matches(SELECTOR) || (el as HTMLInputElement).type === 'file') continue;
				for (let p = parentOf(el); p; p = parentOf(p))
					if (p.matches(SELECTOR)) out.push(`${el.tagName} in ${p.tagName}${p.id ? '#' + p.id : ''}`);
			}
		};
		walk(document);
		return out;
	});
	expect(nested).toEqual([]);
	const list = page.getByRole('list', { name: 'Polishes' });
	await expect(list.getByRole('listitem')).toHaveCount(2);
	// Only list items directly in the <ul>.
	expect(await page.evaluate(() => [...document.querySelectorAll('#cards > *')].map((c) => c.getAttribute('role')))).toEqual([
		'listitem',
		'listitem'
	]);
});

test('the card button covers the card; Enter and Space open it; keyboard order is open, toggle, delete (#51)', async ({ page }) => {
	await listen(page, 'c1', 'action');
	await listen(page, 'toggle', 'click');
	const open = page.getByRole('button', { name: 'Edit Ruby Red' });
	await expect(open).toHaveAttribute('aria-haspopup', 'dialog');

	await open.focus();
	await page.keyboard.press('Enter');
	await page.keyboard.press('Space');
	expect(await focused(page)).toBe('c1/button');
	await page.keyboard.press('Tab');
	expect(await focused(page)).toBe('toggle/button');
	await page.keyboard.press('Tab');
	expect(await focused(page)).toBe('delete/button');

	// A click anywhere on the card opens it; the footer buttons stay separate.
	// (A real mouse click at the text: Playwright's own click refuses because the card's hit area covers it.)
	const body = await page.locator('#c1').getByText('In stock.').boundingBox();
	if (!body) throw new Error('card body not rendered');
	await page.mouse.click(body.x + 5, body.y + body.height / 2);
	await page.locator('#toggle').click();
	expect(await page.evaluate(() => window.events)).toEqual(['c1:action:', 'c1:action:', 'c1:action:', 'toggle:click:1']);
	// The badge sits above the hit area and is visible.
	await expect(page.locator('#c1').getByText('2×')).toBeVisible();
});

test('a disabled link stays a link, cannot be followed and leaves the tab order (#52)', async ({ page }) => {
	await listen(page, 'off', 'click');
	const off = page.locator('#off a');
	await expect(off).toHaveAttribute('aria-disabled', 'true');
	await expect(off).toHaveAttribute('role', 'link');
	await expect(off).not.toHaveAttribute('href');
	await expect(page.getByRole('link', { name: 'Gone' })).toBeDisabled();
	await off.click({ force: true });
	expect(page.url()).not.toContain('#target');
	expect(await page.evaluate(() => window.events)).toEqual([]);

	await page.locator('#go a').focus();
	await page.keyboard.press('Tab');
	expect(await focused(page)).toBe('wide/button');
	await page.locator('#go a').click();
	await expect(page).toHaveURL(/#target$/);
});

test('wide puts the label at the start and the trailing content at the end; icon is a named square (#52)', async ({ page }) => {
	const wide = page.locator('#wide button');
	await expect(wide).toHaveCSS('justify-content', 'space-between');
	const [btn, host] = await Promise.all([wide.boundingBox(), page.locator('#wide').boundingBox()]);
	expect(btn?.width).toBeCloseTo(host?.width ?? 0, 0);
	const icon = page.getByRole('button', { name: 'Add' });
	const box = await icon.boundingBox();
	expect(box?.width).toBe(48); // Code --k-tap-icon
	expect(box?.height).toBe(48);
});

test('FileDrop: accept grammar, size limit, rejects and the files event (#53)', async ({ page }) => {
	await listen(page, 'drop', 'files', 'reject');
	await dropFiles(page, 'drop', [
		['a.PDF', '', 10],
		['b.png', 'image/png', 10],
		['c.txt', 'text/plain', 10],
		['d.pdf', 'application/pdf', 500]
	]);
	expect(await page.evaluate(() => window.events)).toEqual(['drop:reject:c.txt,d.pdf', 'drop:files:a.PDF,b.png']);
	// Without no-reject-messages the element shows and announces its own message.
	await expect(page.locator('#drop .error')).toContainText('c.txt');
	await expect(page.locator('#drop [role="status"]')).toContainText('c.txt');
	expect(await page.evaluate(() => (document.getElementById('drop') as HTMLElement & { files: File[] }).files.map((f) => f.name))).toEqual([
		'a.PDF',
		'b.png'
	]);
});

test('FileDrop: the host clears it with files = [] or reset(), without an event (#53)', async ({ page }) => {
	await dropFiles(page, 'drop', [
		['a.pdf', '', 10],
		['x.txt', 'text/plain', 1]
	]);
	await expect(page.locator('#drop li')).toHaveCount(1);
	await listen(page, 'drop', 'files');
	await page.evaluate(() => ((document.getElementById('drop') as HTMLElement & { files: File[] }).files = []));
	await expect(page.locator('#drop li')).toHaveCount(0);
	await expect(page.locator('#drop .error')).toHaveCount(1);
	await dropFiles(page, 'drop', [['b.pdf', '', 10]]);
	await expect(page.locator('#drop li')).toHaveCount(1);
	await page.evaluate(() => (document.getElementById('drop') as HTMLElement & { reset: () => void }).reset());
	await expect(page.locator('#drop li')).toHaveCount(0);
	await expect(page.locator('#drop .error')).toHaveCount(0);
	expect(await page.evaluate(() => window.events)).toEqual(['drop:files:b.pdf']);
});

test('FileDrop dispatch: separate button, nothing kept, same file again, multiple=false (#53)', async ({ page }) => {
	await listen(page, 'tool', 'files', 'reject');
	await listen(page, 'one', 'files', 'reject');
	await expect(page.getByRole('group', { name: 'Tool input Drop a JSON file' })).toBeVisible();
	const picker = page.getByRole('button', { name: 'Choose file' });
	await expect(picker).toBeVisible();

	const input = page.locator('#tool input[type="file"]');
	const json = { name: 'data.json', mimeType: 'application/json', buffer: Buffer.from('{}') };
	await input.setInputFiles(json);
	await input.setInputFiles(json);
	expect(await input.evaluate((el: HTMLInputElement) => el.files?.length)).toBe(0);
	await dropFiles(page, 'tool', [['notes.txt', 'text/plain', 3]], '.split');
	// no-reject-messages: the page reports refused files itself.
	await expect(page.locator('#tool .error')).toHaveCount(0);
	await expect(page.locator('#tool li')).toHaveCount(0);
	expect(await page.evaluate(() => (document.getElementById('tool') as HTMLElement & { files: File[] }).files.length)).toBe(0);

	await dropFiles(
		page,
		'one',
		[
			['1.pdf', '', 1],
			['2.pdf', '', 1]
		],
		'.split'
	);
	expect(await page.evaluate(() => window.events)).toEqual([
		'tool:files:data.json',
		'tool:files:data.json',
		'tool:reject:notes.txt',
		'one:reject:2.pdf',
		'one:files:1.pdf'
	]);
});

test('FileDrop: drag-over state, and a disabled zone takes nothing (#53)', async ({ page }) => {
	await page.evaluate(() => {
		const zone = document.getElementById('drop')?.shadowRoot?.querySelector('.drop');
		zone?.dispatchEvent(new DragEvent('dragenter', { dataTransfer: new DataTransfer(), bubbles: true, cancelable: true }));
	});
	await expect(page.locator('#drop button.zone')).toHaveClass(/dragging/);
	await page.evaluate(() => {
		const zone = document.getElementById('drop')?.shadowRoot?.querySelector('.drop');
		zone?.dispatchEvent(new DragEvent('dragleave', { bubbles: true }));
	});
	await expect(page.locator('#drop button.zone')).not.toHaveClass(/dragging/);

	await listen(page, 'locked', 'files', 'reject');
	await dropFiles(page, 'locked', [['a.pdf', '', 1]]);
	await expect(page.locator('#locked button.zone')).not.toHaveClass(/dragging/);
	await expect(page.locator('#locked button.zone')).toBeDisabled();
	expect(await page.evaluate(() => window.events)).toEqual([]);
});

test('field errors are alerts; hint and error are referenced together, error first (#54)', async ({ page }) => {
	for (const [id, tag] of [
		['pw', 'input'],
		['sel', 'select'],
		['note', 'textarea']
	] as const) {
		const control = page.locator(`#${id} ${tag}`);
		await expect(page.locator(`#${id} [role="alert"]`)).toHaveCount(0);
		await page.evaluate((id) => ((document.getElementById(id) as HTMLElement & { error: string }).error = 'Too short'), id);
		const alert = page.locator(`#${id} [role="alert"]`);
		await expect(alert).toHaveText('Too short');
		await expect(control).toHaveAttribute('aria-invalid', 'true');
		await expect(control).toHaveAccessibleDescription(id === 'pw' ? 'Too short At least 8 characters.' : 'Too short');
	}
	// Setting the same error again does not re-create the alert (no second announcement).
	const before = await page.locator('#pw [role="alert"]').elementHandle();
	await page.evaluate(() => ((document.getElementById('pw') as HTMLElement & { error: string }).error = 'Too short'));
	expect(await before?.evaluate((el) => el.isConnected)).toBe(true);
});

test('CopyButton: visible label is the name; message set fresh per click and kept (#72)', async ({ page, context }) => {
	await context.grantPermissions(['clipboard-read', 'clipboard-write']);
	const button = page.getByRole('button', { name: 'Copy HEX' });
	await expect(button).toBeVisible();
	await expect(button).not.toHaveAttribute('aria-label');
	await page.evaluate(() => {
		const region = document.getElementById('copy')?.shadowRoot?.querySelector('[role="status"]');
		if (!region) throw new Error('no live region');
		new MutationObserver(() => window.events.push(`live:${region.textContent ?? ''}`)).observe(region, {
			childList: true,
			characterData: true,
			subtree: true
		});
	});
	await button.click();
	await expect.poll(() => page.evaluate(() => window.events.at(-1))).toBe('live:Copied');
	expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('#FF00AA');
	// The icon resets after reset-after (200 ms); the message stays.
	await expect(page.locator('#copy button')).toHaveAttribute('data-status', 'idle');
	await expect(page.locator('#copy [role="status"]')).toHaveText('Copied');
	await button.click();
	await expect
		.poll(() => page.evaluate(() => window.events.filter((e) => e.startsWith('live:'))))
		.toEqual(['live:Copied', 'live:', 'live:Copied']);
});

test('StatusMessage: present and empty from the first paint, filled later (#72)', async ({ page }) => {
	const status = page.locator('#status p');
	await expect(status).toHaveAttribute('role', 'status');
	await expect(status).toHaveText('');
	const box = await status.boundingBox();
	expect(box?.height ?? 0).toBeGreaterThan(0);
	const region = await status.elementHandle();
	await page.evaluate(() => ((document.getElementById('status') as HTMLElement & { message: string }).message = '100 km = 62.1371 mi'));
	await expect(status).toHaveText('100 km = 62.1371 mi');
	expect(await region?.evaluate((el) => el.isConnected)).toBe(true);
	await page.evaluate(() => document.getElementById('problem')?.setAttribute('message', 'Not a colour'));
	await expect(page.locator('#problem p')).toHaveAttribute('role', 'alert');
	await expect(page.locator('#problem p')).toHaveText('Not a colour');
});

/** Every element that renders a Field with an error, with the attributes it needs to render at all. */
const ANNOUNCE_ELEMENTS: [tag: string, attrs: Record<string, string>][] = [
	['k-input', {}],
	['k-select', { options: '[{"value":"s","label":"Small"}]' }],
	['k-textarea', {}],
	['k-combobox', { options: '[{"value":"a","label":"Apple"}]' }],
	['k-number-input', {}],
	['k-date-picker', {}],
	['k-color-picker', {}],
	['k-tag-input', {}],
	['k-pin-input', {}],
	['k-rating', {}],
	['k-segmented-control', { options: '[{"value":"a","label":"List"}]' }],
	['k-slider', {}],
	['k-file-drop', {}]
];

test('no-announce: the error loses role="alert" but stays visible, referenced and invalid (#148)', async ({ page }) => {
	await page.evaluate((list) => {
		for (const [tag, attrs] of list) {
			for (const quiet of [false, true]) {
				const el = document.createElement(tag);
				el.id = `${quiet ? 'quiet' : 'loud'}-${tag}`;
				el.setAttribute('label', 'Field');
				for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, value);
				if (quiet) el.setAttribute('no-announce', '');
				el.setAttribute('error', 'Too short');
				document.body.append(el);
			}
		}
	}, ANNOUNCE_ELEMENTS);
	for (const [tag] of ANNOUNCE_ELEMENTS) {
		await expect(page.locator(`#loud-${tag} [role="alert"]`), `${tag} default`).toHaveText('Too short');
		const quiet = page.locator(`#quiet-${tag} p.error`);
		await expect(quiet, `${tag} no-announce`).toHaveText('Too short');
		await expect(quiet).not.toHaveAttribute('role', /.*/);
		await expect(page.locator(`#quiet-${tag} [role="alert"]`)).toHaveCount(0);
		if (tag !== 'k-file-drop') await expect(page.locator(`#quiet-${tag} [aria-invalid="true"]`).first()).toBeAttached();
	}
	// The three form controls: the error is the first description, the control invalid.
	for (const [tag, control] of [
		['k-input', 'input'],
		['k-select', 'select'],
		['k-textarea', 'textarea']
	] as const) {
		await expect(page.locator(`#quiet-${tag} ${control}`)).toHaveAttribute('aria-invalid', 'true');
		await expect(page.locator(`#quiet-${tag} ${control}`)).toHaveAccessibleDescription('Too short');
	}
});

test('noAnnounce property and no-announce attribute switch the alert role at runtime (#148)', async ({ page }) => {
	await page.evaluate(() => ((document.getElementById('pw') as HTMLElement & { error: string }).error = 'Too short'));
	await expect(page.locator('#pw [role="alert"]')).toHaveText('Too short');
	await page.evaluate(() => ((document.getElementById('pw') as HTMLElement & { noAnnounce: boolean }).noAnnounce = true));
	await expect(page.locator('#pw [role="alert"]')).toHaveCount(0);
	await expect(page.locator('#pw p.error')).toHaveText('Too short');
	await expect(page.locator('#pw input')).toHaveAccessibleDescription('Too short At least 8 characters.');
	await page.evaluate(() => ((document.getElementById('pw') as HTMLElement & { noAnnounce: boolean }).noAnnounce = false));
	await expect(page.locator('#pw [role="alert"]')).toHaveText('Too short');
	await page.evaluate(() => document.getElementById('pw')?.setAttribute('no-announce', ''));
	await expect(page.locator('#pw [role="alert"]')).toHaveCount(0);
	expect(await page.evaluate(() => (document.getElementById('pw') as HTMLElement & { noAnnounce: boolean }).noAnnounce)).toBe(true);
	await page.evaluate(() => document.getElementById('pw')?.removeAttribute('no-announce'));
	await expect(page.locator('#pw [role="alert"]')).toHaveText('Too short');
});
