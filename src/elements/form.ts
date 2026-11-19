/** A form-associated kern host: `formAssociated()` attaches the internals in its constructor. */
export interface FormHost extends HTMLElement {
	internals?: ElementInternals;
	/** Message set with `setCustomValidity()`; '' when none. */
	kernCustomValidity?: string;
	/** Set by `formControl()`: applies pending prop changes and recomputes the validity now. */
	kernSyncValidity?: () => void;
}

/**
 * Makes a Svelte custom element take part in <form>: value, reset, validity. The host gets the
 * same validation API as a native control (`form`, `validity`, `checkValidity()` …); the wrapper
 * fills in the validity with `formControl()` from control.svelte.ts.
 */
export function formAssociated(Base: any) {
	return class extends Base {
		static formAssociated = true;
		internals: ElementInternals;
		kernCustomValidity = '';
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
			this.kernCustomValidity = String(message ?? '');
			this.dispatchEvent(new CustomEvent('k-validate'));
		}
	};
}

/** Sets the form value of the host element, if it is form-associated. */
export function setFormValue(host: HTMLElement, value: string | FormData | null) {
	(host as FormHost).internals?.setFormValue(value);
}

/** Dispatches a bubbling, composed event from the host element. */
export function emit(host: HTMLElement, type: string, detail?: unknown) {
	host.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, composed: true }));
}

/** True when the host has light-DOM children assigned to the named slot. */
export function hasSlot(host: HTMLElement, name: string) {
	return !!host.querySelector(`:scope > [slot="${name}"]`);
}
