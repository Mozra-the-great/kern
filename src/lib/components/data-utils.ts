/** Replaces `{name}` placeholders in a text template. Unknown placeholders stay as they are. */
export function fill(template: string, vars: Record<string, string | number>): string {
	return template.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}

/**
 * Horizontal centre and top edge of `target`, relative to `wrap`. The centre is
 * clamped so a tooltip of `tipWidth` stays inside `wrap` (centred if it is wider).
 */
export function tipAnchor(wrap: HTMLElement, target: HTMLElement, tipWidth: number): { x: number; y: number } {
	const w = wrap.getBoundingClientRect();
	const t = target.getBoundingClientRect();
	const half = tipWidth / 2;
	const centre = t.left - w.left + t.width / 2;
	const x = tipWidth >= w.width ? w.width / 2 : Math.max(half, Math.min(w.width - half, centre));
	return { x, y: t.top - w.top };
}

/** Number formatter that never throws on a bad locale tag. */
export function numberFormat(locale: string | undefined, options?: Intl.NumberFormatOptions): Intl.NumberFormat {
	try {
		return new Intl.NumberFormat(locale, options);
	} catch {
		return new Intl.NumberFormat(undefined, options);
	}
}

/** Date formatter that never throws on a bad locale tag. */
export function dateFormat(locale: string | undefined, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
	try {
		return new Intl.DateTimeFormat(locale, options);
	} catch {
		return new Intl.DateTimeFormat(undefined, options);
	}
}

/**
 * `defaults` with every key of `overrides` whose value is not `undefined`. Unlike a spread, an
 * explicit `undefined` (allowed for optional fields) keeps the default instead of replacing it.
 */
export function withDefaults<T extends object>(defaults: T, overrides: { [K in keyof T]?: T[K] | undefined } | undefined): T {
	const out = { ...defaults };
	if (!overrides) return out;
	for (const key of Object.keys(overrides) as (keyof T)[]) {
		const value = overrides[key];
		if (value !== undefined) out[key] = value;
	}
	return out;
}

/** Space-separated id list for `aria-describedby`, without empty or repeated ids; `undefined` when none is left. */
export function joinIds(...ids: readonly (string | null | undefined)[]): string | undefined {
	const present: string[] = [];
	for (const list of ids) for (const id of (list ?? '').split(/\s+/)) if (id !== '' && !present.includes(id)) present.push(id);
	return present.length ? present.join(' ') : undefined;
}
