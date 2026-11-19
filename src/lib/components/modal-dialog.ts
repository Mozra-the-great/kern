/*
 * The shared behaviour of Modal and Drawer around a native modal <dialog>: open/close in step with
 * the `open` prop, the page scroll lock, initial focus, the cancelable close request and the
 * difference between a close by the user (reported) and a close by the app (silent, #75).
 */
import { lockScroll } from './scroll-lock.js';

export interface ModalDialogHooks {
	/** Current value of the `dismissible` prop. */
	dismissible(): boolean;
	/** Current value of the `initialFocus` prop. */
	initialFocus(): string | HTMLElement | undefined;
	/** The user asked to close; `event.preventDefault()` keeps the dialog open. */
	cancel(event: Event): void;
	/** The user closed the dialog (Escape, close button, backdrop, `<form method="dialog">`). */
	closed(): void;
}

/** Moves focus to `target`: an element, or a selector looked up in the dialog, then in the light DOM of a shadow host. */
export function focusInitial(dialog: HTMLDialogElement, target: string | HTMLElement | undefined): void {
	if (target === undefined || target === '') return;
	let el: Element | null = typeof target === 'string' ? null : target;
	if (typeof target === 'string') {
		try {
			el = dialog.querySelector(target);
			const root = dialog.getRootNode();
			if (!el && root instanceof ShadowRoot) el = root.host.querySelector(target);
		} catch {
			// not a valid selector: keep the browser's choice
		}
	}
	if (el instanceof HTMLElement || el instanceof SVGElement) el.focus();
}

export class ModalDialog {
	#hooks: ModalDialogHooks;
	#dialog: HTMLDialogElement | undefined;
	#release: (() => void) | undefined;
	/** Last `open` value the component asked for. */
	#wanted = false;
	/** A close the dialog could not refuse (an uncancelable `cancel`) that has to be undone. */
	#keepOpen = false;
	/** Close events still to come for closes that are already handled (by the user or by the app). */
	#skip = 0;

	constructor(hooks: ModalDialogHooks) {
		this.#hooks = hooks;
	}

	/** Keeps the native dialog in step with `open`. Call from an effect that reads both. */
	sync(dialog: HTMLDialogElement, open: boolean): void {
		this.#dialog = dialog;
		this.#wanted = open;
		if (open && !dialog.open) {
			dialog.showModal();
			this.#release ??= lockScroll();
			focusInitial(dialog, this.#hooks.initialFocus());
		} else if (!open && dialog.open) {
			// Closed by the app: no `close` callback (events are for user input only).
			this.#skip++;
			dialog.close();
			this.#unlock();
		}
	}

	/** A close request by the user (close button, backdrop); true when the dialog closed. */
	requestClose(): boolean {
		const dialog = this.#dialog;
		if (!this.#hooks.dismissible() || !dialog?.open) return false;
		const event = new Event('cancel', { cancelable: true });
		this.#hooks.cancel(event);
		if (event.defaultPrevented) return false;
		dialog.close();
		// The close event comes a task later; report now so the app can reopen right away.
		this.#skip++;
		this.#finish();
		return true;
	}

	/** Handler for the dialog's native `cancel` event (Escape, close requests of the platform). */
	oncancel = (e: Event): void => {
		e.preventDefault();
		// Browsers ignore preventDefault() on a cancel without user activation; reopen after that close.
		if (!this.requestClose() && !e.cancelable) this.#keepOpen = true;
	};

	/** Handler for the dialog's native `close` event. */
	onclose = (): void => {
		const dialog = this.#dialog;
		if (this.#keepOpen) {
			this.#keepOpen = false;
			if (dialog && this.#wanted && !dialog.open) {
				dialog.showModal();
				return;
			}
		}
		if (this.#skip > 0) {
			this.#skip--;
			return;
		}
		// Reopened before this close event arrived: nothing to report.
		if (dialog?.open) return;
		// The app had already asked for it to be closed: nothing to report either.
		if (!this.#wanted) {
			this.#unlock();
			return;
		}
		// Closed by the user without a request first, e.g. a <form method="dialog"> button.
		this.#finish();
	};

	/** Releases the scroll lock; call when the component is destroyed. */
	destroy(): void {
		this.#unlock();
	}

	#finish(): void {
		this.#unlock();
		this.#wanted = false;
		this.#hooks.closed();
	}

	#unlock(): void {
		this.#release?.();
		this.#release = undefined;
	}
}
