/*
 * Native attributes that form wrappers pass on to the control inside their shadow root.
 * One list per kind of control; the wrapper names its list in `forwardAttributes(host, LIST)`.
 * scripts/elements-manifest.mjs reads these lists (plain `export const NAME = [...]`) for
 * custom-elements.json and the typings, so keep them literal arrays of strings.
 *
 * Not forwarded on purpose:
 * - `autofocus`: handled by `formControl()` for every form element (focuses the inner control).
 * - `form`, `disabled`, `name`: the form-associated host handles them natively (ElementInternals).
 * - IDREF attributes (`aria-labelledby`, `aria-describedby`, `list`): ids do not resolve across
 *   the shadow boundary. Use the `label` / `hint` / `error` props instead.
 * - `multiple` on <k-select>: the value is one string; use <k-tag-input> or checkboxes.
 */

export type NativeAttr =
	| 'maxlength'
	| 'minlength'
	| 'pattern'
	| 'readonly'
	| 'required'
	| 'autocomplete'
	| 'autocapitalize'
	| 'spellcheck'
	| 'enterkeyhint'
	| 'min'
	| 'max'
	| 'step'
	| 'size'
	| 'multiple'
	| 'cols'
	| 'wrap'
	| 'title'
	| 'aria-label'
	| 'aria-description';

/** Attributes that are switched on by presence (`readonly`, `readonly=""`); all others carry text. */
export const BOOLEAN_ATTRS: readonly NativeAttr[] = ['readonly', 'required', 'multiple'];

export const INPUT_ATTRS = ['maxlength', 'minlength', 'pattern', 'readonly', 'autocapitalize', 'spellcheck', 'enterkeyhint', 'min', 'max', 'step', 'size', 'multiple', 'title', 'aria-label', 'aria-description'] as const satisfies readonly NativeAttr[];

export const TEXTAREA_ATTRS = ['maxlength', 'minlength', 'readonly', 'autocomplete', 'autocapitalize', 'spellcheck', 'enterkeyhint', 'cols', 'wrap', 'title', 'aria-label', 'aria-description'] as const satisfies readonly NativeAttr[];

export const SELECT_ATTRS = ['size', 'autocomplete', 'title', 'aria-label', 'aria-description'] as const satisfies readonly NativeAttr[];

export const CHECK_ATTRS = ['title', 'aria-label', 'aria-description'] as const satisfies readonly NativeAttr[];

export const SWITCH_ATTRS = ['required', 'title', 'aria-label', 'aria-description'] as const satisfies readonly NativeAttr[];

export const SLIDER_ATTRS = ['title', 'aria-label', 'aria-description'] as const satisfies readonly NativeAttr[];
