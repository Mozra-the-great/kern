import type { Locator } from '@playwright/test';
import { expect, test, type SeenEvent } from './react-app.js';

// #35: kern form elements driven by React 19 (StrictMode, development build) in a real browser. Every test
// fails on a pageerror or a console error/warning (see react-app.ts).

interface Values {
	user: string;
	live: string;
	bio: string;
	size: string;
	terms: boolean;
	news: boolean;
	plan: string;
	city: string;
	day: string;
	qty: number | null;
	view: string;
	tags: string[];
}
const INITIAL: Values = {
	user: '',
	live: '',
	bio: '',
	size: '',
	terms: false,
	news: true,
	plan: '',
	city: '',
	day: '',
	qty: null,
	view: 'grid',
	tags: []
};
const FILLED: Values = {
	user: 'alice',
	live: 'live',
	bio: 'short bio',
	size: 'l',
	terms: true,
	news: false,
	plan: 'pro',
	city: 'ham',
	day: '2026-03-04',
	qty: 3,
	view: 'list',
	tags: ['red', 'blue']
};

test.beforeEach(async ({ app }) => {
	await app.open(['forms']);
});

test('arrays and objects arrive as properties, strings as attributes, nothing leaks into the other kind', async ({ app, page }) => {
	// `options` is a property holding the array React passed; no JSON attribute is written.
	expect(await app.prop('size', 'options')).toEqual([
		{ value: 's', label: 'Small' },
		{ value: 'l', label: 'Large' }
	]);
	expect(await page.locator('#size').evaluate((el) => el.hasAttribute('options'))).toBe(false);
	// Props the element knows are set as properties (React 19 checks `name in element`).
	expect(await app.prop('user', 'required')).toBe(true);
	expect(await app.prop('user', 'label')).toBe('User');
	expect(await app.prop('terms', 'checked')).toBe(false);
	expect(await app.prop('news', 'checked')).toBe(true);
	expect(await app.prop('qty', 'value')).toBeNull();
	expect(await app.prop('tags', 'value')).toEqual([]);
	// Native attributes the element does not declare stay attributes and reach the inner control.
	const user = page.locator('#user');
	expect(
		await user.evaluate((el) => ['maxlength', 'minlength', 'pattern', 'autocomplete'].map((n) => [n, n in el, el.getAttribute(n)]))
	).toEqual([
		['maxlength', false, '12'],
		['minlength', false, '3'],
		['pattern', false, '[a-z]+'],
		['autocomplete', true, null]
	]);
	// `autocomplete` is a declared prop: a property, forwarded to the inner control like the attributes are.
	expect(await app.prop('user', 'autocomplete')).toBe('username');
	const inner = app.control('user');
	await expect(inner).toHaveAttribute('maxlength', '12');
	await expect(inner).toHaveAttribute('minlength', '3');
	await expect(inner).toHaveAttribute('pattern', '[a-z]+');
	await expect(inner).toHaveAttribute('autocomplete', 'username');
	await expect(inner).toHaveAccessibleName('User name');
	// `class` and `data-*` land on the host like on any element.
	await expect(user).toHaveClass('wide');
	await expect(user).toHaveAttribute('data-testid', 'user');
	await expect(app.control('bio')).toHaveAttribute('maxlength', '20');
});

test('mounting in StrictMode fires no event; re-rendering with new array props fires none either', async ({ app, page }) => {
	expect(await app.events()).toEqual([]);
	expect(await app.handled()).toEqual([]);
	const before = await app.commits('forms');
	for (let i = 0; i < 5; i++) await page.locator('#rerender').click();
	await app.settle();
	expect(await app.commits('forms')).toBe(before + 5);
	// Same props, new `options` arrays on every render: nothing happened to the elements.
	expect(await app.events()).toEqual([]);
	expect(await app.handled()).toEqual([]);
	expect(await app.prop('size', 'value')).toBe('');
});

test('state written from React reaches every element without an event or a second render', async ({ app, page }) => {
	const before = await app.commits('forms');
	await page.locator('#fill').click();
	await expect(page.locator('#state')).toHaveText(JSON.stringify(FILLED));
	await app.settle();
	expect(await app.commits('forms')).toBe(before + 1);
	expect(await app.events()).toEqual([]);
	expect(await app.handled()).toEqual([]);
	for (const [id, key] of [
		['user', 'value'],
		['size', 'value'],
		['plan', 'value'],
		['city', 'value'],
		['day', 'value'],
		['qty', 'value'],
		['view', 'value'],
		['terms', 'checked'],
		['news', 'checked'],
		['tags', 'value']
	] as const) {
		expect(await app.prop(id, key), `${id}.${key}`).toEqual(FILLED[id]);
	}
	// And the inner controls show them.
	await expect(app.control('user')).toHaveValue('alice');
	await expect(app.control('size')).toHaveValue('l');
	await expect(app.control('terms')).toBeChecked();
	await expect(app.control('news')).not.toBeChecked();
});

test('user input round-trips: element, event, React state, element, without a loop', async ({ app, page }) => {
	const before = await app.commits('forms');
	await app.control('user').fill('bob');
	await app.control('user').press('Tab');
	await expect(page.locator('#state')).toContainText('"user":"bob"');
	await app.settle();
	// One state change, one commit: the value React writes back is the one the element already has.
	expect(await app.commits('forms')).toBe(before + 1);
	expect(await app.handled()).toEqual([{ source: 'user', type: 'change', detail: 'bob' }]);
	const events = await app.emitted();
	expect(events).toEqual([{ tag: 'k-input', id: 'user', type: 'change', detail: 'bob', trusted: false }]);
	expect(await app.prop('user', 'value')).toBe('bob');
	await expect(app.control('user')).toHaveValue('bob');
});

test('a live field keeps its caret while React writes the value back on every keystroke', async ({ app, page }) => {
	const field = app.control('live');
	await field.click();
	await field.pressSequentially('ac');
	await field.press('ArrowLeft');
	await field.pressSequentially('b');
	await expect(field).toHaveValue('abc');
	await field.pressSequentially('d');
	// The caret was after "b" and stays there: "abdc", not a value with the new letter at the end.
	await expect(field).toHaveValue('abdc');
	await expect(page.locator('#state')).toContainText('"live":"abdc"');
	const typed = (await app.handled()).filter((h) => h.type === 'input').map((h) => h.detail);
	expect(typed).toEqual(['a', 'ac', 'abc', 'abdc']);
	// `change` waits for the commit (blur): none yet.
	expect((await app.events()).filter((e) => e.type === 'change')).toEqual([]);
	await field.press('Tab');
	expect((await app.events()).filter((e) => e.type === 'change').map((e) => e.detail)).toEqual(['abdc']);
});

test('every field reports its value through its React handler, and only once per user action', async ({ app, page }) => {
	/** Types into the inner field and leaves it: the user commits the value. */
	const commit = async (inner: Locator, text: string, key = 'Tab') => {
		await inner.fill(text);
		await inner.press(key);
	};
	const interactions: [string, () => Promise<unknown>, unknown][] = [
		['user', () => commit(app.control('user'), 'carol'), 'carol'],
		['bio', () => commit(app.control('bio'), 'hello'), 'hello'],
		['size', () => app.control('size').selectOption('l'), 'l'],
		['terms', () => page.locator('#terms').getByText('Terms').click(), true],
		['news', () => page.locator('#news').getByText('News').click(), false],
		['plan', () => page.locator('#plan').getByText('Pro').click(), 'pro'],
		['view', () => page.locator('#view').getByRole('radio', { name: 'List' }).click(), 'list'],
		['qty', () => commit(page.locator('#qty input[role="spinbutton"]'), '4'), 4],
		['tags', () => commit(page.locator('#tags input[type="text"]'), 'x', 'Enter'), ['x']]
	];
	for (const [source, act, detail] of interactions) {
		await test.step(source, async () => {
			await app.reset();
			await act();
			await expect.poll(async () => (await app.handled()).length, source).toBeGreaterThan(0);
			await app.settle();
			expect(await app.handled(), source).toEqual([{ source, type: 'change', detail }]);
			const events = (await app.emitted()).filter((e: SeenEvent) => e.type === 'change');
			expect(events, source).toHaveLength(1);
			expect(events[0]?.id).toBe(source);
		});
	}
	const state = await app.state<Values>('state');
	expect(state).toMatchObject({
		user: 'carol',
		bio: 'hello',
		size: 'l',
		terms: true,
		news: false,
		plan: 'pro',
		view: 'list',
		qty: 4,
		tags: ['x']
	});
});

test('combobox and date picker: choosing a value reports it once and leaves the state in step', async ({ app, page }) => {
	await app.reset();
	const city = page.locator('#city input[role="combobox"]');
	await city.click();
	await city.fill('Ham');
	await page.locator('#city').getByRole('option', { name: 'Hamburg' }).click();
	await expect.poll(async () => (await app.handled()).map((h) => h.detail)).toEqual(['ham']);
	await expect(page.locator('#state')).toContainText('"city":"ham"');
	await expect(city).toHaveValue('Hamburg');
	expect((await app.emitted()).filter((e) => e.id === 'city')).toHaveLength(1);

	await app.reset();
	await page.locator('#day').getByRole('button', { name: 'Choose date' }).click();
	await page.locator('#day').getByRole('gridcell', { name: / 4, / }).click();
	await expect.poll(async () => (await app.handled()).length).toBe(1);
	expect((await app.handled())[0]?.source).toBe('day');
	expect(String((await app.handled())[0]?.detail)).toMatch(/^\d{4}-\d{2}-04$/);
	await app.settle();
	expect((await app.emitted()).filter((e) => e.id === 'day')).toHaveLength(1);
});

test('required fields block the submit through ElementInternals; a valid form submits every value', async ({ app, page }) => {
	const form = page.locator('#signup');
	expect(await form.evaluate((f: HTMLFormElement) => f.checkValidity())).toBe(false);
	const flags = (id: string) =>
		page.locator(`#${id}`).evaluate((el) => {
			const v = (el as HTMLElement & { validity: ValidityState }).validity;
			return (['valueMissing', 'tooShort', 'patternMismatch', 'customError'] as const).filter((k) => v[k]);
		});
	for (const id of ['user', 'size', 'terms', 'plan', 'city']) expect(await flags(id), id).toContain('valueMissing');
	await expect(page.locator('#user:invalid')).toHaveCount(1);
	// The click runs the browser's validation: no submit, no event.
	await page.locator('#submit').click();
	await app.settle();
	expect(await app.submissions()).toEqual([]);

	// Constraints the element forwards: pattern and minlength on the user name.
	await app.control('user').fill('Bo');
	await app.control('user').press('Tab');
	expect(await flags('user')).toEqual(expect.arrayContaining(['tooShort', 'patternMismatch']));
	await app.control('user').fill('bobby');
	await app.control('user').press('Tab');
	expect(await flags('user')).toEqual([]);

	// An error from the server, set through the ref, blocks the submit like a native customError.
	await page.locator('#taken').click();
	expect(await flags('user')).toEqual(['customError']);
	expect(await page.locator('#user').evaluate((el) => (el as HTMLElement & { validationMessage: string }).validationMessage)).toBe('Taken');
	await page.evaluate(() =>
		(document.getElementById('user') as HTMLElement & { setCustomValidity(m: string): void }).setCustomValidity('')
	);
	expect(await flags('user')).toEqual([]);

	await page.locator('#fill').click();
	await expect(page.locator('#state')).toHaveText(JSON.stringify(FILLED));
	expect(await form.evaluate((f: HTMLFormElement) => f.checkValidity())).toBe(true);
	await expect(page.locator('#signup :invalid')).toHaveCount(0);
	// `disabled` set as a property by React makes the host disabled for the form: not validated, not submitted.
	expect(await page.locator('#off').evaluate((el) => el.matches(':disabled'))).toBe(true);
	await page.locator('#submit').click();
	await expect.poll(async () => (await app.submissions()).length).toBe(1);
	expect((await app.submissions())[0]).toEqual([
		['user', 'alice'],
		['live', 'live'],
		['bio', 'short bio'],
		['size', 'l'],
		['terms', 'on'],
		['plan', 'pro'],
		['city', 'ham'],
		['day', '2026-03-04'],
		['qty', '3'],
		['view', 'list'],
		['tag', 'red'],
		['tag', 'blue'],
		['outside', 'far']
	]);
});

test('form reset puts every element back to its initial value, React follows through onReset, no event fires', async ({ app, page }) => {
	await page.locator('#fill').click();
	await expect(page.locator('#state')).toHaveText(JSON.stringify(FILLED));
	await app.reset();
	await page.locator('#reset').click();
	await expect(page.locator('#state')).toHaveText(JSON.stringify(INITIAL));
	await app.settle();
	for (const [id, key] of [
		['user', 'value'],
		['size', 'value'],
		['plan', 'value'],
		['city', 'value'],
		['view', 'value'],
		['terms', 'checked'],
		['news', 'checked']
	] as const) {
		expect(await app.prop(id, key), `${id}.${key}`).toEqual(INITIAL[id]);
	}
	await expect(app.control('user')).toHaveValue('');
	await expect(app.control('news')).toBeChecked();
	expect(await app.events()).toEqual([]);
	expect(await app.handled()).toEqual([]);
	// The form is empty and invalid again.
	expect(await page.locator('#signup').evaluate((f: HTMLFormElement) => f.checkValidity())).toBe(false);
	expect(await page.locator('#signup').evaluate((f: HTMLFormElement) => [...new FormData(f).keys()].includes('terms'))).toBe(false);
});

test('refs hold the element instance with the form API of a native field', async ({ app, page }) => {
	const info = await page.evaluate(() => {
		const el = window.harness.refs.user;
		return {
			same: el === document.getElementById('user'),
			upgraded: el instanceof (customElements.get('k-input') as CustomElementConstructor),
			form: (el as HTMLElement & { form: HTMLFormElement | null }).form?.id,
			checkValidity: typeof (el as HTMLElement & { checkValidity: unknown }).checkValidity,
			labels: (el as HTMLElement & { labels: NodeList }).labels.length,
			calls: window.harness.refCalls.user
		};
	});
	expect(info.same).toBe(true);
	expect(info.upgraded).toBe(true);
	expect(info.form).toBe('signup');
	expect(info.checkValidity).toBe('function');
	// StrictMode attaches the ref, detaches it and attaches it again: one live attachment is left.
	expect(info.calls).toBeDefined();
	expect((info.calls?.attach ?? 0) - (info.calls?.detach ?? 0)).toBe(1);
	// The ref callback is stable: re-rendering does not detach and attach again.
	const calls = info.calls;
	await page.locator('#rerender').click();
	await app.settle();
	expect(await page.evaluate(() => window.harness.refCalls.user)).toEqual(calls);
});
