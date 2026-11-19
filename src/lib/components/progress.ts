/** A usable maximum: a non-positive or non-finite `max` (or none) falls back to 100. */
export function normaliseMax(max: number | null | undefined): number {
	return typeof max === 'number' && Number.isFinite(max) && max > 0 ? max : 100;
}

/**
 * `value` clamped to [0, max] after `normaliseMax`; a non-finite value (NaN, ±Infinity) counts as 0,
 * so a bad input never draws a broken bar. `null`/`undefined` stay `undefined` (indeterminate).
 */
export function progressValue(value: number | null | undefined, max?: number | null): number | undefined {
	if (value === null || value === undefined) return undefined;
	const safeMax = normaliseMax(max);
	const safe = Number.isFinite(value) ? value : 0;
	return Math.min(Math.max(safe, 0), safeMax);
}

/** Share of `value` in `max` as a percentage in [0, 100]; `undefined` for an indeterminate bar. */
export function progressPercent(value: number | null | undefined, max?: number | null): number | undefined {
	const now = progressValue(value, max);
	return now === undefined ? undefined : (now / normaliseMax(max)) * 100;
}
