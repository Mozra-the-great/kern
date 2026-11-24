/**
 * modal-dialog.ts, the shared core of Modal and Drawer, driven directly: `focusInitial` (element, selector in
 * the dialog or in the light DOM of a shadow host, invalid selector), `sync` with the scroll lock, user close
 * requests (`dismissible`, vetoed `cancel`), the native `cancel` and `close` events (skipped closes, a reopen
 * after an uncancelable cancel, a close the app already wanted, a form close) and `destroy`.
 * The component level is tests/dom/modal.test.ts.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ModalDialog, focusInitial, type ModalDialogHooks } from '../../src/lib/components/modal-dialog.js';
import { flush } from './helpers.js';

const html = document.documentElement;

function setup(options: { dismissible?: boolean; initialFocus?: string | HTMLElement; veto?: boolean } = {}): {
	dialog: HTMLDialogElement;
	modal: ModalDialog;
	hooks: { cancel: ReturnType<typeof vi.fn>; closed: ReturnType<typeof vi.fn> };
} {
	const dialog = document.createElement('dialog');
	dialog.innerHTML = '<button id="first">First</button><button id="second">Second</button>';
	document.body.append(dialog);
	const cancel = vi.fn((event: Event) => {
		if (options.veto) event.preventDefault();
	});
	const closed = vi.fn();
	const hooks: ModalDialogHooks = {
		dismissible: () => options.dismissible ?? true,
		initialFocus: () => options.initialFocus,
		cancel,
		closed
	};
	const modal = new ModalDialog(hooks);
	dialog.addEventListener('cancel', modal.oncancel);
	dialog.addEventListener('close', modal.onclose);
	return { dialog, modal, hooks: { cancel, closed } };
}

afterEach(() => {
	document.body.replaceChildren();
	html.removeAttribute('style');
	html.removeAttribute('data-k-scroll-lock');
	html.removeAttribute('data-k-scroll-lock-prev');
});

describe('focusInitial', () => {
	it('focuses an element or the first match of a selector in the dialog', () => {
		const { dialog } = setup();
		dialog.setAttribute('open', '');
		focusInitial(dialog, '#second');
		expect(document.activeElement?.id).toBe('second');
		const first = dialog.querySelector<HTMLElement>('#first');
		focusInitial(dialog, first ?? undefined);
		expect(document.activeElement?.id).toBe('first');
	});

	it('ignores undefined, an empty or invalid selector and a selector without a match', () => {
		const { dialog } = setup();
		dialog.setAttribute('open', '');
		const first = dialog.querySelector<HTMLElement>('#first');
		first?.focus();
		focusInitial(dialog, undefined);
		focusInitial(dialog, '');
		focusInitial(dialog, '[[nope');
		focusInitial(dialog, '#missing');
		expect(document.activeElement).toBe(first);
	});

	it('focuses an SVG element', () => {
		const { dialog } = setup();
		const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		svg.setAttribute('tabindex', '0');
		dialog.append(svg);
		// jsdom does not move focus to SVG; the call is what matters.
		const focus = vi.spyOn(svg, 'focus');
		focusInitial(dialog, svg as unknown as HTMLElement);
		expect(focus).toHaveBeenCalledTimes(1);
	});

	it('inside a shadow root looks in the light DOM of the host', () => {
		const host = document.createElement('div');
		const slotted = document.createElement('input');
		slotted.id = 'slotted';
		host.append(slotted);
		document.body.append(host);
		const root = host.attachShadow({ mode: 'open' });
		const dialog = document.createElement('dialog');
		root.append(dialog);
		// jsdom does not focus an unslotted light-DOM child; the call is what matters.
		const focus = vi.spyOn(slotted, 'focus');
		focusInitial(dialog, '#slotted');
		expect(focus).toHaveBeenCalledTimes(1);
		focusInitial(dialog, '#nowhere');
		expect(focus).toHaveBeenCalledTimes(1);
	});
});

describe('ModalDialog', () => {
	it('sync opens with the scroll lock and initial focus, an app close is silent', async () => {
		const { dialog, modal, hooks } = setup({ initialFocus: '#second' });
		modal.sync(dialog, true);
		expect(dialog.open).toBe(true);
		expect(document.activeElement?.id).toBe('second');
		expect(html.style.overflow).toBe('hidden');
		modal.sync(dialog, true);
		expect(html.getAttribute('data-k-scroll-lock')).toBe('1');
		modal.sync(dialog, false);
		expect(dialog.open).toBe(false);
		expect(html.style.overflow).toBe('');
		await flush();
		expect(hooks.closed).not.toHaveBeenCalled();
		modal.sync(dialog, false);
	});

	it('requestClose closes and reports once; the close event that follows is skipped', async () => {
		const { dialog, modal, hooks } = setup();
		expect(modal.requestClose()).toBe(false);
		modal.sync(dialog, true);
		expect(modal.requestClose()).toBe(true);
		expect(hooks.cancel).toHaveBeenCalledTimes(1);
		expect(hooks.closed).toHaveBeenCalledTimes(1);
		expect(html.style.overflow).toBe('');
		await flush();
		expect(hooks.closed).toHaveBeenCalledTimes(1);
		expect(modal.requestClose()).toBe(false);
	});

	it('requestClose is refused when not dismissible or vetoed', () => {
		const fixed = setup({ dismissible: false });
		fixed.modal.sync(fixed.dialog, true);
		expect(fixed.modal.requestClose()).toBe(false);
		expect(fixed.dialog.open).toBe(true);
		fixed.modal.destroy();
		const vetoed = setup({ veto: true });
		vetoed.modal.sync(vetoed.dialog, true);
		expect(vetoed.modal.requestClose()).toBe(false);
		expect(vetoed.hooks.cancel).toHaveBeenCalledTimes(1);
		expect(vetoed.dialog.open).toBe(true);
		vetoed.modal.destroy();
	});

	it('Escape is a close request: closes when dismissible', async () => {
		const { dialog, modal, hooks } = setup();
		modal.sync(dialog, true);
		dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
		expect(dialog.open).toBe(false);
		await flush();
		expect(hooks.closed).toHaveBeenCalledTimes(1);
	});

	it('reopens after an uncancelable cancel the app refused', async () => {
		const { dialog, modal, hooks } = setup({ dismissible: false });
		modal.sync(dialog, true);
		dialog.dispatchEvent(new Event('cancel', { cancelable: false }));
		// The browser closes anyway.
		dialog.close();
		await flush();
		expect(dialog.open).toBe(true);
		expect(hooks.closed).not.toHaveBeenCalled();
		modal.destroy();
	});

	it('an uncancelable cancel that is refused while the app no longer wants it open is reported like a user close', async () => {
		const { dialog, modal, hooks } = setup({ dismissible: false });
		modal.sync(dialog, true);
		dialog.dispatchEvent(new Event('cancel', { cancelable: false }));
		dialog.close();
		modal.sync(dialog, false);
		await flush();
		expect(dialog.open).toBe(false);
		expect(hooks.closed).not.toHaveBeenCalled();
	});

	it('a cancelable refused cancel does not reopen anything', async () => {
		const { dialog, modal, hooks } = setup({ dismissible: false });
		modal.sync(dialog, true);
		dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
		expect(dialog.open).toBe(true);
		dialog.close();
		await flush();
		expect(dialog.open).toBe(false);
		expect(hooks.closed).toHaveBeenCalledTimes(1);
	});

	it('reports a close by a form button, but not one that was reopened in between', async () => {
		const { dialog, modal, hooks } = setup();
		modal.sync(dialog, true);
		dialog.close();
		dialog.showModal();
		await flush();
		expect(hooks.closed).not.toHaveBeenCalled();
		dialog.close();
		await flush();
		expect(hooks.closed).toHaveBeenCalledTimes(1);
		expect(html.style.overflow).toBe('');
	});

	it('a close event the app already asked for only releases the lock', async () => {
		const { dialog, modal, hooks } = setup();
		modal.sync(dialog, true);
		modal.sync(dialog, false);
		dialog.showModal();
		dialog.close();
		await flush();
		await flush();
		expect(hooks.closed).not.toHaveBeenCalled();
		expect(html.style.overflow).toBe('');
	});

	it('onclose without a synced dialog reports nothing harmful', () => {
		const modal = new ModalDialog({ dismissible: () => true, initialFocus: () => undefined, cancel: () => undefined, closed: vi.fn() });
		expect(() => modal.onclose()).not.toThrow();
		expect(() => modal.destroy()).not.toThrow();
	});

	it('destroy releases the scroll lock', () => {
		const { dialog, modal } = setup();
		modal.sync(dialog, true);
		modal.destroy();
		expect(html.style.overflow).toBe('');
	});
});
