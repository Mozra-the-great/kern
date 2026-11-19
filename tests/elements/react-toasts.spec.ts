import { de } from '../../src/lib/components/strings-de.js';
import { en } from '../../src/lib/components/strings.js';
import type { Page } from '@playwright/test';
import { expect, test } from './react-app.js';

// #35: toasts and the default texts are page-wide, not per React root. Two roots on one page share the toast store
// (`window.kern.toast`) and the strings catalogue (`window.kern.strings`).

interface KernWindow {
	kern: { strings: { set(bundle: object): void; reset(): void; de: object } };
}

test.beforeEach(async ({ app }) => {
	await app.open(['toasts', 'data']);
	await app.mount('toasts', 'second');
	await expect(app.page.locator('#second-toaster')).toBeAttached();
	await app.page.waitForFunction(() => document.getElementById('second-toaster')?.shadowRoot?.firstElementChild);
});

const toastIn = (app: { page: Page }, toaster: string, text: string) => app.page.locator(`#${toaster}`).getByText(text);

test('a toast raised in one root shows in the toaster of every root and closes through either', async ({ app, page }) => {
	await page.locator('#second-toast-plain').click();
	await expect(toastIn(app, 'toaster', 'Saved by second')).toHaveCount(1);
	await expect(toastIn(app, 'second-toaster', 'Saved by second')).toHaveCount(1);
	// No user input in either toaster, so no event.
	expect(await app.emitted()).toEqual([]);
	await page.locator('#toast-clear').click();
	await expect(toastIn(app, 'toaster', 'Saved by second')).toHaveCount(0);
	await expect(toastIn(app, 'second-toaster', 'Saved by second')).toHaveCount(0);
	expect(await app.emitted()).toEqual([]);
});

test('undo, dismiss and action: the toaster element reports, the toast callbacks run once', async ({ app, page }) => {
	await page.locator('#toast-undo').click();
	await expect(toastIn(app, 'toaster', 'Deleted by toasts')).toHaveCount(1);
	await page.locator('#toaster').getByRole('button', { name: 'Undo' }).click();
	await expect(toastIn(app, 'toaster', 'Deleted by toasts')).toHaveCount(0);
	await expect(toastIn(app, 'second-toaster', 'Deleted by toasts')).toHaveCount(0);
	const undone = await app.handled();
	expect(undone.map((h) => `${h.source}:${h.type}`).sort()).toEqual(['toaster:undo', 'toasts:toast-onclose', 'toasts:toast-onundo']);
	expect(undone.find((h) => h.type === 'undo')?.detail).toMatchObject({ key: 'delete' });
	expect(undone.find((h) => h.type === 'toast-onclose')?.detail).toBe('undo');

	await app.reset();
	await page.locator('#toast-undo').click();
	await page.locator('#second-toaster').getByRole('button', { name: 'Dismiss' }).click();
	await expect(toastIn(app, 'toaster', 'Deleted by toasts')).toHaveCount(0);
	const dismissed = await app.handled();
	// Pressed in the second toaster: only that toaster reports; oncommit runs for a dismissal, onundo does not.
	expect(dismissed.map((h) => `${h.source}:${h.type}`).sort()).toEqual(
		['second-toaster:dismiss', 'toasts:toast-oncommit', 'toasts:toast-onclose'].sort()
	);

	await app.reset();
	await page.locator('#second-toast-action').click();
	await page.locator('#toaster').getByRole('button', { name: 'Open' }).click();
	expect((await app.handled()).map((h) => `${h.source}:${h.type}`).sort()).toEqual(['second:toast-action', 'toaster:action']);
});

test('setting the strings changes the texts of every mounted element in every root, without a React render', async ({ app, page }) => {
	await page.locator('#toast-plain').click();
	await expect(page.locator('#toaster').getByRole('button', { name: en.toaster.dismissLabel })).toHaveCount(1);
	await expect(page.locator('#second-toaster').getByRole('button', { name: en.toaster.dismissLabel })).toHaveCount(1);
	await expect(page.locator('#pager').getByRole('button', { name: en.pagination.nextLabel })).toHaveCount(1);
	const commits = [await app.commits('toasts'), await app.commits('second'), await app.commits('data')];

	await page.evaluate(() => (window as unknown as KernWindow).kern.strings.set((window as unknown as KernWindow).kern.strings.de));
	await expect(page.locator('#toaster').getByRole('button', { name: de.toaster.dismissLabel })).toHaveCount(1);
	await expect(page.locator('#second-toaster').getByRole('button', { name: de.toaster.dismissLabel })).toHaveCount(1);
	await expect(page.locator('#pager').getByRole('button', { name: de.pagination.nextLabel })).toHaveCount(1);
	await expect(page.locator('#pager').getByRole('button', { name: en.pagination.nextLabel })).toHaveCount(0);
	await expect(page.locator('#table').getByRole('searchbox', { name: de.dataTable.searchLabel })).toBeVisible();
	// The toasts and elements were not touched by React: no render, no event.
	expect([await app.commits('toasts'), await app.commits('second'), await app.commits('data')]).toEqual(commits);
	expect(await app.emitted()).toEqual([]);

	// An element rendered by React afterwards starts in German, a re-render keeps it.
	await page.locator('#page-from-react').click();
	await expect(page.locator('#pager').getByRole('button', { name: de.pagination.prevLabel })).toHaveCount(1);

	await page.evaluate(() => (window as unknown as KernWindow).kern.strings.reset());
	await expect(page.locator('#toaster').getByRole('button', { name: en.toaster.dismissLabel })).toHaveCount(1);
	await expect(page.locator('#pager').getByRole('button', { name: en.pagination.prevLabel })).toHaveCount(1);
});

test('toasts raised while no toaster is mounted wait for the next one', async ({ app, page }) => {
	await app.unmount('toasts');
	await app.unmount('second');
	await page.evaluate(() =>
		(window as unknown as { kern: { toast(i: object): number } }).kern.toast({ message: 'Late news', duration: 0 })
	);
	await app.mount('toasts');
	await expect(toastIn(app, 'toaster', 'Late news')).toHaveCount(1);
	// A toaster in a root that came and went did not leave a second copy behind.
	await expect(page.getByText('Late news')).toHaveCount(1);
});
