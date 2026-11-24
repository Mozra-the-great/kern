/**
 * NumberInput: a text field with the spinbutton role. Covers typing and parsing (locale separators,
 * grouping, "+", Unicode minus, exponents, invalid text), commit on blur and Enter with clamping,
 * arrow/Page/Home/End keys, the step buttons and their disabled states, decimal-safe stepping,
 * formatted display while not focused, ARIA values, the bound value both ways, onchange, the hidden
 * form input, disabled/readonly/invalid, invalid locale and format options.
 */
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import NumberInput from '../../src/lib/components/NumberInput.svelte';
import { reactive } from './reactive.svelte.js';

type Props = {
	label: string;
	value?: number | null | undefined;
	min?: number | undefined;
	max?: number | undefined;
	step?: number | undefined;
	locale?: string | undefined;
	format?: Intl.NumberFormatOptions | undefined;
	onchange?: ((value: number | null) => void) | undefined;
	disabled?: boolean | undefined;
	readonly?: boolean | undefined;
};

const euro = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
function eur(n: number): string {
	return euro.format(n);
}
function field(): HTMLInputElement {
	return screen.getByRole('spinbutton') as HTMLInputElement;
}
function dec(): HTMLButtonElement {
	return screen.getByRole('button', { name: 'Decrease', hidden: true }) as HTMLButtonElement;
}
function inc(): HTMLButtonElement {
	return screen.getByRole('button', { name: 'Increase', hidden: true }) as HTMLButtonElement;
}

describe('NumberInput', () => {
	it('is a labelled spinbutton with step buttons and no value', () => {
		render(NumberInput, { label: 'Amount' });
		const input = screen.getByRole('spinbutton', { name: 'Amount' }) as HTMLInputElement;
		expect(input.value).toBe('');
		expect(input.getAttribute('aria-valuenow')).toBeNull();
		expect(input.getAttribute('aria-valuemin')).toBeNull();
		expect(input.getAttribute('aria-valuetext')).toBeNull();
		expect(input.getAttribute('aria-invalid')).toBeNull();
		expect(dec().getAttribute('aria-controls')).toBe(input.id);
		expect(dec().tabIndex).toBe(-1);
		expect(dec().disabled).toBe(false);
		expect(inc().disabled).toBe(false);
		expect(document.querySelector('input[type="hidden"]')).toBeNull();
	});

	it('typing updates the bound value; blur commits and calls onchange once', async () => {
		const user = userEvent.setup();
		const onchange = vi.fn();
		const props = reactive<Props>({ label: 'Amount', value: undefined, onchange, locale: 'en-US' });
		render(NumberInput, { props });
		await user.click(field());
		await user.type(field(), '12.5');
		expect(props.value).toBe(12.5);
		expect(onchange).not.toHaveBeenCalled();
		await user.tab();
		expect(onchange).toHaveBeenCalledTimes(1);
		expect(onchange).toHaveBeenCalledWith(12.5);
		// Focus and blur again without a change: no second call.
		await user.click(field());
		await user.tab();
		expect(onchange).toHaveBeenCalledTimes(1);
	});

	it('blur clamps to min/max, keeps the last number for invalid text and empties to null', async () => {
		const user = userEvent.setup();
		const onchange = vi.fn();
		const props = reactive<Props>({ label: 'Amount', value: 5, min: 0, max: 10, onchange, locale: 'en-US' });
		render(NumberInput, { props });
		await user.clear(field());
		await user.type(field(), '50');
		await user.tab();
		expect(props.value).toBe(10);
		expect(field().value).toBe('10');
		await user.clear(field());
		await user.type(field(), '-3');
		await user.tab();
		expect(props.value).toBe(0);
		await user.clear(field());
		await user.type(field(), 'abc');
		await user.tab();
		expect(props.value).toBeNull();
		expect(field().value).toBe('');
		props.value = 4;
		await vi.waitFor(() => expect(field().value).toBe('4'));
		await user.click(field());
		await user.keyboard('x');
		await user.tab();
		expect(props.value).toBe(4);
		expect(field().value).toBe('4');
	});

	it('Enter commits the typed text, clamped, and keeps the plain number shown', async () => {
		const user = userEvent.setup();
		const onchange = vi.fn();
		const props = reactive<Props>({ label: 'Amount', value: 2, max: 9, onchange, locale: 'en-US' });
		render(NumberInput, { props });
		await user.clear(field());
		await user.type(field(), '20{Enter}');
		expect(props.value).toBe(9);
		expect(field().value).toBe('9');
		expect(onchange).toHaveBeenLastCalledWith(9);
		await user.clear(field());
		await user.keyboard('{Enter}');
		expect(props.value).toBeNull();
		await user.type(field(), 'zz{Enter}');
		expect(props.value).toBeNull();
		expect(field().value).toBe('');
	});

	it('arrow and Page keys step, Home and End jump to the limits', async () => {
		const user = userEvent.setup();
		const onchange = vi.fn();
		const props = reactive<Props>({ label: 'Amount', value: 5, min: 0, max: 100, step: 2, onchange, locale: 'en-US' });
		render(NumberInput, { props });
		await user.click(field());
		await user.keyboard('{ArrowUp}');
		expect(props.value).toBe(7);
		expect(field().value).toBe('7');
		await user.keyboard('{ArrowDown}{ArrowDown}');
		expect(props.value).toBe(3);
		await user.keyboard('{PageUp}');
		expect(props.value).toBe(23);
		await user.keyboard('{PageDown}{PageDown}');
		expect(props.value).toBe(0);
		await user.keyboard('{End}');
		expect(props.value).toBe(100);
		expect(field().getAttribute('aria-valuenow')).toBe('100');
		await user.keyboard('{Home}');
		expect(props.value).toBe(0);
		expect(onchange).toHaveBeenLastCalledWith(0);
		// Other keys do nothing special.
		await user.keyboard('{Escape}');
		expect(props.value).toBe(0);
	});

	it('Home and End without limits leave the value alone', async () => {
		const user = userEvent.setup();
		const props = reactive<Props>({ label: 'Amount', value: 5 });
		render(NumberInput, { props });
		await user.click(field());
		await user.keyboard('{Home}{End}');
		expect(props.value).toBe(5);
	});

	it('a key event that reaches the field without focus shows the formatted limit', async () => {
		const props = reactive<Props>({ label: 'Price', value: 5, max: 9, locale: 'de-DE', format: { style: 'currency', currency: 'EUR' } });
		render(NumberInput, { props });
		field().dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true, cancelable: true }));
		expect(props.value).toBe(9);
		await vi.waitFor(() => expect(field().value).toBe(eur(9)));
	});

	it('clearing the field and leaving it sets null', async () => {
		const user = userEvent.setup();
		const onchange = vi.fn();
		const props = reactive<Props>({ label: 'Amount', value: 5, onchange });
		render(NumberInput, { props });
		await user.clear(field());
		await user.tab();
		expect(props.value).toBeNull();
		expect(onchange).toHaveBeenCalledWith(null);
	});

	it('stepping from empty starts at 0 clamped into the range and avoids float noise', async () => {
		const user = userEvent.setup();
		const props = reactive<Props>({ label: 'Amount', value: null, min: 1, step: 0.1, locale: 'en-US' });
		render(NumberInput, { props });
		await user.click(inc());
		expect(props.value).toBe(1.1);
		expect(field().value).toBe('1.1');
		await user.click(inc());
		await user.click(inc());
		expect(props.value).toBe(1.3);
		await user.click(dec());
		await user.click(dec());
		await user.click(dec());
		await user.click(dec());
		expect(props.value).toBe(1);
		expect(dec().disabled).toBe(true);
	});

	it('handles steps written with an exponent', async () => {
		const user = userEvent.setup();
		const props = reactive<Props>({ label: 'Amount', value: 0, step: 1e-7, locale: 'en-US' });
		render(NumberInput, { props });
		await user.click(inc());
		expect(props.value).toBe(1e-7);
		expect(field().value).toBe('1e-7');
	});

	it('a non-positive or non-finite step falls back to 1; non-finite limits are ignored', async () => {
		const user = userEvent.setup();
		const props = reactive<Props>({ label: 'Amount', value: 1, step: -5, min: Number.NaN, max: Number.POSITIVE_INFINITY });
		render(NumberInput, { props });
		await user.click(inc());
		expect(props.value).toBe(2);
		expect(field().getAttribute('aria-valuemin')).toBeNull();
		expect(field().getAttribute('aria-valuemax')).toBeNull();
		props.step = Number.NaN;
		await user.click(inc());
		expect(props.value).toBe(3);
	});

	it('the buttons disable at the limits', async () => {
		const props = reactive<Props>({ label: 'Amount', value: 10, min: 0, max: 10 });
		render(NumberInput, { props });
		expect(inc().disabled).toBe(true);
		expect(dec().disabled).toBe(false);
		props.value = 0;
		await vi.waitFor(() => expect(dec().disabled).toBe(true));
		expect(inc().disabled).toBe(false);
	});

	it('the buttons keep the focus where it is (mousedown is prevented)', async () => {
		render(NumberInput, { label: 'Amount', value: 1 });
		const event = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
		inc().dispatchEvent(event);
		expect(event.defaultPrevented).toBe(true);
		const other = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
		dec().dispatchEvent(other);
		expect(other.defaultPrevented).toBe(true);
	});

	it('disabled and readonly block stepping', async () => {
		const user = userEvent.setup();
		const props = reactive<Props>({ label: 'Amount', value: 1, min: 0, max: 5, readonly: true });
		render(NumberInput, { props });
		expect(inc().disabled).toBe(true);
		expect(dec().disabled).toBe(true);
		await user.click(field());
		await user.keyboard('{ArrowUp}{Home}{End}');
		expect(props.value).toBe(1);
		props.readonly = false;
		props.disabled = true;
		await vi.waitFor(() => expect(field().disabled).toBe(true));
		field().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
		field().dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
		expect(props.value).toBe(1);
		expect(document.querySelector('.k-number.disabled')).not.toBeNull();
	});

	it('shows the formatted value while not focused and the plain number while editing', async () => {
		const user = userEvent.setup();
		const props = reactive<Props>({ label: 'Price', value: 1234.5, locale: 'de-DE', format: { style: 'currency', currency: 'EUR' } });
		render(NumberInput, { props });
		expect(field().value).toBe(eur(1234.5));
		expect(field().getAttribute('aria-valuetext')).toBe(eur(1234.5));
		await user.click(field());
		expect(field().value).toBe('1234,5');
		await user.keyboard('{ArrowUp}');
		expect(field().value).toBe('1235,5');
		await user.tab();
		expect(field().value).toBe(eur(1235.5));
		// Stepping with the button while not focused keeps the formatted text.
		await user.click(inc());
		expect(field().value).toBe(eur(1236.5));
		props.format = undefined;
		await vi.waitFor(() => expect(field().value).toBe('1236,5'));
		expect(field().getAttribute('aria-valuetext')).toBeNull();
	});

	it('reads the separators of the locale (de-DE: "," decimal, "." group)', async () => {
		const user = userEvent.setup();
		const props = reactive<Props>({ label: 'Amount', value: undefined, locale: 'de-DE' });
		render(NumberInput, { props });
		const cases: [string, number][] = [
			['3,5', 3.5],
			['3.5', 3.5],
			['1.000', 1000],
			['1.234.567,8', 1234567.8],
			['+ 42', 42],
			['−7', -7],
			['2e3', 2000],
			[',5', 0.5]
		];
		for (const [typed, expected] of cases) {
			await user.clear(field());
			await user.type(field(), typed);
			expect(props.value).toBe(expected);
		}
	});

	it('ignores text that is not a number or overflows while typing', async () => {
		const user = userEvent.setup();
		const props = reactive<Props>({ label: 'Amount', value: 3, locale: 'en-US' });
		render(NumberInput, { props });
		await user.clear(field());
		expect(props.value).toBeNull();
		await user.type(field(), '1e400');
		expect(props.value).toBe(1e40);
		await user.clear(field());
		await user.type(field(), '1-');
		expect(props.value).toBe(1);
	});

	it('falls back to "." and "," when the locale reports no separators', async () => {
		const user = userEvent.setup();
		const parts = vi.spyOn(Intl.NumberFormat.prototype, 'formatToParts').mockReturnValue([{ type: 'integer', value: '123456' }]);
		try {
			const props = reactive<Props>({ label: 'Amount', value: 1.5, locale: 'en-US' });
			render(NumberInput, { props });
			expect(field().value).toBe('1.5');
			await user.clear(field());
			await user.type(field(), '1,234.5');
			expect(props.value).toBe(1234.5);
		} finally {
			parts.mockRestore();
		}
	});

	it('shows very large numbers in exponent form', () => {
		render(NumberInput, { label: 'Amount', value: 1e21, locale: 'de-DE' });
		expect(field().value).toBe('1e+21');
	});

	it('ignores a value that is not a finite number', () => {
		render(NumberInput, { label: 'Amount', value: Number.NaN });
		expect(field().value).toBe('');
		expect(field().getAttribute('aria-valuenow')).toBeNull();
	});

	it('follows the bound value from outside while not editing', async () => {
		const props = reactive<Props>({ label: 'Amount', value: 1, locale: 'en-US' });
		render(NumberInput, { props });
		props.value = 2.25;
		await vi.waitFor(() => expect(field().value).toBe('2.25'));
		props.value = null;
		await vi.waitFor(() => expect(field().value).toBe(''));
	});

	it('an invalid locale falls back to the default, invalid format options to the plain number', () => {
		render(NumberInput, { label: 'Amount', value: 1.5, locale: 'not a locale!', format: { style: 'currency' } });
		expect(field().value).toMatch(/^1[.,]5$/);
		expect(field().getAttribute('aria-valuetext')).toBeNull();
	});

	it('carries the plain number in a hidden input and passes the field props through', () => {
		const { unmount } = render(NumberInput, {
			label: 'Amount',
			value: 7,
			name: 'qty',
			id: 'qty-input',
			placeholder: '0',
			required: true,
			hint: 'Whole units',
			error: 'Too many',
			class: 'mine',
			decrementLabel: 'Less',
			incrementLabel: 'More'
		});
		const hidden = document.querySelector<HTMLInputElement>('input[type="hidden"]');
		expect(hidden?.name).toBe('qty');
		expect(hidden?.value).toBe('7');
		const input = field();
		expect(input.id).toBe('qty-input');
		expect(input.placeholder).toBe('0');
		expect(input.required).toBe(true);
		expect(input.getAttribute('aria-invalid')).toBe('true');
		expect(input.getAttribute('aria-describedby')).toBe(screen.getByRole('alert').id);
		expect(document.querySelector('.k-number.invalid')).not.toBeNull();
		expect(document.querySelector('.mine')).not.toBeNull();
		expect(screen.getByRole('button', { name: 'Less', hidden: true })).toBeTruthy();
		expect(screen.getByRole('button', { name: 'More', hidden: true })).toBeTruthy();
		unmount();
		render(NumberInput, { label: 'Amount', name: 'qty' });
		expect(document.querySelector<HTMLInputElement>('input[type="hidden"]')?.value).toBe('');
	});
});
