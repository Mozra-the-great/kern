/**
 * DatePicker: a text field with a calendar dialog. Covers typing and committing (locale order, ISO,
 * 2-digit years, 8 digits without separators, invalid and out-of-range text with the error), the
 * calendar (opening from the button and Alt+ArrowDown, the focused day, today, selection, min/max
 * with disabled days and month buttons, the arrow/Home/End/PageUp/PageDown keys, Enter/Space, Escape,
 * the Tab trap, outside pointer), week start from the prop or the locale, labels, the bound value
 * both ways, onchange, the hidden input and disabled/invalid states. "Today" is fixed with fake Date.
 */
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import DatePicker from '../../src/lib/components/DatePicker.svelte';
import { flush } from './helpers.js';
import { reactive } from './reactive.svelte.js';

type Props = {
	label: string;
	value?: string | undefined;
	min?: string | undefined;
	max?: string | undefined;
	locale?: string | undefined;
	weekStart?: number | undefined;
	onchange?: ((value: string) => void) | undefined;
	disabled?: boolean | undefined;
};

const full = new Intl.DateTimeFormat('de-DE', { timeZone: 'UTC', dateStyle: 'full' });
function dayName(iso: string): string {
	return full.format(new Date(`${iso}T00:00:00Z`));
}

function input(): HTMLInputElement {
	return screen.getByRole('textbox') as HTMLInputElement;
}
function calButton(): HTMLButtonElement {
	return document.querySelector<HTMLButtonElement>('button.cal') as HTMLButtonElement;
}
function dialog(): HTMLElement | null {
	return screen.queryByRole('dialog');
}
function focusedCell(): HTMLElement {
	return document.querySelector<HTMLElement>('[role="gridcell"][tabindex="0"]') as HTMLElement;
}
function cell(iso: string): HTMLElement {
	return screen.getByRole('gridcell', { name: dayName(iso) });
}
async function openWith(user: ReturnType<typeof userEvent.setup>): Promise<void> {
	await user.click(calButton());
	await vi.waitFor(() => expect(document.activeElement).toBe(focusedCell()));
}

beforeEach(() => {
	vi.useFakeTimers({ toFake: ['Date'] });
	vi.setSystemTime(new Date(2024, 2, 15, 12, 0, 0));
});
afterEach(() => {
	vi.useRealTimers();
});

describe('DatePicker field', () => {
	it('renders a labelled field with the locale pattern and a closed calendar button', () => {
		render(DatePicker, { label: 'Date', locale: 'de-DE' });
		const field = screen.getByRole('textbox', { name: 'Date' }) as HTMLInputElement;
		expect(field.placeholder).toBe('dd.mm.yyyy');
		expect(field.value).toBe('');
		expect(field.getAttribute('aria-invalid')).toBeNull();
		const btn = screen.getByRole('button', { name: 'Choose date' });
		expect(btn.getAttribute('aria-haspopup')).toBe('dialog');
		expect(btn.getAttribute('aria-expanded')).toBe('false');
		expect(dialog()).toBeNull();
		expect(document.querySelector('input[type="hidden"]')).toBeNull();
	});

	it('shows the bound value in the locale format and follows changes from outside', async () => {
		const props = reactive<Props>({ label: 'Date', value: '2024-03-01', locale: 'de-DE' });
		render(DatePicker, { props });
		expect(input().value).toBe('01.03.2024');
		expect(calButton().getAttribute('aria-label')).toBe(`Choose date, ${dayName('2024-03-01')}`);
		props.value = '2025-12-24';
		await vi.waitFor(() => expect(input().value).toBe('24.12.2025'));
		props.value = 'not a date';
		await vi.waitFor(() => expect(input().value).toBe(''));
		props.locale = 'en-US';
		props.value = '2025-12-24';
		await vi.waitFor(() => expect(input().value).toBe('12/24/2025'));
		expect(input().placeholder).toBe('mm/dd/yyyy');
	});

	it('commits typed text on change and on Enter, in the locale order', async () => {
		const user = userEvent.setup();
		const onchange = vi.fn();
		const props = reactive<Props>({ label: 'Date', value: undefined, locale: 'de-DE', onchange });
		render(DatePicker, { props });
		await user.type(input(), '5.4.2024');
		expect(props.value).toBeUndefined();
		await user.tab();
		expect(props.value).toBe('2024-04-05');
		expect(input().value).toBe('05.04.2024');
		expect(onchange).toHaveBeenCalledWith('2024-04-05');
		await user.clear(input());
		await user.type(input(), '1.2.24{Enter}');
		expect(props.value).toBe('2024-02-01');
		await user.clear(input());
		await user.type(input(), '31122023{Enter}');
		expect(props.value).toBe('2023-12-31');
		await user.clear(input());
		await user.type(input(), '2022-7-9{Enter}');
		expect(props.value).toBe('2022-07-09');
		// Same date again: no new call.
		const calls = onchange.mock.calls.length;
		await user.type(input(), '{Enter}');
		expect(onchange).toHaveBeenCalledTimes(calls);
		// Other keys do nothing.
		await user.keyboard('{ArrowDown}{Escape}');
		expect(dialog()).toBeNull();
	});

	it('an empty field commits the empty value', async () => {
		const user = userEvent.setup();
		const onchange = vi.fn();
		const props = reactive<Props>({ label: 'Date', value: '2024-03-01', locale: 'de-DE', onchange });
		render(DatePicker, { props });
		await user.clear(input());
		await user.keyboard('{Enter}');
		expect(props.value).toBe('');
		expect(onchange).toHaveBeenCalledWith('');
		expect(screen.queryByRole('alert')).toBeNull();
	});

	it('invalid or out-of-range text clears the value and shows the error until a valid date', async () => {
		const user = userEvent.setup();
		const props = reactive<Props>({ label: 'Date', value: '2024-03-10', min: '2024-03-01', max: '2024-03-31', locale: 'de-DE' });
		render(DatePicker, { props });
		await user.clear(input());
		await user.type(input(), '31.02.2024{Enter}');
		expect(props.value).toBe('');
		expect(screen.getByRole('alert').textContent).toContain('Enter a valid date.');
		expect(input().getAttribute('aria-invalid')).toBe('true');
		expect(document.querySelector('.k-date.invalid')).not.toBeNull();
		await user.clear(input());
		await user.type(input(), '01.04.2024{Enter}');
		expect(props.value).toBe('');
		expect(screen.getByRole('alert')).toBeTruthy();
		for (const bad of ['1.2', '1.2.3.4', '2024-13-01', '0000-01-01']) {
			await user.clear(input());
			await user.type(input(), `${bad}{Enter}`);
			expect(screen.getByRole('alert')).toBeTruthy();
		}
		await user.clear(input());
		await user.type(input(), '15.03.2024{Enter}');
		expect(props.value).toBe('2024-03-15');
		expect(screen.queryByRole('alert')).toBeNull();
	});

	it('a custom invalid text and an error prop', async () => {
		const user = userEvent.setup();
		const { unmount } = render(DatePicker, { label: 'Date', locale: 'de-DE', invalidText: 'Bad date' });
		await user.type(input(), 'xx{Enter}');
		expect(screen.getByRole('alert').textContent).toContain('Bad date');
		unmount();
		render(DatePicker, { label: 'Date', locale: 'de-DE', error: 'Required' });
		expect(screen.getByRole('alert').textContent).toContain('Required');
		expect(input().getAttribute('aria-describedby')).toBe(screen.getByRole('alert').id);
	});

	it('carries the ISO value in a hidden input and passes the field props through', () => {
		const { unmount } = render(DatePicker, {
			label: 'Date',
			value: '2024-03-01',
			name: 'due',
			id: 'due-input',
			placeholder: 'Pick a day',
			required: true,
			hint: 'Any weekday',
			class: 'mine',
			locale: 'de-DE'
		});
		const hidden = document.querySelector<HTMLInputElement>('input[type="hidden"]');
		expect(hidden?.name).toBe('due');
		expect(hidden?.value).toBe('2024-03-01');
		expect(input().id).toBe('due-input');
		expect(input().placeholder).toBe('Pick a day');
		expect(input().required).toBe(true);
		expect(document.querySelector('.mine')).not.toBeNull();
		unmount();
		render(DatePicker, { label: 'Date', name: 'due' });
		expect(document.querySelector<HTMLInputElement>('input[type="hidden"]')?.value).toBe('');
	});

	it('disabled disables the field and the button and never opens', async () => {
		render(DatePicker, { label: 'Date', disabled: true, locale: 'de-DE' });
		expect(input().disabled).toBe(true);
		expect(calButton().disabled).toBe(true);
		expect(document.querySelector('.k-date.disabled')).not.toBeNull();
		input().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', altKey: true, bubbles: true, cancelable: true }));
		await flush();
		expect(dialog()).toBeNull();
	});

	it('falls back to the default locale when the locale is invalid', () => {
		render(DatePicker, { label: 'Date', value: '2024-03-01', locale: 'not a locale!' });
		expect(input().value).toMatch(/2024/);
	});
});

describe('DatePicker calendar', () => {
	it('opens a modal dialog on the selected day, marks today and closes on Escape with focus back', async () => {
		const user = userEvent.setup();
		render(DatePicker, { label: 'Date', value: '2024-03-01', locale: 'de-DE' });
		await openWith(user);
		const dlg = screen.getByRole('dialog', { name: 'Choose date' });
		expect(dlg.getAttribute('aria-modal')).toBe('true');
		expect(calButton().getAttribute('aria-expanded')).toBe('true');
		expect(calButton().getAttribute('aria-controls')).toBe(dlg.id);
		expect(screen.getByRole('heading', { name: 'März 2024' })).toBeTruthy();
		const grid = screen.getByRole('grid', { name: 'März 2024' });
		expect(grid).toBeTruthy();
		expect(focusedCell()).toBe(cell('2024-03-01'));
		expect(cell('2024-03-01').getAttribute('aria-selected')).toBe('true');
		expect(cell('2024-03-15').getAttribute('aria-current')).toBe('date');
		expect(cell('2024-03-14').getAttribute('aria-current')).toBeNull();
		expect(cell('2024-03-14').getAttribute('aria-selected')).toBeNull();
		// de-DE weeks start on Monday; 1 March 2024 is a Friday, so four blanks come first.
		const headers = Array.from(document.querySelectorAll('th')).map((th) => th.getAttribute('abbr'));
		expect(headers[0]).toBe('Montag');
		expect(document.querySelectorAll('tbody tr:first-child td.blank')).toHaveLength(4);
		await user.keyboard('{Escape}');
		expect(dialog()).toBeNull();
		expect(document.activeElement).toBe(calButton());
	});

	it('the button toggles the dialog; Alt+ArrowDown in the field opens it', async () => {
		const user = userEvent.setup();
		render(DatePicker, { label: 'Date', locale: 'de-DE' });
		await openWith(user);
		expect(focusedCell()).toBe(cell('2024-03-15'));
		await user.click(calButton());
		expect(dialog()).toBeNull();
		expect(document.activeElement).toBe(calButton());
		await user.click(input());
		await user.keyboard('{Alt>}{ArrowDown}{/Alt}');
		await vi.waitFor(() => expect(document.activeElement).toBe(focusedCell()));
	});

	it('opens on a typed but not committed date, or on today when it is out of range', async () => {
		const user = userEvent.setup();
		const { unmount } = render(DatePicker, { label: 'Date', locale: 'de-DE' });
		await user.type(input(), '10.06.2023');
		await user.keyboard('{Alt>}{ArrowDown}{/Alt}');
		await vi.waitFor(() => expect(focusedCell()).toBe(cell('2023-06-10')));
		unmount();
		render(DatePicker, { label: 'Date', locale: 'de-DE', max: '2024-12-31' });
		await user.type(input(), '10.06.2025');
		await user.keyboard('{Alt>}{ArrowDown}{/Alt}');
		await vi.waitFor(() => expect(focusedCell()).toBe(cell('2024-03-15')));
	});

	it('opens on the nearest allowed day when today is outside min/max', async () => {
		const user = userEvent.setup();
		render(DatePicker, { label: 'Date', locale: 'de-DE', min: '2024-05-10', max: '2024-06-20' });
		await openWith(user);
		expect(focusedCell()).toBe(cell('2024-05-10'));
		expect(screen.getByRole('button', { name: 'Previous month' }).hasAttribute('disabled')).toBe(true);
		expect(cell('2024-05-09').getAttribute('aria-disabled')).toBe('true');
		expect(cell('2024-05-10').getAttribute('aria-disabled')).toBeNull();
	});

	it('picking a day with the mouse sets the value, closes and focuses the button', async () => {
		const user = userEvent.setup();
		const onchange = vi.fn();
		const props = reactive<Props>({ label: 'Date', value: undefined, locale: 'de-DE', onchange, max: '2024-03-20' });
		render(DatePicker, { props });
		await openWith(user);
		// A disabled day does nothing.
		await user.click(cell('2024-03-25'));
		expect(dialog()).not.toBeNull();
		expect(props.value).toBeUndefined();
		await user.click(cell('2024-03-12'));
		expect(props.value).toBe('2024-03-12');
		expect(input().value).toBe('12.03.2024');
		expect(onchange).toHaveBeenCalledWith('2024-03-12');
		expect(dialog()).toBeNull();
		expect(document.activeElement).toBe(calButton());
	});

	it('moves the focused day with the arrow keys, Home/End and PageUp/PageDown, and picks with Enter or Space', async () => {
		const user = userEvent.setup();
		const props = reactive<Props>({ label: 'Date', value: '2024-03-13', locale: 'de-DE' });
		render(DatePicker, { props });
		await openWith(user);
		const expectFocus = async (iso: string) => {
			await vi.waitFor(() => expect(document.activeElement).toBe(cell(iso)));
		};
		await user.keyboard('{ArrowRight}');
		await expectFocus('2024-03-14');
		await user.keyboard('{ArrowLeft}{ArrowLeft}');
		await expectFocus('2024-03-12');
		await user.keyboard('{ArrowDown}');
		await expectFocus('2024-03-19');
		await user.keyboard('{ArrowUp}');
		await expectFocus('2024-03-12');
		// Tuesday: Home goes to Monday, End to Sunday.
		await user.keyboard('{Home}');
		await expectFocus('2024-03-11');
		await user.keyboard('{End}');
		await expectFocus('2024-03-17');
		await user.keyboard('{PageDown}');
		await vi.waitFor(() => expect(screen.getByRole('heading', { name: 'April 2024' })).toBeTruthy());
		await expectFocus('2024-04-17');
		await user.keyboard('{PageUp}{PageUp}');
		await expectFocus('2024-02-17');
		await user.keyboard('{Shift>}{PageDown}{/Shift}');
		await expectFocus('2025-02-17');
		await user.keyboard('{Shift>}{PageUp}{/Shift}');
		await expectFocus('2024-02-17');
		// Other keys are ignored.
		await user.keyboard('a');
		await expectFocus('2024-02-17');
		await user.keyboard('{Enter}');
		expect(props.value).toBe('2024-02-17');
		expect(dialog()).toBeNull();
		await openWith(user);
		await user.keyboard('{ArrowRight}');
		await expectFocus('2024-02-18');
		await user.keyboard(' ');
		expect(props.value).toBe('2024-02-18');
	});

	it('the month moves keep the day inside short months and stop at min/max', async () => {
		const user = userEvent.setup();
		render(DatePicker, { label: 'Date', value: '2024-01-31', locale: 'de-DE', min: '2023-12-15', max: '2024-03-05' });
		await openWith(user);
		await user.keyboard('{PageDown}');
		await vi.waitFor(() => expect(document.activeElement).toBe(cell('2024-02-29')));
		await user.keyboard('{PageDown}');
		await vi.waitFor(() => expect(document.activeElement).toBe(cell('2024-03-05')));
		expect(screen.getByRole('button', { name: 'Next month' }).hasAttribute('disabled')).toBe(true);
		await user.keyboard('{ArrowRight}');
		await vi.waitFor(() => expect(document.activeElement).toBe(cell('2024-03-05')));
		await user.keyboard('{Shift>}{PageUp}{/Shift}');
		await vi.waitFor(() => expect(document.activeElement).toBe(cell('2023-12-15')));
		expect(screen.getByRole('button', { name: 'Previous month' }).hasAttribute('disabled')).toBe(true);
	});

	it('the month buttons show the previous and next month', async () => {
		const user = userEvent.setup();
		render(DatePicker, {
			label: 'Date',
			value: '2024-01-15',
			locale: 'de-DE',
			prevMonthLabel: 'Back',
			nextMonthLabel: 'On',
			calendarLabel: 'Calendar'
		});
		await user.click(screen.getByRole('button', { name: /^Calendar/ }));
		await vi.waitFor(() => expect(dialog()).not.toBeNull());
		await user.click(screen.getByRole('button', { name: 'Back' }));
		expect(screen.getByRole('heading', { name: 'Dezember 2023' })).toBeTruthy();
		await user.click(screen.getByRole('button', { name: 'On' }));
		await user.click(screen.getByRole('button', { name: 'On' }));
		expect(screen.getByRole('heading', { name: 'Februar 2024' })).toBeTruthy();
		expect(screen.getByRole('dialog', { name: 'Calendar' })).toBeTruthy();
	});

	it('keeps Tab inside the dialog: previous, next, the focused day', async () => {
		const user = userEvent.setup();
		render(DatePicker, { label: 'Date', value: '2024-03-13', locale: 'de-DE' });
		await openWith(user);
		const prev = screen.getByRole('button', { name: 'Previous month' });
		const next = screen.getByRole('button', { name: 'Next month' });
		await user.tab();
		expect(document.activeElement).toBe(prev);
		await user.tab();
		expect(document.activeElement).toBe(next);
		await user.tab();
		expect(document.activeElement).toBe(focusedCell());
		await user.tab({ shift: true });
		expect(document.activeElement).toBe(next);
		// Focus on the dialog itself: Tab goes to the first stop.
		(dialog() as HTMLElement).focus();
		await user.tab();
		expect(document.activeElement).toBe(prev);
		// Other keys inside the dialog do nothing.
		await user.keyboard('x');
		expect(dialog()).not.toBeNull();
	});

	it('skips a disabled month button in the Tab order', async () => {
		const user = userEvent.setup();
		render(DatePicker, { label: 'Date', value: '2024-03-13', locale: 'de-DE', min: '2024-03-01' });
		await openWith(user);
		await user.tab();
		expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Next month' }));
	});

	it('a pointer outside closes without moving the focus; inside keeps it open', async () => {
		const user = userEvent.setup();
		render(DatePicker, { label: 'Date', value: '2024-03-13', locale: 'de-DE' });
		const outside = document.createElement('button');
		outside.textContent = 'Outside';
		document.body.append(outside);
		try {
			await openWith(user);
			await user.click(screen.getByRole('heading'));
			expect(dialog()).not.toBeNull();
			await user.click(outside);
			expect(dialog()).toBeNull();
			// Closed: another outside pointer does nothing.
			await user.click(outside);
			expect(dialog()).toBeNull();
		} finally {
			outside.remove();
		}
	});
});

describe('DatePicker week start', () => {
	function firstHeader(): string | null {
		return document.querySelector('th')?.getAttribute('abbr') ?? null;
	}

	it('follows the locale: Sunday for en-US', async () => {
		const user = userEvent.setup();
		render(DatePicker, { label: 'Date', value: '2024-03-01', locale: 'en-US' });
		await user.click(calButton());
		expect(firstHeader()).toBe('Sunday');
	});

	it('weekStart overrides it and wraps; a non-integer is ignored', async () => {
		const user = userEvent.setup();
		const props = reactive<Props>({ label: 'Date', value: '2024-03-01', locale: 'de-DE', weekStart: 0 });
		render(DatePicker, { props });
		await user.click(calButton());
		expect(firstHeader()).toBe('Sonntag');
		props.weekStart = 9;
		await vi.waitFor(() => expect(firstHeader()).toBe('Dienstag'));
		props.weekStart = -1;
		await vi.waitFor(() => expect(firstHeader()).toBe('Samstag'));
		props.weekStart = 1.5;
		await vi.waitFor(() => expect(firstHeader()).toBe('Montag'));
	});

	describe('without Intl.Locale.prototype.getWeekInfo', () => {
		const proto = Intl.Locale.prototype as Intl.Locale & { getWeekInfo?: unknown; weekInfo?: unknown };
		let saved: PropertyDescriptor | undefined;
		beforeEach(() => {
			saved = Object.getOwnPropertyDescriptor(proto, 'getWeekInfo');
			Object.defineProperty(proto, 'getWeekInfo', { value: undefined, configurable: true, writable: true });
		});
		afterEach(() => {
			if (saved) Object.defineProperty(proto, 'getWeekInfo', saved);
			else delete proto.getWeekInfo;
			delete proto.weekInfo;
		});

		it('reads the older weekInfo property', async () => {
			const user = userEvent.setup();
			Object.defineProperty(proto, 'weekInfo', { get: () => ({ firstDay: 7 }), configurable: true });
			render(DatePicker, { label: 'Date', value: '2024-03-01', locale: 'de-DE' });
			await user.click(calButton());
			expect(firstHeader()).toBe('Sonntag');
		});

		it('falls back to Monday without week data', async () => {
			const user = userEvent.setup();
			render(DatePicker, { label: 'Date', value: '2024-03-01', locale: 'en-US' });
			await user.click(calButton());
			expect(firstHeader()).toBe('Monday');
		});

		it('falls back to Monday when reading the week data throws', async () => {
			const user = userEvent.setup();
			Object.defineProperty(proto, 'getWeekInfo', {
				value: () => {
					throw new Error('no week data');
				},
				configurable: true,
				writable: true
			});
			render(DatePicker, { label: 'Date', value: '2024-03-01', locale: 'en-US' });
			await user.click(calButton());
			expect(firstHeader()).toBe('Monday');
		});
	});
});
