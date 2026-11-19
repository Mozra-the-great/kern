// window.kern: the toast, announcer, strings and accent API for pages without a bundler. Installed by the
// all-in-one bundle and by the entry points of the toaster, the live announcer, the strings and the accent
// (`@mozra-the-great/kern/elements/toaster`, `…/live-announcer`, `…/strings`, `…/accent`). An explicit call, not a
// module side effect: package.json "sideEffects" lets the bundler drop side-effect-only code.
import { announce } from '../lib/components/announcer.js';
import { toast, dismissToast } from '../lib/components/toast.svelte.js';
import { de } from '../lib/components/strings-de.js';
import { en, followLang, getLang, getStrings, registerStrings, resetStrings, setLocale, setStrings } from '../lib/components/strings.js';
import {
	ACCENT_GROUNDS,
	ACCENT_TOKENS,
	accentCss,
	accentTokens,
	applyAccent,
	clearAccent,
	createAccentScript,
	installAccent,
	removeAccent
} from '../lib/components/accent.js';
import type { KernAccentApi, KernGlobal, KernStringsApi } from './types.js';

declare global {
	interface Window {
		kern?: KernGlobal;
	}
}

function stringsApi(): KernStringsApi {
	return {
		set: setStrings,
		reset: resetStrings,
		get: getStrings,
		register: registerStrings,
		setLocale,
		followLang,
		get lang() {
			return getLang();
		},
		en,
		de
	};
}

function accentApi(): KernAccentApi {
	return {
		tokens: accentTokens,
		css: accentCss,
		install: installAccent,
		remove: removeAccent,
		apply: applyAccent,
		clear: clearAccent,
		script: createAccentScript,
		grounds: ACCENT_GROUNDS,
		tokenNames: ACCENT_TOKENS
	};
}

/** Makes `setLocale('en')` and `setLocale('de')` (and `followLang()` on such a page) find the built-in bundles. */
export function registerLocales(): void {
	registerStrings('en', en);
	registerStrings('de', de);
}

export function installGlobal(): void {
	if (typeof window === 'undefined') return;
	const api: KernGlobal = { toast, dismissToast, announce, strings: stringsApi(), accent: accentApi() };
	const existing = window.kern;
	if (!existing) window.kern = api;
	else {
		// A copy that loaded first may predate the announcer and the strings: add what is missing.
		existing.announce ??= api.announce;
		existing.strings ??= api.strings;
		existing.accent ??= api.accent;
	}
}

export {
	accentTokens,
	accentCss,
	installAccent,
	removeAccent,
	applyAccent,
	clearAccent,
	createAccentScript,
	toast,
	dismissToast,
	announce,
	setStrings,
	resetStrings,
	getStrings,
	getLang,
	registerStrings,
	setLocale,
	followLang,
	en,
	de
};
