/*
 * Shared helpers of the effect components (Typewriter, Scramble, CountUp, Odometer,
 * Marquee, Reveal, Highlight, Terminal). Nothing here touches `window` at module
 * level, so the components stay SSR-safe.
 */

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

/** True when the user asks for less motion. False where `matchMedia` does not exist (SSR). */
export function prefersReducedMotion(): boolean {
	return typeof matchMedia === 'function' && matchMedia(REDUCED_MOTION).matches;
}

/**
 * Reactive `prefers-reduced-motion` flag. Call it while a component initialises.
 * Reading `.current` inside `$effect` re-runs the effect when the setting changes.
 */
export function useReducedMotion(): { readonly current: boolean } {
	let reduced = $state(prefersReducedMotion());
	$effect(() => {
		if (typeof matchMedia !== 'function') return;
		const query = matchMedia(REDUCED_MOTION);
		reduced = query.matches;
		const onChange = (): void => {
			reduced = query.matches;
		};
		query.addEventListener('change', onChange);
		return () => query.removeEventListener('change', onChange);
	});
	return {
		get current(): boolean {
			return reduced;
		}
	};
}

export interface InViewOptions {
	/** Share of the element that must be visible (0..1). */
	threshold?: number | undefined;
	rootMargin?: string | undefined;
}

/**
 * Calls `callback` whenever the element enters or leaves the viewport. Without
 * `IntersectionObserver` it reports "visible" once, so nothing stays hidden.
 * Returns the teardown.
 */
export function observeInView(el: Element, callback: (visible: boolean) => void, options: InViewOptions = {}): () => void {
	if (typeof IntersectionObserver === 'undefined') {
		callback(true);
		return () => {};
	}
	const observer = new IntersectionObserver(
		(entries) => {
			const last = entries[entries.length - 1];
			if (last) callback(last.isIntersecting);
		},
		{ threshold: options.threshold ?? 0, rootMargin: options.rootMargin ?? '0px' }
	);
	observer.observe(el);
	return () => observer.disconnect();
}

/** Splits text into user-perceived characters (emoji and combining marks stay whole). */
export function graphemes(text: string): string[] {
	if (typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function') {
		return Array.from(new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text), (s) => s.segment);
	}
	return Array.from(text);
}

/** `Intl.NumberFormat` that falls back to the default locale instead of throwing on bad input. */
export function makeNumberFormatter(locale: string | undefined, options: Intl.NumberFormatOptions | undefined): Intl.NumberFormat {
	try {
		return new Intl.NumberFormat(locale, options);
	} catch {
		return new Intl.NumberFormat();
	}
}

/**
 * Plain number formats show up to three decimals, which makes a counter between two whole
 * numbers flicker with fractions. For whole-number ranges without explicit fraction digits
 * this returns the options with `maximumFractionDigits: 0`.
 */
export function wholeNumberOptions(options: Intl.NumberFormatOptions | undefined, whole: boolean): Intl.NumberFormatOptions | undefined {
	if (!whole) return options;
	const style = options?.style ?? 'decimal';
	const plain = style === 'decimal' || style === 'unit';
	const notation = options?.notation ?? 'standard';
	const explicit =
		options?.maximumFractionDigits !== undefined ||
		options?.minimumFractionDigits !== undefined ||
		options?.maximumSignificantDigits !== undefined ||
		options?.minimumSignificantDigits !== undefined;
	if (!plain || notation !== 'standard' || explicit) return options;
	return { ...options, maximumFractionDigits: 0 };
}
