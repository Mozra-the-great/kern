import type { Page } from '@playwright/test';
import { expect, test } from './react-app.js';

// #35: sortable list, select grid and file drop with React as the owner of `items`, `selected` and the file list.

interface ListsState {
	files: string[];
	pictures: number[];
	selected: number[];
	picked: { name: string; size: number }[];
}

test.beforeEach(async ({ app }) => {
	await app.open(['lists']);
});

const itemNames = (app: { page: Page }) =>
	app.page
		.locator('#list')
		.getByRole('listitem')
		.evaluateAll((items) => items.map((li) => li.querySelector('.name')?.textContent));

test('sortable list: the element reports the move, React reorders `items`, the focus stays on the pressed button', async ({
	app,
	page
}) => {
	const list = page.locator('#list');
	expect(await itemNames(app)).toEqual(['Report.pdf', 'Invoice.pdf', 'Contract.pdf']);
	expect(await app.events()).toEqual([]);
	await list.getByRole('button', { name: 'Move Invoice.pdf up' }).click();
	expect(await app.handled()).toEqual([{ source: 'list', type: 'move', detail: { from: 1, to: 0 } }]);
	await expect.poll(() => itemNames(app)).toEqual(['Invoice.pdf', 'Report.pdf', 'Contract.pdf']);
	expect((await app.state<ListsState>('lists-state')).files).toEqual(['invoice', 'report', 'contract']);
	// The item is first now: "up" is disabled, so the focus moves to its partner instead of getting lost.
	await expect(list.getByRole('button', { name: 'Move Invoice.pdf down' })).toBeFocused();
	await page.keyboard.press('Enter');
	await expect.poll(() => itemNames(app)).toEqual(['Report.pdf', 'Invoice.pdf', 'Contract.pdf']);
	await expect(list.getByRole('button', { name: 'Move Invoice.pdf down' })).toBeFocused();

	await app.reset();
	await list.getByRole('button', { name: 'Remove Report.pdf' }).click();
	expect(await app.handled()).toEqual([{ source: 'list', type: 'remove', detail: { index: 0 } }]);
	await expect.poll(() => itemNames(app)).toEqual(['Invoice.pdf', 'Contract.pdf']);

	// A new array from React (reversed) is a prop update: no event.
	await app.reset();
	await page.locator('#reverse-files').click();
	await expect.poll(() => itemNames(app)).toEqual(['Contract.pdf', 'Invoice.pdf']);
	expect(await app.events()).toEqual([]);
});

test('select grid: clicks report the selection, `selected` from React is silent, Alt+Arrow reports the move', async ({ app, page }) => {
	const grid = page.locator('#grid');
	await grid.getByRole('option', { name: 'Berry' }).click();
	expect(await app.handled()).toEqual([{ source: 'grid', type: 'change', detail: [2] }]);
	await expect(grid.getByRole('option', { name: 'Berry' })).toHaveAttribute('aria-selected', 'true');
	await grid.getByRole('option', { name: 'Night' }).click({ modifiers: ['ControlOrMeta'] });
	expect((await app.state<ListsState>('lists-state')).selected).toEqual([2, 3]);

	await app.reset();
	await page.locator('#select-from-react').click();
	await expect(grid.getByRole('option', { name: 'Cloud' })).toHaveAttribute('aria-selected', 'true');
	await expect(grid.getByRole('option', { name: 'Berry' })).toHaveAttribute('aria-selected', 'true');
	await expect(grid.getByRole('option', { name: 'Night' })).toHaveAttribute('aria-selected', 'false');
	expect(await app.events()).toEqual([]);

	await grid.getByRole('option', { name: 'Mint' }).focus();
	await page.keyboard.press('Alt+ArrowRight');
	await expect.poll(async () => (await app.state<ListsState>('lists-state')).pictures).toEqual([2, 1, 3, 4]);
	expect(await app.handled()).toEqual([{ source: 'grid', type: 'move', detail: { from: 0, to: 1 } }]);
	await expect(grid.getByRole('option', { name: 'Mint' })).toBeFocused();
});

test('file drop: the pick reports the files and `el.files` holds them; reset() from React clears silently', async ({ app, page }) => {
	await page.locator('#drop input[type="file"]').setInputFiles([
		{ name: 'a.txt', mimeType: 'text/plain', buffer: Buffer.from('aaa') },
		{ name: 'b.txt', mimeType: 'text/plain', buffer: Buffer.from('bb') }
	]);
	await expect(page.locator('#lists-state')).toContainText('"picked":[{"name":"a.txt","size":3},{"name":"b.txt","size":2}]');
	expect(await app.handled()).toEqual([
		{
			source: 'drop',
			type: 'files',
			detail: [
				{ name: 'a.txt', size: 3, type: 'text/plain' },
				{ name: 'b.txt', size: 2, type: 'text/plain' }
			]
		}
	]);
	expect(await page.locator('#drop').evaluate((el) => (el as HTMLElement & { files: File[] }).files.map((f) => f.name))).toEqual([
		'a.txt',
		'b.txt'
	]);
	await expect(page.locator('#drop').getByText('a.txt')).toBeVisible();

	await app.reset();
	await page.locator('#clear-files').click();
	await expect(page.locator('#drop').getByText('a.txt')).toHaveCount(0);
	expect(await page.locator('#drop').evaluate((el) => (el as HTMLElement & { files: File[] }).files.length)).toBe(0);
	expect(await app.events()).toEqual([]);
});
