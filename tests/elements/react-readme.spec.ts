import { expect, test } from './react-app.js';

// #35: the example of the README section "React 19" (tests/fixtures/react-app/src/scenarios/Example.tsx) runs as printed.

test('the README example works: validation blocks the submit, a valid form submits, reset clears it', async ({ app, page }) => {
	await app.open(['example']);
	const submit = page.getByRole('button', { name: 'Speichern' });
	await submit.click();
	await app.settle();
	await expect(page.locator('#saved')).toHaveText('');

	await page.locator('k-input input').fill('Mira');
	await page.locator('k-input input').press('Tab');
	await page.locator('k-select select').selectOption('l');
	await page.locator('k-checkbox').getByText('Einverstanden').click();
	await submit.click();
	await expect(page.locator('#saved')).toHaveText('{"name":"Mira","size":"l","agree":"on"}');
	await expect(page.locator('k-toaster').getByText('Gespeichert')).toBeVisible();

	await page.getByRole('button', { name: 'Zurücksetzen' }).click();
	await expect(page.locator('k-input input')).toHaveValue('');
	await expect(page.locator('k-select select')).toHaveValue('');
	await expect(page.locator('k-checkbox input')).not.toBeChecked();
	await page.locator('k-toaster').evaluate(() => window.kern?.toast.clear());
	await submit.click();
	await app.settle();
	// Invalid again: the old result stays, no new toast.
	await expect(page.locator('#saved')).toHaveText('{"name":"Mira","size":"l","agree":"on"}');
	await expect(page.locator('k-toaster').getByText('Gespeichert')).toHaveCount(0);
});
