/** A form-associated kern host: `formAssociated()` attaches the internals in its constructor. */
export interface FormHost extends HTMLElement {
	internals?: ElementInternals | undefined;
	/** Message set with `setCustomValidity()`; '' when none. */
	kernCustomValidity?: string | undefined;
	/** Set by `formControl()`: applies pending prop changes and recomputes the validity now. */
	kernSyncValidity?: (() => void) | undefined;
}

/**
 * Makes a Svelte custom element take part in <form>: value, reset, validity. The host gets the
 * same validation API as a native control (`form`, `validity`, `checkValidity()` …); the wrapper
 * fills in the validity with `formControl()` from control.svelte.ts.
 */
export function formAssociated(Base: typeof HTMLElement) {
	return class extends Base implements FormHost {
		static formAssociated = true;
		internals: ElementInternals;
		kernCustomValidity = '';
		// Assigned later by `formControl()`; `declare` emits no field, so nothing resets it.
		declare kernSyncValidity?: (() => void) | undefined;
		constructor() {
			super();
			this.internals = this.attachInternals();
		}
		formResetCallback() {
			this.dispatchEvent(new CustomEvent('k-reset'));
		}
		get form(): HTMLFormElement | null {
			return this.internals.form;
		}
		/**
		 * Native `form` is read-only; the attribute names the owner by id. A framework that sets props
		 * (React 19 sets `form="id"` as a property because the element has one) would throw on a getter without setter.
		 */
		set form(owner: HTMLFormElement | string | null | undefined) {
			const id = owner instanceof HTMLFormElement ? owner.id : owner;
			if (!id) this.removeAttribute('form');
			else this.setAttribute('form', id);
		}
		get labels(): NodeList {
			return this.internals.labels;
		}
		// Reads through the element are current even right after `el.value = …` in the same task.
		get validity(): ValidityState {
			this.kernSyncValidity?.();
			return this.internals.validity;
		}
		get validationMessage(): string {
			this.kernSyncValidity?.();
			return this.internals.validationMessage;
		}
		get willValidate(): boolean {
			return this.internals.willValidate;
		}
		checkValidity(): boolean {
			this.kernSyncValidity?.();
			return this.internals.checkValidity();
		}
		reportValidity(): boolean {
			this.kernSyncValidity?.();
			return this.internals.reportValidity();
		}
		/** Like the native method: a non-empty message makes the element invalid (`customError`). */
		setCustomValidity(message: string): void {
			// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-conversion -- plain-JS callers may pass anything, like the native method
			this.kernCustomValidity = String(message ?? '');
			this.dispatchEvent(new CustomEvent('k-validate'));
		}
	};
}

/** Sets the form value of the host element, if it is form-associated. */
export function setFormValue(host: HTMLElement, value: string | FormData | null) {
	(host as FormHost).internals?.setFormValue(value);
}

/**
 * Dispatches a bubbling, composed event from the host element. With `cancelable`, returns false
 * when a listener called `preventDefault()`.
 */
export function emit(host: HTMLElement, type: string, detail?: unknown, cancelable = false): boolean {
	return host.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, composed: true, cancelable }));
}

/** True when the host has light-DOM children assigned to the named slot. */
export function hasSlot(host: HTMLElement, name: string) {
	return !!host.querySelector(`:scope > [slot="${name}"]`);
}
