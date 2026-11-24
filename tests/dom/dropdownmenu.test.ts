/**
 * DropdownMenu (WAI-ARIA menu button): the trigger's haspopup/expanded/controls, opening by click and
 * keys with the focus on the first or last item, arrow/Home/End/type-ahead navigation that skips disabled
 * items, Escape and Tab, choosing items and links, separators and group labels, outside clicks, the
 * custom trigger snippet and the sideways shift that keeps the menu inside a narrow viewport.
 */
import { fireEvent } from '@testing-library/dom';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import DropdownMenu, { type MenuEntry } from '../../src/lib/components/DropdownMenu.svelte';
import { flush, textSnippet } from './helpers.js';

afterEach(() => {
	vi.restoreAllMocks();
});

function entries(onselect: () => void = () => {}): MenuEntry[] {
	return [
		{ type: 'label', label: 'File' },
		{ id: 'new', label: 'New', onselect, shortcut: 'Ctrl+N' },
		{ id: 'open', label: 'Open', disabled: true },
		{ type: 'item', id: 'save', label: 'Save' },
		{ type: 'separator' },
		{ id: 'docs', label: 'Docs', href: '#docs', shortcut: 'F1' },
		{ id: 'off', label: 'Offline docs', href: '#off', disabled: true },
		{ id: 'delete', label: 'Delete', danger: true }
	];
}

function trigger(): HTMLButtonElement {
	return screen.getByRole<HTMLButtonElement>('button', { name: 'Actions' });
}
function focusedText(): string | undefined {
	return document.activeElement?.querySelector('span')?.textContent ?? undefined;
}

describe('DropdownMenu', () => {
	it('renders a closed menu button', () => {
		render(DropdownMenu, { label: 'Actions', items: entries() });
		const btn = trigger();
		expect(btn.getAttribute('aria-haspopup')).toBe('menu');
		expect(btn.getAttribute('aria-expanded')).toBe('false');
		expect(btn.dataset.variant).toBe('secondary');
		expect(btn.hasAttribute('aria-label')).toBe(false);
		expect(btn.querySelector('svg')).not.toBeNull();
		expect(screen.queryByRole('menu')).toBeNull();
	});

	it('opens on click with the focus on the first enabled item and lists every entry kind', async () => {
		const user = userEvent.setup();
		render(DropdownMenu, { label: 'Actions', items: entries(), align: 'end', triggerVariant: 'ghost', class: 'extra' });
		expect(document.querySelector('.k-dropdown')?.classList.contains('extra')).toBe(true);
		expect(trigger().dataset.variant).toBe('ghost');
		await user.click(trigger());
		const menu = screen.getByRole('menu', { name: 'Actions' });
		expect(trigger().getAttribute('aria-expanded')).toBe('true');
		expect(trigger().getAttribute('aria-controls')).toBe(menu.id);
		expect(menu.dataset.align).toBe('end');
		await flush();
		expect(focusedText()).toBe('New');
		const items = screen.getAllByRole('menuitem');
		expect(items.map((el) => el.querySelector('span')?.textContent)).toEqual(['New', 'Open', 'Save', 'Docs', 'Offline docs', 'Delete']);
		expect(items[1].getAttribute('aria-disabled')).toBe('true');
		expect(items[0].hasAttribute('aria-disabled')).toBe(false);
		expect(items[3].tagName).toBe('A');
		expect(items[3].getAttribute('href')).toBe('#docs');
		expect(items[4].getAttribute('aria-disabled')).toBe('true');
		expect(items[5].classList.contains('danger')).toBe(true);
		expect(items[0].querySelector('kbd')?.textContent).toBe('Ctrl+N');
		expect(items[3].querySelector('kbd')?.textContent).toBe('F1');
		expect(items[2].querySelector('kbd')).toBeNull();
		expect(screen.getByRole('separator')).toBeTruthy();
		expect(document.querySelector('.group-label')?.textContent).toBe('File');
	});

	it('a second click closes and keeps the focus on the trigger', async () => {
		const user = userEvent.setup();
		render(DropdownMenu, { label: 'Actions', items: entries() });
		await user.click(trigger());
		await user.click(trigger());
		expect(screen.queryByRole('menu')).toBeNull();
		expect(document.activeElement).toBe(trigger());
	});

	it.each([
		['{ArrowDown}', 'New'],
		['{Enter}', 'New'],
		[' ', 'New'],
		['{ArrowUp}', 'Delete']
	])('%s on the trigger opens with the focus on %s', async (key, expected) => {
		const user = userEvent.setup();
		render(DropdownMenu, { label: 'Actions', items: entries() });
		trigger().focus();
		await user.keyboard(key);
		await flush();
		expect(screen.getByRole('menu')).toBeTruthy();
		expect(focusedText()).toBe(expected);
	});

	it('closing again before the menu rendered moves no focus into it', async () => {
		render(DropdownMenu, { label: 'Actions', items: entries() });
		trigger().focus();
		fireEvent.keyDown(trigger(), { key: 'ArrowDown' });
		fireEvent.click(trigger());
		await flush();
		expect(screen.queryByRole('menu')).toBeNull();
		expect(document.activeElement).toBe(trigger());
	});

	it('other keys on the trigger do nothing', () => {
		render(DropdownMenu, { label: 'Actions', items: entries() });
		expect(fireEvent.keyDown(trigger(), { key: 'a' })).toBe(true);
		expect(screen.queryByRole('menu')).toBeNull();
	});

	it('arrows wrap, Home/End jump, disabled items are skipped', async () => {
		const user = userEvent.setup();
		render(DropdownMenu, { label: 'Actions', items: entries() });
		await user.click(trigger());
		await flush();
		await user.keyboard('{ArrowDown}');
		expect(focusedText()).toBe('Save');
		await user.keyboard('{ArrowDown}');
		expect(focusedText()).toBe('Docs');
		await user.keyboard('{ArrowDown}{ArrowDown}');
		expect(focusedText()).toBe('New');
		await user.keyboard('{ArrowUp}');
		expect(focusedText()).toBe('Delete');
		await user.keyboard('{Home}');
		expect(focusedText()).toBe('New');
		await user.keyboard('{End}');
		expect(focusedText()).toBe('Delete');
	});

	it('type-ahead moves to the next item starting with the letter', async () => {
		const user = userEvent.setup();
		render(DropdownMenu, { label: 'Actions', items: entries() });
		await user.click(trigger());
		await flush();
		await user.keyboard('d');
		expect(focusedText()).toBe('Docs');
		await user.keyboard('D');
		expect(focusedText()).toBe('Delete');
		await user.keyboard('d');
		expect(focusedText()).toBe('Docs');
		await user.keyboard('x');
		expect(focusedText()).toBe('Docs');
		await user.keyboard('{Shift}');
		expect(focusedText()).toBe('Docs');
	});

	it('Escape closes and returns the focus to the trigger; Tab closes and lets the focus move on', async () => {
		const user = userEvent.setup();
		render(DropdownMenu, { label: 'Actions', items: entries() });
		await user.click(trigger());
		await flush();
		await user.keyboard('{Escape}');
		expect(screen.queryByRole('menu')).toBeNull();
		expect(document.activeElement).toBe(trigger());
		await user.click(trigger());
		await flush();
		const item = document.activeElement;
		fireEvent.keyDown(item ?? document.body, { key: 'Tab' });
		await flush();
		expect(screen.queryByRole('menu')).toBeNull();
		expect(trigger().getAttribute('aria-expanded')).toBe('false');
	});

	it('choosing an item runs it, closes and focuses the trigger; disabled items do nothing', async () => {
		const user = userEvent.setup();
		const onselect = vi.fn();
		render(DropdownMenu, { label: 'Actions', items: entries(onselect) });
		await user.click(trigger());
		await user.click(screen.getByRole('menuitem', { name: 'Open' }));
		expect(screen.getByRole('menu')).toBeTruthy();
		await user.click(screen.getByRole('menuitem', { name: /New/ }));
		expect(onselect).toHaveBeenCalledTimes(1);
		expect(screen.queryByRole('menu')).toBeNull();
		expect(document.activeElement).toBe(trigger());
		await user.click(trigger());
		await user.click(screen.getByRole('menuitem', { name: 'Save' }));
		expect(screen.queryByRole('menu')).toBeNull();
	});

	it('a link item closes the menu without taking the focus back', async () => {
		const user = userEvent.setup();
		render(DropdownMenu, { label: 'Actions', items: entries() });
		await user.click(trigger());
		await user.click(screen.getByRole('menuitem', { name: /Docs/ }));
		expect(screen.queryByRole('menu')).toBeNull();
		expect(document.activeElement).not.toBe(trigger());
	});

	it('closes on a click outside, not on a click inside', async () => {
		const user = userEvent.setup();
		render(DropdownMenu, { label: 'Actions', items: entries() });
		await user.click(document.body);
		await user.click(trigger());
		await user.click(screen.getByRole('separator'));
		expect(screen.getByRole('menu')).toBeTruthy();
		await user.click(document.body);
		expect(screen.queryByRole('menu')).toBeNull();
		expect(document.activeElement).not.toBe(trigger());
	});

	it('a custom trigger keeps the label as the accessible name', () => {
		render(DropdownMenu, { label: 'Actions', items: entries(), trigger: textSnippet('⋯') });
		const btn = trigger();
		expect(btn.getAttribute('aria-label')).toBe('Actions');
		expect(btn.textContent).toBe('⋯');
		expect(btn.querySelector('svg')).toBeNull();
	});

	it('opens on an empty list without failing', async () => {
		const user = userEvent.setup();
		render(DropdownMenu, { label: 'Actions', items: [] });
		await user.click(trigger());
		await flush();
		const menu = screen.getByRole('menu');
		fireEvent.keyDown(menu, { key: 'ArrowDown' });
		fireEvent.keyDown(menu, { key: 'ArrowUp' });
		fireEvent.keyDown(menu, { key: 'Home' });
		fireEvent.keyDown(menu, { key: 'End' });
		fireEvent.keyDown(menu, { key: 'a' });
		fireEvent.keyDown(menu, { key: 'ArrowUp' });
		expect(screen.getByRole('menu')).toBeTruthy();
	});

	describe('viewport fit', () => {
		function rect(left: number, right: number): DOMRect {
			return { left, right, top: 0, bottom: 0, width: right - left, height: 0, x: left, y: 0, toJSON: () => ({}) };
		}

		it('leaves a menu that fits where it is', async () => {
			const user = userEvent.setup();
			vi.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(1000);
			vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(rect(100, 300));
			render(DropdownMenu, { label: 'Actions', items: entries() });
			await user.click(trigger());
			const menu = screen.getByRole('menu');
			expect(menu.style.left).toBe('');
			expect(menu.style.right).toBe('');
		});

		it('shifts a start-aligned menu left past the right edge and back from the left edge', async () => {
			const user = userEvent.setup();
			vi.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(400);
			const box = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(rect(250, 450));
			render(DropdownMenu, { label: 'Actions', items: entries() });
			await user.click(trigger());
			const menu = screen.getByRole('menu');
			expect(menu.style.left).toBe('-58px');
			box.mockReturnValue(rect(2, 100));
			window.dispatchEvent(new Event('resize'));
			expect(menu.style.left).toBe('6px');
		});

		it('an end-aligned menu shifts through `right`, and stops listening once closed', async () => {
			const user = userEvent.setup();
			vi.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(400);
			vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(rect(250, 450));
			const remove = vi.spyOn(window, 'removeEventListener');
			render(DropdownMenu, { label: 'Actions', items: entries(), align: 'end' });
			await user.click(trigger());
			const menu = screen.getByRole('menu');
			expect(menu.style.right).toBe('58px');
			expect(menu.style.left).toBe('');
			await user.keyboard('{Escape}');
			expect(remove).toHaveBeenCalledWith('resize', expect.any(Function));
		});
	});
});
