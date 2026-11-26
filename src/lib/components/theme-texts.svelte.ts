import { resolveThemeTexts, sharedThemeTextsStore, type ThemeTexts } from './theme-texts.js';

/*
 * Reactive view of the shared theme-texts store (see theme-texts.ts). Every copy of this module mirrors
 * the store into its own state, so `setThemeTexts()` from either build updates what is rendered. Read it
 * inside `$derived` (`const facts = $derived(themeTexts().easter)`): a language change then reaches
 * everything already on the page.
 */
const store = sharedThemeTextsStore();
let current: ThemeTexts = $state.raw(resolveThemeTexts(store));
let lang: string | undefined = $state.raw(store.lang);
store.subscribe(() => {
	current = resolveThemeTexts(store);
	lang = store.lang;
});

/** The theme texts in use (English with the consumer's choice on top). Reactive. */
export function themeTexts(): ThemeTexts {
	return current;
}

/** The BCP 47 tag of the bundle the consumer chose, or `undefined`. Reactive. */
export function themeTextsLang(): string | undefined {
	return lang;
}
