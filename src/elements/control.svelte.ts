/*
 * Shared runtime of the form wrappers (#31): native attribute pass-through, constraint
 * validation into ElementInternals, and `autofocus`. Call during component init (the
 * functions create effects).
 */
import { flushSync } from 'svelte';
import { BOOLEAN_ATTRS, type NativeAttr } from './native.js';
import type { FormHost } from './form.js';

export type ForwardedAttrs<N extends NativeAttr> = { [K in N]: string | true | undefined };

/**
 * Mirrors the named attributes of the host into a reactive record for `{...attrs.current}` on
 * the inner control. Every name is always present (undefined when the attribute is absent), so a
 * removed attribute is removed from the inner control too. Setting the matching DOM property on
 * the host (`el.title = …`) works for properties that reflect to their attribute; React 19 sets
 * unknown names (`maxlength`, `pattern` …) as attributes.
 */
export function forwardAttributes<const N extends NativeAttr>(
	host: HTMLElement,
	names: readonly N[]
): { readonly current: ForwardedAttrs<N> } {
	const read = (): ForwardedAttrs<N> => {
		const out = {} as ForwardedAttrs<N>;
		for (const name of names) {
			const v = host.getAttribute(name);
			out[name] = v === null ? undefined : BOOLEAN_ATTRS.includes(name) ? true : v;
		}
		return out;
	};
	let current = $state(read());
	$effect(() => {
		const observer = new MutationObserver(() => (current = read()));
		observer.observe(host, { attributes: true, attributeFilter: [...names] });
		current = read();
		return () => observer.disconnect();
	});
	return {
		get current() {
			return current;
		}
	};
}

type ConstraintControl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
export type ProbeAttrs = Record<string, string | number | boolean | null | undefined>;

export interface FormControlConfig {
	/** Element the browser's message bubble points at and `reportValidity()` focuses; also gets `autofocus`. */
	anchor: () => HTMLElement | null | undefined;
	/** Mirror this native control's ValidityState as it is (it carries the constraints itself). */
	control?: () => ConstraintControl | null | undefined;
	/**
	 * Or: check the value on a detached <input> with these attributes, for controls whose inner
	 * element cannot express the constraint (a text field that holds a number or date, groups).
	 * The browser then also supplies its own, localised message.
	 */
	probe?: () => { attrs: ProbeAttrs; value: string };
	/** Reactive reads that should re-check validity when they change (value, required …). */
	watch?: () => unknown;
	/** A disabled control is barred from constraint validation. */
	disabled?: () => boolean;
}

const FLAGS = [
	'valueMissing',
	'typeMismatch',
	'patternMismatch',
	'tooLong',
	'tooShort',
	'rangeUnderflow',
	'rangeOverflow',
	'stepMismatch',
	'badInput'
] as const;

function readValidity(el: ConstraintControl | null | undefined): { flags: ValidityStateFlags; message: string } {
	const flags: ValidityStateFlags = {};
	if (!el || !el.willValidate) return { flags, message: '' };
	for (const f of FLAGS) if (el.validity[f]) flags[f] = true;
	return { flags, message: el.validationMessage };
}

function probeControl({ attrs, value }: { attrs: ProbeAttrs; value: string }): HTMLInputElement | null {
	const el = document.createElement('input');
	for (const [k, v] of Object.entries(attrs)) {
		if (v === null || v === undefined || v === false) continue;
		el.setAttribute(k, v === true ? '' : String(v));
	}
	// A radio without a name forms no group and is never "missing".
	if (el.type === 'radio' && !el.name) el.name = 'kern-probe';
	if (el.type === 'checkbox' || el.type === 'radio') el.checked = value !== '';
	// A file input's files cannot be set; a non-empty value means "has files", which is valid.
	else if (el.type === 'file') return value === '' ? el : null;
	else el.value = value;
	return el;
}

/**
 * Keeps the host's ElementInternals validity in step with the inner control (`required`,
 * `pattern`, `minlength`, `maxlength`, `min`, `max`, `step` …), so `form.checkValidity()`,
 * `form.reportValidity()`, `:invalid`/`:user-invalid` and the submit-time check work like
 * on native fields. Also honours `autofocus` on the host and `setCustomValidity()`.
 */
export function formControl(host: HTMLElement, config: FormControlConfig): void {
	const internals = (host as FormHost).internals;
	let queued = false;

	function update() {
		queued = false;
		if (!internals) return;
		if (config.disabled?.()) {
			internals.setValidity({});
			return;
		}
		const { flags, message: native } = config.control
			? readValidity(config.control())
			: config.probe
				? readValidity(probeControl(config.probe()))
				: { flags: {}, message: '' };
		let message = native;
		const custom = (host as FormHost).kernCustomValidity ?? '';
		if (custom) {
			flags.customError = true;
			message = custom;
		}
		if (Object.keys(flags).length === 0) {
			internals.setValidity({});
			return;
		}
		// setValidity needs a non-empty message while a flag is set.
		const text = message || 'Invalid value.';
		const anchor = config.anchor() ?? undefined;
		try {
			internals.setValidity(flags, text, anchor);
		} catch {
			internals.setValidity(flags, text);
		}
	}
	function schedule() {
		if (queued) return;
		queued = true;
		queueMicrotask(() => {
			if (queued) update();
		});
	}
	(host as FormHost).kernSyncValidity = () => {
		try {
			flushSync();
		} catch {
			// Called while Svelte is flushing (e.g. from an effect): the state is current anyway.
		}
		update();
	};

	$effect(() => {
		config.watch?.();
		config.disabled?.();
		config.probe?.();
		schedule();
	});
	$effect(() => {
		const root = host.shadowRoot;
		// Typing, and attribute changes on the inner control (forwarded `pattern`, `required` …).
		root?.addEventListener('input', schedule);
		root?.addEventListener('change', schedule);
		host.addEventListener('k-validate', schedule);
		const observer = new MutationObserver(schedule);
		if (root)
			observer.observe(root, {
				attributes: true,
				subtree: true,
				attributeFilter: ['required', 'pattern', 'minlength', 'maxlength', 'min', 'max', 'step', 'type', 'disabled', 'readonly']
			});
		return () => {
			root?.removeEventListener('input', schedule);
			root?.removeEventListener('change', schedule);
			host.removeEventListener('k-validate', schedule);
			observer.disconnect();
		};
	});
	$effect(() => {
		if (!host.hasAttribute('autofocus')) return;
		queueMicrotask(() => config.anchor()?.focus());
	});
}

/** First element in the host's shadow root that matches `selector`. */
// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters -- callers name the element type they expect
export function inShadow<E extends Element>(host: HTMLElement, selector: string): E | null {
	return host.shadowRoot?.querySelector<E>(selector) ?? null;
}
