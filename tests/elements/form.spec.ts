import { expect, test, type Page } from '@playwright/test';

// #31: native attributes reach the inner control, constraint validation reflects into
// ElementInternals, and a <form> of kern elements submits every value.

type Flags = Partial<Record<keyof ValidityState, boolean>>;

/** Validity flags that are set on a kern host, read through the element's own API. */
async function flags(page: Page, id: string): Promise<Flags> {
	return page.evaluate((id) => {
		const el = document.getElementById(id) as HTMLElement & { validity: ValidityState };
		const out: Record<string, boolean> = {};
		for (const k of ['valueMissing', 'typeMismatch', 'patternMismatch', 'tooLong', 'tooShort', 'rangeUnderflow', 'rangeOverflow', 'stepMismatch', 'badInput', 'customError'] as const) {
			if (el.validity[k]) out[k] = true;
		}
		return out;
	}, id);
}

async function setProp(page: Page, id: string, prop: string, value: unknown) {
	await page.evaluate(([id, prop, value]) => {
		(document.getElementById(id as string) as unknown as Record<string, unknown>)[prop as string] = value;
	}, [id, prop, value] as const);
}

test.beforeEach(async ({ page }) => {
	await page.goto('/tests/elements/pages/form.html');
	await page.waitForFunction(() => customElements.get('k-input') && document.querySelector('#color')?.shadowRoot?.querySelector('input'));
});

test('native attributes are forwarded to the inner control', async ({ page }) => {
	await page.evaluate(() => document.body.insertAdjacentHTML('beforeend', '<k-input id="m3" maxlength="3" spellcheck="false" enterkeyhint="send" aria-label="Short"></k-input>'));
	const inner = page.locator('#m3 input');
	await inner.pressSequentially('abcd');
	await expect(inner).toHaveValue('abc');
	expect(await page.evaluate(() => (document.getElementById('m3') as HTMLElement & { value: string }).value)).toBe('abc');
	await expect(inner).toHaveAttribute('spellcheck', 'false');
	await expect(inner).toHaveAttribute('enterkeyhint', 'send');
	await expect(inner).toHaveAccessibleName('Short');
	await expect(page.locator('#user input')).toHaveAttribute('pattern', '[a-z]+');
	await expect(page.locator('#user input')).toHaveAttribute('autocomplete', 'username');
	await expect(page.locator('#age input')).toHaveAttribute('min', '18');
	await expect(page.locator('#bio textarea')).toHaveAttribute('maxlength', '5');

	// Attribute changes after upgrade follow, removal removes.
	await page.evaluate(() => document.getElementById('m3')?.setAttribute('maxlength', '5'));
	await expect(inner).toHaveAttribute('maxlength', '5');
	await page.evaluate(() => document.getElementById('m3')?.removeAttribute('maxlength'));
	await expect(inner).not.toHaveAttribute('maxlength');
});

test('constraint validation reflects into ElementInternals', async ({ page }) => {
	expect(await page.evaluate(() => (document.getElementById('f') as HTMLFormElement).checkValidity())).toBe(false);
	for (const id of ['user', 'size', 'terms', 'plan', 'qty', 'city', 'tags', 'stars']) {
		expect(await flags(page, id), id).toEqual({ valueMissing: true });
	}
	await expect(page.locator('#user:invalid')).toHaveCount(1);
	// Disabled hosts are barred from validation, like native fields.
	expect(await page.evaluate(() => (document.getElementById('off') as HTMLElement & { willValidate: boolean }).willValidate)).toBe(false);

	// A submit attempt runs the browser's validation: no submit event while invalid.
	await page.locator('#submit').click();
	expect(await page.evaluate(() => (window as unknown as { submitted: unknown }).submitted)).toBeNull();

	await page.locator('#user input').pressSequentially('AB');
	expect(await flags(page, 'user')).toEqual({ patternMismatch: true, tooShort: true });
	expect(await page.evaluate(() => (document.getElementById('user') as HTMLElement & { validationMessage: string }).validationMessage)).not.toBe('');

	await setProp(page, 'age', 'value', '5');
	expect(await flags(page, 'age')).toEqual({ rangeUnderflow: true });
	await setProp(page, 'age', 'value', '18.5');
	expect(await flags(page, 'age')).toEqual({ stepMismatch: true });
	// Reads through the element see a property change made in the same task.
	expect(
		await page.evaluate(() => {
			const age = document.getElementById('age') as HTMLElement & { value: string; validity: ValidityState; checkValidity(): boolean };
			age.value = '150';
			return [age.validity.rangeOverflow, age.checkValidity()];
		})
	).toEqual([true, false]);
	await setProp(page, 'age', 'value', '');
	await setProp(page, 'qty', 'value', 50);
	expect(await flags(page, 'qty')).toEqual({ rangeOverflow: true });
	await setProp(page, 'day', 'value', '2025-05-01');
	expect(await flags(page, 'day')).toEqual({ rangeUnderflow: true });
	await setProp(page, 'pin', 'value', '12');
	expect(await flags(page, 'pin')).toEqual({ patternMismatch: true });

	await page.evaluate(() => (document.getElementById('color') as HTMLElement & { setCustomValidity(m: string): void }).setCustomValidity('Pick a brand colour'));
	expect(await flags(page, 'color')).toEqual({ customError: true });
	expect(await page.evaluate(() => (document.getElementById('color') as HTMLElement & { validationMessage: string }).validationMessage)).toBe('Pick a brand colour');
	await page.evaluate(() => (document.getElementById('color') as HTMLElement & { setCustomValidity(m: string): void }).setCustomValidity(''));
	expect(await flags(page, 'color')).toEqual({});

	// reportValidity() focuses the inner control (the anchor).
	const focused = await page.evaluate(() => {
		const user = document.getElementById('user') as HTMLElement & { reportValidity(): boolean };
		const ok = user.reportValidity();
		return { ok, host: document.activeElement?.id, inner: user.shadowRoot?.activeElement?.tagName };
	});
	expect(focused).toEqual({ ok: false, host: 'user', inner: 'INPUT' });
});

test('a form of kern elements submits all values', async ({ page }) => {
	await page.locator('#user input').fill('moritz');
	await page.locator('#bio textarea').pressSequentially('hello world');
	await page.locator('#size select').selectOption('l');
	// Rows toggle through their label (it covers the row for the 44px touch target).
	await page.locator('#terms').getByText('Terms').click();
	await page.locator('#news').getByText('News').click();
	await page.locator('#plan').getByText('Pro').click();
	await expect(page.locator('#terms input')).toBeChecked();
	await expect(page.locator('#news input')).toBeChecked();
	await expect(page.locator('#plan input[value="pro"]')).toBeChecked();
	await page.locator('#qty input[role="spinbutton"]').fill('3');
	await page.locator('#qty input[role="spinbutton"]').press('Tab');
	await setProp(page, 'day', 'value', '2026-03-04');
	await setProp(page, 'city', 'value', 'ber');
	const tag = page.locator('#tags input[type="text"]');
	await tag.fill('a');
	await tag.press('Enter');
	await tag.fill('b');
	await tag.press('Enter');
	await page.locator('#pin input.box').first().pressSequentially('1234');
	await setProp(page, 'stars', 'value', 4);

	const invalid = () =>
		page.evaluate(() =>
			[...(document.getElementById('f') as HTMLFormElement).elements]
				.filter((e) => !(e as HTMLInputElement).validity.valid)
				.map((e) => `${e.id}: ${(e as HTMLInputElement).validationMessage}`)
		);
	await expect.poll(invalid).toEqual([]);
	expect(await page.evaluate(() => (document.getElementById('f') as HTMLFormElement).checkValidity())).toBe(true);
	await expect(page.locator('#f :invalid')).toHaveCount(0);
	await page.locator('#submit').click();
	await page.waitForFunction(() => (window as unknown as { submitted: unknown }).submitted !== null);
	const submitted = await page.evaluate(() => (window as unknown as { submitted: [string, string][] }).submitted);
	expect(submitted).toEqual([
		['user', 'moritz'],
		['age', ''],
		['bio', 'hello'],
		['size', 'l'],
		['terms', 'on'],
		['news', 'yes'],
		['plan', 'pro'],
		['qty', '3'],
		['day', '2026-03-04'],
		['vol', '40'],
		['city', 'ber'],
		['tag', 'a'],
		['tag', 'b'],
		['pin', '1234'],
		['stars', '4'],
		['view', 'grid'],
		['outside', 'far']
	]);

	// form.reset() restores the initial values through formResetCallback.
	await page.evaluate(() => (document.getElementById('f') as HTMLFormElement).reset());
	await expect
		.poll(() => page.evaluate(() => [...new FormData(document.getElementById('f') as HTMLFormElement).entries()].map(([k, v]) => `${k}=${String(v)}`)))
		.toEqual(['user=', 'age=', 'bio=', 'size=', 'day=', 'vol=40', 'city=', 'pin=', 'view=grid', 'outside=far']);
});

test('autofocus focuses the inner control', async ({ page }) => {
	await page.evaluate(() => document.body.insertAdjacentHTML('beforeend', '<k-textarea id="af" autofocus></k-textarea>'));
	await expect.poll(() => page.evaluate(() => document.getElementById('af')?.shadowRoot?.activeElement?.tagName)).toBe('TEXTAREA');
});
