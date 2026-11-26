import { fill } from './data-utils.js';
import { createStringsStore, isStringsStore, resolveInto, type StringsStore } from './strings.js';

/*
 * The theme texts (#185): the short, positive facts a theme button shows while a season or special-day
 * set is active (`winter`, `easter`, `advent` …). They are not component defaults, so they are not part
 * of the catalogue in strings.ts (a component never reads them): a separate catalogue with the same
 * rules. Typed keys, English built in, a complete German bundle in theme-texts-de.ts (a missing text does
 * not compile), a runtime override (`setThemeTexts`), a reactive read for Svelte (theme-texts.svelte.ts)
 * and one state per page on `globalThis[Symbol.for('kern.themeTexts')]`, like the strings and the toast
 * queue. Nothing here touches `window` or `document`, so the module is safe on the server.
 *
 * Voice: positive and factual, no marketing copy, no claim about the product that shows them (what an
 * app promises about itself belongs into the app's own override). The texts are plain text, never
 * markup, and no mascot speaks them (mascots never speak). A text with `{name}` placeholders keeps them
 * in every translation; fill it with `fillThemeText`.
 */

const catalogue = {
	winter: {
		first: 'From Dec 21 the days get longer again.',
		second: 'Hedgehogs sleep through the cold months.'
	},
	newYear: {
		first: 'Happy New Year! A good moment to tidy up.',
		second: 'People celebrate it with very different traditions around the world.'
	},
	valentine: {
		first: 'A day to tell people you care about them. Friends and family count too.',
		second: 'Pixel hearts are free for everyone.'
	},
	carnival: {
		first: 'A time for costumes, music and laughing together.',
		second: 'It runs from Weiberfastnacht to Shrove Tuesday, shortly before Lent.'
	},
	womensDay: {
		first: "International Women's Day on March 8 celebrates women's achievements around the world.",
		second: 'It has been observed since the early 1900s.'
	},
	earthDay: {
		first: 'Earth Day on April 22 started in 1970 and is celebrated worldwide.',
		second: 'Small things add up: every bit of saved energy counts.'
	},
	easter: {
		first: 'Eggs are an old symbol of new life and spring.',
		second: 'Decorating eggs is a tradition in many countries.'
	},
	europeDay: {
		first: 'May 9 recalls the Schuman Declaration of 1950, the start of European cooperation.',
		second: 'The twelve stars on the flag stand for unity, not for a number of countries.'
	},
	pride: {
		first: "Pride celebrates everyone's right to be who they are and love who they love.",
		second: 'Everyone is welcome.'
	},
	autumn: {
		first: 'Leaves turn red and orange when the green pigment fades and the other colours show.',
		second: 'A good season for cosy projects.'
	},
	unityDay: {
		first: 'October 3 marks German reunification in 1990.',
		second: 'A day for celebrating what connects people.'
	},
	harvest: {
		first: 'A day to say thank you for the harvest and for what we have.',
		second: 'Apples, wheat and pumpkins are typical harvest symbols.'
	},
	halloween: {
		first: 'A time for costumes and carving pumpkins.',
		second: 'No tricks here, only decoration.'
	},
	stNicholas: {
		first: 'On December 6 children put out a boot and find small treats such as nuts and tangerines.',
		second: 'Nicholas of Myra is remembered for helping people in need.'
	},
	humanRightsDay: {
		first: 'December 10 marks the day in 1948 when the Universal Declaration of Human Rights was adopted.',
		second: 'Article 1: all human beings are born free and equal in dignity and rights.'
	},
	advent: {
		first: 'Advent counts down to Christmas: one more candle is lit each Sunday.',
		/** `{lit}` (candles lit today) and `{total}` (always four) are replaced: "Today: 3 of 4 candles." */
		second: 'Today: {lit} of {total} candles.'
	},
	christmas: {
		first: 'A time to be with the people you care about.',
		second: 'The snow is only decoration.'
	}
};

/** Every theme text, by set and slot (`first`, `second`). All values are strings. */
export type ThemeTexts = typeof catalogue;

/** The id of a season or special-day set; the key of its two texts. */
export type ThemeTextSet = keyof ThemeTexts;

/** A complete set of theme texts for one language. `lang` is its BCP 47 tag. */
export interface ThemeTextsBundle extends ThemeTexts {
	lang: string;
}

type DeepPartial<T> = { [K in keyof T]?: (T[K] extends string ? string : DeepPartial<T[K]>) | undefined };

/** What `setThemeTexts` accepts: any part of the catalogue, and the `lang` (BCP 47) of a bundle. */
export type ThemeTextsInput = DeepPartial<ThemeTexts> & { lang?: string | undefined };

/** The shared store of the theme texts: the store of the strings (same rules), typed for this catalogue. */
export type ThemeTextsStore = StringsStore<ThemeTextsInput>;

/** The built-in English texts: the defaults. */
export const themeTextsEn: ThemeTextsBundle = { lang: 'en', ...catalogue };

/** The ids of all sets, in calendar order from winter to Christmas (Advent sits on top of Christmas). */
export const THEME_TEXT_SETS: readonly ThemeTextSet[] = Object.keys(catalogue) as ThemeTextSet[];

/* ───────────────────────────── shared store ───────────────────────────── */

const KEY = Symbol.for('kern.themeTexts');
let own: ThemeTextsStore | undefined;

/** A new, independent store, e.g. for tests. */
export function createThemeTextsStore(): ThemeTextsStore {
	return createStringsStore<ThemeTextsInput>();
}

/**
 * The page-wide store. The first kern copy to load puts it on `globalThis[Symbol.for('kern.themeTexts')]`
 * and every copy uses the same one. A store of another shape stays untouched; this copy then keeps its own.
 */
export function sharedThemeTextsStore(): ThemeTextsStore {
	if (own) return own;
	const g = globalThis as typeof globalThis & { [KEY]?: unknown };
	const existing = g[KEY];
	if (isStringsStore(existing)) return (own = existing as ThemeTextsStore);
	own = createThemeTextsStore();
	if (existing === undefined) g[KEY] = own;
	return own;
}

/** The catalogue for the store's current choice: English with the chosen texts on top. */
export function resolveThemeTexts(store: ThemeTextsStore = sharedThemeTextsStore()): ThemeTexts {
	const { lang: _lang, ...base } = themeTextsEn;
	return resolveInto(base, store.overrides);
}

/* ───────────────────────────── public API ───────────────────────────── */

/**
 * Sets the theme texts, in every build on the page. Pass a bundle (`deThemeTexts`), a part of the
 * catalogue (`{ pride: { second: 'Hello' } }`), or several: later ones win. The call replaces the
 * earlier choice; `setThemeTexts()` without arguments goes back to English. The language of the
 * components' texts is separate (`setStrings`): switch both. Call it before the first render, or at
 * any time to switch language: texts already on the page update.
 */
export function setThemeTexts(...inputs: readonly ThemeTextsInput[]): void {
	if (inputs.length === 0) sharedThemeTextsStore().reset();
	else sharedThemeTextsStore().set(inputs);
}

/** Back to the built-in English texts. */
export function resetThemeTexts(): void {
	sharedThemeTextsStore().reset();
}

/** The theme texts in use: English with the chosen texts on top. */
export function getThemeTexts(): ThemeTexts {
	return resolveThemeTexts();
}

/** The BCP 47 tag of the chosen bundle, or `undefined` when none was chosen. */
export function getThemeTextsLang(): string | undefined {
	return sharedThemeTextsStore().lang;
}

/** Makes a bundle available under a language tag, for `setThemeTextsLocale`. */
export function registerThemeTexts(lang: string, bundle: ThemeTextsInput): void {
	sharedThemeTextsStore().register(lang, bundle);
}

/**
 * Selects the bundle registered for `lang` (`de-AT` finds `de`). Without a bundle the texts stay
 * English and the result is `false`. `undefined` or an empty tag goes back to the defaults.
 */
export function setThemeTextsLocale(lang: string | undefined): boolean {
	const store = sharedThemeTextsStore();
	const tag = lang?.trim();
	if (!tag) {
		store.reset();
		return false;
	}
	const bundle = store.bundle(tag);
	store.set(bundle ? [bundle, { lang: tag }] : [{ lang: tag }]);
	return bundle !== undefined;
}

/** Replaces the `{name}` placeholders of a theme text (`advent.second`); unknown placeholders stay as they are. */
export function fillThemeText(text: string, values: Readonly<Record<string, string | number>>): string {
	return fill(text, values);
}
