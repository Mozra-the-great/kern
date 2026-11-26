// The theme texts under the same strict flags (#185): the typed catalogue, the override API, the German bundle,
// and a compile error for a bundle that lacks a text.
import {
	THEME_TEXT_SETS,
	createThemeTextsStore,
	deThemeTexts,
	fillThemeText,
	getThemeTexts,
	getThemeTextsLang,
	registerThemeTexts,
	resetThemeTexts,
	setThemeTexts,
	setThemeTextsLocale,
	sharedThemeTextsStore,
	themeTexts,
	themeTextsEn,
	themeTextsLang
} from '@mozra-the-great/kern';
import type { ThemeTextSet, ThemeTexts, ThemeTextsBundle, ThemeTextsInput, ThemeTextsStore } from '@mozra-the-great/kern';

/** Props still win: a partial catalogue with values that may be undefined. */
export function configure(first: string | undefined, lang: string | undefined): ThemeTexts {
	const own: ThemeTextsInput = { lang, pride: { first, second: undefined }, advent: { second: first } };
	setThemeTexts(deThemeTexts, own);
	setThemeTexts();
	registerThemeTexts('fr', { lang: 'fr', winter: { first: 'Les jours rallongent.' } });
	registerThemeTexts('de', deThemeTexts);
	const found: boolean = setThemeTextsLocale(lang);
	resetThemeTexts();
	return found ? getThemeTexts() : { ...themeTextsEn };
}

export function language(): string | undefined {
	const bundle: ThemeTextsBundle = deThemeTexts;
	return getThemeTextsLang() ?? themeTextsLang() ?? bundle.lang;
}

export function isolatedStore(): ThemeTextsStore {
	const store = createThemeTextsStore();
	store.set([deThemeTexts, { lang: undefined }]);
	store.register('en', themeTextsEn);
	const off = store.subscribe(() => undefined);
	off();
	store.reset();
	return store.revision > 0 ? sharedThemeTextsStore() : store;
}

export function factsOf(set: ThemeTextSet, lit: number): readonly string[] {
	const facts = themeTexts()[set];
	return [facts.first, fillThemeText(facts.second, { lit, total: 4 })];
}

export const sets: readonly ThemeTextSet[] = THEME_TEXT_SETS;

// A bundle that lacks a text does not compile.
// @ts-expect-error `advent.second` is missing
export const incomplete: ThemeTextsBundle = { ...deThemeTexts, advent: { first: 'x' } };
