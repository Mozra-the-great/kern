/**
 * Field, Input, Textarea, Select, Checkbox, Switch, RadioGroup (stuffcloud: fields.test.ts "Input",
 * "Select" and "Checkbox"; `hasText` / `describedBy` are `joinIds` in kern, tested in tests/components).
 * Differences by design: kern hides the hint while there is an error unless `keepHint` is set, and the
 * error is a `role="alert"` paragraph.
 */
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import Checkbox from '../../src/lib/components/Checkbox.svelte';
import Input from '../../src/lib/components/Input.svelte';
import RadioGroup from '../../src/lib/components/RadioGroup.svelte';
import Select, { type SelectOption } from '../../src/lib/components/Select.svelte';
import Switch from '../../src/lib/components/Switch.svelte';
import Textarea from '../../src/lib/components/Textarea.svelte';
import FieldHarness from '../components/FieldHarness.svelte';
import { textSnippet } from './helpers.js';
import { reactive } from './reactive.svelte.js';

describe('Field', () => {
	it('labels the control and hands the ids and states to it', () => {
		render(FieldHarness, { label: 'Name', hint: 'Letters only', required: true });
		const input = screen.getByLabelText(/^Name/);
		expect(input.id).toBe('ctl');
		expect(input.getAttribute('aria-describedby')).toBe(screen.getByText('Letters only').id);
		expect(input.getAttribute('aria-required')).toBe('true');
		expect(input.hasAttribute('aria-invalid')).toBe(false);
		expect(document.querySelector('.req')?.getAttribute('aria-hidden')).toBe('true');
	});

	it('an error invalidates the control, replaces the hint and is announced', () => {
		render(FieldHarness, { label: 'Name', hint: 'Letters only', error: 'Too short' });
		const input = screen.getByLabelText('Name');
		const alert = screen.getByRole('alert');
		expect(alert.textContent.trim()).toBe('Too short');
		expect(input.getAttribute('aria-invalid')).toBe('true');
		expect(input.getAttribute('aria-describedby')).toBe(alert.id);
		expect(screen.queryByText('Letters only')).toBeNull();
	});

	it('keepHint shows both, the error first', () => {
		render(FieldHarness, { label: 'Name', hint: 'Letters only', error: 'Too short', keepHint: true });
		const input = screen.getByLabelText('Name');
		expect(input.getAttribute('aria-describedby')).toBe(`${screen.getByRole('alert').id} ${screen.getByText('Letters only').id}`);
	});

	it('announce=false keeps the error referenced but silent', () => {
		render(FieldHarness, { label: 'Name', error: 'Too short', announce: false });
		expect(screen.queryByRole('alert')).toBeNull();
		expect(screen.getByLabelText('Name').getAttribute('aria-describedby')).toBe(screen.getByText('Too short').id);
	});

	it('treats empty label, hint and error as absent', () => {
		render(FieldHarness, { label: '', hint: '', error: '' });
		expect(document.querySelector('label')).toBeNull();
		expect(document.querySelector('.desc')).toBeNull();
		expect(document.getElementById('ctl')?.getAttribute('aria-describedby')).toBeNull();
	});
});

describe('Input', () => {
	it('labels the field (no placeholder-only inputs)', () => {
		render(Input, { label: 'Name' });
		const input = screen.getByLabelText('Name');
		expect(input.tagName).toBe('INPUT');
		expect(input.getAttribute('aria-invalid')).toBeNull();
		expect(input.getAttribute('aria-describedby')).toBeNull();
	});

	it('shows the value, updates it while typing and keeps the bound value in step', async () => {
		const user = userEvent.setup();
		const props = reactive<{ label: string; value: string | number | null | undefined }>({ label: 'Name', value: 'abc' });
		render(Input, { props });
		const input = screen.getByLabelText<HTMLInputElement>('Name');
		expect(input.value).toBe('abc');
		await user.type(input, 'd');
		expect(input.value).toBe('abcd');
		expect(props.value).toBe('abcd');
		props.value = 'reset';
		await vi.waitFor(() => expect(input.value).toBe('reset'));
	});

	it('an undefined value behaves like a missing prop (empty field)', () => {
		render(Input, { label: 'Name', value: undefined });
		expect(screen.getByLabelText<HTMLInputElement>('Name').value).toBe('');
	});

	it('links the hint through aria-describedby', () => {
		render(Input, { label: 'Name', hint: 'Letters only' });
		const input = screen.getByLabelText('Name');
		expect(input.getAttribute('aria-describedby')).toBe(screen.getByText('Letters only').id);
		expect(input.getAttribute('aria-invalid')).toBeNull();
	});

	it('marks the field invalid and links the error', () => {
		render(Input, { label: 'Name', hint: 'Letters only', error: 'Too short' });
		const input = screen.getByLabelText('Name');
		expect(input.getAttribute('aria-invalid')).toBe('true');
		expect(input.getAttribute('aria-describedby')).toBe(screen.getByText('Too short').id);
	});

	it('keeps the consumer own aria-describedby after the generated ids', () => {
		render(Input, { label: 'Name', hint: 'Hint', 'aria-describedby': 'extra' });
		expect(screen.getByLabelText('Name').getAttribute('aria-describedby')).toBe(`${screen.getByText('Hint').id} extra`);
	});

	it('uses a given id and passes other attributes through', () => {
		render(Input, { label: 'Email', id: 'mail', type: 'email', required: true, disabled: true, placeholder: 'you@example.org' });
		const input = screen.getByLabelText<HTMLInputElement>(/Email/);
		expect(input.id).toBe('mail');
		expect(input.type).toBe('email');
		expect(input.required).toBe(true);
		expect(input.disabled).toBe(true);
		expect(input.placeholder).toBe('you@example.org');
	});

	it('gives two inputs different ids', () => {
		render(Input, { label: 'A' });
		render(Input, { label: 'B' });
		expect(screen.getByLabelText('A').id).not.toBe(screen.getByLabelText('B').id);
	});

	it('renders the leading and trailing snippets around the input', () => {
		render(Input, { label: 'Price', leading: textSnippet('EUR'), trailing: textSnippet('net') });
		const adorn = [...document.querySelectorAll('.adorn')].map((el) => el.textContent.trim());
		expect(adorn).toEqual(['EUR', 'net']);
	});

	it('is a tab stop that is skipped while disabled', async () => {
		const user = userEvent.setup();
		render(Input, { label: 'Name', disabled: true });
		await user.tab();
		expect(document.activeElement).toBe(document.body);
	});
});

describe('Textarea', () => {
	it('is labelled, bindable and invalid with an error', async () => {
		const user = userEvent.setup();
		const props = reactive<{ label: string; value: string | undefined; error: string | undefined }>({
			label: 'Message',
			value: 'hi',
			error: undefined
		});
		render(Textarea, { props });
		const area = screen.getByLabelText<HTMLTextAreaElement>('Message');
		expect(area.tagName).toBe('TEXTAREA');
		expect(area.value).toBe('hi');
		await user.type(area, '!');
		expect(props.value).toBe('hi!');
		props.error = 'Too short';
		await vi.waitFor(() => expect(area.getAttribute('aria-invalid')).toBe('true'));
		expect(area.getAttribute('aria-describedby')).toBe(screen.getByRole('alert').id);
	});
});

describe('Select', () => {
	const options: SelectOption[] = [
		{ value: 'one', label: 'One day' },
		{ value: 'seven', label: 'Seven days' },
		{ value: 'never', label: 'Never', disabled: true }
	];

	it('renders a labelled native select with its options', () => {
		render(Select, { label: 'Expires', options, value: 'seven' });
		const select = screen.getByLabelText<HTMLSelectElement>('Expires');
		expect(select.tagName).toBe('SELECT');
		expect(select.value).toBe('seven');
		expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual(['One day', 'Seven days', 'Never']);
		expect(screen.getByRole<HTMLOptionElement>('option', { name: 'Never' }).disabled).toBe(true);
	});

	it('changes the value with the mouse and reports it through the bound value', async () => {
		const user = userEvent.setup();
		const props = reactive<{ label: string; options: SelectOption[]; value: string | undefined }>({
			label: 'Expires',
			options,
			value: 'one'
		});
		render(Select, { props });
		const select = screen.getByLabelText<HTMLSelectElement>('Expires');
		await user.selectOptions(select, 'seven');
		expect(select.value).toBe('seven');
		expect(props.value).toBe('seven');
		props.value = 'one';
		await vi.waitFor(() => expect(select.value).toBe('one'));
	});

	it('links hint and error and marks the select invalid', () => {
		render(Select, { label: 'Expires', options, hint: 'Pick one', error: 'Required', keepHint: true });
		const select = screen.getByLabelText('Expires');
		expect(select.getAttribute('aria-invalid')).toBe('true');
		expect(select.getAttribute('aria-describedby')).toBe(`${screen.getByText('Required').id} ${screen.getByText('Pick one').id}`);
	});

	it('describes the select by the hint alone or the error alone', () => {
		const { unmount } = render(Select, { label: 'Expires', options, hint: 'Pick one' });
		const select = screen.getByLabelText('Expires');
		expect(select.getAttribute('aria-describedby')).toBe(screen.getByText('Pick one').id);
		expect(select.getAttribute('aria-invalid')).toBeNull();
		unmount();
		render(Select, { label: 'Expires', options, error: 'Required' });
		expect(screen.getByLabelText('Expires').getAttribute('aria-describedby')).toBe(screen.getByText('Required').id);
	});

	it('follows a changed option list', async () => {
		const { rerender } = render(Select, { label: 'Expires', options, value: 'one' });
		await rerender({ options: [{ value: 'one', label: 'One day', disabled: true }] });
		expect(screen.getAllByRole('option')).toHaveLength(1);
		expect(screen.getByRole<HTMLOptionElement>('option').disabled).toBe(true);
	});

	it('has no description and is valid without hint and error', () => {
		render(Select, { label: 'Expires', options, id: 'exp' });
		const select = screen.getByLabelText('Expires');
		expect(select.id).toBe('exp');
		expect(select.getAttribute('aria-invalid')).toBeNull();
		expect(select.getAttribute('aria-describedby')).toBeNull();
	});

	it('a placeholder is a leading empty option that a required select cannot pick again', () => {
		const { unmount } = render(Select, { label: 'Expires', options, placeholder: 'Choose' });
		const placeholder = screen.getByRole<HTMLOptionElement>('option', { name: 'Choose' });
		expect(placeholder.value).toBe('');
		expect(placeholder.disabled).toBe(false);
		expect(screen.getByLabelText<HTMLSelectElement>('Expires').value).toBe('');
		unmount();
		render(Select, { label: 'Expires', options, placeholder: 'Choose', required: true });
		expect(screen.getByRole<HTMLOptionElement>('option', { name: 'Choose' }).disabled).toBe(true);
	});

	it('is skipped by Tab while disabled and passes name and required through', async () => {
		const user = userEvent.setup();
		render(Select, { label: 'Expires', options, name: 'expires', required: true, disabled: true });
		const select = screen.getByLabelText<HTMLSelectElement>(/Expires/);
		expect(select.name).toBe('expires');
		expect(select.required).toBe(true);
		await user.tab();
		expect(document.activeElement).not.toBe(select);
	});
});

describe('Checkbox', () => {
	it('is a real checkbox named by its label', () => {
		render(Checkbox, { label: 'Protect with a password' });
		const box = screen.getByRole<HTMLInputElement>('checkbox', { name: 'Protect with a password' });
		expect(box.checked).toBe(false);
	});

	it('toggles by click on the box or on the label text, and with the space key', async () => {
		const user = userEvent.setup();
		const props = reactive<{ label: string; checked: boolean | undefined }>({ label: 'Agree', checked: undefined });
		render(Checkbox, { props });
		const box = screen.getByRole<HTMLInputElement>('checkbox');
		await user.click(box);
		expect(box.checked).toBe(true);
		expect(props.checked).toBe(true);
		await user.click(screen.getByText('Agree'));
		expect(box.checked).toBe(false);
		expect(props.checked).toBe(false);
		box.focus();
		await user.keyboard(' ');
		expect(box.checked).toBe(true);
		expect(props.checked).toBe(true);
	});

	it('is a tab stop', async () => {
		const user = userEvent.setup();
		render(Checkbox, { label: 'Agree' });
		await user.tab();
		expect(document.activeElement).toBe(screen.getByRole('checkbox'));
	});

	it('starts checked when asked to and passes attributes through', () => {
		render(Checkbox, { label: 'Agree', checked: true, disabled: true, name: 'agree', value: 'yes' });
		const box = screen.getByRole<HTMLInputElement>('checkbox');
		expect(box.checked).toBe(true);
		expect(box.disabled).toBe(true);
		expect(box.name).toBe('agree');
		expect(box.value).toBe('yes');
	});

	it('does not toggle while disabled', async () => {
		const user = userEvent.setup();
		render(Checkbox, { label: 'Agree', disabled: true });
		await user.click(screen.getByText('Agree'));
		expect(screen.getByRole<HTMLInputElement>('checkbox').checked).toBe(false);
	});

	it('indeterminate is a DOM state of the box that a click resolves', async () => {
		const user = userEvent.setup();
		const props = reactive<{ label: string; checked: boolean | undefined; indeterminate: boolean | undefined }>({
			label: 'All',
			checked: false,
			indeterminate: true
		});
		render(Checkbox, { props });
		const box = screen.getByRole<HTMLInputElement>('checkbox');
		expect(box.indeterminate).toBe(true);
		expect(document.querySelector('.box path')?.getAttribute('d')).toBe('M4 8h8');
		await user.click(box);
		expect(box.indeterminate).toBe(false);
		expect(props.indeterminate).toBe(false);
		expect(props.checked).toBe(true);
	});

	it('links the hint with aria-describedby and renders children as the label', () => {
		const { unmount } = render(Checkbox, { label: 'Agree', hint: 'Required for the trial' });
		expect(screen.getByRole('checkbox').getAttribute('aria-describedby')).toBe(screen.getByText('Required for the trial').id);
		unmount();
		render(Checkbox, { children: textSnippet('From a snippet') });
		expect(screen.getByRole('checkbox', { name: 'From a snippet' })).toBeTruthy();
		expect(screen.getByRole('checkbox').hasAttribute('aria-describedby')).toBe(false);
	});
});

describe('Switch', () => {
	it('is a switch named by its label and toggles with click and keyboard', async () => {
		const user = userEvent.setup();
		const props = reactive<{ label: string; checked: boolean | undefined; hint: string }>({
			label: 'Notifications',
			checked: undefined,
			hint: 'Mail only'
		});
		render(Switch, { props });
		const toggle = screen.getByRole<HTMLInputElement>('switch', { name: 'Notifications' });
		expect(toggle.getAttribute('aria-checked')).toBe('false');
		expect(toggle.getAttribute('aria-describedby')).toBe(screen.getByText('Mail only').id);
		await user.click(toggle);
		expect(props.checked).toBe(true);
		expect(toggle.getAttribute('aria-checked')).toBe('true');
		toggle.focus();
		await user.keyboard(' ');
		expect(props.checked).toBe(false);
		await user.click(screen.getByText('Notifications'));
		expect(props.checked).toBe(true);
	});

	it('stays off while disabled', async () => {
		const user = userEvent.setup();
		render(Switch, { label: 'Notifications', disabled: true });
		await user.click(screen.getByRole('switch'));
		expect(screen.getByRole<HTMLInputElement>('switch').checked).toBe(false);
	});
});

describe('RadioGroup', () => {
	const options = [
		{ value: 's', label: 'Small', hint: 'Fits one' },
		{ value: 'm', label: 'Medium' },
		{ value: 'l', label: 'Large', disabled: true }
	];

	it('is a group named by its legend, with one radio per option sharing a name', () => {
		render(RadioGroup, { label: 'Size', options, name: 'size' });
		expect(screen.getByRole('group', { name: 'Size' })).toBeTruthy();
		const radios = screen.getAllByRole<HTMLInputElement>('radio');
		expect(radios.map((r) => r.value)).toEqual(['s', 'm', 'l']);
		expect(new Set(radios.map((r) => r.name))).toEqual(new Set(['size']));
		expect(radios[2]?.disabled).toBe(true);
		expect(radios[0]?.getAttribute('aria-describedby')).toBe(screen.getByText('Fits one').id);
	});

	it('selects with the mouse, reports the value and moves with the arrow keys', async () => {
		const user = userEvent.setup();
		const onchange = vi.fn();
		const props = reactive<{ label: string; options: typeof options; value: string | undefined; onchange: (v: string) => void }>({
			label: 'Size',
			options,
			value: undefined,
			onchange
		});
		render(RadioGroup, { props });
		await user.click(screen.getByRole('radio', { name: 'Small' }));
		expect(props.value).toBe('s');
		expect(onchange).toHaveBeenLastCalledWith('s');
		await user.keyboard('{ArrowDown}');
		expect(props.value).toBe('m');
		expect(onchange).toHaveBeenLastCalledWith('m');
		// The disabled option is skipped, the arrow wraps to the first one.
		await user.keyboard('{ArrowDown}');
		expect(props.value).toBe('s');
		expect(onchange).toHaveBeenCalledTimes(3);
	});

	it('an error is referenced by the group', () => {
		render(RadioGroup, { label: 'Size', options, error: 'Pick a size' });
		expect(screen.getByRole('group').getAttribute('aria-describedby')).toBe(screen.getByText('Pick a size').id);
	});

	it('follows a value set from outside', async () => {
		const props = reactive<{ label: string; options: typeof options; value: string }>({ label: 'Size', options, value: 'm' });
		render(RadioGroup, { props });
		expect(screen.getByRole<HTMLInputElement>('radio', { name: 'Medium' }).checked).toBe(true);
		props.value = 's';
		await vi.waitFor(() => expect(screen.getByRole<HTMLInputElement>('radio', { name: 'Small' }).checked).toBe(true));
	});
});
