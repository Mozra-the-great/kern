/**
 * Modal and Drawer, which share the ModalDialog controller (stuffcloud: dialog.test.ts). The native
 * `<dialog>` modal methods come from the jsdom stand-in in env.ts (Escape fires the cancelable `cancel`
 * event like a browser); focus order inside the top layer and the backdrop look run in the Playwright suites.
 */
import { fireEvent, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { createRawSnippet } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Drawer from '../../src/lib/components/Drawer.svelte';
import Modal from '../../src/lib/components/Modal.svelte';
import { flush, textSnippet } from './helpers.js';
import { reactive } from './reactive.svelte.js';

function dialogElement(): HTMLDialogElement {
	const dialog = document.querySelector('dialog');
	if (dialog === null) throw new Error('no dialog in the document');
	return dialog;
}

afterEach(() => {
	vi.restoreAllMocks();
});

describe.each([
	['Modal', Modal],
	['Drawer', Drawer]
] as const)('%s (shared dialog behaviour)', (_name, Component) => {
	const base = { title: 'Delete site', children: textSnippet('my-site.example'), footer: textSnippet('Confirm') };

	it('stays closed until open is true', () => {
		render(Component, { ...base, open: false });
		expect(dialogElement().hasAttribute('open')).toBe(false);
		expect(screen.queryByRole('dialog')).toBeNull();
	});

	it('opens modally, named by its heading, with a close button and the footer', () => {
		render(Component, { ...base, open: true });
		const dialog = screen.getByRole('dialog', { name: 'Delete site' });
		expect(dialog).toBe(dialogElement());
		expect(screen.getByRole('heading', { level: 2, name: 'Delete site' })).toBeTruthy();
		expect(screen.getByText('my-site.example')).toBeTruthy();
		expect(screen.getByText('Confirm')).toBeTruthy();
		expect(screen.getByRole('button', { name: 'Close' })).toBeTruthy();
	});

	it('has no banner or contentinfo landmark: the title row and the footer are not page landmarks (#154)', () => {
		// at the top level of the document, next to the page's own header and footer, which are the real landmarks
		render(Component, { ...base, open: true });
		expect(screen.queryByRole('banner')).toBeNull();
		expect(screen.queryByRole('contentinfo')).toBeNull();
		const dialog = dialogElement();
		for (const el of [dialog.querySelector('header'), dialog.querySelector('footer')]) {
			expect(el?.getAttribute('role')).toBe('none');
		}
	});

	it('opens and closes when the open prop changes, without reporting the app-driven close', async () => {
		const onclose = vi.fn();
		const { rerender } = render(Component, { ...base, open: false, onclose });
		await rerender({ open: true });
		expect(dialogElement().hasAttribute('open')).toBe(true);
		await rerender({ open: false });
		expect(dialogElement().hasAttribute('open')).toBe(false);
		await flush();
		expect(onclose).not.toHaveBeenCalled();
	});

	it('does not open an open dialog a second time', async () => {
		const showModal = vi.spyOn(HTMLDialogElement.prototype, 'showModal');
		const { rerender } = render(Component, { ...base, open: true });
		await rerender({ closeOnBackdrop: false });
		expect(showModal).toHaveBeenCalledTimes(1);
	});

	it('the close button closes it, reports it once and updates the bound state', async () => {
		const user = userEvent.setup();
		const onclose = vi.fn();
		const props = reactive<{ open: boolean | undefined; title: string; onclose: () => void }>({
			open: true,
			title: 'Delete site',
			onclose
		});
		render(Component, { props });
		await user.click(screen.getByRole('button', { name: 'Close' }));
		expect(dialogElement().hasAttribute('open')).toBe(false);
		expect(props.open).toBe(false);
		await vi.waitFor(() => expect(onclose).toHaveBeenCalledTimes(1));
	});

	it('Escape asks to close: oncancel can veto it, otherwise it closes and reports', async () => {
		const user = userEvent.setup();
		const onclose = vi.fn();
		const oncancel = vi.fn((event: Event) => event.preventDefault());
		render(Component, { ...base, open: true, onclose, oncancel });
		await user.keyboard('{Escape}');
		expect(oncancel).toHaveBeenCalledTimes(1);
		expect(dialogElement().hasAttribute('open')).toBe(true);
		expect(onclose).not.toHaveBeenCalled();

		oncancel.mockImplementation(() => undefined);
		await user.keyboard('{Escape}');
		expect(oncancel).toHaveBeenCalledTimes(2);
		expect(dialogElement().hasAttribute('open')).toBe(false);
		await vi.waitFor(() => expect(onclose).toHaveBeenCalledTimes(1));
	});

	it('closes when the platform closes it: the state follows the dialog', async () => {
		const onclose = vi.fn();
		const props = reactive<{ open: boolean | undefined; title: string; onclose: () => void }>({
			open: true,
			title: 'Delete site',
			onclose
		});
		render(Component, { props });
		dialogElement().close();
		await vi.waitFor(() => expect(props.open).toBe(false));
		expect(onclose).toHaveBeenCalledTimes(1);
	});

	it('can be opened again after the user closed it', async () => {
		const user = userEvent.setup();
		const props = reactive<{ open: boolean | undefined; title: string }>({ open: true, title: 'Delete site' });
		render(Component, { props });
		await user.click(screen.getByRole('button', { name: 'Close' }));
		expect(props.open).toBe(false);
		props.open = true;
		await vi.waitFor(() => expect(dialogElement().hasAttribute('open')).toBe(true));
	});

	it('a click on the backdrop (the dialog itself) closes it, a click inside does not', async () => {
		const onclose = vi.fn();
		render(Component, { ...base, open: true, onclose });
		await fireEvent.click(screen.getByText('my-site.example'));
		expect(dialogElement().hasAttribute('open')).toBe(true);
		expect(onclose).not.toHaveBeenCalled();
		await fireEvent.click(dialogElement());
		expect(dialogElement().hasAttribute('open')).toBe(false);
		expect(onclose).toHaveBeenCalledTimes(1);
	});

	it('ignores the backdrop when closeOnBackdrop is off', async () => {
		render(Component, { ...base, open: true, closeOnBackdrop: false });
		await fireEvent.click(dialogElement());
		expect(dialogElement().hasAttribute('open')).toBe(true);
	});

	it('dismissible=false hides the close button and keeps the dialog open for Escape and the backdrop', async () => {
		const user = userEvent.setup();
		const onclose = vi.fn();
		render(Component, { ...base, open: true, dismissible: false, onclose });
		expect(screen.queryByRole('button', { name: 'Close' })).toBeNull();
		expect(dialogElement().getAttribute('closedby')).toBe('none');
		await user.keyboard('{Escape}');
		await fireEvent.click(dialogElement());
		expect(dialogElement().hasAttribute('open')).toBe(true);
		expect(onclose).not.toHaveBeenCalled();
	});

	it('a custom close label names the close button', () => {
		render(Component, { ...base, open: true, closeLabel: 'Schliessen' });
		expect(screen.getByRole('button', { name: 'Schliessen' })).toBeTruthy();
	});

	it('moves focus into the dialog when it opens', () => {
		render(Component, { ...base, open: true });
		expect(dialogElement().contains(document.activeElement)).toBe(true);
	});

	it('initialFocus takes a selector looked up inside the dialog, or an element', () => {
		const children = createRawSnippet(() => ({
			render: () => '<div><button id="first">One</button><button id="second">Two</button></div>'
		}));
		const { unmount } = render(Component, { title: 'Pick', open: true, initialFocus: '#second', children });
		expect(document.activeElement?.id).toBe('second');
		unmount();
		const outside = document.createElement('button');
		document.body.append(outside);
		render(Component, { title: 'Pick', open: true, initialFocus: outside, children });
		expect(document.activeElement).toBe(outside);
		outside.remove();
	});

	it('an initialFocus selector that matches nothing or is invalid keeps the browser choice', () => {
		const children = createRawSnippet(() => ({ render: () => '<div><button id="first">One</button></div>' }));
		const { unmount } = render(Component, { title: 'Pick', open: true, initialFocus: '#missing', children });
		expect(dialogElement().contains(document.activeElement)).toBe(true);
		unmount();
		render(Component, { title: 'Pick', open: true, initialFocus: '###', children });
		expect(dialogElement().contains(document.activeElement)).toBe(true);
	});

	it('locks page scrolling while open and releases it on close and on unmount', async () => {
		const props = reactive<{ open: boolean | undefined; title: string }>({ open: true, title: 'Lock' });
		const { unmount } = render(Component, { props });
		const html = document.documentElement;
		expect(html.style.overflow).toBe('hidden');
		expect(html.getAttribute('data-k-scroll-lock')).toBe('1');
		props.open = false;
		await vi.waitFor(() => expect(html.style.overflow).toBe(''));
		expect(html.hasAttribute('data-k-scroll-lock')).toBe(false);
		props.open = true;
		await vi.waitFor(() => expect(html.style.overflow).toBe('hidden'));
		unmount();
		expect(html.style.overflow).toBe('');
		expect(html.hasAttribute('data-k-scroll-lock')).toBe(false);
	});

	it('two open dialogs share one lock that the last one releases', async () => {
		const first = render(Component, { title: 'A', open: true });
		const second = render(Component, { title: 'B', open: true });
		const html = document.documentElement;
		expect(html.getAttribute('data-k-scroll-lock')).toBe('2');
		first.unmount();
		expect(html.style.overflow).toBe('hidden');
		second.unmount();
		expect(html.style.overflow).toBe('');
	});
});

describe('Modal only', () => {
	it('describes the dialog with its description text', () => {
		render(Modal, { title: 'Delete site', description: 'This cannot be undone.', open: true });
		const dialog = screen.getByRole('dialog', { name: 'Delete site' });
		expect(dialog.getAttribute('aria-describedby')).toBe(screen.getByText('This cannot be undone.').id);
	});

	it('has no description reference without a description', () => {
		render(Modal, { title: 'Delete site', open: true });
		expect(dialogElement().hasAttribute('aria-describedby')).toBe(false);
	});

	it('alert makes it an alertdialog', () => {
		render(Modal, { title: 'Sure?', open: true, alert: true });
		expect(screen.getByRole('alertdialog', { name: 'Sure?' })).toBeTruthy();
	});

	it('sizes through data-size and renders no footer or body without content', () => {
		render(Modal, { title: 'Small', open: true, size: 'sm' });
		expect(dialogElement().getAttribute('data-size')).toBe('sm');
		expect(document.querySelector('footer')).toBeNull();
		expect(document.querySelector('.body')).toBeNull();
	});
});

describe('Drawer only', () => {
	it('slides in from the chosen side', () => {
		const { unmount } = render(Drawer, { title: 'Menu', open: true });
		expect(dialogElement().getAttribute('data-side')).toBe('right');
		unmount();
		render(Drawer, { title: 'Menu', open: true, side: 'left' });
		expect(dialogElement().getAttribute('data-side')).toBe('left');
	});
});
