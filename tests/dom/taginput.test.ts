/**
 * TagInput: field wiring and instructions, `bind:value` and `onchange`, adding (Enter, comma, blur, paste with
 * separators, suggestions), duplicates (case-insensitive unless `caseSensitive`), `max`, removing (button,
 * Backspace, Delete) with the focus moved to a sensible place, the arrow-key model between tags and the field,
 * the suggestion listbox (filter, arrows, Enter, Escape, pointer), announcements, hidden form inputs, `disabled`
 * and the default strings.
 */
import { fireEvent, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import TagInput from '../../src/lib/components/TagInput.svelte';
import { strings } from '../../src/lib/components/strings.svelte.js';
import { flush } from './helpers.js';
import { reactive } from './reactive.svelte.js';

interface State {
	label?: string | undefined;
	value?: string[] | undefined;
	max?: number | undefined;
	suggestions?: string[] | undefined;
	caseSensitive?: boolean | undefined;
	addOnBlur?: boolean | undefined;
	disabled?: boolean | undefined;
	onchange?: ((value: string[]) => void) | undefined;
}

function setup(state: Partial<State> = {}) {
	const user = userEvent.setup();
	const onchange = vi.fn<(value: string[]) => void>();
	const props = reactive<State>({ label: 'Tags', value: [], onchange, ...state });
	const view = render(TagInput, { props });
	const input = screen.getByLabelText<HTMLInputElement>('Tags', { selector: 'input' });
	const status = (): string => screen.getByRole('status').textContent.trim();
	const removers = (): HTMLButtonElement[] => screen.queryAllByRole<HTMLButtonElement>('button');
	const options = (): string[] => screen.queryAllByRole('option', { hidden: true }).map((o) => o.textContent);
	const active = (): string | undefined => {
		const activeId = input.getAttribute('aria-activedescendant');
		return activeId ? document.getElementById(activeId)?.textContent : undefined;
	};
	return { user, props, onchange, input, status, removers, options, active, ...view };
}

/** A paste event with clipboard text (jsdom has no ClipboardEvent data). */
function paste(target: HTMLElement, text: string | null): Event {
	const event = new Event('paste', { bubbles: true, cancelable: true });
	Object.defineProperty(event, 'clipboardData', { value: text === null ? null : { getData: () => text } });
	target.dispatchEvent(event);
	return event;
}

afterEach(() => {
	vi.restoreAllMocks();
});

describe('TagInput', () => {
	it('renders a labelled text field with the default instructions and no list or combobox role', () => {
		const { input, container } = setup();
		expect(input.getAttribute('role')).toBeNull();
		expect(input.hasAttribute('aria-expanded')).toBe(false);
		const help = document.getElementById(input.getAttribute('aria-describedby') ?? '');
		expect(help?.textContent).toBe(strings().tagInput.instructions);
		expect(screen.queryByRole('list')).toBeNull();
		expect(container.querySelector('input[type="hidden"]')).toBeNull();
		expect(input.required).toBe(false);
	});

	it('shows the tags as a named list with remove buttons and hidden inputs for the form', () => {
		const { container } = render(TagInput, {
			label: 'Tags',
			value: ['red', 'blue'],
			name: 'tag',
			listLabel: 'Chosen tags',
			id: 'tags',
			hint: 'Colours',
			placeholder: 'Add…',
			class: 'mine'
		});
		const list = screen.getByRole('list', { name: 'Chosen tags' });
		expect(list.querySelectorAll('li')).toHaveLength(2);
		expect(screen.getByRole('button', { name: 'Remove red' })).toBeTruthy();
		expect(Array.from(container.querySelectorAll<HTMLInputElement>('input[type="hidden"]')).map((i) => [i.name, i.value])).toEqual([
			['tag', 'red'],
			['tag', 'blue']
		]);
		const input = screen.getByLabelText<HTMLInputElement>('Tags', { selector: 'input' });
		expect(input.id).toBe('tags');
		expect(input.placeholder).toBe('Add…');
		expect(input.getAttribute('aria-describedby')?.split(' ')).toHaveLength(2);
		expect(container.querySelector('.mine')).not.toBeNull();
	});

	it('names the tag list after the label by default and treats a non-array value as empty', () => {
		render(TagInput, { label: 'Tags', value: ['a'] });
		expect(screen.getByRole('list', { name: 'Tags' })).toBeTruthy();
		const view = render(TagInput, { label: 'Other', value: 'oops' as unknown as string[] });
		expect(view.container.querySelector('.list')).toBeNull();
	});

	it('Enter and comma add the trimmed text, update the binding, call onchange and announce', async () => {
		const { user, input, props, onchange, status } = setup();
		await user.type(input, '  red {Enter}');
		expect(props.value).toEqual(['red']);
		expect(onchange).toHaveBeenLastCalledWith(['red']);
		expect(input.value).toBe('');
		expect(status()).toBe('Added red');
		await user.type(input, 'blue,');
		expect(props.value).toEqual(['red', 'blue']);
		// Comma on an empty field and Enter on whitespace add nothing.
		await user.type(input, ',');
		await user.type(input, '   {Enter}');
		expect(onchange).toHaveBeenCalledTimes(2);
	});

	it('Enter on an empty field is left to the form', async () => {
		const { input } = setup();
		expect(await fireEvent.keyDown(input, { key: 'Enter' })).toBe(true);
	});

	it('rejects duplicates ignoring case and keeps the text', async () => {
		const { user, input, props, status } = setup({ value: ['Gel'] });
		await user.type(input, 'gel{Enter}');
		expect(props.value).toEqual(['Gel']);
		expect(input.value).toBe('gel');
		expect(status()).toBe('gel is already added');
	});

	it('caseSensitive allows tags that differ only in case', async () => {
		const { user, input, props } = setup({ value: ['Gel'], caseSensitive: true });
		await user.type(input, 'gel{Enter}');
		expect(props.value).toEqual(['Gel', 'gel']);
	});

	it('max stops adding, announces the limit and hides the placeholder once full', async () => {
		const user = userEvent.setup();
		const props = reactive<{ label: string; value: string[]; max: number; placeholder: string }>({
			label: 'Tags',
			value: ['a'],
			max: 2.7,
			placeholder: 'Add'
		});
		render(TagInput, { props });
		const input = screen.getByLabelText<HTMLInputElement>('Tags', { selector: 'input' });
		expect(input.placeholder).toBe('Add');
		await user.type(input, 'b{Enter}');
		expect(props.value).toEqual(['a', 'b']);
		expect(input.hasAttribute('placeholder')).toBe(false);
		await user.type(input, 'c{Enter}');
		expect(props.value).toEqual(['a', 'b']);
		expect(screen.getByRole('status').textContent.trim()).toBe('At most 2 tags');
	});

	it('a max of 0 means no limit', async () => {
		const { user, input, props } = setup({ value: ['a', 'b', 'c'], max: 0 });
		await user.type(input, 'd{Enter}');
		expect(props.value).toEqual(['a', 'b', 'c', 'd']);
	});

	it('custom texts are filled in', async () => {
		const user = userEvent.setup();
		render(TagInput, {
			label: 'Tags',
			value: ['x'],
			max: 2,
			removeLabel: 'Drop {tag}',
			instructions: 'Type and press Enter',
			addedText: '+{tag}',
			removedText: '-{tag}',
			duplicateText: 'dup {tag}',
			maxText: 'max {max}'
		});
		const input = screen.getByLabelText<HTMLInputElement>('Tags', { selector: 'input' });
		expect(screen.getByText('Type and press Enter')).toBeTruthy();
		const status = (): string => screen.getByRole('status').textContent.trim();
		await user.type(input, 'x{Enter}');
		expect(status()).toBe('dup x');
		await user.clear(input);
		await user.type(input, 'y{Enter}');
		expect(status()).toBe('+y');
		await user.type(input, 'z{Enter}');
		expect(status()).toBe('max 2');
		await user.click(screen.getByRole('button', { name: 'Drop x' }));
		expect(status()).toBe('-x');
	});

	it('the remove button removes its tag and focuses the next one, or the field after the last', async () => {
		const { user, props, removers, onchange, input, status } = setup({ value: ['a', 'b'] });
		await user.click(removers()[0]);
		expect(props.value).toEqual(['b']);
		expect(onchange).toHaveBeenLastCalledWith(['b']);
		expect(status()).toBe('Removed a');
		await vi.waitFor(() => expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Remove b' })));
		await user.click(removers()[0]);
		expect(props.value).toEqual([]);
		await vi.waitFor(() => expect(document.activeElement).toBe(input));
		expect(screen.queryByRole('list')).toBeNull();
	});

	it('Backspace in the empty field removes the last tag and keeps the focus there', async () => {
		const { user, input, props } = setup({ value: ['a', 'b'] });
		await user.click(input);
		await user.keyboard('{Backspace}');
		expect(props.value).toEqual(['a']);
		expect(document.activeElement).toBe(input);
		// With text, or with the caret not at the start, Backspace edits the text.
		await user.type(input, 'xy');
		await user.keyboard('{Backspace}');
		expect(input.value).toBe('x');
		expect(props.value).toEqual(['a']);
		await user.clear(input);
		input.setSelectionRange(0, 0);
		await user.keyboard('{Backspace}');
		expect(props.value).toEqual([]);
		await user.keyboard('{Backspace}');
		expect(props.value).toEqual([]);
	});

	it('Backspace with the caret elsewhere does not remove a tag', async () => {
		const { input, props } = setup({ value: ['a'] });
		vi.spyOn(input, 'selectionStart', 'get').mockReturnValue(1);
		await fireEvent.keyDown(input, { key: 'Backspace' });
		expect(props.value).toEqual(['a']);
		vi.spyOn(input, 'selectionStart', 'get').mockReturnValue(0);
		vi.spyOn(input, 'selectionEnd', 'get').mockReturnValue(1);
		await fireEvent.keyDown(input, { key: 'Backspace' });
		expect(props.value).toEqual(['a']);
	});

	it('ArrowLeft at the start of the field moves to the last tag; arrows move between tags and back', async () => {
		const { user, input, removers } = setup({ value: ['a', 'b', 'c'] });
		await user.click(input);
		await user.keyboard('{ArrowLeft}');
		expect(document.activeElement).toBe(removers()[2]);
		await user.keyboard('{ArrowLeft}{ArrowLeft}');
		expect(document.activeElement).toBe(removers()[0]);
		await user.keyboard('{ArrowLeft}');
		expect(document.activeElement).toBe(removers()[0]);
		await user.keyboard('{ArrowRight}');
		expect(document.activeElement).toBe(removers()[1]);
		await user.keyboard('{End}');
		expect(document.activeElement).toBe(input);
		await user.keyboard('{ArrowLeft}{Home}');
		expect(document.activeElement).toBe(removers()[0]);
		await user.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}');
		expect(document.activeElement).toBe(input);
		removers()[1].focus();
		await user.keyboard('x');
		expect(document.activeElement).toBe(removers()[1]);
	});

	it('ArrowLeft with text or without tags stays in the field', async () => {
		const { user, input } = setup();
		await user.click(input);
		await user.keyboard('{ArrowLeft}');
		expect(document.activeElement).toBe(input);
	});

	it('ArrowLeft with the caret after text moves the caret, not the focus', async () => {
		const user = userEvent.setup();
		render(TagInput, { label: 'Labels', value: ['a'] });
		const input = screen.getByLabelText<HTMLInputElement>('Labels', { selector: 'input' });
		await user.type(input, 'xy');
		await user.keyboard('{ArrowLeft}');
		expect(document.activeElement).toBe(input);
		vi.spyOn(input, 'selectionStart', 'get').mockReturnValue(0);
		vi.spyOn(input, 'selectionEnd', 'get').mockReturnValue(2);
		await fireEvent.keyDown(input, { key: 'ArrowLeft' });
		expect(document.activeElement).toBe(input);
	});

	it('Backspace on a tag removes it and focuses the one before (or the first), Delete the one after', async () => {
		const { user, props, removers, input } = setup({ value: ['a', 'b', 'c', 'd'] });
		removers()[2].focus();
		await user.keyboard('{Backspace}');
		expect(props.value).toEqual(['a', 'b', 'd']);
		await vi.waitFor(() => expect(document.activeElement).toBe(removers()[1]));
		removers()[0].focus();
		await user.keyboard('{Backspace}');
		expect(props.value).toEqual(['b', 'd']);
		await vi.waitFor(() => expect(document.activeElement).toBe(removers()[0]));
		await user.keyboard('{Delete}');
		expect(props.value).toEqual(['d']);
		await vi.waitFor(() => expect(document.activeElement).toBe(removers()[0]));
		await user.keyboard('{Backspace}');
		expect(props.value).toEqual([]);
		await vi.waitFor(() => expect(document.activeElement).toBe(input));
	});

	it('Escape clears the text; with an empty field it is left to the page', async () => {
		const { user, input } = setup();
		await user.type(input, 'abc');
		await user.keyboard('{Escape}');
		expect(input.value).toBe('');
		expect(await fireEvent.keyDown(input, { key: 'Escape' })).toBe(true);
	});

	it('blur turns leftover text into a tag unless addOnBlur is false', async () => {
		const { user, input, props } = setup();
		await user.type(input, 'left');
		input.blur();
		expect(props.value).toEqual(['left']);
		render(TagInput, { label: 'Kept', value: [], addOnBlur: false });
		const kept = screen.getByLabelText<HTMLInputElement>('Kept', { selector: 'input' });
		await user.type(kept, 'stay');
		kept.blur();
		expect(kept.value).toBe('stay');
		expect(screen.queryByRole('button', { name: 'Remove stay' })).toBeNull();
	});

	it('paste with separators adds every part and keeps the rejected ones as text', async () => {
		const { input, props, status } = setup({ value: ['b'] });
		input.focus();
		const event = paste(input, 'a, b;c\nd\t,');
		expect(event.defaultPrevented).toBe(true);
		expect(props.value).toEqual(['b', 'a', 'c', 'd']);
		await vi.waitFor(() => expect(status()).toBe('Added a. b is already added. Added c. Added d'));
		expect(input.value).toBe('');
	});

	it('paste around a selection joins the text, and a limit keeps what did not fit', async () => {
		const { user, input, props } = setup({ value: [], max: 2 });
		await user.type(input, 'xz');
		input.setSelectionRange(1, 1);
		paste(input, 'y,q,w');
		expect(props.value).toEqual(['xy', 'q']);
		await vi.waitFor(() => expect(input.value).toBe('wz'));
	});

	it('paste of separators only adds and announces nothing', async () => {
		const { input, props, onchange, status } = setup();
		expect(paste(input, ' , ;\n').defaultPrevented).toBe(true);
		await flush();
		expect(props.value).toEqual([]);
		expect(onchange).not.toHaveBeenCalled();
		expect(status()).toBe('');
	});

	it('paste without separators is a normal paste; missing clipboard data too', async () => {
		const { input, props } = setup();
		expect(paste(input, 'plain').defaultPrevented).toBe(false);
		expect(paste(input, null).defaultPrevented).toBe(false);
		expect(props.value).toEqual([]);
	});

	it('paste uses the end of the text when the field reports no selection', async () => {
		const { user, input, props } = setup();
		await user.type(input, 'ab');
		vi.spyOn(input, 'selectionStart', 'get').mockReturnValue(null);
		vi.spyOn(input, 'selectionEnd', 'get').mockReturnValue(null);
		paste(input, 'c,d');
		expect(props.value).toEqual(['abc', 'd']);
	});

	it('clicking the empty area of the field focuses the input, a tag does not', async () => {
		const { user, container, input, removers } = setup({ value: ['a'] });
		const box = container.querySelector<HTMLElement>('.k-tags') as HTMLElement;
		await user.click(box);
		expect(document.activeElement).toBe(input);
		input.blur();
		await user.click(container.querySelector('.list') as HTMLElement);
		expect(document.activeElement).toBe(input);
		input.blur();
		await user.click(container.querySelector('.txt') as HTMLElement);
		expect(document.activeElement).not.toBe(input);
		expect(removers()).toHaveLength(1);
	});

	it('disabled: no typing and no removing', async () => {
		const user = userEvent.setup();
		const onchange = vi.fn();
		render(TagInput, { label: 'Tags', value: ['a'], disabled: true, onchange, suggestions: ['x'] });
		const input = screen.getByLabelText<HTMLInputElement>('Tags', { selector: 'input' });
		expect(input.disabled).toBe(true);
		const remove = screen.getByRole<HTMLButtonElement>('button', { name: 'Remove a' });
		expect(remove.disabled).toBe(true);
		await fireEvent.keyDown(input, { key: 'Backspace' });
		await fireEvent.keyDown(input, { key: 'ArrowDown' });
		await fireEvent.keyDown(remove, { key: 'Delete' });
		await user.click(remove);
		expect(onchange).not.toHaveBeenCalled();
		expect(input.getAttribute('aria-expanded')).toBe('false');
	});

	it('required asks for a tag only while there is none', async () => {
		const props = reactive<{ label: string; value: string[]; required: boolean }>({ label: 'Tags', value: [], required: true });
		render(TagInput, { props });
		const input = screen.getByLabelText<HTMLInputElement>(/Tags/, { selector: 'input' });
		expect(input.required).toBe(true);
		props.value = ['a'];
		await vi.waitFor(() => expect(input.required).toBe(false));
	});

	it('the error marks the field invalid and is described', () => {
		render(TagInput, { label: 'Tags', error: 'Need one' });
		const input = screen.getByLabelText<HTMLInputElement>('Tags', { selector: 'input' });
		expect(input.getAttribute('aria-invalid')).toBe('true');
		expect(input.getAttribute('aria-describedby')).toContain(screen.getByRole('alert').id);
	});

	describe('suggestions', () => {
		const SUGGESTIONS = ['Rot', 'Grün', 'Blau', 'Rot', 'Gelb'];

		it('turns the field into a combobox that filters unique suggestions while typing, ignoring diacritics', async () => {
			const { user, input, options } = setup({ suggestions: SUGGESTIONS, value: ['Blau'] });
			expect(input.getAttribute('role')).toBe('combobox');
			expect(input.getAttribute('aria-autocomplete')).toBe('list');
			expect(input.getAttribute('aria-expanded')).toBe('false');
			expect(input.getAttribute('aria-controls')).toBe(screen.getByRole('listbox', { hidden: true }).id);
			await user.type(input, 'g');
			expect(input.getAttribute('aria-expanded')).toBe('true');
			expect(options()).toEqual(['Grün', 'Gelb']);
			await user.clear(input);
			await user.type(input, 'grun');
			expect(options()).toEqual(['Grün']);
			await user.clear(input);
			await user.type(input, 'zz');
			expect(input.getAttribute('aria-expanded')).toBe('false');
			expect(options()).toEqual([]);
		});

		it('ArrowDown opens on the first, ArrowUp on the last; arrows wrap; Enter adds the active one', async () => {
			const { user, input, active, props } = setup({ suggestions: SUGGESTIONS });
			input.focus();
			await user.keyboard('{ArrowDown}');
			expect(active()).toBe('Rot');
			await user.keyboard('{ArrowUp}');
			expect(active()).toBe('Gelb');
			await user.keyboard('{ArrowDown}{ArrowDown}');
			expect(active()).toBe('Grün');
			await user.keyboard('{Escape}{ArrowUp}');
			expect(active()).toBe('Gelb');
			await user.keyboard('{Enter}');
			expect(props.value).toEqual(['Gelb']);
			expect(input.getAttribute('aria-expanded')).toBe('false');
			expect(document.activeElement).toBe(input);
		});

		it('Alt+ArrowDown opens without an active option; arrows then start at either end', async () => {
			const { user, input, active } = setup({ suggestions: SUGGESTIONS });
			input.focus();
			await user.keyboard('{Alt>}{ArrowDown}{/Alt}');
			expect(input.getAttribute('aria-expanded')).toBe('true');
			expect(active()).toBeUndefined();
			await user.keyboard('{ArrowUp}');
			expect(active()).toBe('Gelb');
			await user.type(input, 'r');
			expect(active()).toBeUndefined();
			await user.keyboard('{ArrowDown}');
			expect(active()).toBe('Rot');
		});

		it('Enter without an active option adds the typed text; ArrowLeft stays in the open list', async () => {
			const { user, input, props } = setup({ suggestions: SUGGESTIONS, value: ['a'] });
			await user.type(input, 'Ro');
			await user.keyboard('{ArrowLeft}');
			expect(document.activeElement).toBe(input);
			await user.keyboard('{Enter}');
			expect(props.value).toEqual(['a', 'Ro']);
		});

		it('Escape closes the open list without leaving the page a key, then clears the text', async () => {
			const seen: boolean[] = [];
			const listener = (e: KeyboardEvent): void => {
				if (e.key === 'Escape') seen.push(e.defaultPrevented);
			};
			document.addEventListener('keydown', listener);
			const { user, input } = setup({ suggestions: SUGGESTIONS });
			await user.type(input, 'r');
			await user.keyboard('{Escape}');
			expect(input.getAttribute('aria-expanded')).toBe('false');
			expect(seen).toEqual([]);
			await user.keyboard('{Escape}');
			expect(input.value).toBe('');
			expect(seen).toEqual([true]);
			document.removeEventListener('keydown', listener);
		});

		it('a suggestion that is a duplicate in another case is filtered, choosing a rejected one keeps the text', async () => {
			const { user, input, options, props } = setup({ suggestions: ['rot', 'blau'], value: ['ROT'], max: 1 });
			input.focus();
			await user.keyboard('{ArrowDown}');
			expect(options()).toEqual(['blau']);
			await user.type(input, 'b');
			await user.keyboard('{ArrowDown}{Enter}');
			expect(props.value).toEqual(['ROT']);
			expect(input.value).toBe('b');
		});

		it('the pointer highlights and a click adds a suggestion; focus stays in the field', async () => {
			const { user, input, active, props } = setup({ suggestions: SUGGESTIONS });
			input.focus();
			await user.keyboard('{Alt>}{ArrowDown}{/Alt}');
			const [rot, gruen] = screen.getAllByRole('option');
			await user.pointer({ target: gruen });
			expect(active()).toBe('Grün');
			const listbox = screen.getByRole('listbox');
			await fireEvent.pointerMove(listbox);
			expect(active()).toBe('Grün');
			expect(await fireEvent.mouseDown(rot)).toBe(false);
			await user.click(listbox);
			expect(props.value).toEqual([]);
			await user.click(rot);
			expect(props.value).toEqual(['Rot']);
			expect(document.activeElement).toBe(input);
		});

		it('scrolls the active option into view', async () => {
			const scroll = vi.spyOn(Element.prototype, 'scrollIntoView');
			const { user, input } = setup({ suggestions: SUGGESTIONS });
			input.focus();
			await user.keyboard('{ArrowDown}');
			await vi.waitFor(() => expect(scroll).toHaveBeenCalledWith({ block: 'nearest' }));
		});

		it('blur closes the list without adding when there is no text', async () => {
			const { user, input, props } = setup({ suggestions: SUGGESTIONS });
			input.focus();
			await user.keyboard('{ArrowDown}');
			input.blur();
			await vi.waitFor(() => expect(input.getAttribute('aria-expanded')).toBe('false'));
			expect(props.value).toEqual([]);
		});

		it('closes the list when the suggestions go away', async () => {
			const { user, input, props } = setup({ suggestions: SUGGESTIONS });
			input.focus();
			await user.keyboard('{ArrowDown}');
			expect(input.getAttribute('aria-expanded')).toBe('true');
			props.suggestions = [];
			await vi.waitFor(() => expect(input.getAttribute('role')).toBeNull());
			expect(input.hasAttribute('aria-activedescendant')).toBe(false);
		});

		it('without suggestions the arrow keys are left alone', async () => {
			const { input } = setup();
			expect(await fireEvent.keyDown(input, { key: 'ArrowDown' })).toBe(true);
			expect(await fireEvent.keyDown(input, { key: 'ArrowUp' })).toBe(true);
			await flush();
			expect(screen.queryByRole('listbox', { hidden: true })).toBeNull();
		});
	});

	it('renders no class for a null class from an untyped consumer', () => {
		const { container } = render(TagInput, { label: 'Tags', class: null as unknown as string });
		expect(container.innerHTML).not.toContain('null');
	});
});
