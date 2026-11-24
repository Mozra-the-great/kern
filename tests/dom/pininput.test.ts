/**
 * PinInput: one box per character inside a labelled group. Covers typing (focus moves on, filled box is
 * replaced, disallowed characters never land), Backspace/Delete, arrow keys, Home/End, paste (full code
 * and a piece), virtual-keyboard deletion, the bound value in both directions, onchange/oncomplete,
 * numeric vs alphanumeric, mask, the hidden form input, required/disabled/invalid and the box labels.
 */
import { fireEvent, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import PinInput from '../../src/lib/components/PinInput.svelte';
import { flush } from './helpers.js';
import { reactive } from './reactive.svelte.js';

function boxes(): HTMLInputElement[] {
	return screen.getAllByRole('textbox') as HTMLInputElement[];
}
function values(): string[] {
	return boxes().map((b) => b.value);
}

describe('PinInput', () => {
	it('renders a labelled group of six numeric boxes by default', () => {
		render(PinInput, { label: 'Code' });
		const group = screen.getByRole('group', { name: 'Code' });
		expect(group.getAttribute('aria-describedby')).toBeNull();
		const all = boxes();
		expect(all).toHaveLength(6);
		expect(all[0].getAttribute('aria-label')).toBe('Digit 1 of 6');
		expect(all[0].getAttribute('autocomplete')).toBe('one-time-code');
		expect(all[1].getAttribute('autocomplete')).toBe('off');
		expect(all[0].getAttribute('inputmode')).toBe('numeric');
		expect(all[0].getAttribute('enterkeyhint')).toBe('next');
		expect(all[5].getAttribute('enterkeyhint')).toBe('done');
		expect(all[0].required).toBe(false);
		expect(all[0].disabled).toBe(false);
		expect(all[0].getAttribute('aria-invalid')).toBeNull();
		expect(document.querySelector('input[type="hidden"]')).toBeNull();
		// The label points to the first box.
		expect(document.querySelector('label')?.getAttribute('for')).toBe(all[0].id);
	});

	it('without a label the group has no name', () => {
		render(PinInput, {});
		expect(screen.getByRole('group').getAttribute('aria-labelledby')).toBeNull();
		expect(document.querySelector('label')).toBeNull();
	});

	it('typing fills the boxes, moves the focus on and reports change and completion', async () => {
		const user = userEvent.setup();
		const onchange = vi.fn();
		const oncomplete = vi.fn();
		const props = reactive<{
			label: string;
			length: number;
			value?: string | undefined;
			onchange: typeof onchange;
			oncomplete: typeof oncomplete;
		}>({
			label: 'Code',
			length: 4,
			value: undefined,
			onchange,
			oncomplete
		});
		render(PinInput, { props });
		await user.click(boxes()[0]);
		await user.keyboard('12');
		await vi.waitFor(() => expect(document.activeElement).toBe(boxes()[2]));
		expect(values()).toEqual(['1', '2', '', '']);
		expect(props.value).toBe('12');
		expect(onchange).toHaveBeenLastCalledWith('12');
		expect(boxes()[0].classList.contains('filled')).toBe(true);
		expect(oncomplete).not.toHaveBeenCalled();
		await user.keyboard('34');
		await vi.waitFor(() => expect(oncomplete).toHaveBeenCalledWith('1234'));
		// The last box keeps the focus.
		expect(document.activeElement).toBe(boxes()[3]);
	});

	it('blocks characters that are not allowed, but lets shortcuts through', async () => {
		const user = userEvent.setup();
		const onchange = vi.fn();
		render(PinInput, { label: 'Code', length: 3, onchange });
		const first = boxes()[0];
		first.focus();
		const blocked = await fireEvent.keyDown(first, { key: 'a' });
		expect(blocked).toBe(false);
		expect(await fireEvent.keyDown(first, { key: 'a', ctrlKey: true })).toBe(true);
		expect(await fireEvent.keyDown(first, { key: 'v', metaKey: true })).toBe(true);
		expect(await fireEvent.keyDown(first, { key: 'a', altKey: true })).toBe(true);
		expect(await fireEvent.keyDown(first, { key: 'Tab' })).toBe(true);
		expect(await fireEvent.keyDown(first, { key: '5' })).toBe(true);
		await user.keyboard('x');
		expect(values()).toEqual(['', '', '']);
		expect(onchange).not.toHaveBeenCalled();
	});

	it('an input event with a disallowed character restores the box', () => {
		render(PinInput, { label: 'Code', length: 3, value: '7' });
		const first = boxes()[0];
		first.value = 'x';
		fireEvent.input(first);
		expect(first.value).toBe('7');
		const second = boxes()[1];
		second.value = 'x';
		fireEvent.input(second);
		expect(second.value).toBe('');
	});

	it('an empty input event deletes the character (virtual keyboards skip keydown)', () => {
		const onchange = vi.fn();
		render(PinInput, { label: 'Code', length: 3, value: '12', onchange });
		const first = boxes()[0];
		first.value = '';
		fireEvent.input(first);
		expect(onchange).toHaveBeenCalledWith('2');
		// Already empty: nothing to report.
		const third = boxes()[2];
		third.value = '';
		fireEvent.input(third);
		expect(onchange).toHaveBeenCalledTimes(1);
	});

	it('typing into a filled box keeps the new character, whichever side it lands on', async () => {
		const onchange = vi.fn();
		render(PinInput, { label: 'Code', length: 3, value: '111', onchange });
		const first = boxes()[0];
		first.value = '15';
		fireEvent.input(first);
		expect(values()[0]).toBe('5');
		const second = boxes()[1];
		second.value = '61';
		fireEvent.input(second);
		expect(values()[1]).toBe('6');
		// Two new characters (neither the old one) fill on from that box.
		const third = boxes()[2];
		third.value = '89';
		fireEvent.input(third);
		expect(values()[2]).toBe('8');
		expect(onchange).toHaveBeenLastCalledWith('568');
		await flush();
	});

	it('an input of several characters fills on from the box, stopping at the last', async () => {
		render(PinInput, { label: 'Code', length: 3 });
		const second = boxes()[1];
		second.value = '4567';
		fireEvent.input(second);
		expect(values()).toEqual(['', '4', '5']);
		await vi.waitFor(() => expect(document.activeElement).toBe(boxes()[2]));
	});

	it('Backspace clears the box, or the previous one when it is empty, and moves back', async () => {
		const user = userEvent.setup();
		const props = reactive<{ label: string; length: number; value?: string | undefined }>({ label: 'Code', length: 3, value: '12' });
		render(PinInput, { props });
		await user.click(boxes()[1]);
		await user.keyboard('{Backspace}');
		expect(props.value).toBe('1');
		expect(document.activeElement).toBe(boxes()[1]);
		await user.keyboard('{Backspace}');
		expect(props.value).toBe('');
		await vi.waitFor(() => expect(document.activeElement).toBe(boxes()[0]));
		// First box, empty: nothing happens.
		await user.keyboard('{Backspace}');
		expect(props.value).toBe('');
		expect(document.activeElement).toBe(boxes()[0]);
	});

	it('Delete clears the focused box only when it holds a character', async () => {
		const user = userEvent.setup();
		const onchange = vi.fn();
		render(PinInput, { label: 'Code', length: 3, value: '12', onchange });
		await user.click(boxes()[2]);
		await user.keyboard('{Delete}');
		expect(onchange).not.toHaveBeenCalled();
		await user.click(boxes()[0]);
		await user.keyboard('{Delete}');
		expect(onchange).toHaveBeenCalledWith('2');
	});

	it('arrow keys, Home and End move between the boxes and stop at the ends', async () => {
		const user = userEvent.setup();
		render(PinInput, { label: 'Code', length: 3 });
		await user.click(boxes()[0]);
		await user.keyboard('{ArrowLeft}');
		await flush();
		expect(document.activeElement).toBe(boxes()[0]);
		await user.keyboard('{ArrowRight}');
		await vi.waitFor(() => expect(document.activeElement).toBe(boxes()[1]));
		await user.keyboard('{End}');
		await vi.waitFor(() => expect(document.activeElement).toBe(boxes()[2]));
		await user.keyboard('{ArrowRight}');
		await flush();
		expect(document.activeElement).toBe(boxes()[2]);
		await user.keyboard('{ArrowLeft}');
		await vi.waitFor(() => expect(document.activeElement).toBe(boxes()[1]));
		await user.keyboard('{Home}');
		await vi.waitFor(() => expect(document.activeElement).toBe(boxes()[0]));
	});

	it('pasting a full code fills every box from the start, a piece fills from the focused box', async () => {
		const user = userEvent.setup();
		const oncomplete = vi.fn();
		const props = reactive<{ label: string; length: number; value?: string | undefined; oncomplete: typeof oncomplete }>({
			label: 'Code',
			length: 4,
			value: undefined,
			oncomplete
		});
		render(PinInput, { props });
		await user.click(boxes()[2]);
		await user.paste('9');
		expect(values()).toEqual(['', '', '9', '']);
		await user.click(boxes()[1]);
		await user.paste('12-34');
		expect(props.value).toBe('1234');
		expect(oncomplete).toHaveBeenCalledWith('1234');
		await user.paste('--');
		expect(props.value).toBe('1234');
	});

	it('a paste event without clipboard data is ignored', () => {
		const onchange = vi.fn();
		render(PinInput, { label: 'Code', length: 3, onchange });
		const event = new Event('paste', { bubbles: true, cancelable: true });
		boxes()[0].dispatchEvent(event);
		expect(event.defaultPrevented).toBe(true);
		expect(onchange).not.toHaveBeenCalled();
	});

	it('follows the bound value from outside and drops characters that do not fit', async () => {
		const props = reactive<{ label: string; length: number; value?: string | undefined; type?: 'numeric' | 'alphanumeric' }>({
			label: 'Code',
			length: 3,
			value: '1a2'
		});
		render(PinInput, { props });
		expect(values()).toEqual(['1', '2', '']);
		props.value = '98765';
		await vi.waitFor(() => expect(values()).toEqual(['9', '8', '7']));
		props.length = 4;
		await vi.waitFor(() => expect(boxes()).toHaveLength(4));
		expect(values()).toEqual(['9', '8', '7', '6']);
		props.value = undefined;
		await vi.waitFor(() => expect(values()).toEqual(['', '', '', '']));
		props.type = 'alphanumeric';
		props.value = 'ab12';
		await vi.waitFor(() => expect(values()).toEqual(['a', 'b', '1', '2']));
		// Switching the type alone does not rewrite boxes that already match the bound value.
		props.type = 'numeric';
		await flush();
		expect(values()).toEqual(['a', 'b', '1', '2']);
		props.value = 'ab34';
		await vi.waitFor(() => expect(values()).toEqual(['3', '4', '', '']));
	});

	it('accepts full-width digits', async () => {
		const user = userEvent.setup();
		const props = reactive<{ label: string; length: number; value?: string | undefined }>({ label: 'Code', length: 3, value: undefined });
		render(PinInput, { props });
		await user.click(boxes()[0]);
		await user.paste('１２３');
		expect(props.value).toBe('123');
	});

	it('alphanumeric takes letters and uses the text keyboard; mask hides the characters', async () => {
		const user = userEvent.setup();
		const onchange = vi.fn();
		render(PinInput, { label: 'Code', length: 2, type: 'alphanumeric', mask: true, onchange });
		const inputs = Array.from(document.querySelectorAll<HTMLInputElement>('input.box'));
		expect(inputs[0].type).toBe('password');
		expect(inputs[0].getAttribute('inputmode')).toBe('text');
		await user.click(inputs[0]);
		await user.keyboard('Z');
		expect(onchange).toHaveBeenCalledWith('Z');
		expect(await fireEvent.keyDown(inputs[1], { key: '-' })).toBe(false);
	});

	it('clamps the length to 1-32 and falls back to 6 when it is not a number', async () => {
		const props = reactive<{ label: string; length: number }>({ label: 'Code', length: 0 });
		render(PinInput, { props });
		expect(boxes()).toHaveLength(1);
		props.length = 99;
		await vi.waitFor(() => expect(boxes()).toHaveLength(32));
		props.length = Number.NaN;
		await vi.waitFor(() => expect(boxes()).toHaveLength(6));
		props.length = 2.7;
		await vi.waitFor(() => expect(boxes()).toHaveLength(2));
	});

	it('carries the value in a hidden form input', () => {
		const { unmount } = render(PinInput, { label: 'Code', length: 3, name: 'otp', value: '12' });
		const hidden = document.querySelector<HTMLInputElement>('input[type="hidden"]');
		expect(hidden?.name).toBe('otp');
		expect(hidden?.value).toBe('12');
		unmount();
		render(PinInput, { label: 'Code', length: 3, name: 'otp' });
		expect(document.querySelector<HTMLInputElement>('input[type="hidden"]')?.value).toBe('');
	});

	it('required marks the empty boxes, disabled disables them, an error invalidates them', () => {
		render(PinInput, { label: 'Code', length: 3, value: '1', required: true, disabled: true, error: 'Wrong code', hint: 'From the SMS' });
		const all = boxes();
		expect(all[0].required).toBe(false);
		expect(all[1].required).toBe(true);
		expect(all.every((b) => b.disabled)).toBe(true);
		expect(all[0].getAttribute('aria-invalid')).toBe('true');
		const group = screen.getByRole('group', { name: /Code/ });
		expect(group.getAttribute('aria-describedby')).toBe(screen.getByRole('alert').id);
		expect(document.querySelector('.req')).not.toBeNull();
	});

	it('uses the given id, class and box label template', () => {
		render(PinInput, { label: 'Code', length: 2, id: 'otp', class: 'mine', digitLabel: 'Box {index}/{length}' });
		expect(boxes()[0].id).toBe('otp-0');
		expect(boxes()[1].getAttribute('aria-label')).toBe('Box 2/2');
		expect(document.getElementById('otp-label')).not.toBeNull();
		expect(document.querySelector('.mine')).not.toBeNull();
	});

	it('a box selects its content when focused', async () => {
		render(PinInput, { label: 'Code', length: 2, value: '12' });
		const first = boxes()[0];
		const select = vi.spyOn(first, 'select');
		first.focus();
		expect(select).toHaveBeenCalled();
	});

	it('typing the same character again reports nothing new', async () => {
		const onchange = vi.fn();
		render(PinInput, { label: 'Code', length: 2, value: '1' });
		render(PinInput, { label: 'Other', length: 2, value: '1', onchange });
		const box = screen.getAllByRole('textbox')[2] as HTMLInputElement;
		box.value = '1';
		fireEvent.input(box);
		expect(onchange).not.toHaveBeenCalled();
	});
});
