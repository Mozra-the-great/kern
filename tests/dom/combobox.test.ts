/**
 * Combobox (WAI-ARIA combobox with a listbox popup): field wiring, `bind:value` and `onchange`, filtering
 * (case and diacritics), the keyboard model (arrows, Home/End, Enter, Escape, Tab, aria-activedescendant),
 * pointer use of the list, committing typed text on blur (exact label, free text with `allowCustom`, revert),
 * disabled options and the disabled field, the hidden form input and the default strings.
 */
import { fireEvent, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Combobox, { type ComboboxOption } from '../../src/lib/components/Combobox.svelte';
import { strings } from '../../src/lib/components/strings.svelte.js';
import { reactive } from './reactive.svelte.js';

const OPTIONS: ComboboxOption[] = [
	{ value: 'apple', label: 'Apple' },
	{ value: 'banana', label: 'Banana', disabled: true },
	{ value: 'cafe', label: 'Café' },
	{ value: 'date', label: 'Date' }
];

interface State {
	label?: string | undefined;
	value?: string | undefined;
	options: ComboboxOption[];
	allowCustom?: boolean | undefined;
	onchange?: ((value: string) => void) | undefined;
}

function setup(state: Partial<State> = {}) {
	const user = userEvent.setup();
	const onchange = vi.fn<(value: string) => void>();
	const props = reactive<State>({ label: 'Fruit', value: '', options: OPTIONS, onchange, ...state });
	const view = render(Combobox, { props });
	const input = screen.getByRole<HTMLInputElement>('combobox', { name: 'Fruit' });
	const listbox = (): HTMLElement => screen.getByRole('listbox', { hidden: true });
	const options = (): HTMLElement[] => screen.queryAllByRole('option', { hidden: true });
	const active = (): string | undefined => {
		const id = input.getAttribute('aria-activedescendant');
		return id ? document.getElementById(id)?.textContent.trim() : undefined;
	};
	return { user, props, onchange, input, listbox, options, active, ...view };
}

afterEach(() => {
	vi.restoreAllMocks();
});

describe('Combobox', () => {
	it('renders a labelled, collapsed combobox with the default strings', () => {
		const { input, listbox, options, container } = setup();
		expect(input.getAttribute('aria-expanded')).toBe('false');
		expect(input.getAttribute('aria-autocomplete')).toBe('list');
		expect(input.getAttribute('aria-controls')).toBe(listbox().id);
		expect(input.hasAttribute('aria-activedescendant')).toBe(false);
		expect(input.getAttribute('autocomplete')).toBe('off');
		expect(input.required).toBe(false);
		expect(listbox().getAttribute('aria-label')).toBe('Fruit');
		expect(options()).toHaveLength(0);
		const toggle = screen.getByRole('button', { name: strings().combobox.toggleLabel, hidden: true });
		expect(toggle.getAttribute('tabindex')).toBe('-1');
		expect(container.querySelector('input[type="hidden"]')).toBeNull();
		expect(screen.getByRole('status').textContent).toBe('');
	});

	it('takes id, name, placeholder, autocomplete, required, hint, error, class and custom strings', async () => {
		const user = userEvent.setup();
		const { container } = render(Combobox, {
			label: 'Fruit',
			hint: 'Pick one',
			error: 'Required',
			options: OPTIONS,
			value: 'date',
			id: 'fruit',
			name: 'fruit',
			placeholder: 'Type…',
			autocomplete: 'on',
			required: true,
			noResults: 'Nothing',
			toggleLabel: 'Show fruit',
			class: 'mine'
		});
		const input = screen.getByRole<HTMLInputElement>('combobox', { name: /Fruit/ });
		expect(input.id).toBe('fruit');
		expect(input.placeholder).toBe('Type…');
		expect(input.getAttribute('autocomplete')).toBe('on');
		expect(input.required).toBe(true);
		expect(input.value).toBe('Date');
		expect(input.getAttribute('aria-invalid')).toBe('true');
		expect(input.getAttribute('aria-describedby')).toBeTruthy();
		expect(container.querySelector<HTMLInputElement>('input[type="hidden"]')?.value).toBe('date');
		expect(container.querySelector('.mine')).not.toBeNull();
		await user.type(input, 'zzz');
		expect(screen.getByRole('status').textContent).toBe('Nothing');
		expect(container.querySelector('.empty')?.textContent).toBe('Nothing');
		expect(screen.getByRole('button', { name: 'Show fruit', hidden: true })).toBeTruthy();
	});

	it('typing filters by label, ignoring case and diacritics, and opens the list without an active option', async () => {
		const { user, input, options, active } = setup();
		await user.type(input, 'CAFE');
		expect(input.getAttribute('aria-expanded')).toBe('true');
		expect(options().map((o) => o.textContent.trim())).toEqual(['Café']);
		expect(active()).toBeUndefined();
		await user.clear(input);
		await user.type(input, ' ');
		expect(options()).toHaveLength(OPTIONS.length);
	});

	it('ArrowDown opens on the selected option, moves past disabled options and wraps', async () => {
		const { user, input, active, options } = setup({ value: 'apple' });
		input.focus();
		await user.keyboard('{ArrowDown}');
		expect(input.getAttribute('aria-expanded')).toBe('true');
		expect(active()).toBe('Apple');
		expect(options()[0].getAttribute('aria-selected')).toBe('true');
		expect(options()[0].querySelector('svg.check')).not.toBeNull();
		expect(options()[1].getAttribute('aria-disabled')).toBe('true');
		await user.keyboard('{ArrowDown}');
		expect(active()).toBe('Café');
		await user.keyboard('{ArrowDown}{ArrowDown}');
		expect(active()).toBe('Apple');
		await user.keyboard('{ArrowUp}');
		expect(active()).toBe('Date');
	});

	it('ArrowDown opens on the first enabled option when the value is not in the list', async () => {
		const { user, input, active } = setup({ value: 'banana' });
		input.focus();
		await user.keyboard('{ArrowDown}');
		expect(active()).toBe('Apple');
	});

	it('Alt+ArrowDown opens without an active option; ArrowDown then starts at the top', async () => {
		const { user, input, active } = setup();
		input.focus();
		await user.keyboard('{Alt>}{ArrowDown}{/Alt}');
		expect(input.getAttribute('aria-expanded')).toBe('true');
		expect(active()).toBeUndefined();
		await user.keyboard('{ArrowDown}');
		expect(active()).toBe('Apple');
	});

	it('ArrowUp opens on the last option; from no active option it starts at the end', async () => {
		const { user, input, active } = setup();
		input.focus();
		await user.keyboard('{ArrowUp}');
		expect(active()).toBe('Date');
		await user.keyboard('{Escape}');
		await user.keyboard('{Alt>}{ArrowDown}{/Alt}{ArrowUp}');
		expect(active()).toBe('Date');
	});

	it('ArrowDown after typing opens on the first match', async () => {
		const { user, input, active } = setup();
		await user.type(input, 'a');
		await user.keyboard('{Escape}');
		expect(input.getAttribute('aria-expanded')).toBe('false');
		await user.keyboard('{ArrowDown}');
		expect(active()).toBe('Apple');
	});

	it('Home and End jump in the list with an active option, otherwise they move the caret', async () => {
		const { user, input, active } = setup();
		await user.type(input, 'a');
		await user.keyboard('{Home}');
		expect(active()).toBeUndefined();
		await user.keyboard('{ArrowDown}{End}');
		expect(active()).toBe('Date');
		await user.keyboard('{Home}');
		expect(active()).toBe('Apple');
	});

	it('ArrowLeft and ArrowRight drop the active option', async () => {
		const { user, input, active } = setup();
		input.focus();
		await user.keyboard('{ArrowDown}');
		expect(active()).toBe('Apple');
		await user.keyboard('{ArrowRight}');
		expect(active()).toBeUndefined();
		await user.keyboard('{ArrowDown}{ArrowLeft}');
		expect(active()).toBeUndefined();
	});

	it('Enter chooses the active option, updates the binding and calls onchange once', async () => {
		const { user, input, props, onchange } = setup();
		input.focus();
		await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');
		expect(props.value).toBe('cafe');
		expect(input.value).toBe('Café');
		expect(onchange).toHaveBeenCalledWith('cafe');
		expect(input.getAttribute('aria-expanded')).toBe('false');
		// Choosing the same value again does not call onchange.
		await user.keyboard('{ArrowDown}{Enter}');
		expect(onchange).toHaveBeenCalledTimes(1);
	});

	it('Enter commits an exact typed label, and Enter while closed and not filtering does nothing', async () => {
		const { user, input, props, onchange } = setup();
		await user.type(input, 'date{Enter}');
		expect(props.value).toBe('date');
		expect(input.value).toBe('Date');
		await user.keyboard('{Enter}');
		expect(onchange).toHaveBeenCalledTimes(1);
	});

	it('typed text without a match reverts to the last value, a disabled label does not count', async () => {
		const { user, input, props, onchange } = setup({ value: 'apple' });
		await user.clear(input);
		await user.type(input, 'Banana{Enter}');
		expect(props.value).toBe('apple');
		expect(input.value).toBe('Apple');
		expect(onchange).not.toHaveBeenCalled();
	});

	it('allowCustom accepts free text and shows it as the label', async () => {
		const { user, input, props, onchange } = setup({ allowCustom: true });
		await user.type(input, '  Kiwi {Tab}');
		expect(props.value).toBe('Kiwi');
		expect(onchange).toHaveBeenCalledWith('Kiwi');
		expect(input.value).toBe('Kiwi');
	});

	it('clearing the text clears the value', async () => {
		const { user, input, props, onchange } = setup({ value: 'date' });
		await user.clear(input);
		await user.keyboard('{Enter}');
		expect(props.value).toBe('');
		expect(onchange).toHaveBeenCalledWith('');
	});

	it('Escape closes the list first, then clears the text and the value', async () => {
		const seen: boolean[] = [];
		const listener = (e: KeyboardEvent): void => {
			if (e.key === 'Escape') seen.push(e.defaultPrevented);
		};
		document.addEventListener('keydown', listener);
		const { user, input, props } = setup({ value: 'date' });
		input.focus();
		await user.keyboard('{ArrowDown}{Escape}');
		expect(input.getAttribute('aria-expanded')).toBe('false');
		// Closing the list keeps the Escape away from the page (a surrounding dialog stays open).
		expect(seen).toEqual([]);
		expect(props.value).toBe('date');
		await user.keyboard('{Escape}');
		expect(input.value).toBe('');
		expect(props.value).toBe('');
		// Empty and closed: Escape is left to the page.
		await user.keyboard('{Escape}');
		expect(seen).toEqual([true, false]);
		document.removeEventListener('keydown', listener);
	});

	it('Tab chooses the active option or commits the text, and a plain Tab changes nothing', async () => {
		const { user, input, props, onchange } = setup();
		input.focus();
		await user.keyboard('{ArrowDown}{Tab}');
		expect(props.value).toBe('apple');
		input.focus();
		await user.keyboard('{Alt>}{ArrowDown}{/Alt}{Tab}');
		expect(props.value).toBe('apple');
		input.focus();
		await user.tab();
		expect(onchange).toHaveBeenCalledTimes(1);
	});

	it('blur commits typed text; a blur without typing changes nothing', async () => {
		const { user, input, props, onchange } = setup();
		await user.type(input, 'apple');
		input.blur();
		expect(props.value).toBe('apple');
		await vi.waitFor(() => expect(input.getAttribute('aria-expanded')).toBe('false'));
		input.focus();
		input.blur();
		expect(onchange).toHaveBeenCalledTimes(1);
	});

	it('the toggle button opens on the selected option, closes again and keeps focus in the input', async () => {
		const { user, input, active } = setup({ value: 'date' });
		const toggle = screen.getByRole('button', { hidden: true });
		await user.click(toggle);
		expect(input.getAttribute('aria-expanded')).toBe('true');
		expect(toggle.getAttribute('aria-expanded')).toBe('true');
		expect(active()).toBe('Date');
		expect(document.activeElement).toBe(input);
		await user.click(toggle);
		expect(input.getAttribute('aria-expanded')).toBe('false');
		expect(document.activeElement).toBe(input);
	});

	it('scrolls the active option into view', async () => {
		const scroll = vi.spyOn(Element.prototype, 'scrollIntoView');
		const { user, input } = setup();
		input.focus();
		await user.keyboard('{ArrowDown}');
		await vi.waitFor(() => expect(scroll).toHaveBeenCalledWith({ block: 'nearest' }));
	});

	it('the pointer highlights enabled options and a click chooses one; focus stays in the input', async () => {
		const { user, input, options, active, props, listbox } = setup();
		input.focus();
		await user.keyboard('{Alt>}{ArrowDown}{/Alt}');
		const [apple, banana] = options();
		await user.pointer({ target: banana });
		expect(active()).toBeUndefined();
		await user.pointer({ target: apple });
		expect(active()).toBe('Apple');
		// A pointer over the list itself, outside any option, changes nothing.
		await fireEvent.pointerMove(listbox());
		expect(active()).toBe('Apple');
		const down = await fireEvent.mouseDown(apple);
		expect(down).toBe(false);
		await user.click(banana);
		expect(props.value).toBe('');
		expect(input.getAttribute('aria-expanded')).toBe('true');
		await user.click(listbox());
		expect(input.getAttribute('aria-expanded')).toBe('true');
		await user.click(options()[3]);
		expect(props.value).toBe('date');
		expect(document.activeElement).toBe(input);
	});

	it('the toggle keeps the input focused on mousedown', async () => {
		setup();
		expect(await fireEvent.mouseDown(screen.getByRole('button', { hidden: true }))).toBe(false);
	});

	it('a value set from outside shows its label; an unknown value shows nothing', async () => {
		const { props, input } = setup();
		props.value = 'cafe';
		await vi.waitFor(() => expect(input.value).toBe('Café'));
		props.value = 'nope';
		await vi.waitFor(() => expect(input.value).toBe(''));
		props.value = undefined;
		await vi.waitFor(() => expect(input.value).toBe(''));
	});

	it('an undefined value is empty, and a renamed option relabels the input', async () => {
		const { props, input } = setup({ value: 'apple' });
		props.options = [{ value: 'apple', label: 'Green apple' }];
		await vi.waitFor(() => expect(input.value).toBe('Green apple'));
	});

	it('with only disabled options or no matches the keyboard selects nothing', async () => {
		const { user, input, active, props } = setup({ options: [{ value: 'x', label: 'X', disabled: true }] });
		input.focus();
		await user.keyboard('{ArrowDown}');
		expect(active()).toBeUndefined();
		await user.keyboard('{ArrowDown}{ArrowUp}{End}');
		expect(active()).toBeUndefined();
		await user.keyboard('{Escape}{ArrowUp}');
		expect(active()).toBeUndefined();
		await user.keyboard('{Escape}');
		await user.click(screen.getByRole('button', { hidden: true }));
		expect(active()).toBeUndefined();
		await user.keyboard('{Escape}');
		await user.type(input, 'x');
		await user.keyboard('{Escape}{ArrowDown}');
		expect(input.getAttribute('aria-expanded')).toBe('true');
		expect(active()).toBeUndefined();
		props.options = [];
		await user.keyboard('{ArrowDown}');
		expect(active()).toBeUndefined();
	});

	it('Home and End select nothing once the options under the active one turn disabled', async () => {
		const { user, input, active, props } = setup();
		input.focus();
		await user.keyboard('{ArrowDown}');
		expect(active()).toBe('Apple');
		props.options = [{ value: 'x', label: 'X', disabled: true }];
		await vi.waitFor(() => expect(active()).toBe('X'));
		await user.keyboard('{End}');
		expect(active()).toBeUndefined();
	});

	it('disabled: no typing, no toggle, and the keyboard does not open the list', async () => {
		const user = userEvent.setup();
		render(Combobox, { label: 'Fruit', options: OPTIONS, disabled: true });
		const input = screen.getByRole<HTMLInputElement>('combobox');
		expect(input.disabled).toBe(true);
		const toggle = screen.getByRole<HTMLButtonElement>('button', { hidden: true });
		expect(toggle.disabled).toBe(true);
		await user.click(toggle);
		await fireEvent.keyDown(input, { key: 'ArrowDown' });
		expect(input.getAttribute('aria-expanded')).toBe('false');
	});

	it('other keys are left alone', async () => {
		const { user, input } = setup();
		input.focus();
		const event = await fireEvent.keyDown(input, { key: 'PageDown' });
		expect(event).toBe(true);
		await user.keyboard('{Enter}');
		expect(input.getAttribute('aria-expanded')).toBe('false');
	});

	it('renders no class for a null class from an untyped consumer', () => {
		const { container } = render(Combobox, { label: 'Fruit', options: OPTIONS, class: null as unknown as string });
		expect(container.innerHTML).not.toContain('null');
	});
});
