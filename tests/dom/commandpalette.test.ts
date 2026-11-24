/**
 * CommandPalette: the modal search dialog with a combobox over a grouped listbox. Covers opening through
 * `open` and the global hotkey, ranking and filtering (prefix, word start, substring, keywords, several
 * terms, accents), groups, the active option (arrow keys, Ctrl+Home/End, PageUp/PageDown, pointer),
 * running a command (Enter, click) with its callbacks, closing (button, backdrop, prop) and the texts.
 */
import { fireEvent } from '@testing-library/dom';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import CommandPalette, { type Command } from '../../src/lib/components/CommandPalette.svelte';
import { flush } from './helpers.js';
import { reactive } from './reactive.svelte.js';

afterEach(() => {
	vi.restoreAllMocks();
});

function commands(): Command[] {
	return [
		{ id: 'save', label: 'Save file', group: 'File', shortcut: 'Ctrl+S' },
		{ id: 'open', label: 'Open file', group: 'File', keywords: ['load'] },
		{ id: 'theme', label: 'Toggle theme', group: 'View', keywords: ['dark mode'] },
		{ id: 'cafe', label: 'Café menu' },
		{ id: 'reload', label: 'Reload window', group: 'View' }
	];
}

function dialog(): HTMLDialogElement {
	const el = document.querySelector('dialog');
	if (el === null) throw new Error('no dialog');
	return el;
}
function search(): HTMLInputElement {
	return screen.getByRole<HTMLInputElement>('combobox');
}
function labels(): string[] {
	return screen.getAllByRole('option').map((o) => o.querySelector('span')?.textContent ?? '');
}
function activeLabel(): string | undefined {
	const id = search().getAttribute('aria-activedescendant');
	return id ? (document.getElementById(id)?.querySelector('span')?.textContent ?? undefined) : undefined;
}

describe('CommandPalette', () => {
	it('stays closed until open, then opens modally with the focus in the search field', async () => {
		const props = reactive<{ open: boolean | undefined; commands: Command[] }>({ open: undefined, commands: commands() });
		render(CommandPalette, { props });
		expect(dialog().hasAttribute('open')).toBe(false);
		props.open = true;
		await vi.waitFor(() => expect(dialog().hasAttribute('open')).toBe(true));
		expect(document.activeElement).toBe(search());
		expect(dialog().getAttribute('aria-label')).toBe('Command palette');
		expect(search().getAttribute('aria-label')).toBe('Command palette');
		expect(search().placeholder).toBe('Type a command or search…');
		expect(screen.getByRole('button', { name: 'Close' })).toBeTruthy();
		expect(search().getAttribute('aria-controls')).toBe(screen.getByRole('listbox', { hidden: true }).id);
	});

	it('uses the given texts', async () => {
		const user = userEvent.setup();
		render(CommandPalette, {
			open: true,
			commands: commands(),
			label: 'Actions',
			placeholder: 'Search actions',
			empty: 'Nothing found',
			closeLabel: 'Dismiss'
		});
		expect(dialog().getAttribute('aria-label')).toBe('Actions');
		expect(search().placeholder).toBe('Search actions');
		expect(screen.getByRole('button', { name: 'Dismiss' })).toBeTruthy();
		await user.type(search(), 'zzz');
		expect(document.querySelector('.empty')?.textContent).toBe('Nothing found');
		expect(screen.getByRole('status').textContent).toBe('Nothing found');
	});

	it('lists every command in groups, named by their heading, with shortcuts', () => {
		render(CommandPalette, { open: true, commands: commands() });
		expect(labels()).toEqual(['Save file', 'Open file', 'Toggle theme', 'Reload window', 'Café menu']);
		const groups = screen.getAllByRole('group');
		expect(groups).toHaveLength(3);
		expect(groups[0].getAttribute('aria-labelledby')).toBeTruthy();
		expect(document.getElementById(groups[0].getAttribute('aria-labelledby') ?? '')?.textContent).toBe('File');
		expect(groups[2].hasAttribute('aria-labelledby')).toBe(false);
		expect(document.querySelector('kbd')?.textContent).toBe('Ctrl+S');
		expect(activeLabel()).toBe('Save file');
		expect(screen.getAllByRole('option')[0].getAttribute('aria-selected')).toBe('true');
		expect(document.querySelector('.empty')).toBeNull();
		expect(screen.getByRole('status').textContent).toBe('');
	});

	it('ranks prefixes over word starts over substrings, a keyword one step below the same hit on the label', async () => {
		const user = userEvent.setup();
		const list: Command[] = [
			{ id: 'a', label: 'Unfiled' },
			{ id: 'b', label: 'My file' },
			{ id: 'c', label: 'Files' },
			{ id: 'd', label: 'Other', keywords: ['file'] },
			{ id: 'e', label: 'Nothing' }
		];
		render(CommandPalette, { open: true, commands: list });
		await user.type(search(), 'fil');
		expect(labels()).toEqual(['Files', 'Other', 'My file', 'Unfiled']);
	});

	it('matches keywords and ignores case and accents', async () => {
		const user = userEvent.setup();
		render(CommandPalette, { open: true, commands: commands() });
		await user.type(search(), 'DARK');
		expect(labels()).toEqual(['Toggle theme']);
		await user.clear(search());
		await user.type(search(), 'cafe');
		expect(labels()).toEqual(['Café menu']);
	});

	it('needs every term to match and ranks the whole phrase on the label first', async () => {
		const user = userEvent.setup();
		render(CommandPalette, { open: true, commands: commands() });
		await user.type(search(), 'file sa');
		expect(labels()).toEqual(['Save file']);
		await user.clear(search());
		await user.type(search(), 'file open');
		expect(labels()).toEqual(['Open file']);
		await user.clear(search());
		await user.type(search(), 'file');
		expect(labels()).toEqual(['Save file', 'Open file']);
		await user.clear(search());
		await user.type(search(), '   ');
		expect(labels()).toHaveLength(5);
	});

	it('shows and announces the empty text when nothing matches', async () => {
		const user = userEvent.setup();
		render(CommandPalette, { open: true, commands: commands() });
		await user.type(search(), 'xyz');
		expect(screen.queryAllByRole('option')).toHaveLength(0);
		expect(document.querySelector('.list')?.classList.contains('none')).toBe(true);
		expect(document.querySelector('.empty')?.textContent).toBe('No matching commands');
		expect(document.querySelector('.empty')?.getAttribute('aria-hidden')).toBe('true');
		expect(screen.getByRole('status').textContent).toBe('No matching commands');
		expect(search().hasAttribute('aria-activedescendant')).toBe(false);
	});

	it('shows the empty text but announces nothing without a query', () => {
		render(CommandPalette, { open: true, commands: [] });
		expect(document.querySelector('.empty')).not.toBeNull();
		expect(screen.getByRole('status').textContent).toBe('');
	});

	it('moves the active option with the arrow keys, wrapping at both ends, and scrolls it into view', async () => {
		const user = userEvent.setup();
		const scroll = vi.spyOn(Element.prototype, 'scrollIntoView');
		render(CommandPalette, { open: true, commands: commands() });
		await user.keyboard('{ArrowDown}');
		expect(activeLabel()).toBe('Open file');
		expect(scroll).toHaveBeenCalledWith({ block: 'nearest' });
		await user.keyboard('{ArrowUp}{ArrowUp}');
		expect(activeLabel()).toBe('Café menu');
		await user.keyboard('{ArrowDown}');
		expect(activeLabel()).toBe('Save file');
	});

	it('jumps with Ctrl+Home/End and PageUp/PageDown, plain Home/End stay in the field', async () => {
		const user = userEvent.setup();
		const many: Command[] = Array.from({ length: 12 }, (_, i) => ({ id: `c${i}`, label: `Command ${i}` }));
		render(CommandPalette, { open: true, commands: many });
		await user.keyboard('{Control>}{End}{/Control}');
		expect(activeLabel()).toBe('Command 11');
		await user.keyboard('{Control>}{Home}{/Control}');
		expect(activeLabel()).toBe('Command 0');
		await user.keyboard('{PageDown}');
		expect(activeLabel()).toBe('Command 8');
		await user.keyboard('{PageDown}');
		expect(activeLabel()).toBe('Command 11');
		await user.keyboard('{PageUp}');
		expect(activeLabel()).toBe('Command 3');
		await user.keyboard('{PageUp}');
		expect(activeLabel()).toBe('Command 0');
		await user.keyboard('{ArrowDown}{End}');
		expect(activeLabel()).toBe('Command 1');
		await user.keyboard('{Home}');
		expect(activeLabel()).toBe('Command 1');
	});

	it('starts again at the top when the query changes', async () => {
		const user = userEvent.setup();
		render(CommandPalette, { open: true, commands: commands() });
		await user.keyboard('{ArrowDown}{ArrowDown}');
		await user.type(search(), 'e');
		expect(activeLabel()).toBe(labels()[0]);
	});

	it('navigation keys do nothing without results and Enter runs nothing', async () => {
		const user = userEvent.setup();
		const onselect = vi.fn();
		render(CommandPalette, { open: true, commands: commands(), onselect });
		await user.type(search(), 'xyz');
		const keys = new Map<string, boolean>();
		for (const key of ['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Enter']) {
			keys.set(key, !fireEvent.keyDown(search(), { key }));
		}
		keys.set('Home', !fireEvent.keyDown(search(), { key: 'Home', ctrlKey: true }));
		keys.set('End', !fireEvent.keyDown(search(), { key: 'End', ctrlKey: true }));
		expect([...keys.values()].every(Boolean)).toBe(true);
		expect(fireEvent.keyDown(search(), { key: 'a' })).toBe(true);
		expect(onselect).not.toHaveBeenCalled();
		expect(dialog().hasAttribute('open')).toBe(true);
	});

	it('Enter runs the active command: closes, then calls its onselect, onselect(id) and onclose', async () => {
		const user = userEvent.setup();
		const order: string[] = [];
		const list = commands();
		list[1].onselect = () => order.push('command');
		const props = reactive<{ open: boolean | undefined; commands: Command[]; onselect: (id: string) => void; onclose: () => void }>({
			open: true,
			commands: list,
			onselect: (id) => order.push(`select:${id}`),
			onclose: () => order.push('close')
		});
		render(CommandPalette, { props });
		await user.keyboard('{ArrowDown}{Enter}');
		expect(dialog().hasAttribute('open')).toBe(false);
		await flush();
		expect(order).toEqual(['command', 'select:open', 'close']);
		expect(props.open).toBe(false);
	});

	it('runs a command without callbacks', async () => {
		const user = userEvent.setup();
		render(CommandPalette, { open: true, commands: commands() });
		await user.keyboard('{Enter}');
		expect(dialog().hasAttribute('open')).toBe(false);
	});

	it('pointer: hover makes an option active, a click runs it, the list keeps the focus in the field', async () => {
		const onselect = vi.fn();
		render(CommandPalette, { open: true, commands: commands(), onselect });
		const options = screen.getAllByRole('option');
		await fireEvent.pointerMove(options[2].querySelector('span') ?? options[2]);
		expect(activeLabel()).toBe('Toggle theme');
		await fireEvent.pointerMove(screen.getAllByRole('group')[0]);
		expect(activeLabel()).toBe('Toggle theme');
		expect(fireEvent.mouseDown(options[3])).toBe(false);
		await fireEvent.click(screen.getAllByRole('group')[0]);
		expect(onselect).not.toHaveBeenCalled();
		await fireEvent.click(options[3]);
		expect(onselect).toHaveBeenCalledWith('reload');
		expect(dialog().hasAttribute('open')).toBe(false);
	});

	it('ignores a click on an option index that no longer exists', async () => {
		const onselect = vi.fn();
		render(CommandPalette, { open: true, commands: commands(), onselect });
		const option = screen.getAllByRole('option')[0];
		option.dataset.index = '99';
		await fireEvent.click(option);
		expect(onselect).not.toHaveBeenCalled();
	});

	it('closes with the close button and on a backdrop click, not on a click inside', async () => {
		const user = userEvent.setup();
		const onclose = vi.fn();
		const props = reactive<{ open: boolean | undefined; commands: Command[]; onclose: () => void }>({
			open: true,
			commands: commands(),
			onclose
		});
		render(CommandPalette, { props });
		await fireEvent.click(search());
		expect(dialog().hasAttribute('open')).toBe(true);
		await fireEvent.click(dialog());
		expect(dialog().hasAttribute('open')).toBe(false);
		await vi.waitFor(() => expect(props.open).toBe(false));
		expect(onclose).toHaveBeenCalledTimes(1);
		props.open = true;
		await vi.waitFor(() => expect(dialog().hasAttribute('open')).toBe(true));
		await user.click(screen.getByRole('button', { name: 'Close' }));
		expect(dialog().hasAttribute('open')).toBe(false);
		await vi.waitFor(() => expect(onclose).toHaveBeenCalledTimes(2));
	});

	it('closes when open becomes false and resets the query when it opens again', async () => {
		const user = userEvent.setup();
		const props = reactive<{ open: boolean | undefined; commands: Command[] }>({ open: true, commands: commands() });
		render(CommandPalette, { props });
		await user.type(search(), 'save');
		await user.keyboard('{Escape}');
		await vi.waitFor(() => expect(props.open).toBe(false));
		props.open = true;
		await vi.waitFor(() => expect(dialog().hasAttribute('open')).toBe(true));
		expect(search().value).toBe('');
		props.open = false;
		await vi.waitFor(() => expect(dialog().hasAttribute('open')).toBe(false));
	});

	describe('hotkey', () => {
		it('is off by default', async () => {
			render(CommandPalette, { commands: commands() });
			await fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
			expect(dialog().hasAttribute('open')).toBe(false);
		});

		it('"mod+k" toggles with Ctrl or Cmd and ignores other combinations', async () => {
			const props = reactive<{ open: boolean | undefined; commands: Command[]; hotkey: string }>({
				open: undefined,
				commands: commands(),
				hotkey: 'Mod + K'
			});
			render(CommandPalette, { props });
			expect(fireEvent.keyDown(window, { key: 'k' })).toBe(true);
			expect(fireEvent.keyDown(window, { key: 'k', ctrlKey: true, shiftKey: true })).toBe(true);
			expect(fireEvent.keyDown(window, { key: 'j', ctrlKey: true })).toBe(true);
			expect(props.open).toBeUndefined();
			expect(fireEvent.keyDown(window, { key: 'K', ctrlKey: true })).toBe(false);
			expect(props.open).toBe(true);
			await vi.waitFor(() => expect(dialog().hasAttribute('open')).toBe(true));
			fireEvent.keyDown(window, { key: 'k', metaKey: true });
			expect(props.open).toBe(false);
			await vi.waitFor(() => expect(dialog().hasAttribute('open')).toBe(false));
		});

		it('names exact modifiers: ctrl, meta/cmd, shift and alt', () => {
			const props = reactive<{ open: boolean | undefined; commands: Command[]; hotkey: string }>({
				open: undefined,
				commands: commands(),
				hotkey: 'ctrl+shift+p'
			});
			const { unmount } = render(CommandPalette, { props });
			fireEvent.keyDown(window, { key: 'p', ctrlKey: true });
			fireEvent.keyDown(window, { key: 'p', ctrlKey: true, metaKey: true, shiftKey: true });
			expect(props.open).toBeUndefined();
			fireEvent.keyDown(window, { key: 'P', ctrlKey: true, shiftKey: true });
			expect(props.open).toBe(true);
			props.hotkey = 'cmd+alt+x';
			fireEvent.keyDown(window, { key: 'x', metaKey: true });
			expect(props.open).toBe(true);
			fireEvent.keyDown(window, { key: 'x', metaKey: true, altKey: true });
			expect(props.open).toBe(false);
			props.hotkey = 'meta+y';
			fireEvent.keyDown(window, { key: 'y', metaKey: true });
			expect(props.open).toBe(true);
			unmount();
			fireEvent.keyDown(window, { key: 'y', metaKey: true });
			expect(props.open).toBe(true);
		});
	});
});
