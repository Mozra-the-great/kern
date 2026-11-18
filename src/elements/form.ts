/** Makes a Svelte custom element take part in <form>: value, reset, validity. */
export function formAssociated(Base: any) {
	return class extends Base {
		static formAssociated = true;
		internals: ElementInternals;
		constructor() {
			super();
			this.internals = this.attachInternals();
		}
		formResetCallback() {
			this.dispatchEvent(new CustomEvent('k-reset'));
		}
	};
}

/** Sets the form value of the host element, if it is form-associated. */
export function setFormValue(host: HTMLElement, value: string | null) {
	(host as any).internals?.setFormValue(value);
}

/** Dispatches a bubbling, composed event from the host element. */
export function emit(host: HTMLElement, type: string, detail?: unknown) {
	host.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, composed: true }));
}

/** True when the host has light-DOM children assigned to the named slot. */
export function hasSlot(host: HTMLElement, name: string) {
	return !!host.querySelector(`:scope > [slot="${name}"]`);
}
