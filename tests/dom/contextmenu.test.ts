/**
 * ContextMenu: the target area (group role, Shift+F10 shortcut, focusable or not), opening by right click, by
 * Shift+F10 / the menu key and by a touch long press (with the tap that ends it swallowed), the menu keyboard
 * (arrows wrap, Home/End, type-ahead, Escape returns focus, Tab leaves), items (buttons, links, disabled, danger,
 * shortcuts, separators, labels), closing on outside pointer, scroll, resize and window blur, and `disabled`.
 */
import { fireEvent, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { createRawSnippet, flushSync } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ContextMenu from '../../src/lib/components/ContextMenu.svelte';
import type { MenuEntry } from '../../src/lib/components/DropdownMenu.svelte';
import { strings } from '../../src/lib/components/strings.svelte.js';
import { flush, textSnippet } from './helpers.js';
import { reactive } from './reactive.svelte.js';

const area = textSnippet('Right-click here');
const areaWithButton = createRawSnippet(() => ({ render: () => '<div><button type="button">Inner</button></div>' }));

function items(onselect = vi.fn()): MenuEntry[] {
	return [
		{ type: 'label', label: 'Edit' },
		{ id: 'copy', label: 'Copy', shortcut: 'Ctrl+C', onselect },
		{ id: 'cut', label: 'Cut', disabled: true, onselect },
		{ id: 'paste', label: 'Paste' },
		{ type: 'separator' },
		{ id: 'help', label: 'Help', href: '#help' },
		{ id: 'docs', label: 'Docs', href: '#docs', disabled: true, shortcut: 'F1' },
		{ type: 'item', id: 'delete', label: 'Delete', danger: true, onselect }
	];
}

function areaEl(): HTMLElement {
	return screen.getByRole('group');
}
function menu(): HTMLElement | null {
	return screen.queryByRole('menu');
}
function entries(): HTMLElement[] {
	return screen.getAllByRole('menuitem');
}
async function openByMouse(x = 40, y = 50): Promise<HTMLElement> {
	await fireEvent.contextMenu(areaEl(), { clientX: x, clientY: y });
	const m = menu();
	if (!m) throw new Error('menu did not open');
	await vi.waitFor(() => expect(document.activeElement).toBe(entries()[0]));
	return m;
}

const extras: HTMLElement[] = [];
afterEach(() => {
	vi.useRealTimers();
	vi.restoreAllMocks();
	for (const el of extras.splice(0)) el.remove();
});

describe('ContextMenu', () => {
	it('renders a focusable group with the keyboard shortcut and no menu', () => {
		render(ContextMenu, { items: items(), areaLabel: 'Files', class: 'mine', children: area });
		const group = screen.getByRole('group', { name: 'Files' });
		expect(group.tabIndex).toBe(0);
		expect(group.getAttribute('aria-keyshortcuts')).toBe('Shift+F10');
		expect(group.classList.contains('mine')).toBe(true);
		expect(menu()).toBeNull();
	});

	it('a right click opens the menu at the pointer with the default name and focuses the first enabled item', async () => {
		render(ContextMenu, { items: items(), children: area });
		const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 40, clientY: 50 });
		areaEl().dispatchEvent(event);
		expect(event.defaultPrevented).toBe(true);
		await vi.waitFor(() => expect(menu()).not.toBeNull());
		const m = menu() as HTMLElement;
		expect(m.getAttribute('aria-label')).toBe(strings().contextMenu.label);
		expect(m.style.left).toBe('40px');
		expect(m.style.top).toBe('50px');
		await vi.waitFor(() => expect(document.activeElement?.textContent).toContain('Copy'));
		expect(screen.getByRole('separator')).toBeTruthy();
		expect(m.querySelector('.group-label')?.textContent).toBe('Edit');
	});

	it('renders buttons, links, disabled, danger and shortcut items', async () => {
		render(ContextMenu, { items: items(), label: 'File actions', children: area });
		const m = await openByMouse();
		expect(m.getAttribute('aria-label')).toBe('File actions');
		const all = entries();
		expect(all.map((e) => e.tagName)).toEqual(['BUTTON', 'BUTTON', 'BUTTON', 'A', 'A', 'BUTTON']);
		expect(all[0].querySelector('kbd')?.textContent).toBe('Ctrl+C');
		expect(all[2].querySelector('kbd')).toBeNull();
		expect(all[1].getAttribute('aria-disabled')).toBe('true');
		expect(all[0].hasAttribute('aria-disabled')).toBe(false);
		expect(all[4].getAttribute('aria-disabled')).toBe('true');
		expect(all[4].querySelector('kbd')?.textContent).toBe('F1');
		expect(all[3].getAttribute('href')).toBe('#help');
		expect(all[5].classList.contains('danger')).toBe(true);
		expect(all.every((e) => e.tabIndex === -1)).toBe(true);
		// The browser's own context menu is suppressed on the menu too.
		expect(await fireEvent.contextMenu(m)).toBe(false);
	});

	it('choosing an item closes the menu, calls onselect and returns focus to the area', async () => {
		const user = userEvent.setup();
		const onselect = vi.fn();
		render(ContextMenu, { items: items(onselect), children: area });
		await openByMouse();
		await user.click(entries()[0]);
		expect(onselect).toHaveBeenCalledTimes(1);
		await vi.waitFor(() => expect(menu()).toBeNull());
		expect(document.activeElement).toBe(areaEl());
	});

	it('a disabled item does nothing, an item without onselect just closes', async () => {
		const user = userEvent.setup();
		const onselect = vi.fn();
		render(ContextMenu, { items: items(onselect), children: area });
		await openByMouse();
		await user.click(entries()[1]);
		expect(onselect).not.toHaveBeenCalled();
		expect(menu()).not.toBeNull();
		await user.click(entries()[2]);
		await vi.waitFor(() => expect(menu()).toBeNull());
	});

	it('a link item closes the menu without moving focus back', async () => {
		render(ContextMenu, { items: items(), children: area });
		await openByMouse();
		const link = entries()[3];
		link.addEventListener('click', (e) => e.preventDefault());
		link.focus();
		link.click();
		await vi.waitFor(() => expect(menu()).toBeNull());
		expect(document.activeElement).not.toBe(areaEl());
	});

	it('arrow keys move through enabled items and wrap, Home and End jump', async () => {
		const user = userEvent.setup();
		render(ContextMenu, { items: items(), children: area });
		await openByMouse();
		const names = (): string | undefined => document.activeElement?.querySelector('span')?.textContent;
		await user.keyboard('{ArrowDown}');
		expect(names()).toBe('Paste');
		await user.keyboard('{ArrowDown}{ArrowDown}');
		expect(names()).toBe('Delete');
		await user.keyboard('{ArrowDown}');
		expect(names()).toBe('Copy');
		await user.keyboard('{ArrowUp}');
		expect(names()).toBe('Delete');
		await user.keyboard('{Home}');
		expect(names()).toBe('Copy');
		await user.keyboard('{End}');
		expect(names()).toBe('Delete');
	});

	it('type-ahead focuses the next item starting with the letter; modified keys and misses do nothing', async () => {
		const user = userEvent.setup();
		render(ContextMenu, { items: items(), children: area });
		await openByMouse();
		const names = (): string | undefined => document.activeElement?.querySelector('span')?.textContent;
		await user.keyboard('h');
		expect(names()).toBe('Help');
		await user.keyboard('C');
		expect(names()).toBe('Copy');
		await user.keyboard('{Control>}d{/Control}');
		expect(names()).toBe('Copy');
		await user.keyboard('{Meta>}d{/Meta}{Alt>}d{/Alt}');
		expect(names()).toBe('Copy');
		await user.keyboard('z');
		expect(names()).toBe('Copy');
		await user.keyboard('{Shift}');
		expect(names()).toBe('Copy');
	});

	it.each([['{Escape}'], ['{Shift>}{F10}{/Shift}'], ['{ContextMenu}']])('%s closes the menu and returns focus', async (keys) => {
		const user = userEvent.setup();
		const onKey = vi.fn();
		document.addEventListener('keydown', onKey);
		render(ContextMenu, { items: items(), children: area });
		await openByMouse();
		await user.keyboard(keys);
		await vi.waitFor(() => expect(menu()).toBeNull());
		expect(document.activeElement).toBe(areaEl());
		expect(onKey.mock.calls.some(([e]) => e instanceof KeyboardEvent && e.key !== 'Shift')).toBe(false);
		document.removeEventListener('keydown', onKey);
	});

	it('Tab closes the menu without pulling focus back', async () => {
		const user = userEvent.setup();
		render(ContextMenu, { items: items(), children: area });
		await openByMouse();
		await user.keyboard('{Tab}');
		await vi.waitFor(() => expect(menu()).toBeNull());
	});

	it('the menu itself takes focus when every item is disabled; arrows then do nothing', async () => {
		const user = userEvent.setup();
		render(ContextMenu, { items: [{ id: 'a', label: 'A', disabled: true }], children: area });
		await fireEvent.contextMenu(areaEl(), { clientX: 1, clientY: 1 });
		await vi.waitFor(() => expect(document.activeElement).toBe(menu()));
		await user.keyboard('{ArrowDown}{ArrowUp}{Home}{End}a');
		expect(document.activeElement).toBe(menu());
	});

	it('Shift+F10 and the menu key open it from the focused area, below the focused element', async () => {
		const user = userEvent.setup();
		render(ContextMenu, { items: items(), children: area });
		vi.spyOn(areaEl(), 'getBoundingClientRect').mockReturnValue({ left: 100, top: 200, width: 20, bottom: 300 } as DOMRect);
		areaEl().focus();
		await user.keyboard('{Shift>}{F10}{/Shift}');
		await vi.waitFor(() => expect(menu()).not.toBeNull());
		expect(menu()?.style.left).toBe('110px');
		expect(menu()?.style.top).toBe('240px');
		await vi.waitFor(() => expect(document.activeElement).toBe(entries()[0]));
		// The contextmenu event some browsers send after the key does not move the menu.
		await fireEvent.contextMenu(areaEl(), { clientX: 500, clientY: 500 });
		expect(menu()?.style.left).toBe('110px');
		await user.keyboard('{Escape}');
		await vi.waitFor(() => expect(menu()).toBeNull());
		expect(document.activeElement).toBe(areaEl());
		await user.keyboard('{ContextMenu}');
		await vi.waitFor(() => expect(menu()).not.toBeNull());
	});

	it('other keys on the area, and F10 without Shift, do nothing', async () => {
		const user = userEvent.setup();
		render(ContextMenu, { items: items(), children: area });
		areaEl().focus();
		await user.keyboard('{F10}a{Enter}');
		await flush();
		expect(menu()).toBeNull();
	});

	it('a later right click while open moves the menu and keeps the focus to restore', async () => {
		const user = userEvent.setup();
		render(ContextMenu, { items: items(), children: areaWithButton });
		const inner = screen.getByRole('button', { name: 'Inner' });
		inner.focus();
		await openByMouse(10, 10);
		await fireEvent.contextMenu(areaEl(), { clientX: 60, clientY: 70 });
		await vi.waitFor(() => expect(menu()?.style.left).toBe('60px'));
		await user.keyboard('{Escape}');
		await vi.waitFor(() => expect(menu()).toBeNull());
		expect(document.activeElement).toBe(inner);
	});

	it('focusable=false leaves the area out of the tab order and restores nothing when nothing inside had focus', async () => {
		const user = userEvent.setup();
		render(ContextMenu, { items: items(), focusable: false, children: area });
		expect(areaEl().hasAttribute('tabindex')).toBe(false);
		await openByMouse();
		await user.keyboard('{Escape}');
		await vi.waitFor(() => expect(menu()).toBeNull());
		expect(document.activeElement).toBe(document.body);
	});

	it('closes on a pointer down outside the menu, not inside', async () => {
		render(ContextMenu, { items: items(), children: area });
		const m = await openByMouse();
		await fireEvent.pointerDown(m);
		expect(menu()).not.toBeNull();
		const outside = document.createElement('div');
		document.body.append(outside);
		extras.push(outside);
		await fireEvent.pointerDown(outside);
		await vi.waitFor(() => expect(menu()).toBeNull());
		// Closed: another pointer down or resize changes nothing.
		await fireEvent.pointerDown(outside);
		window.dispatchEvent(new Event('resize'));
		await flush();
		expect(menu()).toBeNull();
	});

	it('closes on a scroll outside the menu, not on one inside it', async () => {
		render(ContextMenu, { items: items(), children: area });
		const m = await openByMouse();
		m.dispatchEvent(new Event('scroll'));
		await flush();
		expect(menu()).not.toBeNull();
		document.dispatchEvent(new Event('scroll'));
		await vi.waitFor(() => expect(menu()).toBeNull());
		document.dispatchEvent(new Event('scroll'));
	});

	it.each(['resize', 'blur'])('closes on window %s', async (type) => {
		render(ContextMenu, { items: items(), children: area });
		await openByMouse();
		window.dispatchEvent(new Event(type));
		await vi.waitFor(() => expect(menu()).toBeNull());
	});

	it('a touch long press opens the menu at the finger and swallows the tap that ends it', async () => {
		vi.useFakeTimers();
		const onclick = vi.fn();
		render(ContextMenu, { items: items(), longPress: 300, children: area });
		const group = areaEl();
		group.addEventListener('click', onclick);
		await fireEvent.pointerDown(group, { pointerType: 'touch', pointerId: 3, clientX: 30, clientY: 40 });
		// Another finger moving does not cancel; small movements do not either.
		await fireEvent.pointerMove(group, { pointerId: 4, clientX: 300, clientY: 300 });
		await fireEvent.pointerMove(group, { pointerId: 3, clientX: 33, clientY: 44 });
		vi.advanceTimersByTime(299);
		expect(menu()).toBeNull();
		vi.advanceTimersByTime(1);
		await vi.waitFor(() => expect(menu()).not.toBeNull());
		expect(menu()?.style.left).toBe('30px');
		await fireEvent.click(group);
		expect(onclick).not.toHaveBeenCalled();
		await fireEvent.click(group);
		expect(onclick).toHaveBeenCalledTimes(1);
	});

	it('the long press waits 500 ms by default and is cancelled by moving, lifting or a mouse', async () => {
		vi.useFakeTimers();
		render(ContextMenu, { items: items(), children: area });
		const group = areaEl();
		await fireEvent.pointerDown(group, { pointerType: 'touch', pointerId: 1, clientX: 30, clientY: 40 });
		await fireEvent.pointerMove(group, { pointerId: 1, clientX: 60, clientY: 40 });
		vi.advanceTimersByTime(600);
		expect(menu()).toBeNull();
		// A move with no press in progress is ignored.
		await fireEvent.pointerMove(group, { pointerId: 1, clientX: 90, clientY: 40 });

		await fireEvent.pointerDown(group, { pointerType: 'pen', pointerId: 2, clientX: 30, clientY: 40 });
		window.dispatchEvent(new Event('pointerup'));
		vi.advanceTimersByTime(600);
		expect(menu()).toBeNull();

		await fireEvent.pointerDown(group, { pointerType: 'touch', pointerId: 5, clientX: 30, clientY: 40 });
		window.dispatchEvent(new Event('pointercancel'));
		vi.advanceTimersByTime(600);
		expect(menu()).toBeNull();

		await fireEvent.pointerDown(group, { pointerType: 'mouse', pointerId: 6, clientX: 30, clientY: 40 });
		vi.advanceTimersByTime(600);
		expect(menu()).toBeNull();

		await fireEvent.pointerDown(group, { pointerType: 'touch', pointerId: 7, clientX: 30, clientY: 40 });
		vi.advanceTimersByTime(499);
		expect(menu()).toBeNull();
		vi.advanceTimersByTime(1);
		await vi.waitFor(() => expect(menu()).not.toBeNull());
	});

	it('a right click during a long press cancels it', async () => {
		vi.useFakeTimers();
		render(ContextMenu, { items: items(), children: area });
		const group = areaEl();
		await fireEvent.pointerDown(group, { pointerType: 'touch', pointerId: 1, clientX: 30, clientY: 40 });
		await fireEvent.contextMenu(group, { clientX: 70, clientY: 80 });
		await vi.waitFor(() => expect(menu()?.style.left).toBe('70px'));
		vi.advanceTimersByTime(600);
		expect(menu()?.style.left).toBe('70px');
	});

	it('disabled: no tab stop, no shortcut, and neither mouse, keyboard nor touch opens it', async () => {
		vi.useFakeTimers();
		render(ContextMenu, { items: items(), disabled: true, children: area });
		const group = areaEl();
		expect(group.hasAttribute('tabindex')).toBe(false);
		expect(group.hasAttribute('aria-keyshortcuts')).toBe(false);
		expect(await fireEvent.contextMenu(group)).toBe(true);
		await fireEvent.keyDown(group, { key: 'F10', shiftKey: true });
		await fireEvent.keyDown(group, { key: 'ContextMenu' });
		await fireEvent.pointerDown(group, { pointerType: 'touch', pointerId: 1 });
		vi.advanceTimersByTime(600);
		expect(menu()).toBeNull();
	});

	it('disabling the area during a long press keeps the menu closed', async () => {
		vi.useFakeTimers();
		const props = reactive<{ items: MenuEntry[]; disabled: boolean; children: typeof area }>({
			items: items(),
			disabled: false,
			children: area
		});
		render(ContextMenu, { props });
		await fireEvent.pointerDown(areaEl(), { pointerType: 'touch', pointerId: 1, clientX: 30, clientY: 40 });
		props.disabled = true;
		flushSync();
		vi.advanceTimersByTime(600);
		flushSync();
		expect(menu()).toBeNull();
	});

	it('the menu key pressed on text inside the area opens the menu below the area', async () => {
		render(ContextMenu, { items: items(), children: area });
		vi.spyOn(areaEl(), 'getBoundingClientRect').mockReturnValue({ left: 10, top: 20, width: 100, bottom: 30 } as DOMRect);
		const text = areaEl().querySelector('span')?.firstChild as Text;
		text.dispatchEvent(new KeyboardEvent('keydown', { key: 'ContextMenu', bubbles: true, cancelable: true }));
		await vi.waitFor(() => expect(menu()).not.toBeNull());
		expect(menu()?.style.left).toBe('26px');
		expect(menu()?.style.top).toBe('30px');
	});

	it('a menu closed before its focus moved does not take the focus', async () => {
		render(ContextMenu, { items: items(), children: area });
		areaEl().dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 5, clientY: 5 }));
		// Runs after the render that opened the menu, before the focus task it queued.
		queueMicrotask(() => {
			window.dispatchEvent(new Event('blur'));
			flushSync();
		});
		await flush();
		expect(menu()).toBeNull();
		expect(document.activeElement).toBe(document.body);
	});

	it('renders no class for a null class from an untyped consumer', () => {
		render(ContextMenu, { items: items(), class: null as unknown as string, children: area });
		expect(areaEl().className).not.toContain('null');
	});
});
