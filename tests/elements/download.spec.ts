import { readFile } from 'node:fs/promises';
import { expect, test, type Download, type Page } from '@playwright/test';

// <k-download-button> and the save helpers in a real browser (#92): the file that arrives, its name and bytes,
// the announcements, the keyboard, the error paths. Name cleaning, MIME defaults and the result types are in
// tests/unit/download.test.ts; the markup is in tests/components/download-button.test.ts.

declare global {
	interface Window {
		events: string[];
		docClicks: number;
		blobTypes: string[];
		revoked: string[];
	}
}

test.beforeEach(async ({ page }) => {
	// Records the type of every blob that is offered, and when its URL is given back.
	await page.addInitScript(() => {
		window.blobTypes = [];
		window.revoked = [];
		const create = URL.createObjectURL.bind(URL);
		const revoke = URL.revokeObjectURL.bind(URL);
		URL.createObjectURL = (blob: Blob | MediaSource) => {
			window.blobTypes.push((blob as Blob).type);
			return create(blob);
		};
		URL.revokeObjectURL = (url: string) => {
			window.revoked.push(url);
			revoke(url);
		};
	});
	await page.goto('/tests/elements/pages/download.html');
	await page.waitForFunction(
		() => document.getElementById('late') && (document.getElementById('late') as HTMLElement & { getContent?: unknown }).getContent
	);
});

async function bytesOf(download: Download): Promise<Buffer> {
	const path = await download.path();
	return readFile(path);
}

/** Clicks the button of the element `id` and returns the download it starts. */
async function downloadFrom(page: Page, id: string): Promise<Download> {
	const pending = page.waitForEvent('download');
	await page.locator(`#${id} button`).click();
	return pending;
}

test('text: the file has the given name and the UTF-8 bytes of the text', async ({ page }) => {
	const download = await downloadFrom(page, 'text');
	expect(download.suggestedFilename()).toBe('hello.txt');
	expect((await bytesOf(download)).toString('utf8')).toBe('Grüße, 日本語 😀');
	expect(await bytesOf(download)).toEqual(Buffer.from('Grüße, 日本語 😀', 'utf8'));
	expect(await page.evaluate(() => window.blobTypes)).toEqual(['text/plain;charset=utf-8']);
	const size = Buffer.byteLength('Grüße, 日本語 😀', 'utf8');
	expect(await page.evaluate(() => window.events)).toEqual([
		`text:download:{"name":"hello.txt","size":${size},"type":"text/plain;charset=utf-8"}`
	]);
});

test('text with a type: the MIME type is the one given, with UTF-8', async ({ page }) => {
	const download = await downloadFrom(page, 'icon');
	expect(download.suggestedFilename()).toBe('table.csv');
	expect((await bytesOf(download)).toString('utf8')).toBe('a,b');
	expect(await page.evaluate(() => window.blobTypes)).toEqual(['text/csv;charset=utf-8']);
});

test('the name is cleaned: no path survives, an empty name becomes the catalogue fallback', async ({ page }) => {
	// Chromium also drops leading dots from the suggested name; the event carries the name kern used.
	expect((await downloadFrom(page, 'path')).suggestedFilename()).toMatch(/^[^/\\]*etc_passwd$/);
	expect((await downloadFrom(page, 'bare')).suggestedFilename()).toMatch(/^download(\.txt)?$/);
	await expect.poll(() => page.evaluate(() => window.events.map((e) => e.split(':')[0]))).toEqual(['path', 'bare']);
	expect(await page.evaluate(() => window.events[0])).toContain('"name":".._.._etc_passwd"');
});

test('Blob property: the bytes arrive unchanged, with the blob type', async ({ page }) => {
	const download = await downloadFrom(page, 'blob');
	expect(download.suggestedFilename()).toBe('data.bin');
	expect(await bytesOf(download)).toEqual(Buffer.from([0, 1, 2, 253, 254, 255]));
	expect(await page.evaluate(() => window.blobTypes)).toEqual(['application/octet-stream']);
	expect(await page.evaluate(() => window.events)).toEqual([
		'blob:download:{"name":"data.bin","size":6,"type":"application/octet-stream"}'
	]);
});

test('the object URL is given back after the click, not during it', async ({ page }) => {
	await downloadFrom(page, 'text');
	await expect.poll(() => page.evaluate(() => window.revoked.length)).toBe(1);
	// The synthetic click never reached a handler on the document.
	expect(await page.evaluate(() => window.docClicks)).toBe(0);
});

test('async producer: busy state, one download for two clicks, focus comes back, result is shown and announced', async ({ page }) => {
	const button = page.locator('#late button');
	await button.focus();
	let downloads = 0;
	page.on('download', () => downloads++);
	const pending = page.waitForEvent('download');
	await page.keyboard.press('Enter');
	await expect(button).toHaveAttribute('aria-busy', 'true');
	await expect(button).toBeDisabled();
	await pending.then(async (download) => {
		expect(download.suggestedFilename()).toBe('late.csv');
		expect((await bytesOf(download)).toString('utf8')).toBe('id,name\n1,Ada\n');
	});
	await expect(button).not.toHaveAttribute('aria-busy');
	await expect(button).toBeFocused();
	// show-status makes the spoken text visible too.
	const status = page.locator('#late .k-status-message[role="status"]');
	await expect(status).toHaveText('Download started');
	await expect(status).toBeVisible();
	expect(downloads).toBe(1);
});

test('the reset timer of an earlier click does not end a later busy state', async ({ page }) => {
	// Regression (claude-review on #98): the reset timer of click 1 used to set the status to idle while
	// the slow producer of click 2 was still pending, re-enabling the button mid-download.
	await page.evaluate(() => {
		const late = document.getElementById('late') as HTMLElement & { getContent: () => Promise<string> };
		late.setAttribute('reset-after', '300');
		late.getContent = () => new Promise((resolve) => setTimeout(() => resolve('slow'), 700));
	});
	const button = page.locator('#late button');
	const first = page.waitForEvent('download');
	await button.click();
	await first;
	await expect(button).not.toHaveAttribute('aria-busy');
	// Click 2 starts before the 300 ms reset timer of click 1 has fired.
	const second = page.waitForEvent('download');
	await button.click();
	await expect(button).toHaveAttribute('aria-busy', 'true');
	// Past the moment the old timer would have fired, the producer of click 2 is still pending.
	await page.waitForTimeout(450);
	await expect(button).toHaveAttribute('aria-busy', 'true');
	await expect(button).toBeDisabled();
	await second;
	await expect(button).not.toHaveAttribute('aria-busy');
});

test('keyboard: Enter and Space start the download', async ({ page }) => {
	const button = page.locator('#text button');
	await button.focus();
	const first = page.waitForEvent('download');
	await page.keyboard.press('Enter');
	expect((await first).suggestedFilename()).toBe('hello.txt');
	const second = page.waitForEvent('download');
	await page.keyboard.press('Space');
	expect((await second).suggestedFilename()).toBe('hello.txt');
});

test('success is announced once per click, set fresh each time and kept', async ({ page }) => {
	await page.evaluate(() => {
		const region = document.getElementById('text')?.shadowRoot?.querySelector('.k-status-message[role="status"]');
		if (!region) throw new Error('no live region');
		window.events = [];
		new MutationObserver(() => window.events.push(`live:${region.textContent ?? ''}`)).observe(region, {
			childList: true,
			characterData: true,
			subtree: true
		});
	});
	const status = page.locator('#text .k-status-message[role="status"]');
	await expect(status).toHaveText('');
	await downloadFrom(page, 'text');
	await expect.poll(() => page.evaluate(() => window.events.at(-1))).toBe('live:Download started');
	// The icon returns to idle after reset-after (300 ms); the message stays.
	await expect(page.locator('#text button')).not.toHaveAttribute('data-status', 'started');
	await expect(status).toHaveText('Download started');
	await downloadFrom(page, 'text');
	await expect
		.poll(() => page.evaluate(() => window.events.filter((e) => e.startsWith('live:'))))
		.toEqual(['live:Download started', 'live:', 'live:Download started']);
	// The success message is not visible text unless show-status is set.
	const box = await status.boundingBox();
	expect(box === null || box.width <= 1).toBe(true);
});

test('a producer that throws: no download, the error text is visible and an alert, the event carries the error', async ({ page }) => {
	let downloads = 0;
	page.on('download', () => downloads++);
	await page.locator('#boom button').click();
	const alert = page.locator('#boom [role="alert"]');
	await expect(alert).toHaveText('Could not make the file');
	await expect(alert).toBeVisible();
	expect(await page.evaluate(() => window.events)).toEqual(['boom:download-error:{"code":"content","message":"no data yet"}']);
	await expect(page.locator('#boom .k-status-message[role="status"]')).toHaveText('');
	expect(downloads).toBe(0);
});

test('a producer that rejects: the catalogue error text, code "content"', async ({ page }) => {
	await page.locator('#reject button').click();
	await expect(page.locator('#reject [role="alert"]')).toHaveText('Download failed');
	expect(await page.evaluate(() => window.events)).toEqual(['reject:download-error:{"code":"content","message":"server said no"}']);
	await expect(page.locator('#reject button')).toBeEnabled();
});

test('no content at all is an error, not an empty file', async ({ page }) => {
	let downloads = 0;
	page.on('download', () => downloads++);
	await page.locator('#empty button').click();
	await expect(page.locator('#empty [role="alert"]')).toHaveText('Download failed');
	const [entry] = await page.evaluate(() => window.events);
	expect(entry).toContain('empty:download-error:{"code":"content"');
	expect(downloads).toBe(0);
});

test('the error message is cleared by the next successful click', async ({ page }) => {
	await page.evaluate(() => {
		const boom = document.getElementById('boom') as HTMLElement & { getContent: unknown; text: string };
		boom.text = 'fine';
	});
	await page.locator('#boom button').click();
	await expect(page.locator('#boom [role="alert"]')).toHaveText('Could not make the file');
	// getContent still throws; remove it so the text is used.
	await page.evaluate(() => ((document.getElementById('boom') as HTMLElement & { getContent: unknown }).getContent = undefined));
	const download = await downloadFrom(page, 'boom');
	expect(download.suggestedFilename()).toMatch(/^download(\.txt)?$/);
	await expect(page.locator('#boom [role="alert"]')).toHaveText('');
});

test('a disabled button does nothing', async ({ page }) => {
	await expect(page.locator('#off button')).toBeDisabled();
	expect(await page.evaluate(() => document.getElementById('off')?.getAttribute('disabled'))).not.toBeNull();
});

test('the German catalogue gives the names and messages', async ({ page }) => {
	await page.evaluate(() => {
		const { strings } = (window as unknown as { kern: { strings: { set(bundle: unknown): void; de: unknown } } }).kern;
		strings.set(strings.de);
	});
	await page.locator('#empty button').click();
	await expect(page.locator('#empty [role="alert"]')).toHaveText('Download fehlgeschlagen');
	expect((await downloadFrom(page, 'bare')).suggestedFilename()).toMatch(/^datei(\.txt)?$/);
});

test('nothing is sent anywhere: a download makes no request beyond the page itself', async ({ page }) => {
	const requests: string[] = [];
	page.on('request', (r) => requests.push(r.url()));
	const download = await downloadFrom(page, 'text');
	await download.path();
	expect(requests.filter((u) => !u.startsWith('http://127.0.0.1') && !u.startsWith('blob:') && !u.startsWith('data:'))).toEqual([]);
});
