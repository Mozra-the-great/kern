import { resolveStrings, sharedStringsStore, type KernStrings } from './strings.js';

/*
 * Reactive view of the shared strings store (see strings.ts). Every copy of this module mirrors the
 * store into its own state, so `setStrings()` from either build updates the components of both.
 * The components read `strings()` inside `$derived`, so a language change reaches those already
 * rendered.
 */
const store = sharedStringsStore();
let current: KernStrings = $state.raw(resolveStrings(store));
let lang: string | undefined = $state.raw(store.lang);
store.subscribe(() => {
	current = resolveStrings(store);
	lang = store.lang;
});

/** The texts in use (English with the consumer's choice on top). Reactive. */
export function strings(): KernStrings {
	return current;
}

/**
 * `locale` when it is set, else the tag of the bundle the consumer chose with `setStrings` or
 * `setLocale`, else `undefined` (the browser's format). Reactive.
 */
export function formatLocale(locale: string | undefined): string | undefined {
	return locale ?? lang;
}
