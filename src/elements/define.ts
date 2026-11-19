/*
 * Tag registration (#33). The wrappers carry no `tag` in <svelte:options>, so Svelte does not
 * call customElements.define itself; every entry point registers through `define()`.
 *
 * Collision policy: the `k-` prefix is reserved for kern and fixed (Svelte compiles the
 * element classes once; a class can be registered under one name only). `define()` is
 * idempotent: loading two entry points, or two copies of kern, registers each tag once and
 * the first registration wins. If another library already owns a `k-*` tag, kern leaves it
 * alone and warns once in the console.
 */
const MARK = Symbol.for('kern.element');

/** The Svelte component of a wrapper; `.element` is the class Svelte builds for it. */
export interface ElementComponent {
	element?: CustomElementConstructor;
}

/** `KDatePicker` → `k-date-picker`. */
export function tagOf(componentName: string): string {
	return componentName.replace(/^K/, 'k').replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
}

export function define(tag: string, component: ElementComponent): void {
	if (typeof customElements === 'undefined') return;
	const ctor = component.element;
	if (!ctor) throw new Error(`kern: ${tag} was not compiled as a custom element.`);
	const existing = customElements.get(tag);
	if (existing) {
		if (!(MARK in existing)) console.warn(`kern: <${tag}> is already defined by another library; kern did not register its own.`);
		return;
	}
	Object.defineProperty(ctor, MARK, { value: true });
	customElements.define(tag, ctor);
}
